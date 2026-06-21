const canvas = document.querySelector("#goBoard");
const ctx = canvas.getContext("2d");
const appTitle = document.querySelector("#appTitle");
const statusText = document.querySelector("#statusText");
const turnText = document.querySelector("#turnText");
const turnCard = document.querySelector("#turnCard");
const blackCapturesEl = document.querySelector("#blackCaptures");
const whiteCapturesEl = document.querySelector("#whiteCaptures");
const blackAreaEl = document.querySelector("#blackArea");
const whiteAreaEl = document.querySelector("#whiteArea");
const blackBreakdownEl = document.querySelector("#blackBreakdown");
const whiteBreakdownEl = document.querySelector("#whiteBreakdown");
const blackWinrateText = document.querySelector("#blackWinrateText");
const whiteWinrateText = document.querySelector("#whiteWinrateText");
const blackWinrateBar = document.querySelector("#blackWinrateBar");
const winratePreviewBar = document.querySelector("#winratePreviewBar");
const winnerText = document.querySelector("#winnerText");
const marginText = document.querySelector("#marginText");
const scoreIntro = document.querySelector("#scoreIntro");
const rowBreakdown = document.querySelector("#rowBreakdown");
const moveLog = document.querySelector("#moveLog");
const gameHistoryList = document.querySelector("#gameHistoryList");
const gameHistoryEmpty = document.querySelector("#gameHistoryEmpty");
const gameHistoryActions = document.querySelector("#gameHistoryActions");
const sizeButtons = document.querySelector("#sizeButtons");
const rulesText = document.querySelector("#rulesText");
const deadModeBtn = document.querySelector("#deadModeBtn");
const scoreBtn = document.querySelector("#scoreBtn");
const ownershipModeBtn = document.querySelector("#ownershipModeBtn");
const moveNumberToggle = document.querySelector("#moveNumberToggle");
const aiStrengthPanel = document.querySelector("#aiStrengthPanel");
const startScreen = document.querySelector("#startScreen");
const gameShell = document.querySelector("#gameShell");
const traditionalModeBtn = document.querySelector("#traditionalModeBtn");
const aiModeBtn = document.querySelector("#aiModeBtn");
const onlineModeBtn = document.querySelector("#onlineModeBtn");
const onlineAiHintModeBtn = document.querySelector("#onlineAiHintModeBtn");
const backMenuBtn = document.querySelector("#backMenuBtn");
const confirmDialog = document.querySelector("#confirmDialog");
const confirmDialogTitle = document.querySelector("#confirmDialogTitle");
const confirmDialogMessage = document.querySelector("#confirmDialogMessage");
const cancelDialogBtn = document.querySelector("#cancelDialogBtn");
const confirmDialogBtn = document.querySelector("#confirmDialogBtn");

const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;
const NEUTRAL = 3;
const KOMI = 7.5;
const GAME_HISTORY_KEY = "go-board-room-finished-games";
const GAME_HISTORY_LIMIT = 60;
const GAME_HISTORY_COLLAPSED_COUNT = 6;
const LETTERS = "ABCDEFGHJKLMNOPQRST";
const BOPOMOFO = ["ㄅ", "ㄆ", "ㄇ", "ㄈ", "ㄉ", "ㄊ", "ㄋ", "ㄌ", "ㄍ", "ㄎ", "ㄏ", "ㄐ", "ㄑ", "ㄒ", "ㄓ", "ㄔ", "ㄕ", "ㄖ", "ㄗ"];

const DIRS = {
  square: [[1, 0], [-1, 0], [0, 1], [0, -1]],
  torus: [[1, 0], [-1, 0], [0, 1], [0, -1]],
  hex: [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]],
};

let mode = "square";
let size = 19;
let points = [];
let board = {};
let deadMap = {};
let moveNumbers = {};
let turn = BLACK;
let captures = { [BLACK]: 0, [WHITE]: 0 };
let history = [];
let log = [];
let moveCounter = 0;
let lastMoveKey = null;
let showAllMoveNumbers = false;
let previousBoardKey = null;
let passCount = 0;
let gameOver = false;
let deadStoneMode = false;
let ownershipMode = false;
let scoreState = null;
let scoreVisible = false;
let layout = null;
let torusView = { u: 0, v: 0 };
let torusDrag = null;
let suppressNextClick = false;
let pendingMoveKey = null;
let playMode = "traditional";
let aiThinking = false;
let pendingConfirmAction = null;
let aiStrength = "20k";
let currentFinishedGameId = null;
let isGameHistoryExpanded = false;

const AI_STRENGTHS = {
  "30k": { label: "30級", candidateCount: 14, randomness: 18, depthBonus: 0.55 },
  "20k": { label: "20級", candidateCount: 7, randomness: 5, depthBonus: 1 },
  "10k": { label: "10級", candidateCount: 2, randomness: 0.5, depthBonus: 1.45 },
  "1d": { label: "1段", candidateCount: 1, randomness: 0, depthBonus: 2 },
};

function colorName(color) {
  return color === BLACK ? "黑棋" : "白棋";
}

function opponent(color) {
  return color === BLACK ? WHITE : BLACK;
}

function startGame(nextPlayMode) {
  playMode = nextPlayMode;
  aiThinking = false;
  startScreen.classList.add("is-hidden");
  gameShell.classList.remove("is-hidden");
  resetGame("square", 19);
  setStatus(playMode === "ai" ? "AI 對弈：你執黑先下。" : "傳統下棋：黑棋先下。");
  render();
}

function showMainMenu() {
  aiThinking = false;
  gameShell.classList.add("is-hidden");
  startScreen.classList.remove("is-hidden");
}

function hasStartedGame() {
  return moveCounter > 0 || log.length > 0;
}

function requestMainMenu() {
  if (hasStartedGame() && !window.confirm("棋局已開始，確定離開嗎？")) return;
  showMainMenu();
}

function keyOf(a, b) {
  return `${a},${b}`;
}

function parseKey(key) {
  const [a, b] = key.split(",").map(Number);
  return { a, b };
}

function cloneCells(source) {
  return { ...source };
}

function setupBoard(nextMode = mode, nextSize = size) {
  mode = nextMode;
  size = nextSize;
  points = [];
  board = {};
  deadMap = {};

  if (mode === "square" || mode === "torus") {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        addPoint(x, y);
      }
    }
  } else {
    const radius = Math.floor(size / 2);
    for (let q = -radius; q <= radius; q++) {
      for (let r = -radius; r <= radius; r++) {
        const s = -q - r;
        if (Math.max(Math.abs(q), Math.abs(r), Math.abs(s)) <= radius) addPoint(q, r);
      }
    }
  }
}

function addPoint(a, b) {
  const key = keyOf(a, b);
  points.push({ a, b, key });
  board[key] = EMPTY;
  deadMap[key] = EMPTY;
}

function hasPoint(key) {
  return Object.hasOwn(board, key);
}

function neighborsOfKey(key) {
  const { a, b } = parseKey(key);
  if (mode === "torus") {
    return DIRS.torus.map(([da, db]) => keyOf(wrap(a + da, size), wrap(b + db, size)));
  }
  return DIRS[mode]
    .map(([da, db]) => keyOf(a + da, b + db))
    .filter(hasPoint);
}

function wrap(value, modulo) {
  return ((value % modulo) + modulo) % modulo;
}

function boardKey(source = board) {
  return points.map((point) => source[point.key] || EMPTY).join("");
}

function getGroup(source, startKey) {
  const color = source[startKey];
  const stones = [];
  const liberties = new Set();
  const seen = new Set([startKey]);
  const queue = [startKey];

  while (queue.length) {
    const key = queue.shift();
    stones.push(key);
    for (const nextKey of neighborsOfKey(key)) {
      if (source[nextKey] === EMPTY) {
        liberties.add(nextKey);
      } else if (source[nextKey] === color && !seen.has(nextKey)) {
        seen.add(nextKey);
        queue.push(nextKey);
      }
    }
  }

  return { stones, liberties };
}

function cloneScoreState(state) {
  if (!state) return null;
  return {
    ...state,
    stones: { ...state.stones },
    territory: { ...state.territory },
    territoryMap: cloneCells(state.territoryMap),
    deadMap: cloneCells(state.deadMap),
    rows: state.rows.map((row) => ({ ...row })),
  };
}

function loadGameHistoryRecords() {
  try {
    const records = JSON.parse(localStorage.getItem(GAME_HISTORY_KEY) || "[]");
    return Array.isArray(records) ? records : [];
  } catch {
    return [];
  }
}

function saveGameHistoryRecords(records) {
  try {
    localStorage.setItem(GAME_HISTORY_KEY, JSON.stringify(records.slice(0, GAME_HISTORY_LIMIT)));
  } catch {
    setStatus("這個瀏覽器暫時不能保存歷史棋局。");
  }
}

function modeLabel(recordMode) {
  if (recordMode === "hex") return "六氣棋盤";
  if (recordMode === "torus") return "甜甜圈棋盤";
  return "標準圍棋";
}

