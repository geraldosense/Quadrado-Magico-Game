import { GameEngine } from './core/GameEngine.js';
import { SettingsStore } from './core/SettingsStore.js';
import { ProgressStore } from './core/ProgressStore.js';
import { SoundManager } from './core/SoundManager.js';
import { getLevel, isLevelUnlocked, TOTAL_LEVELS } from './config/levels.js';
import { renderLoadingView } from './components/LoadingView.js';
import { renderMenuView, updateMenuStars } from './components/MenuView.js';
import { renderLevelsView } from './components/LevelsView.js';
import { renderInfoView } from './components/InfoView.js';
import { renderHowToPlayView } from './components/HowToPlayView.js';
import { renderSettingsView } from './components/SettingsView.js';
import { renderStatsView, renderAchievementsView } from './components/StatsView.js';
import { createGameView } from './components/GameView.js';
import { ReviewsStore } from './core/ReviewsStore.js';
import { CREATOR_FLOAT, UI_LABELS } from './config/gameDefinition.js';

class App {
  constructor() {
    this.engine = new GameEngine();
    this.settingsStore = new SettingsStore();
    this.progressStore = new ProgressStore();
    this.reviewsStore = new ReviewsStore();
    this.soundManager = new SoundManager(this.settingsStore);
    this.currentLevelId = 1;

    this.loadingContainer = document.getElementById('loading-view');
    this.menuContainer = document.getElementById('menu-view');
    this.levelsContainer = document.getElementById('levels-view');
    this.gameContainer = document.getElementById('game-view');
    this.howtoContainer = document.getElementById('howto-view');
    this.infoContainer = document.getElementById('info-view');
    this.settingsContainer = document.getElementById('settings-view');
    this.statsContainer = document.getElementById('stats-view');
    this.achievementsContainer = document.getElementById('achievements-view');
    this.toast = document.getElementById('toast');

    this.containers = {
      loading: this.loadingContainer,
      menu: this.menuContainer,
      levels: this.levelsContainer,
      play: this.gameContainer,
      howto: this.howtoContainer,
      info: this.infoContainer,
      settings: this.settingsContainer,
      stats: this.statsContainer,
      achievements: this.achievementsContainer,
    };

    this.gameView = createGameView(this.gameContainer, this.engine, {
      onBack: () => this.navigate('menu'),
      onLevels: () => this.navigate('levels'),
      onNextLevel: (id) => {
        if (id <= TOTAL_LEVELS && getLevel(id)) this.startLevel(id);
        else { this.showToast(UI_LABELS.menu.allComplete); this.navigate('levels'); }
      },
      onSettings: () => this.navigate('settings'),
      onStats: () => this.navigate('stats'),
      onComingSoon: () => this.showToast(UI_LABELS.menu.comingSoon),
      soundManager: this.soundManager,
      settingsStore: this.settingsStore,
      progressStore: this.progressStore,
    });

    this.progressStore.subscribe(() => this.refreshViews());
    this.creatorFloatEl = document.getElementById('creator-float');
    this.menuReady = false;
    this.mountCreatorFloat();
    this.reviewsStore.init();
    this.init();
  }

  mountCreatorFloat() {
    if (!this.creatorFloatEl) return;

    const { photo, name, fullName, label, photoPosition } = CREATOR_FLOAT;
    this.creatorFloatEl.innerHTML = `
      <button type="button" class="creator-float__btn" data-action="creator-info"
        aria-label="${fullName} — ${label}">
        <span class="creator-float__wrap">
          <span class="creator-float__pulse" aria-hidden="true"></span>
          <span class="creator-float__avatar">
            <img src="${photo}" alt="${name}" style="object-position: ${photoPosition}" />
          </span>
        </span>
        <span class="creator-float__label">${label}</span>
      </button>`;

    this.creatorFloatEl.querySelector('[data-action="creator-info"]')?.addEventListener('click', () => {
      if (this.menuReady) this.navigate('info');
    });
  }

  updateCreatorFloat(view) {
    if (!this.creatorFloatEl) return;
    const visible = view === 'loading' || view === 'menu';
    this.creatorFloatEl.classList.toggle('hidden', !visible);
  }

  init() {
    renderLoadingView(this.loadingContainer, {
      onComplete: () => {
        this.setupMenu();
        this.menuReady = true;
        this.navigate('menu');
      },
    });
    this.navigate('loading');
  }

