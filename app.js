const canvas = document.querySelector("#goBoard");
const ctx = canvas.getContext("2d");
const appTitle = document.querySelector("#appTitle");
const statusText = document.querySelector("#statusText");
const sideStatusText = document.querySelector("#sideStatusText");
const termText = document.querySelector("#termText");
const sideTermText = document.querySelector("#sideTermText");
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
const resignBtn = document.querySelector("#resignBtn");
const finalConfirmBtn = document.querySelector("#finalConfirmBtn");
const exportRecordBtn = document.querySelector("#exportRecordBtn");
const moveNumberToggle = document.querySelector("#moveNumberToggle");
const aiStrengthPanel = document.querySelector("#aiStrengthPanel");
const aiModelStatus = document.querySelector("#aiModelStatus");
const aiDifficultyText = document.querySelector("#aiDifficultyText");
const generalAiStrengthControls = document.querySelector("#generalAiStrengthControls");
const colorAiStrengthControls = document.querySelector("#colorAiStrengthControls");
const aiHintToggle = document.querySelector("#aiHintToggle");
const aiHintStrengthControls = document.querySelector("#aiHintStrengthControls");
const colorAiHintToggles = document.querySelector("#colorAiHintToggles");
const blackAiHintToggle = document.querySelector("#blackAiHintToggle");
const whiteAiHintToggle = document.querySelector("#whiteAiHintToggle");
const aiHintCountControls = document.querySelector("#aiHintCountControls");
const aiHintFixedNote = document.querySelector("#aiHintFixedNote");
const aiHintText = document.querySelector("#aiHintText");
const startScreen = document.querySelector("#startScreen");
const gameShell = document.querySelector("#gameShell");
const traditionalModeBtn = document.querySelector("#traditionalModeBtn");
const aiModeBtn = document.querySelector("#aiModeBtn");
const onlineModeBtn = document.querySelector("#onlineModeBtn");
const onlineAiHintModeBtn = document.querySelector("#onlineAiHintModeBtn");
const lobbyConnectionText = document.querySelector("#lobbyConnectionText");
const lobbyOnlineCount = document.querySelector("#lobbyOnlineCount");
const lobbyRoomCount = document.querySelector("#lobbyRoomCount");
const lobbyQueueSummary = document.querySelector("#lobbyQueueSummary");
const lobbyOptionButtons = document.querySelectorAll("[data-lobby-board], [data-lobby-size], [data-lobby-assist], [data-lobby-rank]");
const publicLobbyBtn = document.querySelector("#publicLobbyBtn");
const privateRoomShortcutBtn = document.querySelector("#privateRoomShortcutBtn");
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
const V4_MODEL_NAME = "V7-Value/Tactical";
const V4_MODEL_URL = "./models/v7-value-tactical-web.onnx";
const V4_RUNTIME_PATH = "./vendor/onnxruntime/";
const V4_MODEL_TIMEOUT_MS = 30000;
const V4_INFERENCE_TIMEOUT_MS = 8000;
const AI_ENDGAME_PASS_AFTER_HUMAN_PASS_MIN_MOVES = 200;
const AI_ENDGAME_PASS_MIN_MOVES = 200;
const AI_ENDGAME_FORCE_REVIEW_MIN_MOVES = 230;
const AI_ENDGAME_CANDIDATE_LIMIT = 96;
const AI_ENDGAME_PASS_THRESHOLD = 4.4;
const AI_ENDGAME_AFTER_PASS_THRESHOLD = 2.2;
const PEERJS_URL = "https://unpkg.com/peerjs@1.5.5/dist/peerjs.min.js";
const ONLINE_ROOM_PREFIX = "gbr-";
const MATCH_SERVER_URL_KEY = "go-board-room-match-server-url";
const MATCH_PLAYER_ID_KEY = "go-board-room-match-player-id";
const DEFAULT_MATCH_SERVER_URL = "https://go-board-room-match.cba3516.workers.dev";

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
let resignationState = null;
let endgamePromptShown = false;
let layout = null;
let torusView = { u: 0, v: 0 };
let torusDrag = null;
let suppressNextClick = false;
let pendingMoveKey = null;
let playMode = "traditional";
let aiThinking = false;
let pendingConfirmAction = null;
let pendingCancelAction = null;
let aiStrength = "low";
let blackAiStrength = "low";
let whiteAiStrength = "max";
let aiHintStrength = "max";
let aiHintsEnabled = false;
let blackAiHintsEnabled = false;
let whiteAiHintsEnabled = false;
let aiHintCount = 1;
const ONLINE_AI_HINT_COUNT = 2;
let aiHints = [];
let aiHintLoading = false;
let currentFinishedGameId = null;
let isGameHistoryExpanded = false;
let v4SessionPromise = null;
let v4ModelState = "idle";
let v4ModelMessage = "尚未載入";
let v4WhiteWinRate = null;
let nativeV4RequestCounter = 0;
const nativeV4Requests = new Map();
let peerJsPromise = null;
let matchmakingState = { ticketId: null, timer: null, active: false };
let onlineAiHintsEnabled = false;
let onlineState = {
  role: null,
  color: null,
  room: null,
  peer: null,
  conn: null,
  connected: false,
  applyingRemote: false,
  seq: 0,
};

const AI_STRENGTHS = {
  low: {
    label: "低",
    note: "低：較適合新手，AI 會比較放鬆。",
    candidateCount: 16,
    randomness: 30,
    depthBonus: 0.6,
    protectWeak: false,
    v4TopN: 70,
    v4Temperature: 1.45,
    v4BlunderRate: 0.22,
  },
  medium: {
    label: "中",
    note: "中：會認真下，但仍保留一些變化。",
    candidateCount: 8,
    randomness: 10,
    depthBonus: 1,
    protectWeak: false,
    v4TopN: 24,
    v4Temperature: 0.85,
    v4BlunderRate: 0.08,
  },
  high: {
    label: "高",
    note: "高：大多選模型前幾推薦手。",
    candidateCount: 3,
    randomness: 2,
    depthBonus: 1.45,
    protectWeak: true,
    v4TopN: 7,
    v4Temperature: 0.42,
    v4BlunderRate: 0.015,
  },
  max: {
    label: "最高",
    note: "最高：最接近 V7-Value/Tactical 原本判斷。",
    candidateCount: 1,
    randomness: 0,
    depthBonus: 2,
    protectWeak: true,
    v4TopN: 1,
    v4Temperature: 0,
    v4BlunderRate: 0,
  },
};

function setV4ModelStatus(state, message) {
  v4ModelState = state;
  v4ModelMessage = message;
  if (aiModelStatus) aiModelStatus.textContent = message;
}

function withTimeout(promise, timeoutMs, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = window.setTimeout(() => reject(new Error(`${label}逾時`)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timer));
}

function hasNativeV4Bridge() {
  return false;
}

window.__setNativeV4State = (ready, message) => {
  setV4ModelStatus(ready ? "ready" : "fallback", message || (ready ? "已就緒 · Android 離線推論" : "Android 模型載入失敗"));
};

window.__resolveNativeV4 = (requestId, payload) => {
  const pending = nativeV4Requests.get(requestId);
  if (!pending) return;
  nativeV4Requests.delete(requestId);
  pending.resolve(payload);
};

window.__rejectNativeV4 = (requestId, message) => {
  const pending = nativeV4Requests.get(requestId);
  if (!pending) return;
  nativeV4Requests.delete(requestId);
  pending.reject(new Error(message || "V7-Value/Tactical Android 推論失敗"));
};

function waitForNativeV4() {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const check = () => {
      try {
        if (window.GoAiBridge.isReady()) {
          setV4ModelStatus("ready", "已就緒 · Android 離線推論");
          resolve("native");
          return;
        }
      } catch (error) {
        reject(error);
        return;
      }
      if (Date.now() - startedAt >= V4_MODEL_TIMEOUT_MS) {
        reject(new Error("V7-Value/Tactical Android 模型載入逾時"));
        return;
      }
      window.setTimeout(check, 100);
    };
    check();
  });
}

function runNativeV4Inference(features) {
  return new Promise((resolve, reject) => {
    const requestId = `v4-${Date.now()}-${++nativeV4RequestCounter}`;
    nativeV4Requests.set(requestId, { resolve, reject });
    try {
      window.GoAiBridge.infer(requestId, JSON.stringify(Array.from(features)));
    } catch (error) {
      nativeV4Requests.delete(requestId);
      reject(error);
    }
  });
}
function isV4PositionSupported() {
  return mode === "square" && size === 19;
}

function prepareV4Model() {
  if (v4SessionPromise) return v4SessionPromise;
  if (hasNativeV4Bridge()) {
    setV4ModelStatus("loading", "V7-Value/Tactical Android 模型載入中...");
    v4SessionPromise = waitForNativeV4().catch((error) => {
      v4SessionPromise = null;
      setV4ModelStatus("fallback", "Android 模型載入失敗，改用備援 AI");
      throw error;
    });
    return v4SessionPromise;
  }
  if (!window.ort) {
    setV4ModelStatus("fallback", "Runtime 載入失敗，使用備援 AI");
    return Promise.reject(new Error("ONNX Runtime Web unavailable"));
  }

  setV4ModelStatus("loading", "模型載入中...");
  window.ort.env.wasm.wasmPaths = new URL(V4_RUNTIME_PATH, window.location.href).href;
  window.ort.env.wasm.numThreads = 1;
  window.ort.env.wasm.proxy = false;
  v4SessionPromise = window.ort.InferenceSession.create(V4_MODEL_URL, {
    executionProviders: ["wasm"],
    graphOptimizationLevel: "all",
  }).then((session) => {
    setV4ModelStatus("ready", "已就緒 · 離線推論");
    return session;
  }).catch((error) => {
    console.error("V7-Value/Tactical model load failed", error);
    setV4ModelStatus("fallback", "載入失敗，使用備援 AI");
    throw error;
  });
  return v4SessionPromise;
}

