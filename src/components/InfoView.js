import { APP_INFO, CREDITS, GAME_DEFINITION, UI_LABELS } from '../config/gameDefinition.js';

function renderTeamPhotos(photos) {
  if (!photos?.length) return '';

  const main = photos.find((p) => p.variant === 'main') ?? photos[0];
  const accent = photos.find((p) => p.variant === 'accent');

  if (accent) {
    return `
      <div class="team-photos team-photos--duo">
        <figure class="team-photo team-photo--main">
          <img src="${main.src}" alt="${main.alt}" loading="lazy" decoding="async" />
        </figure>
        <figure class="team-photo team-photo--accent" aria-hidden="true">
          <img src="${accent.src}" alt="" loading="lazy" decoding="async" />
        </figure>
      </div>
    `;
  }

  return `
    <figure class="team-photos team-photos--single">
      <img src="${main.src}" alt="${main.alt}" loading="lazy" decoding="async" />
    </figure>
  `;
}

function renderTeamCard(person, modifier) {
  return `
    <article class="team-card team-card--${modifier}">
      ${renderTeamPhotos(person.photos)}
      <div class="team-body">
        <span class="team-role">${person.role}</span>
        <h3 class="team-name">${person.name}</h3>
        <p class="team-bio">${person.description}</p>
      </div>
    </article>
  `;
}

export function renderInfoView(container, { onBack }) {
  const titleParts = GAME_DEFINITION.title.split(' ');

  container.innerHTML = `
    <div class="info-screen">
      <header class="page-header page-header--solid">
        <button type="button" class="page-back page-back--light" data-action="back">${UI_LABELS.info.back}</button>
        <h1 class="page-title page-title--light">${UI_LABELS.info.title}</h1>
        <span class="page-spacer"></span>
      </header>

      <div class="info-content">
        <section class="info-hero">
          <div class="info-logo">
            <span>${titleParts[0]}</span>
            <strong>${titleParts[1] ?? ''}</strong>
          </div>
          <p class="info-tagline">${APP_INFO.tagline}</p>
          <p class="info-version">v${APP_INFO.version} · ${APP_INFO.year}</p>
        </section>

        <section class="info-section info-section--team">
          <h2>${UI_LABELS.info.credits}</h2>
          <div class="team-grid">
            ${renderTeamCard(CREDITS.developer, 'developer')}
            ${renderTeamCard(CREDITS.ideaProvider, 'idea')}
          </div>
        </section>

        ${CREDITS.aboutSections.map((s) =>
          s.items
            ? `<section class="info-card"><h3>${s.title}</h3><ul>${s.items.map((i) => `<li>${i}</li>`).join('')}</ul></section>`
            : `<section class="info-card"><h3>${s.title}</h3><p>${s.content}</p></section>`
        ).join('')}

        <footer class="info-footer">
          <p>${GAME_DEFINITION.title} — ${APP_INFO.subtitle}</p>
        </footer>
      </div>
    </div>
  `;

  container.querySelector('[data-action="back"]').addEventListener('click', onBack);
}
