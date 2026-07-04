import { LEVELS } from '../config/levels.js';
import { UI_LABELS } from '../config/gameDefinition.js';
import { renderLevelStars } from '../utils/stars.js';
import { renderBottomNav } from './BottomNav.js';

export function renderLevelsView(container, progress, { onBack, onPlayLevel, onNavigate, onComingSoon }) {
  container.innerHTML = `
    <div class="levels-screen">
      <header class="page-header">
        <button type="button" class="page-back" data-action="back">${UI_LABELS.game.back}</button>
        <h1 class="page-title">${UI_LABELS.levels.title}</h1>
        <span class="page-spacer"></span>
      </header>

      <div class="levels-list">
        ${LEVELS.map((level) => {
          const unlocked = level.id <= progress.unlockedLevel;
          const completed = !!progress.completedLevels[level.id];
          const stars = progress.completedLevels[level.id]?.stars ?? 0;

          return `
            <article class="level-card ${!unlocked ? 'level-card--locked' : ''} ${completed ? 'level-card--done' : ''}">
              <div class="level-card-info">
                <h2 class="level-card-name">${level.name} — ${level.title}</h2>
                <p class="level-card-meta">${level.gridLabel} · ${level.difficulty} · ${level.clues} ${UI_LABELS.levels.clues}</p>
                <p class="level-card-objective">${level.objective}</p>
                <div class="level-card-stars">${renderLevelStars(stars) || '<span class="stars-none">—</span>'}</div>
              </div>
              <div class="level-card-action">
                ${!unlocked
                  ? `<span class="level-lock" aria-label="${UI_LABELS.levels.locked}">🔒</span>`
                  : completed
                    ? `<span class="level-badge level-badge--done">${UI_LABELS.levels.complete}</span>`
                    : `<button type="button" class="level-play-btn" data-level="${level.id}">${UI_LABELS.levels.play}</button>`
                }
                ${unlocked && completed
                  ? `<button type="button" class="level-play-btn level-play-btn--small" data-level="${level.id}">${UI_LABELS.levels.play}</button>`
                  : ''
                }
              </div>
            </article>`;
        }).join('')}
      </div>

      <div class="bottom-nav-wrap"></div>
    </div>
  `;

  container.querySelector('[data-action="back"]').addEventListener('click', onBack);
  container.querySelectorAll('[data-level]').forEach((btn) => {
    btn.addEventListener('click', () => onPlayLevel(+btn.dataset.level));
  });

  renderBottomNav(container.querySelector('.bottom-nav-wrap'), {
    active: 'levels',
    onNavigate: (id) => {
      if (id === 'home') onBack();
      else if (id === 'levels') return;
      else if (id === 'settings') onNavigate('settings');
      else onComingSoon();
    },
  });
}