function encodeV4Features(source, perspective) {
  const area = 19 * 19;
  const features = new Float32Array(14 * area);
  const enemy = opponent(perspective);
  const toPlayValue = turn === perspective ? 1 : 0;

  const previousMoveKey = (() => {
    const previousNumber = moveCounter - 1;
    if (previousNumber <= 0) return null;
    return Object.keys(moveNumbers).find((key) => moveNumbers[key] === previousNumber) || null;
  })();

  for (let y = 0; y < 19; y++) {
    for (let x = 0; x < 19; x++) {
      const index = y * 19 + x;
      const cell = source[keyOf(x, y)];
      if (cell === perspective) features[index] = 1;
      if (cell === enemy) features[area + index] = 1;
      features[area * 2 + index] = toPlayValue;
      features[area * 12 + index] = x / 18;
      features[area * 13 + index] = y / 18;
    }
  }

  const visited = new Set();
  for (const point of points) {
    const cell = source[point.key];
    if (cell !== BLACK && cell !== WHITE) continue;
    if (visited.has(point.key)) continue;
    const group = getGroup(source, point.key);
    group.stones.forEach((key) => visited.add(key));
    const base = cell === perspective ? 3 : 6;
    const libertyCount = group.liberties.size;
    const plane = libertyCount <= 1 ? base : libertyCount === 2 ? base + 1 : base + 2;
    for (const stoneKey of group.stones) {
      const { a: x, b: y } = parseKey(stoneKey);
      features[area * plane + y * 19 + x] = 1;
    }
  }

  if (lastMoveKey) {
    const { a: x, b: y } = parseKey(lastMoveKey);
    features[area * 10 + y * 19 + x] = 1;
  }
  if (previousMoveKey) {
    const { a: x, b: y } = parseKey(previousMoveKey);
    features[area * 11 + y * 19 + x] = 1;
  }

  return features;
}

async function runV4Inference(source, perspective) {
  const features = encodeV4Features(source, perspective);
  let policy;
  let value;

  if (hasNativeV4Bridge()) {
    await withTimeout(prepareV4Model(), V4_MODEL_TIMEOUT_MS, "V7-Value/Tactical 模型載入");
    const outputs = await withTimeout(
      runNativeV4Inference(features),
      V4_INFERENCE_TIMEOUT_MS,
      "V7-Value/Tactical Android 推論"
    );
    policy = outputs.policy;
    value = Number(outputs.value);
  } else {
    const session = await withTimeout(prepareV4Model(), V4_MODEL_TIMEOUT_MS, "V7-Value/Tactical 模型載入");
    const tensor = new window.ort.Tensor("float32", features, [1, 14, 19, 19]);
    const outputs = await withTimeout(
      session.run({ features: tensor }),
      V4_INFERENCE_TIMEOUT_MS,
      "V7-Value/Tactical 推論"
    );
    policy = outputs.policy_logits?.data;
    value = Number(outputs.value?.data?.[0]);
  }

  if (!policy || policy.length !== 361 || !Number.isFinite(value)) {
    throw new Error("V7-Value/Tactical 輸出格式不正確");
  }
  const perspectiveWinRate = Math.max(0, Math.min(100, (value + 1) * 50));
  return {
    policy,
    value,
    whiteWinRate: perspective === WHITE ? perspectiveWinRate : 100 - perspectiveWinRate,
  };
}

function chooseWeightedMove(candidates, temperature) {
  if (!candidates.length) return null;
  if (!temperature || temperature <= 0) return candidates[0].move;
  const best = candidates[0].logit;
  const weights = candidates.map((item) => Math.exp((item.logit - best) / temperature));
  const total = weights.reduce((sum, value) => sum + value, 0);
  let pick = Math.random() * total;
  for (let index = 0; index < candidates.length; index++) {
    pick -= weights[index];
    if (pick <= 0) return candidates[index].move;
  }
  return candidates[candidates.length - 1].move;
}

function ratedV4Moves(legalMoves, policy) {
  return legalMoves
    .map((move) => {
      const { a: x, b: y } = parseKey(move.key);
      return { move, logit: Number(policy[y * 19 + x]) };
    })
    .filter((item) => Number.isFinite(item.logit))
    .sort((left, right) => right.logit - left.logit);
}

function selectV4MoveByDifficulty(legalMoves, policy, strengthKey = aiStrength) {
  const strength = AI_STRENGTHS[strengthKey] || AI_STRENGTHS.low;
  const ratedMoves = ratedV4Moves(legalMoves, policy);

  if (!ratedMoves.length) return null;
  if (strength.v4BlunderRate && Math.random() < strength.v4BlunderRate) {
    const start = Math.min(Math.floor(strength.v4TopN * 0.45), ratedMoves.length - 1);
    const end = Math.min(ratedMoves.length, Math.max(start + 1, strength.v4TopN + 18));
    const loosePool = ratedMoves.slice(start, end);
    return loosePool[Math.floor(Math.random() * loosePool.length)].move;
  }

  const topN = Math.max(1, Math.min(strength.v4TopN, ratedMoves.length));
  return chooseWeightedMove(ratedMoves.slice(0, topN), strength.v4Temperature);
}

function chooseV4HintsByDifficulty(legalMoves, policy, strengthKey, count) {
  const selected = [];
  const selectedKeys = new Set();
  const ranked = rankV4Moves(legalMoves, policy);
  let pool = legalMoves.slice();
  while (selected.length < count && pool.length) {
    const move = selectV4MoveByDifficulty(pool, policy, strengthKey);
    if (!move || selectedKeys.has(move.key)) break;
    selected.push(move);
    selectedKeys.add(move.key);
    pool = pool.filter((item) => item.key !== move.key);
  }
  for (const move of ranked) {
    if (selected.length >= count) break;
    if (selectedKeys.has(move.key)) continue;
    selected.push(move);
    selectedKeys.add(move.key);
  }
  return selected;
}


function legalV4MovesFor(color) {
  if (!isV4PositionSupported()) return [];
  return points
    .map((point) => previewMove(point.key, color))
    .filter(Boolean);
}

function rankV4Moves(legalMoves, policy) {
  return legalMoves
    .map((move) => {
      const { a: x, b: y } = parseKey(move.key);
      return { ...move, logit: Number(policy[y * 19 + x]) };
    })
    .filter((move) => Number.isFinite(move.logit))
    .sort((left, right) => right.logit - left.logit);
}

function clearAiHints() {
  aiHints = [];
  aiHintLoading = false;
}

function isOnlinePlayMode() {
  return playMode === "online";
}

function isAiHintPlayMode() {
  return playMode === "traditional" || playMode === "ai" || (isOnlinePlayMode() && onlineAiHintsEnabled);
}

function colorAiHintEnabled(color) {
  return color === BLACK ? blackAiHintsEnabled : whiteAiHintsEnabled;
}

function currentAiHintEnabled() {
  if (playMode === "traditional") return colorAiHintEnabled(turn);
  return aiHintsEnabled;
}

function currentAiHintColor() {
  if (playMode === "traditional") return colorAiHintEnabled(turn) ? turn : null;
  if (playMode === "ai") return BLACK;
  if (isOnlinePlayMode() && onlineAiHintsEnabled && onlineState.connected && onlineState.color && turn === onlineState.color) return turn;
  return null;
}

function aiStrengthForColor(color) {
  if (color === BLACK) return blackAiStrength;
  if (color === WHITE) return whiteAiStrength;
  return aiStrength;
}

function currentAiHintStrength() {
  if (playMode === "traditional") return aiStrengthForColor(turn);
  return aiHintStrength;
}

function usesFixedTwoAiHints() {
  return playMode === "traditional" || onlineAiHintsEnabled;
}

function effectiveAiHintCount() {
  return usesFixedTwoAiHints() ? ONLINE_AI_HINT_COUNT : aiHintCount;
}

function canShowAiHints() {
  return currentAiHintEnabled()
    && currentAiHintColor()
    && !gameOver
    && !deadStoneMode
    && !ownershipMode
    && isV4PositionSupported();
}

async function refreshAiHints() {
  if (!currentAiHintEnabled()) {
    clearAiHints();
    renderAiHintControls();
    return;
  }
  if (!canShowAiHints()) {
    aiHints = [];
    renderAiHintControls();
    render();
    return;
  }
  if (aiHintLoading) return;

  aiHintLoading = true;
  aiHints = [];
  renderAiHintControls("AI 正在看棋盤...");
  const snapshot = boardKey();
  const hintTurn = turn;
  const hintColor = currentAiHintColor();

  try {
    const legalMoves = legalV4MovesFor(hintColor);
    if (!legalMoves.length) {
      aiHints = [];
      renderAiHintControls("目前沒有合法提示點。");
      return;
    }
    const inference = await runV4Inference(board, hintColor);
    if (snapshot !== boardKey() || hintTurn !== turn || hintColor !== currentAiHintColor() || !canShowAiHints()) return;
    aiHints = chooseV4HintsByDifficulty(legalMoves, inference.policy, currentAiHintStrength(), effectiveAiHintCount()).map((move, index) => ({
      key: move.key,
      label: labelOfKey(move.key),
      rank: index + 1,
    }));
    renderAiHintControls();
  } catch (error) {
    console.warn("AI hint failed", error);
    aiHints = [];
    renderAiHintControls("提示暫時算不出來，先自己下看看也可以。");
  } finally {
    aiHintLoading = false;
    render();
  }
}

