import { GAME_DEFINITION } from '../config/gameDefinition.js';

const { grid, targetSum } = GAME_DEFINITION;

export function calculateSums(board) {
  const rows = board.map((row) => row.reduce((a, b) => a + (b ?? 0), 0));
  const cols = [0, 1, 2].map((c) => board.reduce((s, row) => s + (row[c] ?? 0), 0));
  const diagonals = [
    (board[0][0] ?? 0) + (board[1][1] ?? 0) + (board[2][2] ?? 0),
    (board[0][2] ?? 0) + (board[1][1] ?? 0) + (board[2][0] ?? 0),
  ];
  return { rows, cols, diagonals };
}

function isLineValid(values, sum) {
  const filled = values.every((v) => v !== null && v !== undefined);
  if (!filled) return null;
  return sum === targetSum;
}

export function validateBoard(board) {
  const { rows, cols, diagonals } = calculateSums(board);

  const rowResults = rows.map((sum, i) => isLineValid(board[i], sum));
  const colResults = [0, 1, 2].map((c) =>
    isLineValid(board.map((row) => row[c]), cols[c])
  );
  const diagResults = [
    isLineValid([board[0][0], board[1][1], board[2][2]], diagonals[0]),
    isLineValid([board[0][2], board[1][1], board[2][0]], diagonals[1]),
  ];

  const isComplete = board.every((row) => row.every((cell) => cell !== null));
  const isWin =
    isComplete &&
    rowResults.every((r) => r === true) &&
    colResults.every((r) => r === true) &&
    diagResults.every((r) => r === true);

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

export function createEmptyBoard() {
  return Array.from({ length: grid.rows }, () =>
    Array.from({ length: grid.cols }, () => null)
  );
}

export function getUsedNumbers(board) {
  return board.flat().filter((n) => n !== null);
}

export function hasDuplicateNumbers(board) {
  const used = getUsedNumbers(board);
  return used.length !== new Set(used).size;
}

export function hasInvalidCompleteLine(board) {
  const { rows, cols, diagonals } = validateBoard(board);
  return (
    rows.some((r) => r === false) ||
    cols.some((r) => r === false) ||
    diagonals.some((r) => r === false)
  );
}

export function isNumberAvailable(board, number) {
  return !getUsedNumbers(board).includes(number);
}
