import { APP_INFO, CREDITS, GAME_DEFINITION, UI_LABELS } from '../config/gameDefinition.js';

function renderTeamPortrait(photos) {
  if (!photos?.length) return '';

  const renderFrame = (photo, extraClass = '') => {
    const fitClass = photo.fit === 'contain' ? ' team-portrait__frame--contain' : '';
    const style = `object-position: ${photo.position ?? '50% 20%'};`;
    return `
      <figure class="team-portrait__frame team-portrait__frame--round ${extraClass}${fitClass}">
        <img src="${photo.src}" alt="${photo.alt}" loading="lazy" decoding="async" style="${style}" />
      </figure>`;
  };

  if (photos.length >= 2) {
    return `
      <div class="team-portrait team-portrait--dual team-portrait--stacked">
        ${photos.map((photo, i) =>
          renderFrame(photo, i === 0 ? 'team-portrait__frame--primary' : 'team-portrait__frame--secondary')
        ).join('')}
      </div>`;
  }

  return `
    <div class="team-portrait team-portrait--single">
      ${renderFrame(photos[0], 'team-portrait__frame--primary')}
    </div>`;
}

function renderTeamProfile(person, variant) {
  const contributions = person.contributions?.length
    ? `<ul class="team-profile__contributions">
        ${person.contributions.map((item) => `<li>${item}</li>`).join('')}
      </ul>`
    : '';

  return `
    <article class="team-profile team-profile--${variant}">
      ${renderTeamPortrait(person.photos)}
      <div class="team-profile__body">
        <header class="team-profile__header">
          <span class="team-profile__role">${person.role}</span>
          <h3 class="team-profile__name">${person.name}</h3>
          <p class="team-profile__title">${person.title}</p>
        </header>
        <p class="team-profile__bio">${person.description}</p>
        ${contributions ? `
          <div class="team-profile__contribs">
            <span class="team-profile__contribs-label">${UI_LABELS.info.contributions}</span>
            ${contributions}
          </div>` : ''}
      </div>
    </article>`;
}

function renderAboutSection(section) {
  if (section.items) {
    return `
      <section class="info-card info-card--list">
        <h3>${section.title}</h3>
        <ul>${section.items.map((item) => `<li>${item}</li>`).join('')}</ul>
      </section>`;
  }
  return `
    <section class="info-card">
      <h3>${section.title}</h3>
      <p>${section.content}</p>
    </section>`;
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
          <header class="team-section-header">
            <span class="team-section-eyebrow">${UI_LABELS.info.teamSubtitle}</span>
            <h2>${UI_LABELS.info.credits}</h2>
            <p class="team-section-intro">${CREDITS.teamIntro}</p>
          </header>
          <div class="team-list">
            ${renderTeamProfile(CREDITS.developer, 'creator')}
            ${renderTeamProfile(CREDITS.ideaProvider, 'challenge')}
          </div>
        </section>

        <section class="info-section info-section--about">
          <h2 class="info-section-title">Sobre o Jogo</h2>
          ${CREDITS.aboutSections.map(renderAboutSection).join('')}
        </section>

        <footer class="info-footer">
          <p class="info-footer__brand">${GAME_DEFINITION.title}</p>
          <p class="info-footer__tagline">${APP_INFO.subtitle}</p>
          <p class="info-footer__copy">© ${APP_INFO.year} · Projecto educativo angolano</p>
        </footer>
      </div>
    </div>
  `;

  container.querySelector('[data-action="back"]').addEventListener('click', onBack);
}
