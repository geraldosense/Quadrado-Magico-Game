import { GameEngine } from './core/GameEngine.js';
import { SettingsStore } from './core/SettingsStore.js';
import { ProgressStore } from './core/ProgressStore.js';
import { SoundManager } from './core/SoundManager.js';
import { getLevel, isLevelUnlocked } from './config/levels.js';
import { renderLoadingView } from './components/LoadingView.js';
import { renderMenuView, updateMenuStars } from './components/MenuView.js';
import { renderLevelsView } from './components/LevelsView.js';
import { renderInfoView } from './components/InfoView.js';
import { renderHowToPlayView } from './components/HowToPlayView.js';
import { renderSettingsView } from './components/SettingsView.js';
import { createGameView } from './components/GameView.js';
import { UI_LABELS } from './config/gameDefinition.js';

class App {
  constructor() {
    this.engine = new GameEngine();
    this.settingsStore = new SettingsStore();
    this.progressStore = new ProgressStore();
    this.soundManager = new SoundManager(this.settingsStore);
    this.currentLevelId = 1;

    this.loadingContainer = document.getElementById('loading-view');
    this.menuContainer = document.getElementById('menu-view');
    this.levelsContainer = document.getElementById('levels-view');
    this.gameContainer = document.getElementById('game-view');
    this.howtoContainer = document.getElementById('howto-view');
    this.infoContainer = document.getElementById('info-view');
    this.settingsContainer = document.getElementById('settings-view');
    this.toast = document.getElementById('toast');

    this.containers = {
      loading: this.loadingContainer,
      menu: this.menuContainer,
      levels: this.levelsContainer,
      play: this.gameContainer,
      howto: this.howtoContainer,
      info: this.infoContainer,
      settings: this.settingsContainer,
    };

    this.gameView = createGameView(this.gameContainer, this.engine, {
      onBack: () => this.navigate('menu'),
      onLevels: () => this.navigate('levels'),
      onNextLevel: (id) => {
        if (getLevel(id)) this.startLevel(id);
        else { this.showToast(UI_LABELS.menu.comingSoon); this.navigate('levels'); }
      },
      onSettings: () => this.navigate('settings'),
      onComingSoon: () => this.showToast(UI_LABELS.menu.comingSoon),
      soundManager: this.soundManager,
      settingsStore: this.settingsStore,
      progressStore: this.progressStore,
    });

    this.progressStore.subscribe(() => this.refreshMenu());
    this.init();
  }

  init() {
    renderLoadingView(this.loadingContainer, {
      onComplete: () => {
        this.setupMenu();
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
      onStats: () => this.showToast(UI_LABELS.menu.comingSoon),
      onSettings: () => this.navigate('settings'),
      onComingSoon: () => this.showToast(UI_LABELS.menu.comingSoon),
    });
    renderLevelsView(this.levelsContainer, this.progressStore.get(), {
      onBack: () => this.navigate('menu'),
      onPlayLevel: (id) => this.startLevel(id),
      onNavigate: (view) => this.navigate(view),
      onComingSoon: () => this.showToast(UI_LABELS.menu.comingSoon),
    });
    renderInfoView(this.infoContainer, {
      onBack: () => this.navigate('menu'),
    });
    renderHowToPlayView(this.howtoContainer, {
      onBack: () => this.navigate('menu'),
      onPlay: () => this.startLevel(this.getPlayLevelId()),
    });
    renderSettingsView(this.settingsContainer, this.settingsStore, {
      onBack: () => this.navigate('menu'),
      onHowToPlay: () => this.navigate('howto'),
    });
  }

  refreshMenu() {
    updateMenuStars(this.menuContainer, this.progressStore.getTotalStars());
    renderLevelsView(this.levelsContainer, this.progressStore.get(), {
      onBack: () => this.navigate('menu'),
      onPlayLevel: (id) => this.startLevel(id),
      onNavigate: (view) => this.navigate(view),
      onComingSoon: () => this.showToast(UI_LABELS.menu.comingSoon),
    });
  }

  getPlayLevelId() {
    const { unlockedLevel, completedLevels } = this.progressStore.get();
    for (let i = 1; i <= unlockedLevel; i++) {
      if (!completedLevels[i]) return i;
    }
    return 1;
  }

  startLevel(levelId) {
    const progress = this.progressStore.get();
    const level = getLevel(levelId);
    if (!isLevelUnlocked(levelId, progress)) {
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

    if (view === 'play') {
      this.gameView.mount(levelId ?? this.currentLevelId);
      this.soundManager.startMusic();
    } else {
      this.gameView.unmount();
      this.soundManager.stopMusic();
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
