const STORAGE_KEY = 'quadrado-magico-progress';

const DEFAULTS = {
  score: 0,
  unlockedLevel: 1,
  completedLevels: {},
};

export class ProgressStore {
  constructor() {
    this.listeners = new Set();
    this.progress = this.load();
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
  }

  get() {
    return { ...this.progress, completedLevels: { ...this.progress.completedLevels } };
  }

  completeLevel(levelId, { time, hintsUsed, stars = 3 }) {
    const existing = this.progress.completedLevels[levelId];
    const bestStars = existing ? Math.max(existing.stars, stars) : stars;
    const starGain = existing ? Math.max(0, bestStars - existing.stars) : bestStars;

    this.progress.completedLevels[levelId] = {
      stars: bestStars,
      bestTime: existing ? Math.min(existing.bestTime, time) : time,
      hintsUsed: existing ? Math.min(existing.hintsUsed, hintsUsed) : hintsUsed,
    };

    if (levelId >= this.progress.unlockedLevel) {
      this.progress.unlockedLevel = levelId + 1;
    }

    if (starGain > 0) {
      this.progress.score += 100 * starGain;
    }

    this.save();
    this.notify();
    return bestStars;
  }

  getTotalStars() {
    return Object.values(this.progress.completedLevels).reduce(
      (sum, level) => sum + (level.stars ?? 0),
      0
    );
  }

  isCompleted(levelId) {
    return !!this.progress.completedLevels[levelId];
  }

  getStars(levelId) {
    return this.progress.completedLevels[levelId]?.stars ?? 0;
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    this.listeners.forEach((cb) => cb(this.get()));
  }
}