function defaultHistoryTitle(record) {
  return `${modeLabel(record.mode)} ${record.size} 路`;
}

function renameHistoryRecord(id, nextName) {
  const records = loadGameHistoryRecords();
  const record = records.find((item) => item.id === id);
  if (!record) return "";
  const fallback = defaultHistoryTitle(record);
  record.name = (nextName.trim() || fallback).slice(0, 40);
  saveGameHistoryRecords(records);
  return record.name;
}

function compactCells(source) {
  const cells = {};
  for (const point of points) {
    if (source[point.key]) cells[point.key] = source[point.key];
  }
  return cells;
}

function saveFinishedGame() {
  if (!scoreState || moveCounter === 0) return;
  if (!currentFinishedGameId) currentFinishedGameId = `game-${Date.now()}`;
  const records = loadGameHistoryRecords();
  const existingRecord = records.find((item) => item.id === currentFinishedGameId);

  const record = {
    id: currentFinishedGameId,
    name: existingRecord?.name || defaultHistoryTitle({ mode, size }),
    finishedAt: new Date().toISOString(),
    mode,
    size,
    playMode,
    moves: moveCounter,
    turn,
    board: compactCells(board),
    deadMap: compactCells(deadMap),
    moveNumbers: cloneCells(moveNumbers),
    points: points.map((point) => ({ ...point })),
    captures: { ...captures },
    log: log.slice(),
    previousBoardKey,
    passCount,
    lastMoveKey,
    score: {
      blackTotal: scoreState.blackTotal,
      whiteTotal: scoreState.whiteTotal,
      whiteWithKomi: scoreState.whiteWithKomi,
      winner: scoreState.winner,
      margin: scoreState.margin,
    },
  };

  const existingIndex = records.findIndex((item) => item.id === record.id);
  if (existingIndex >= 0) records.splice(existingIndex, 1);
  records.unshift(record);
  saveGameHistoryRecords(records);
}

function formatHistoryTime(value) {
  return new Date(value).toLocaleString("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function drawHistoryStone(context, x, y, radius, color, moveNumber = null) {
  const gradient = context.createRadialGradient(x - radius * 0.32, y - radius * 0.38, radius * 0.15, x, y, radius);
  if (color === BLACK) {
    gradient.addColorStop(0, "#4b4f56");
    gradient.addColorStop(0.45, "#171a1f");
    gradient.addColorStop(1, "#020304");
  } else {
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.55, "#f3f6f8");
    gradient.addColorStop(1, "#c8d0d8");
  }
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();

  if (moveNumber) {
    context.fillStyle = color === BLACK ? "#f8fafc" : "#20242a";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = `800 ${moveNumber >= 100 ? radius * 0.58 : radius * 0.74}px Segoe UI, sans-serif`;
    context.fillText(String(moveNumber), x, y + radius * 0.03);
  }
}

function drawHistoryPreview(canvas, record) {
  const context = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#d8a14a";
  context.fillRect(0, 0, width, height);
  context.strokeStyle = "rgba(74, 47, 18, 0.72)";
  context.lineWidth = 1.4;

  if (record.mode === "hex") {
    drawHexHistoryPreview(context, record, width, height);
    return;
  }

  const pad = 20;
  const boardSize = Math.min(width, height) - pad * 2;
  const gap = boardSize / Math.max(1, record.size - 1);
  for (let i = 0; i < record.size; i++) {
    const pos = pad + i * gap;
    context.beginPath();
    context.moveTo(pad, pos);
    context.lineTo(pad + boardSize, pos);
    context.moveTo(pos, pad);
    context.lineTo(pos, pad + boardSize);
    context.stroke();
  }

  const stoneRadius = Math.max(2, gap * 0.42);
  for (const point of record.points) {
    const color = record.board[point.key];
    if (!color) continue;
    drawHistoryStone(context, pad + point.a * gap, pad + point.b * gap, stoneRadius, color, record.moveNumbers?.[point.key]);
  }
}

function drawHexHistoryPreview(context, record, width, height) {
  const coords = record.points.map((point) => ({
    ...point,
    x: point.a + point.b * 0.5,
    y: point.b * 0.88,
  }));
  const minX = Math.min(...coords.map((point) => point.x));
  const maxX = Math.max(...coords.map((point) => point.x));
  const minY = Math.min(...coords.map((point) => point.y));
  const maxY = Math.max(...coords.map((point) => point.y));
  const pad = 20;
  const scale = Math.min((width - pad * 2) / Math.max(1, maxX - minX), (height - pad * 2) / Math.max(1, maxY - minY));
  const offsetX = (width - (maxX - minX) * scale) / 2;
  const offsetY = (height - (maxY - minY) * scale) / 2;
  const radius = Math.max(2, scale * 0.34);

  for (const point of coords) {
    const x = offsetX + (point.x - minX) * scale;
    const y = offsetY + (point.y - minY) * scale;
    context.fillStyle = "rgba(74, 47, 18, 0.28)";
    context.beginPath();
    context.arc(x, y, 1.7, 0, Math.PI * 2);
    context.fill();
    const color = record.board[point.key];
    if (color) drawHistoryStone(context, x, y, radius, color, record.moveNumbers?.[point.key]);
  }
}

function inferTurnFromRecord(record) {
  return (record.moves || 0) % 2 === 0 ? BLACK : WHITE;
}

function maxStoredMoveNumber(record) {
  return Math.max(0, ...Object.values(record.moveNumbers || {}).map((value) => Number(value) || 0));
}

function loadHistoryRecord(record) {
  clearPendingMove();
  hideConfirmDialog();
  aiThinking = false;
  startScreen.classList.add("is-hidden");
  gameShell.classList.remove("is-hidden");

  setupBoard(record.mode || "square", record.size || 9);
  board = { ...board, ...(record.board || {}) };
  deadMap = { ...deadMap, ...(record.deadMap || {}) };
  moveNumbers = cloneCells(record.moveNumbers || {});
  moveCounter = record.moves || maxStoredMoveNumber(record);
  lastMoveKey = record.lastMoveKey || null;
  currentFinishedGameId = record.id;
  previousBoardKey = record.previousBoardKey || null;
  passCount = record.passCount || 0;
  captures = { [BLACK]: record.captures?.[BLACK] || 0, [WHITE]: record.captures?.[WHITE] || 0 };
  history = [];
  log = Array.isArray(record.log) ? record.log.slice() : [`已載入 ${record.name || defaultHistoryTitle(record)}`];
  turn = record.turn || inferTurnFromRecord(record);
  playMode = record.playMode || "traditional";
  gameOver = false;
  deadStoneMode = false;
  ownershipMode = false;
  scoreState = null;
  scoreVisible = false;
  setStatus(`已載入「${record.name || defaultHistoryTitle(record)}」，輪到 ${colorName(turn)}。`);
  render();
  scheduleAiMove();
}

function createHistoryToggleButton(hiddenCount) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "history-toggle";
  const isExpanded = isGameHistoryExpanded;
  button.innerHTML = `
    <span class="history-toggle-icon" aria-hidden="true">${isExpanded ? "⌃" : "⌄"}</span>
    <span>${isExpanded ? "顯示較少" : "顯示更多"}</span>
    <small>${isExpanded ? "收起到最新 6 盤" : `還有 ${hiddenCount} 盤`}</small>
  `;
  button.addEventListener("click", () => {
    isGameHistoryExpanded = !isGameHistoryExpanded;
    renderGameHistory();
  });
  return button;
}

function renderGameHistory() {
  if (!gameHistoryList || !gameHistoryEmpty) return;
  const records = loadGameHistoryRecords();
  const shouldCollapse = !isGameHistoryExpanded && records.length > GAME_HISTORY_COLLAPSED_COUNT;
  const visibleRecords = shouldCollapse ? records.slice(0, GAME_HISTORY_COLLAPSED_COUNT) : records;
  gameHistoryList.innerHTML = "";
  if (gameHistoryActions) gameHistoryActions.innerHTML = "";
  gameHistoryList.classList.toggle("is-scrollable", isGameHistoryExpanded && records.length > 9);
  gameHistoryEmpty.classList.toggle("is-hidden", records.length > 0);

  for (const record of visibleRecords) {
    const card = document.createElement("article");
    card.className = "history-card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `載入 ${record.name || defaultHistoryTitle(record)}`);
    card.addEventListener("click", (event) => {
      if (event.target.closest(".history-title-input")) return;
      loadHistoryRecord(record);
    });
    card.addEventListener("keydown", (event) => {
      if (event.target.closest(".history-title-input")) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        loadHistoryRecord(record);
      }
    });
    const canvas = document.createElement("canvas");
    canvas.width = 220;
    canvas.height = 220;
    const title = document.createElement("input");
    title.className = "history-title-input";
    title.type = "text";
    title.value = record.name || defaultHistoryTitle(record);
    title.setAttribute("aria-label", "棋局名稱");
    title.addEventListener("blur", () => {
      title.value = renameHistoryRecord(record.id, title.value);
    });
    title.addEventListener("keydown", (event) => {
      if (event.key === "Enter") title.blur();
    });
    const detail = document.createElement("p");
    detail.textContent = `${formatHistoryTime(record.finishedAt)} · ${record.moves} 手 · ${colorName(record.score.winner)}勝 ${record.score.margin.toFixed(1)} 點`;
    card.append(canvas, title, detail);
    gameHistoryList.append(card);
    drawHistoryPreview(canvas, record);
  }

  if (gameHistoryActions && records.length > GAME_HISTORY_COLLAPSED_COUNT) {
    gameHistoryActions.append(createHistoryToggleButton(records.length - GAME_HISTORY_COLLAPSED_COUNT));
  }
}

