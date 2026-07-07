import { REVIEWS_CONFIG } from '../config/reviewsConfig.js';

const LOCAL_REVIEWS_KEY = 'quadrado-magico-reviews';
const LOCAL_AUTHOR_KEY = 'quadrado-magico-reviewer-name';

const MIN_NAME = 2;
const MAX_NAME = 48;
const MIN_COMMENT = 10;
const MAX_COMMENT = 600;
const MAX_IMPROVEMENTS = 600;

export class ReviewsStore {
  constructor() {
    this.reviews = [];
    this.listeners = new Set();
    this.ready = false;
    this.syncing = false;
    this.remoteEnabled = false;
    this.firestore = null;
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify() {
    this.listeners.forEach((fn) => fn(this.getState()));
  }

  getState() {
    return {
      reviews: [...this.reviews],
      stats: this.getStats(),
      ready: this.ready,
      syncing: this.syncing,
      remoteEnabled: this.remoteEnabled,
      savedAuthorName: this.getSavedAuthorName(),
    };
  }

  async init() {
    this.reviews = this.loadLocal();
    if (REVIEWS_CONFIG.firebase?.enabled && REVIEWS_CONFIG.firebase.projectId) {
      try {
        await this.initFirebase();
        this.remoteEnabled = true;
        await this.fetchRemote();
      } catch (err) {
        console.warn('ReviewsStore: sincronização remota indisponível', err);
        this.remoteEnabled = false;
      }
    }
    this.ready = true;
    this.notify();
  }

  async initFirebase() {
    const cfg = REVIEWS_CONFIG.firebase;
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js');
    const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
    const app = initializeApp({
      apiKey: cfg.apiKey,
      authDomain: cfg.authDomain,
      projectId: cfg.projectId,
      storageBucket: cfg.storageBucket,
      messagingSenderId: cfg.messagingSenderId,
      appId: cfg.appId,
    });
    this.firestore = getFirestore(app);
  }

  async fetchRemote() {
    if (!this.firestore) return;
    this.syncing = true;
    this.notify();
    try {
      const { collection, getDocs, query, orderBy } = await import(
        'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js'
      );
      const col = collection(this.firestore, REVIEWS_CONFIG.firebase.collection || 'reviews');
      const snap = await getDocs(query(col, orderBy('createdAt', 'desc')));
      const remote = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      this.reviews = this.mergeReviews(this.reviews, remote);
      this.saveLocal();
    } finally {
      this.syncing = false;
      this.notify();
    }
  }

  mergeReviews(local, remote) {
    const map = new Map();
    [...local, ...remote].forEach((r) => {
      const key = r.id || `${r.authorName}-${r.createdAt}`;
      map.set(key, r);
    });
    return [...map.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  loadLocal() {
    try {
      const raw = localStorage.getItem(LOCAL_REVIEWS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  saveLocal() {
    localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify(this.reviews));
  }

  getSavedAuthorName() {
    return localStorage.getItem(LOCAL_AUTHOR_KEY) || '';
  }

  saveAuthorName(name) {
    localStorage.setItem(LOCAL_AUTHOR_KEY, name.trim());
  }

  validate({ authorName, rating, comment, improvements }) {
    const name = authorName?.trim() ?? '';
    const text = comment?.trim() ?? '';
    const extra = improvements?.trim() ?? '';
    const stars = Number(rating);

    if (name.length < MIN_NAME || name.length > MAX_NAME) {
      return { ok: false, error: 'name' };
    }
    if (!Number.isFinite(stars) || stars < 1 || stars > 5) {
      return { ok: false, error: 'rating' };
    }
    if (text.length < MIN_COMMENT || text.length > MAX_COMMENT) {
      return { ok: false, error: 'comment' };
    }
    if (extra.length > MAX_IMPROVEMENTS) {
      return { ok: false, error: 'improvements' };
    }
    return { ok: true, data: { authorName: name, rating: stars, comment: text, improvements: extra } };
  }

  async submitReview(payload) {
    const check = this.validate(payload);
    if (!check.ok) return check;

    const review = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...check.data,
      createdAt: new Date().toISOString(),
      version: '2.0',
    };

    this.saveAuthorName(review.authorName);
    this.syncing = true;
    this.notify();

    try {
      if (this.remoteEnabled && this.firestore) {
        const { collection, addDoc } = await import(
          'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js'
        );
        const col = collection(this.firestore, REVIEWS_CONFIG.firebase.collection || 'reviews');
        const docRef = await addDoc(col, {
          authorName: review.authorName,
          rating: review.rating,
          comment: review.comment,
          improvements: review.improvements,
          createdAt: review.createdAt,
          version: review.version,
        });
        review.id = docRef.id;
      }

      this.reviews.unshift(review);
      this.saveLocal();
      return { ok: true, review };
    } catch (err) {
      console.error('ReviewsStore: falha ao publicar', err);
      this.reviews.unshift(review);
      this.saveLocal();
      return { ok: true, review, offline: true };
    } finally {
      this.syncing = false;
      this.notify();
    }
  }

  getStats() {
    if (!this.reviews.length) {
      return { count: 0, average: 0, distribution: [0, 0, 0, 0, 0] };
    }
    const distribution = [0, 0, 0, 0, 0];
    let sum = 0;
    this.reviews.forEach((r) => {
      const idx = Math.min(5, Math.max(1, Math.round(r.rating))) - 1;
      distribution[idx] += 1;
      sum += r.rating;
    });
    return {
      count: this.reviews.length,
      average: Math.round((sum / this.reviews.length) * 10) / 10,
      distribution,
    };
  }
}
