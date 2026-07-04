import { ACHIEVEMENTS, getAchievementProgress } from '../config/achievements.js';
import { TOTAL_LEVELS } from '../config/levels.js';
import { UI_LABELS } from '../config/gameDefinition.js';
import { renderBottomNav } from './BottomNav.js';

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function renderStatsView(container, progressStore, { onBack, onNavigate, onAchievements }) {
  const progress = progressStore.get();
  const { stats } = progress;
  const totalStars = progressStore.getTotalStars();
  const completed = progressStore.getCompletedCount();
  const achievements = progressStore.getUnlockedAchievementsCount();

  container.innerHTML = `
    <div class="stats-screen">
      <header class="page-header page-header--solid">
        <button type="button" class="page-back page-back--light" data-action="back">${UI_LABELS.game.back}</button>
        <h1 class="page-title page-title--light">${UI_LABELS.stats.title}</h1>
        <span class="page-spacer"></span>
      </header>

      <div class="stats-content">
        <section class="stats-hero">
          <div class="stats-score">${progress.score}</div>
          <p>${UI_LABELS.stats.scoreLabel}</p>
        </section>

        <div class="stats-grid">
          <article class="stat-card">
            <span class="stat-icon">★</span>
            <strong>${totalStars}</strong>
            <span>${UI_LABELS.stats.totalStars}</span>
          </article>
          <article class="stat-card">
            <span class="stat-icon">▦</span>
            <strong>${completed}/${TOTAL_LEVELS}</strong>
            <span>${UI_LABELS.stats.levelsCompleted}</span>
          </article>
          <article class="stat-card">
            <span class="stat-icon">⏱</span>
            <strong>${formatTime(stats.totalPlayTime)}</strong>
            <span>${UI_LABELS.stats.totalTime}</span>
          </article>
          <article class="stat-card">
            <span class="stat-icon">⭐</span>
            <strong>${stats.perfectLevels}</strong>
            <span>${UI_LABELS.stats.perfectLevels}</span>
          </article>
          <article class="stat-card">
            <span class="stat-icon">💡</span>
            <strong>${stats.totalHints}</strong>
            <span>${UI_LABELS.stats.totalHints}</span>
          </article>
          <article class="stat-card">
            <span class="stat-icon">✗</span>
            <strong>${stats.totalErrors}</strong>
            <span>${UI_LABELS.stats.totalErrors}</span>
          </article>
          <article class="stat-card">
            <span class="stat-icon">🎯</span>
            <strong>${stats.noHintWins}</strong>
            <span>${UI_LABELS.stats.noHintWins}</span>
          </article>
          <article class="stat-card">
            <span class="stat-icon">🏆</span>
            <strong>${achievements}/${ACHIEVEMENTS.length}</strong>
            <span>${UI_LABELS.stats.achievements}</span>
          </article>
        </div>

        <button type="button" class="stats-achievements-btn" data-action="achievements">
          ${UI_LABELS.stats.viewAchievements}
        </button>
      </div>

      <div class="bottom-nav-wrap"></div>
    </div>
  `;

  container.querySelector('[data-action="back"]').addEventListener('click', onBack);
  container.querySelector('[data-action="achievements"]')?.addEventListener('click', onAchievements);

  renderBottomNav(container.querySelector('.bottom-nav-wrap'), {
    active: 'stats',
    onNavigate: (id) => {
      if (id === 'home') onBack();
      else if (id === 'levels') onNavigate('levels');
      else if (id === 'stats') return;
      else if (id === 'settings') onNavigate('settings');
    },
  });
}

export function renderAchievementsView(container, progressStore, { onBack, onNavigate }) {
  const progress = progressStore.get();

  container.innerHTML = `
    <div class="achievements-screen">
      <header class="page-header page-header--solid">
        <button type="button" class="page-back page-back--light" data-action="back">${UI_LABELS.game.back}</button>
        <h1 class="page-title page-title--light">${UI_LABELS.achievements.title}</h1>
        <span class="page-spacer"></span>
      </header>

      <div class="achievements-content">
        ${ACHIEVEMENTS.map((ach) => {
          const unlocked = !!progress.achievements[ach.id];
          const { current, target } = getAchievementProgress(ach, progress);
          const pct = Math.min(100, Math.round((current / target) * 100));
          return `
            <article class="achievement-card ${unlocked ? 'achievement-card--unlocked' : ''}">
              <div class="achievement-icon">${ach.icon}</div>
              <div class="achievement-body">
                <h3>${ach.title}</h3>
                <p>${ach.description}</p>
                ${!unlocked ? `
                  <div class="achievement-progress">
                    <div class="achievement-progress-bar" style="width:${pct}%"></div>
                  </div>
                  <span class="achievement-progress-text">${current}/${target}</span>
                ` : `<span class="achievement-badge">${UI_LABELS.achievements.unlocked}</span>`}
              </div>
              ${ach.reward ? `<span class="achievement-reward">+${ach.reward}</span>` : ''}
            </article>`;
        }).join('')}
      </div>

      <div class="bottom-nav-wrap"></div>
    </div>
  `;

  container.querySelector('[data-action="back"]').addEventListener('click', onBack);

  renderBottomNav(container.querySelector('.bottom-nav-wrap'), {
    active: 'stats',
    onNavigate: (id) => {
      if (id === 'home') onBack();
      else if (id === 'levels') onNavigate('levels');
      else if (id === 'settings') onNavigate('settings');
    },
  });
}
