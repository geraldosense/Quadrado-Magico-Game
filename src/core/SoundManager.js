/** Arpejos matemáticos — sequências ascendentes com ritmo animado */
const MATH_ARPEGGIOS = [
  [261.63, 329.63, 392.0, 523.25],
  [293.66, 369.99, 440.0, 587.33],
  [329.63, 415.30, 493.88, 659.25],
  [349.23, 440.0, 523.25, 698.46],
];

const BASS_NOTES = [130.81, 146.83, 164.81, 174.61];

export class SoundManager {
  constructor(settingsStore) {
    this.settingsStore = settingsStore;
    this.ctx = null;
    this.musicPlaying = false;
    this.musicPaused = false;
    this.musicGain = null;
    this.musicFilter = null;
    this.bassOsc = null;
    this.bassGain = null;
    this.arpeggioStep = 0;
    this.arpeggioIndex = 0;
    this.arpeggioTimeout = null;
    this.bassInterval = null;

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

  startMusic() {
    if (!this.settingsStore.get().musicEnabled) return;

    if (this.musicPlaying && !this.musicPaused) return;

    if (this.musicPlaying && this.musicPaused) {
      this.musicPaused = false;
      this.fadeMusicTo(this.getMusicVolume(), 0.8);
      return;
    }

    this.musicPlaying = true;
    this.musicPaused = false;
    this.arpeggioStep = 0;
    this.arpeggioIndex = 0;
    const ctx = this.getContext();

    this.musicGain = ctx.createGain();
    this.musicGain.gain.value = 0.001;

    this.musicFilter = ctx.createBiquadFilter();
    this.musicFilter.type = 'lowpass';
    this.musicFilter.frequency.value = 2800;
    this.musicFilter.Q.value = 0.7;

    this.musicGain.connect(this.musicFilter);
    this.musicFilter.connect(ctx.destination);

    this.startBass(BASS_NOTES[0]);
    this.scheduleArpeggio();
    this.bassInterval = setInterval(() => this.shiftBass(), 4000);
    this.fadeMusicTo(this.getMusicVolume(), 1.2);
  }

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
    if (!this.musicPlaying || this.musicPaused) return;
    this.arpeggioIndex = (this.arpeggioIndex + 1) % BASS_NOTES.length;
    this.startBass(BASS_NOTES[this.arpeggioIndex]);
  }

  scheduleArpeggio() {
    if (!this.musicPlaying) return;
    this.arpeggioTimeout = setTimeout(() => {
      this.playArpeggioNote();
      this.scheduleArpeggio();
    }, 280);
  }

  playArpeggioNote() {
    if (!this.musicPlaying || this.musicPaused || !this.musicGain) return;

    const arp = MATH_ARPEGGIOS[this.arpeggioIndex % MATH_ARPEGGIOS.length];
    const freq = arp[this.arpeggioStep % arp.length];
    this.arpeggioStep += 1;
    if (this.arpeggioStep % arp.length === 0) {
      this.arpeggioIndex = (this.arpeggioIndex + 1) % MATH_ARPEGGIOS.length;
    }

    const ctx = this.getContext();
    const t = ctx.currentTime;
    const vol = this.getMusicVolume() * 0.45;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(t);
    osc.stop(t + 0.4);
  }

  fadeMusicTo(target, duration = 0.8) {
    if (!this.musicGain || !this.ctx) return;
    const t = this.ctx.currentTime;
    const vol = Math.max(target, 0.001);
    this.musicGain.gain.cancelScheduledValues(t);
    this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, t);
    this.musicGain.gain.exponentialRampToValueAtTime(vol, t + duration);
  }

  pauseMusic() {
    if (!this.musicPlaying || this.musicPaused) return;
    this.musicPaused = true;
    this.fadeMusicTo(0.001, 0.5);
  }

  resumeMusic() {
    if (!this.musicPlaying || !this.musicPaused) return;
    this.musicPaused = false;
    this.fadeMusicTo(this.getMusicVolume(), 0.6);
  }

  stopMusic() {
    this.musicPlaying = false;
    this.musicPaused = false;
    clearTimeout(this.arpeggioTimeout);
    clearInterval(this.bassInterval);
    this.arpeggioTimeout = null;
    this.bassInterval = null;

    if (this.musicGain && this.ctx) {
      this.fadeMusicTo(0.001, 0.4);
      setTimeout(() => {
        this.stopBass();
        this.musicGain?.disconnect();
        this.musicFilter?.disconnect();
        this.musicGain = null;
        this.musicFilter = null;
      }, 500);
    } else {
      this.stopBass();
    }
  }

  applyMusicSettings() {
    const vol = this.getMusicVolume();
    if (this.musicPlaying) {
      if (vol <= 0) this.stopMusic();
      else if (!this.musicPaused) this.fadeMusicTo(vol, 0.3);
    }
  }
}
