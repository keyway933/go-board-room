const WAIT_TTL_MS = 3 * 60 * 1000;
const POLL_MS = 1200;
const MAX_BODY_BYTES = 32_000;

const ALLOWED_ORIGINS = new Set([
  "https://keyway933.github.io",
  "http://127.0.0.1:8775",
  "http://localhost:8775",
  "null",
]);

function originAllowed(origin) {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  return /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
}

function corsHeaders(request, extra = {}) {
  const origin = request.headers.get("Origin") || "";
  const allowOrigin = originAllowed(origin) ? (origin || "https://keyway933.github.io") : "https://keyway933.github.io";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
    "Cache-Control": "no-store",
    ...extra,
  };
}

function jsonResponse(request, status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders(request, { "Content-Type": "application/json; charset=utf-8" }),
  });
}

function optionsResponse(request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

async function readJson(request) {
  const length = Number(request.headers.get("Content-Length") || 0);
  if (length > MAX_BODY_BYTES) throw new Error("body too large");
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) throw new Error("body too large");
  if (!text) return {};
  return JSON.parse(text);
}

function normalizeSettings(input = {}) {
  const board = ["standard", "six", "torus"].includes(input.board) ? input.board : "standard";
  const size = ["9", "13", "15", "19"].includes(String(input.size)) ? String(input.size) : "19";
  const assist = input.assist === "on" ? "on" : "off";
  const rank = ["beginner", "casual", "steady"].includes(input.rank) ? input.rank : "beginner";
  return { board, size, assist, rank };
}

function keyFor(settings) {
  return `${settings.board}:${settings.size}:${settings.assist}:${settings.rank}`;
}

function randomHex(bytes) {
  const values = new Uint8Array(bytes);
  crypto.getRandomValues(values);
  return [...values].map((value) => value.toString(16).padStart(2, "0")).join("");
}

function makeId(prefix) {
  return `${prefix}-${randomHex(6)}`;
}

function makeRoomCode() {
  return randomHex(4).toUpperCase();
}

function publicTicket(ticket) {
  return {
    status: ticket.status,
    ticketId: ticket.id,
    role: ticket.role,
    room: ticket.room,
    settings: ticket.settings,
    pollAfterMs: POLL_MS,
  };
}

export class Matchmaker {
  constructor(state) {
    this.state = state;
    this.tickets = null;
    this.waitingByKey = null;
  }

  async load() {
    if (this.tickets && this.waitingByKey) return;
    const stored = await this.state.storage.get(["tickets", "waitingByKey"]);
    this.tickets = new Map(stored.get("tickets") || []);
    this.waitingByKey = new Map(stored.get("waitingByKey") || []);
  }

  async save() {
    await this.state.storage.put({
      tickets: [...this.tickets.entries()],
      waitingByKey: [...this.waitingByKey.entries()],
    });
  }

  cleanOldTickets() {
    const now = Date.now();
    for (const [id, ticket] of this.tickets) {
      if (now - ticket.updatedAt <= WAIT_TTL_MS) continue;
      this.tickets.delete(id);
      if (this.waitingByKey.get(ticket.key) === id) this.waitingByKey.delete(ticket.key);
    }
  }

  async handleMatch(request) {
    const body = await readJson(request);
    const playerId = String(body.playerId || makeId("player")).slice(0, 80);
    const settings = normalizeSettings(body.settings);
    const key = keyFor(settings);
    const now = Date.now();
    this.cleanOldTickets();

    const existingId = this.waitingByKey.get(key);
    const existing = existingId ? this.tickets.get(existingId) : null;
    if (existing && existing.playerId !== playerId && existing.status === "waiting") {
      existing.status = "matched";
      existing.updatedAt = now;
      this.waitingByKey.delete(key);
      const guest = {
        id: makeId("ticket"),
        playerId,
        key,
        settings,
        status: "matched",
        role: "guest",
        room: existing.room,
        createdAt: now,
        updatedAt: now,
      };
      this.tickets.set(guest.id, guest);
      await this.save();
      return jsonResponse(request, 200, publicTicket(guest));
    }

    if (existing && existing.playerId === playerId) {
      existing.updatedAt = now;
      await this.save();
      return jsonResponse(request, 200, publicTicket(existing));
    }

    const ticket = {
      id: makeId("ticket"),
      playerId,
      key,
      settings,
      status: "waiting",
      role: "host",
      room: makeRoomCode(),
      createdAt: now,
      updatedAt: now,
    };
    this.tickets.set(ticket.id, ticket);
    this.waitingByKey.set(key, ticket.id);
    await this.save();
    return jsonResponse(request, 200, publicTicket(ticket));
  }

  async handleStatus(request, ticketId) {
    this.cleanOldTickets();
    const ticket = this.tickets.get(ticketId);
    if (!ticket) {
      await this.save();
      return jsonResponse(request, 404, { status: "expired", message: "ticket expired" });
    }
    ticket.updatedAt = Date.now();
    await this.save();
    return jsonResponse(request, 200, publicTicket(ticket));
  }

  async handleCancel(request) {
    const body = await readJson(request);
    const ticketId = String(body.ticketId || "");
    const ticket = this.tickets.get(ticketId);
    if (ticket) {
      this.tickets.delete(ticketId);
      if (this.waitingByKey.get(ticket.key) === ticketId) this.waitingByKey.delete(ticket.key);
      await this.save();
    }
    return jsonResponse(request, 200, { ok: true });
  }

  async fetch(request) {
    await this.load();
    if (request.method === "OPTIONS") return optionsResponse(request);
    try {
      const url = new URL(request.url);
      if (request.method === "GET" && url.pathname === "/health") {
        this.cleanOldTickets();
        await this.save();
        return jsonResponse(request, 200, {
          ok: true,
          waiting: this.waitingByKey.size,
          tickets: this.tickets.size,
        });
      }
      if (request.method === "POST" && url.pathname === "/api/match") return await this.handleMatch(request);
      if (request.method === "POST" && url.pathname === "/api/cancel") return await this.handleCancel(request);
      const statusMatch = url.pathname.match(/^\/api\/status\/([^/]+)$/);
      if (request.method === "GET" && statusMatch) return await this.handleStatus(request, statusMatch[1]);
      return jsonResponse(request, 404, { error: "not found" });
    } catch {
      return jsonResponse(request, 400, { error: "bad request" });
    }
  }
}

export default {
  async fetch(request, env) {
    if (!originAllowed(request.headers.get("Origin") || "")) {
      return jsonResponse(request, 403, { error: "forbidden origin" });
    }
    const id = env.MATCHMAKER.idFromName("go-board-room-lobby");
    return env.MATCHMAKER.get(id).fetch(request);
  },
};