  setupMenu() {
    renderMenuView(this.menuContainer, {
      totalStars: this.progressStore.getTotalStars(),
      onPlay: () => this.startLevel(this.getPlayLevelId()),
      onSelectLevel: () => this.navigate('levels'),
      onInfo: () => this.navigate('info'),
      onStats: () => this.navigate('stats'),
      onSettings: () => this.navigate('settings'),
      onAchievements: () => this.navigate('achievements'),
      onComingSoon: () => this.showToast(UI_LABELS.menu.comingSoon),
    });
    this.refreshViews();
    renderInfoView(this.infoContainer, { onBack: () => this.navigate('menu') });
    renderHowToPlayView(this.howtoContainer, {
      onBack: () => this.navigate('menu'),
      onPlay: () => this.startLevel(this.getPlayLevelId()),
    });
    renderSettingsView(this.settingsContainer, this.settingsStore, this.progressStore, this.reviewsStore, {
      onBack: () => this.navigate('menu'),
      onHowToPlay: () => this.navigate('howto'),
      onInfo: () => this.navigate('info'),
      onStats: () => this.navigate('stats'),
      onPreviewSound: () => this.soundManager.previewSounds(),
      onShowText: (type) => this.showLegalModal(type),
      onToast: (msg) => this.showToast(msg),
      onDataCleared: () => this.refreshViews(),
    });
  }

  showLegalModal(type) {
    const L = UI_LABELS.settings;
    const title = type === 'privacy' ? L.privacyPolicy : L.termsOfUse;
    const text = type === 'privacy' ? L.privacyText : L.termsText;
    const overlay = document.createElement('div');
    overlay.className = 'settings-legal-overlay';
    overlay.innerHTML = `
      <div class="settings-legal-modal">
        <h3>${title}</h3>
        <p>${text}</p>
        <button type="button">OK</button>
      </div>`;
    overlay.querySelector('button').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  }

  refreshViews() {
    updateMenuStars(this.menuContainer, this.progressStore.getTotalStars());
    const progress = this.progressStore.get();
    const nav = {
      onBack: () => this.navigate('menu'),
      onPlayLevel: (id) => this.startLevel(id),
      onNavigate: (view) => this.navigate(view),
      onComingSoon: () => this.showToast(UI_LABELS.menu.comingSoon),
    };
    renderLevelsView(this.levelsContainer, progress, nav);
    renderStatsView(this.statsContainer, this.progressStore, {
      ...nav,
      onAchievements: () => this.navigate('achievements'),
    });
    renderAchievementsView(this.achievementsContainer, this.progressStore, nav);
  }

  getPlayLevelId() {
    const { unlockedLevel, completedLevels } = this.progressStore.get();
    for (let i = 1; i <= Math.min(unlockedLevel, TOTAL_LEVELS); i++) {
      if (!completedLevels[i]) return i;
    }
    return Math.min(unlockedLevel, TOTAL_LEVELS);
  }

  startLevel(levelId) {
    const progress = this.progressStore.get();
    const level = getLevel(levelId);
    if (!level || !isLevelUnlocked(levelId, progress)) {
      this.showToast(UI_LABELS.levels.locked);
      return;
    }
    this.currentLevelId = levelId;
    this.navigate('play', levelId);
  }

  navigate(view, levelId) {
    Object.entries(this.containers).forEach(([key, el]) => {
      el.classList.toggle('hidden', key !== view);
    });
    document.body.className = `view-${view}`;
    this.updateCreatorFloat(view);

    if (view === 'settings') {
      this.reviewsStore.fetchRemote?.();
      renderSettingsView(this.settingsContainer, this.settingsStore, this.progressStore, this.reviewsStore, {
        onBack: () => this.navigate('menu'),
        onHowToPlay: () => this.navigate('howto'),
        onInfo: () => this.navigate('info'),
        onStats: () => this.navigate('stats'),
        onPreviewSound: () => this.soundManager.previewSounds(),
        onShowText: (type) => this.showLegalModal(type),
        onToast: (msg) => this.showToast(msg),
        onDataCleared: () => this.refreshViews(),
      });
    }

    if (view === 'play') {
      this.gameView.mount(levelId ?? this.currentLevelId);
      this.soundManager.startGameMusic();
    } else {
      this.gameView.unmount();
      if (view !== 'loading') {
        this.soundManager.startMenuMusic();
      } else {
        this.soundManager.stopMusic();
      }
    }
  }

  showToast(msg) {
    this.toast.textContent = msg;
    this.toast.classList.add('visible');
    clearTimeout(this._t);
    this._t = setTimeout(() => this.toast.classList.remove('visible'), 2500);
  }
}

document.addEventListener('DOMContentLoaded', () => new App());