function pushHistory() {
  history.push({
    mode,
    size,
    board: cloneCells(board),
    deadMap: cloneCells(deadMap),
    moveNumbers: cloneCells(moveNumbers),
    turn,
    captures: { ...captures },
    log: log.slice(),
    moveCounter,
    lastMoveKey,
    previousBoardKey,
    passCount,
    gameOver,
    deadStoneMode,
    ownershipMode,
    scoreState: cloneScoreState(scoreState),
    scoreVisible,
  });
}

function restore(state) {
  setupBoard(state.mode, state.size);
  board = cloneCells(state.board);
  deadMap = cloneCells(state.deadMap);
  moveNumbers = cloneCells(state.moveNumbers || {});
  turn = state.turn;
  captures = { ...state.captures };
  log = state.log.slice();
  moveCounter = state.moveCounter || 0;
  lastMoveKey = state.lastMoveKey || null;
  previousBoardKey = state.previousBoardKey;
  passCount = state.passCount;
  gameOver = state.gameOver;
  deadStoneMode = state.deadStoneMode;
  ownershipMode = state.ownershipMode;
  scoreState = cloneScoreState(state.scoreState);
  scoreVisible = Boolean(state.scoreVisible);
  render();
}

function clearPendingMove() {
  pendingMoveKey = null;
}

function setPendingMove(key) {
  pendingMoveKey = key;
  setStatus(`預覽 ${colorName(turn)} ${labelOfKey(key)}，再點一次確認落子。`);
  render();
}

function simulateMove(source, key, color, checkKo = false) {
  if (source[key] !== EMPTY) return null;
  const next = cloneCells(source);
  next[key] = color;
  let capturedCount = 0;
  const enemy = opponent(color);
  const checked = new Set();

  for (const nextKey of neighborsOfKey(key)) {
    if (next[nextKey] !== enemy || checked.has(nextKey)) continue;
    const group = getGroup(next, nextKey);
    group.stones.forEach((stoneKey) => checked.add(stoneKey));
    if (group.liberties.size === 0) {
      capturedCount += group.stones.length;
      group.stones.forEach((stoneKey) => {
        next[stoneKey] = EMPTY;
      });
    }
  }

  const ownGroup = getGroup(next, key);
  if (ownGroup.liberties.size === 0) return null;
  if (checkKo && previousBoardKey && boardKey(next) === previousBoardKey) return null;
  return {
    key,
    capturedCount,
    liberties: ownGroup.liberties.size,
    groupSize: ownGroup.stones.length,
    next,
  };
}

function previewMove(key, color) {
  return simulateMove(board, key, color, true);
}

function summarizePosition(source) {
  const seen = new Set();
  const summary = {
    whiteStones: 0,
    blackStones: 0,
    whiteLiberties: 0,
    blackLiberties: 0,
    weakWhiteGroups: 0,
    weakWhiteStones: 0,
    weakBlackGroups: 0,
    weakBlackStones: 0,
    minWhiteLiberties: Infinity,
    minBlackLiberties: Infinity,
  };

  for (const point of points) {
    const color = source[point.key];
    if (color === EMPTY || seen.has(point.key)) continue;
    const group = getGroup(source, point.key);
    group.stones.forEach((stoneKey) => seen.add(stoneKey));

    if (color === WHITE) {
      summary.whiteStones += group.stones.length;
      summary.whiteLiberties += group.liberties.size;
      summary.minWhiteLiberties = Math.min(summary.minWhiteLiberties, group.liberties.size);
      if (group.liberties.size <= 2) {
        summary.weakWhiteGroups += 1;
        summary.weakWhiteStones += group.stones.length;
      }
    } else if (color === BLACK) {
      summary.blackStones += group.stones.length;
      summary.blackLiberties += group.liberties.size;
      summary.minBlackLiberties = Math.min(summary.minBlackLiberties, group.liberties.size);
      if (group.liberties.size <= 2) {
        summary.weakBlackGroups += 1;
        summary.weakBlackStones += group.stones.length;
      }
    }
  }

  if (summary.minWhiteLiberties === Infinity) summary.minWhiteLiberties = 0;
  if (summary.minBlackLiberties === Infinity) summary.minBlackLiberties = 0;

  return summary;
}

function strongestCaptureReply(source, color) {
  let best = { capturedCount: 0, liberties: 0, key: null };
  for (const point of points) {
    const reply = simulateMove(source, point.key, color);
    if (!reply) continue;
    if (
      reply.capturedCount > best.capturedCount
      || (reply.capturedCount === best.capturedCount && reply.liberties > best.liberties)
    ) {
      best = reply;
    }
  }
  return best;
}

function estimateAiMove(move) {
  const strength = AI_STRENGTHS[aiStrength];
  const { a, b } = parseKey(move.key);
  const before = summarizePosition(board);
  const summary = summarizePosition(move.next);
  const blackReply = strongestCaptureReply(move.next, BLACK);
  let friendlyNeighbors = 0;
  let enemyNeighbors = 0;

  for (const nextKey of neighborsOfKey(move.key)) {
    if (move.next[nextKey] === WHITE) friendlyNeighbors += 1;
    if (move.next[nextKey] === BLACK) enemyNeighbors += 1;
  }
  const selfEyePenalty = friendlyNeighbors >= 3 && enemyNeighbors === 0 && move.capturedCount === 0 ? 16 : 0;

  const center = mode === "square" || mode === "torus"
    ? (size - 1) / 2
    : 0;
  const centerDistance = mode === "square" || mode === "torus"
    ? Math.hypot(a - center, b - center)
    : Math.max(Math.abs(a), Math.abs(b), Math.abs(-a - b));
  const centerBonus = Math.max(0, size / 2 - centerDistance);

  const material = summary.whiteStones - summary.blackStones;
  const libertyBalance = (summary.whiteLiberties - summary.blackLiberties) / Math.max(1, points.length);
  const rescuedWhiteStones = Math.max(0, before.weakWhiteStones - summary.weakWhiteStones);
  const endangeredWhiteStones = summary.weakWhiteStones;
  const netCaptureSwing = move.capturedCount - blackReply.capturedCount;
  const rawScore =
    material * 1.8
    + move.capturedCount * 18 * strength.depthBonus
    + netCaptureSwing * 34 * strength.depthBonus
    + rescuedWhiteStones * 26 * strength.depthBonus
    + move.liberties * 2.4 * strength.depthBonus
    + friendlyNeighbors * 3.2 * strength.depthBonus
    + enemyNeighbors * 1.1
    + summary.weakBlackStones * 4.2 * strength.depthBonus
    - endangeredWhiteStones * 18 * strength.depthBonus
    - blackReply.capturedCount * 55 * strength.depthBonus
    - (move.liberties === 1 ? 78 : move.liberties === 2 ? 24 : 0) * strength.depthBonus
    - selfEyePenalty * strength.depthBonus
    + centerBonus * 0.45
    + libertyBalance * 8;

  const winRate = 1 / (1 + Math.exp(-rawScore / 16));
  return {
    ...move,
    blackReplyCapture: blackReply.capturedCount,
    rescuedWhiteStones,
    endangeredWhiteStones,
    rawScore,
    winRate: Math.round(winRate * 100),
  };
}

function estimatePositionWhiteWinRate(source = board, captureState = captures) {
  const summary = summarizePosition(source);
  const material = summary.whiteStones - summary.blackStones + (captureState[WHITE] - captureState[BLACK]);
  const libertyBalance = (summary.whiteLiberties - summary.blackLiberties) / Math.max(1, points.length);
  const weakGroupPressure = summary.weakBlackGroups * 1.8;
  const rawScore =
    material * 1.7
    + libertyBalance * 10
    + weakGroupPressure
    + KOMI * 0.22;
  return Math.round((1 / (1 + Math.exp(-rawScore / 16))) * 100);
}

function getPendingWinratePreview() {
  if (!pendingMoveKey || board[pendingMoveKey] !== EMPTY) return null;
  if (deadStoneMode || ownershipMode || gameOver) return null;
  if (playMode === "ai" && turn === WHITE) return null;
  return simulateMove(board, pendingMoveKey, turn, true);
}

