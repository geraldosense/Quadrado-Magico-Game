import { UI_LABELS } from '../config/gameDefinition.js';

const NAV_ITEMS = [
  { id: 'home', icon: '🏠', label: UI_LABELS.nav.home },
  { id: 'levels', icon: '▦', label: UI_LABELS.nav.levels },
  { id: 'stats', icon: '📊', label: UI_LABELS.nav.stats },
  { id: 'settings', icon: '⚙', label: UI_LABELS.nav.settings },
];

export function renderBottomNav(container, { active, onNavigate }) {
  container.innerHTML = `
    <nav class="bottom-nav">
      ${NAV_ITEMS.map((item) => `
        <button type="button" class="bottom-nav-item ${active === item.id ? 'active' : ''}"
          data-nav="${item.id}">
          <span class="bottom-nav-icon">${item.icon}</span>
          <span class="bottom-nav-label">${item.label}</span>
        </button>
      `).join('')}
    </nav>
  `;
  container.querySelectorAll('[data-nav]').forEach((btn) => {
    btn.addEventListener('click', () => onNavigate(btn.dataset.nav));
  });
}

export function renderHomeBottomNav(container, { onNavigate }) {
  const ITEMS = [
    { id: 'rewards', icon: '🎁', label: UI_LABELS.menu.rewards, badge: 2 },
    { id: 'daily', icon: '📅', label: UI_LABELS.menu.daily, badge: 1 },
    { id: 'achievements', icon: '🏆', label: UI_LABELS.menu.achievements },
    { id: 'shop', icon: '🏪', label: UI_LABELS.menu.shop },
  ];

  container.innerHTML = `
    <nav class="home-bottom-nav">
      ${ITEMS.map((item) => `
        <button type="button" class="home-bottom-nav-item" data-nav="${item.id}">
          <span class="home-bottom-nav-icon-wrap">
            <span class="home-bottom-nav-icon">${item.icon}</span>
            ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}
          </span>
          <span class="home-bottom-nav-label">${item.label}</span>
        </button>
      `).join('')}
    </nav>
  `;
  container.querySelectorAll('[data-nav]').forEach((btn) => {
    btn.addEventListener('click', () => onNavigate(btn.dataset.nav));
  });
}
