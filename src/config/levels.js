/**
 * Exercícios do Quadrado Mágico 3×3.
 * Cada nível é um puzzle parcial com solução única verificada.
 */

export const SOLUTION = [
  [8, 1, 6],
  [3, 5, 7],
  [4, 9, 2],
];

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

function createExercise({ id, name, title, difficulty, board, hints = 3, objective }) {
  return {
    id,
    name,
    title,
    difficulty,
    gridLabel: '3×3',
    objective,
    initialBoard: board,
    solution: SOLUTION,
    lockedCells: lockedFromBoard(board),
    clues: countClues(board),
    hintsMax: hints,
  };
}

/** 5 exercícios progressivos — do mais guiado ao mais difícil */
export const LEVELS = [
  createExercise({
    id: 1,
    name: 'Nível 1',
    title: 'Primeiros Passos',
    difficulty: 'Fácil',
    hints: 3,
    objective: 'Complete o quadrado usando os 5 números já dados.',
    board: [
      [8, 1, null],
      [3, null, null],
      [4, 9, null],
    ],
  }),
  createExercise({
    id: 2,
    name: 'Nível 2',
    title: 'O Centro Mágico',
    difficulty: 'Fácil',
    hints: 3,
    objective: 'O número 5 fica sempre no centro. Use essa dica!',
    board: [
      [null, null, 6],
      [null, 5, null],
      [null, null, null],
    ],
  }),
  createExercise({
    id: 3,
    name: 'Nível 3',
    title: 'Diagonal Principal',
    difficulty: 'Médio',
    hints: 2,
    objective: 'A diagonal 8 — 5 — 2 já soma 15. Complete o resto.',
    board: [
      [8, null, null],
      [null, 5, null],
      [null, null, 2],
    ],
  }),
  createExercise({
    id: 4,
    name: 'Nível 4',
    title: 'Falta Um Número',
    difficulty: 'Médio',
    hints: 2,
    objective: 'Só falta um número na última linha. Qual é?',
    board: [
      [8, 1, 6],
      [3, 5, 7],
      [4, null, 2],
    ],
  }),
  createExercise({
    id: 5,
    name: 'Nível 5',
    title: 'Desafio Completo',
    difficulty: 'Difícil',
    hints: 1,
    objective: 'Apenas o centro está revelado. Descubra todos os números!',
    board: [
      [null, null, null],
      [null, 5, null],
      [null, null, null],
    ],
  }),
];

/** Verifica se o puzzle parcial é consistente com a solução */
export function validateExercise(level) {
  const { initialBoard, solution } = level;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const clue = initialBoard[r][c];
      if (clue !== null && clue !== solution[r][c]) {
        return false;
      }
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

// Validação automática ao carregar o módulo
LEVELS.forEach((level) => {
  if (!validateExercise(level)) {
    console.error(`Exercício inválido: ${level.name} — pistas não coincidem com a solução.`);
  }
});