function findAiMove() {
  const legalMoves = points
    .map((point) => previewMove(point.key, WHITE))
    .filter(Boolean);
  if (!legalMoves.length) return null;

  const ratedMoves = legalMoves.map(estimateAiMove);
  ratedMoves.sort((left, right) => right.winRate - left.winRate || right.rawScore - left.rawScore);
  const strength = AI_STRENGTHS[aiStrength];
  const hasWhiteDanger = summarizePosition(board).weakWhiteStones > 0;
  const rescueMoves = ratedMoves.filter((move) => move.rescuedWhiteStones > 0 && move.blackReplyCapture <= move.capturedCount + 1);
  const saferMoves = ratedMoves.filter((move) => move.blackReplyCapture <= Math.max(1, move.capturedCount));
  let movePool = ratedMoves;
  if ((aiStrength === "10k" || aiStrength === "1d") && hasWhiteDanger && rescueMoves.length) {
    movePool = rescueMoves;
  } else if ((aiStrength === "10k" || aiStrength === "1d") && saferMoves.length) {
    movePool = saferMoves;
  }
  const candidates = movePool.slice(0, Math.min(strength.candidateCount, movePool.length));
  if (strength.randomness === 0) return candidates[0];

  const noisyCandidates = candidates
    .map((move) => ({
      move,
      score: move.rawScore + (Math.random() - 0.5) * strength.randomness,
    }))
    .sort((left, right) => right.score - left.score);
  return noisyCandidates[0].move;
}

function scheduleAiMove() {
  if (playMode !== "ai" || aiThinking || gameOver || turn !== WHITE || deadStoneMode || ownershipMode) return;
  aiThinking = true;
  setStatus("AI 思考中...");
  window.setTimeout(() => {
    aiThinking = false;
    if (playMode !== "ai" || gameOver || turn !== WHITE) return;
    const aiMove = findAiMove();
    if (aiMove) {
      const label = labelOfKey(aiMove.key);
      tryPlay(aiMove.key, true);
      setStatus(`AI 下在 ${label}，估計勝率 ${aiMove.winRate}%。輪到黑棋。`);
    } else {
      aiPass();
    }
  }, 360);
}

function aiPass() {
  if (playMode !== "ai" || turn !== WHITE || gameOver) return;
  pushHistory();
  log.push("AI 白棋 Pass");
  passCount += 1;
  if (passCount >= 2) {
    gameOver = true;
    scoreState = calculateAreaScore();
    scoreVisible = true;
    setStatus("雙方 Pass，可看數子結果，也可以按數子判定後繼續下。");
  } else {
    turn = BLACK;
    setStatus("AI Pass，輪到黑棋。");
  }
  render();
}

function tryPlay(key, fromAi = false) {
  clearPendingMove();
  if (ownershipMode) return cycleOwnership(key);
  if (deadStoneMode) return removeDeadGroup(key);

  if (playMode === "ai" && turn === WHITE && !fromAi) {
    setStatus("AI 正在思考，請等白棋落子。");
    return;
  }

  if (gameOver) {
    setStatus("棋局已結束。可以新棋局，或用校正歸屬檢查終局。");
    return;
  }

  if (board[key] !== EMPTY) {
    setStatus("這裡已經有棋子了。");
    return;
  }

  const snapshotKey = boardKey();
  const next = cloneCells(board);
  const nextMoveNumbers = cloneCells(moveNumbers);
  next[key] = turn;

  let capturedCount = 0;
  const enemy = opponent(turn);
  const checked = new Set();

  for (const nextKey of neighborsOfKey(key)) {
    if (next[nextKey] !== enemy || checked.has(nextKey)) continue;
    const group = getGroup(next, nextKey);
    group.stones.forEach((stoneKey) => checked.add(stoneKey));
    if (group.liberties.size === 0) {
      capturedCount += group.stones.length;
      group.stones.forEach((stoneKey) => {
        next[stoneKey] = EMPTY;
        delete nextMoveNumbers[stoneKey];
      });
    }
  }

  if (getGroup(next, key).liberties.size === 0) {
    setStatus("這手沒有氣，不能自殺。");
    return;
  }

  if (previousBoardKey && boardKey(next) === previousBoardKey) {
    setStatus("這手違反劫，請先在別處下。");
    return;
  }

  pushHistory();
  board = next;
  moveCounter += 1;
  nextMoveNumbers[key] = moveCounter;
  moveNumbers = nextMoveNumbers;
  lastMoveKey = key;
  captures[turn] += capturedCount;
  log.push(`${colorName(turn)} ${labelOfKey(key)}${capturedCount ? `，提 ${capturedCount} 子` : ""}`);
  previousBoardKey = snapshotKey;
  turn = enemy;
  passCount = 0;
  scoreState = null;
  scoreVisible = false;
  setStatus(capturedCount ? `提掉 ${capturedCount} 子，輪到 ${colorName(turn)}。` : `輪到 ${colorName(turn)}。`);
  render();
  scheduleAiMove();
}

function removeDeadGroup(key) {
  if (board[key] === EMPTY) {
    setStatus("提死子模式：請點棋子，不是空點。");
    return;
  }
  pushHistory();
  const color = board[key];
  const group = getGroup(board, key);
  group.stones.forEach((stoneKey) => {
    board[stoneKey] = EMPTY;
    deadMap[stoneKey] = EMPTY;
    delete moveNumbers[stoneKey];
  });
  log.push(`終局提死子：移除 ${colorName(color)} ${group.stones.length} 子`);
  scoreState = calculateAreaScore();
  scoreVisible = true;
  setStatus(`已移除 ${colorName(color)} ${group.stones.length} 子，數子結果已更新。`);
  render();
}

function passTurn() {
  clearPendingMove();
  if (deadStoneMode || ownershipMode) {
    setStatus("請先離開校正或提死子模式，再 Pass。");
    return;
  }
  if (playMode === "ai" && turn === WHITE) {
    setStatus("AI 正在思考，請等白棋行動。");
    return;
  }
  if (gameOver) return;
  pushHistory();
  log.push(`${colorName(turn)} Pass`);
  passCount += 1;
  if (passCount >= 2) {
    gameOver = true;
    scoreState = calculateAreaScore();
    scoreVisible = true;
    setStatus("雙方連續 Pass。可提死子、校正歸屬或數子判定。");
  } else {
    turn = opponent(turn);
    setStatus(`${colorName(opponent(turn))} Pass，輪到 ${colorName(turn)}。`);
  }
  render();
  scheduleAiMove();
}

function undo() {
  clearPendingMove();
  const state = history.pop();
  if (!state) {
    setStatus("目前沒有可以悔的棋。");
    return;
  }
  restore(state);
  if (playMode === "ai" && turn === WHITE && history.length) {
    restore(history.pop());
  }
  setStatus(`已悔棋，輪到 ${gameOver ? "終局處理" : colorName(turn)}。`);
}

function calculateAreaScore() {
  const stones = { [BLACK]: 0, [WHITE]: 0 };
  const territoryMap = {};
  const adjustedBoard = {};

  for (const point of points) {
    const key = point.key;
    adjustedBoard[key] = deadMap[key] ? EMPTY : board[key];
  }

  for (const point of points) {
    const key = point.key;
    if (deadMap[key] && board[key] !== EMPTY) {
      territoryMap[key] = opponent(board[key]);
    } else if (board[key] === BLACK || board[key] === WHITE) {
      stones[board[key]] += 1;
      territoryMap[key] = EMPTY;
    } else {
      territoryMap[key] = inferOwnerByRegion(adjustedBoard, key);
    }
  }

  return scoreFromTerritoryMap(stones, territoryMap);
}

function inferOwnerByRegion(source, startKey) {
  const borders = new Set();
  const seen = new Set([startKey]);
  const queue = [startKey];
  while (queue.length) {
    const key = queue.shift();
    for (const nextKey of neighborsOfKey(key)) {
      const cell = source[nextKey];
      if (cell === EMPTY && !seen.has(nextKey)) {
        seen.add(nextKey);
        queue.push(nextKey);
      } else if (cell === BLACK || cell === WHITE) {
        borders.add(cell);
      }
    }
  }
  if (borders.size === 1) return [...borders][0];
  return NEUTRAL;
}

