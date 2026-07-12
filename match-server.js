const http = require("http");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 8787);
const WAIT_TTL_MS = 3 * 60 * 1000;
const POLL_MS = 1200;

const tickets = new Map();
const waitingByKey = new Map();

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Private-Network": "true",
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 32_000) {
        reject(new Error("body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function cleanOldTickets() {
  const now = Date.now();
  for (const [id, ticket] of tickets) {
    if (now - ticket.updatedAt <= WAIT_TTL_MS) continue;
    tickets.delete(id);
    if (waitingByKey.get(ticket.key) === id) waitingByKey.delete(ticket.key);
  }
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

function makeId(prefix) {
  return `${prefix}-${crypto.randomBytes(6).toString("hex")}`;
}

function makeRoomCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
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

async function handleMatch(req, res) {
  const body = await readJson(req);
  const playerId = String(body.playerId || makeId("player")).slice(0, 80);
  const settings = normalizeSettings(body.settings);
  const key = keyFor(settings);
  const now = Date.now();
  cleanOldTickets();

  const existingId = waitingByKey.get(key);
  const existing = existingId ? tickets.get(existingId) : null;
  if (existing && existing.playerId !== playerId && existing.status === "waiting") {
    existing.status = "matched";
    existing.updatedAt = now;
    waitingByKey.delete(key);
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
    tickets.set(guest.id, guest);
    return sendJson(res, 200, publicTicket(guest));
  }

  if (existing && existing.playerId === playerId) {
    existing.updatedAt = now;
    return sendJson(res, 200, publicTicket(existing));
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
  tickets.set(ticket.id, ticket);
  waitingByKey.set(key, ticket.id);
  sendJson(res, 200, publicTicket(ticket));
}

function handleStatus(req, res, ticketId) {
  cleanOldTickets();
  const ticket = tickets.get(ticketId);
  if (!ticket) return sendJson(res, 404, { status: "expired", message: "ticket expired" });
  ticket.updatedAt = Date.now();
  sendJson(res, 200, publicTicket(ticket));
}

async function handleCancel(req, res) {
  const body = await readJson(req);
  const ticketId = String(body.ticketId || "");
  const ticket = tickets.get(ticketId);
  if (ticket) {
    tickets.delete(ticketId);
    if (waitingByKey.get(ticket.key) === ticketId) waitingByKey.delete(ticket.key);
  }
  sendJson(res, 200, { ok: true });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return sendJson(res, 204, {});
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    if (req.method === "GET" && url.pathname === "/health") {
      return sendJson(res, 200, { ok: true, waiting: waitingByKey.size, tickets: tickets.size });
    }
    if (req.method === "POST" && url.pathname === "/api/match") return await handleMatch(req, res);
    if (req.method === "POST" && url.pathname === "/api/cancel") return await handleCancel(req, res);
    const statusMatch = url.pathname.match(/^\/api\/status\/([^/]+)$/);
    if (req.method === "GET" && statusMatch) return handleStatus(req, res, statusMatch[1]);
    sendJson(res, 404, { error: "not found" });
  } catch (error) {
    sendJson(res, 400, { error: error.message || "bad request" });
  }
});

server.listen(PORT, () => {
  console.log(`Go Board Room matchmaking server listening on http://127.0.0.1:${PORT}`);
});