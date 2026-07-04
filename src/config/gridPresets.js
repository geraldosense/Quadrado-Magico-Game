/** Soluções canónicas e configuração por tamanho de grelha */

export const GRID_PRESETS = {
  3: {
    size: 3,
    targetSum: 15,
    numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    baseSolution: [
      [8, 1, 6],
      [3, 5, 7],
      [4, 9, 2],
    ],
    world: {
      id: 1,
      name: 'Mundo I — Bronze',
      gridLabel: '3×3',
      cardTier: 'bronze',
      levelFrom: 1,
      levelTo: 50,
    },
  },
  4: {
    size: 4,
    targetSum: 34,
    numbers: Array.from({ length: 16 }, (_, i) => i + 1),
    baseSolution: [
      [16, 3, 2, 13],
      [5, 10, 11, 8],
      [9, 6, 7, 12],
      [4, 15, 14, 1],
    ],
    world: {
      id: 2,
      name: 'Mundo II — Prata',
      gridLabel: '4×4',
      cardTier: 'silver',
      levelFrom: 51,
      levelTo: 100,
    },
  },
  5: {
    size: 5,
    targetSum: 65,
    numbers: Array.from({ length: 25 }, (_, i) => i + 1),
    baseSolution: [
      [17, 24, 1, 8, 15],
      [23, 5, 7, 14, 16],
      [4, 6, 13, 20, 22],
      [10, 12, 19, 21, 3],
      [11, 18, 25, 2, 9],
    ],
    world: {
      id: 3,
      name: 'Mundo III — Ouro',
      gridLabel: '5×5',
      cardTier: 'gold',
      levelFrom: 101,
      levelTo: 150,
    },
  },
};

export function cloneBoard(board) {
  return board.map((row) => [...row]);
}

export function rotateBoard(board) {
  const n = board.length;
  return Array.from({ length: n }, (_, c) =>
    Array.from({ length: n }, (_, r) => board[n - 1 - r][c])
  );
}

export function flipBoardH(board) {
  return board.map((row) => [...row].reverse());
}

/** 8 simetrias do quadrado (D4) para variar números mantendo solução válida */
export function transformBoard(board, variantIndex) {
  let b = cloneBoard(board);
  const idx = ((variantIndex % 8) + 8) % 8;

  if (idx >= 4) {
    b = flipBoardH(b);
  }
  const rotations = idx % 4;
  for (let i = 0; i < rotations; i++) {
    b = rotateBoard(b);
  }
  return b;
}

export function buildWinConditions(size, { diagonals = true } = {}) {
  const conditions = [
    { id: 'rows', label: `${size} linhas`, type: 'rows' },
    { id: 'cols', label: `${size} colunas`, type: 'cols' },
  ];
  if (diagonals) {
    conditions.push(
      { id: 'diag-main', label: 'Diagonal principal', type: 'diagonal', index: 0 },
      { id: 'diag-sec', label: 'Diagonal secundária', type: 'diagonal', index: 1 }
    );
  }
  return conditions;
}

export function getGridPresetForLevel(levelId) {
  if (levelId <= 50) return GRID_PRESETS[3];
  if (levelId <= 100) return GRID_PRESETS[4];
  return GRID_PRESETS[5];
}

export const WORLDS = Object.values(GRID_PRESETS).map((p) => p.world);