function scoreFromTerritoryMap(stones, territoryMap) {
  const territory = { [BLACK]: 0, [WHITE]: 0, neutral: 0 };
  const rows = [];
  const rowValues = mode === "square" || mode === "torus"
    ? Array.from({ length: size }, (_, y) => y)
    : [...new Set(points.map((point) => point.b))].sort((a, b) => a - b);

  for (const rowValue of rowValues) {
    const row = {
      label: mode === "square" || mode === "torus" ? size - rowValue : Math.floor(size / 2) - rowValue + 1,
      blackStones: 0,
      blackTerritory: 0,
      whiteStones: 0,
      whiteTerritory: 0,
      neutral: 0,
    };

    const rowPoints = points.filter((point) => point.b === rowValue);
    for (const point of rowPoints) {
      const key = point.key;
      const stone = board[key];
      const owner = territoryMap[key];
      if (stone === BLACK && !deadMap[key]) row.blackStones += 1;
      if (stone === WHITE && !deadMap[key]) row.whiteStones += 1;
      if ((stone === EMPTY || deadMap[key]) && owner === BLACK) row.blackTerritory += 1;
      if ((stone === EMPTY || deadMap[key]) && owner === WHITE) row.whiteTerritory += 1;
      if ((stone === EMPTY || deadMap[key]) && owner === NEUTRAL) row.neutral += 1;
    }

    territory[BLACK] += row.blackTerritory;
    territory[WHITE] += row.whiteTerritory;
    territory.neutral += row.neutral;
    rows.push({
      ...row,
      blackTotal: row.blackStones + row.blackTerritory,
      whiteTotal: row.whiteStones + row.whiteTerritory,
    });
  }

  const blackTotal = stones[BLACK] + territory[BLACK];
  const whiteTotal = stones[WHITE] + territory[WHITE];
  const whiteWithKomi = whiteTotal + KOMI;
  const margin = Math.abs(blackTotal - whiteWithKomi);
  const winner = blackTotal > whiteWithKomi ? BLACK : WHITE;

  return {
    stones,
    territory,
    territoryMap,
    deadMap: cloneCells(deadMap),
    blackTotal,
    whiteTotal,
    whiteWithKomi,
    winner,
    margin,
    rows,
  };
}

function cycleOwnership(key) {
  if (!scoreState) scoreState = calculateAreaScore();
  if (board[key] !== EMPTY) return toggleDeadGroup(key);

  pushHistory();
  const nextMap = cloneCells(scoreState.territoryMap);
  nextMap[key] = nextMap[key] === BLACK ? WHITE : nextMap[key] === WHITE ? NEUTRAL : BLACK;
  scoreState = scoreFromTerritoryMap(scoreState.stones, nextMap);
  setStatus(`已把 ${labelOfKey(key)} 改為${ownerName(nextMap[key])}。`);
  render();
}

function toggleDeadGroup(key) {
  pushHistory();
  const color = board[key];
  const group = getGroup(board, key);
  const shouldMarkDead = group.stones.some((stoneKey) => !deadMap[stoneKey]);
  group.stones.forEach((stoneKey) => {
    deadMap[stoneKey] = shouldMarkDead ? color : EMPTY;
  });
  scoreState = calculateAreaScore();
  setStatus(`${colorName(color)} ${group.stones.length} 子已${shouldMarkDead ? "標為死子，改算給對方" : "恢復為活子"}。`);
  render();
}

function ownerName(owner) {
  if (owner === BLACK) return "黑地";
  if (owner === WHITE) return "白地";
  return "中立點";
}

function showScore() {
  if (scoreState && scoreVisible) {
    scoreVisible = false;
    deadStoneMode = false;
    ownershipMode = false;
    setStatus("已隱藏黑地、白地與中立點標記；數子結果仍保留。");
    render();
    return;
  }
  scoreState = calculateAreaScore();
  scoreVisible = true;
  gameOver = false;
  deadStoneMode = false;
  ownershipMode = false;
  saveFinishedGame();
  setStatus("已用數子法判定，棋盤上的方塊就是每一個被計入的空點。");
  render();
}

function resetGame(nextMode = mode, nextSize = size) {
  aiThinking = false;
  clearPendingMove();
  hideConfirmDialog();
  setupBoard(nextMode, nextSize);
  turn = BLACK;
  captures = { [BLACK]: 0, [WHITE]: 0 };
  history = [];
  log = [];
  moveNumbers = {};
  moveCounter = 0;
  lastMoveKey = null;
  currentFinishedGameId = null;
  previousBoardKey = null;
  passCount = 0;
  gameOver = false;
  deadStoneMode = false;
  ownershipMode = false;
  scoreState = null;
  scoreVisible = false;
  setStatus("黑棋先下");
  render();
}

function setStatus(message) {
  statusText.textContent = message;
}

function render() {
  renderSizeButtons();
  drawBoard();
  renderHud();
  renderScore();
  renderLog();
  renderMoveNumberToggle();
  renderWinrate();
  renderAiStrength();
  renderGameHistory();
}

function renderSizeButtons() {
  const options = mode === "square"
    ? [{ label: "9 路", value: 9 }, { label: "13 路", value: 13 }, { label: "19 路", value: 19 }]
    : mode === "hex"
      ? [{ label: "9 行", value: 9 }, { label: "13 行", value: 13 }, { label: "15 行", value: 15 }]
      : [{ label: "9 環", value: 9 }, { label: "13 環", value: 13 }, { label: "19 環", value: 19 }];
  sizeButtons.innerHTML = "";
  for (const option of options) {
    const button = document.createElement("button");
    button.textContent = option.label;
    button.dataset.size = option.value;
    button.className = option.value === size ? "active" : "";
    button.addEventListener("click", () => {
      clearPendingMove();
      resetGame(mode, option.value);
    });
    sizeButtons.append(button);
  }
}

function getLayout() {
  const pixelRatio = window.devicePixelRatio || 1;
  const box = canvas.getBoundingClientRect();
  const side = Math.max(360, Math.floor(box.width * pixelRatio));
  if (canvas.width !== side || canvas.height !== side) {
    canvas.width = side;
    canvas.height = side;
  }

  if (mode === "square") {
    const pad = canvas.width * 0.07;
    return {
      pad,
      gap: (canvas.width - pad * 2) / (size - 1),
      stoneRadius: ((canvas.width - pad * 2) / (size - 1)) * 0.43,
      markSide: ((canvas.width - pad * 2) / (size - 1)) * 0.3,
    };
  }

  if (mode === "torus") {
    return {
      centerX: canvas.width / 2,
      centerY: canvas.height / 2 + canvas.height * 0.03,
      majorRadius: canvas.width * 0.29,
      minorRadius: canvas.width * 0.105,
      tilt: 0.86,
      stoneRadius: canvas.width / size * 0.22,
      markSide: canvas.width / size * 0.18,
    };
  }

  const raw = points.map((point) => axialToRaw(point.a, point.b));
  const boundaryRaw = getHexBoundaryRaw();
  const allRaw = raw.concat(boundaryRaw);
  const minX = Math.min(...allRaw.map((item) => item.x));
  const maxX = Math.max(...allRaw.map((item) => item.x));
  const minY = Math.min(...allRaw.map((item) => item.y));
  const maxY = Math.max(...allRaw.map((item) => item.y));
  const pad = canvas.width * 0.1;
  const scale = Math.min((canvas.width - pad * 2) / (maxX - minX), (canvas.height - pad * 2) / (maxY - minY));
  return {
    scale,
    offsetX: (canvas.width - (minX + maxX) * scale) / 2,
    offsetY: (canvas.height - (minY + maxY) * scale) / 2,
    boundaryRaw,
    stoneRadius: scale * 0.42,
    markSide: scale * 0.3,
  };
}

function axialToRaw(q, r) {
  return { x: Math.sqrt(3) * (q + r / 2), y: 1.5 * r };
}

function getHexBoundaryRaw() {
  const radius = Math.floor(size / 2);
  const cornerCoords = [
    [radius, -radius],
    [radius, 0],
    [0, radius],
    [-radius, radius],
    [-radius, 0],
    [0, -radius],
  ];
  return cornerCoords.map(([q, r]) => axialToRaw(q, r));
}

function pointToPixel(point) {
  if (mode === "square") {
    return { x: layout.pad + point.a * layout.gap, y: layout.pad + point.b * layout.gap };
  }
  if (mode === "torus") return torusProject(point.a, point.b);
  const raw = axialToRaw(point.a, point.b);
  return { x: raw.x * layout.scale + layout.offsetX, y: raw.y * layout.scale + layout.offsetY };
}

function torusProject(a, b) {
  const u = (a / size) * Math.PI * 2 + torusView.u;
  const v = (b / size) * Math.PI * 2 + torusView.v;
  const tube = layout.majorRadius + layout.minorRadius * Math.cos(v);
  const x3 = tube * Math.cos(u);
  const y3 = tube * Math.sin(u);
  const z3 = layout.minorRadius * Math.sin(v);
  const yTilted = y3 * Math.cos(layout.tilt) - z3 * Math.sin(layout.tilt);
  const zTilted = y3 * Math.sin(layout.tilt) + z3 * Math.cos(layout.tilt);
  const perspective = 1 / (1 + zTilted / (canvas.width * 1.75));
  return {
    x: layout.centerX + x3 * perspective,
    y: layout.centerY + yTilted * perspective,
    depth: zTilted,
    scale: perspective,
  };
}

function drawBoard() {
  layout = getLayout();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#e5bc74");
  gradient.addColorStop(1, "#c98f3d");
  ctx.fillStyle = gradient;

  if (mode === "square") {
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawSquareGrid();
  } else if (mode === "torus") {
    drawTorusBoard();
  } else {
    drawHexBoardShape();
    ctx.fill();
    ctx.save();
    ctx.clip();
    drawHexGrid();
    ctx.restore();
    drawHexLabels();
  }

  if (scoreState && scoreVisible) drawTerritoryMarks();
  drawStones();
  if (scoreState && scoreVisible) drawDeadStoneMarks();
}

