export function renderStarRow(rating, { max = 5, className = 'review-star', filled = '★', empty = '☆' } = {}) {
  return Array.from({ length: max }, (_, i) => {
    const on = i < Math.round(rating);
    return `<span class="${className} ${on ? `${className}--on` : `${className}--off`}" aria-hidden="true">${on ? filled : empty}</span>`;
  }).join('');
}

export function renderStarPicker(name, selected = 0) {
  return `
    <div class="chat-star-picker" role="radiogroup" aria-label="Avaliação por estrelas">
      ${Array.from({ length: 5 }, (_, i) => {
        const value = i + 1;
        const checked = selected === value ? 'checked' : '';
        return `
          <label class="chat-star-picker__item">
            <input type="radio" name="${name}" value="${value}" ${checked} required />
            <span class="chat-star-picker__icon" data-value="${value}">★</span>
          </label>`;
      }).join('')}
    </div>`;
}

export function getAvatarInitials(name) {
  const parts = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function avatarColor(name) {
  const palette = ['#1a3a6b', '#2a5298', '#27ae60', '#e67e22', '#8e44ad', '#16a085', '#c0392b', '#2980b9'];
  let hash = 0;
  const str = String(name ?? '');
  for (let i = 0; i < str.length; i += 1) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}

export function formatReviewDate(iso) {
  try {
    return new Intl.DateTimeFormat('pt-PT', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatReviewDateRelative(iso) {
  try {
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'agora';
    if (mins < 60) return `há ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `há ${hours} h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `há ${days} d`;
    return formatReviewDate(iso);
  } catch {
    return formatReviewDate(iso);
  }
}
