/** Arpejos matemáticos — música do jogo (animada) */
const MATH_ARPEGGIOS = [
  [261.63, 329.63, 392.0, 523.25],
  [293.66, 369.99, 440.0, 587.33],
  [329.63, 415.30, 493.88, 659.25],
  [349.23, 440.0, 523.25, 698.46],
];

const BASS_NOTES = [130.81, 146.83, 164.81, 174.61];

/** Acordes suaves — música do menu (relaxada e feliz) */
const MENU_CHORDS = [
  [261.63, 329.63, 392.0],
  [392.0, 493.88, 587.33],
  [220.0, 261.63, 329.63],
  [349.23, 440.0, 523.25],
];

const MENU_MELODY = [523.25, 587.33, 659.25, 783.99, 880.0, 783.99, 659.25, 587.33, 523.25, 659.25, 783.99];

export class SoundManager {
  constructor(settingsStore) {
    this.settingsStore = settingsStore;
    this.ctx = null;
    this.musicMode = 'none'; // 'none' | 'menu' | 'game'
    this.musicPaused = false;
    this.musicGain = null;
    this.musicFilter = null;

    // Game music state
    this.bassOsc = null;
    this.bassGain = null;
    this.arpeggioStep = 0;
    this.arpeggioIndex = 0;
    this.arpeggioTimeout = null;
    this.bassInterval = null;

    // Menu music state
    this.menuChordIndex = 0;
    this.menuMelodyIndex = 0;
    this.menuChordTimeout = null;
    this.menuMelodyTimeout = null;

    settingsStore.subscribe(() => this.applyMusicSettings());
  }

  getContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  getVolume() {
    const { soundEnabled, soundVolume, masterVolume = 100 } = this.settingsStore.get();
    return soundEnabled ? (soundVolume / 100) * (masterVolume / 100) : 0;
  }

  getMusicVolume() {
    const { musicEnabled, musicVolume, masterVolume = 100 } = this.settingsStore.get();
    return musicEnabled ? (musicVolume / 100) * (masterVolume / 100) * 0.18 : 0;
  }

  getMenuMusicVolume() {
    return this.getMusicVolume() * 0.85;
  }

  previewSounds() {
    this.playSelect();
    setTimeout(() => this.playPlace(), 200);
    setTimeout(() => this.playWin(), 450);
  }

