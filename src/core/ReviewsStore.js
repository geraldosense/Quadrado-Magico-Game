import { REVIEWS_CONFIG, getCommunityUrls } from '../config/reviewsConfig.js';

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
    this.syncMode = null;
    this.firestore = null;
    this.lastError = null;
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
      syncMode: this.syncMode,
      lastError: this.lastError,
      savedAuthorName: this.getSavedAuthorName(),
    };
  }

  isCommunityConfigured() {
    const { mode } = getCommunityUrls();
    return Boolean(mode);
  }

  isJsonBinConfigured() {
    const { binId, accessKey } = REVIEWS_CONFIG.jsonbin ?? {};
    return Boolean(binId?.trim() && accessKey?.trim());
  }

  isFirebaseConfigured() {
    const cfg = REVIEWS_CONFIG.firebase ?? {};
    return Boolean(cfg.projectId?.trim() && cfg.apiKey?.trim());
  }

  async init() {
    this.reviews = this.loadLocal();
    const mode = REVIEWS_CONFIG.mode ?? 'auto';

    try {
      if (mode === 'community' || (mode === 'auto' && this.isCommunityConfigured())) {
        if (this.isCommunityConfigured()) {
          this.syncMode = 'community';
          this.remoteEnabled = true;
          await this.fetchRemote();
          await this.migrateLocalToCloud();
        }
      } else if (mode === 'jsonbin' || (mode === 'auto' && this.isJsonBinConfigured())) {
        if (this.isJsonBinConfigured()) {
          this.syncMode = 'jsonbin';
          this.remoteEnabled = true;
          await this.fetchRemote();
          await this.migrateLocalToCloud();
        }
      } else if (mode === 'firebase' || (mode === 'auto' && this.isFirebaseConfigured())) {
        if (this.isFirebaseConfigured()) {
          await this.initFirebase();
          this.syncMode = 'firebase';
          this.remoteEnabled = true;
          await this.fetchRemote();
        }
      }
    } catch (err) {
      console.warn('ReviewsStore: sincronização remota indisponível', err);
      this.lastError = err.message ?? String(err);
      this.remoteEnabled = false;
      this.syncMode = null;
    }

    this.ready = true;
    this.notify();
  }

  async migrateLocalToCloud() {
    if (!this.remoteEnabled || this.syncMode === 'firebase') return;
    const localOnly = this.reviews.filter((r) => !r.synced);
    if (!localOnly.length) return;

    try {
      await this.pushRemote();
      this.reviews.forEach((r) => {
        if (!r.synced) r.synced = true;
      });
      this.saveLocal();
    } catch (err) {
      console.warn('ReviewsStore: migração local → cloud falhou', err);
    }
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
    this.syncing = true;
    this.notify();
    try {
      if (this.syncMode === 'community') {
        await this.fetchCommunity();
      } else if (this.syncMode === 'jsonbin') {
        await this.fetchJsonBin();
      } else if (this.syncMode === 'firebase' && this.firestore) {
        await this.fetchFirebase();
      }
      this.saveLocal();
    } finally {
      this.syncing = false;
      this.notify();
    }
  }

  async pushRemote() {
    if (this.syncMode === 'community') {
      await this.pushCommunity();
    } else if (this.syncMode === 'jsonbin') {
      await this.pushJsonBin();
    }
  }

  async fetchCommunity() {
    const { getUrl, accessKey } = getCommunityUrls();
    const headers = accessKey ? { 'X-Access-Key': accessKey } : {};
    const res = await fetch(getUrl, { cache: 'no-store', headers });
    if (!res.ok) throw new Error(`Community fetch ${res.status}`);
    const json = await res.json();
    const remote = (json.record?.reviews ?? json.reviews) ?? [];
    this.reviews = this.mergeReviews(this.reviews, remote);
    this.reviews.forEach((r) => {
      if (!r.id?.startsWith('local-')) r.synced = true;
    });
    this.lastError = null;
  }

  async pushCommunity() {
    const { putUrl, accessKey } = getCommunityUrls();
    const headers = {
      'Content-Type': 'application/json',
      ...(accessKey ? { 'X-Access-Key': accessKey } : {}),
    };
    const res = await fetch(putUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ reviews: this.reviews }),
    });
    if (!res.ok) throw new Error(`Community push ${res.status}`);
    this.lastError = null;
  }

  async fetchJsonBin() {
    const { binId, accessKey } = REVIEWS_CONFIG.jsonbin;
    const res = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
      headers: { 'X-Access-Key': accessKey },
    });
    if (!res.ok) throw new Error(`JSONBin fetch ${res.status}`);
    const json = await res.json();
    const remote = json.record?.reviews ?? [];
    this.reviews = this.mergeReviews(this.reviews, remote);
  }

  async pushJsonBin() {
    const { binId, accessKey } = REVIEWS_CONFIG.jsonbin;
    const res = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Access-Key': accessKey,
      },
      body: JSON.stringify({ reviews: this.reviews }),
    });
    if (!res.ok) throw new Error(`JSONBin push ${res.status}`);
  }

  async fetchFirebase() {
    const { collection, getDocs, query, orderBy } = await import(
      'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js'
    );
    const col = collection(this.firestore, REVIEWS_CONFIG.firebase.collection || 'reviews');
    const snap = await getDocs(query(col, orderBy('createdAt', 'desc')));
    const remote = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    this.reviews = this.mergeReviews(this.reviews, remote);
  }

  mergeReviews(local, remote) {
    const map = new Map();
    [...local, ...remote].forEach((r) => {
      const key = r.id || `${r.authorName}-${r.createdAt}-${r.comment?.slice(0, 24)}`;
      map.set(key, r);
    });
    return [...map.values()].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
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
      if (this.remoteEnabled && this.syncMode === 'community') {
        await this.fetchCommunity();
        this.reviews = this.mergeReviews(this.reviews, [review]);
        review.synced = true;
        await this.pushCommunity();
      } else if (this.remoteEnabled && this.syncMode === 'jsonbin') {
        await this.fetchJsonBin();
        this.reviews = this.mergeReviews(this.reviews, [review]);
        review.synced = true;
        await this.pushJsonBin();
      } else if (this.remoteEnabled && this.syncMode === 'firebase' && this.firestore) {
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
        review.synced = true;
        this.reviews = this.mergeReviews(this.reviews, [review]);
      } else {
        this.reviews.push(review);
      }

      this.saveLocal();
      return { ok: true, review, synced: !!review.synced };
    } catch (err) {
      console.error('ReviewsStore: falha ao publicar', err);
      this.lastError = err.message ?? String(err);
      this.reviews = this.mergeReviews(this.reviews, [review]);
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
