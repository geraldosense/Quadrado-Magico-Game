import { APP_INFO, GAME_DEFINITION, UI_LABELS } from '../config/gameDefinition.js';
import { ACCENT_COLORS } from '../utils/settingsTheme.js';
import { formatReviewDateRelative, getAvatarInitials, avatarColor, renderStarPicker, renderStarRow } from '../utils/reviewStars.js';

const SECTIONS = [
  { id: 'appearance', icon: '🎨', color: '#e8f0fa' },
  { id: 'sound', icon: '🔊', color: '#e8f8ef' },
  { id: 'gameplay', icon: '🎮', color: '#fef5e7' },
  { id: 'reviews', icon: '💬', color: '#fff4e6' },
  { id: 'notifications', icon: '🔔', color: '#f0e8fa' },
  { id: 'privacy', icon: '🔒', color: '#fdeef6' },
  { id: 'about', icon: 'ℹ️', color: '#e6f7fb' },
];

export function renderSettingsView(container, settingsStore, progressStore, reviewsStore, callbacks) {
  let section = 'hub';
  let reviewFormRating = 0;
  let reviewSubmitting = false;

  const render = () => {
    const s = settingsStore.get();
    const L = UI_LABELS.settings;
    const reviewState = reviewsStore?.getState?.() ?? { reviews: [], stats: { count: 0, average: 0 }, ready: true };

    container.innerHTML = `
      <div class="settings-page${section === 'reviews' ? ' settings-page--community' : ''}">
        ${renderHeader(section, L, () => {
          if (section === 'hub') callbacks.onBack();
          else { section = 'hub'; render(); }
        })}
        <div class="settings-page-body">
          ${section === 'hub' ? renderHub(L) : ''}
          ${section === 'appearance' ? renderAppearance(s, L) : ''}
          ${section === 'sound' ? renderSound(s, L) : ''}
          ${section === 'gameplay' ? renderGameplay(s, L) : ''}
          ${section === 'reviews' ? renderReviews(L, reviewState) : ''}
          ${section === 'notifications' ? renderNotifications(s, L) : ''}
          ${section === 'privacy' ? renderPrivacy(s, L) : ''}
          ${section === 'about' ? renderAbout(L) : ''}
        </div>
        ${section === 'hub' ? `
          <footer class="settings-footer">
            <button type="button" class="settings-restore-btn" data-action="reset-settings">${L.restoreDefaults}</button>
          </footer>` : ''}
      </div>`;

    bindEvents(s);
  };

  function renderHeader(current, L, onBack) {
    const title = current === 'hub' ? L.title : L.sections[current]?.title ?? L.title;
    const subtitle = current === 'hub' ? L.subtitle : L.sections[current]?.subtitle ?? '';
    return `
      <header class="settings-hero ${current !== 'hub' ? 'settings-hero--sub' : ''}">
        <div class="settings-hero-top">
          <button type="button" class="settings-hero-back" data-action="back-header">←</button>
          <div class="settings-hero-icon">${current === 'hub' ? '⚙️' : SECTIONS.find((x) => x.id === current)?.icon ?? '⚙️'}</div>
        </div>
        <h1 class="settings-hero-title">${title}</h1>
        ${subtitle ? `<p class="settings-hero-subtitle">${subtitle}</p>` : ''}
      </header>`;
  }

  function renderHub(L) {
    return `
      <div class="settings-menu">
        ${SECTIONS.map((sec) => `
          <button type="button" class="settings-menu-item" data-section="${sec.id}">
            <span class="settings-menu-icon" style="background:${sec.color}">${sec.icon}</span>
            <span class="settings-menu-text">
              <strong>${L.sections[sec.id].title}</strong>
              <small>${L.sections[sec.id].subtitle}</small>
            </span>
            <span class="settings-menu-chevron">›</span>
          </button>`).join('')}
      </div>`;
  }

  function renderAppearance(s, L) {
    return `
      <section class="settings-card">
        <h3 class="settings-card-title">${L.theme}</h3>
        <div class="settings-theme-grid">
          ${themeCard('light', L.themeLight, '☀️', s.theme)}
          ${themeCard('dark', L.themeDark, '🌙', s.theme)}
          ${themeCard('auto', L.themeAuto, '🔄', s.theme)}
        </div>
      </section>
      <section class="settings-card">
        <h3 class="settings-card-title">${L.accentColor}</h3>
        <div class="settings-color-row">
          ${Object.keys(ACCENT_COLORS).map((c) => `
            <button type="button" class="settings-color-dot ${s.accentColor === c ? 'active' : ''}"
              data-setting="accentColor" data-value="${c}"
              style="background:${ACCENT_COLORS[c].mid}" aria-label="${c}"></button>`).join('')}
        </div>
      </section>
      <section class="settings-card">
        <h3 class="settings-card-title">${L.numberStyle}</h3>
        <div class="settings-choice-row">
          ${choiceBtn('numberStyle', 'standard', L.numberStandard, s.numberStyle)}
          ${choiceBtn('numberStyle', 'modern', L.numberModern, s.numberStyle)}
        </div>
      </section>
      ${toggleCard(L.animations, 'animationsEnabled', s.animationsEnabled)}
    `;
  }

  function renderSound(s, L) {
    return `
      ${sliderCard(L.masterVolume, 'masterVolume', s.masterVolume)}
      ${toggleCard(L.music, 'musicEnabled', s.musicEnabled)}
      ${sliderCard(L.musicVolume, 'musicVolume', s.musicVolume, !s.musicEnabled)}
      ${toggleCard(L.sound, 'soundEnabled', s.soundEnabled)}
      ${sliderCard(L.soundVolume, 'soundVolume', s.soundVolume, !s.soundEnabled)}
      ${toggleCard(L.vibration, 'vibrationEnabled', s.vibrationEnabled)}
      <section class="settings-card settings-card--action">
        <button type="button" class="settings-preview-btn" data-action="preview-sound">▶ ${L.previewSound}</button>
      </section>
    `;
  }

  function renderReviews(L, state) {
    const { reviews, stats, remoteEnabled, syncing, savedAuthorName, lastError } = state;
    const R = L.reviews;
    const savedName = savedAuthorName.trim().toLowerCase();

    const feed = reviews.length
      ? reviews.map((r) => {
          const isMine = savedName && r.authorName?.trim().toLowerCase() === savedName;
          const initials = getAvatarInitials(r.authorName);
          const color = avatarColor(r.authorName);
          return `
            <article class="chat-msg ${isMine ? 'chat-msg--mine' : 'chat-msg--other'}" data-review-id="${escapeHtml(r.id ?? '')}">
              ${!isMine ? `<span class="chat-msg__avatar" style="background:${color}" aria-hidden="true">${initials}</span>` : ''}
              <div class="chat-msg__bubble">
                <header class="chat-msg__head">
                  <strong class="chat-msg__author">${escapeHtml(r.authorName)}</strong>
                  <span class="chat-msg__stars" aria-label="${r.rating} de 5 estrelas">
                    ${renderStarRow(r.rating, { className: 'chat-msg-star' })}
                  </span>
                </header>
                <p class="chat-msg__text">${escapeHtml(r.comment)}</p>
                ${r.improvements ? `
                  <div class="chat-msg__extra">
                    <span class="chat-msg__extra-label">${R.improvementsLabel}</span>
                    <p>${escapeHtml(r.improvements)}</p>
                  </div>` : ''}
                <footer class="chat-msg__foot">
                  <time datetime="${r.createdAt}">${formatReviewDateRelative(r.createdAt)}</time>
                </footer>
              </div>
              ${isMine ? `<span class="chat-msg__avatar chat-msg__avatar--mine" style="background:${color}" aria-hidden="true">${initials}</span>` : ''}
            </article>`;
        }).join('')
      : `<div class="chat-empty">
          <span class="chat-empty__icon" aria-hidden="true">💬</span>
          <p>${R.emptyList}</p>
        </div>`;

    return `
      <section class="community-panel">
        <header class="community-header">
          <div class="community-header__brand">
            <span class="community-header__icon" aria-hidden="true">🎮</span>
            <div>
              <h3 class="community-header__title">${R.communityTitle}</h3>
              <p class="community-header__status ${remoteEnabled ? 'is-online' : 'is-offline'}">
                ${remoteEnabled ? R.communityOnline : R.communityOffline}
                · ${stats.count} ${R.totalReviews}
                · v${APP_INFO.version}
              </p>
            </div>
          </div>
          <button type="button" class="community-refresh-btn" data-action="refresh-reviews" ${syncing ? 'disabled' : ''} aria-label="${R.refresh}">
            ↻
          </button>
        </header>

        ${lastError && !remoteEnabled ? `<p class="community-error">${R.syncError}</p>` : ''}
        ${!remoteEnabled ? `<p class="community-error">${R.syncHint}</p>` : ''}

        <div class="community-stats">
          <div class="community-stats__score">
            <span class="community-stats__value">${stats.average.toFixed(1)}</span>
            <div class="community-stats__stars">${renderStarRow(stats.average, { className: 'community-star' })}</div>
          </div>
          <p class="community-stats__note">${R.communityIntro}</p>
        </div>

        ${syncing ? `<p class="community-syncing">${R.syncing}</p>` : ''}

        <div class="community-feed" data-community-feed role="log" aria-live="polite" aria-relevant="additions">
          ${feed}
        </div>

        <div class="community-composer">
          <form class="community-form" data-review-form novalidate>
            <div class="community-form__row">
              <input type="text" name="authorName" class="community-form__name" maxlength="48"
                placeholder="${R.namePlaceholder}" value="${escapeHtml(savedAuthorName)}" required autocomplete="name" />
              ${renderStarPicker('reviewRating', reviewFormRating)}
            </div>

            <div class="community-form__compose">
              <textarea name="comment" class="community-form__input" rows="2" maxlength="600"
                placeholder="${R.commentPlaceholder}" required data-char-target="comment-count"></textarea>
              <button type="submit" class="community-form__send" ${reviewSubmitting ? 'disabled' : ''} aria-label="${R.submit}">
                ${reviewSubmitting ? '…' : '➤'}
              </button>
            </div>

            <div class="community-form__meta">
              <span class="community-form__count" id="comment-count">0 / 600</span>
              <button type="button" class="community-form__toggle" data-action="toggle-improvements">
                ${R.improvementsToggle}
              </button>
            </div>

            <div class="community-form__extra hidden" data-improvements-panel>
              <textarea name="improvements" class="community-form__input community-form__input--extra" rows="2" maxlength="600"
                placeholder="${R.improvementsPlaceholder}"></textarea>
            </div>
          </form>
        </div>
      </section>`;
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderGameplay(s, L) {
    return `
      <section class="settings-card">
        <h3 class="settings-card-title">${L.defaultDifficulty}</h3>
        <select class="settings-select" data-setting="defaultDifficulty">
          ${['Fácil', 'Médio', 'Difícil'].map((d) =>
            `<option value="${d}" ${s.defaultDifficulty === d ? 'selected' : ''}>${d}</option>`).join('')}
        </select>
      </section>
      ${toggleCard(L.confirmMoves, 'confirmMoves', s.confirmMoves)}
      ${toggleCard(L.hintsEnabled, 'hintsEnabled', s.hintsEnabled)}
      ${toggleCard(L.showErrors, 'showErrors', s.showErrors)}
      ${toggleCard(L.timerEnabled, 'timerEnabled', s.timerEnabled)}
      ${toggleCard(L.confirmRestart, 'confirmRestart', s.confirmRestart)}
      <section class="settings-card">
        <h3 class="settings-card-title">${L.inputMode}</h3>
        <div class="settings-choice-row">
          ${choiceBtn('inputMode', 'tap', L.inputTap, s.inputMode)}
          ${choiceBtn('inputMode', 'drag', L.inputDrag, s.inputMode)}
          ${choiceBtn('inputMode', 'both', L.inputBoth, s.inputMode)}
        </div>
      </section>
      <section class="settings-card settings-card--action">
        <button type="button" class="settings-link-btn" data-action="howto">📖 ${L.howToPlay}</button>
      </section>
    `;
  }

  function renderNotifications(s, L) {
    return `
      ${toggleCard(L.notificationsEnabled, 'notificationsEnabled', s.notificationsEnabled)}
      <section class="settings-card">
        <h3 class="settings-card-title">${L.reminders}</h3>
        ${toggleRow(L.dailyReminder, 'dailyReminder', s.dailyReminder, !s.notificationsEnabled)}
        ${toggleRow(L.dailyChallenge, 'dailyChallenge', s.dailyChallenge, !s.notificationsEnabled)}
      </section>
      <section class="settings-card">
        <h3 class="settings-card-title">${L.progressNotifsTitle}</h3>
        ${toggleRow(L.achievementNotifs, 'achievementNotifs', s.achievementNotifs, !s.notificationsEnabled)}
        ${toggleRow(L.progressNotifs, 'progressNotifs', s.progressNotifs, !s.notificationsEnabled)}
      </section>
      <section class="settings-card">
        <h3 class="settings-card-title">${L.otherNotifs}</h3>
        ${toggleRow(L.newsNotifs, 'newsNotifs', s.newsNotifs, !s.notificationsEnabled)}
        ${toggleRow(L.promoNotifs, 'promoNotifs', s.promoNotifs, !s.notificationsEnabled)}
      </section>
    `;
  }

  function renderPrivacy(s, L) {
    return `
      <section class="settings-card settings-card--action">
        <button type="button" class="settings-link-btn" data-action="privacy-policy">📄 ${L.privacyPolicy}</button>
        <button type="button" class="settings-link-btn" data-action="terms">📋 ${L.termsOfUse}</button>
      </section>
      ${toggleCard(L.shareData, 'shareData', s.shareData)}
      <section class="settings-card settings-card--danger">
        <button type="button" class="settings-danger-btn" data-action="clear-data">🗑 ${L.clearLocalData}</button>
        <p class="settings-danger-note">${L.clearLocalDataNote}</p>
      </section>
    `;
  }

  function renderAbout(L) {
    return `
      <section class="settings-card settings-about-card">
        <div class="settings-about-logo">3×3</div>
        <h2>${GAME_DEFINITION.title}</h2>
        <p class="settings-about-version">v${APP_INFO.version}</p>
        <p class="settings-about-desc">${APP_INFO.subtitle}</p>
      </section>
      <section class="settings-card settings-card--action">
        <button type="button" class="settings-link-btn" data-action="info">ℹ️ ${L.aboutGame}</button>
        <button type="button" class="settings-link-btn" data-action="stats">📊 ${L.viewStats}</button>
        <button type="button" class="settings-link-btn" data-action="howto">📖 ${L.howToPlay}</button>
      </section>
    `;
  }

  function themeCard(value, label, emoji, current) {
    return `
      <button type="button" class="settings-theme-card ${current === value ? 'active' : ''}"
        data-setting="theme" data-value="${value}">
        <span class="settings-theme-emoji">${emoji}</span>
        <span>${label}</span>
      </button>`;
  }

  function choiceBtn(key, value, label, current) {
    return `
      <button type="button" class="settings-choice-btn ${current === value ? 'active' : ''}"
        data-setting="${key}" data-value="${value}">${label}</button>`;
  }

  function toggleCard(label, key, checked) {
    return `
      <section class="settings-card settings-card--toggle">
        <span>${label}</span>
        ${toggleSwitch(key, checked)}
      </section>`;
  }

  function toggleRow(label, key, checked, disabled = false) {
    return `
      <div class="settings-row ${disabled ? 'settings-row--disabled' : ''}">
        <span>${label}</span>
        ${toggleSwitch(key, checked, disabled)}
      </div>`;
  }

  function toggleSwitch(key, checked, disabled = false) {
    return `
      <label class="toggle-switch">
        <input type="checkbox" data-setting="${key}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''} />
        <span class="toggle-slider"></span>
      </label>`;
  }

  function sliderCard(label, key, value, disabled = false) {
    return `
      <section class="settings-card settings-card--slider ${disabled ? 'settings-card--disabled' : ''}">
        <div class="settings-slider-header">
          <span>${label}</span>
          <strong data-value="${key}">${value}%</strong>
        </div>
        <input type="range" class="settings-slider" min="0" max="100" step="5"
          value="${value}" data-setting="${key}" ${disabled ? 'disabled' : ''} />
      </section>`;
  }

  function bindEvents() {
    container.querySelector('[data-action="back-header"]')?.addEventListener('click', () => {
      if (section === 'hub') callbacks.onBack();
      else { section = 'hub'; render(); }
    });

    container.querySelectorAll('[data-section]').forEach((btn) => {
      btn.addEventListener('click', () => { section = btn.dataset.section; render(); });
    });

    container.querySelectorAll('[data-setting][data-value]').forEach((btn) => {
      btn.addEventListener('click', () => {
        settingsStore.set(btn.dataset.setting, btn.dataset.value);
        render();
      });
    });

    container.querySelectorAll('input[data-setting]').forEach((input) => {
      const handler = () => {
        const key = input.dataset.setting;
        const value = input.type === 'checkbox' ? input.checked : input.type === 'range' ? +input.value : input.value;
        settingsStore.set(key, value);
        const valEl = container.querySelector(`[data-value="${key}"]`);
        if (valEl && input.type === 'range') valEl.textContent = `${value}%`;
        if (key === 'notificationsEnabled' || key === 'musicEnabled' || key === 'soundEnabled') render();
      };
      input.addEventListener('change', handler);
      if (input.type === 'range') input.addEventListener('input', handler);
    });

    container.querySelector('select[data-setting]')?.addEventListener('change', (e) => {
      settingsStore.set(e.target.dataset.setting, e.target.value);
    });

    container.querySelector('[data-action="howto"]')?.addEventListener('click', callbacks.onHowToPlay);
    container.querySelector('[data-action="info"]')?.addEventListener('click', callbacks.onInfo);
    container.querySelector('[data-action="stats"]')?.addEventListener('click', callbacks.onStats);
    container.querySelector('[data-action="preview-sound"]')?.addEventListener('click', callbacks.onPreviewSound);
    container.querySelector('[data-action="privacy-policy"]')?.addEventListener('click', () => callbacks.onShowText('privacy'));
    container.querySelector('[data-action="terms"]')?.addEventListener('click', () => callbacks.onShowText('terms'));
    container.querySelector('[data-action="reset-settings"]')?.addEventListener('click', () => {
      if (confirm(UI_LABELS.settings.confirmReset)) {
        settingsStore.reset();
        callbacks.onToast?.(UI_LABELS.settings.resetDone);
        render();
      }
    });
    container.querySelector('[data-action="clear-data"]')?.addEventListener('click', () => {
      if (confirm(UI_LABELS.settings.confirmClearData)) {
        progressStore.reset();
        settingsStore.reset();
        callbacks.onToast?.(UI_LABELS.settings.clearDone);
        callbacks.onDataCleared?.();
        render();
      }
    });

    container.querySelector('[data-action="refresh-reviews"]')?.addEventListener('click', async () => {
      if (reviewsStore?.fetchRemote) {
        await reviewsStore.fetchRemote();
        render();
      }
    });

    container.querySelector('[data-review-form]')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (reviewSubmitting || !reviewsStore) return;

      const form = e.target;
      const fd = new FormData(form);
      const rating = +fd.get('reviewRating');
      reviewFormRating = rating || reviewFormRating;

      reviewSubmitting = true;
      render();

      const result = await reviewsStore.submitReview({
        authorName: fd.get('authorName'),
        rating: fd.get('reviewRating'),
        comment: fd.get('comment'),
        improvements: fd.get('improvements'),
      });

      reviewSubmitting = false;

      if (!result.ok) {
        const R = UI_LABELS.settings.reviews;
        const msg = result.error === 'name' ? R.errorName
          : result.error === 'rating' ? R.errorRating
          : result.error === 'comment' ? R.errorComment
          : R.errorImprovements;
        callbacks.onToast?.(msg);
        render();
        return;
      }

      reviewFormRating = 0;
      form.reset();
      const saved = reviewsStore.getSavedAuthorName();
      form.querySelector('[name="authorName"]').value = saved;
      form.querySelector('[data-improvements-panel]')?.classList.add('hidden');
      callbacks.onToast?.(result.synced ? UI_LABELS.settings.reviews.saved : UI_LABELS.settings.reviews.savedOffline);
      render();
    });

    container.querySelector('[data-action="toggle-improvements"]')?.addEventListener('click', () => {
      container.querySelector('[data-improvements-panel]')?.classList.toggle('hidden');
    });

    const commentInput = container.querySelector('.community-form__input[name="comment"]');
    const commentCount = container.querySelector('#comment-count');
    const updateCommentCount = () => {
      if (commentCount && commentInput) {
        commentCount.textContent = `${commentInput.value.length} / 600`;
      }
    };
    commentInput?.addEventListener('input', updateCommentCount);
    commentInput?.addEventListener('focus', () => {
      requestAnimationFrame(() => {
        commentInput.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
    });
    updateCommentCount();

    container.querySelectorAll('.chat-star-picker input[type="radio"]').forEach((input) => {
      input.addEventListener('change', () => {
        reviewFormRating = +input.value;
        container.querySelectorAll('.chat-star-picker__icon').forEach((icon) => {
          icon.classList.toggle('active', +icon.dataset.value <= reviewFormRating);
        });
      });
    });

    if (reviewFormRating > 0) {
      container.querySelectorAll('.chat-star-picker__icon').forEach((icon) => {
        icon.classList.toggle('active', +icon.dataset.value <= reviewFormRating);
      });
    }

    scrollCommunityFeedToBottom(container);
  }

  function scrollCommunityFeedToBottom(root) {
    const feed = root.querySelector('[data-community-feed]');
    if (!feed) return;
    requestAnimationFrame(() => {
      feed.scrollTop = feed.scrollHeight;
    });
  }

  render();
}
