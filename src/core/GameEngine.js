import { getSolutionForLevel, MAX_ERRORS } from '../config/levels.js';
import {
  createEmptyBoard,
  getGridConfig,
  hasDuplicateNumbers,
  hasInvalidCompleteLine,
  isNumberAvailable,
  validateBoard,
} from './Validator.js';

export class GameEngine {
  constructor() {
    this.listeners = new Set();
    this.currentLevel = null;
    this.lockedCells = new Set();
    this.history = [];
    this.hintsRemaining = 1;
    this.hintsUsed = 0;
    this.errorsCount = 0;
    this.maxErrors = MAX_ERRORS;
    this.hadError = false;
    this.reset();
  }

  get size() {
    return this.currentLevel?.gridSize ?? 3;
  }

  reset() {
    this.board = createEmptyBoard(3);
    this.selectedNumber = null;
    this.lockedCells = new Set();
    this.history = [];
    this.hintsRemaining = 1;
    this.hintsUsed = 0;
    this.errorsCount = 0;
    this.maxErrors = MAX_ERRORS;
    this.hadError = false;
    this.currentLevel = null;
    this.validation = validateBoard(this.board, null);
    this.notify();
  }

  loadLevel(level) {
    this.currentLevel = level;
    const size = level.gridSize ?? 3;
    this.board = level.initialBoard
      ? level.initialBoard.map((row) => [...row])
      : createEmptyBoard(size);
    this.lockedCells = new Set(
      (level.lockedCells ?? []).map(([r, c]) => `${r},${c}`)
    );
    this.selectedNumber = null;
    this.history = [];
    this.hintsRemaining = level.hintsMax ?? 1;
    this.hintsUsed = 0;
    this.errorsCount = 0;
    this.maxErrors = level.maxErrors ?? MAX_ERRORS;
    this.hadError = false;
    this.validation = validateBoard(this.board, level);
    this.notify();
  }

  isCellLocked(row, col) {
    return this.lockedCells.has(`${row},${col}`);
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    this.listeners.forEach((cb) => cb(this.getState()));
  }

  getState() {
    const config = getGridConfig(this.currentLevel);
    return {
      board: this.board.map((row) => [...row]),
      selectedNumber: this.selectedNumber,
      availableNumbers: config.numbers.filter((n) => isNumberAvailable(this.board, n)),
      validation: this.validation,
      lockedCells: [...this.lockedCells],
      hintsRemaining: this.hintsRemaining,
      hintsUsed: this.hintsUsed,
      hintsMax: this.currentLevel?.hintsMax ?? 1,
      errorsCount: this.errorsCount,
      errorsRemaining: Math.max(0, this.maxErrors - this.errorsCount),
      maxErrors: this.maxErrors,
      currentLevel: this.currentLevel,
      gridConfig: config,
      canUndo: this.history.length > 0,
      hasError: this.hadError,
    };
  }

  pushHistory() {
    this.history.push({
      board: this.board.map((row) => [...row]),
      selectedNumber: this.selectedNumber,
    });
    if (this.history.length > 30) this.history.shift();
  }

  undo() {
    if (!this.history.length) return;
    const prev = this.history.pop();
    this.board = prev.board;
    this.selectedNumber = prev.selectedNumber;
    this.validation = validateBoard(this.board, this.currentLevel);
    this.updateErrorState();
    this.notify();
  }

  selectNumber(number) {
    if (this.selectedNumber === number) {
      this.selectedNumber = null;
    } else if (isNumberAvailable(this.board, number)) {
      this.selectedNumber = number;
    }
    this.notify();
  }

  placeNumber(row, col) {
    if (this.isCellLocked(row, col)) return;
    const cell = this.board[row][col];
    const willChange = cell !== null || this.selectedNumber !== null;
    if (!willChange) return;

    this.pushHistory();
    if (cell !== null) {
      this.board[row][col] = null;
      this.selectedNumber = cell;
    } else if (this.selectedNumber !== null) {
      this.board[row][col] = this.selectedNumber;
      this.selectedNumber = null;
    }
    this.validation = validateBoard(this.board, this.currentLevel);
    this.updateErrorState();
    this.notify();
  }