function renderAiHintControls(message = null) {
  if (!aiHintToggle) return;
  const isTraditionalMode = playMode === "traditional";
  aiHintToggle.classList.toggle("is-hidden", isTraditionalMode);
  aiHintToggle.setAttribute("aria-pressed", String(aiHintsEnabled));
  aiHintToggle.textContent = aiHintsEnabled ? "AI 提示：開" : "AI 提示：關";
  if (aiHintStrengthControls) {
    aiHintStrengthControls.classList.toggle("is-hidden", isTraditionalMode);
    aiHintStrengthControls.querySelectorAll("[data-ai-hint-strength]").forEach((button) => {
      button.classList.toggle("active", button.dataset.aiHintStrength === aiHintStrength);
    });
  }
  if (colorAiHintToggles) colorAiHintToggles.classList.toggle("is-hidden", !isTraditionalMode);
  if (blackAiHintToggle) {
    blackAiHintToggle.setAttribute("aria-pressed", String(blackAiHintsEnabled));
    blackAiHintToggle.textContent = blackAiHintsEnabled ? "黑 AI 提示：開" : "黑 AI 提示：關";
  }
  if (whiteAiHintToggle) {
    whiteAiHintToggle.setAttribute("aria-pressed", String(whiteAiHintsEnabled));
    whiteAiHintToggle.textContent = whiteAiHintsEnabled ? "白 AI 提示：開" : "白 AI 提示：關";
  }
  if (aiHintCountControls) {
    aiHintCountControls.classList.toggle("is-hidden", usesFixedTwoAiHints());
    aiHintCountControls.setAttribute("aria-disabled", String(usesFixedTwoAiHints()));
  }
  if (aiHintFixedNote) aiHintFixedNote.classList.toggle("is-hidden", !usesFixedTwoAiHints());
  aiStrengthPanel.querySelectorAll("[data-ai-hint-count]").forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.aiHintCount) === aiHintCount);
  });
  if (!aiHintText) return;
  if (message) {
    aiHintText.textContent = message;
  } else if (isTraditionalMode && !blackAiHintsEnabled && !whiteAiHintsEnabled) {
    aiHintText.textContent = "黑白可各自開啟 AI 提示；開啟方輪到自己時會標出 2 個建議點。";
  } else if (!currentAiHintEnabled()) {
    aiHintText.textContent = isTraditionalMode ? `目前輪到${colorName(turn)}，這一方尚未開啟 AI 提示。` : (usesFixedTwoAiHints() ? "打開後，輪到你時會標出 2 個建議點。" : "打開後，輪到你時會在棋盤上標出建議點。");
  } else if (!isV4PositionSupported()) {
    aiHintText.textContent = "目前提示只支援標準 19 路棋盤。";
  } else if (isOnlinePlayMode() && onlineAiHintsEnabled && !onlineState.connected) {
    aiHintText.textContent = "連線後，輪到你時會提示建議點。";
  } else if (!currentAiHintColor()) {
    aiHintText.textContent = "輪到你時會在棋盤上標出建議點。";
  } else if (aiHints.length) {
    aiHintText.textContent = aiHints.map((hint) => hint.label).join("　");
  } else {
    aiHintText.textContent = aiHintLoading ? "AI 正在看棋盤..." : "輪到你時會在棋盤上標出建議點。";
  }
}
function estimateAreaFromBoard(source) {
  const stones = { [BLACK]: 0, [WHITE]: 0 };
  const territory = { [BLACK]: 0, [WHITE]: 0, neutral: 0 };
  const seen = new Set();

  for (const point of points) {
    const color = source[point.key];
    if (color === BLACK || color === WHITE) stones[color] += 1;
  }

  for (const point of points) {
    const startKey = point.key;
    if (source[startKey] !== EMPTY || seen.has(startKey)) continue;

    const region = [];
    const borders = new Set();
    const queue = [startKey];
    seen.add(startKey);

    while (queue.length) {
      const key = queue.shift();
      region.push(key);
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

    const owner = borders.size === 1 ? [...borders][0] : NEUTRAL;
    if (owner === BLACK || owner === WHITE) territory[owner] += region.length;
    else territory.neutral += region.length;
  }

  const blackTotal = stones[BLACK] + territory[BLACK];
  const whiteTotal = stones[WHITE] + territory[WHITE];
  return {
    stones,
    territory,
    blackTotal,
    whiteTotal,
    whiteLead: whiteTotal + KOMI - blackTotal,
  };
}

function getEndgameContactInfo(source, key) {
  const neighborColors = new Set();
  let emptyNeighborCount = 0;
  for (const nextKey of neighborsOfKey(key)) {
    const cell = source[nextKey];
    if (cell === BLACK || cell === WHITE) neighborColors.add(cell);
    if (cell === EMPTY) emptyNeighborCount += 1;
  }

  const owner = source[key] === EMPTY ? inferOwnerByRegion(source, key) : NEUTRAL;
  return {
    owner,
    emptyNeighborCount,
    touchesBlack: neighborColors.has(BLACK),
    touchesWhite: neighborColors.has(WHITE),
    touchesBoth: neighborColors.has(BLACK) && neighborColors.has(WHITE),
    touchesAnyStone: neighborColors.size > 0,
  };
}

function uniqueMoves(moves) {
  const seen = new Set();
  return moves.filter((move) => {
    if (!move || seen.has(move.key)) return false;
    seen.add(move.key);
    return true;
  });
}

function isUnresolvedEndgameBoundaryMove(move) {
  const contact = getEndgameContactInfo(board, move.key);
  if (move.capturedCount > 0) return true;
  if (contact.touchesBoth) return true;
  if (contact.owner === NEUTRAL && contact.touchesAnyStone) return true;
  if (contact.owner === BLACK && contact.touchesWhite) return true;
  if (contact.owner === WHITE && contact.touchesBlack) return true;
  return false;
}

function collectUnresolvedEndgameBoundaryMoves(legalMoves) {
  return legalMoves.filter((move) => {
    if (!isUnresolvedEndgameBoundaryMove(move)) return false;
    return move.capturedCount > 0 || move.liberties >= 2;
  });
}

function rateAiEndgameMove(move, beforeArea, policyLogit = 0) {
  const tactical = estimateAiMove(move);
  const afterArea = estimateAreaFromBoard(move.next);
  const contact = getEndgameContactInfo(board, move.key);
  const scoreGain = afterArea.whiteLead - beforeArea.whiteLead;
  const isOwnTerritoryFill = contact.owner === WHITE
    && !contact.touchesBlack
    && move.capturedCount === 0
    && tactical.rescuedWhiteStones === 0;
  const riskyReply = Math.max(0, tactical.blackReplyCapture - move.capturedCount);

  let boundaryValue = 0;
  if (contact.touchesBoth) boundaryValue += 5.2;
  if (contact.owner === NEUTRAL && contact.touchesAnyStone) boundaryValue += 3.4;
  if (contact.owner === BLACK && contact.touchesWhite) boundaryValue += 2.8;
  if (contact.owner === WHITE && contact.touchesBlack) boundaryValue += 1.4;
  if (contact.emptyNeighborCount === 0 && move.capturedCount === 0) boundaryValue -= 2.2;

  const value =
    scoreGain * 1.55
    + move.capturedCount * 9.5
    + tactical.rescuedWhiteStones * 7.5
    + boundaryValue
    + Math.max(-1.5, Math.min(1.5, policyLogit / 8))
    - riskyReply * 8
    - (move.liberties === 1 ? 6 : 0)
    - (isOwnTerritoryFill ? 8 : 0);

  return {
    ...move,
    endgameValue: value,
    endgameScoreGain: scoreGain,
    endgameContact: contact,
    blackReplyCapture: tactical.blackReplyCapture,
    rescuedWhiteStones: tactical.rescuedWhiteStones,
    endangeredWhiteStones: tactical.endangeredWhiteStones,
    rawScore: tactical.rawScore,
    winRate: tactical.winRate,
  };
}

function chooseAiEndgameMoveOrPass(legalMoves, policy) {
  if (mode !== "square" || size !== 19) return { active: false, pass: false, move: null };

  const afterHumanPass = passCount > 0;
  const canReviewEndgame = afterHumanPass
    ? moveCounter >= AI_ENDGAME_PASS_AFTER_HUMAN_PASS_MIN_MOVES
    : moveCounter >= AI_ENDGAME_PASS_MIN_MOVES;
  if (!canReviewEndgame) return { active: false, pass: false, move: null };

  const beforeArea = estimateAreaFromBoard(board);
  const rankedPolicy = rankV4Moves(legalMoves, policy);
  const policyLogits = new Map(rankedPolicy.map((move) => [move.key, move.logit]));
  const boundaryMoves = collectUnresolvedEndgameBoundaryMoves(legalMoves);
  const rankedTactical = legalMoves
    .map(estimateAiMove)
    .sort((left, right) => right.rawScore - left.rawScore);
  const candidateMoves = uniqueMoves([
    ...boundaryMoves,
    ...rankedPolicy.slice(0, AI_ENDGAME_CANDIDATE_LIMIT),
    ...rankedTactical.slice(0, Math.floor(AI_ENDGAME_CANDIDATE_LIMIT / 2)),
  ]);
  const rated = candidateMoves
    .map((move) => rateAiEndgameMove(move, beforeArea, Number(policyLogits.get(move.key)) || Number(move.logit) || 0))
    .sort((left, right) => {
      const leftBoundary = isUnresolvedEndgameBoundaryMove(left) ? 1 : 0;
      const rightBoundary = isUnresolvedEndgameBoundaryMove(right) ? 1 : 0;
      return (rightBoundary - leftBoundary) || (right.endgameValue - left.endgameValue);
    });

  const best = rated[0] || null;
  if (!best) return { active: true, pass: true, move: null };

  const threshold = afterHumanPass || moveCounter >= AI_ENDGAME_FORCE_REVIEW_MIN_MOVES
    ? AI_ENDGAME_AFTER_PASS_THRESHOLD
    : AI_ENDGAME_PASS_THRESHOLD;
  const hasUrgentTacticalMove = best.capturedCount > 0 || best.rescuedWhiteStones > 0;
  const hasUnresolvedBoundary = boundaryMoves.length > 0;
  const shouldPass = !hasUnresolvedBoundary && !hasUrgentTacticalMove && best.endgameValue < threshold;
  return { active: true, pass: shouldPass, move: shouldPass ? null : best };
}
async function findV4Move() {
  if (!isV4PositionSupported()) throw new Error("V7-Value/Tactical 只支援標準 19 路");
  const legalMoves = points
    .map((point) => previewMove(point.key, WHITE))
    .filter(Boolean);
  if (!legalMoves.length) return null;

  const inference = await runV4Inference(board, WHITE);
  v4WhiteWinRate = inference.whiteWinRate;
  const endgameDecision = chooseAiEndgameMoveOrPass(legalMoves, inference.policy);
  if (endgameDecision.pass) return null;
  const selectedMove = endgameDecision.move || selectV4MoveByDifficulty(legalMoves, inference.policy);
  return selectedMove ? { ...selectedMove, winRate: Math.round(inference.whiteWinRate), engine: V4_MODEL_NAME } : null;
}

async function refreshV4WinRate() {
  if (playMode !== "ai" || !isV4PositionSupported() || gameOver) return;
  const snapshot = boardKey();
  const perspective = turn;
  try {
    const inference = await runV4Inference(board, perspective);
    if (snapshot !== boardKey() || perspective !== turn) return;
    v4WhiteWinRate = inference.whiteWinRate;
    renderWinrate();
  } catch (error) {
    console.warn("V7-Value/Tactical value refresh failed", error);
  }
}

function colorName(color) {
  return color === BLACK ? "黑棋" : "白棋";
}

function opponent(color) {
  return color === BLACK ? WHITE : BLACK;
}

function setTermHint(message) {
  if (termText) termText.textContent = message;
  if (sideTermText) sideTermText.textContent = message;
}

function pointDistance(left, right) {
  return Math.hypot(left.a - right.a, left.b - right.b);
}

function localStones(source, key, color, radius = 4) {
  const origin = parseKey(key);
  return points
    .filter((point) => source[point.key] === color)
    .map((point) => ({ ...point, distance: pointDistance(origin, point) }))
    .filter((point) => point.distance > 0 && point.distance <= radius)
    .sort((left, right) => left.distance - right.distance);
}

function hasStoneNearCorner(source, color, cornerX, cornerY, radius = 4) {
  return points.some((point) => {
    if (source[point.key] !== color) return false;
    return Math.abs(point.a - cornerX) <= radius && Math.abs(point.b - cornerY) <= radius;
  });
}

function nearestCorner(a, b) {
  const corners = [
    { x: 0, y: 0 },
    { x: size - 1, y: 0 },
    { x: 0, y: size - 1 },
    { x: size - 1, y: size - 1 },
  ];
  return corners
    .map((corner) => ({ ...corner, distance: Math.hypot(a - corner.x, b - corner.y) }))
    .sort((left, right) => left.distance - right.distance)[0];
}

function cornerOpeningTerm(key, color, source) {
  if (mode !== "square" || moveCounter > 45) return null;
  const { a, b } = parseKey(key);
  const corner = nearestCorner(a, b);
  if (!corner || corner.distance > 6) return null;
  const enemy = opponent(color);
  const hasEnemyCorner = hasStoneNearCorner(source, enemy, corner.x, corner.y, 5);
  const hasFriendlyCorner = hasStoneNearCorner(source, color, corner.x, corner.y, 5);
  if (hasEnemyCorner) {
    return {
      name: "\u639b\u89d2",
      description: "\u5728\u5c0d\u65b9\u89d2\u90e8\u9644\u8fd1\u843d\u5b50\uff0c\u901a\u5e38\u662f\u60f3\u5e72\u64fe\u6216\u722d\u596a\u89d2\u90e8\u52e2\u529b\u3002",
    };
  }
  if (hasFriendlyCorner) {
    return {
      name: "\u5b88\u89d2",
      description: "\u88dc\u5f37\u81ea\u5df1\u7684\u89d2\u90e8\uff0c\u8b93\u89d2\u5730\u66f4\u7a69\uff0c\u4e5f\u6bd4\u8f03\u4e0d\u6015\u88ab\u6253\u5165\u3002",
    };
  }
  return {
    name: "\u4f54\u89d2",
    description: "\u5148\u5728\u7a7a\u89d2\u843d\u5b50\uff0c\u56e0\u70ba\u89d2\u90e8\u6700\u5bb9\u6613\u505a\u5730\u8207\u5b89\u5b9a\u3002",
  };
}

function relationTermFromFriendlyStone(key, color, source) {
  const friends = localStones(source, key, color, 4);
  if (!friends.length) return null;
  const origin = parseKey(key);
  for (const friend of friends) {
    const dx = Math.abs(origin.a - friend.a);
    const dy = Math.abs(origin.b - friend.b);
    if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
      const edgeDistance = Math.min(origin.a, origin.b, size - 1 - origin.a, size - 1 - origin.b);
      return edgeDistance <= 2
        ? { name: "\u7acb", description: "\u6cbf\u8457\u908a\u7dda\u5411\u5916\u88dc\u4e00\u624b\uff0c\u5e38\u7528\u4f86\u7a69\u5b9a\u908a\u4e0a\u7684\u68cb\u5f62\u6216\u9632\u6b62\u88ab\u58d3\u8feb\u3002" }
        : { name: "\u9577", description: "\u8cbc\u8457\u81ea\u5df1\u7684\u68cb\u5b50\u5f80\u524d\u5ef6\u4f38\u4e00\u624b\uff0c\u662f\u589e\u52a0\u6c23\u548c\u9023\u7d61\u7684\u57fa\u672c\u4e0b\u6cd5\u3002" };
    }
    if (dx === 1 && dy === 1) {
      return { name: "\u5c16", description: "\u659c\u8457\u8d70\u4e00\u6b65\u7684\u624b\u6bb5\uff0c\u5f62\u72c0\u6bd4\u8f03\u8f15\u5feb\uff0c\u4f46\u4e2d\u9593\u6709\u88ab\u5207\u65b7\u7684\u53ef\u80fd\u3002" };
    }
    if ((dx === 1 && dy === 2) || (dx === 2 && dy === 1)) {
      return { name: "\u5c0f\u98db", description: "\u5c0f\u99ac\u6b65\u5ef6\u4f38\u68cb\u5f62\uff0c\u901f\u5ea6\u548c\u9023\u7d61\u611f\u517c\u5177\uff0c\u662f\u5e03\u5c40\u8207\u4e2d\u76e4\u5e38\u898b\u7684\u8d70\u6cd5\u3002" };
    }
    if (dx === 2 && dy === 2) {
      return { name: "\u5927\u98db", description: "\u6bd4\u5c0f\u98db\u66f4\u5bec\u7684\u5ef6\u4f38\uff0c\u901f\u5ea6\u5feb\uff0c\u4f46\u4e5f\u8f03\u5bb9\u6613\u7559\u4e0b\u88ab\u5207\u65b7\u7684\u5473\u9053\u3002" };
    }
    if ((dx === 2 && dy === 0) || (dx === 0 && dy === 2)) {
      return { name: "\u4e00\u9593\u8df3", description: "\u9694\u4e00\u8def\u5411\u5916\u8df3\u51fa\uff0c\u5e38\u7528\u4f86\u51fa\u982d\u3001\u9023\u7d61\u6216\u64f4\u5f35\u3002" };
    }
    if ((dx === 3 && dy === 0) || (dx === 0 && dy === 3)) {
      return { name: "\u4e8c\u9593\u8df3", description: "\u9694\u5169\u8def\u5411\u5916\u8df3\u51fa\uff0c\u901f\u5ea6\u66f4\u5feb\uff0c\u4f46\u9700\u8981\u6ce8\u610f\u4e2d\u9593\u662f\u5426\u6703\u88ab\u5207\u65b7\u3002" };
    }
  }
  return null;
}

