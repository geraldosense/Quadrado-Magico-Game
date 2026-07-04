import { GAME_DEFINITION, UI_LABELS } from '../config/gameDefinition.js';

export function renderLoadingView(container, { onComplete }) {
  container.innerHTML = `
    <div class="loading-screen">
      <div class="loading-decor" aria-hidden="true">
        <span class="loading-num loading-num--1">1</span>
        <span class="loading-num loading-num--4">4</span>
        <span class="loading-num loading-num--8">8</span>
        <span class="loading-num loading-num--9">9</span>
        <span class="loading-shape">★</span>
        <span class="loading-shape">+</span>
      </div>

      <h1 class="loading-title">
        <span class="loading-title-blue">${GAME_DEFINITION.title.split(' ')[0]}</span>
        <span class="loading-title-orange">${GAME_DEFINITION.title.split(' ')[1]}</span>
      </h1>

      <div class="loading-tip">
        Complete o quadrado. A soma deve ser <strong>15!</strong>
      </div>

      <div class="loading-mini-grid">
        ${[[8,null,1],[null,3,null],[4,null,9]].map((row) =>
          row.map((n) => `<div class="loading-cell">${n ?? ''}</div>`).join('')
        ).join('')}
      </div>

      <div class="loading-bar-wrap">
        <div class="loading-bar" data-loading-bar></div>
      </div>
      <p class="loading-text">${UI_LABELS.loading}</p>
    </div>
  `;

  const bar = container.querySelector('[data-loading-bar]');
  let progress = 0;
  const interval = setInterval(() => {
    progress += 4;
    bar.style.width = `${Math.min(progress, 100)}%`;
    if (progress >= 100) {
      clearInterval(interval);
      setTimeout(onComplete, 300);
    }
  }, 60);
}
