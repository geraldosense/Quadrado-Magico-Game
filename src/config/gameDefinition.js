/**
 * Definições centrais do jogo.
 */

export const APP_INFO = {
  subtitle: 'Treine sua lógica e complete o quadrado mágico!',
  tagline: 'Puzzle matemático educativo',
  version: '1.0.0',
  year: '2026',
};

export const CREDITS = {
  developer: {
    role: 'Desenvolvedor',
    name: 'Geraldo de Assunção Simba Sense',
    shortName: 'Geraldo Sense',
    description:
      'Responsável pelo desenvolvimento, programação e design técnico desta aplicação educativa.',
    photos: [
      {
        src: 'assets/team/geraldo-sense-2.png',
        alt: 'Geraldo Sense — retrato profissional',
        variant: 'main',
      },
      {
        src: 'assets/team/geraldo-sense-1.png',
        alt: 'Geraldo Sense — desenvolvedor',
        variant: 'accent',
      },
    ],
  },
  ideaProvider: {
    role: 'Provedor da Ideia',
    name: 'José Banganga Brás António',
    shortName: 'José Banganga Brás António',
    description:
      'Autor original da ideia deste quebra-cabeça três vezes três e do conceito pedagógico.',
    photos: [
      {
        src: 'assets/team/jose-banganga.png',
        alt: 'José Banganga Brás António — provedor da ideia',
        variant: 'main',
      },
    ],
  },
  aboutSections: [
    {
      title: 'Sobre o Jogo',
      content:
        'O Quadrado Mágico é um puzzle de lógica matemática com 150 níveis em três mundos: 3×3, 4×4 e 5×5. Preencha cada grelha sem repetir números, de forma que a soma de cada linha, coluna e diagonal seja sempre igual ao alvo do nível.',
    },
    {
      title: 'Objectivo Pedagógico',
      content:
        'Desenvolver o raciocínio lógico, o cálculo mental e a capacidade de resolver problemas matemáticos de forma divertida.',
    },
  ],
};

export const GAME_DEFINITION = {
  id: 'quadrado-magico-3x3',
  title: 'QUADRADO MÁGICO',
  subtitle: 'Puzzle matemático 3×3',
  grid: { rows: 3, cols: 3, size: 9 },
  numbers: {
    min: 1,
    max: 9,
    pool: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  },
  targetSum: 15,
  winConditions: [
    { id: 'rows', label: '3 linhas', type: 'rows' },
    { id: 'cols', label: '3 colunas', type: 'cols' },
    { id: 'diag-main', label: 'Diagonal principal', type: 'diagonal', index: 0 },
    { id: 'diag-sec', label: 'Diagonal secundária', type: 'diagonal', index: 1 },
  ],
};

export const GAME_RULES = {
  summary:
    'Preencha o quadro 3×3 utilizando os números de 1 a 9 (sem repetir nenhum número), de modo que a soma de todos os números em cada linha, em cada coluna e nas duas diagonais seja sempre 15.',
  howToPlay: [
    'Selecione um número na barra inferior ou arraste-o para um quadrado vazio.',
    'Use cada número apenas uma vez.',
    'Complete quando todas as linhas, colunas e diagonais somarem 15.',
  ],
  tips: [
    'Use cada número apenas uma vez.',
    'Comece pelas linhas ou colunas que já têm números.',
    'O número 5 fica sempre no centro num quadrado mágico 3×3!',
  ],
};

export const UI_LABELS = {
  loading: 'Carregando...',
  menu: {
    play: 'JOGAR',
    selectLevel: 'SELECIONAR NÍVEL',
    stats: 'ESTATÍSTICAS',
    howToPlay: 'COMO JOGAR',
    info: 'INFORMAÇÃO',
    comingSoon: 'Funcionalidade em breve!',
    allComplete: 'Parabéns! Completou todos os 150 níveis!',
    rewards: 'RECOMPENSAS',
    daily: 'DIÁRIO',
    achievements: 'CONQUISTAS',
    shop: 'LOJA',
  },
  nav: {
    home: 'Início',
    levels: 'Níveis',
    stats: 'Estatísticas',
    settings: 'Configurações',
  },
  levels: {
    title: 'Selecionar Nível',
    complete: 'Completo',
    play: 'JOGAR',
    locked: 'Bloqueado',
    clues: 'pistas',
    worldDesc: 'Níveis {from}–{to} · Quadrado {grid}',
  },
  stats: {
    title: 'ESTATÍSTICAS',
    scoreLabel: 'Pontuação total',
    totalStars: 'Estrelas ganhas',
    levelsCompleted: 'Níveis completos',
    totalTime: 'Tempo de jogo',
    perfectLevels: 'Níveis perfeitos (3★)',
    totalHints: 'Dicas usadas',
    totalErrors: 'Erros cometidos',
    noHintWins: 'Vitórias sem dicas',
    achievements: 'Conquistas',
    viewAchievements: 'VER CONQUISTAS',
    unlocked: 'desbloqueados',
  },
  achievements: {
    title: 'CONQUISTAS',
    unlocked: 'Desbloqueada',
  },
  settings: {
    title: 'Configurações',
    general: 'GERAL',
    game: 'JOGO',
    about: 'SOBRE',
    theme: 'Tema',
    themeLight: 'Claro',
    sound: 'Som',
    music: 'Música',
    vibration: 'Vibração',
    soundVolume: 'Volume dos efeitos',
    musicVolume: 'Volume da música',
    showErrors: 'Mostrar Erros',
    confirmRestart: 'Confirmação ao Reiniciar',
    defaultDifficulty: 'Dificuldade Padrão',
    howToPlay: 'Como Jogar',
    close: 'Guardar',
  },
  info: {
    title: 'INFORMAÇÃO',
    credits: 'Créditos',
    back: '←',
  },
  howToPlay: {
    title: 'COMO JOGAR',
    rules: 'Regras',
    example: 'EXEMPLO',
    tips: 'DICAS',
    start: 'VAMOS JOGAR!',
    back: '←',
  },
  objective: {
    title: 'OBJETIVO',
    description:
      'A soma de todos os números em cada linha, coluna e diagonal deve ser igual a:',
  },
  progress: { title: 'PROGRESSO' },
  pool: {
    hint: 'Use cada número apenas uma vez.',
  },
  game: {
    back: '←',
    pause: 'Pausar',
    resume: 'Continuar',
    undo: 'Desfazer',
    erase: 'Apagar',
    restart: 'Reiniciar',
    hint: 'Dica',
    victory: 'PARABÉNS! Quadrado mágico concluído!',
    victoryShort: 'PARABÉNS!',
    nextLevel: 'PRÓXIMO NÍVEL',
    tryAgain: 'JOGAR NOVAMENTE',
    gameOver: 'Fim de Jogo',
    gameOverMsg: 'O quadrado está incorreto. Verifique as somas das linhas, colunas e diagonais.',
    restartMatch: 'Reiniciar Encontro',
    confirmRestart: 'Tem certeza que deseja reiniciar este nível?',
    confirmYes: 'Sim, Reiniciar',
    confirmCancel: 'Cancelar',
    pauseTitle: 'Pausa',
    pauseContinue: 'Continuar',
    pauseRestart: 'Reiniciar',
    pauseUndo: 'Desfazer',
    pauseLevels: 'Selecionar Nível',
    pauseStats: 'Estatísticas',
    pauseSettings: 'Configurações',
    pauseExit: 'Sair',
    time: 'Tempo',
    hintsUsed: 'Dicas usadas',
    errors: 'Erros',
  },
};
