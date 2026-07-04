import { UI_LABELS } from '../config/gameDefinition.js';

export function createSettingsModal(settingsStore) {
  const overlay = document.createElement('div');
  overlay.className = 'settings-overlay hidden';
  let unsubscribe = null;

  function render() {
    const s = settingsStore.get();

    overlay.innerHTML = `
      <div class="settings-modal">
        <header class="settings-header">
          <h2>${UI_LABELS.settings.title}</h2>
          <button type="button" class="settings-close" data-action="close" aria-label="Fechar">✕</button>
        </header>
        <div class="settings-body">
          <section class="settings-section">
            <div class="settings-row">
              <div class="settings-row-label">
                <span class="settings-row-title">${UI_LABELS.settings.soundEffects}</span>
                <span class="settings-row-desc">${UI_LABELS.settings.soundEffectsDesc}</span>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" data-setting="soundEnabled" ${s.soundEnabled ? 'checked' : ''} />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </section>

          <section class="settings-section">
            <label class="settings-slider-label" for="sound-volume">
              ${UI_LABELS.settings.soundVolume}
              <span data-value="soundVolume">${s.soundVolume}%</span>
            </label>
            <input type="range" id="sound-volume" class="settings-slider"
              min="0" max="100" step="5" value="${s.soundVolume}" data-setting="soundVolume" />
          </section>

          <section class="settings-section">
            <div class="settings-row">
              <div class="settings-row-label">
                <span class="settings-row-title">${UI_LABELS.settings.music}</span>
                <span class="settings-row-desc">${UI_LABELS.settings.musicDesc}</span>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" data-setting="musicEnabled" ${s.musicEnabled ? 'checked' : ''} />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </section>

          <section class="settings-section">
            <label class="settings-slider-label" for="music-volume">
              ${UI_LABELS.settings.musicVolume}
              <span data-value="musicVolume">${s.musicVolume}%</span>
            </label>
            <input type="range" id="music-volume" class="settings-slider"
              min="0" max="100" step="5" value="${s.musicVolume}" data-setting="musicVolume" />
          </section>
        </div>
        <footer class="settings-footer">
          <button type="button" class="settings-save-btn" data-action="close">${UI_LABELS.settings.close}</button>
        </footer>
      </div>
    `;

    overlay.querySelectorAll('[data-action="close"]').forEach((b) =>
      b.addEventListener('click', close)
    );
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    overlay.querySelectorAll('[data-setting]').forEach((input) => {
      input.addEventListener('input', () => {
        const key = input.dataset.setting;
        const value = input.type === 'checkbox' ? input.checked : +input.value;
        settingsStore.set(key, value);
        const valueEl = overlay.querySelector(`[data-value="${key}"]`);
        if (valueEl) valueEl.textContent = `${value}%`;
      });
    });
  }

  function open() {
    render();
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    unsubscribe = settingsStore.subscribe(render);
  }

  function close() {
    overlay.classList.add('hidden');
    document.body.style.overflow = '';
    unsubscribe?.();
    unsubscribe = null;
  }

  return { element: overlay, open, close };
}
