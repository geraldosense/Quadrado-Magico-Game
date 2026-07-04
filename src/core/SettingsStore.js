const STORAGE_KEY = 'quadrado-magico-settings';

const DEFAULTS = {
  soundEnabled: true,
  musicEnabled: true,
  vibrationEnabled: true,
  soundVolume: 80,
  musicVolume: 60,
  showErrors: true,
  confirmRestart: true,
  defaultDifficulty: 'Fácil',
  theme: 'light',
};

export class SettingsStore {
  constructor() {
    this.listeners = new Set();
    this.settings = this.load();
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
