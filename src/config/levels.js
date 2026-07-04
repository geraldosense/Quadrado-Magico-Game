import {
  buildWinConditions,
  cloneBoard,
  getGridPresetForLevel,
  GRID_PRESETS,
  transformBoard,
} from './gridPresets.js';

export const TOTAL_LEVELS = 150;

const TITLES_3 = [
  'Primeiros Passos', 'O Centro Mágico', 'Diagonal Principal', 'Falta Um Número',
  'Desafio Completo', 'Soma Quinze', 'Cantos Mágicos', 'Linha de Ouro',
  'Coluna Secreta', 'Equilíbrio', 'Padrão Oculto', 'Raciocínio Rápido',
];
const TITLES_4 = [
  'Quadrado Maior', 'Soma Trinta e Quatro', 'Mundo da Prata', 'Desafio 4×4',
  'Estratega', 'Matriz Complexa', 'Lógica Avançada', 'Puzzle Profundo',
];
const TITLES_5 = [
  'Quadrado Supremo', 'Soma Sessenta e Cinco', 'Mundo de Ouro', 'Desafio 5×5',
  'Grande Mestre', 'Matriz Lendária', 'Lógica Suprema', 'Puzzle Épico',
];

function seededShuffle(items, seed) {
  const arr = [...items];
  let s = seed;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function lockedFromBoard(board) {
  const cells = [];
  board.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (cell !== null) cells.push([r, c]);
    });
  });
  return cells;
}

function countClues(board) {
  return board.flat().filter((n) => n !== null).length;
}

function clueCountForLevel(size, tierIndex, tierTotal) {
  const cellCount = size * size;
  const minClues = size === 3 ? 1 : size === 4 ? 2 : 3;
  const maxClues = Math.max(minClues + 2, Math.floor(cellCount * 0.72));
  if (tierTotal <= 1) return maxClues;
  const ratio = 1 - (tierIndex - 1) / (tierTotal - 1);
  return Math.max(minClues, Math.round(minClues + ratio * (maxClues - minClues)));
}

function hintsForLevel(tierIndex, size) {
  const base = size === 3 ? 3 : size === 4 ? 2 : 1;
  return Math.max(1, base - Math.floor((tierIndex - 1) / 15));
}

function difficultyLabel(tierIndex, tierTotal) {
  const ratio = tierIndex / tierTotal;
  if (ratio <= 0.25) return 'Fácil';
  if (ratio <= 0.55) return 'Médio';
  if (ratio <= 0.8) return 'Difícil';
  return 'Extremo';
}

function pickTitle(id, size, tierIndex) {
  const pool = size === 3 ? TITLES_3 : size === 4 ? TITLES_4 : TITLES_5;
  return `${pool[(tierIndex - 1) % pool.length]} ${tierIndex > pool.length ? tierIndex : ''}`.trim();
}

function buildPuzzleBoard(solution, clueCount, seed) {
  const size = solution.length;
  const positions = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) positions.push([r, c]);
  }
  const chosen = seededShuffle(positions, seed).slice(0, clueCount);
  const board = Array.from({ length: size }, () => Array(size).fill(null));
  chosen.forEach(([r, c]) => {
    board[r][c] = solution[r][c];
  });
  return board;
}

function createLevel(id) {
  const preset = getGridPresetForLevel(id);
  const { size, targetSum, numbers, baseSolution, world } = preset;
  const tierIndex = id - world.levelFrom + 1;
  const tierTotal = world.levelTo - world.levelFrom + 1;
  const solution = transformBoard(baseSolution, id - 1);
  const clueCount = clueCountForLevel(size, tierIndex, tierTotal);
  const initialBoard = buildPuzzleBoard(solution, clueCount, id * 7919);
  const hints = hintsForLevel(tierIndex, size);
  const diff = difficultyLabel(tierIndex, tierTotal);

  return {
    id,
    name: `Nível ${id}`,
    title: pickTitle(id, size, tierIndex),
    difficulty: diff,
    gridLabel: world.gridLabel,
    gridSize: size,
    cardTier: world.cardTier,
    worldId: world.id,
    objective: `Complete o quadrado ${world.gridLabel}. Cada linha, coluna e diagonal deve somar ${targetSum}.`,
    initialBoard,
    solution,
    lockedCells: lockedFromBoard(initialBoard),
    clues: countClues(initialBoard),
    hintsMax: hints,
    gridConfig: {
      rows: size,
      cols: size,
      targetSum,
      numbers,
      winConditions: buildWinConditions(size),
    },
  };
}

export const LEVELS = Array.from({ length: TOTAL_LEVELS }, (_, i) => createLevel(i + 1));

export const SOLUTION = GRID_PRESETS[3].baseSolution;

export function validateExercise(level) {
  const { initialBoard, solution } = level;
  const n = solution.length;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const clue = initialBoard[r][c];
      if (clue !== null && clue !== solution[r][c]) return false;
    }
  }
  return true;
}

export function getLevel(id) {
  return LEVELS.find((l) => l.id === id) ?? LEVELS[0];
}

export function isLevelUnlocked(id, progress) {
  return id <= progress.unlockedLevel;
}

export function getSolutionForLevel(level) {
  return level?.solution ?? SOLUTION;
}

export function getLevelsByWorld(worldId) {
  return LEVELS.filter((l) => l.worldId === worldId);
}

export function getWorldProgress(worldId, progress) {
  const levels = getLevelsByWorld(worldId);
  const done = levels.filter((l) => progress.completedLevels[l.id]).length;
  return { done, total: levels.length };
}

LEVELS.forEach((level) => {
  if (!validateExercise(level)) {
    console.error(`Exercício inválido: ${level.name}`);
  }
});
