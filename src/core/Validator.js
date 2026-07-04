import { GAME_DEFINITION } from '../config/gameDefinition.js';

export function createEmptyBoard(size = GAME_DEFINITION.grid.rows) {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => null));
}

export function getGridConfig(levelConfig) {
  if (levelConfig?.gridConfig) return levelConfig.gridConfig;
  return {
    rows: GAME_DEFINITION.grid.rows,
    cols: GAME_DEFINITION.grid.cols,
    targetSum: GAME_DEFINITION.targetSum,
    numbers: GAME_DEFINITION.numbers.pool,
    winConditions: GAME_DEFINITION.winConditions,
  };
}

export function calculateSums(board, targetConfig) {
  const n = board.length;
  const rows = board.map((row) => row.reduce((a, b) => a + (b ?? 0), 0));
  const cols = Array.from({ length: n }, (_, c) =>
    board.reduce((s, row) => s + (row[c] ?? 0), 0)
  );
  const diagonals = [
    board.reduce((s, row, i) => s + (row[i] ?? 0), 0),
    board.reduce((s, row, i) => s + (row[n - 1 - i] ?? 0), 0),
  ];
  return { rows, cols, diagonals };
}

function isLineValid(values, sum, targetSum) {
  const filled = values.every((v) => v !== null && v !== undefined);
  if (!filled) return null;
  return sum === targetSum;
}

export function validateBoard(board, levelConfig) {
  const config = getGridConfig(levelConfig);
  const { rows, cols, diagonals } = calculateSums(board, config);
  const n = board.length;
  const { targetSum, winConditions = [] } = config;

  const rowResults = rows.map((sum, i) => isLineValid(board[i], sum, targetSum));
  const colResults = Array.from({ length: n }, (_, c) =>
    isLineValid(board.map((row) => row[c]), cols[c], targetSum)
  );
  const diagResults = [
    isLineValid(
      Array.from({ length: n }, (_, i) => board[i][i]),
      diagonals[0],
      targetSum
    ),
    isLineValid(
      Array.from({ length: n }, (_, i) => board[i][n - 1 - i]),
      diagonals[1],
      targetSum
    ),
  ];

  const isComplete = board.every((row) => row.every((cell) => cell !== null));
  const checkRows = winConditions.some((c) => c.type === 'rows');
  const checkCols = winConditions.some((c) => c.type === 'cols');
  const checkDiags = winConditions.some((c) => c.type === 'diagonal');

  const isWin =
    isComplete &&
    (!checkRows || rowResults.every((r) => r === true)) &&
    (!checkCols || colResults.every((r) => r === true)) &&
    (!checkDiags || diagResults.every((r) => r === true));

  return {
    rows: rowResults,
    cols: colResults,
    diagonals: diagResults,
    groups: {
      rows: aggregateGroup(rowResults),
      cols: aggregateGroup(colResults),
      diagonals: aggregateGroup(diagResults),
    },
    isComplete,
    isWin,
  };
}

function aggregateGroup(results) {
  if (results.every((r) => r === true)) return true;
  if (results.some((r) => r === false)) return false;
  return null;
}

export function getUsedNumbers(board) {
  return board.flat().filter((n) => n !== null);
}

export function hasDuplicateNumbers(board) {
  const used = getUsedNumbers(board);
  return used.length !== new Set(used).size;
}

export function hasInvalidCompleteLine(board, levelConfig) {
  const config = getGridConfig(levelConfig);
  const { rows, cols, diagonals } = validateBoard(board, levelConfig);
  const winConditions = config.winConditions ?? [];
  const checkRows = winConditions.some((c) => c.type === 'rows');
  const checkCols = winConditions.some((c) => c.type === 'cols');
  const checkDiags = winConditions.some((c) => c.type === 'diagonal');

  return (
    (checkRows && rows.some((r) => r === false)) ||
    (checkCols && cols.some((r) => r === false)) ||
    (checkDiags && diagonals.some((r) => r === false))
  );
}

export function isNumberAvailable(board, number) {
  return !getUsedNumbers(board).includes(number);
}
