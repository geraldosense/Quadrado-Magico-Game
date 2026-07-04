/** Padrões de pistas — cada nível usa um layout diferente */

function key(r, c) {
  return `${r},${c}`;
}

function rowCells(size, r) {
  return Array.from({ length: size }, (_, c) => [r, c]);
}

function colCells(size, c) {
  return Array.from({ length: size }, (_, r) => [r, c]);
}

export const PUZZLE_PATTERNS = {
  scatter: {
    id: 'scatter',
    label: 'Espalhadas',
    icon: '✦',
    cells(size, seed) {
      const all = [];
      for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) all.push([r, c]);
      return seededPick(all, Math.max(2, Math.floor(size * size * 0.45)), seed);
    },
  },
  fullRow: {
    id: 'fullRow',
    label: 'Linha Completa',
    icon: '═',
    cells(size, seed) {
      return rowCells(size, seed % size);
    },
  },
  fullCol: {
    id: 'fullCol',
    label: 'Coluna Completa',
    icon: '║',
    cells(size, seed) {
      return colCells(size, seed % size);
    },
  },
  mainDiag: {
    id: 'mainDiag',
    label: 'Diagonal Principal',
    icon: '╲',
    cells(size) {
      return Array.from({ length: size }, (_, i) => [i, i]);
    },
  },
  antiDiag: {
    id: 'antiDiag',
    label: 'Diagonal Secundária',
    icon: '╱',
    cells(size) {
      return Array.from({ length: size }, (_, i) => [i, size - 1 - i]);
    },
  },
  corners: {
    id: 'corners',
    label: 'Cantos',
    icon: '◇',
    cells(size) {
      return [[0, 0], [0, size - 1], [size - 1, 0], [size - 1, size - 1]];
    },
  },
  cross: {
    id: 'cross',
    label: 'Cruz Central',
    icon: '✚',
    cells(size) {
      const mid = Math.floor(size / 2);
      const set = new Map();
      rowCells(size, mid).forEach(([r, c]) => set.set(key(r, c), [r, c]));
      colCells(size, mid).forEach(([r, c]) => set.set(key(r, c), [r, c]));
      return [...set.values()];
    },
  },
  frame: {
    id: 'frame',
    label: 'Moldura',
    icon: '▢',
    cells(size) {
      const cells = [];
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (r === 0 || c === 0 || r === size - 1 || c === size - 1) cells.push([r, c]);
        }
      }
      return cells;
    },
  },
  twinRows: {
    id: 'twinRows',
    label: 'Duas Linhas',
    icon: '☰',
    cells(size, seed) {
      const r1 = seed % size;
      const r2 = (r1 + 1 + (seed % Math.max(1, size - 1))) % size;
      return [...rowCells(size, r1), ...rowCells(size, r2)];
    },
  },
  checker: {
    id: 'checker',
    label: 'Xadrez',
    icon: '♞',
    cells(size, seed) {
      const cells = [];
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if ((r + c + seed) % 2 === 0) cells.push([r, c]);
        }
      }
      return cells;
    },
  },
  spiral: {
    id: 'spiral',
    label: 'Espiral',
    icon: '◎',
    cells(size) {
      return spiralOrder(size).slice(0, Math.max(3, Math.floor(size * size * 0.55)));
    },
  },
  minimal: {
    id: 'minimal',
    label: 'Mínimo',
    icon: '·',
    cells(size, seed) {
      const center = Math.floor(size / 2);
      return [[center, center], [0, seed % size], [size - 1, (seed + 1) % size]].slice(0, size === 3 ? 2 : 3);
    },
  },
  blank: {
    id: 'blank',
    label: 'Do Zero',
    icon: '∅',
    cells() {
      return [];
    },
  },
};

const ALL_PATTERNS = [
  'scatter', 'fullRow', 'fullCol', 'mainDiag', 'antiDiag', 'corners',
  'cross', 'frame', 'twinRows', 'checker', 'spiral', 'minimal',
];

export function pickPattern(levelId, tierIndex, tierTotal, forceBlank = false) {
  if (forceBlank) return PUZZLE_PATTERNS.blank;
  const worldOffset = Math.floor((levelId - 1) / 50) * 3;
  const patternId = ALL_PATTERNS[(levelId + worldOffset + tierIndex) % ALL_PATTERNS.length];
  if (tierIndex <= 3 && patternId === 'minimal') return PUZZLE_PATTERNS.scatter;
  if (tierIndex > tierTotal * 0.9 && levelId % 6 === 0) return PUZZLE_PATTERNS.minimal;
  return PUZZLE_PATTERNS[patternId];
}

function seededPick(items, count, seed) {
  const arr = [...items];
  let s = seed;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, count);
}

function spiralOrder(size) {
  const order = [];
  let top = 0;
  let bottom = size - 1;
  let left = 0;
  let right = size - 1;
  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) order.push([top, c]);
    top++;
    for (let r = top; r <= bottom; r++) order.push([r, right]);
    right--;
    for (let c = right; c >= left; c--) order.push([bottom, c]);
    bottom--;
    for (let r = bottom; r >= top; r--) order.push([r, left]);
    left++;
  }
  return order;
}

export function buildClueBoard(solution, pattern, clueCount, seed) {
  const size = solution.length;
  const patternCells = pattern.cells(size, seed);
  const cellSet = new Map();
  patternCells.forEach(([r, c]) => cellSet.set(key(r, c), [r, c]));

  if (clueCount > cellSet.size) {
    const all = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!cellSet.has(key(r, c))) all.push([r, c]);
      }
    }
    seededPick(all, clueCount - cellSet.size, seed + 17).forEach(([r, c]) => {
      cellSet.set(key(r, c), [r, c]);
    });
  } else if (clueCount < cellSet.size && clueCount > 0) {
    const trimmed = seededPick([...cellSet.values()], clueCount, seed + 31);
    cellSet.clear();
    trimmed.forEach(([r, c]) => cellSet.set(key(r, c), [r, c]));
  }

  const board = Array.from({ length: size }, () => Array(size).fill(null));
  cellSet.forEach(([r, c]) => {
    board[r][c] = solution[r][c];
  });
  return board;
}

export function buildObjective(pattern, winMode, targetSum, gridLabel, numberOffset) {
  const poolMax = gridLabel.startsWith('3') ? 9 : gridLabel.startsWith('4') ? 16 : 25;
  const offsetNote = numberOffset > 0 ? ` Números ${numberOffset + 1}–${numberOffset + poolMax}.` : '';
  const modeNote = winMode === 'semi' ? ' Acerte linhas e colunas (sem diagonais).' : '';

  const bases = {
    scatter: `Decifre pistas espalhadas no ${gridLabel}.`,
    fullRow: `Uma linha completa é a chave.`,
    fullCol: `Uma coluna completa guia a solução.`,
    mainDiag: `A diagonal principal soma ${targetSum}.`,
    antiDiag: `A diagonal secundária está revelada.`,
    corners: `Comece pelos quatro cantos.`,
    cross: `Use a cruz central como base.`,
    frame: `A moldura exterior está preenchida.`,
    twinRows: `Duas linhas completas são dadas.`,
    checker: `Pistas em padrão xadrez.`,
    spiral: `Siga o padrão espiral.`,
    minimal: `Poucas pistas — pura lógica!`,
    blank: `Tabuleiro vazio — comece do zero.`,
  };

  return `${bases[pattern.id] ?? `Complete o ${gridLabel}.`} Soma: ${targetSum}.${modeNote}${offsetNote}`;
}
