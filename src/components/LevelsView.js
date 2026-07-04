import { WORLDS } from '../config/gridPresets.js';
import { getLevelsByWorld, TOTAL_LEVELS } from '../config/levels.js';
import { UI_LABELS } from '../config/gameDefinition.js';
import { renderLevelStars } from '../utils/stars.js';
import { renderBottomNav } from './BottomNav.js';

function renderLevelChip(level, progress) {
  const unlocked = level.id <= progress.unlockedLevel;
  const completed = !!progress.completedLevels[level.id];
  const stars = progress.completedLevels[level.id]?.stars ?? 0;

  return `
    <button type="button"
      class="level-chip level-chip--${level.cardTier} ${!unlocked ? 'level-chip--locked' : ''} ${completed ? 'level-chip--done' : ''}"
      data-level="${level.id}"
      ${!unlocked ? 'disabled aria-label="Bloqueado"' : ''}
      aria-label="Nível ${level.id}">
      <span class="level-chip-num">${level.id}</span>
      <span class="level-chip-stars">${stars ? '★'.repeat(stars) : unlocked ? '○' : '🔒'}</span>
    </button>`;
}

export function renderLevelsView(container, progress, { onBack, onPlayLevel, onNavigate, onComingSoon }) {
  const activeWorld = container.dataset.activeWorld ?? '1';

  container.innerHTML = `
    <div class="levels-screen">
      <header class="page-header">
        <button type="button" class="page-back" data-action="back">${UI_LABELS.game.back}</button>
        <h1 class="page-title">${UI_LABELS.levels.title}</h1>
        <span class="page-spacer"></span>
      </header>

      <div class="levels-summary">
        <span>${Object.keys(progress.completedLevels).length} / ${TOTAL_LEVELS} completos</span>
        <span>★ ${Object.values(progress.completedLevels).reduce((s, l) => s + (l.stars ?? 0), 0)}</span>
      </div>

      <div class="world-tabs" role="tablist">
        ${WORLDS.map((w) => {
          const levels = getLevelsByWorld(w.id);
          const done = levels.filter((l) => progress.completedLevels[l.id]).length;
          return `
            <button type="button" class="world-tab world-tab--${w.cardTier} ${activeWorld === String(w.id) ? 'active' : ''}"
              data-world="${w.id}" role="tab">
              <span class="world-tab-label">${w.gridLabel}</span>
              <span class="world-tab-progress">${done}/${levels.length}</span>
            </button>`;
        }).join('')}
      </div>

      ${WORLDS.map((w) => {
        const levels = getLevelsByWorld(w.id);
        const hidden = activeWorld !== String(w.id) ? 'hidden' : '';
        return `
          <section class="world-panel world-panel--${w.cardTier} ${hidden}" data-world-panel="${w.id}">
            <header class="world-panel-header">
              <h2>${w.name}</h2>
              <p>${UI_LABELS.levels.worldDesc.replace('{grid}', w.gridLabel).replace('{from}', w.levelFrom).replace('{to}', w.levelTo)}</p>
            </header>
            <div class="levels-grid">
              ${levels.map((level) => renderLevelChip(level, progress)).join('')}
            </div>
          </section>`;
      }).join('')}

      <div class="bottom-nav-wrap"></div>
    </div>
  `;

  container.dataset.activeWorld = activeWorld;

  container.querySelector('[data-action="back"]').addEventListener('click', onBack);

  container.querySelectorAll('.world-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      container.dataset.activeWorld = tab.dataset.world;
      renderLevelsView(container, progress, { onBack, onPlayLevel, onNavigate, onComingSoon });
    });
  });

  container.querySelectorAll('[data-level]').forEach((btn) => {
    btn.addEventListener('click', () => onPlayLevel(+btn.dataset.level));
  });

  renderBottomNav(container.querySelector('.bottom-nav-wrap'), {
    active: 'levels',
    onNavigate: (id) => {
      if (id === 'home') onBack();
      else if (id === 'levels') return;
      else if (id === 'stats') onNavigate('stats');
      else if (id === 'settings') onNavigate('settings');
      else onComingSoon();
    },
  });
}
