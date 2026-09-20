// ============================================================================
// GANESHA: THE LOST FESTIVAL - Procedural Web Audio API Synthesizer
// Indian festive melodic loops, Tanpura drone, Dholak rhythms & authentic SFX
// ============================================================================

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.musicEnabled = true;
    this.sfxEnabled = true;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;

    this.isPlayingMusic = false;
    this.musicStep = 0;
    this.musicTimer = null;
    this.tempo = 116; // Festive upbeat tempo
    this.droneOsc1 = null;
    this.droneOsc2 = null;
    this.droneGain = null;

    // Raga Bhupali / Indian festive pentatonic scale frequencies (Sa Re Ga Pa Dha Sa')
    // Base root C4 (~261.63 Hz)
    this.scale = [
      261.63, // C4 (Sa)
      293.66, // D4 (Re)
      329.63, // E4 (Ga)
      392.00, // G4 (Pa)
      440.00, // A4 (Dha)
      523.25, // C5 (Sa')
      587.33, // D5 (Re')
      659.25  // E5 (Ga')
    ];

    // Melodic patterns for festival mood
    this.melodyPattern = [
      0, 1, 2, 4, 3, 2, 1, 0,
      2, 3, 4, 5, 4, 3, 2, 0,
      4, 5, 6, 7, 5, 4, 3, 2,
      5, 4, 2, 1, 3, 2, 1, 0
    ];

    // Level-specific mood shifts
    this.levelRhythms = {
      1: { tempo: 108, energy: 0.7 }, // Sacred Forest: Serene & uplifting
      2: { tempo: 120, energy: 0.9 }, // Festival City: Joyful & bustling
      3: { tempo: 112, energy: 0.8 }, // Ancient Temple: Mystical & reverent
      4: { tempo: 134, energy: 1.0 }, // Divine Challenge: Fast & thrilling
      5: { tempo: 128, energy: 1.2 }, // Grand Celebration: Majestic Aarti & triumph
      6: { tempo: 114, energy: 0.85 }, // Kailash Foothills: Serene Himalayan air
      7: { tempo: 124, energy: 0.95 }, // River Ganga: Flowing holy waters
      8: { tempo: 132, energy: 1.1 },  // Surya Mandir: Radiant solar energy
      9: { tempo: 138, energy: 1.2 },  // Indra's Amaravati: Grand palace of Devas
      10: { tempo: 144, energy: 1.35 } // Ananta Cosmic Sanctum: Supreme transcendence
    };

    this.currentLevel = 1;
  }

  // Initialize Web Audio on first user interaction
  init() {
    if (this.ctx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicEnabled ? 0.45 : 0, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxEnabled ? 0.75 : 0, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  ensureUnlocked() {
    if (!this.ctx) {
      this.init();
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMusicEnabled(enabled) {
    this.musicEnabled = enabled;
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.musicGain) {
      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.linearRampToValueAtTime(enabled ? 0.45 : 0, now + 0.1);
    }
    if (!enabled && this.isPlayingMusic) {
      this.stopMusic();
    } else if (enabled && !this.isPlayingMusic) {
      this.startMusic(this.currentLevel);
    }
  }

  setSfxEnabled(enabled) {
    this.sfxEnabled = enabled;
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.sfxGain.gain.cancelScheduledValues(now);
    this.sfxGain.gain.setValueAtTime(enabled ? 0.75 : 0, now);
  }

  setLevel(level) {
    this.currentLevel = level;
    if (this.levelRhythms[level]) {
      this.tempo = this.levelRhythms[level].tempo;
    }
  }

  // ==========================================
  // BACKGROUND MUSIC SYNTHESIZER
  // ==========================================
  startMusic(level = 1) {
    this.ensureUnlocked();
    if (!this.ctx || !this.musicEnabled) return;

    if (this.isPlayingMusic) {
      this.stopMusic();
    }

    this.setLevel(level);
    this.isPlayingMusic = true;
    this.startDrone();

    const interval = (60 / this.tempo) / 2 * 1000; // 8th note
    this.musicStep = 0;

    const playLoop = () => {
      if (!this.isPlayingMusic) return;
      this.playMusicStep(this.musicStep);
      this.musicStep = (this.musicStep + 1) % this.melodyPattern.length;
      this.musicTimer = setTimeout(playLoop, interval);
    };

    playLoop();
  }

  stopMusic() {
    this.isPlayingMusic = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
    this.stopDrone();
  }

  startDrone() {
    if (!this.ctx || this.droneOsc1) return;
    try {
      const now = this.ctx.currentTime;
      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.setValueAtTime(0.001, now);
      this.droneGain.gain.linearRampToValueAtTime(0.12, now + 1.5);
      this.droneGain.connect(this.musicGain);

      // Root Sa (C3 ~ 130.81Hz)
      this.droneOsc1 = this.ctx.createOscillator();
      this.droneOsc1.type = 'sawtooth';
      this.droneOsc1.frequency.setValueAtTime(130.81, now);

      // Low pass filter for warm tanpura resonance
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, now);

      // Pa (G3 ~ 196.00Hz)
      this.droneOsc2 = this.ctx.createOscillator();
      this.droneOsc2.type = 'triangle';
      this.droneOsc2.frequency.setValueAtTime(196.00, now);

      this.droneOsc1.connect(filter);
      this.droneOsc2.connect(filter);
      filter.connect(this.droneGain);

      this.droneOsc1.start(now);
      this.droneOsc2.start(now);
    } catch (e) {}
  }

  stopDrone() {
    if (!this.droneGain || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      this.droneGain.gain.linearRampToValueAtTime(0.001, now + 0.5);
      setTimeout(() => {
        if (this.droneOsc1) {
          try { this.droneOsc1.stop(); } catch(e){}
          this.droneOsc1.disconnect();
          this.droneOsc1 = null;
        }
        if (this.droneOsc2) {
          try { this.droneOsc2.stop(); } catch(e){}
          this.droneOsc2.disconnect();
          this.droneOsc2 = null;
        }
      }, 500);
    } catch(e) {}
  }

  playMusicStep(step) {
    if (!this.ctx || !this.musicEnabled) return;
    const now = this.ctx.currentTime;

    // Melody Note (Indian flute / sitar-like pluck)
    const noteIdx = this.melodyPattern[step];
    if (noteIdx !== undefined && step % 2 === 0) {
      const freq = this.scale[noteIdx];
      this.playSitarPluck(freq, now, 0.35);
    }

    // Rhythm percussion: Dholak beat (Dhā - Ge - Tin - Tā pattern)
    const beatInBar = step % 8;
    if (beatInBar === 0 || beatInBar === 4) {
      // Dholak Bass (Ge / Dhum)
      this.playDholakBass(now);
    }
    if (beatInBar === 2 || beatInBar === 6) {
      // Crisp Rim/Slap (Tā)
      this.playCrispSlap(now);
    }
    if (this.currentLevel === 5 && (beatInBar === 1 || beatInBar === 5)) {
      // Extra festive kartal / manjira chimes in Level 5
      this.playManjira(now);
    }
  }

  playSitarPluck(freq, startTime, duration = 0.35) {
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      // Subtle pitch bend characteristic of Indian meend/gamak
      osc.frequency.exponentialRampToValueAtTime(freq * 1.015, startTime + 0.05);
      osc.frequency.exponentialRampToValueAtTime(freq, startTime + 0.15);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq * 2, startTime);
      filter.Q.setValueAtTime(2.5, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch(e) {}
  }

  playDholakBass(startTime) {
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, startTime);
      osc.frequency.exponentialRampToValueAtTime(45, startTime + 0.18);

      gain.gain.setValueAtTime(0.35, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

      osc.connect(gain);
      gain.connect(this.musicGain);

      osc.start(startTime);
      osc.stop(startTime + 0.25);
    } catch(e) {}
  }

  playCrispSlap(startTime) {
    try {
      // High-pitched tuned rim shot + soft noise
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, startTime);
      osc.frequency.exponentialRampToValueAtTime(280, startTime + 0.08);

      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.09);

      osc.connect(gain);
      gain.connect(this.musicGain);

      osc.start(startTime);
      osc.stop(startTime + 0.1);
    } catch(e) {}
  }

  playManjira(startTime) {
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(2400, startTime);

      gain.gain.setValueAtTime(0.08, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);

      osc.connect(gain);
      gain.connect(this.musicGain);

      osc.start(startTime);
      osc.stop(startTime + 0.15);
    } catch(e) {}
  }

  // ==========================================
  // SOUND EFFECTS (SFX)
  // ==========================================

  // Temple Bell (Ghanta / Ghanti 🔔) with rich authentic harmonics
  playBell() {
    this.ensureUnlocked();
    if (!this.ctx || !this.sfxEnabled) return;

    try {
      const now = this.ctx.currentTime;
      // Traditional temple bells have prominent harmonic overtones
      const partials = [
        { freq: 880, gain: 0.35, decay: 1.8 },
        { freq: 1760, gain: 0.25, decay: 1.4 },
        { freq: 2640, gain: 0.15, decay: 0.9 },
        { freq: 3520, gain: 0.08, decay: 0.6 }
      ];

      partials.forEach(p => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(p.freq, now);

        gain.gain.setValueAtTime(p.gain, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + p.decay);
      });
    } catch(e) {}
  }

  // Modak Collect: Sweet, cheerful chime
  playCollectModak() {
    this.ensureUnlocked();
    if (!this.ctx || !this.sfxEnabled) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio
      notes.forEach((freq, idx) => {
        const t = now + idx * 0.045;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.25, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + 0.25);
      });
    } catch(e) {}
  }

  // Flower Collect: Gentle petal harp chime
  playCollectFlower() {
    this.ensureUnlocked();
    if (!this.ctx || !this.sfxEnabled) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [659.25, 783.99, 987.77]; // E5, G5, B5
      notes.forEach((freq, idx) => {
        const t = now + idx * 0.04;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + 0.25);
      });
    } catch(e) {}
  }

  // Diya Lit: Warm whoosh + golden resonance
  playDiyaLit() {
    this.ensureUnlocked();
    if (!this.ctx || !this.sfxEnabled) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.55);

      setTimeout(() => this.playManjira(this.ctx.currentTime), 60);
    } catch(e) {}
  }

  // Divine Energy: Glowing, mystical resonant crystal tone
  playDivineEnergy() {
    this.ensureUnlocked();
    if (!this.ctx || !this.sfxEnabled) return;

    try {
      const now = this.ctx.currentTime;
      const freqs = [392.00, 523.25, 783.99, 1174.66]; // G4, C5, G5, D6
      freqs.forEach(freq => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.02, now + 0.4);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.22, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.9);
      });
    } catch(e) {}
  }

  // Jump: Soft whoosh
  playJump() {
    this.ensureUnlocked();
    if (!this.ctx || !this.sfxEnabled) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(360, now + 0.12);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch(e) {}
  }

  // Hurt: Obstacle impact
  playHurt() {
    this.ensureUnlocked();
    if (!this.ctx || !this.sfxEnabled) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch(e) {}
  }

  // Wisdom Power Activation
  playPower() {
    this.ensureUnlocked();
    if (!this.ctx || !this.sfxEnabled) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, now);
      filter.frequency.exponentialRampToValueAtTime(3000, now + 0.35);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.65);
    } catch(e) {}
  }

  // Puzzle Solved: Auspicious 4-note ascending fanfare
  playPuzzleCorrect() {
    this.ensureUnlocked();
    if (!this.ctx || !this.sfxEnabled) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [392.00, 523.25, 659.25, 783.99, 1046.50]; // G4, C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const t = now + idx * 0.08;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + 0.45);
      });
    } catch(e) {}
  }

  // Puzzle Wrong: gentle buzz
  playPuzzleWrong() {
    this.ensureUnlocked();
    if (!this.ctx || !this.sfxEnabled) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.setValueAtTime(110, now + 0.12);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.28);
    } catch(e) {}
  }

  // Temple Door Unlocking: Majestic stone resonance
  playDoorOpen() {
    this.ensureUnlocked();
    if (!this.ctx || !this.sfxEnabled) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(75, now);
      osc.frequency.linearRampToValueAtTime(95, now + 0.8);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 1.3);

      setTimeout(() => this.playBell(), 200);
      setTimeout(() => this.playBell(), 700);
    } catch(e) {}
  }

  // Level Complete: Celebratory festive fanfare
  playLevelComplete() {
    this.ensureUnlocked();
    if (!this.ctx || !this.sfxEnabled) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [
        { f: 523.25, t: 0.00, d: 0.2 },
        { f: 659.25, t: 0.15, d: 0.2 },
        { f: 783.99, t: 0.30, d: 0.25 },
        { f: 1046.5, t: 0.50, d: 0.7 }
      ];

      notes.forEach(n => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, now + n.t);

        gain.gain.setValueAtTime(0.001, now + n.t);
        gain.gain.linearRampToValueAtTime(0.3, now + n.t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + n.t + n.d);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now + n.t);
        osc.stop(now + n.t + n.d);
      });

      setTimeout(() => this.playBell(), 550);
    } catch(e) {}
  }

  // Game Over: Gentle solemn chime
  playGameOver() {
    this.ensureUnlocked();
    if (!this.ctx || !this.sfxEnabled) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [440, 392, 330, 261.63]; // Descending
      notes.forEach((freq, idx) => {
        const t = now + idx * 0.18;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + 0.4);
      });
    } catch(e) {}
  }

  // Final Celebration: Grand Aarti, conch simulation (shankha), firecracker bursts!
  playFinalCelebration() {
    this.ensureUnlocked();
    if (!this.ctx || !this.sfxEnabled) return;

    try {
      const now = this.ctx.currentTime;

      // Shankha / Sacred Conch horn blast
      const conch = this.ctx.createOscillator();
      const conchGain = this.ctx.createGain();
      const conchFilter = this.ctx.createBiquadFilter();

      conch.type = 'sawtooth';
      conch.frequency.setValueAtTime(260, now);
      conch.frequency.linearRampToValueAtTime(320, now + 0.4);
      conch.frequency.setValueAtTime(320, now + 1.2);
      conch.frequency.linearRampToValueAtTime(250, now + 1.8);

      conchFilter.type = 'lowpass';
      conchFilter.frequency.setValueAtTime(650, now);

      conchGain.gain.setValueAtTime(0.01, now);
      conchGain.gain.linearRampToValueAtTime(0.35, now + 0.3);
      conchGain.gain.exponentialRampToValueAtTime(0.001, now + 1.9);

      conch.connect(conchFilter);
      conchFilter.connect(conchGain);
      conchGain.connect(this.sfxGain);

      conch.start(now);
      conch.stop(now + 2.0);

      // Multiple temple bell chimes
      setTimeout(() => this.playBell(), 200);
      setTimeout(() => this.playBell(), 600);
      setTimeout(() => this.playBell(), 1100);
      setTimeout(() => this.playBell(), 1600);
      setTimeout(() => this.playBell(), 2100);

      // Firecracker pops
      for (let i = 0; i < 8; i++) {
        setTimeout(() => this.playFirecrackerPop(), 300 + i * 280);
      }
    } catch(e) {}
  }

  playFirecrackerPop() {
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(200 + Math.random() * 200, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.08);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch(e) {}
  }

  // Celestial transformation fanfare when 4 levels are completed
  playStyleTransform() {
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      this.ensureUnlocked();
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 784.00, 1046.50];
      notes.forEach((freq, i) => {
        setTimeout(() => {
          if (!this.ctx) return;
          const now = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(now);
          osc.stop(now + 0.85);
        }, i * 110);
      });
      setTimeout(() => this.playBell(), 400);
      setTimeout(() => this.playConch(), 800);
    } catch(e) {}
  }
}

// Global singleton instance
window.soundEngine = new SoundEngine();

// Auto-unlock audio context on first user interaction anywhere
['click', 'keydown', 'touchstart', 'pointerdown'].forEach(evt => {
  window.addEventListener(evt, () => {
    if (window.soundEngine) window.soundEngine.ensureUnlocked();
  }, { passive: true });
});
