import { ACHIEVEMENTS, getAchievementProgress } from '../config/achievements.js';
import { TOTAL_LEVELS } from '../config/levels.js';

const STORAGE_KEY = 'quadrado-magico-progress';

const DEFAULTS = {
  score: 0,
  unlockedLevel: 1,
  completedLevels: {},
  stats: {
    totalPlayTime: 0,
    gamesWon: 0,
    totalHints: 0,
    totalErrors: 0,
    perfectLevels: 0,
    noHintWins: 0,
    gamesStarted: 0,
  },
  achievements: {},
};

export class ProgressStore {
  constructor() {
    this.listeners = new Set();
    this.progress = this.load();
    this.migrate();
  }

  migrate() {
    if (!this.progress.stats) this.progress.stats = { ...DEFAULTS.stats };
    if (!this.progress.achievements) this.progress.achievements = {};
    this.checkAchievements(false);
  }

  load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...DEFAULTS, ...JSON.parse(saved), stats: { ...DEFAULTS.stats, ...(JSON.parse(saved).stats || {}) } } : { ...DEFAULTS, stats: { ...DEFAULTS.stats }, achievements: {} };
    } catch {
      return { ...DEFAULTS, stats: { ...DEFAULTS.stats }, achievements: {} };
    }
  }

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
  }

  get() {
    return {
      ...this.progress,
      completedLevels: { ...this.progress.completedLevels },
      stats: { ...this.progress.stats },
      achievements: { ...this.progress.achievements },
    };
  }

  recordGameStart() {
    this.progress.stats.gamesStarted += 1;
    this.save();
  }

  completeLevel(levelId, { time, hintsUsed, stars = 3, errorsCount = 0 }) {
    const existing = this.progress.completedLevels[levelId];
    const bestStars = existing ? Math.max(existing.stars, stars) : stars;
    const starGain = existing ? Math.max(0, bestStars - existing.stars) : bestStars;
    const isFirstComplete = !existing;

    this.progress.completedLevels[levelId] = {
      stars: bestStars,
      bestTime: existing ? Math.min(existing.bestTime, time) : time,
      hintsUsed: existing ? Math.min(existing.hintsUsed, hintsUsed) : hintsUsed,
      errorsCount: existing ? Math.min(existing.errorsCount ?? errorsCount, errorsCount) : errorsCount,
    };

    if (levelId >= this.progress.unlockedLevel && levelId < TOTAL_LEVELS) {
      this.progress.unlockedLevel = levelId + 1;
    } else if (levelId >= TOTAL_LEVELS && levelId >= this.progress.unlockedLevel) {
      this.progress.unlockedLevel = TOTAL_LEVELS;
    }

    if (starGain > 0) {
      this.progress.score += 100 * starGain;
    }

    this.progress.stats.totalPlayTime += time;
    this.progress.stats.gamesWon += 1;
    this.progress.stats.totalHints += hintsUsed;
    this.progress.stats.totalErrors += errorsCount;

    if (bestStars === 3 && (isFirstComplete || (existing?.stars ?? 0) < 3)) {
      this.progress.stats.perfectLevels = Object.values(this.progress.completedLevels)
        .filter((l) => l.stars === 3).length;
    }

    if (hintsUsed === 0 && isFirstComplete) {
      this.progress.stats.noHintWins += 1;
    }

    this.checkAchievements(true);
    this.save();
    this.notify();
    return bestStars;
  }

  checkAchievements(notifyUnlock = true) {
    const newlyUnlocked = [];
    ACHIEVEMENTS.forEach((ach) => {
      if (this.progress.achievements[ach.id]) return;
      const { done } = getAchievementProgress(ach, this.progress);
      if (done) {
        this.progress.achievements[ach.id] = { unlockedAt: Date.now() };
        if (ach.reward) this.progress.score += ach.reward;
        newlyUnlocked.push(ach);
      }
    });
    if (notifyUnlock && newlyUnlocked.length) {
      this._pendingAchievements = newlyUnlocked;
    }
    return newlyUnlocked;
  }

  consumePendingAchievements() {
    const pending = this._pendingAchievements ?? [];
    this._pendingAchievements = [];
    return pending;
  }

  getTotalStars() {
    return Object.values(this.progress.completedLevels).reduce(
      (sum, level) => sum + (level.stars ?? 0),
      0
    );
  }

  getCompletedCount() {
    return Object.keys(this.progress.completedLevels).length;
  }

  getUnlockedAchievementsCount() {
    return Object.keys(this.progress.achievements).length;
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

  reset() {
    this.progress = {
      score: 0,
      unlockedLevel: 1,
      completedLevels: {},
      stats: { ...DEFAULTS.stats },
      achievements: {},
    };
    this.save();
    this.notify();
  }
}
