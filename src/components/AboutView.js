import { APP_INFO, CREDITS, GAME_DEFINITION, UI_LABELS } from '../config/gameDefinition.js';

export function renderAboutView(container, { onBack }) {
  container.innerHTML = `
    <div class="about-screen">
      <header class="screen-header">
        <button type="button" class="back-btn" data-action="back">${UI_LABELS.about.back}</button>
        <h1 class="screen-title">${UI_LABELS.about.title}</h1>
      </header>
      <div class="about-content">
        <section class="about-hero">
          <div class="about-logo-mini">
            <span>${APP_INFO.logo.line1}</span>
            <strong>${APP_INFO.logo.line2}</strong>
            <span>${APP_INFO.logo.line3}</span>
          </div>
          <p class="about-tagline">${APP_INFO.tagline}</p>
        </section>
        <section class="credits-section">
          <h2>${UI_LABELS.about.credits}</h2>
          <article class="credit-card">
            <div class="credit-role">${CREDITS.developer.role}</div>
            <div class="credit-name">${CREDITS.developer.name}</div>
            <p>${CREDITS.developer.description}</p>
          </article>
          <article class="credit-card credit-card--idea">
            <div class="credit-role">${CREDITS.ideaProvider.role}</div>
            <div class="credit-name">${CREDITS.ideaProvider.name}</div>
            <p>${CREDITS.ideaProvider.description}</p>
          </article>
        </section>
        ${CREDITS.aboutSections.map((s) => s.items
          ? `<section class="info-card"><h3>${s.title}</h3><ul>${s.items.map((i) => `<li>${i}</li>`).join('')}</ul></section>`
          : `<section class="info-card"><h3>${s.title}</h3><p>${s.content}</p></section>`
        ).join('')}
        <footer class="about-footer">
          <p>${GAME_DEFINITION.title} · v${APP_INFO.version} · ${APP_INFO.year}</p>
        </footer>
      </div>
    </div>
  `;
  container.querySelector('[data-action="back"]').addEventListener('click', onBack);
}
