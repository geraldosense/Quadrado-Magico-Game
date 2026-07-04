import { buildWinConditions, getGridPresetForLevel, GRID_PRESETS } from './gridPresets.js';
import {
  pick3x3Config,
  pick4x4Config,
  pick5x5Config,
  isValidMagicSquare,
} from './magicSquares.js';
import {
  buildClueBoard,
  buildObjective,
  pickPattern,
} from './puzzlePatterns.js';

export const TOTAL_LEVELS = 150;
export const MAX_ERRORS = 3;
export const BLANK_START_RATIO = 0.12;

const TITLES = {
  scatter: ['Mistério', 'Enigma', 'Puzzle', 'Desafio'],
  fullRow: ['Linha de Ouro', 'Fio Condutor', 'Trilha', 'Rota'],
  fullCol: ['Coluna Mestra', 'Pilar', 'Eixo', 'Torre'],
  mainDiag: ['Diagonal Mágica', 'Caminho Principal', 'Ascensão'],
  antiDiag: ['Diagonal Inversa', 'Espelho', 'Reflexo'],
  corners: ['Quatro Cantos', 'Bordas', 'Limites'],
  cross: ['Cruz de Ferro', 'Centro Mágico', 'Interseção'],
  frame: ['Moldura', 'Contorno', 'Perímetro'],
  twinRows: ['Duplo Fio', 'Paralelo', 'Harmonia'],
  checker: ['Xadrez', 'Alternado', 'Ritmo'],
  spiral: ['Espiral', 'Vórtice', 'Redemoinho'],
  minimal: ['Essência', 'Núcleo', 'Ápice', 'Supremo'],
  blank: ['Origem', 'Vazio', 'Génese', 'Zero'],
};

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

function clueCountForLevel(size, tierIndex, tierTotal, pattern) {
  if (pattern.id === 'blank') return 0;
  const cellCount = size * size;
  const minClues = size === 3 ? 2 : size === 4 ? 3 : 4;
  const maxClues = pattern.id === 'frame'
    ? Math.floor(cellCount * 0.85)
    : Math.max(minClues + 1, Math.floor(cellCount * 0.68));
  const ratio = 1 - (tierIndex - 1) / Math.max(1, tierTotal - 1);
  return Math.max(minClues, Math.round(minClues + ratio * (maxClues - minClues)));
}

function isBlankStart(id, tierIndex) {
  if (tierIndex <= 2) return false;
  return (id * 13 + 7) % 100 < Math.round(BLANK_START_RATIO * 100);
}

function pickWinMode(id, tierIndex, tierTotal, size) {
  if (size === 3 || tierIndex <= tierTotal * 0.35) return 'full';
  if ((id + tierIndex) % 9 === 0) return 'semi';
  if (tierIndex > tierTotal * 0.7 && (id % 11 === 0)) return 'semi';
  return 'full';
}

function hintsForLevel(tierIndex, tierTotal, difficulty, pattern) {
  if (pattern.id === 'minimal' || pattern.id === 'blank') return 0;
  if (difficulty === 'Extremo') return 0;
  if (difficulty === 'Difícil' && tierIndex > tierTotal * 0.5) return 0;
  return 1;
}

function maxErrorsForLevel(tierIndex, tierTotal, difficulty) {
  if (difficulty === 'Extremo' && tierIndex > tierTotal * 0.75) return 2;
  return MAX_ERRORS;
}

function difficultyLabel(tierIndex, tierTotal, pattern, winMode) {
  let score = tierIndex / tierTotal;
  if (pattern.id === 'minimal' || pattern.id === 'blank') score += 0.25;
  if (winMode === 'semi') score += 0.05;
  if (score <= 0.3) return 'Fácil';
  if (score <= 0.55) return 'Médio';
  if (score <= 0.8) return 'Difícil';
  return 'Extremo';
}

function pickTitle(patternId, tierIndex, seed) {
  const pool = TITLES[patternId] ?? TITLES.scatter;
  const word = pool[(tierIndex + seed) % pool.length];
  return tierIndex > pool.length ? `${word} ${tierIndex}` : word;
}

function resolveSolutionConfig(id, preset, tierIndex) {
  const { size, baseSolution } = preset;
  if (size === 3) return pick3x3Config(baseSolution, id);
  if (size === 4) return pick4x4Config(baseSolution, tierIndex);
  return pick5x5Config(baseSolution, tierIndex);
}

function createLevel(id) {
  const preset = getGridPresetForLevel(id);
  const { size, world } = preset;
  const tierIndex = id - world.levelFrom + 1;
  const tierTotal = world.levelTo - world.levelFrom + 1;

  const blankStart = isBlankStart(id, tierIndex);
  const pattern = pickPattern(id, tierIndex, tierTotal, blankStart);
  const winMode = pickWinMode(id, tierIndex, tierTotal, size);
  const { solution, numbers, targetSum, numberOffset } = resolveSolutionConfig(id, preset, tierIndex);

  const clueCount = clueCountForLevel(size, tierIndex, tierTotal, pattern);
  const initialBoard = pattern.id === 'blank'
    ? Array.from({ length: size }, () => Array(size).fill(null))
    : buildClueBoard(solution, pattern, clueCount, id * 7919);

  const diff = difficultyLabel(tierIndex, tierTotal, pattern, winMode);
  const hints = hintsForLevel(tierIndex, tierTotal, diff, pattern);
  const maxErrors = maxErrorsForLevel(tierIndex, tierTotal, diff);
  const useDiagonals = winMode === 'full';

  return {
    id,
    name: `Nível ${id}`,
    title: pickTitle(pattern.id, tierIndex, id),
    difficulty: diff,
    gridLabel: world.gridLabel,
    gridSize: size,
    cardTier: world.cardTier,
    worldId: world.id,
    blankStart: pattern.id === 'blank',
    puzzleType: pattern.id,
    puzzleLabel: pattern.label,
    puzzleIcon: pattern.icon,
    winMode,
    numberOffset,
    objective: buildObjective(pattern, winMode, targetSum, world.gridLabel, numberOffset),
    initialBoard,
    solution,
    lockedCells: lockedFromBoard(initialBoard),
    clues: countClues(initialBoard),
    hintsMax: hints,
    maxErrors,
    gridConfig: {
      rows: size,
      cols: size,
      targetSum,
      numbers,
      winConditions: buildWinConditions(size, { diagonals: useDiagonals }),
    },
  };
}

export const LEVELS = Array.from({ length: TOTAL_LEVELS }, (_, i) => createLevel(i + 1));

export const SOLUTION = GRID_PRESETS[3].baseSolution;

export function validateExercise(level) {
  const { initialBoard, solution, winMode } = level;
  const n = solution.length;
  if (!isValidMagicSquare(solution, winMode !== 'semi')) return false;
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
    console.error(`Exercício inválido: ${level.name} (${level.puzzleType})`);
  }
});