function tacticalTerm(key, color, source, capturedCount) {
  if (capturedCount > 0) {
    return {
      name: "\u63d0\u5b50",
      description: "\u9019\u624b\u62ff\u6389\u5c0d\u65b9 " + capturedCount + " \u9846\u68cb\u5b50\uff0c\u76f4\u63a5\u8b93\u5c40\u90e8\u6230\u9b25\u6539\u8b8a\u3002",
    };
  }
  const enemy = opponent(color);
  const neighbors = neighborsOfKey(key);
  const friendlyNeighbors = neighbors.filter((nextKey) => source[nextKey] === color);
  const enemyNeighbors = neighbors.filter((nextKey) => source[nextKey] === enemy);
  if (enemyNeighbors.length >= 2) {
    return {
      name: "\u65b7",
      description: "\u4e0b\u5728\u5c0d\u65b9\u68cb\u5b50\u4e4b\u9593\uff0c\u50cf\u662f\u60f3\u5207\u65b7\u5c0d\u65b9\u7684\u9023\u7d61\u3002",
    };
  }
  if (friendlyNeighbors.length >= 2) {
    return {
      name: "\u63a5",
      description: "\u628a\u81ea\u5df1\u7684\u68cb\u5b50\u9023\u8d77\u4f86\uff0c\u8b93\u68cb\u5f62\u66f4\u5b8c\u6574\uff0c\u964d\u4f4e\u88ab\u5207\u65b7\u7684\u98a8\u96aa\u3002",
    };
  }
  if (enemyNeighbors.length === 1) {
    return {
      name: "\u78b0\uff0f\u9760",
      description: "\u8cbc\u8457\u5c0d\u65b9\u68cb\u5b50\u4e0b\uff0c\u901a\u5e38\u662f\u60f3\u767c\u8d77\u63a5\u89f8\u6230\u6216\u58d3\u7e2e\u5c0d\u65b9\u3002",
    };
  }
  return null;
}

function explainMoveTerm(key, color, source, capturedCount) {
  if (mode !== "square") {
    return colorName(color) + " " + labelOfKey(key) + "\uff1a\u76ee\u524d\u8853\u8a9e\u63d0\u793a\u5148\u652f\u63f4\u6a19\u6e96\u65b9\u683c\u68cb\u76e4\u3002";
  }
  const term = tacticalTerm(key, color, source, capturedCount)
    || cornerOpeningTerm(key, color, source)
    || relationTermFromFriendlyStone(key, color, source)
    || { name: "\u843d\u5b50", description: "\u9019\u624b\u5148\u627e\u4e0d\u5230\u660e\u986f\u8853\u8a9e\uff0c\u53ef\u4ee5\u628a\u5b83\u770b\u6210\u4e00\u822c\u7684\u5c40\u90e8\u88dc\u5f37\u6216\u4f48\u5c40\u3002" };
  return colorName(color) + " " + labelOfKey(key) + "\uff1a" + term.name + "\u3002" + term.description;
}

function updateTermHint(key, color, source, capturedCount) {
  setTermHint(explainMoveTerm(key, color, source, capturedCount));
}

function updatePlayModeClass() {
  if (!gameShell) return;
  gameShell.classList.toggle("play-mode-ai", playMode === "ai");
  gameShell.classList.toggle("play-mode-traditional", playMode === "traditional");
  gameShell.classList.toggle("play-mode-online", playMode === "online");
}

function startGame(nextPlayMode) {
  playMode = nextPlayMode;
  updatePlayModeClass();
  onlineAiHintsEnabled = false;
  if (playMode !== "ai") aiHintsEnabled = false;
  blackAiHintsEnabled = false;
  whiteAiHintsEnabled = false;
  aiThinking = false;
  startScreen.classList.add("is-hidden");
  gameShell.classList.remove("is-hidden");
  resetGame("square", 19);
  if (playMode === "ai") {
    setStatus("AI 對弈：你執黑先下，V7-Value/Tactical 載入中。");
    prepareV4Model().then(() => {
      if (playMode === "ai" && turn === BLACK && moveCounter === 0) {
        setStatus("AI 對弈：你執黑先下，V7-Value/Tactical 已就緒。");
      }
      renderAiStrength();
    }).catch(() => renderAiStrength());
  } else {
    setStatus("傳統下棋：黑棋先下，可開啟 AI 提示輔助。");
  }
  render();
}