function drawSquareGrid() {
  ctx.strokeStyle = "rgba(55, 35, 16, 0.78)";
  ctx.lineWidth = Math.max(1, canvas.width * 0.002);
  for (let i = 0; i < size; i++) {
    const pos = layout.pad + i * layout.gap;
    ctx.beginPath();
    ctx.moveTo(layout.pad, pos);
    ctx.lineTo(canvas.width - layout.pad, pos);
    ctx.moveTo(pos, layout.pad);
    ctx.lineTo(pos, canvas.width - layout.pad);
    ctx.stroke();
  }
  drawStarPoints();
  drawSquareLabels();
}

function drawSquareLabels() {
  ctx.save();
  ctx.fillStyle = "rgba(32, 36, 42, 0.82)";
  ctx.font = `${Math.max(11, canvas.width * 0.017)}px Segoe UI, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let i = 0; i < size; i++) {
    const pos = layout.pad + i * layout.gap;
    const letter = LETTERS[i] || String(i + 1);
    ctx.fillText(letter, pos, layout.pad * 0.42);
    ctx.fillText(letter, pos, canvas.height - layout.pad * 0.42);
  }

  ctx.textAlign = "right";
  for (let i = 0; i < size; i++) {
    const pos = layout.pad + i * layout.gap;
    const row = String(size - i);
    ctx.fillText(row, layout.pad * 0.48, pos);
  }

  ctx.textAlign = "left";
  for (let i = 0; i < size; i++) {
    const pos = layout.pad + i * layout.gap;
    const row = String(size - i);
    ctx.fillText(row, canvas.width - layout.pad * 0.48, pos);
  }
  ctx.restore();
}

function drawStarPoints() {
  const pointsBySize = size === 9 ? [2, 4, 6] : size === 13 ? [3, 6, 9] : [3, 9, 15];
  const stars = size === 19
    ? pointsBySize.flatMap((x) => pointsBySize.map((y) => [x, y]))
    : [[pointsBySize[0], pointsBySize[0]], [pointsBySize[2], pointsBySize[0]], [pointsBySize[1], pointsBySize[1]], [pointsBySize[0], pointsBySize[2]], [pointsBySize[2], pointsBySize[2]]];
  ctx.fillStyle = "rgba(55, 35, 16, 0.82)";
  for (const [x, y] of stars) {
    const pos = pointToPixel({ a: x, b: y });
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, layout.gap * 0.085, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHexBoardShape() {
  ctx.beginPath();
  layout.boundaryRaw.forEach((raw, index) => {
    const x = raw.x * layout.scale + layout.offsetX;
    const y = raw.y * layout.scale + layout.offsetY;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.lineWidth = Math.max(2, canvas.width * 0.004);
  ctx.strokeStyle = "#8d5b22";
  ctx.stroke();
}

function drawHexGrid() {
  const lineDirs = [[1, 0], [0, 1], [1, -1]];
  ctx.strokeStyle = "rgba(55, 35, 16, 0.64)";
  ctx.lineWidth = Math.max(1, canvas.width * 0.0015);
  for (const point of points) {
    const from = pointToPixel(point);
    for (const [da, db] of lineDirs) {
      const next = points.find((item) => item.key === keyOf(point.a + da, point.b + db));
      if (!next) continue;
      const to = pointToPixel(next);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }
  }
  for (const point of points) {
    const { x, y } = pointToPixel(point);
    ctx.beginPath();
    ctx.arc(x, y, Math.max(1.8, layout.scale * 0.055), 0, Math.PI * 2);
    ctx.fillStyle = "rgba(55, 35, 16, 0.68)";
    ctx.fill();
  }
}

function drawHexLabels() {
  ctx.save();
  ctx.fillStyle = "rgba(28, 26, 22, 0.92)";
  ctx.font = `800 ${Math.max(11, canvas.width * 0.016)}px Segoe UI, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const perimeter = getHexPerimeterPoints();
  perimeter.forEach((point, index) => {
    const { x, y } = pointToPixel(point);
    const dx = x - centerX;
    const dy = y - centerY;
    const length = Math.max(1, Math.hypot(dx, dy));
    const labelX = x + (dx / length) * layout.scale * 0.32;
    const labelY = y + (dy / length) * layout.scale * 0.32;
    ctx.fillText(String(index + 1), labelX, labelY);
  });
  ctx.restore();
}

function getHexPerimeterPoints() {
  const radius = Math.floor(size / 2);
  const corners = [
    [0, -radius],
    [radius, -radius],
    [radius, 0],
    [0, radius],
    [-radius, radius],
    [-radius, 0],
  ];
  const result = [];

  for (let i = 0; i < corners.length; i++) {
    const [startA, startB] = corners[i];
    const [endA, endB] = corners[(i + 1) % corners.length];
    const stepA = Math.sign(endA - startA);
    const stepB = Math.sign(endB - startB);
    for (let step = 0; step < radius; step++) {
      const key = keyOf(startA + stepA * step, startB + stepB * step);
      const point = points.find((item) => item.key === key);
      if (point) result.push(point);
    }
  }

  return result;
}

function drawTorusBoard() {
  drawTorusSurface();
  drawTorusGrid();
}

