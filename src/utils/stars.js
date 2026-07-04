/**
 * Calcula estrelas com base no desempenho no nível.
 * 3 = perfeito · 2 = usou dicas ou teve erros · 1 = completou com dificuldade
 */
export function calculateStars({ time, hintsUsed, errorsCount }) {
  let stars = 3;
  if (hintsUsed > 0) stars -= 1;
  if (errorsCount > 0) stars -= 1;
  if (time > 180) stars -= 1;
  return Math.max(1, Math.min(3, stars));
}

/** Mostra apenas as estrelas ganhas (sem placeholders vazios). */
export function renderEarnedStars(count, { maxDisplay = 15, className = 'star-earned' } = {}) {
  if (!count || count <= 0) {
    return '<span class="stars-none">—</span>';
  }
  const shown = Math.min(count, maxDisplay);
  const stars = Array.from({ length: shown }, () =>
    `<span class="${className}" aria-hidden="true">★</span>`
  ).join('');
  const extra = count > maxDisplay
    ? `<span class="stars-more">+${count - maxDisplay}</span>`
    : '';
  return `<span class="stars-group">${stars}${extra}</span>`;
}

/** Estrelas de um nível (máx. 3, só as ganhas). */
export function renderLevelStars(count) {
  if (!count) return '';
  return renderEarnedStars(count, { maxDisplay: 3, className: 'level-star level-star--filled' });
}