function showMainMenu() {
  aiThinking = false;
  onlineAiHintsEnabled = false;
  resetOnlineConnection();
  gameShell.classList.add("is-hidden");
  gameShell.classList.remove("play-mode-ai", "play-mode-traditional", "play-mode-online");
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
  if ((!scoreState && !resignationState) || moveCounter === 0) return;
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
    score: resignationState ? {
      type: "resign",
      winner: resignationState.winner,
      loser: resignationState.loser,
      margin: 0,
    } : {
      type: "area",
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
  resignationState = null;
  endgamePromptShown = false;
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
    detail.textContent = record.score?.type === "resign"
      ? `${formatHistoryTime(record.finishedAt)} · ${record.moves} 手 · ${colorName(record.score.loser)}投降，${colorName(record.score.winner)}勝`
      : `${formatHistoryTime(record.finishedAt)} · ${record.moves} 手 · ${colorName(record.score.winner)}勝 ${record.score.margin.toFixed(1)} 點`;
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
    resignationState: resignationState ? { ...resignationState } : null,
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
  resignationState = state.resignationState ? { ...state.resignationState } : null;
  endgamePromptShown = Boolean(gameOver && passCount >= 2);
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
  if (strength.protectWeak && hasWhiteDanger && rescueMoves.length) {
    movePool = rescueMoves;
  } else if (strength.protectWeak && saferMoves.length) {
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
  const snapshot = boardKey();
  setStatus(isV4PositionSupported() ? "V7-Value/Tactical 思考中..." : "備援 AI 思考中...");

  window.setTimeout(async () => {
    let aiMove = null;
    let usedFallback = false;
    try {
      aiMove = isV4PositionSupported() ? await findV4Move() : findAiMove();
    } catch (error) {
      console.warn("V7-Value/Tactical inference failed; using fallback AI", error);
      setV4ModelStatus("fallback", "推論失敗，使用備援 AI");
      aiMove = findAiMove();
      usedFallback = true;
    }

    if (playMode !== "ai" || gameOver || turn !== WHITE || snapshot !== boardKey()) {
      aiThinking = false;
      return;
    }
    aiThinking = false;
    if (aiMove) {
      const label = labelOfKey(aiMove.key);
      tryPlay(aiMove.key, true);
      const engineLabel = usedFallback || aiMove.engine !== V4_MODEL_NAME ? "備援 AI" : V4_MODEL_NAME;
      setStatus(`${engineLabel} 下在 ${label}。輪到黑棋。`);
      refreshV4WinRate();
    } else {
      aiPass();
    }
    renderAiStrength();
  }, 180);
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
  if (passCount >= 2) promptEndgameCleanup();
  refreshAiHints();
}

function tryPlay(key, fromAi = false) {
  clearPendingMove();
  if (!fromAi && !canActOnline()) return;
  if (ownershipMode) return cycleOwnership(key);
  if (deadStoneMode) return removeDeadGroup(key);
  if (!fromAi) clearAiHints();

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
  const beforeMoveBoard = board;
  const playedColor = turn;
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
  log.push(`${colorName(turn)} ${labelOfKey(key)}${capturedCount ? `\uff0c\u63d0 ${capturedCount} \u5b50` : ""}`);
  updateTermHint(key, playedColor, beforeMoveBoard, capturedCount);
  previousBoardKey = snapshotKey;
  turn = enemy;
  passCount = 0;
  scoreState = null;
  scoreVisible = false;
  resignationState = null;
  endgamePromptShown = false;
  setStatus(capturedCount ? `提掉 ${capturedCount} 子，輪到 ${colorName(turn)}。` : `輪到 ${colorName(turn)}。`);
  render();
  sendOnlineState("move");
  updateOnlineStatus();
  scheduleAiMove();
  if (playMode !== "ai" || fromAi) refreshAiHints();
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
  sendOnlineState("dead-remove");
  updateOnlineStatus();
}

function startEndgameCleanup() {
  scoreState = scoreState || calculateAreaScore();
  scoreVisible = true;
  deadStoneMode = true;
  ownershipMode = false;
  gameOver = true;
  setStatus("進入終局整理。請提死子、校正歸屬，再確認終局。");
  render();
  sendOnlineState("endgame-cleanup");
  updateOnlineStatus();
}

function continueAfterDoublePass() {
  if (!gameOver || passCount < 2 || resignationState) return;
  pushHistory();
  gameOver = false;
  scoreState = null;
  scoreVisible = false;
  deadStoneMode = false;
  ownershipMode = false;
  passCount = 0;
  turn = opponent(turn);
  endgamePromptShown = false;
  setStatus(`繼續下棋，輪到 ${colorName(turn)}。`);
  render();
  sendOnlineState("continue-after-pass");
  updateOnlineStatus();
  scheduleAiMove();
  refreshAiHints();
}

function promptEndgameCleanup() {
  if (endgamePromptShown || !gameOver || passCount < 2 || resignationState) return;
  endgamePromptShown = true;
  showConfirmDialog({
    title: "進入終局整理？",
    message: "雙方已連續 Pass。可以開始提死子、校正歸屬並數子；如果有人按錯 Pass，也可以繼續下棋。",
    confirmText: "開始整理",
    cancelText: "繼續下棋",
    onConfirm: startEndgameCleanup,
    onCancel: continueAfterDoublePass,
  });
}

function passTurn() {
  clearPendingMove();
  clearAiHints();
  if (!canActOnline()) return;
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
  sendOnlineState("pass");
  updateOnlineStatus();
  if (passCount >= 2) promptEndgameCleanup();
  scheduleAiMove();
  if (playMode !== "ai") refreshAiHints();
}

function resignGame() {
  clearPendingMove();
  clearAiHints();
  if (gameOver) {
    setStatus("棋局已結束。");
    return;
  }
  if (deadStoneMode || ownershipMode) {
    setStatus("請先離開校正或提死子模式，再投降。");
    return;
  }
  if (playMode === "ai" && turn === WHITE) {
    setStatus("AI 正在思考，請等白棋行動後再投降。");
    return;
  }
  if (playMode === "online" && !onlineState.applyingRemote) {
    if (!onlineState.connected) {
      setStatus("連線房間還沒有接上，等朋友進來後再投降。");
      return;
    }
  }
  const loser = playMode === "online" && onlineState.color ? onlineState.color : turn;
  const winner = opponent(loser);
  pushHistory();
  resignationState = { loser, winner };
  gameOver = true;
  deadStoneMode = false;
  ownershipMode = false;
  scoreState = null;
  scoreVisible = false;
  log.push(`${colorName(loser)}投降，${colorName(winner)}勝`);
  saveFinishedGame();
  setStatus(`${colorName(loser)}投降，${colorName(winner)}勝。`);
  render();
  sendOnlineState("resign");
  updateOnlineStatus();
}

function requestResign() {
  clearPendingMove();
  if (gameOver) {
    setStatus("棋局已結束。");
    return;
  }
  const loser = playMode === "online" && onlineState.color ? onlineState.color : turn;
  showConfirmDialog({
    title: "確認投降",
    message: `${colorName(loser)}確定要投降嗎？確認後本局直接結束。`, 
    confirmText: "投降",
    onConfirm: resignGame,
  });
}

function undo() {
  if (playMode === "online" && !onlineState.applyingRemote) {
    requestOnlineAction("undo");
    return;
  }
  performUndo();
}

function performUndo() {
  clearPendingMove();
  if (playMode === "online" && !onlineState.applyingRemote && !onlineState.connected) {
    setStatus("連線房間還沒有接上，等朋友進來後再悔棋。");
    return;
  }
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
  sendOnlineState("undo");
  updateOnlineStatus();
  refreshAiHints();
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
  sendOnlineState("ownership");
  updateOnlineStatus();
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
  sendOnlineState("dead-mark");
  updateOnlineStatus();
}

function ownerName(owner) {
  if (owner === BLACK) return "黑地";
  if (owner === WHITE) return "白地";
  return "中立點";
}

function showScore() {
  if (playMode === "online" && !onlineState.applyingRemote && !scoreState) {
    requestOnlineAction("score");
    return;
  }
  performShowScore();
}

function performShowScore() {
  if (scoreState && scoreVisible) {
    scoreVisible = false;
    deadStoneMode = false;
    ownershipMode = false;
    setStatus("已隱藏黑地、白地與中立點標記；數子結果仍保留。");
    render();
    sendOnlineState("score-hide");
    updateOnlineStatus();
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
  sendOnlineState("score");
  updateOnlineStatus();
}

function confirmFinalResult() {
  clearPendingMove();
  clearAiHints();
  if (!scoreState) scoreState = calculateAreaScore();
  scoreVisible = true;
  gameOver = true;
  deadStoneMode = false;
  ownershipMode = false;
  saveFinishedGame();
  setStatus("終局已確認，棋局已保存到歷史棋局。");
  render();
  sendOnlineState("final-confirm");
  updateOnlineStatus();
}

function requestFinalConfirm() {
  if (playMode === "online" && !onlineState.applyingRemote) {
    requestOnlineAction("final-confirm");
    return;
  }
  showConfirmDialog({
    title: "確認終局",
    message: "要確認目前結果並保存棋局嗎？若死子或歸屬還沒校正，請先校正再確認。",
    confirmText: "確認終局",
    onConfirm: confirmFinalResult,
  });
}

function buildTextRecord() {
  const lines = [];
  lines.push("棋盤小棋室 棋譜");
  lines.push(`日期：${new Date().toLocaleString("zh-TW")}`);
  lines.push(`棋盤：${mode} ${size}`);
  lines.push(`手數：${moveCounter}`);
  if (resignationState) lines.push(`結果：${colorName(resignationState.loser)}投降，${colorName(resignationState.winner)}勝`);
  else if (scoreState) lines.push(`結果：${colorName(scoreState.winner)}勝 ${scoreState.margin.toFixed(1)} 點`);
  else lines.push("結果：尚未判定");
  lines.push("");
  lines.push("棋譜：");
  if (log.length) lines.push(...log.map((item, index) => `${index + 1}. ${item}`));
  else lines.push("尚無落子紀錄");
  return lines.join("\n");
}

function exportGameRecord() {
  const text = buildTextRecord();
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `go-board-room-${new Date().toISOString().slice(0, 10)}.txt`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setStatus("已匯出文字棋譜。");
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
  resignationState = null;
  endgamePromptShown = false;
  v4WhiteWinRate = null;
  setStatus("\u9ed1\u68cb\u5148\u4e0b");
  setTermHint("\u843d\u5b50\u5f8c\u6703\u986f\u793a\u5e38\u898b\u8853\u8a9e\uff0c\u4f8b\u5982\u9577\u3001\u7acb\u3001\u63a5\u3001\u65b7\u3001\u5c0f\u98db\u6216\u639b\u89d2\u3002");
  render();
  sendOnlineState("new-game");
  updateOnlineStatus();
}

function setStatus(message) {
  statusText.textContent = message;
  if (sideStatusText) sideStatusText.textContent = message;
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
  renderAiHintControls();
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
    ctx.fillStyle = owner === BLACK ? "rgba(18, 22, 28, 0.7)" : owner === WHITE ? "rgba(255, 255, 255, 0.9)" : "rgba(172, 78, 56, 0.76)";
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
  drawAiHints();
  drawPendingMove();
}


function drawAiHints() {
  if (!currentAiHintEnabled() || !aiHints.length || !isAiHintPlayMode() || !currentAiHintColor()) return;
  ctx.save();
  for (const hint of aiHints) {
    if (board[hint.key] !== EMPTY) continue;
    const point = points.find((item) => item.key === hint.key);
    if (!point) continue;
    const { x, y } = pointToPixel(point);
    const radius = layout.stoneRadius * 0.72;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(45, 111, 109, 0.18)";
    ctx.fill();
    ctx.strokeStyle = "#1f8f83";
    ctx.lineWidth = Math.max(2, layout.stoneRadius * 0.14);
    ctx.stroke();

  }
  ctx.restore();
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
  if (resignationState) {
    blackAreaEl.textContent = "-";
    whiteAreaEl.textContent = "-";
    blackBreakdownEl.textContent = "投降終局";
    whiteBreakdownEl.textContent = "投降終局";
    scoreIntro.textContent = `${colorName(resignationState.loser)}投降，本局由${colorName(resignationState.winner)}獲勝。`;
    winnerText.textContent = `${colorName(resignationState.winner)}勝。`;
    marginText.textContent = "本局以投降結束，不使用數子法計算目差。";
    rowBreakdown.innerHTML = `<tr><td colspan="8">${colorName(resignationState.loser)}投降</td></tr>`;
    return;
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
  const heuristicWhiteRate = estimatePositionWhiteWinRate(board, captures);
  const hasV4Rate = playMode === "ai" && Number.isFinite(v4WhiteWinRate);
  const whiteRate = hasV4Rate ? Math.round(v4WhiteWinRate) : heuristicWhiteRate;
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
  const previewHeuristicWhiteRate = estimatePositionWhiteWinRate(preview.next, previewCaptures);
  const previewWhiteRate = Math.max(0, Math.min(100, whiteRate + previewHeuristicWhiteRate - heuristicWhiteRate));
  const previewBlackRate = 100 - previewWhiteRate;
  const previewStart = Math.min(blackRate, previewBlackRate);
  const previewWidth = Math.max(2, Math.abs(previewBlackRate - blackRate));
  winratePreviewBar.style.left = `${previewStart}%`;
  winratePreviewBar.style.width = `${previewWidth}%`;
  winratePreviewBar.classList.add("is-visible");
}

function renderAiStrength() {
  aiStrengthPanel.classList.toggle("is-hidden", playMode === "online" && !onlineAiHintsEnabled);
  const isTraditionalMode = playMode === "traditional";
  if (aiModelStatus) aiModelStatus.textContent = v4ModelMessage;
  if (generalAiStrengthControls) generalAiStrengthControls.classList.toggle("is-hidden", isTraditionalMode);
  if (colorAiStrengthControls) colorAiStrengthControls.classList.toggle("is-hidden", !isTraditionalMode);

  const strengthKey = isTraditionalMode ? aiStrengthForColor(turn) : aiStrength;
  const strength = AI_STRENGTHS[strengthKey] || AI_STRENGTHS.low;
  if (aiDifficultyText) {
    if (isTraditionalMode) {
      const blackLabel = AI_STRENGTHS[blackAiStrength]?.label || AI_STRENGTHS.low.label;
      const whiteLabel = AI_STRENGTHS[whiteAiStrength]?.label || AI_STRENGTHS.low.label;
      aiDifficultyText.textContent = `黑 AI：${blackLabel}，白 AI：${whiteLabel}。目前輪到${colorName(turn)}，使用${strength.label}強度提示。`;
    } else {
      aiDifficultyText.textContent = strength.note;
    }
  }
  aiStrengthPanel.querySelectorAll("[data-ai-strength]").forEach((button) => {
    button.classList.toggle("active", button.dataset.aiStrength === aiStrength);
  });
  aiStrengthPanel.querySelectorAll("[data-color-ai-strength]").forEach((button) => {
    const [color, value] = button.dataset.colorAiStrength.split(":");
    const active = color === "black" ? value === blackAiStrength : value === whiteAiStrength;
    button.classList.toggle("active", active);
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

function showConfirmDialog({ title, message, confirmText, cancelText = "留下", hideCancel = false, onConfirm, onCancel = null }) {
  pendingConfirmAction = onConfirm;
  pendingCancelAction = onCancel;
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
  pendingCancelAction = null;
  confirmDialog.classList.add("is-hidden");
}

function showMainMenu() {
  aiThinking = false;
  onlineAiHintsEnabled = false;
  resetOnlineConnection();
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
  if (playMode === "online" && !onlineState.applyingRemote && hasStartedGame()) {
    requestOnlineAction("new-game");
    return;
  }
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


const LOBBY_LABELS = {
  board: {
    standard: "標準",
    six: "六氣",
    torus: "甜甜圈",
  },
  assist: {
    off: "一般對局",
    on: "AI 提示對局",
  },
  rank: {
    beginner: "新手友善",
    casual: "普通棋感",
    steady: "熟手切磋",
  },
};

function getLobbyChoice(name, fallback) {
  return document.querySelector(`[data-lobby-${name}][aria-pressed="true"]`)?.dataset[`lobby${name[0].toUpperCase()}${name.slice(1)}`] || fallback;
}

function getLobbySettings() {
  return {
    board: getLobbyChoice("board", "standard"),
    size: getLobbyChoice("size", "19"),
    assist: getLobbyChoice("assist", "off"),
    rank: getLobbyChoice("rank", "beginner"),
  };
}

function getMatchServerUrl() {
  const stored = localStorage.getItem(MATCH_SERVER_URL_KEY);
  const isPublicSite = window.location.hostname.endsWith("github.io");
  const isOldLocalServer = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/i.test(stored || "");
  if (isPublicSite && isOldLocalServer) {
    localStorage.removeItem(MATCH_SERVER_URL_KEY);
    return DEFAULT_MATCH_SERVER_URL;
  }
  return (stored || DEFAULT_MATCH_SERVER_URL).replace(/\/+$/, "");
}

function getMatchPlayerId() {
  let id = sessionStorage.getItem(MATCH_PLAYER_ID_KEY);
  if (!id) {
    id = `player-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(MATCH_PLAYER_ID_KEY, id);
  }
  return id;
}

function boardModeFromLobby(boardName) {
  if (boardName === "six") return "hex";
  if (boardName === "torus") return "torus";
  return "square";
}

function simpleHashText(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36).toUpperCase();
}

function lobbyMatchRoom(settings) {
  const bucket = Math.floor(Date.now() / 120000);
  return normalizeRoomCode(`M${simpleHashText(`${settings.board}-${settings.size}-${settings.assist}-${settings.rank}-${bucket}`)}`);
}
function onlineOptionsFromLobbySettings(settings) {
  return {
    mode: boardModeFromLobby(settings.board),
    size: Number(settings.size) || 19,
  };
}

function setLobbyWaitingState(isWaiting, message = "") {
  matchmakingState.active = isWaiting;
  if (publicLobbyBtn) publicLobbyBtn.textContent = isWaiting ? "取消等待" : "等待配對";
  if (lobbyConnectionText) lobbyConnectionText.textContent = isWaiting ? "等待中" : "配對大廳";
  if (message && lobbyQueueSummary) lobbyQueueSummary.textContent = message;
}

async function matchServerRequest(path, options = {}) {
  const response = await fetch(`${getMatchServerUrl()}${path}`, {
    cache: "no-store",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!response.ok) throw new Error(`match server ${response.status}`);
  return response.json();
}

function clearMatchPolling() {
  if (matchmakingState.timer) window.clearTimeout(matchmakingState.timer);
  matchmakingState.timer = null;
}

async function cancelMatchmaking() {
  const ticketId = matchmakingState.ticketId;
  clearMatchPolling();
  matchmakingState.ticketId = null;
  setLobbyWaitingState(false);
  renderLobbyPreview();
  if (ticketId) {
    try {
      await matchServerRequest("/api/cancel", {
        method: "POST",
        body: JSON.stringify({ ticketId }),
      });
    } catch {}
  }
}

function handleMatchResult(result) {
  if (!result || result.status !== "matched") return false;
  clearMatchPolling();
  matchmakingState.ticketId = null;
  setLobbyWaitingState(false);
  const settings = result.settings || getLobbySettings();
  const withAiHint = settings.assist === "on";
  const options = onlineOptionsFromLobbySettings(settings);
  if (result.role === "host") {
    startOnlineHost(withAiHint, { room: result.room, ...options });
  } else {
    setLobbyWaitingState(true, "配對成功，正在進入棋局。");
    window.setTimeout(() => startOnlineGuest(result.room, withAiHint, options), 2200);
  }
  return true;
}

function pollMatchmaking(ticketId) {
  clearMatchPolling();
  matchmakingState.timer = window.setTimeout(async () => {
    try {
      const result = await matchServerRequest(`/api/status/${encodeURIComponent(ticketId)}`);
      if (handleMatchResult(result)) return;
      const settings = result.settings || getLobbySettings();
      const boardText = LOBBY_LABELS.board[settings.board] || "標準";
      const assistText = LOBBY_LABELS.assist[settings.assist] || "一般對局";
      setLobbyWaitingState(true, `正在等待：${boardText} ${settings.size} 路，${assistText}。開第二個頁籤按一樣條件，就能配對測試。`);
      pollMatchmaking(ticketId);
    } catch (error) {
      clearMatchPolling();
      matchmakingState.ticketId = null;
      setLobbyWaitingState(false);
      showConfirmDialog({
        title: "配對伺服器斷線",
        message: "目前連不到配對伺服器。你仍然可以先用好友約戰，或確認本機 match-server.js 有沒有啟動。",
        confirmText: "好友約戰",
        cancelText: "先不要",
        onConfirm: startLobbyFriendlyRoom,
      });
    }
  }, 1200);
}

async function startPeerRendezvousMatchmaking(settings = getLobbySettings()) {
  const boardText = LOBBY_LABELS.board[settings.board] || "標準";
  const assistText = LOBBY_LABELS.assist[settings.assist] || "一般對局";
  const room = lobbyMatchRoom(settings);
  const withAiHint = settings.assist === "on";
  const options = onlineOptionsFromLobbySettings(settings);
  setLobbyWaitingState(true, `正在進入配對：${boardText} ${settings.size} 路，${assistText}。`);

  try {
    const Peer = await loadPeerJs();
    const knownPeerIds = await listPeerIds(Peer);
    if (knownPeerIds.includes(onlinePeerId(room))) {
      await startOnlineGuest(room, withAiHint, options);
      return;
    }
    const joined = await tryJoinPeerMatch(Peer, room, withAiHint, options);
    if (joined) return;
    await startOnlineHost(withAiHint, { room, ...options });
    setStatus(`配對中：${boardText} ${settings.size} 路。另一位玩家選一樣條件，就會加入這局。`);
  } catch (error) {
    console.error("peer matchmaking failed", error);
    showConfirmDialog({
      title: "配對連線載入失敗",
      message: "目前無法載入配對連線服務。你仍然可以先用好友約戰。",
      confirmText: "好友約戰",
      cancelText: "先不要",
      onConfirm: startLobbyFriendlyRoom,
    });
  }
}
async function startMatchmaking() {
  if (matchmakingState.active) {
    await cancelMatchmaking();
    return;
  }
  const settings = getLobbySettings();
  const boardText = LOBBY_LABELS.board[settings.board] || "標準";
  const assistText = LOBBY_LABELS.assist[settings.assist] || "一般對局";
  setLobbyWaitingState(true, `正在送出：${boardText} ${settings.size} 路，${assistText}。`);
  try {
    const result = await matchServerRequest("/api/match", {
      method: "POST",
      body: JSON.stringify({ playerId: getMatchPlayerId(), settings }),
    });
    if (handleMatchResult(result)) return;
    matchmakingState.ticketId = result.ticketId;
    setLobbyWaitingState(true, `正在等待：${boardText} ${settings.size} 路，${assistText}。開第二個頁籤按一樣條件，就能配對測試。`);
    pollMatchmaking(result.ticketId);
  } catch (error) {
    clearMatchPolling();
    matchmakingState.ticketId = null;
    setLobbyWaitingState(false);
    const isLocalPage = ["localhost", "127.0.0.1", ""].includes(window.location.hostname) || window.location.protocol === "file:";
    if (isLocalPage) {
      setLobbyWaitingState(true, "本機配對伺服器未連線，改用瀏覽器配對中。");
      await startPeerRendezvousMatchmaking(settings);
      return;
    }
    showConfirmDialog({
      title: "公開配對伺服器尚未上線",
      message: "公開配對服務暫時連不上。你仍然可以先用好友約戰，或稍後再試一次。",
      confirmText: "好友約戰",
      cancelText: "先不要",
      onConfirm: startLobbyFriendlyRoom,
    });
  }
}
function renderLobbyPreview() {
  const settings = getLobbySettings();
  const boardText = LOBBY_LABELS.board[settings.board] || "標準";
  const assistText = LOBBY_LABELS.assist[settings.assist] || "一般對局";
  const rankText = LOBBY_LABELS.rank[settings.rank] || "新手友善";
  if (lobbyConnectionText) lobbyConnectionText.textContent = "配對大廳";
  if (lobbyOnlineCount) lobbyOnlineCount.textContent = "--";
  if (lobbyRoomCount) lobbyRoomCount.textContent = "--";
  if (lobbyQueueSummary) lobbyQueueSummary.textContent = `你要排：${boardText} ${settings.size} 路，${assistText}，${rankText}。`;
}

function selectLobbyOption(button) {
  const group = button.closest(".lobby-segment");
  if (!group) return;
  group.querySelectorAll("button").forEach((option) => {
    option.setAttribute("aria-pressed", option === button ? "true" : "false");
  });
  renderLobbyPreview();
}

function startLobbyFriendlyRoom() {
  const settings = getLobbySettings();
  startOnlineSetup(settings.assist === "on");
}

function loadPeerJs() {
  if (window.Peer) return Promise.resolve(window.Peer);
  if (peerJsPromise) return peerJsPromise;
  peerJsPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = PEERJS_URL;
    script.async = true;
    script.onload = () => window.Peer ? resolve(window.Peer) : reject(new Error("PeerJS not available"));
    script.onerror = () => reject(new Error("PeerJS load failed"));
    document.head.append(script);
  });
  return peerJsPromise;
}

function makeRoomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function normalizeRoomCode(value) {
  return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
}

function onlinePeerId(room) {
  return `${ONLINE_ROOM_PREFIX}${room.toLowerCase()}`;
}

function peerOptions() {
  return {
    debug: 1,
    config: { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] },
  };
}

function listPeerIds(Peer) {
  return new Promise((resolve) => {
    let settled = false;
    let probe = null;
    const finish = (items = []) => {
      if (settled) return;
      settled = true;
      try { probe?.destroy(); } catch {}
      resolve(Array.isArray(items) ? items : []);
    };
    probe = new Peer(undefined, peerOptions());
    const timer = window.setTimeout(() => finish([]), 2500);
    probe.on("open", () => {
      if (typeof probe.listAllPeers !== "function") {
        window.clearTimeout(timer);
        finish([]);
        return;
      }
      probe.listAllPeers((items) => {
        window.clearTimeout(timer);
        finish(items);
      });
    });
    probe.on("error", () => {
      window.clearTimeout(timer);
      finish([]);
    });
  });
}

function prepareOnlineBoard(role, color, room, withAiHint, options, extra = "") {
  resetOnlineConnection();
  playMode = "online";
  updatePlayModeClass();
  onlineAiHintsEnabled = Boolean(withAiHint);
  aiHintsEnabled = false;
  onlineState.role = role;
  onlineState.color = color;
  onlineState.room = room;
  startScreen.classList.add("is-hidden");
  gameShell.classList.remove("is-hidden");
  resetGame(options.mode || "square", Number(options.size) || 19);
  updateOnlineStatus(extra);
}

function tryJoinPeerMatch(Peer, room, withAiHint, options) {
  return new Promise((resolve) => {
    let settled = false;
    prepareOnlineBoard("guest", WHITE, room, withAiHint, options, "尋找對手");
    const finish = (joined) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      if (!joined) resetOnlineConnection();
      resolve(joined);
    };
    const timer = window.setTimeout(() => finish(false), 8000);
    const peer = new Peer(undefined, peerOptions());
    onlineState.peer = peer;
    peer.on("open", () => {
      const conn = peer.connect(onlinePeerId(room), { reliable: true });
      attachOnlineConnection(conn);
      conn.on("open", () => finish(true));
      conn.on("error", () => finish(false));
      conn.on("close", () => {
        if (!onlineState.connected) finish(false);
      });
    });
    peer.on("error", () => finish(false));
  });
}

function resetOnlineConnection() {
  if (onlineState.conn) {
    try { onlineState.conn.close(); } catch {}
  }
  if (onlineState.peer) {
    try { onlineState.peer.destroy(); } catch {}
  }
  onlineState = {
    role: null,
    color: null,
    room: null,
    peer: null,
    conn: null,
    connected: false,
    applyingRemote: false,
    seq: 0,
  };
}

function onlineShareUrl(room) {
  const url = new URL(window.location.href);
  url.searchParams.set("room", room);
  if (onlineAiHintsEnabled) url.searchParams.set("assist", "1");
  else url.searchParams.delete("assist");
  url.hash = "";
  return url.toString();
}

function copyOnlineShareUrl(room) {
  const url = onlineShareUrl(room);
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(url).catch(() => {});
  }
  return url;
}

function onlineSnapshot() {
  return {
    mode,
    size,
    board: cloneCells(board),
    deadMap: cloneCells(deadMap),
    moveNumbers: cloneCells(moveNumbers),
    turn,
    captures: { ...captures },
    history: history.map((item) => ({ ...item, captures: { ...item.captures }, log: item.log.slice(), board: cloneCells(item.board), deadMap: cloneCells(item.deadMap), moveNumbers: cloneCells(item.moveNumbers || {}), scoreState: cloneScoreState(item.scoreState), resignationState: item.resignationState ? { ...item.resignationState } : null })),
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
    resignationState: resignationState ? { ...resignationState } : null,
    showAllMoveNumbers,
  };
}

function applyOnlineSnapshot(state) {
  onlineState.applyingRemote = true;
  try {
    setupBoard(state.mode || "square", state.size || 19);
    board = { ...board, ...(state.board || {}) };
    deadMap = { ...deadMap, ...(state.deadMap || {}) };
    moveNumbers = cloneCells(state.moveNumbers || {});
    turn = state.turn || BLACK;
    captures = { [BLACK]: state.captures?.[BLACK] || 0, [WHITE]: state.captures?.[WHITE] || 0 };
    history = Array.isArray(state.history) ? state.history.map((item) => ({ ...item, captures: { ...item.captures }, log: Array.isArray(item.log) ? item.log.slice() : [], board: cloneCells(item.board || {}), deadMap: cloneCells(item.deadMap || {}), moveNumbers: cloneCells(item.moveNumbers || {}), scoreState: cloneScoreState(item.scoreState), resignationState: item.resignationState ? { ...item.resignationState } : null })) : [];
    log = Array.isArray(state.log) ? state.log.slice() : [];
    moveCounter = state.moveCounter || 0;
    lastMoveKey = state.lastMoveKey || null;
    previousBoardKey = state.previousBoardKey || null;
    passCount = state.passCount || 0;
    gameOver = Boolean(state.gameOver);
    deadStoneMode = Boolean(state.deadStoneMode);
    ownershipMode = Boolean(state.ownershipMode);
    scoreState = cloneScoreState(state.scoreState);
    scoreVisible = Boolean(state.scoreVisible);
    resignationState = state.resignationState ? { ...state.resignationState } : null;
    showAllMoveNumbers = Boolean(state.showAllMoveNumbers);
    playMode = "online";
    render();
  } finally {
    onlineState.applyingRemote = false;
  }
}

function onlineColorLabel() {
  if (!onlineState.color) return "旁觀";
  return onlineState.color === BLACK ? "黑棋" : "白棋";
}

function updateOnlineStatus(extra = "") {
  if (playMode !== "online") return;
  const roomText = onlineState.room ? `房間 ${onlineState.room}` : "連線房間";
  const sideText = onlineColorLabel();
  const connText = onlineState.connected ? "已連線" : "等待連線";
  const turnText = gameOver ? "棋局已結束" : `輪到 ${colorName(turn)}`;
  setStatus(`${roomText} · ${sideText} · ${connText} · ${turnText}${extra ? ` · ${extra}` : ""}`);
}

function onlineActionLabel(action) {
  return action === "undo" ? "悔棋" : action === "new-game" ? "新棋局" : action === "final-confirm" ? "確認終局" : action === "score" ? "數子判定" : "操作";
}

function sendOnlineMessage(message) {
  if (playMode !== "online" || onlineState.applyingRemote || !onlineState.conn || !onlineState.connected) return false;
  onlineState.seq += 1;
  onlineState.conn.send({ ...message, seq: onlineState.seq });
  return true;
}

function requestOnlineAction(action) {
  if (playMode !== "online" || onlineState.applyingRemote) return false;
  if (!onlineState.connected) {
    setStatus("對方目前離線，等重新連線後再操作。你也可以回主畫面或匯出棋譜保存目前局面。");
    return true;
  }
  const id = `req-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  onlineState.pendingRequestId = id;
  sendOnlineMessage({ type: "action-request", id, action, color: onlineState.color });
  setStatus(`已送出「${onlineActionLabel(action)}」請求，等待對方同意。`);
  return true;
}

function runOnlineApprovedAction(action) {
  if (action === "undo") {
    performUndo();
    return;
  }
  if (action === "new-game") {
    resetGame(mode, size);
    return;
  }
  if (action === "final-confirm") {
    confirmFinalResult();
    return;
  }
  if (action === "score") {
    performShowScore();
  }
}

function handleOnlineActionRequest(message) {
  const action = message.action;
  const label = onlineActionLabel(action);
  showConfirmDialog({
    title: `${label}請求`,
    message: `對方想要「${label}」。你同意嗎？`,
    confirmText: "同意",
    cancelText: "拒絕",
    onConfirm: () => {
      sendOnlineMessage({ type: "action-response", id: message.id, action, accepted: true });
      runOnlineApprovedAction(action);
    },
    onCancel: () => {
      sendOnlineMessage({ type: "action-response", id: message.id, action, accepted: false });
      setStatus(`已拒絕對方的「${label}」請求。`);
    },
  });
}

function handleOnlineActionResponse(message) {
  const label = onlineActionLabel(message.action);
  if (message.accepted) {
    setStatus(`對方已同意「${label}」。`);
    return;
  }
  setStatus(`對方拒絕「${label}」。`);
}
function sendOnlineState(reason = "sync") {
  if (playMode !== "online" || onlineState.applyingRemote || !onlineState.conn || !onlineState.connected) return;
  sendOnlineMessage({ type: "state", reason, state: onlineSnapshot() });
}

function handleOnlineData(message) {
  if (!message) return;
  if (message.type === "state" && message.state) {
    applyOnlineSnapshot(message.state);
    refreshAiHints();
    updateOnlineStatus("已同步對方棋局");
    if (message.reason === "pass" && passCount >= 2 && gameOver) {
      promptEndgameCleanup();
    } else if (message.reason === "endgame-cleanup") {
      hideConfirmDialog();
      endgamePromptShown = true;
    } else if (message.reason === "continue-after-pass") {
      hideConfirmDialog();
      endgamePromptShown = false;
    }
    return;
  }
  if (message.type === "action-request") {
    handleOnlineActionRequest(message);
    return;
  }
  if (message.type === "action-response") handleOnlineActionResponse(message);
}

function attachOnlineConnection(conn) {
  onlineState.conn = conn;
  conn.on("open", () => {
    onlineState.connected = true;
    updateOnlineStatus("可以開始下棋");
    if (onlineState.role === "host") sendOnlineState("host-ready");
    refreshAiHints();
  });
  conn.on("data", handleOnlineData);
  conn.on("close", () => {
    onlineState.connected = false;
    updateOnlineStatus("對方離線");
  });
  conn.on("error", () => {
    onlineState.connected = false;
    updateOnlineStatus("連線發生問題");
  });
}

async function startOnlineHost(withAiHint = false, options = {}) {
  resetOnlineConnection();
  playMode = "online";
  updatePlayModeClass();
  onlineAiHintsEnabled = Boolean(withAiHint);
  aiHintsEnabled = false;
  onlineState.role = "host";
  onlineState.color = BLACK;
  onlineState.room = normalizeRoomCode(options.room) || makeRoomCode();
  startScreen.classList.add("is-hidden");
  gameShell.classList.remove("is-hidden");
  resetGame(options.mode || "square", Number(options.size) || 19);
  updateOnlineStatus("建立中");

  try {
    const Peer = await loadPeerJs();
    const peer = new Peer(onlinePeerId(onlineState.room), peerOptions());
    onlineState.peer = peer;
    peer.on("open", () => {
      const url = copyOnlineShareUrl(onlineState.room);
      updateOnlineStatus(`把房間碼 ${onlineState.room} 傳給朋友，連結已嘗試複製`);
      log.push(`連線房間 ${onlineState.room}`);
      log.push(url);
      renderLog();
    });
    peer.on("connection", attachOnlineConnection);
    peer.on("error", (error) => {
      console.error("online host error", error);
      setStatus("連線房間建立失敗。請重整後再建立一次，或換一個網路試試。");
    });
  } catch (error) {
    console.error("PeerJS host load failed", error);
    setStatus("連線功能載入失敗。這台裝置目前可能無法連到連線服務。");
  }
}

async function startOnlineGuest(roomCode, withAiHint = false, options = {}) {
  const room = normalizeRoomCode(roomCode);
  if (!room) {
    showOnlineSetupDialog(withAiHint);
    return;
  }
  resetOnlineConnection();
  playMode = "online";
  updatePlayModeClass();
  onlineAiHintsEnabled = Boolean(withAiHint);
  aiHintsEnabled = false;
  onlineState.role = "guest";
  onlineState.color = WHITE;
  onlineState.room = room;
  startScreen.classList.add("is-hidden");
  gameShell.classList.remove("is-hidden");
  resetGame(options.mode || "square", Number(options.size) || 19);
  updateOnlineStatus("加入中");

  try {
    const Peer = await loadPeerJs();
    const peer = new Peer(undefined, peerOptions());
    onlineState.peer = peer;
    peer.on("open", () => {
      const conn = peer.connect(onlinePeerId(room), { reliable: true });
      attachOnlineConnection(conn);
    });
    peer.on("error", (error) => {
      console.error("online guest error", error);
      setStatus("加入房間失敗。請確認房主還開著房間，房間碼也沒有打錯。");
    });
  } catch (error) {
    console.error("PeerJS guest load failed", error);
    setStatus("連線功能載入失敗。這台裝置目前可能無法連到連線服務。");
  }
}

function showOnlineSetupDialog(withAiHint = false) {
  pendingConfirmAction = () => startOnlineHost(withAiHint);
  pendingCancelAction = () => {
    const input = document.querySelector("#onlineRoomInput");
    const room = normalizeRoomCode(input?.value);
    if (room) startOnlineGuest(room, withAiHint);
    else showOnlineSetupDialog(withAiHint);
  };
  confirmDialogTitle.textContent = withAiHint ? "AI 提示連線" : "連線對弈";
  confirmDialogMessage.innerHTML = `
    <span class="dialog-copy">建立房間後，把房間碼或連結傳給朋友；朋友輸入房間碼就能加入。</span>
    <input id="onlineRoomInput" class="online-room-input" type="text" inputmode="latin" autocomplete="off" placeholder="朋友給你的房間碼">
  `;
  cancelDialogBtn.textContent = "加入房間";
  confirmDialogBtn.textContent = "建立房間";
  cancelDialogBtn.classList.remove("is-hidden");
  confirmDialog.classList.remove("is-hidden");
  document.querySelector("#onlineRoomInput")?.focus();
}

function startOnlineSetup(withAiHint = false) {
  showOnlineSetupDialog(withAiHint);
}

function canActOnline() {
  if (playMode !== "online" || onlineState.applyingRemote) return true;
  if (!onlineState.connected) {
    setStatus("連線房間還沒有接上，等朋友進來後再下。");
    return false;
  }
  if (onlineState.color && turn !== onlineState.color && !deadStoneMode && !ownershipMode && !gameOver) {
    setStatus(`現在輪到對方（${colorName(turn)}）。`);
    return false;
  }
  return true;
}

function bootRoomFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const room = normalizeRoomCode(params.get("room"));
  const withAiHint = params.get("assist") === "1";
  if (room) window.setTimeout(() => startOnlineGuest(room, withAiHint), 250);
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
resignBtn?.addEventListener("click", requestResign);
finalConfirmBtn?.addEventListener("click", requestFinalConfirm);
exportRecordBtn?.addEventListener("click", exportGameRecord);
document.querySelector("#newGameBtn").addEventListener("click", requestNewGame);
traditionalModeBtn.addEventListener("click", () => startGame("traditional"));
aiModeBtn.addEventListener("click", () => startGame("ai"));
onlineModeBtn.addEventListener("click", () => startOnlineSetup(false));
onlineAiHintModeBtn.addEventListener("click", () => startOnlineSetup(true));
lobbyOptionButtons.forEach((button) => button.addEventListener("click", () => selectLobbyOption(button)));
publicLobbyBtn?.addEventListener("click", startMatchmaking);
privateRoomShortcutBtn?.addEventListener("click", startLobbyFriendlyRoom);
backMenuBtn.addEventListener("click", requestMainMenu);
aiStrengthPanel.querySelectorAll("[data-ai-strength]").forEach((button) => {
  button.addEventListener("click", () => {
    aiStrength = button.dataset.aiStrength;
    setStatus(`AI 強度已切換為 ${AI_STRENGTHS[aiStrength].label}。`);
    clearAiHints();
    render();
    refreshAiHints();
    scheduleAiMove();
  });
});
aiStrengthPanel.querySelectorAll("[data-color-ai-strength]").forEach((button) => {
  button.addEventListener("click", () => {
    const [color, value] = button.dataset.colorAiStrength.split(":");
    if (!AI_STRENGTHS[value]) return;
    if (color === "black") blackAiStrength = value;
    if (color === "white") whiteAiStrength = value;
    const label = AI_STRENGTHS[value].label;
    setStatus(`${color === "black" ? "黑" : "白"} AI 強度已切換為 ${label}。`);
    clearAiHints();
    render();
    refreshAiHints();
  });
});
if (aiHintToggle) {
  aiHintToggle.addEventListener("click", () => {
    aiHintsEnabled = !aiHintsEnabled;
    if (!aiHintsEnabled) clearAiHints();
    render();
    refreshAiHints();
  });
}
if (aiHintStrengthControls) {
  aiHintStrengthControls.addEventListener("click", (event) => {
    const button = event.target.closest("[data-ai-hint-strength]");
    if (!button) return;
    const value = button.dataset.aiHintStrength;
    if (!AI_STRENGTHS[value]) return;
    aiHintStrength = value;
    const label = AI_STRENGTHS[value].label;
    setStatus("AI 提示強度已切換為 " + label + "。");
    clearAiHints();
    render();
    refreshAiHints();
  });
}
if (blackAiHintToggle) {
  blackAiHintToggle.addEventListener("click", () => {
    blackAiHintsEnabled = !blackAiHintsEnabled;
    if (turn === BLACK) clearAiHints();
    render();
    refreshAiHints();
  });
}
if (whiteAiHintToggle) {
  whiteAiHintToggle.addEventListener("click", () => {
    whiteAiHintsEnabled = !whiteAiHintsEnabled;
    if (turn === WHITE) clearAiHints();
    render();
    refreshAiHints();
  });
}
if (aiHintCountControls) {
  aiHintCountControls.addEventListener("click", (event) => {
    const button = event.target.closest("[data-ai-hint-count]");
    if (!button || usesFixedTwoAiHints()) return;
    aiHintCount = Number(button.dataset.aiHintCount) || 1;
    clearAiHints();
    render();
    refreshAiHints();
  });
}
cancelDialogBtn.addEventListener("click", () => {
  const action = pendingCancelAction;
  hideConfirmDialog();
  if (action) action();
});
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
  sendOnlineState("dead-mode");
  updateOnlineStatus();
});
renderLobbyPreview();
bootRoomFromUrl();
ownershipModeBtn.addEventListener("click", () => {
  clearPendingMove();
  if (!scoreState) scoreState = calculateAreaScore();
  ownershipMode = !ownershipMode;
  scoreVisible = true;
  deadStoneMode = false;
  setStatus(ownershipMode ? "校正歸屬模式：點空點切換歸屬；點棋子整串標死或恢復。" : "已離開校正歸屬模式。");
  render();
  sendOnlineState("ownership-mode");
  updateOnlineStatus();
});
window.addEventListener("resize", drawBoard);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

resetGame("square", 19);
