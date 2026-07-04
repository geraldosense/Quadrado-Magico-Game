import { GAME_DEFINITION } from '../config/gameDefinition.js';
import { getSolutionForLevel } from '../config/levels.js';
import {
  createEmptyBoard,
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
    this.hintsRemaining = 3;
    this.hintsUsed = 0;
    this.errorsCount = 0;
    this.hadError = false;
    this.reset();
  }

  reset() {
    this.board = createEmptyBoard();
    this.selectedNumber = null;
    this.lockedCells = new Set();
    this.history = [];
    this.hintsRemaining = 3;
    this.hintsUsed = 0;
    this.errorsCount = 0;
    this.hadError = false;
    this.currentLevel = null;
    this.validation = validateBoard(this.board);
    this.notify();
  }

  loadLevel(level) {
    this.currentLevel = level;
    this.board = level.initialBoard
      ? level.initialBoard.map((row) => [...row])
      : createEmptyBoard();
    this.lockedCells = new Set(
      (level.lockedCells ?? []).map(([r, c]) => `${r},${c}`)
    );
    this.selectedNumber = null;
    this.history = [];
    this.hintsRemaining = level.hintsMax ?? 3;
    this.hintsUsed = 0;
    this.errorsCount = 0;
    this.hadError = false;
    this.validation = validateBoard(this.board);
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
    return {
      board: this.board.map((row) => [...row]),
      selectedNumber: this.selectedNumber,
      availableNumbers: GAME_DEFINITION.numbers.pool.filter((n) =>
        isNumberAvailable(this.board, n)
      ),
      validation: this.validation,
      lockedCells: [...this.lockedCells],
      hintsRemaining: this.hintsRemaining,
      hintsUsed: this.hintsUsed,
      errorsCount: this.errorsCount,
      currentLevel: this.currentLevel,
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
    this.validation = validateBoard(this.board);
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
    this.validation = validateBoard(this.board);
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
    this.validation = validateBoard(this.board);
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
    this.validation = validateBoard(this.board);
    this.updateErrorState();
    this.notify();
  }

  eraseSelected() {
    if (this.selectedNumber === null) return;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (this.board[r][c] === this.selectedNumber && !this.isCellLocked(r, c)) {
          this.pushHistory();
          this.board[r][c] = null;
          this.validation = validateBoard(this.board);
          this.updateErrorState();
          this.notify();
          return;
        }
      }
    }
  }

  clearBoard() {
    this.pushHistory();
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (!this.isCellLocked(r, c)) this.board[r][c] = null;
      }
    }
    this.selectedNumber = null;
    this.validation = validateBoard(this.board);
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
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (this.board[r][c] === null && !this.isCellLocked(r, c)) {
          this.pushHistory();
          this.board[r][c] = solution[r][c];
          this.hintsRemaining -= 1;
          this.hintsUsed += 1;
          this.selectedNumber = null;
          this.validation = validateBoard(this.board);
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
      hasInvalidCompleteLine(this.board) || hasDuplicateNumbers(this.board);
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
    if (!showErrors || this.validation.isWin) return false;
    if (this.validation.isComplete && !this.validation.isWin) return true;
    if (hasDuplicateNumbers(this.board)) return true;
    return false;
  }
}
