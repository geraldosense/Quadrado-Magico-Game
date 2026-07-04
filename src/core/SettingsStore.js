import { applyThemeSettings } from '../utils/settingsTheme.js';

const STORAGE_KEY = 'quadrado-magico-settings';

export const DEFAULTS = {
  soundEnabled: true,
  musicEnabled: true,
  vibrationEnabled: true,
  masterVolume: 70,
  soundVolume: 80,
  musicVolume: 50,
  showErrors: true,
  confirmRestart: true,
  confirmMoves: false,
  hintsEnabled: true,
  timerEnabled: true,
  defaultDifficulty: 'Fácil',
  inputMode: 'both',
  theme: 'light',
  accentColor: 'blue',
  numberStyle: 'standard',
  animationsEnabled: true,
  notificationsEnabled: true,
  dailyReminder: true,
  dailyChallenge: true,
  achievementNotifs: true,
  progressNotifs: true,
  newsNotifs: false,
  promoNotifs: false,
  shareData: false,
};

export class SettingsStore {
  constructor() {
    this.listeners = new Set();
    this.settings = this.load();
    applyThemeSettings(this.settings);
    if (this.settings.theme === 'auto') {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        applyThemeSettings(this.settings);
      });
    }
  }

  load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : { ...DEFAULTS };
    } catch {
      return { ...DEFAULTS };
    }
  }

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
  }

  get() {
    return { ...this.settings };
  }

  set(key, value) {
    this.settings[key] = value;
    this.save();
    if (['theme', 'accentColor', 'numberStyle', 'animationsEnabled'].includes(key)) {
      applyThemeSettings(this.settings);
    }
    this.notify();
  }

  setMany(updates) {
    Object.assign(this.settings, updates);
    this.save();
    applyThemeSettings(this.settings);
    this.notify();
  }

  reset() {
    this.settings = { ...DEFAULTS };
    this.save();
    applyThemeSettings(this.settings);
    this.notify();
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    this.listeners.forEach((cb) => cb(this.get()));
  }
}
