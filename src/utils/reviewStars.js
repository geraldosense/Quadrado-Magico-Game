export function renderStarRow(rating, { max = 5, className = 'review-star', filled = '★', empty = '☆' } = {}) {
  return Array.from({ length: max }, (_, i) => {
    const on = i < Math.round(rating);
    return `<span class="${className} ${on ? `${className}--on` : `${className}--off`}" aria-hidden="true">${on ? filled : empty}</span>`;
  }).join('');
}

export function renderStarPicker(name, selected = 0, labels = []) {
  return `
    <div class="review-star-picker" role="radiogroup" aria-label="Avaliação por estrelas">
      ${Array.from({ length: 5 }, (_, i) => {
        const value = i + 1;
        const checked = selected === value ? 'checked' : '';
        return `
          <label class="review-star-picker__item">
            <input type="radio" name="${name}" value="${value}" ${checked} required />
            <span class="review-star-picker__icon" data-value="${value}">★</span>
            ${labels[i] ? `<span class="review-star-picker__hint">${labels[i]}</span>` : ''}
          </label>`;
      }).join('')}
    </div>`;
}

export function formatReviewDate(iso) {
  try {
    return new Intl.DateTimeFormat('pt-PT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