function drawTorusSurface() {
  const outerX = layout.majorRadius + layout.minorRadius;
  const outerY = outerX * Math.cos(layout.tilt) + layout.minorRadius * 0.52;
  const innerX = Math.max(12, layout.majorRadius - layout.minorRadius);
  const innerY = Math.max(8, innerX * Math.cos(layout.tilt) - layout.minorRadius * 0.18);

  const gradient = ctx.createLinearGradient(0, layout.centerY - outerY, 0, layout.centerY + outerY);
  gradient.addColorStop(0, "rgba(234, 195, 116, 0.98)");
  gradient.addColorStop(0.5, "rgba(211, 157, 72, 0.96)");
  gradient.addColorStop(1, "rgba(170, 111, 43, 0.95)");

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(layout.centerX, layout.centerY, outerX, outerY, 0, 0, Math.PI * 2);
  ctx.ellipse(layout.centerX, layout.centerY, innerX, innerY, 0, 0, Math.PI * 2, true);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.lineWidth = Math.max(2, canvas.width * 0.004);
  ctx.strokeStyle = "rgba(128, 79, 24, 0.95)";
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(layout.centerX, layout.centerY, innerX, innerY, 0, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(88, 56, 28, 0.72)";
  ctx.stroke();
  ctx.restore();
}

function drawTorusGrid() {
  ctx.save();
  ctx.lineWidth = Math.max(1, canvas.width * 0.0014);
  ctx.strokeStyle = "rgba(72, 46, 22, 0.34)";

  for (let a = 0; a < size; a++) drawTorusCurve((t) => torusProject(a, t), size * 3);
  for (let b = 0; b < size; b++) drawTorusCurve((t) => torusProject(t, b), size * 3);

  ctx.fillStyle = "rgba(66, 43, 24, 0.52)";
  for (const point of points) {
    const { x, y, scale } = pointToPixel(point);
    ctx.beginPath();
    ctx.arc(x, y, Math.max(1.5, canvas.width * 0.003 * scale), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawTorusCurve(projector, samples) {
  ctx.beginPath();
  for (let i = 0; i <= samples; i++) {
    const projected = projector((i / samples) * size);
    if (i === 0) ctx.moveTo(projected.x, projected.y);
    else ctx.lineTo(projected.x, projected.y);
  }
  ctx.stroke();
}

function drawTerritoryMarks() {
  for (const point of points) {
    const owner = scoreState.territoryMap[point.key];
    if (owner === EMPTY || (board[point.key] !== EMPTY && !deadMap[point.key])) continue;
    const { x, y } = pointToPixel(point);
    const side = owner === NEUTRAL ? layout.markSide * 0.75 : layout.markSide;
    ctx.fillStyle = owner === BLACK ? "rgba(18, 22, 28, 0.7)" : owner === WHITE ? "rgba(255, 255, 255, 0.9)" : "rgba(86, 96, 108, 0.38)";
    ctx.fillRect(x - side / 2, y - side / 2, side, side);
    ctx.strokeStyle = "rgba(55, 35, 16, 0.35)";
    ctx.lineWidth = Math.max(1, (mode === "square" ? layout.gap : layout.scale) * 0.025);
    ctx.strokeRect(x - side / 2, y - side / 2, side, side);
  }
}

function drawStones() {
  const orderedPoints = mode === "torus"
    ? points.slice().sort((left, right) => pointToPixel(left).depth - pointToPixel(right).depth)
    : points;
  for (const point of orderedPoints) {
    const color = board[point.key];
    if (color === EMPTY) continue;
    const { x, y } = pointToPixel(point);
    const moveNumber = moveNumbers[point.key];
    drawStone(
      x,
      y,
      layout.stoneRadius,
      color,
      Boolean(deadMap[point.key]),
      shouldShowMoveNumber(moveNumber) ? moveNumber : null,
      point.key === lastMoveKey
    );
  }
  drawPendingMove();
}

function shouldShowMoveNumber(moveNumber) {
  if (!moveNumber) return false;
  return showAllMoveNumbers || moveNumber > moveCounter - 2;
}

function drawPendingMove() {
  if (!pendingMoveKey || board[pendingMoveKey] !== EMPTY) return;
  const point = points.find((item) => item.key === pendingMoveKey);
  if (!point) return;
  const { x, y } = pointToPixel(point);
  ctx.save();
  ctx.globalAlpha = 0.58;
  const gradient = ctx.createRadialGradient(x - layout.stoneRadius * 0.3, y - layout.stoneRadius * 0.35, layout.stoneRadius * 0.12, x, y, layout.stoneRadius);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.55, "#9da3aa");
  gradient.addColorStop(1, "#555d66");
  ctx.beginPath();
  ctx.arc(x, y, layout.stoneRadius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "#2d6f6d";
  ctx.lineWidth = Math.max(2, layout.stoneRadius * 0.13);
  ctx.stroke();
  ctx.restore();
}

function drawStone(cx, cy, radius, color, isDead = false, moveNumber = null, isLastMove = false) {
  ctx.save();
  if (isDead) ctx.globalAlpha = 0.38;
  const gradient = ctx.createRadialGradient(cx - radius * 0.35, cy - radius * 0.4, radius * 0.12, cx, cy, radius);
  if (color === BLACK) {
    gradient.addColorStop(0, "#666b72");
    gradient.addColorStop(0.55, "#17191d");
    gradient.addColorStop(1, "#040506");
  } else {
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.72, "#eceff3");
    gradient.addColorStop(1, "#b7bec8");
  }
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.strokeStyle = color === BLACK ? "rgba(0,0,0,0.45)" : "rgba(80,90,105,0.45)";
  ctx.lineWidth = Math.max(1, radius * 0.06);
  ctx.stroke();

  if (moveNumber) {
    ctx.fillStyle = color === BLACK ? "#f8fafc" : "#20242a";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `800 ${moveNumber >= 100 ? radius * 0.62 : radius * 0.78}px Segoe UI, sans-serif`;
    ctx.fillText(String(moveNumber), cx, cy + radius * 0.03);
  }

  if (isLastMove) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.58, 0, Math.PI * 2);
    ctx.strokeStyle = color === BLACK ? "#f5d76e" : "#2d6f6d";
    ctx.lineWidth = Math.max(2, radius * 0.12);
    ctx.stroke();
  }
  ctx.restore();
}

function drawDeadStoneMarks() {
  ctx.save();
  ctx.strokeStyle = "#b84838";
  ctx.lineWidth = Math.max(2, (mode === "square" ? layout.gap : layout.scale) * 0.08);
  ctx.lineCap = "round";
  for (const point of points) {
    if (!deadMap[point.key]) continue;
    const { x, y } = pointToPixel(point);
    const arm = (mode === "square" ? layout.gap : layout.scale) * 0.22;
    ctx.beginPath();
    ctx.moveTo(x - arm, y - arm);
    ctx.lineTo(x + arm, y + arm);
    ctx.moveTo(x + arm, y - arm);
    ctx.lineTo(x - arm, y + arm);
    ctx.stroke();
  }
  ctx.restore();
}

function renderHud() {
  appTitle.textContent = mode === "square" ? "圍棋小棋室" : mode === "hex" ? "六氣棋盤" : "甜甜圈棋盤";
  rulesText.textContent = mode === "square"
    ? "標準圍棋使用上下左右四個相鄰方向。支援落子、提子、禁自殺、劫、Pass、悔棋、提死子與數子判定。"
    : mode === "hex"
      ? "六氣棋盤使用六角網格，每顆棋最多有六口氣。落子、提子、禁自殺與劫都照六個相鄰方向判定。"
      : "甜甜圈棋盤沒有邊角：上下相接、左右相接。規則仍用上下左右四氣，但每一步都會從另一側接回來。";
  turnText.textContent = gameOver ? "終局" : colorName(turn);
  const stone = turnCard.querySelector(".stone");
  stone.className = `stone ${turn === BLACK ? "black" : "white"}`;
  blackCapturesEl.textContent = captures[BLACK];
  whiteCapturesEl.textContent = captures[WHITE];
  deadModeBtn.setAttribute("aria-pressed", String(deadStoneMode));
  ownershipModeBtn.setAttribute("aria-pressed", String(ownershipMode));
  canvas.style.cursor = mode === "torus" ? "grab" : deadStoneMode || ownershipMode ? "pointer" : "crosshair";
}

function renderScore() {
  if (scoreBtn) {
    scoreBtn.setAttribute("aria-pressed", String(scoreVisible));
    scoreBtn.textContent = scoreState ? (scoreVisible ? "隱藏地盤" : "顯示地盤") : "數子判定";
  }
  if (!scoreState) {
    blackAreaEl.textContent = "-";
    whiteAreaEl.textContent = "-";
    blackBreakdownEl.textContent = "棋子 -，地 -";
    whiteBreakdownEl.textContent = "棋子 -，地 -";
    winnerText.textContent = "尚未判定";
    marginText.textContent = "點數差與子數差會顯示在這裡。";
    scoreIntro.textContent = "按「數子判定」後，棋盤會標出黑地、白地與中立點。";
    rowBreakdown.innerHTML = `<tr><td colspan="8">尚未判定</td></tr>`;
    return;
  }
  blackAreaEl.textContent = scoreState.blackTotal;
  whiteAreaEl.textContent = scoreState.whiteTotal;
  blackBreakdownEl.textContent = `棋子 ${scoreState.stones[BLACK]}，地 ${scoreState.territory[BLACK]}`;
  whiteBreakdownEl.textContent = `棋子 ${scoreState.stones[WHITE]}，地 ${scoreState.territory[WHITE]}`;
  scoreIntro.textContent = `盤面核對：黑 ${scoreState.blackTotal} + 白 ${scoreState.whiteTotal} + 中立 ${scoreState.territory.neutral} = ${points.length}。白貼目 ${KOMI}，白棋貼目後是 ${scoreState.whiteWithKomi}。`;
  winnerText.textContent = `${colorName(scoreState.winner)}勝 ${scoreState.margin.toFixed(1)} 點。`;
  marginText.textContent = `換成「子」是 ${formatZi(scoreState.margin / 2)}。提子數不加進數子法，只代表已被吃掉而不在盤上的子。`;
  renderRowBreakdown();
}

function renderRowBreakdown() {
  const body = scoreState.rows.map((row) => `
    <tr>
      <td>${row.label}</td>
      <td>${row.blackStones}</td>
      <td>${row.blackTerritory}</td>
      <td>${row.blackTotal}</td>
      <td>${row.whiteStones}</td>
      <td>${row.whiteTerritory}</td>
      <td>${row.whiteTotal}</td>
      <td>${row.neutral}</td>
    </tr>
  `).join("");
  rowBreakdown.innerHTML = `${body}
    <tr>
      <td>合計</td>
      <td>${scoreState.stones[BLACK]}</td>
      <td>${scoreState.territory[BLACK]}</td>
      <td>${scoreState.blackTotal}</td>
      <td>${scoreState.stones[WHITE]}</td>
      <td>${scoreState.territory[WHITE]}</td>
      <td>${scoreState.whiteTotal}</td>
      <td>${scoreState.territory.neutral}</td>
    </tr>`;
}

function formatZi(value) {
  const whole = Math.floor(value);
  const quarters = Math.round((value - whole) * 4);
  const fraction = ["", "1/4", "1/2", "3/4"][quarters] || "";
  if (!whole && fraction) return `${fraction} 子`;
  if (!fraction) return `${whole} 子`;
  return `${whole} 又 ${fraction} 子`;
}

function renderLog() {
  moveLog.innerHTML = "";
  for (const move of log.slice().reverse()) {
    const item = document.createElement("li");
    item.textContent = move;
    moveLog.append(item);
  }
}

function renderMoveNumberToggle() {
  if (!moveNumberToggle) return;
  moveNumberToggle.setAttribute("aria-pressed", String(showAllMoveNumbers));
  moveNumberToggle.textContent = showAllMoveNumbers ? "顯示全部手數" : "只顯示最近兩手";
}

function renderWinrate() {
  const preview = getPendingWinratePreview();
  const whiteRate = estimatePositionWhiteWinRate(board, captures);
  const blackRate = 100 - whiteRate;
  blackWinrateText.textContent = `黑 ${blackRate}%`;
  whiteWinrateText.textContent = `白 ${whiteRate}%`;
  blackWinrateBar.style.width = `${blackRate}%`;

  if (!winratePreviewBar) return;
  if (!preview) {
    winratePreviewBar.classList.remove("is-visible");
    winratePreviewBar.style.left = `${blackRate}%`;
    winratePreviewBar.style.width = "0";
    return;
  }

  const previewCaptures = { ...captures, [turn]: captures[turn] + preview.capturedCount };
  const previewWhiteRate = estimatePositionWhiteWinRate(preview.next, previewCaptures);
  const previewBlackRate = 100 - previewWhiteRate;
  const previewStart = Math.min(blackRate, previewBlackRate);
  const previewWidth = Math.max(2, Math.abs(previewBlackRate - blackRate));
  winratePreviewBar.style.left = `${previewStart}%`;
  winratePreviewBar.style.width = `${previewWidth}%`;
  winratePreviewBar.classList.add("is-visible");
}

function renderAiStrength() {
  aiStrengthPanel.classList.toggle("is-hidden", playMode !== "ai");
  aiStrengthPanel.querySelectorAll("[data-ai-strength]").forEach((button) => {
    button.classList.toggle("active", button.dataset.aiStrength === aiStrength);
  });
}

function labelOfKey(key) {
  const { a, b } = parseKey(key);
  if (mode === "square") {
    return `${LETTERS[a]}${size - b}`;
  }
  if (mode === "torus") {
    return `${LETTERS[a]}${size - b}`;
  }
  const rowPoints = points.filter((point) => point.b === b).sort((left, right) => left.a - right.a);
  const index = rowPoints.findIndex((point) => point.key === key);
  return `${String.fromCharCode(65 + index)}${Math.floor(size / 2) - b + 1}`;
}

function keyFromClick(event) {
  const rect = canvas.getBoundingClientRect();
  const scale = canvas.width / rect.width;
  const px = (event.clientX - rect.left) * scale;
  const py = (event.clientY - rect.top) * scale;
  let best = null;
  let bestDistance = Infinity;
  for (const point of points) {
    const { x, y } = pointToPixel(point);
    const distance = Math.hypot(px - x, py - y);
    if (distance < bestDistance) {
      best = point;
      bestDistance = distance;
    }
  }
  const threshold = mode === "square" ? layout.gap * 0.48 : mode === "torus" ? canvas.width / size * 0.28 : layout.scale * 0.48;
  return bestDistance <= threshold ? best.key : null;
}

canvas.addEventListener("click", (event) => {
  if (suppressNextClick) {
    suppressNextClick = false;
    return;
  }
  if (!layout) return;
  const key = keyFromClick(event);
  if (!key) {
    clearPendingMove();
    render();
    return;
  }
  if (ownershipMode || deadStoneMode) {
    clearPendingMove();
    tryPlay(key);
    return;
  }
  if (gameOver || (playMode === "ai" && turn === WHITE)) {
    tryPlay(key);
    return;
  }
  if (board[key] !== EMPTY) {
    clearPendingMove();
    tryPlay(key);
    render();
    return;
  }
  if (pendingMoveKey === key) {
    clearPendingMove();
    tryPlay(key);
    return;
  }
  setPendingMove(key);
});

canvas.addEventListener("pointerdown", (event) => {
  if (mode !== "torus") return;
  torusDrag = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    startU: torusView.u,
    startV: torusView.v,
    moved: false,
  };
  canvas.setPointerCapture(event.pointerId);
  canvas.style.cursor = "grabbing";
});