  assignNumber(row, col, number) {
    if (this.isCellLocked(row, col)) return;

    const isClear = number === null || number === undefined;
    const canPlace =
      isClear ||
      (this.board[row][col] === null && isNumberAvailable(this.board, number));
    if (!canPlace) return;

    this.pushHistory();
    if (isClear) {
      this.board[row][col] = null;
    } else {
      this.board[row][col] = number;
      this.selectedNumber = null;
    }
    this.validation = validateBoard(this.board, this.currentLevel);
    this.updateErrorState();
    this.notify();
  }

  moveNumber(fromRow, fromCol, toRow, toCol) {
    if (this.isCellLocked(fromRow, fromCol) || this.isCellLocked(toRow, toCol)) return;
    const num = this.board[fromRow][fromCol];
    if (num === null) return;
    if (fromRow === toRow && fromCol === toCol) return;
    if (this.board[toRow][toCol] !== null) return;

    this.pushHistory();
    this.board[fromRow][fromCol] = null;
    this.board[toRow][toCol] = num;
    this.selectedNumber = null;
    this.validation = validateBoard(this.board, this.currentLevel);
    this.updateErrorState();
    this.notify();
  }

  eraseSelected() {
    if (this.selectedNumber === null) return;
    const n = this.size;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (this.board[r][c] === this.selectedNumber && !this.isCellLocked(r, c)) {
          this.pushHistory();
          this.board[r][c] = null;
          this.validation = validateBoard(this.board, this.currentLevel);
          this.updateErrorState();
          this.notify();
          return;
        }
      }
    }
  }

  clearBoard() {
    this.pushHistory();
    const n = this.size;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (!this.isCellLocked(r, c)) this.board[r][c] = null;
      }
    }
    this.selectedNumber = null;
    this.validation = validateBoard(this.board, this.currentLevel);
    this.hadError = false;
    this.notify();
  }

  restartLevel() {
    if (this.currentLevel) this.loadLevel(this.currentLevel);
    else this.reset();
  }

  useHint() {
    if (this.hintsRemaining <= 0) return false;
    const solution = getSolutionForLevel(this.currentLevel);
    const n = this.size;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (this.board[r][c] === null && !this.isCellLocked(r, c)) {
          this.pushHistory();
          this.board[r][c] = solution[r][c];
          this.hintsRemaining -= 1;
          this.hintsUsed += 1;
          this.selectedNumber = null;
          this.validation = validateBoard(this.board, this.currentLevel);
          this.updateErrorState();
          this.notify();
          return true;
        }
      }
    }
    return false;
  }

  updateErrorState() {
    const hasProblem =
      hasInvalidCompleteLine(this.board, this.currentLevel) ||
      hasDuplicateNumbers(this.board);
    if (hasProblem && !this.hadError) {
      this.errorsCount += 1;
    }
    this.hadError = hasProblem;
  }

  checkForNewError() {
    const had = this.hadError;
    this.updateErrorState();
    return !had && this.hadError;
  }

  isGameOver(showErrors) {
    if (this.validation.isWin) return false;
    if (this.errorsCount >= this.maxErrors) return true;
    if (!showErrors) return false;
    if (this.validation.isComplete && !this.validation.isWin) return true;
    if (hasDuplicateNumbers(this.board)) return true;
    return false;
  }

  getGameOverReason() {
    if (this.errorsCount >= this.maxErrors) return 'errors';
    if (hasDuplicateNumbers(this.board)) return 'duplicate';
    if (this.validation.isComplete && !this.validation.isWin) return 'invalid';
    return 'unknown';
  }
}
