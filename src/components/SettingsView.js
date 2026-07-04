import { UI_LABELS } from '../config/gameDefinition.js';

export function renderSettingsView(container, settingsStore, { onBack, onHowToPlay }) {
  const s = settingsStore.get();

  container.innerHTML = `
    <div class="settings-page">
      <header class="page-header page-header--solid">
        <button type="button" class="page-back page-back--light" data-action="back">${UI_LABELS.game.back}</button>
        <h1 class="page-title page-title--light">${UI_LABELS.settings.title}</h1>
        <span class="page-spacer"></span>
      </header>

      <div class="settings-page-body">
        <section class="settings-group">
          <h3 class="settings-group-title">${UI_LABELS.settings.general}</h3>
          <div class="settings-item">
            <span>${UI_LABELS.settings.theme}</span>
            <span class="settings-value">${UI_LABELS.settings.themeLight}</span>
          </div>
          ${toggleRow(UI_LABELS.settings.sound, 'soundEnabled', s.soundEnabled)}
          ${toggleRow(UI_LABELS.settings.music, 'musicEnabled', s.musicEnabled)}
          ${toggleRow(UI_LABELS.settings.vibration, 'vibrationEnabled', s.vibrationEnabled)}
          ${sliderRow(UI_LABELS.settings.soundVolume, 'soundVolume', s.soundVolume)}
          ${sliderRow(UI_LABELS.settings.musicVolume, 'musicVolume', s.musicVolume)}
        </section>

        <section class="settings-group">
          <h3 class="settings-group-title">${UI_LABELS.settings.game}</h3>
          ${toggleRow(UI_LABELS.settings.showErrors, 'showErrors', s.showErrors)}
          ${toggleRow(UI_LABELS.settings.confirmRestart, 'confirmRestart', s.confirmRestart)}
          <div class="settings-item">
            <span>${UI_LABELS.settings.defaultDifficulty}</span>
            <span class="settings-value">${s.defaultDifficulty}</span>
          </div>
        </section>

        <section class="settings-group">
          <h3 class="settings-group-title">${UI_LABELS.settings.about}</h3>
          <button type="button" class="settings-link" data-action="howto">${UI_LABELS.settings.howToPlay}</button>
        </section>
      </div>
    </div>
  `;

  container.querySelector('[data-action="back"]').addEventListener('click', onBack);
  container.querySelector('[data-action="howto"]').addEventListener('click', onHowToPlay);

  container.querySelectorAll('[data-setting]').forEach((input) => {
    input.addEventListener('change', () => {
      const key = input.dataset.setting;
      const value = input.type === 'checkbox' ? input.checked : +input.value;
      settingsStore.set(key, value);
      const valEl = container.querySelector(`[data-value="${key}"]`);
      if (valEl) valEl.textContent = `${value}%`;
    });
    input.addEventListener('input', () => {
      if (input.type === 'range') {
        const valEl = container.querySelector(`[data-value="${input.dataset.setting}"]`);
        if (valEl) valEl.textContent = `${input.value}%`;
        settingsStore.set(input.dataset.setting, +input.value);
      }
    });
  });
}

function toggleRow(label, key, checked) {
  return `
    <div class="settings-item">
      <span>${label}</span>
      <label class="toggle-switch">
        <input type="checkbox" data-setting="${key}" ${checked ? 'checked' : ''} />
        <span class="toggle-slider"></span>
      </label>
    </div>`;
}

function sliderRow(label, key, value) {
  return `
    <div class="settings-item settings-item--slider">
      <label for="${key}">${label} <span data-value="${key}">${value}%</span></label>
      <input type="range" id="${key}" class="settings-slider" min="0" max="100" step="5"
        value="${value}" data-setting="${key}" />
    </div>`;
}
