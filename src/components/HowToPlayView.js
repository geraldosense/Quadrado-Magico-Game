import { GAME_DEFINITION, GAME_RULES, UI_LABELS } from '../config/gameDefinition.js';
import { SOLUTION } from '../config/levels.js';

export function renderHowToPlayView(container, { onBack, onPlay }) {
  container.innerHTML = `
    <div class="howto-screen">
      <header class="page-header page-header--solid">
        <button type="button" class="page-back page-back--light" data-action="back">${UI_LABELS.howToPlay.back}</button>
        <h1 class="page-title page-title--light">${UI_LABELS.howToPlay.title}</h1>
        <span class="page-spacer"></span>
      </header>

      <div class="howto-content">
        <section class="howto-card">
          <h2>${UI_LABELS.howToPlay.rules}</h2>
          <p>${GAME_RULES.summary}</p>
          <ul>${GAME_RULES.howToPlay.map((i) => `<li>${i}</li>`).join('')}</ul>
        </section>

        <section class="howto-example">
          <div class="howto-example-label">${UI_LABELS.howToPlay.example}</div>
          <div class="howto-example-body">
            <div class="howto-grid">
              ${SOLUTION.map((row) => row.map((n) =>
                `<div class="howto-grid-cell">${n}</div>`
              ).join('')).join('')}
            </div>
            <div class="howto-checklist">
              ${GAME_DEFINITION.winConditions.map((c) =>
                `<div class="howto-check">✓ ${c.label} = 15</div>`
              ).join('')}
            </div>
          </div>
        </section>

        <section class="howto-card">
          <h2>${UI_LABELS.howToPlay.tips}</h2>
          <ul>${GAME_RULES.tips.map((t) => `<li>${t}</li>`).join('')}</ul>
        </section>

        <button type="button" class="howto-play-btn" data-action="play">
          ▶ ${UI_LABELS.howToPlay.start}
        </button>
      </div>
    </div>
  `;

  container.querySelector('[data-action="back"]').addEventListener('click', onBack);
  container.querySelector('[data-action="play"]').addEventListener('click', onPlay);
}
