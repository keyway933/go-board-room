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
const winnerText = document.querySelector("#winnerText");
const marginText = document.querySelector("#marginText");
const scoreIntro = document.querySelector("#scoreIntro");
const rowBreakdown = document.querySelector("#rowBreakdown");
const moveLog = document.querySelector("#moveLog");
const sizeButtons = document.querySelector("#sizeButtons");
const rulesText = document.querySelector("#rulesText");
const deadModeBtn = document.querySelector("#deadModeBtn");
const ownershipModeBtn = document.querySelector("#ownershipModeBtn");

const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;
const NEUTRAL = 3;
const KOMI = 7.5;
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
let turn = BLACK;
let captures = { [BLACK]: 0, [WHITE]: 0 };
let history = [];
let log = [];
let previousBoardKey = null;
let passCount = 0;
let gameOver = false;
let deadStoneMode = false;
let ownershipMode = false;
let scoreState = null;
let layout = null;
let torusView = { u: 0, v: 0 };
let torusDrag = null;
let suppressNextClick = false;

function colorName(color) {
  return color === BLACK ? "黑棋" : "白棋";
}

function opponent(color) {
  return color === BLACK ? WHITE : BLACK;
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

function pushHistory() {
  history.push({
    mode,
    size,
    board: cloneCells(board),
    deadMap: cloneCells(deadMap),
    turn,
    captures: { ...captures },
    log: log.slice(),
    previousBoardKey,
    passCount,
    gameOver,
    deadStoneMode,
    ownershipMode,
    scoreState: cloneScoreState(scoreState),
  });
}

function restore(state) {
  setupBoard(state.mode, state.size);
  board = cloneCells(state.board);
  deadMap = cloneCells(state.deadMap);
  turn = state.turn;
  captures = { ...state.captures };
  log = state.log.slice();
  previousBoardKey = state.previousBoardKey;
  passCount = state.passCount;
  gameOver = state.gameOver;
  deadStoneMode = state.deadStoneMode;
  ownershipMode = state.ownershipMode;
  scoreState = cloneScoreState(state.scoreState);
  render();
}

function tryPlay(key) {
  if (ownershipMode) return cycleOwnership(key);
  if (deadStoneMode) return removeDeadGroup(key);

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
  captures[turn] += capturedCount;
  log.push(`${colorName(turn)} ${labelOfKey(key)}${capturedCount ? `，提 ${capturedCount} 子` : ""}`);
  previousBoardKey = snapshotKey;
  turn = enemy;
  passCount = 0;
  scoreState = null;
  setStatus(capturedCount ? `提掉 ${capturedCount} 子，輪到 ${colorName(turn)}。` : `輪到 ${colorName(turn)}。`);
  render();
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
  });
  log.push(`終局提死子：移除 ${colorName(color)} ${group.stones.length} 子`);
  scoreState = calculateAreaScore();
  setStatus(`已移除 ${colorName(color)} ${group.stones.length} 子，數子結果已更新。`);
  render();
}

function passTurn() {
  if (deadStoneMode || ownershipMode) {
    setStatus("請先離開校正或提死子模式，再 Pass。");
    return;
  }
  if (gameOver) return;
  pushHistory();
  log.push(`${colorName(turn)} Pass`);
  passCount += 1;
  if (passCount >= 2) {
    gameOver = true;
    scoreState = calculateAreaScore();
    setStatus("雙方連續 Pass。可提死子、校正歸屬或數子判定。");
  } else {
    turn = opponent(turn);
    setStatus(`${colorName(opponent(turn))} Pass，輪到 ${colorName(turn)}。`);
  }
  render();
}

function undo() {
  const state = history.pop();
  if (!state) {
    setStatus("目前沒有可以悔的棋。");
    return;
  }
  restore(state);
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
  scoreState = calculateAreaScore();
  gameOver = true;
  deadStoneMode = false;
  ownershipMode = false;
  setStatus("已用數子法判定，棋盤上的方塊就是每一個被計入的空點。");
  render();
}

function resetGame(nextMode = mode, nextSize = size) {
  setupBoard(nextMode, nextSize);
  turn = BLACK;
  captures = { [BLACK]: 0, [WHITE]: 0 };
  history = [];
  log = [];
  previousBoardKey = null;
  passCount = 0;
  gameOver = false;
  deadStoneMode = false;
  ownershipMode = false;
  scoreState = null;
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
    button.addEventListener("click", () => resetGame(mode, option.value));
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

  if (scoreState) drawTerritoryMarks();
  drawStones();
  if (scoreState) drawDeadStoneMarks();
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
    drawStone(x, y, layout.stoneRadius, color, Boolean(deadMap[point.key]));
  }
}

function drawStone(cx, cy, radius, color, isDead = false) {
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
  if (key) tryPlay(key);
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
    document.querySelectorAll("[data-mode]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    resetGame(button.dataset.mode, button.dataset.mode === "hex" ? 15 : 19);
  });
});

document.querySelector("#passBtn").addEventListener("click", passTurn);
document.querySelector("#undoBtn").addEventListener("click", undo);
document.querySelector("#scoreBtn").addEventListener("click", showScore);
document.querySelector("#newGameBtn").addEventListener("click", () => resetGame(mode, size));
deadModeBtn.addEventListener("click", () => {
  deadStoneMode = !deadStoneMode;
  ownershipMode = false;
  scoreState = calculateAreaScore();
  setStatus(deadStoneMode ? "提死子模式：點一串死棋就會整串移除。" : "已離開提死子模式。");
  render();
});
ownershipModeBtn.addEventListener("click", () => {
  if (!scoreState) scoreState = calculateAreaScore();
  ownershipMode = !ownershipMode;
  deadStoneMode = false;
  setStatus(ownershipMode ? "校正歸屬模式：點空點切換歸屬；點棋子整串標死或恢復。" : "已離開校正歸屬模式。");
  render();
});
window.addEventListener("resize", drawBoard);

resetGame("square", 19);