  playTone(freq, duration = 0.12, type = 'sine', volScale = 0.25) {
    const vol = this.getVolume();
    if (vol <= 0) return;

    const ctx = this.getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol * volScale, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  playPlace() { this.playTone(660, 0.08, 'square', 0.12); }
  playRemove() { this.playTone(330, 0.07, 'square', 0.1); }
  playSelect() { this.playTone(523, 0.06, 'triangle', 0.15); }

  playWin() {
    [523, 659, 784, 1047, 1318].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.22, 'triangle', 0.3), i * 100);
    });
  }

  playLose() {
    const notes = [349, 311, 277, 233, 196, 155];
    notes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.4, 'sawtooth', 0.2), i * 160);
    });
    setTimeout(() => this.playTone(130, 0.6, 'sawtooth', 0.15), notes.length * 160);
  }

  playError() {
    this.playTone(180, 0.15, 'sawtooth', 0.18);
    setTimeout(() => this.playTone(140, 0.2, 'sawtooth', 0.15), 80);
  }

  /** Música animada — durante o jogo */
  startGameMusic() {
    this.startMusicMode('game');
  }

  /** Música relaxada — menu e ecrãs */
  startMenuMusic() {
    this.startMusicMode('menu');
  }

  /** Compatibilidade */
  startMusic() {
    this.startGameMusic();
  }

  startMusicMode(mode) {
    if (!this.settingsStore.get().musicEnabled) return;

    if (this.musicMode === mode && !this.musicPaused) return;

    if (this.musicMode === mode && this.musicPaused) {
      this.musicPaused = false;
      this.fadeMusicTo(this.getTargetVolume(), 0.8);
      return;
    }

    if (this.musicMode !== 'none') {
      this.stopMusicImmediate();
    }

    this.musicMode = mode;
    this.musicPaused = false;
    this.setupMusicChain(mode === 'menu' ? 3200 : 2800);

    if (mode === 'game') {
      this.arpeggioStep = 0;
      this.arpeggioIndex = 0;
      this.startBass(BASS_NOTES[0]);
      this.scheduleArpeggio();
      this.bassInterval = setInterval(() => this.shiftBass(), 4000);
    } else {
      this.menuChordIndex = 0;
      this.menuMelodyIndex = 0;
      this.scheduleMenuChord();
      this.scheduleMenuMelody();
    }

    this.fadeMusicTo(this.getTargetVolume(), 1.2);
  }

  setupMusicChain(filterFreq) {
    const ctx = this.getContext();
    this.musicGain = ctx.createGain();
    this.musicGain.gain.value = 0.001;

    this.musicFilter = ctx.createBiquadFilter();
    this.musicFilter.type = 'lowpass';
    this.musicFilter.frequency.value = filterFreq;
    this.musicFilter.Q.value = 0.6;

    this.musicGain.connect(this.musicFilter);
    this.musicFilter.connect(ctx.destination);
  }

  getTargetVolume() {
    return this.musicMode === 'menu' ? this.getMenuMusicVolume() : this.getMusicVolume();
  }

  /* ---- Música do jogo ---- */

  startBass(freq) {
    this.stopBass();
    const ctx = this.getContext();
    const t = ctx.currentTime;

    this.bassOsc = ctx.createOscillator();
    this.bassGain = ctx.createGain();
    this.bassOsc.type = 'square';
    this.bassOsc.frequency.value = freq;
    this.bassGain.gain.setValueAtTime(0, t);
    this.bassGain.gain.linearRampToValueAtTime(0.12, t + 0.3);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;

    this.bassOsc.connect(filter);
    filter.connect(this.bassGain);
    this.bassGain.connect(this.musicGain);
    this.bassOsc.start(t);
  }

  stopBass() {
    if (this.bassOsc && this.bassGain && this.ctx) {
      const t = this.ctx.currentTime;
      this.bassGain.gain.linearRampToValueAtTime(0, t + 0.3);
      const osc = this.bassOsc;
      setTimeout(() => { try { osc.stop(); } catch { /* noop */ } }, 350);
    }
    this.bassOsc = null;
    this.bassGain = null;
  }

  shiftBass() {
    if (this.musicMode !== 'game' || this.musicPaused) return;
    this.arpeggioIndex = (this.arpeggioIndex + 1) % BASS_NOTES.length;
    this.startBass(BASS_NOTES[this.arpeggioIndex]);
  }

  scheduleArpeggio() {
    if (this.musicMode !== 'game') return;
    this.arpeggioTimeout = setTimeout(() => {
      this.playArpeggioNote();
      this.scheduleArpeggio();
    }, 280);
  }

  playArpeggioNote() {
    if (this.musicMode !== 'game' || this.musicPaused || !this.musicGain) return;

    const arp = MATH_ARPEGGIOS[this.arpeggioIndex % MATH_ARPEGGIOS.length];
    const freq = arp[this.arpeggioStep % arp.length];
    this.arpeggioStep += 1;
    if (this.arpeggioStep % arp.length === 0) {
      this.arpeggioIndex = (this.arpeggioIndex + 1) % MATH_ARPEGGIOS.length;
    }

    this.playThroughMusicBus(freq, 0.35, 'square', 0.45, 0.02);
  }

  /* ---- Música do menu ---- */

  scheduleMenuChord() {
    if (this.musicMode !== 'menu') return;
    this.menuChordTimeout = setTimeout(() => {
      this.playMenuChord();
      this.scheduleMenuChord();
    }, 3200);
  }

  scheduleMenuMelody() {
    if (this.musicMode !== 'menu') return;
    this.menuMelodyTimeout = setTimeout(() => {
      this.playMenuMelodyNote();
      this.scheduleMenuMelody();
    }, 680);
  }

  playMenuChord() {
    if (this.musicMode !== 'menu' || this.musicPaused || !this.musicGain) return;

    const chord = MENU_CHORDS[this.menuChordIndex % MENU_CHORDS.length];
    this.menuChordIndex += 1;

    chord.forEach((freq, i) => {
      setTimeout(() => {
        this.playThroughMusicBus(freq * 0.5, 1.8, 'sine', 0.22, 0.15);
      }, i * 120);
    });
  }

  playMenuMelodyNote() {
    if (this.musicMode !== 'menu' || this.musicPaused || !this.musicGain) return;

    const freq = MENU_MELODY[this.menuMelodyIndex % MENU_MELODY.length];
    this.menuMelodyIndex += 1;
    this.playThroughMusicBus(freq, 0.55, 'triangle', 0.35, 0.08);
  }

  playThroughMusicBus(freq, duration, type, volScale, attack = 0.03) {
    const ctx = this.getContext();
    const t = ctx.currentTime;
    const vol = this.getTargetVolume() * volScale;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  /* ---- Controlos partilhados ---- */

  fadeMusicTo(target, duration = 0.8) {
    if (!this.musicGain || !this.ctx) return;
    const t = this.ctx.currentTime;
    const vol = Math.max(target, 0.001);
    this.musicGain.gain.cancelScheduledValues(t);
    this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, t);
    this.musicGain.gain.exponentialRampToValueAtTime(vol, t + duration);
  }

  pauseMusic() {
    if (this.musicMode === 'none' || this.musicPaused) return;
    this.musicPaused = true;
    this.fadeMusicTo(0.001, 0.5);
  }

  resumeMusic() {
    if (this.musicMode === 'none' || !this.musicPaused) return;
    this.musicPaused = false;
    this.fadeMusicTo(this.getTargetVolume(), 0.6);
  }

  stopMusic() {
    if (this.musicMode === 'none') return;
    this.fadeMusicTo(0.001, 0.4);
    setTimeout(() => this.stopMusicImmediate(), 450);
  }

  stopMusicImmediate() {
    this.musicMode = 'none';
    this.musicPaused = false;

    clearTimeout(this.arpeggioTimeout);
    clearInterval(this.bassInterval);
    clearTimeout(this.menuChordTimeout);
    clearTimeout(this.menuMelodyTimeout);

    this.arpeggioTimeout = null;
    this.bassInterval = null;
    this.menuChordTimeout = null;
    this.menuMelodyTimeout = null;

    this.stopBass();
    this.musicGain?.disconnect();
    this.musicFilter?.disconnect();
    this.musicGain = null;
    this.musicFilter = null;
  }

  applyMusicSettings() {
    const vol = this.getTargetVolume();
    if (this.musicMode !== 'none') {
      if (vol <= 0 || !this.settingsStore.get().musicEnabled) {
        this.stopMusicImmediate();
      } else if (!this.musicPaused) {
        this.fadeMusicTo(vol, 0.3);
      }
    }
  }
}
