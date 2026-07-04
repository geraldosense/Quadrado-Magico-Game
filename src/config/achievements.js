/** Conquistas por faixas de níveis completados */
export const ACHIEVEMENTS = [
  {
    id: 'range-1-5',
    from: 1,
    to: 5,
    title: 'Aprendiz Mágico',
    description: 'Complete todos os níveis de 1 a 5.',
    icon: '🌱',
    reward: 100,
  },
  {
    id: 'range-6-20',
    from: 6,
    to: 20,
    title: 'Explorador Numérico',
    description: 'Complete todos os níveis de 6 a 20.',
    icon: '🧭',
    reward: 250,
  },
  {
    id: 'range-21-50',
    from: 21,
    to: 50,
    title: 'Mestre do 3×3',
    description: 'Complete todos os níveis de 21 a 50.',
    icon: '♟️',
    reward: 500,
  },
  {
    id: 'range-51-100',
    from: 51,
    to: 100,
    title: 'Conquistador 4×4',
    description: 'Complete todos os níveis de 51 a 100.',
    icon: '🥈',
    reward: 1000,
  },
  {
    id: 'range-101-150',
    from: 101,
    to: 150,
    title: 'Lenda do 5×5',
    description: 'Complete todos os níveis de 101 a 150.',
    icon: '🥇',
    reward: 2000,
  },
  {
    id: 'perfect-10',
    title: 'Perfeccionista',
    description: 'Obtenha 3 estrelas em 10 níveis diferentes.',
    icon: '⭐',
    reward: 300,
    type: 'perfect',
    target: 10,
  },
  {
    id: 'no-hints-5',
    title: 'Sem Dicas',
    description: 'Complete 5 níveis sem usar nenhuma dica.',
    icon: '🎯',
    reward: 400,
    type: 'noHints',
    target: 5,
  },
];

export function isRangeAchievementComplete(achievement, completedLevels) {
  for (let i = achievement.from; i <= achievement.to; i++) {
    if (!completedLevels[i]) return false;
  }
  return true;
}

export function getAchievementProgress(achievement, progress) {
  if (achievement.type === 'perfect') {
    const count = Object.values(progress.completedLevels).filter((l) => l.stars === 3).length;
    return { current: count, target: achievement.target, done: count >= achievement.target };
  }
  if (achievement.type === 'noHints') {
    const count = progress.stats?.noHintWins ?? 0;
    return { current: count, target: achievement.target, done: count >= achievement.target };
  }
  let done = 0;
  const total = achievement.to - achievement.from + 1;
  for (let i = achievement.from; i <= achievement.to; i++) {
    if (progress.completedLevels[i]) done++;
  }
  return { current: done, target: total, done: done >= total };
}
