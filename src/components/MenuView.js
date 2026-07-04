import { APP_INFO, GAME_DEFINITION, UI_LABELS } from '../config/gameDefinition.js';
import { renderEarnedStars } from '../utils/stars.js';
import { renderHomeBottomNav } from './BottomNav.js';

const ICONS = {
  play: `<svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>`,
  grid: `<svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/></svg>`,
  stats: `<svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M5 9h2v10H5V9zm4 3h2v7H9v-7zm4-5h2v12h-2V7zm4 4h2v8h-2v-8z"/></svg>`,
  info: `<svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"/></svg>`,
};

export function renderMenuView(container, { totalStars, onPlay, onSelectLevel, onInfo, onStats, onSettings, onComingSoon }) {
  container.innerHTML = `
    <div class="home-screen">
      <div class="home-rays" aria-hidden="true"></div>
      <div class="home-decor" aria-hidden="true">
        <span>1</span><span>4</span><span>8</span><span>9</span><span>★</span><span>+</span>
      </div>

      <header class="home-top-bar">
        <button type="button" class="home-top-btn" data-action="settings" aria-label="Configurações">${ICONS.settings}</button>
        <div class="home-stars-badge" aria-label="${totalStars} estrelas ganhas">
          ${renderEarnedStars(totalStars, { maxDisplay: 9, className: 'home-star' })}
        </div>
      </header>

      <div class="home-hero">
        <div class="home-trophy">🏆</div>
        <h1 class="home-title">
          <span class="home-title-line1">${GAME_DEFINITION.title.split(' ')[0]}</span>
          <span class="home-title-line2">${GAME_DEFINITION.title.split(' ')[1]}</span>
        </h1>
        <p class="home-subtitle">${APP_INFO.subtitle}</p>
      </div>

      <nav class="home-actions">
        <button type="button" class="home-action-btn home-action-btn--play" data-action="play">
          ${ICONS.play}
          <span>${UI_LABELS.menu.play}</span>
        </button>
        <button type="button" class="home-action-btn home-action-btn--secondary" data-action="levels">
          ${ICONS.grid}
          <span>${UI_LABELS.menu.selectLevel}</span>
        </button>
        <button type="button" class="home-action-btn home-action-btn--secondary" data-action="stats">
          ${ICONS.stats}
          <span>${UI_LABELS.menu.stats}</span>
        </button>
        <button type="button" class="home-action-btn home-action-btn--secondary" data-action="info">
          ${ICONS.info}
          <span>${UI_LABELS.menu.info}</span>
        </button>
      </nav>

      <div class="home-bottom-nav-wrap"></div>
    </div>
  `;

  renderHomeBottomNav(container.querySelector('.home-bottom-nav-wrap'), {
    onNavigate: onComingSoon,
  });

  container.querySelector('[data-action="play"]').addEventListener('click', onPlay);
  container.querySelector('[data-action="levels"]').addEventListener('click', onSelectLevel);
  container.querySelector('[data-action="stats"]').addEventListener('click', onStats);
  container.querySelector('[data-action="info"]').addEventListener('click', onInfo);
  container.querySelector('[data-action="settings"]').addEventListener('click', onSettings);
}

export function updateMenuStars(container, totalStars) {
  const badge = container.querySelector('.home-stars-badge');
  if (badge) {
    badge.setAttribute('aria-label', `${totalStars} estrelas ganhas`);
    badge.innerHTML = renderEarnedStars(totalStars, { maxDisplay: 9, className: 'home-star' });
  }
}