canvas.addEventListener("pointermove", (event) => {
  if (!torusDrag || event.pointerId !== torusDrag.pointerId) return;
  const dx = event.clientX - torusDrag.startX;
  const dy = event.clientY - torusDrag.startY;
  if (Math.hypot(dx, dy) > 3) torusDrag.moved = true;
  torusView.u = torusDrag.startU + dx * 0.012;
  torusView.v = torusDrag.startV + dy * 0.012;
  drawBoard();
});

canvas.addEventListener("pointerup", (event) => {
  if (!torusDrag || event.pointerId !== torusDrag.pointerId) return;
  suppressNextClick = torusDrag.moved;
  torusDrag = null;
  canvas.releasePointerCapture(event.pointerId);
  canvas.style.cursor = "grab";
});

canvas.addEventListener("pointercancel", (event) => {
  if (!torusDrag || event.pointerId !== torusDrag.pointerId) return;
  torusDrag = null;
  canvas.style.cursor = "grab";
});

document.querySelectorAll("[data-mode]").forEach((button) => {
  button.addEventListener("click", () => {
    clearPendingMove();
    document.querySelectorAll("[data-mode]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    resetGame(button.dataset.mode, button.dataset.mode === "hex" ? 15 : 19);
  });
});

function showConfirmDialog({ title, message, confirmText, cancelText = "留下", hideCancel = false, onConfirm }) {
  pendingConfirmAction = onConfirm;
  confirmDialogTitle.textContent = title;
  confirmDialogMessage.textContent = message;
  cancelDialogBtn.textContent = cancelText;
  confirmDialogBtn.textContent = confirmText;
  cancelDialogBtn.classList.toggle("is-hidden", hideCancel);
  confirmDialog.classList.remove("is-hidden");
  confirmDialogBtn.focus();
}

function hideConfirmDialog() {
  pendingConfirmAction = null;
  confirmDialog.classList.add("is-hidden");
}

function showMainMenu() {
  aiThinking = false;
  hideConfirmDialog();
  gameShell.classList.add("is-hidden");
  startScreen.classList.remove("is-hidden");
}

function requestMainMenu() {
  if (hasStartedGame()) {
    showConfirmDialog({
      title: "棋局已開始",
      message: "棋局已開始，確定離開嗎？",
      confirmText: "離開",
      onConfirm: showMainMenu,
    });
    return;
  }
  showMainMenu();
}

function requestNewGame() {
  if (hasStartedGame()) {
    showConfirmDialog({
      title: "棋局已開始",
      message: "棋局已開始，確定重開嗎？",
      confirmText: "重開",
      onConfirm: () => resetGame(mode, size),
    });
    return;
  }
  resetGame(mode, size);
}

function showOnlineModeInfo(withAiHint) {
  showConfirmDialog({
    title: withAiHint ? "AI 提示連線" : "連線對弈",
    message: withAiHint
      ? "這個模式需要先做連線房間，之後再把 AI 建議落點疊在雙方棋盤上。下一步要先決定：AI 提示只給自己看，還是雙方都能看。"
      : "連線對弈需要一個同步棋盤的地方，例如雲端資料庫或小型伺服器。選好方式後，就能做建立房間、輸入房間碼、雙方同步落子的流程。",
    confirmText: "知道了",
    hideCancel: true,
    onConfirm: hideConfirmDialog,
  });
}

document.querySelector("#passBtn").addEventListener("click", passTurn);
document.querySelector("#undoBtn").addEventListener("click", undo);
document.querySelector("#scoreBtn").addEventListener("click", showScore);
document.querySelector("#newGameBtn").addEventListener("click", requestNewGame);
traditionalModeBtn.addEventListener("click", () => startGame("traditional"));
aiModeBtn.addEventListener("click", () => startGame("ai"));
onlineModeBtn.addEventListener("click", () => showOnlineModeInfo(false));
onlineAiHintModeBtn.addEventListener("click", () => showOnlineModeInfo(true));
backMenuBtn.addEventListener("click", requestMainMenu);
aiStrengthPanel.querySelectorAll("[data-ai-strength]").forEach((button) => {
  button.addEventListener("click", () => {
    aiStrength = button.dataset.aiStrength;
    setStatus(`AI 強度已切換為 ${AI_STRENGTHS[aiStrength].label}。`);
    render();
    scheduleAiMove();
  });
});
cancelDialogBtn.addEventListener("click", hideConfirmDialog);
confirmDialogBtn.addEventListener("click", () => {
  const action = pendingConfirmAction;
  hideConfirmDialog();
  if (action) action();
});
confirmDialog.addEventListener("click", (event) => {
  if (event.target === confirmDialog) hideConfirmDialog();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") hideConfirmDialog();
});
moveNumberToggle.addEventListener("click", () => {
  showAllMoveNumbers = !showAllMoveNumbers;
  render();
});
deadModeBtn.addEventListener("click", () => {
  clearPendingMove();
  deadStoneMode = !deadStoneMode;
  ownershipMode = false;
  scoreState = calculateAreaScore();
  scoreVisible = true;
  setStatus(deadStoneMode ? "提死子模式：點一串死棋就會整串移除。" : "已離開提死子模式。");
  render();
});
ownershipModeBtn.addEventListener("click", () => {
  clearPendingMove();
  if (!scoreState) scoreState = calculateAreaScore();
  ownershipMode = !ownershipMode;
  scoreVisible = true;
  deadStoneMode = false;
  setStatus(ownershipMode ? "校正歸屬模式：點空點切換歸屬；點棋子整串標死或恢復。" : "已離開校正歸屬模式。");
  render();
});
window.addEventListener("resize", drawBoard);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

resetGame("square", 19);
