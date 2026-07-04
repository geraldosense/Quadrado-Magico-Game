import { cloneBoard, flipBoardH, rotateBoard } from './gridPresets.js';

export function magicConstant(size, offset = 0) {
  return (size * (size * size + 1)) / 2 + size * offset;
}

export function shiftSolution(base, offset) {
  if (offset === 0) return cloneBoard(base);
  return base.map((row) => row.map((v) => v + offset));
}

export function shiftNumberPool(size, offset) {
  return Array.from({ length: size * size }, (_, i) => i + 1 + offset);
}

export function complementBoard(board) {
  const n = board.length;
  const c = n * n + 1;
  return board.map((row) => row.map((v) => c - v));
}

export function swapRows(board, r1, r2) {
  const b = cloneBoard(board);
  [b[r1], b[r2]] = [b[r2], b[r1]];
  return b;
}

export function swapCols(board, c1, c2) {
  const b = cloneBoard(board);
  for (let r = 0; r < b.length; r++) {
    [b[r][c1], b[r][c2]] = [b[r][c2], b[r][c1]];
  }
  return b;
}

export function isValidMagicSquare(board, checkDiagonals = true) {
  const n = board.length;
  const flat = board.flat();
  if (flat.some((v) => !Number.isFinite(v))) return false;
  if (new Set(flat).size !== flat.length) return false;

  const target = board[0].reduce((a, b) => a + b, 0);
  for (let r = 0; r < n; r++) {
    if (board[r].reduce((a, b) => a + b, 0) !== target) return false;
  }
  for (let c = 0; c < n; c++) {
    if (board.reduce((s, row) => s + row[c], 0) !== target) return false;
  }
  if (checkDiagonals) {
    let d1 = 0;
    let d2 = 0;
    for (let i = 0; i < n; i++) {
      d1 += board[i][i];
      d2 += board[i][n - 1 - i];
    }
    if (d1 !== target || d2 !== target) return false;
  }
  return true;
}

function boardKey(board) {
  return board.flat().join(',');
}

/** Gera variantes válidas por rotação, reflexão, complemento e trocas */
export function generateVariants(base, max = 16) {
  const seen = new Set();
  const variants = [];

  const add = (b) => {
    if (!isValidMagicSquare(b)) return;
    const key = boardKey(b);
    if (seen.has(key)) return;
    seen.add(key);
    variants.push(cloneBoard(b));
  };

  for (let t = 0; t < 8; t++) {
    let b = cloneBoard(base);
    if (t >= 4) b = flipBoardH(b);
    for (let r = 0; r < t % 4; r++) b = rotateBoard(b);
    add(b);
    add(complementBoard(b));

    if (b.length === 4) {
      add(swapRows(b, 0, 1));
      add(swapRows(b, 2, 3));
      add(swapCols(b, 0, 1));
      add(swapCols(b, 2, 3));
    }
  }

  return variants.slice(0, max);
}

export function pickVariant(base, index) {
  const variants = generateVariants(base, 24);
  return variants[index % variants.length] ?? cloneBoard(base);
}

/** Deslocamento numérico para 3×3 — números e soma diferentes */
export function pick3x3Config(base, levelId) {
  const maxOffset = 7;
  const offset = Math.floor((levelId - 1) / 7) % (maxOffset + 1);
  const variantIndex = (levelId - 1) % 8;
  let solution = pickVariant(base, variantIndex);
  solution = shiftSolution(solution, offset);
  return {
    solution,
    numbers: shiftNumberPool(3, offset),
    targetSum: magicConstant(3, offset),
    numberOffset: offset,
  };
}

export function pick4x4Config(base, tierIndex) {
  const solution = pickVariant(base, tierIndex + Math.floor(tierIndex / 3));
  return {
    solution,
    numbers: shiftNumberPool(4, 0),
    targetSum: magicConstant(4, 0),
    numberOffset: 0,
  };
}

export function pick5x5Config(base, tierIndex) {
  const solution = pickVariant(base, tierIndex + Math.floor(tierIndex / 2));
  const offset = tierIndex > 35 ? Math.floor(tierIndex / 12) : 0;
  const shifted = offset ? shiftSolution(solution, offset) : solution;
  return {
    solution: shifted,
    numbers: shiftNumberPool(5, offset),
    targetSum: magicConstant(5, offset),
    numberOffset: offset,
  };
}
