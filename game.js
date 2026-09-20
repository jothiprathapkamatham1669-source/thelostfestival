// ============================================================================
// GANESHA: THE LOST FESTIVAL - Main 2D Game Engine
// Platformer physics, 5 distinct levels, puzzle modals, wisdom powers & celebrations
// ============================================================================

(function() {
  'use strict';

  // --- Constants & Config ---
  const CANVAS_WIDTH = 960;
  const CANVAS_HEIGHT = 540;
  const GRAVITY = 0.52;

  // Level Definitions
  const LEVEL_CONFIGS = {
    1: {
      name: 'LEVEL 1 — SACRED FOREST',
      timeLimit: 90,
      targetEnergy: 5,
      worldWidth: 2600,
      bgTheme: 'forest',
      badge: '🌲'
    },
    2: {
      name: 'LEVEL 2 — FESTIVAL CITY',
      timeLimit: 120,
      targetEnergy: 5,
      worldWidth: 3000,
      bgTheme: 'city',
      badge: '🪔'
    },
    3: {
      name: 'LEVEL 3 — ANCIENT TEMPLE',
      timeLimit: 150,
      targetEnergy: 5,
      worldWidth: 2800,
      bgTheme: 'temple',
      badge: '🛕'
    },
    4: {
      name: 'LEVEL 4 — DIVINE CHALLENGE',
      timeLimit: 120,
      targetEnergy: 6,
      worldWidth: 3400,
      bgTheme: 'challenge',
      badge: '⚡',
      fastPaced: true
    },
    5: {
      name: 'LEVEL 5 — MAHA MANDIR SANCTUM',
      timeLimit: 180,
      targetEnergy: 5,
      worldWidth: 1600,
      bgTheme: 'sanctum',
      badge: '🌟'
    },
    6: {
      name: 'LEVEL 6 — KAILASH FOOTHILLS',
      timeLimit: 120,
      targetEnergy: 6,
      worldWidth: 3200,
      bgTheme: 'kailash',
      badge: '🏔️'
    },
    7: {
      name: 'LEVEL 7 — CELESTIAL RIVER GANGA',
      timeLimit: 130,
      targetEnergy: 6,
      worldWidth: 3400,
      bgTheme: 'ganga',
      badge: '🌊'
    },
    8: {
      name: 'LEVEL 8 — SURYA MANDIR',
      timeLimit: 120,
      targetEnergy: 6,
      worldWidth: 3200,
      bgTheme: 'surya',
      badge: '☀️'
    },
    9: {
      name: 'LEVEL 9 — INDRA’S AMARAVATI',
      timeLimit: 140,
      targetEnergy: 7,
      worldWidth: 3600,
      bgTheme: 'amaravati',
      badge: '🌈'
    },
    10: {
      name: 'FINAL LEVEL 10 — ANANTA COSMIC SANCTUM',
      timeLimit: 180,
      targetEnergy: 7,
      worldWidth: 2000,
      bgTheme: 'ananta',
      badge: '🌌'
    }
  };

  // --- Game State Object ---
  const state = {
    currentLevel: 1,
    score: 0,
    highScore: 0,
    lives: 3,
    timer: 90,
    timerInterval: null,
    isPaused: false,
    isPlaying: false,
    levelCompleted: false,

    // Divine Energy & Wisdom Powers
    divineEnergyCollected: 0,
    totalDivineEnergySession: 0,
    wisdomPowerCharge: 0, // 0 to 100
    activePower: null,
    powerTimeRemaining: 0,
    hasShield: false,
    scoreMultiplier: 1,
    timeFrozen: false,

    // Restoration progress in Final Levels
    restorationProgress: 0, // 0 to 100%

    // Celestial Mode & Suvarna Ganesha Avatar
    isCelestialMode: false,
    celestialUnlocked: false,
    gameStyle: 'classic', // 'classic' or 'celestial'
    levelsCompletedCount: 0,

    // Session stats for leaderboards
    sessionStartTime: 0,
    sessionBestTime: null,
    highestLevelReached: 1,

    // Settings
    musicOn: true,
    sfxOn: true,
    petalsOn: true
  };

  // --- Input State ---
  const keys = {
    left: false,
    right: false,
    jump: false,
    power: false
  };

  // Canvas & Context references
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // DOM Elements
  const hud = document.getElementById('game-hud');
  const hudLevelName = document.getElementById('hud-level-name');
  const hudScore = document.getElementById('hud-score');
  const hudHighScore = document.getElementById('hud-highscore');
  const hudHearts = document.getElementById('hud-hearts');
  const hudTimer = document.getElementById('hud-timer');
  const hudTimerContainer = document.getElementById('hud-timer-container');
  const hudEnergyPct = document.getElementById('hud-energy-pct');
  const hudEnergyBar = document.getElementById('hud-energy-bar');
  const hudWisdomPct = document.getElementById('hud-wisdom-pct');
  const hudWisdomBar = document.getElementById('hud-wisdom-bar');
  const wisdomCard = document.getElementById('wisdom-card');
  const wisdomTitle = document.getElementById('wisdom-title');
  const wisdomIcon = document.getElementById('wisdom-icon');
  const petalOverlay = document.getElementById('petal-overlay');

  // Modal Screens
  const screenStart = document.getElementById('screen-start');
  const screenInstructions = document.getElementById('screen-instructions');
  const screenHighScores = document.getElementById('screen-high-scores');
  const screenSettings = document.getElementById('screen-settings');
  const screenPause = document.getElementById('screen-pause');
  const pauseLevelInfo = document.getElementById('pause-level-info');
  const puzzleModal = document.getElementById('puzzle-modal');
  const screenLevelComplete = document.getElementById('screen-level-complete');
  const screenGameOver = document.getElementById('screen-game-over');
  const screenChampion = document.getElementById('screen-champion');
  const screenRealmSelect = document.getElementById('screen-realm-select');
  const realmGridContainer = document.getElementById('realm-grid-container');
  const btnSelectLevel = document.getElementById('btn-select-level');
  const btnCloseRealms = document.getElementById('btn-close-realms');
  const btnContinueCelestial = document.getElementById('btn-continue-celestial');
  const btnChampionRealms = document.getElementById('btn-champion-realms');
  const startCelestialBadge = document.getElementById('start-celestial-badge');
  const mobileControls = document.getElementById('mobile-controls');
  const hudStyleBadge = document.getElementById('hud-style-badge');
  const selectGameStyle = document.getElementById('select-game-style');
  const gameWrapper = document.getElementById('game-wrapper');
  const gameContainer = document.getElementById('game-container');

  // Camera
  const camera = {
    x: 0,
    y: 0,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT
  };

  // World Entities
  let player = null;
  let platforms = [];
  let collectibles = [];
  let obstacles = [];
  let interactiveObjects = []; // Diyas, bells, shrines, gates
  let particles = [];
  let floatTexts = [];
  let fireworks = [];

  // ==========================================================================
  // GAME STYLE & THEME ENGINE (Unlocked after 4 Levels Completed)
  // ==========================================================================
  function applyGameStyle(styleName, save = true) {
    state.gameStyle = styleName;
    const isCel = styleName === 'celestial';
    state.isCelestialMode = isCel;

    if (isCel) {
      document.body.classList.add('celestial-style');
      if (gameWrapper) gameWrapper.classList.add('celestial-style');
      if (gameContainer) gameContainer.classList.add('celestial-style');
      if (hudStyleBadge) hudStyleBadge.style.display = 'inline-flex';
      if (selectGameStyle) selectGameStyle.value = 'celestial';
    } else {
      document.body.classList.remove('celestial-style');
      if (gameWrapper) gameWrapper.classList.remove('celestial-style');
      if (gameContainer) gameContainer.classList.remove('celestial-style');
      if (hudStyleBadge) hudStyleBadge.style.display = 'none';
      if (selectGameStyle) selectGameStyle.value = 'classic';
    }

    if (save) {
      try {
        localStorage.setItem('ganesha_game_style', styleName);
      } catch(e) {}
    }
  }

  // ==========================================================================
  // HIGH SCORE & LOCAL STORAGE SYSTEM
  // ==========================================================================
  function loadSavedData() {
    try {
      const savedScore = localStorage.getItem('ganesha_highscore');
      if (savedScore) {
        state.highScore = parseInt(savedScore, 10) || 0;
      }
      const savedLevel = localStorage.getItem('ganesha_highest_level');
      if (savedLevel) {
        state.highestLevelReached = parseInt(savedLevel, 10) || 1;
      }
      const savedEnergy = localStorage.getItem('ganesha_total_energy');
      if (savedEnergy) {
        state.totalDivineEnergySession = parseInt(savedEnergy, 10) || 0;
      }
      const savedCount = localStorage.getItem('ganesha_levels_completed');
      if (savedCount) {
        state.levelsCompletedCount = parseInt(savedCount, 10) || 0;
      }
      const savedCelestial = localStorage.getItem('ganesha_celestial_unlocked');
      const savedStyle = localStorage.getItem('ganesha_game_style');

      if (savedCelestial === 'true' || state.highestLevelReached >= 5 || state.levelsCompletedCount >= 4) {
        state.celestialUnlocked = true;
        state.isCelestialMode = true;
        applyGameStyle(savedStyle || 'celestial', false);
      } else {
        applyGameStyle('classic', false);
      }
    } catch(e) {}
    updateScoreHUD();
    updateCelestialUI();
  }

  function saveScoreData() {
    try {
      if (state.score > state.highScore) {
        state.highScore = state.score;
        localStorage.setItem('ganesha_highscore', state.highScore);
      }
      if (state.currentLevel > state.highestLevelReached) {
        state.highestLevelReached = state.currentLevel;
        localStorage.setItem('ganesha_highest_level', state.highestLevelReached);
      }
      localStorage.setItem('ganesha_total_energy', state.totalDivineEnergySession);
      localStorage.setItem('ganesha_levels_completed', state.levelsCompletedCount);

      if (state.celestialUnlocked || state.levelsCompletedCount >= 4) {
        localStorage.setItem('ganesha_celestial_unlocked', 'true');
        localStorage.setItem('ganesha_game_style', state.gameStyle);
      }
    } catch(e) {}
    updateScoreHUD();
    updateCelestialUI();
  }

  function updateCelestialUI() {
    if (state.celestialUnlocked || state.highestLevelReached >= 5 || state.levelsCompletedCount >= 4) {
      if (startCelestialBadge) startCelestialBadge.style.display = 'inline-block';
      if (btnSelectLevel) btnSelectLevel.style.display = 'flex';
      state.isCelestialMode = true;
      if (state.gameStyle !== 'classic') {
        applyGameStyle('celestial', false);
      }
    }
  }

  function updateScoreHUD() {
    hudScore.textContent = state.score;
    hudHighScore.textContent = state.highScore;
    document.getElementById('hs-player-score').textContent = state.highScore.toLocaleString() + ' pts';
    document.getElementById('hs-highest-level').textContent = state.highestLevelReached;
    document.getElementById('hs-total-energy').textContent = state.totalDivineEnergySession;
  }

  // ==========================================================================
  // PARTICLES & FLOATING SCORE TEXT
  // ==========================================================================
  class Particle {
    constructor(x, y, color, vx, vy, size = 4, life = 40, shape = 'circle') {
      this.x = x;
      this.y = y;
      this.color = color;
      this.vx = vx;
      this.vy = vy;
      this.size = size;
      this.maxLife = life;
      this.life = life;
      this.shape = shape;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += 0.04; // Gentle gravity
      this.life--;
    }

    draw(ctx, camX) {
      const alpha = Math.max(0, this.life / this.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.color;

      if (this.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(this.x - camX, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (this.shape === 'petal') {
        ctx.beginPath();
        ctx.ellipse(this.x - camX, this.y, this.size * 1.5, this.size, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (this.shape === 'star') {
        ctx.beginPath();
        const r = this.size;
        for (let i = 0; i < 5; i++) {
          ctx.lineTo((this.x - camX) + Math.cos((18 + i * 72) * Math.PI / 180) * r,
                     this.y - Math.sin((18 + i * 72) * Math.PI / 180) * r);
          ctx.lineTo((this.x - camX) + Math.cos((54 + i * 72) * Math.PI / 180) * (r / 2),
                     this.y - Math.sin((54 + i * 72) * Math.PI / 180) * (r / 2));
        }
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function spawnBurst(x, y, color = '#FFB300', count = 12, shape = 'circle') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 3.5;
      particles.push(new Particle(
        x, y, color,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 1.0,
        2.5 + Math.random() * 3.5,
        30 + Math.random() * 25,
        shape
      ));
    }
  }

  class FloatText {
    constructor(text, x, y, color = '#FFE082') {
      this.text = text;
      this.x = x;
      this.y = y;
      this.color = color;
      this.life = 45;
      this.maxLife = 45;
    }
    update() {
      this.y -= 1.0;
      this.life--;
    }
    draw(ctx, camX) {
      const alpha = Math.max(0, this.life / this.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 15px Outfit, sans-serif';
      ctx.fillStyle = this.color;
      ctx.strokeStyle = '#140307';
      ctx.lineWidth = 3;
      ctx.strokeText(this.text, this.x - camX, this.y);
      ctx.fillText(this.text, this.x - camX, this.y);
      ctx.restore();
    }
  }

  // Final Celebration Fireworks
  class Firework {
    constructor(x, y, targetY, color) {
      this.x = x;
      this.y = y;
      this.targetY = targetY;
      this.color = color;
      this.exploded = false;
      this.speed = 5.5 + Math.random() * 2;
    }
    update() {
      if (!this.exploded) {
        this.y -= this.speed;
        if (this.y <= this.targetY) {
          this.explode();
        }
      }
    }
    explode() {
      this.exploded = true;
      spawnBurst(this.x, this.y, this.color, 28, 'star');
      spawnBurst(this.x, this.y, '#FFF9C4', 16, 'circle');
      if (window.soundEngine) window.soundEngine.playFirecrackerPop();
    }
  }

  // ==========================================================================
  // PLAYER ENTITY (LORD GANESHA + MOOSHIKA COMPANION)
  // ==========================================================================
  class GaneshaPlayer {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.width = 46;
      this.height = 54;
      this.vx = 0;
      this.vy = 0;
      this.speed = 4.4;
      this.jumpStrength = -11.6;
      this.isGrounded = false;
      this.facing = 1; // 1 = right, -1 = left

      // Visual / Animation
      this.animTime = 0;
      this.isInvulnerable = false;
      this.invulnerableTimer = 0;
      this.trunkAngle = 0;
      this.earFlap = 0;

      // Companion Mooshika
      this.mooshikaX = x - 25;
      this.mooshikaY = y;
    }

    update() {
      this.animTime += 0.08;

      // Invulnerability blink timer
      if (this.isInvulnerable) {
        this.invulnerableTimer--;
        if (this.invulnerableTimer <= 0) {
          this.isInvulnerable = false;
        }
      }

      // Horizontal Movement
      if (keys.left) {
        this.vx = -this.speed;
        this.facing = -1;
      } else if (keys.right) {
        this.vx = this.speed;
        this.facing = 1;
      } else {
        this.vx *= 0.65;
        if (Math.abs(this.vx) < 0.1) this.vx = 0;
      }

      // Jump
      if (keys.jump && this.isGrounded) {
        this.vy = this.jumpStrength;
        this.isGrounded = false;
        if (window.soundEngine) window.soundEngine.playJump();
        spawnBurst(this.x + this.width / 2, this.y + this.height, '#FFE082', 6, 'circle');
      }

      // Apply Gravity
      this.vy += GRAVITY;
      if (this.vy > 14) this.vy = 14;

      // Apply Movement & Collide with Platforms
      this.x += this.vx;
      this.collideHorizontal();

      this.y += this.vy;
      this.isGrounded = false;
      this.collideVertical();

      // Bound within level limits
      const config = LEVEL_CONFIGS[state.currentLevel];
      if (this.x < 10) this.x = 10;
      if (this.x > config.worldWidth - this.width - 20) {
        this.x = config.worldWidth - this.width - 20;
      }

      // Pit fall recovery - respawn safely on nearest ground platform
      if (this.y > CANVAS_HEIGHT + 40) {
        this.takeDamage('pit');
        this.x = Math.max(60, this.x - 140);
        this.y = CANVAS_HEIGHT - 120;
        this.vx = 0;
        this.vy = 0;
      }

      // Update companion Mooshika running behind
      const targetMooshikaX = this.x - (this.facing * 28);
      this.mooshikaX += (targetMooshikaX - this.mooshikaX) * 0.15;
      this.mooshikaY = this.y + this.height - 12;

      // Wisdom Power trigger
      if (keys.power) {
        triggerWisdomPower();
        keys.power = false; // single trigger
      }
    }

    collideHorizontal() {
      for (const p of platforms) {
        // Only collide horizontally with platforms whose vertical profile actually overlaps Ganesha's torso
        // (Platforms where Ganesha is standing on top are NOT treated as walls)
        const verticalTolerance = 8;
        const overlapsVertically = (this.y + this.height > p.y + verticalTolerance) && (this.y < p.y + p.h - 2);
        if (!overlapsVertically) continue;

        if (this.checkOverlap(this.x, this.y, this.width, this.height, p.x, p.y, p.w, p.h)) {
          if (this.vx > 0) {
            this.x = p.x - this.width;
          } else if (this.vx < 0) {
            this.x = p.x + p.w;
          }
          this.vx = 0;
        }
      }
    }

    collideVertical() {
      for (const p of platforms) {
        if (this.checkOverlap(this.x, this.y, this.width, this.height, p.x, p.y, p.w, p.h)) {
          if (this.vy >= 0 && (this.y + this.height - this.vy) <= p.y + 16) {
            // Landing on top of platform
            this.y = p.y - this.height;
            this.vy = 0;
            this.isGrounded = true;
          } else if (this.vy < 0) {
            // Hitting ceiling from underneath
            this.y = p.y + p.h;
            this.vy = 0;
          }
        }
      }
    }

    checkOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
      return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
    }

    takeDamage(source = 'obstacle') {
      if (this.isInvulnerable) return;

      // Divine Shield power check
      if (state.hasShield) {
        state.hasShield = false;
        showWisdomCard('🛡️ Divine Shield absorbed the blow!', '🛡️');
        if (window.soundEngine) window.soundEngine.playBell();
        spawnBurst(this.x + this.width / 2, this.y + this.height / 2, '#00E5FF', 20, 'star');
        this.isInvulnerable = true;
        this.invulnerableTimer = 45;
        return;
      }

      state.lives--;
      updateLivesHUD();
      if (window.soundEngine) window.soundEngine.playHurt();

      spawnBurst(this.x + this.width / 2, this.y + this.height / 2, '#FF1744', 18, 'circle');
      floatTexts.push(new FloatText('-1 Life!', this.x, this.y - 10, '#FF5252'));

      this.isInvulnerable = true;
      this.invulnerableTimer = 75; // ~1.3 seconds
      this.vy = -6; // knockback bounce
      this.vx = -this.facing * 4;

      if (state.lives <= 0) {
        triggerGameOver("Ganesha has run out of festival lives!");
      }
    }

    // Procedural High-Res Vector Rendering of Lord Ganesha
    draw(ctx, camX) {
      // Invulnerability flash
      if (this.isInvulnerable && Math.floor(this.invulnerableTimer / 5) % 2 === 0) {
        return;
      }

      const drawX = this.x - camX;
      const drawY = this.y;
      const isCelestial = state.isCelestialMode || state.currentLevel >= 5 || state.levelsCompletedCount >= 4;

      ctx.save();

      // Glowing Divine Aura
      const auraRadius = isCelestial ? 44 : 34;
      const auraGrad = ctx.createRadialGradient(
        drawX + this.width / 2, drawY + this.height / 2, 8,
        drawX + this.width / 2, drawY + this.height / 2, auraRadius
      );
      if (isCelestial) {
        auraGrad.addColorStop(0, 'rgba(255, 238, 88, 0.7)');
        auraGrad.addColorStop(0.4, 'rgba(255, 179, 0, 0.45)');
        auraGrad.addColorStop(0.75, 'rgba(0, 229, 255, 0.25)');
        auraGrad.addColorStop(1, 'rgba(0, 229, 255, 0)');
      } else {
        auraGrad.addColorStop(0, 'rgba(255, 213, 79, 0.45)');
        auraGrad.addColorStop(0.7, 'rgba(255, 111, 0, 0.2)');
        auraGrad.addColorStop(1, 'rgba(255, 111, 0, 0)');
      }
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(drawX + this.width / 2, drawY + this.height / 2, auraRadius, 0, Math.PI * 2);
      ctx.fill();

      // Celestial Solar Star Rays (Suvarna Model)
      if (isCelestial) {
        ctx.save();
        ctx.translate(drawX + this.width / 2, drawY + this.height / 2);
        ctx.rotate(this.animTime * 0.8);
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.35)';
        ctx.lineWidth = 2;
        for (let r = 0; r < 8; r++) {
          ctx.rotate(Math.PI / 4);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, auraRadius + 6);
          ctx.stroke();
        }
        ctx.restore();

        // Star footsteps trail when moving
        if (Math.abs(this.vx) > 0.5 && Math.random() < 0.35) {
          particles.push(new Particle(
            this.x + this.width / 2 + (Math.random() * 12 - 6),
            this.y + this.height - 4,
            '#FFD54F',
            (Math.random() - 0.5) * 0.8,
            -0.6 - Math.random() * 0.8,
            3,
            25,
            'star'
          ));
        }
      }

      // Divine Shield Bubble if active
      if (state.hasShield) {
        ctx.save();
        ctx.strokeStyle = '#00E5FF';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#00E5FF';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        const pulseR = 32 + Math.sin(this.animTime * 3) * 2.5;
        ctx.arc(drawX + this.width / 2, drawY + this.height / 2, pulseR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Flip horizontal when facing left
      ctx.translate(drawX + this.width / 2, drawY + this.height / 2);
      if (this.facing === -1) {
        ctx.scale(-1, 1);
      }

      const bounce = Math.sin(this.animTime * 6) * (Math.abs(this.vx) > 0.5 ? 2.5 : 0.8);
      const earWiggle = Math.sin(this.animTime * 4) * 0.12;

      // 1. Golden Mukut / Crown Halo Aura
      ctx.fillStyle = isCelestial ? '#FFF176' : '#FFD54F';
      ctx.beginPath();
      ctx.arc(0, -18 + bounce, isCelestial ? 19 : 16, Math.PI, 0);
      ctx.fill();

      // 2. Large Ears (Gentle flap)
      ctx.save();
      ctx.rotate(earWiggle);
      ctx.fillStyle = isCelestial ? '#FFE082' : '#FFCC80';
      ctx.strokeStyle = isCelestial ? '#FF8F00' : '#E65100';
      ctx.lineWidth = 1.5;
      // Left ear
      ctx.beginPath();
      ctx.ellipse(-16, -10 + bounce, 12, 16, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Inner ear shading
      ctx.fillStyle = isCelestial ? '#FFD54F' : '#FFAB91';
      ctx.beginPath();
      ctx.ellipse(-16, -10 + bounce, 7, 10, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 3. Body & Golden Dhoti (Pitamber / Suvarna Gold)
      ctx.fillStyle = isCelestial ? '#FFB300' : '#FF8F00';
      ctx.beginPath();
      ctx.roundRect(-14, 2 + bounce, 28, 22, 6);
      ctx.fill();

      // Dhoti Pleats & Gold / Diamond Border
      ctx.fillStyle = isCelestial ? '#FFF9C4' : '#FFD54F';
      ctx.fillRect(-12, 18 + bounce, 24, 4);
      if (isCelestial) {
        ctx.fillStyle = '#00E5FF';
        ctx.fillRect(-10, 19 + bounce, 20, 2);
      }

      // Sacred Angavastram / Shawl (Royal Purple for Celestial, Crimson for classic)
      ctx.fillStyle = isCelestial ? '#7C4DFF' : '#D81B60';
      ctx.beginPath();
      ctx.ellipse(0, 4 + bounce, 14, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      if (isCelestial) {
        ctx.strokeStyle = '#FFD54F';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // 4. Elephant Head
      ctx.fillStyle = isCelestial ? '#FFF3E0' : '#FFE0B2';
      ctx.beginPath();
      ctx.arc(0, -10 + bounce, 14, 0, Math.PI * 2);
      ctx.fill();

      // 5. Crown / Mukut with Jewel
      ctx.fillStyle = isCelestial ? '#FFD700' : '#FFB300';
      ctx.beginPath();
      ctx.moveTo(-11, -20 + bounce);
      ctx.lineTo(0, isCelestial ? -36 + bounce : -32 + bounce);
      ctx.lineTo(11, -20 + bounce);
      ctx.closePath();
      ctx.fill();

      // Crown Jewel: Radiant Cyan Diamond for Celestial, Ruby for classic
      ctx.fillStyle = isCelestial ? '#00E5FF' : '#D50000';
      ctx.beginPath();
      ctx.arc(0, -24 + bounce, isCelestial ? 3.8 : 3, 0, Math.PI * 2);
      ctx.fill();

      // 6. Sacred Forehead Tilak (Chandlo / Trisula)
      ctx.fillStyle = '#C2185B';
      ctx.fillRect(-2, -18 + bounce, 4, 6);
      ctx.fillStyle = '#FFEB3B';
      ctx.beginPath();
      ctx.arc(0, -18 + bounce, 2, 0, Math.PI * 2);
      ctx.fill();

      // 7. Peaceful Eye
      ctx.fillStyle = '#212121';
      ctx.beginPath();
      ctx.ellipse(6, -11 + bounce, 2, 3, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.arc(7, -12 + bounce, 1, 0, Math.PI * 2);
      ctx.fill();

      // 8. Curved Trunk holding Modak
      ctx.strokeStyle = isCelestial ? '#FFF3E0' : '#FFE0B2';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(4, -6 + bounce);
      const trunkSway = Math.sin(this.animTime * 3) * 3;
      ctx.quadraticCurveTo(14 + trunkSway, -2 + bounce, 12, 10 + bounce);
      ctx.stroke();

      // Small tusk (ekadanta)
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.moveTo(3, -4 + bounce);
      ctx.lineTo(8, -2 + bounce);
      ctx.lineTo(4, 0 + bounce);
      ctx.closePath();
      ctx.fill();

      // 9. Modak in hand (Golden Amrita modak in celestial mode)
      ctx.fillStyle = isCelestial ? '#FFFDE7' : '#FFF9C4';
      ctx.strokeStyle = isCelestial ? '#FFD700' : '#FFB300';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(14, 8 + bounce);
      ctx.lineTo(18, 5 + bounce);
      ctx.lineTo(20, 10 + bounce);
      ctx.lineTo(14, 12 + bounce);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();

      // Draw Mooshika Companion
      this.drawMooshika(ctx, camX);
    }

    drawMooshika(ctx, camX) {
      const mX = this.mooshikaX - camX;
      const mY = this.mooshikaY;
      const isCelestial = state.isCelestialMode || state.currentLevel >= 5 || state.levelsCompletedCount >= 4;

      ctx.save();
      ctx.translate(mX, mY);
      if (this.facing === -1) ctx.scale(-1, 1);

      const mBounce = Math.sin(this.animTime * 8) * 1.5;

      // Celestial Royal Cape flowing behind Mooshika
      if (isCelestial) {
        ctx.fillStyle = '#E91E63';
        ctx.beginPath();
        const capeFlutter = Math.sin(this.animTime * 10) * 3;
        ctx.moveTo(-4, -1 + mBounce);
        ctx.quadraticCurveTo(-14, 1 + capeFlutter, -12, 7 + mBounce);
        ctx.lineTo(-2, 3 + mBounce);
        ctx.closePath();
        ctx.fill();
      }

      // Mouse body
      ctx.fillStyle = isCelestial ? '#A1887F' : '#8D6E63';
      ctx.beginPath();
      ctx.ellipse(0, 0 + mBounce, 7, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Head
      ctx.beginPath();
      ctx.arc(6, -1 + mBounce, 4, 0, Math.PI * 2);
      ctx.fill();

      // Ear
      ctx.fillStyle = isCelestial ? '#FFE0B2' : '#D7CCC8';
      ctx.beginPath();
      ctx.arc(5, -4 + mBounce, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Tiny Royal Golden Crown for Mooshika in Celestial Mode
      if (isCelestial) {
        ctx.fillStyle = '#FFD54F';
        ctx.beginPath();
        ctx.moveTo(4, -6 + mBounce);
        ctx.lineTo(5.5, -9 + mBounce);
        ctx.lineTo(7, -6 + mBounce);
        ctx.lineTo(8.5, -9 + mBounce);
        ctx.lineTo(9, -6 + mBounce);
        ctx.closePath();
        ctx.fill();
      }

      // Tiny modak snack (with golden sparkle in celestial mode)
      ctx.fillStyle = isCelestial ? '#FFF9C4' : '#FFF59D';
      ctx.beginPath();
      ctx.arc(9, 1 + mBounce, 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // ==========================================================================
  // COLLECTIBLES & INTERACTIVE OBJECTS
  // ==========================================================================
  class Collectible {
    constructor(x, y, type) {
      this.x = x;
      this.y = y;
      this.type = type; // 'energy', 'modak', 'flower', 'wisdom'
      this.radius = 16;
      this.collected = false;
      this.floatOffset = Math.random() * Math.PI * 2;
    }

    update(animTime) {
      this.floatY = Math.sin(animTime * 2.5 + this.floatOffset) * 4;
    }

    draw(ctx, camX) {
      if (this.collected) return;
      const drawX = this.x - camX;
      const drawY = this.y + this.floatY;

      ctx.save();

      if (this.type === 'energy') {
        // Divine Energy Orb
        const grad = ctx.createRadialGradient(drawX, drawY, 2, drawX, drawY, 18);
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(0.3, '#FFF176');
        grad.addColorStop(0.7, '#FF9800');
        grad.addColorStop(1, 'rgba(255, 152, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(drawX, drawY, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '16px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⭐', drawX, drawY);
      } else if (this.type === 'modak') {
        // Modak
        ctx.font = '22px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🍬', drawX, drawY);
      } else if (this.type === 'flower') {
        // Marigold / Lotus Flower
        ctx.font = '22px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🌺', drawX, drawY);
      } else if (this.type === 'wisdom') {
        // Wisdom Power Crystal
        const grad = ctx.createRadialGradient(drawX, drawY, 2, drawX, drawY, 16);
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(0.4, '#00E5FF');
        grad.addColorStop(1, 'rgba(0, 229, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(drawX, drawY, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '16px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✨', drawX, drawY);
      }

      ctx.restore();
    }
  }

  // Interactive Level Objects (Diyas, Bells, Shrines)
  class InteractiveObject {
    constructor(x, y, type, data = {}) {
      this.x = x;
      this.y = y;
      this.type = type; // 'diya', 'bell', 'shrine', 'temple_gate', 'symbol'
      this.data = data;
      this.activated = false;
      this.width = data.width || 36;
      this.height = data.height || 36;
    }

    draw(ctx, camX, animTime) {
      const drawX = this.x - camX;
      const drawY = this.y;

      ctx.save();

      if (this.type === 'diya') {
        // Clay Diya Base
        ctx.fillStyle = '#8D6E63';
        ctx.beginPath();
        ctx.ellipse(drawX + 16, drawY + 24, 16, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        if (this.activated) {
          // Lit Flame with flicker
          const flicker = Math.sin(animTime * 12 + this.x) * 2;
          ctx.fillStyle = '#FF9800';
          ctx.beginPath();
          ctx.ellipse(drawX + 16, drawY + 12 + flicker, 6, 10, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FFF59D';
          ctx.beginPath();
          ctx.ellipse(drawX + 16, drawY + 14 + flicker, 3, 6, 0, 0, Math.PI * 2);
          ctx.fill();

          // Warm aura
          const aura = ctx.createRadialGradient(drawX + 16, drawY + 14, 2, drawX + 16, drawY + 14, 24);
          aura.addColorStop(0, 'rgba(255, 235, 59, 0.45)');
          aura.addColorStop(1, 'rgba(255, 152, 0, 0)');
          ctx.fillStyle = aura;
          ctx.beginPath();
          ctx.arc(drawX + 16, drawY + 14, 24, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Unlit Wick
          ctx.fillStyle = '#424242';
          ctx.fillRect(drawX + 15, drawY + 14, 2, 8);
        }
      } else if (this.type === 'bell') {
        // Temple Ghanta Bell
        const sway = this.activated ? Math.sin(animTime * 8) * 0.15 : 0;
        ctx.translate(drawX + 18, drawY);
        ctx.rotate(sway);

        // Bell cord
        ctx.strokeStyle = '#D7CCC8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 10);
        ctx.stroke();

        // Bell Body
        ctx.fillStyle = '#FFB300';
        ctx.beginPath();
        ctx.moveTo(-12, 30);
        ctx.quadraticCurveTo(-10, 12, 0, 10);
        ctx.quadraticCurveTo(10, 12, 12, 30);
        ctx.closePath();
        ctx.fill();

        // Bell rim
        ctx.fillStyle = '#FFA000';
        ctx.beginPath();
        ctx.ellipse(0, 30, 14, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Clapper
        ctx.fillStyle = '#5D4037';
        ctx.beginPath();
        ctx.arc(0, 33, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (this.type === 'shrine') {
        // Sacred Shrine Structure
        ctx.fillStyle = '#3E2723';
        ctx.fillRect(drawX, drawY + 10, 60, 50);

        // Golden Dome
        ctx.fillStyle = '#FFB300';
        ctx.beginPath();
        ctx.arc(drawX + 30, drawY + 10, 24, Math.PI, 0);
        ctx.fill();

        // Kalash finial
        ctx.font = '20px serif';
        ctx.textAlign = 'center';
        ctx.fillText('🪔', drawX + 30, drawY - 8);

        // Glow when ready
        if (state.divineEnergyCollected >= LEVEL_CONFIGS[state.currentLevel].targetEnergy) {
          ctx.strokeStyle = '#00E5FF';
          ctx.lineWidth = 3;
          ctx.strokeRect(drawX - 2, drawY + 8, 64, 54);
        }
      } else if (this.type === 'temple_gate') {
        // Giant Temple Gates with sliding open animation
        const slideOffset = this.activated ? 34 : 0;

        // Divine light ray beam shining through when opened
        if (this.activated) {
          const lightGrad = ctx.createLinearGradient(drawX + 40, drawY, drawX + 40, drawY + 140);
          lightGrad.addColorStop(0, 'rgba(255, 235, 59, 0.6)');
          lightGrad.addColorStop(1, 'rgba(0, 229, 255, 0.2)');
          ctx.fillStyle = lightGrad;
          ctx.fillRect(drawX, drawY, 80, 140);
        }

        // Left Gate Door
        ctx.fillStyle = '#211317';
        ctx.fillRect(drawX - slideOffset, drawY, 40, 140);
        ctx.strokeStyle = '#FFB300';
        ctx.lineWidth = 3;
        ctx.strokeRect(drawX - slideOffset, drawY, 40, 140);

        // Right Gate Door
        ctx.fillStyle = '#211317';
        ctx.fillRect(drawX + 40 + slideOffset, drawY, 40, 140);
        ctx.strokeRect(drawX + 40 + slideOffset, drawY, 40, 140);

        // Golden filigree carvings & Sacred Emblem
        ctx.font = '28px serif';
        ctx.textAlign = 'center';
        ctx.fillText('🛕', drawX + 40, drawY + 50);
      }

      ctx.restore();
    }
  }

  // Hazards & Obstacles
  class Obstacle {
    constructor(x, y, w, h, type = 'rock', vx = 0, range = 0) {
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = h;
      this.type = type; // 'rock', 'cart', 'chakra', 'spikes'
      this.vx = vx;
      this.range = range;
      this.startX = x;
      this.active = true;
    }

    update() {
      if (!this.active || state.timeFrozen) return;

      if (this.range > 0) {
        this.x += this.vx;
        if (Math.abs(this.x - this.startX) > this.range) {
          this.vx = -this.vx;
        }
      }
    }

    draw(ctx, camX, animTime) {
      if (!this.active) return;
      const drawX = this.x - camX;
      const drawY = this.y;

      ctx.save();

      if (this.type === 'cart') {
        // Moving Festival Handcart
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(drawX, drawY, this.w, this.h);
        // Cart wheels
        ctx.fillStyle = '#3E2723';
        ctx.beginPath();
        ctx.arc(drawX + 8, drawY + this.h, 6, 0, Math.PI * 2);
        ctx.arc(drawX + this.w - 8, drawY + this.h, 6, 0, Math.PI * 2);
        ctx.fill();
        // Goods icon
        ctx.font = '16px serif';
        ctx.fillText('🧺', drawX + 10, drawY + 16);
      } else if (this.type === 'chakra') {
        // Rotating festive chakra hazard
        ctx.translate(drawX + this.w / 2, drawY + this.h / 2);
        ctx.rotate(animTime * 4);
        ctx.fillStyle = '#D50000';
        for (let i = 0; i < 6; i++) {
          ctx.rotate(Math.PI / 3);
          ctx.fillRect(-2, -this.w / 2, 4, this.w);
        }
      } else if (this.type === 'spikes') {
        // Brambles / Spikes
        ctx.fillStyle = '#8D6E63';
        const count = Math.floor(this.w / 12);
        for (let i = 0; i < count; i++) {
          ctx.beginPath();
          ctx.moveTo(drawX + i * 12, drawY + this.h);
          ctx.lineTo(drawX + i * 12 + 6, drawY);
          ctx.lineTo(drawX + i * 12 + 12, drawY + this.h);
          ctx.closePath();
          ctx.fill();
        }
      } else {
        // Rolling Rock
        ctx.fillStyle = '#616161';
        ctx.beginPath();
        ctx.arc(drawX + this.w / 2, drawY + this.h / 2, this.w / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  // ==========================================================================
  // LEVEL BUILDERS
  // ==========================================================================
  function buildLevel(levelNum) {
    state.currentLevel = levelNum;
    state.levelCompleted = false;
    state.divineEnergyCollected = 0;
    state.timer = LEVEL_CONFIGS[levelNum].timeLimit;

    if (window.soundEngine) {
      window.soundEngine.setLevel(levelNum);
    }

    platforms = [];
    collectibles = [];
    obstacles = [];
    interactiveObjects = [];
    particles = [];
    floatTexts = [];
    fireworks = [];

    const cfg = LEVEL_CONFIGS[levelNum];
    const worldW = cfg.worldWidth;

    // Ground platform spanning entire level
    platforms.push({ x: 0, y: CANVAS_HEIGHT - 48, w: worldW, h: 48, type: 'ground' });

    // Initialize player at start
    player = new GaneshaPlayer(60, CANVAS_HEIGHT - 120);

    if (levelNum === 1) {
      // -------------------------------------------------------------
      // LEVEL 1: SACRED FOREST
      // -------------------------------------------------------------
      hudLevelName.textContent = 'LEVEL 1 — SACRED FOREST';

      // Stepping Platforms
      const pData = [
        { x: 280, y: 380, w: 140, h: 18 },
        { x: 490, y: 310, w: 150, h: 18 },
        { x: 720, y: 370, w: 130, h: 18 },
        { x: 940, y: 290, w: 160, h: 18 },
        { x: 1180, y: 360, w: 140, h: 18 },
        { x: 1400, y: 300, w: 150, h: 18 },
        { x: 1640, y: 370, w: 140, h: 18 },
        { x: 1880, y: 290, w: 160, h: 18 },
        { x: 2120, y: 360, w: 150, h: 18 }
      ];
      pData.forEach(p => platforms.push(p));

      // 5 Divine Energy Orbs
      collectibles.push(new Collectible(550, 260, 'energy'));
      collectibles.push(new Collectible(1000, 240, 'energy'));
      collectibles.push(new Collectible(1470, 250, 'energy'));
      collectibles.push(new Collectible(1950, 240, 'energy'));
      collectibles.push(new Collectible(2180, 310, 'energy'));

      // Modaks & Flowers
      [340, 780, 1240, 1700, 2020, 2350].forEach(x => {
        collectibles.push(new Collectible(x, CANVAS_HEIGHT - 80, 'modak'));
      });
      [420, 860, 1320, 1780, 2240].forEach(x => {
        collectibles.push(new Collectible(x, CANVAS_HEIGHT - 80, 'flower'));
      });

      // Wisdom Energy orb
      collectibles.push(new Collectible(800, 320, 'wisdom'));

      // Forest Bramble Spikes
      obstacles.push(new Obstacle(650, CANVAS_HEIGHT - 66, 60, 18, 'spikes'));
      obstacles.push(new Obstacle(1550, CANVAS_HEIGHT - 66, 70, 18, 'spikes'));

      // Sacred Shrine at End
      interactiveObjects.push(new InteractiveObject(worldW - 140, CANVAS_HEIGHT - 108, 'shrine'));

    } else if (levelNum === 2) {
      // -------------------------------------------------------------
      // LEVEL 2: FESTIVAL CITY
      // -------------------------------------------------------------
      hudLevelName.textContent = 'LEVEL 2 — FESTIVAL CITY';

      // Decorated shop and street canopy platforms
      const pData = [
        { x: 320, y: 370, w: 160, h: 18 },
        { x: 580, y: 300, w: 150, h: 18 },
        { x: 840, y: 360, w: 160, h: 18 },
        { x: 1100, y: 280, w: 160, h: 18 },
        { x: 1360, y: 350, w: 160, h: 18 },
        { x: 1620, y: 290, w: 150, h: 18 },
        { x: 1880, y: 360, w: 170, h: 18 },
        { x: 2150, y: 290, w: 160, h: 18 },
        { x: 2420, y: 360, w: 170, h: 18 }
      ];
      pData.forEach(p => platforms.push(p));

      // 5 Diyas to light
      interactiveObjects.push(new InteractiveObject(400, 334, 'diya'));
      interactiveObjects.push(new InteractiveObject(900, 324, 'diya'));
      interactiveObjects.push(new InteractiveObject(1420, 314, 'diya'));
      interactiveObjects.push(new InteractiveObject(1940, 324, 'diya'));
      interactiveObjects.push(new InteractiveObject(2480, 324, 'diya'));

      // 5 Divine Energy
      collectibles.push(new Collectible(640, 250, 'energy'));
      collectibles.push(new Collectible(1160, 230, 'energy'));
      collectibles.push(new Collectible(1680, 240, 'energy'));
      collectibles.push(new Collectible(2210, 240, 'energy'));
      collectibles.push(new Collectible(2650, 420, 'energy'));

      // 5 Flowers & 5 Modaks
      [500, 1020, 1540, 2060, 2560].forEach(x => {
        collectibles.push(new Collectible(x, CANVAS_HEIGHT - 80, 'flower'));
      });
      [220, 740, 1260, 1780, 2300].forEach(x => {
        collectibles.push(new Collectible(x, CANVAS_HEIGHT - 80, 'modak'));
      });

      // Moving festival carts
      obstacles.push(new Obstacle(700, CANVAS_HEIGHT - 82, 40, 34, 'cart', 1.8, 140));
      obstacles.push(new Obstacle(1450, CANVAS_HEIGHT - 82, 40, 34, 'cart', -2.0, 160));
      obstacles.push(new Obstacle(2100, CANVAS_HEIGHT - 82, 40, 34, 'cart', 2.2, 150));

      // End Temple Entrance
      interactiveObjects.push(new InteractiveObject(worldW - 140, CANVAS_HEIGHT - 108, 'shrine'));

    } else if (levelNum === 3) {
      // -------------------------------------------------------------
      // LEVEL 3: ANCIENT TEMPLE
      // -------------------------------------------------------------
      hudLevelName.textContent = 'LEVEL 3 — ANCIENT TEMPLE';

      const pData = [
        { x: 260, y: 380, w: 150, h: 20 },
        { x: 480, y: 300, w: 160, h: 20 },
        { x: 720, y: 220, w: 150, h: 20 },
        { x: 960, y: 320, w: 170, h: 20 },
        { x: 1220, y: 240, w: 160, h: 20 },
        { x: 1480, y: 340, w: 150, h: 20 },
        { x: 1740, y: 260, w: 160, h: 20 },
        { x: 2020, y: 340, w: 160, h: 20 },
        { x: 2280, y: 250, w: 170, h: 20 }
      ];
      pData.forEach(p => platforms.push(p));

      // Temple Bells (ring when touched)
      interactiveObjects.push(new InteractiveObject(330, 280, 'bell'));
      interactiveObjects.push(new InteractiveObject(790, 130, 'bell'));
      interactiveObjects.push(new InteractiveObject(1290, 150, 'bell'));
      interactiveObjects.push(new InteractiveObject(1810, 170, 'bell'));

      // 5 Divine Energy
      collectibles.push(new Collectible(540, 250, 'energy'));
      collectibles.push(new Collectible(790, 170, 'energy'));
      collectibles.push(new Collectible(1300, 190, 'energy'));
      collectibles.push(new Collectible(1820, 210, 'energy'));
      collectibles.push(new Collectible(2350, 200, 'energy'));

      // Modaks & Flowers
      [400, 880, 1400, 1920, 2450].forEach(x => {
        collectibles.push(new Collectible(x, CANVAS_HEIGHT - 80, 'modak'));
        collectibles.push(new Collectible(x + 40, CANVAS_HEIGHT - 80, 'flower'));
      });

      // Giant Temple Gate at End
      interactiveObjects.push(new InteractiveObject(worldW - 120, CANVAS_HEIGHT - 188, 'temple_gate'));

    } else if (levelNum === 4) {
      // -------------------------------------------------------------
      // LEVEL 4: DIVINE CHALLENGE
      // -------------------------------------------------------------
      hudLevelName.textContent = 'LEVEL 4 — DIVINE CHALLENGE';

      // Faster obstacles, floating platforms
      const pData = [
        { x: 240, y: 380, w: 140, h: 18 },
        { x: 460, y: 310, w: 130, h: 18 },
        { x: 680, y: 240, w: 140, h: 18 },
        { x: 920, y: 330, w: 130, h: 18 },
        { x: 1160, y: 250, w: 140, h: 18 },
        { x: 1400, y: 340, w: 140, h: 18 },
        { x: 1650, y: 260, w: 140, h: 18 },
        { x: 1900, y: 330, w: 130, h: 18 },
        { x: 2150, y: 250, w: 140, h: 18 },
        { x: 2400, y: 320, w: 140, h: 18 },
        { x: 2680, y: 260, w: 150, h: 18 },
        { x: 2950, y: 340, w: 160, h: 18 }
      ];
      pData.forEach(p => platforms.push(p));

      // Multiple Wisdom Power pick-ups to test powers!
      collectibles.push(new Collectible(520, 260, 'wisdom'));
      collectibles.push(new Collectible(1220, 200, 'wisdom'));
      collectibles.push(new Collectible(1960, 280, 'wisdom'));
      collectibles.push(new Collectible(2740, 210, 'wisdom'));

      // 6 Divine Energy
      collectibles.push(new Collectible(300, 330, 'energy'));
      collectibles.push(new Collectible(740, 190, 'energy'));
      collectibles.push(new Collectible(1460, 290, 'energy'));
      collectibles.push(new Collectible(1710, 210, 'energy'));
      collectibles.push(new Collectible(2210, 200, 'energy'));
      collectibles.push(new Collectible(3010, 290, 'energy'));

      // Moving chakras & hazards
      obstacles.push(new Obstacle(580, 350, 32, 32, 'chakra', 2.2, 80));
      obstacles.push(new Obstacle(1040, 280, 32, 32, 'chakra', -2.5, 90));
      obstacles.push(new Obstacle(1520, 360, 32, 32, 'chakra', 2.8, 100));
      obstacles.push(new Obstacle(2020, 370, 32, 32, 'chakra', -2.6, 90));
      obstacles.push(new Obstacle(2540, 350, 32, 32, 'chakra', 3.0, 110));

      // End Portal Shrine
      interactiveObjects.push(new InteractiveObject(worldW - 140, CANVAS_HEIGHT - 108, 'shrine'));

    } else if (levelNum === 5) {
      // -------------------------------------------------------------
      // FINAL LEVEL: RESTORE THE FESTIVAL (MAHA MANDIR SANCTUM)
      // -------------------------------------------------------------
      hudLevelName.textContent = 'FINAL LEVEL — RESTORE THE FESTIVAL';
      state.restorationProgress = 0;

      // Grand Sanctuary Platforming Steps leading up to Central Shrine
      platforms.push({ x: 200, y: 400, w: 180, h: 24 });
      platforms.push({ x: 420, y: 340, w: 180, h: 24 });
      platforms.push({ x: 640, y: 270, w: 320, h: 30 }); // Central Sacred Altar
      platforms.push({ x: 1000, y: 340, w: 180, h: 24 });
      platforms.push({ x: 1220, y: 400, w: 180, h: 24 });

      // Diyas on platforms
      interactiveObjects.push(new InteractiveObject(280, 364, 'diya'));
      interactiveObjects.push(new InteractiveObject(500, 304, 'diya'));
      interactiveObjects.push(new InteractiveObject(1080, 304, 'diya'));
      interactiveObjects.push(new InteractiveObject(1300, 364, 'diya'));

      // The Great Sacred Shrine at Center
      interactiveObjects.push(new InteractiveObject(760, 162, 'shrine'));

      // 5 Sacred Offerings to place on the altar
      collectibles.push(new Collectible(280, 320, 'energy'));
      collectibles.push(new Collectible(500, 260, 'energy'));
      collectibles.push(new Collectible(800, 210, 'energy'));
      collectibles.push(new Collectible(1080, 260, 'energy'));
      collectibles.push(new Collectible(1300, 320, 'energy'));

      // Auspicious modaks & flowers
      [150, 360, 600, 940, 1160, 1400].forEach(x => {
        collectibles.push(new Collectible(x, CANVAS_HEIGHT - 80, 'modak'));
        collectibles.push(new Collectible(x + 35, CANVAS_HEIGHT - 80, 'flower'));
      });

    } else if (levelNum === 6) {
      // -------------------------------------------------------------
      // LEVEL 6: KAILASH FOOTHILLS (CELESTIAL REALM 1)
      // -------------------------------------------------------------
      hudLevelName.textContent = 'LEVEL 6 — KAILASH FOOTHILLS';

      const pData = [
        { x: 260, y: 380, w: 150, h: 20 },
        { x: 480, y: 310, w: 160, h: 20 },
        { x: 720, y: 370, w: 150, h: 20 },
        { x: 960, y: 290, w: 170, h: 20 },
        { x: 1220, y: 360, w: 160, h: 20 },
        { x: 1460, y: 300, w: 170, h: 20 },
        { x: 1720, y: 370, w: 160, h: 20 },
        { x: 1980, y: 290, w: 170, h: 20 },
        { x: 2240, y: 360, w: 160, h: 20 },
        { x: 2500, y: 300, w: 180, h: 20 },
        { x: 2780, y: 370, w: 170, h: 20 }
      ];
      pData.forEach(p => platforms.push(p));

      // 6 Divine Kailash Energy Orbs
      collectibles.push(new Collectible(540, 250, 'energy'));
      collectibles.push(new Collectible(1030, 230, 'energy'));
      collectibles.push(new Collectible(1530, 240, 'energy'));
      collectibles.push(new Collectible(2050, 230, 'energy'));
      collectibles.push(new Collectible(2570, 240, 'energy'));
      collectibles.push(new Collectible(2840, 310, 'energy'));

      // Himalayan Modaks & Sacred Mountain Flowers
      [320, 800, 1300, 1800, 2320, 2700].forEach(x => {
        collectibles.push(new Collectible(x, CANVAS_HEIGHT - 80, 'modak'));
        collectibles.push(new Collectible(x + 40, CANVAS_HEIGHT - 80, 'flower'));
      });

      // Wisdom Power Crystals
      collectibles.push(new Collectible(800, 320, 'wisdom'));
      collectibles.push(new Collectible(2060, 240, 'wisdom'));

      // Snow Diyas & Prayer Bells
      interactiveObjects.push(new InteractiveObject(330, 344, 'diya'));
      interactiveObjects.push(new InteractiveObject(1290, 324, 'diya'));
      interactiveObjects.push(new InteractiveObject(2310, 324, 'diya'));
      interactiveObjects.push(new InteractiveObject(790, 334, 'bell'));
      interactiveObjects.push(new InteractiveObject(1800, 334, 'bell'));

      // Himalayan Icicle Spikes & Rolling Snow Boulders
      obstacles.push(new Obstacle(640, CANVAS_HEIGHT - 66, 64, 18, 'spikes'));
      obstacles.push(new Obstacle(1400, CANVAS_HEIGHT - 66, 70, 18, 'spikes'));
      obstacles.push(new Obstacle(2160, CANVAS_HEIGHT - 66, 70, 18, 'spikes'));
      obstacles.push(new Obstacle(1150, CANVAS_HEIGHT - 74, 26, 26, 'rock', 2.0, 90));
      obstacles.push(new Obstacle(2420, CANVAS_HEIGHT - 74, 26, 26, 'rock', -2.2, 100));

      // Kailash Sacred Shrine
      interactiveObjects.push(new InteractiveObject(worldW - 140, CANVAS_HEIGHT - 108, 'shrine'));

    } else if (levelNum === 7) {
      // -------------------------------------------------------------
      // LEVEL 7: CELESTIAL RIVER GANGA (SACRED WATERS)
      // -------------------------------------------------------------
      hudLevelName.textContent = 'LEVEL 7 — CELESTIAL RIVER GANGA';

      const pData = [
        { x: 280, y: 370, w: 160, h: 20 },
        { x: 520, y: 300, w: 150, h: 20 },
        { x: 780, y: 360, w: 170, h: 20 },
        { x: 1040, y: 280, w: 160, h: 20 },
        { x: 1300, y: 350, w: 170, h: 20 },
        { x: 1560, y: 290, w: 160, h: 20 },
        { x: 1820, y: 360, w: 170, h: 20 },
        { x: 2100, y: 290, w: 160, h: 20 },
        { x: 2380, y: 360, w: 180, h: 20 },
        { x: 2680, y: 290, w: 170, h: 20 },
        { x: 2980, y: 360, w: 180, h: 20 }
      ];
      pData.forEach(p => platforms.push(p));

      // 6 Sacred Ganga Energy Orbs
      collectibles.push(new Collectible(580, 240, 'energy'));
      collectibles.push(new Collectible(1110, 220, 'energy'));
      collectibles.push(new Collectible(1630, 230, 'energy'));
      collectibles.push(new Collectible(2170, 230, 'energy'));
      collectibles.push(new Collectible(2740, 230, 'energy'));
      collectibles.push(new Collectible(3060, 300, 'energy'));

      // Floating Lotus Offerings & Sweet Modaks
      [360, 860, 1380, 1900, 2460, 2900].forEach(x => {
        collectibles.push(new Collectible(x, CANVAS_HEIGHT - 80, 'modak'));
        collectibles.push(new Collectible(x + 40, CANVAS_HEIGHT - 80, 'flower'));
      });

      // Wisdom Power Crystals
      collectibles.push(new Collectible(850, 310, 'wisdom'));
      collectibles.push(new Collectible(2170, 240, 'wisdom'));

      // Sacred Water Aarti Diyas
      interactiveObjects.push(new InteractiveObject(350, 334, 'diya'));
      interactiveObjects.push(new InteractiveObject(1110, 244, 'diya'));
      interactiveObjects.push(new InteractiveObject(1900, 324, 'diya'));
      interactiveObjects.push(new InteractiveObject(2740, 254, 'diya'));

      // River Eddy Whirlpool Chakras
      obstacles.push(new Obstacle(700, 340, 30, 30, 'chakra', 2.0, 70));
      obstacles.push(new Obstacle(1480, 330, 30, 30, 'chakra', -2.2, 80));
      obstacles.push(new Obstacle(2280, 340, 30, 30, 'chakra', 2.4, 85));
      obstacles.push(new Obstacle(2860, 330, 30, 30, 'chakra', -2.5, 90));

      // Sacred Ganga Ghat Toran Shrine
      interactiveObjects.push(new InteractiveObject(worldW - 140, CANVAS_HEIGHT - 108, 'shrine'));

    } else if (levelNum === 8) {
      // -------------------------------------------------------------
      // LEVEL 8: SURYA MANDIR (SUN TEMPLE OF RADIANCE)
      // -------------------------------------------------------------
      hudLevelName.textContent = 'LEVEL 8 — SURYA MANDIR';

      const pData = [
        { x: 260, y: 380, w: 160, h: 20 },
        { x: 500, y: 310, w: 170, h: 20 },
        { x: 760, y: 250, w: 160, h: 20 },
        { x: 1020, y: 330, w: 170, h: 20 },
        { x: 1280, y: 260, w: 160, h: 20 },
        { x: 1540, y: 340, w: 170, h: 20 },
        { x: 1800, y: 270, w: 170, h: 20 },
        { x: 2080, y: 350, w: 170, h: 20 },
        { x: 2360, y: 280, w: 170, h: 20 },
        { x: 2640, y: 350, w: 180, h: 20 }
      ];
      pData.forEach(p => platforms.push(p));

      // 6 Solar Energy Orbs
      collectibles.push(new Collectible(580, 250, 'energy'));
      collectibles.push(new Collectible(830, 190, 'energy'));
      collectibles.push(new Collectible(1350, 200, 'energy'));
      collectibles.push(new Collectible(1880, 210, 'energy'));
      collectibles.push(new Collectible(2440, 220, 'energy'));
      collectibles.push(new Collectible(2720, 290, 'energy'));

      // Auspicious Offerings
      [340, 840, 1360, 1900, 2440].forEach(x => {
        collectibles.push(new Collectible(x, CANVAS_HEIGHT - 80, 'modak'));
        collectibles.push(new Collectible(x + 40, CANVAS_HEIGHT - 80, 'flower'));
      });

      // Wisdom Power Crystals
      collectibles.push(new Collectible(1100, 280, 'wisdom'));
      collectibles.push(new Collectible(2150, 300, 'wisdom'));

      // Surya Sun Diyas
      interactiveObjects.push(new InteractiveObject(330, 344, 'diya'));
      interactiveObjects.push(new InteractiveObject(820, 214, 'diya'));
      interactiveObjects.push(new InteractiveObject(1610, 304, 'diya'));
      interactiveObjects.push(new InteractiveObject(2430, 244, 'diya'));

      // Solar Chakras (Spinning Sun Hazards)
      obstacles.push(new Obstacle(680, 330, 32, 32, 'chakra', 2.5, 90));
      obstacles.push(new Obstacle(1200, 310, 32, 32, 'chakra', -2.8, 90));
      obstacles.push(new Obstacle(1720, 330, 32, 32, 'chakra', 3.0, 95));
      obstacles.push(new Obstacle(2260, 320, 32, 32, 'chakra', -3.0, 100));

      // Surya Arka Sanctum Shrine
      interactiveObjects.push(new InteractiveObject(worldW - 140, CANVAS_HEIGHT - 108, 'shrine'));

    } else if (levelNum === 9) {
      // -------------------------------------------------------------
      // LEVEL 9: INDRA’S AMARAVATI (HEAVEN OF THE DEVAS)
      // -------------------------------------------------------------
      hudLevelName.textContent = 'LEVEL 9 — INDRA’S AMARAVATI';

      const pData = [
        { x: 260, y: 380, w: 150, h: 18 },
        { x: 480, y: 300, w: 160, h: 18 },
        { x: 720, y: 240, w: 160, h: 18 },
        { x: 960, y: 320, w: 170, h: 18 },
        { x: 1220, y: 250, w: 160, h: 18 },
        { x: 1480, y: 330, w: 170, h: 18 },
        { x: 1740, y: 260, w: 170, h: 18 },
        { x: 2020, y: 340, w: 170, h: 18 },
        { x: 2300, y: 260, w: 170, h: 18 },
        { x: 2580, y: 330, w: 180, h: 18 },
        { x: 2880, y: 260, w: 170, h: 18 },
        { x: 3180, y: 350, w: 180, h: 18 }
      ];
      pData.forEach(p => platforms.push(p));

      // 7 Heavenly Stars
      collectibles.push(new Collectible(550, 240, 'energy'));
      collectibles.push(new Collectible(790, 180, 'energy'));
      collectibles.push(new Collectible(1300, 190, 'energy'));
      collectibles.push(new Collectible(1820, 200, 'energy'));
      collectibles.push(new Collectible(2380, 200, 'energy'));
      collectibles.push(new Collectible(2950, 200, 'energy'));
      collectibles.push(new Collectible(3260, 290, 'energy'));

      // Auspicious Prasad
      [360, 880, 1400, 1920, 2480, 3050].forEach(x => {
        collectibles.push(new Collectible(x, CANVAS_HEIGHT - 80, 'modak'));
        collectibles.push(new Collectible(x + 40, CANVAS_HEIGHT - 80, 'flower'));
      });

      // Wisdom Power Crystals
      collectibles.push(new Collectible(1030, 270, 'wisdom'));
      collectibles.push(new Collectible(2100, 290, 'wisdom'));
      collectibles.push(new Collectible(2660, 280, 'wisdom'));

      // Celestial Temple Bells & Diyas
      interactiveObjects.push(new InteractiveObject(780, 204, 'diya'));
      interactiveObjects.push(new InteractiveObject(1540, 294, 'diya'));
      interactiveObjects.push(new InteractiveObject(2360, 224, 'diya'));
      interactiveObjects.push(new InteractiveObject(1030, 280, 'bell'));
      interactiveObjects.push(new InteractiveObject(2650, 290, 'bell'));

      // Heavenly Lightning Chakras
      obstacles.push(new Obstacle(620, 320, 32, 32, 'chakra', 2.8, 90));
      obstacles.push(new Obstacle(1130, 300, 32, 32, 'chakra', -3.0, 95));
      obstacles.push(new Obstacle(1640, 320, 32, 32, 'chakra', 3.2, 100));
      obstacles.push(new Obstacle(2200, 310, 32, 32, 'chakra', -3.2, 100));
      obstacles.push(new Obstacle(2780, 320, 32, 32, 'chakra', 3.4, 110));

      // Amaravati Deva Sabha Gate
      interactiveObjects.push(new InteractiveObject(worldW - 140, CANVAS_HEIGHT - 108, 'shrine'));

    } else if (levelNum === 10) {
      // -------------------------------------------------------------
      // FINAL LEVEL 10: ANANTA COSMIC SANCTUM (SUPREME TRANSCENDENCE)
      // -------------------------------------------------------------
      hudLevelName.textContent = 'FINAL LEVEL 10 — ANANTA COSMIC SANCTUM';
      state.restorationProgress = 0;

      // 5 Grand Cosmic Crystalline Steps Ascending to the Supreme Altar
      platforms.push({ x: 180, y: 410, w: 200, h: 24 });
      platforms.push({ x: 420, y: 340, w: 200, h: 24 });
      platforms.push({ x: 680, y: 260, w: 400, h: 32 }); // Grand Supreme Altar
      platforms.push({ x: 1140, y: 340, w: 200, h: 24 });
      platforms.push({ x: 1380, y: 410, w: 200, h: 24 });

      // Eternal Cosmic Diyas on Altar Steps
      interactiveObjects.push(new InteractiveObject(260, 374, 'diya'));
      interactiveObjects.push(new InteractiveObject(500, 304, 'diya'));
      interactiveObjects.push(new InteractiveObject(1220, 304, 'diya'));
      interactiveObjects.push(new InteractiveObject(1460, 374, 'diya'));

      // The Supreme Cosmic Altar of Lord Ganesha
      interactiveObjects.push(new InteractiveObject(830, 150, 'shrine'));

      // 7 Cosmic Stars
      collectibles.push(new Collectible(260, 330, 'energy'));
      collectibles.push(new Collectible(500, 260, 'energy'));
      collectibles.push(new Collectible(740, 200, 'energy'));
      collectibles.push(new Collectible(880, 180, 'energy'));
      collectibles.push(new Collectible(1020, 200, 'energy'));
      collectibles.push(new Collectible(1220, 260, 'energy'));
      collectibles.push(new Collectible(1460, 330, 'energy'));

      // Amrita modaks & Celestial flowers
      [120, 340, 580, 1180, 1420, 1640].forEach(x => {
        collectibles.push(new Collectible(x, CANVAS_HEIGHT - 80, 'modak'));
        collectibles.push(new Collectible(x + 35, CANVAS_HEIGHT - 80, 'flower'));
      });

      // Wisdom Power Crystals
      collectibles.push(new Collectible(600, 300, 'wisdom'));
      collectibles.push(new Collectible(1160, 300, 'wisdom'));
    }

    updateHUD();
    startLevelTimer();
  }

  // ==========================================================================
  // TIMER & HUD UPDATES
  // ==========================================================================
  function startLevelTimer() {
    if (state.timerInterval) clearInterval(state.timerInterval);

    state.timerInterval = setInterval(() => {
      if (state.isPaused || !state.isPlaying || state.timeFrozen) return;

      state.timer--;
      updateHUD();

      if (state.timer <= 20) {
        hudTimerContainer.classList.add('urgent');
      } else {
        hudTimerContainer.classList.remove('urgent');
      }

      if (state.timer <= 0) {
        clearInterval(state.timerInterval);
        triggerGameOver("Time's Up! The festival needs you to try again.");
      }
    }, 1000);
  }

  function updateHUD() {
    // Timer display MM:SS
    const mins = Math.floor(state.timer / 60).toString().padStart(2, '0');
    const secs = (state.timer % 60).toString().padStart(2, '0');
    hudTimer.textContent = `${mins}:${secs}`;

    // Divine Energy %
    const cfg = LEVEL_CONFIGS[state.currentLevel];
    const energyPct = Math.min(100, Math.round((state.divineEnergyCollected / cfg.targetEnergy) * 100));
    hudEnergyPct.textContent = `${energyPct}%`;
    hudEnergyBar.style.width = `${energyPct}%`;

    // Wisdom Power %
    hudWisdomPct.textContent = `${state.wisdomPowerCharge}%`;
    hudWisdomBar.style.width = `${state.wisdomPowerCharge}%`;
    if (state.wisdomPowerCharge >= 100) {
      hudWisdomBar.classList.add('full');
    } else {
      hudWisdomBar.classList.remove('full');
    }

    updateScoreHUD();
  }

  function updateLivesHUD() {
    let hearts = '';
    for (let i = 0; i < 3; i++) {
      hearts += i < state.lives ? '❤️' : '🖤';
    }
    hudHearts.textContent = hearts;
  }

  // ==========================================================================
  // WISDOM POWERS SYSTEM
  // ==========================================================================
  function addWisdomCharge(amount) {
    state.wisdomPowerCharge = Math.min(100, state.wisdomPowerCharge + amount);
    updateHUD();
    if (state.wisdomPowerCharge === 100) {
      showWisdomCard('Wisdom Power Ready! Press E / Tap ✨', '✨');
      if (window.soundEngine) window.soundEngine.playBell();
    }
  }

  function triggerWisdomPower() {
    if (state.wisdomPowerCharge < 100) {
      showWisdomCard('Collect more Wisdom Crystals to activate!', '⏳');
      return;
    }

    // Reset charge
    state.wisdomPowerCharge = 0;
    updateHUD();

    // Select power based on current needs or cycle:
    // Powers: 1. Obstacle Breaker, 2. Time Freeze, 3. Double Score, 4. Extra Life, 5. Divine Shield
    const powers = ['shield', 'freeze', 'breaker', 'double_score', 'life'];
    let chosenPower = 'shield';

    if (state.lives < 3 && Math.random() < 0.5) {
      chosenPower = 'life';
    } else {
      chosenPower = powers[Math.floor(Math.random() * powers.length)];
    }

    if (window.soundEngine) window.soundEngine.playPower();

    if (chosenPower === 'shield') {
      state.hasShield = true;
      showWisdomCard('🛡️ Divine Shield Activated! Blocks next hit.', '🛡️');
      spawnBurst(player.x + player.width / 2, player.y + player.height / 2, '#00E5FF', 24, 'star');
    } else if (chosenPower === 'freeze') {
      state.timeFrozen = true;
      showWisdomCard('⚡ Time Freeze! Obstacles stopped for 5s.', '⚡');
      spawnBurst(player.x + player.width / 2, player.y + player.height / 2, '#80D8FF', 24, 'star');
      setTimeout(() => {
        state.timeFrozen = false;
        showWisdomCard('Time resumed!', '⌛');
      }, 5000);
    } else if (chosenPower === 'breaker') {
      showWisdomCard('🧠 Obstacle Breaker! Nearby hazards banished.', '🧠');
      obstacles.forEach(ob => {
        if (Math.abs(ob.x - player.x) < 400) {
          ob.active = false;
          spawnBurst(ob.x + ob.w / 2, ob.y + ob.h / 2, '#FFB300', 16, 'star');
        }
      });
    } else if (chosenPower === 'double_score') {
      state.scoreMultiplier = 2;
      showWisdomCard('🌟 Double Score Activated for 10s!', '🌟');
      setTimeout(() => {
        state.scoreMultiplier = 1;
        showWisdomCard('Score multiplier back to 1x', '🌟');
      }, 10000);
    } else if (chosenPower === 'life') {
      if (state.lives < 3) {
        state.lives++;
        updateLivesHUD();
        showWisdomCard('❤️ Extra Life Restored!', '❤️');
        floatTexts.push(new FloatText('+1 Life!', player.x, player.y - 15, '#FF1744'));
      } else {
        addScore(150, player.x, player.y);
        showWisdomCard('🌟 Max Lives! +150 Bonus Points', '🌟');
      }
    }
  }

  function showWisdomCard(msg, icon = '✨') {
    wisdomTitle.textContent = msg;
    wisdomIcon.textContent = icon;
    wisdomCard.classList.add('visible');
    setTimeout(() => {
      wisdomCard.classList.remove('visible');
    }, 3200);
  }

  function addScore(pts, x, y) {
    const total = pts * state.scoreMultiplier;
    state.score += total;
    floatTexts.push(new FloatText(`+${total}`, x, y, total > 50 ? '#FFD54F' : '#FFF9C4'));
    updateScoreHUD();
  }

  // ==========================================================================
  // SACRED VISUAL SYMBOLS & IN-GAME PUZZLE ENGINE
  // ==========================================================================
  const SACRED_SYMBOLS = {
    'bell': {
      name: 'Temple Bell',
      shortName: 'Bell',
      emoji: '🔔',
      svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 4V12" stroke="#FFD54F" stroke-width="4" stroke-linecap="round"/>
        <path d="M20 18C20 10 44 10 44 18C44 28 52 38 54 44H10C12 38 20 28 20 18Z" fill="url(#bellGrad)" stroke="#FFA000" stroke-width="2"/>
        <ellipse cx="32" cy="44" rx="22" ry="5" fill="#FF8F00"/>
        <circle cx="32" cy="49" r="4.5" fill="#8D6E63"/>
        <defs>
          <linearGradient id="bellGrad" x1="10" y1="12" x2="54" y2="44" gradientUnits="userSpaceOnUse">
            <stop stop-color="#FFF59D"/><stop offset="0.5" stop-color="#FFB300"/><stop offset="1" stop-color="#FF6F00"/>
          </linearGradient>
        </defs>
      </svg>`
    },
    'flower': {
      name: 'Lotus Flower',
      shortName: 'Flower',
      emoji: '🌺',
      svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="9" fill="#FFD54F" stroke="#FF8F00" stroke-width="2"/>
        <path d="M32 4C37 16 37 23 32 23C27 23 27 16 32 4Z" fill="#FF4081"/>
        <path d="M32 60C37 48 37 41 32 41C27 41 27 48 32 60Z" fill="#FF4081"/>
        <path d="M4 32C16 37 23 37 23 32C23 27 16 27 4 32Z" fill="#FF4081"/>
        <path d="M60 32C48 37 41 37 41 32C41 27 48 27 60 32Z" fill="#FF4081"/>
        <path d="M12 12C22 21 27 25 25 27C23 29 19 24 12 12Z" fill="#E91E63"/>
        <path d="M52 52C42 43 37 39 39 37C41 35 45 40 52 52Z" fill="#E91E63"/>
        <path d="M12 52C21 42 25 37 27 39C29 41 24 45 12 52Z" fill="#E91E63"/>
        <path d="M52 12C43 22 39 27 41 25C43 23 40 19 52 12Z" fill="#E91E63"/>
      </svg>`
    },
    'diya': {
      name: 'Holy Diya',
      shortName: 'Diya',
      emoji: '🪔',
      svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="32" cy="44" rx="24" ry="10" fill="#8D6E63" stroke="#5D4037" stroke-width="2"/>
        <ellipse cx="32" cy="41" rx="19" ry="6" fill="#D7CCC8"/>
        <path d="M32 8C38 18 42 26 32 36C22 26 26 18 32 8Z" fill="url(#diyaFlame)"/>
        <ellipse cx="32" cy="24" rx="4.5" ry="7" fill="#FFF9C4"/>
        <defs>
          <linearGradient id="diyaFlame" x1="32" y1="8" x2="32" y2="36" gradientUnits="userSpaceOnUse">
            <stop stop-color="#FF3D00"/><stop offset="0.5" stop-color="#FF9800"/><stop offset="1" stop-color="#FFEB3B"/>
          </linearGradient>
        </defs>
      </svg>`
    },
    'modak': {
      name: 'Sweet Modak',
      shortName: 'Modak',
      emoji: '🍬',
      svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 6C36 17 54 36 50 49C46 58 18 58 14 49C10 36 28 17 32 6Z" fill="url(#modakGrad)" stroke="#FFA000" stroke-width="2"/>
        <path d="M32 10V54" stroke="#FFD54F" stroke-width="2" stroke-linecap="round"/>
        <path d="M23 20C26 32 26 44 20 52" stroke="#FFD54F" stroke-width="2" stroke-linecap="round"/>
        <path d="M41 20C38 32 38 44 44 52" stroke="#FFD54F" stroke-width="2" stroke-linecap="round"/>
        <defs>
          <linearGradient id="modakGrad" x1="14" y1="8" x2="50" y2="54" gradientUnits="userSpaceOnUse">
            <stop stop-color="#FFFDE7"/><stop offset="0.5" stop-color="#FFF59D"/><stop offset="1" stop-color="#FFB300"/>
          </linearGradient>
        </defs>
      </svg>`
    },
    'conch': {
      name: 'Shankha (Conch)',
      shortName: 'Conch',
      emoji: '🐚',
      svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 48C10 35 16 15 34 13C48 11 54 26 50 39C46 49 33 53 22 51L12 56L14 48Z" fill="#F3E5F5" stroke="#AB47BC" stroke-width="2"/>
        <path d="M26 19C33 19 41 24 39 34C37 43 28 45 22 43" stroke="#BA68C8" stroke-width="2"/>
        <path d="M28 25C33 25 37 28 35 34" stroke="#CE93D8" stroke-width="2"/>
      </svg>`
    },
    'energy': {
      name: 'Divine Star',
      shortName: 'Star',
      emoji: '⭐',
      svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 4L37 24L57 19L44 34L59 47L39 45L32 64L25 45L5 47L20 34L7 19L27 24L32 4Z" fill="url(#starGrad)" stroke="#FFD54F" stroke-width="1.5"/>
        <circle cx="32" cy="34" r="6" fill="#FFF"/>
        <defs>
          <linearGradient id="starGrad" x1="6" y1="4" x2="58" y2="64" gradientUnits="userSpaceOnUse">
            <stop stop-color="#FFF9C4"/><stop offset="0.5" stop-color="#FFB300"/><stop offset="1" stop-color="#FF6F00"/>
          </linearGradient>
        </defs>
      </svg>`
    },
    'temple': {
      name: 'Maha Mandir',
      shortName: 'Temple',
      emoji: '🛕',
      svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 4L46 25H18L32 4Z" fill="#FFB300" stroke="#FF8F00" stroke-width="2"/>
        <rect x="15" y="25" width="34" height="30" rx="2" fill="#4E342E" stroke="#FFB300" stroke-width="2"/>
        <path d="M25 55V37C25 34 39 34 39 37V55" fill="#211317" stroke="#FFD54F" stroke-width="2"/>
        <circle cx="32" cy="4" r="2.5" fill="#E91E63"/>
      </svg>`
    },
    'bilva': {
      name: 'Bilva Patra (Sacred Leaf)',
      shortName: 'Bilva',
      emoji: '🌿',
      svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 4 C24 16 26 28 32 34 C38 28 40 16 32 4 Z" fill="#4CAF50" stroke="#2E7D32" stroke-width="2"/>
        <path d="M16 20 C12 32 20 40 32 34 C26 25 22 18 16 20 Z" fill="#43A047" stroke="#2E7D32" stroke-width="2"/>
        <path d="M48 20 C52 32 44 40 32 34 C38 25 42 18 48 20 Z" fill="#43A047" stroke="#2E7D32" stroke-width="2"/>
        <path d="M32 34 L32 58" stroke="#795548" stroke-width="4" stroke-linecap="round"/>
      </svg>`
    },
    'missing': {
      name: 'What Next?',
      shortName: '?',
      emoji: '❓',
      svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="26" fill="rgba(0, 229, 255, 0.18)" stroke="#00E5FF" stroke-width="2.5" stroke-dasharray="5 3"/>
        <path d="M26 21C26 14 38 14 38 22C38 28 32 29 32 36" stroke="#00E5FF" stroke-width="4.5" stroke-linecap="round"/>
        <circle cx="32" cy="46" r="3" fill="#00E5FF"/>
      </svg>`
    }
  };

  function openLevelPuzzle(levelNum) {
    state.isPaused = true;
    showScreen(puzzleModal);

    const realmTag = document.getElementById('puzzle-realm-tag');
    const pTitle = document.getElementById('puzzle-title');
    const pInstruction = document.getElementById('puzzle-instruction');
    const pContent = document.getElementById('puzzle-content');
    const pStatus = document.getElementById('puzzle-status');

    pContent.innerHTML = '';
    pStatus.textContent = '';

    if (levelNum === 1) {
      // ======================================================================
      // LEVEL 1: SACRED OFFERING OF BEGINNINGS (Toughness ⭐: 1/5 - Welcoming Joy)
      // ======================================================================
      realmTag.textContent = 'Level 1 • Sacred Forest Shrine';
      pTitle.textContent = 'Sacred Offering of Beginnings';
      pInstruction.innerHTML = 'The Forest Shrine has awakened! Offer Lord Ganesha his most beloved sacred sweet to receive his blessing and open the forest realm:';

      // Visual Central Altar Slot
      const altarContainer = document.createElement('div');
      altarContainer.className = 'pedestal-container';

      const altarSlot = document.createElement('div');
      altarSlot.className = 'pedestal-slot';
      altarSlot.id = 'l1-altar-slot';
      altarSlot.innerHTML = `
        <div class="pic-icon" style="width:42px; height:42px;">${SACRED_SYMBOLS['missing'].svg}</div>
        <div class="pedestal-title">Sacred Prasad</div>
      `;
      altarContainer.appendChild(altarSlot);
      pContent.appendChild(altarContainer);

      const promptText = document.createElement('div');
      promptText.style.fontSize = '14px';
      promptText.style.fontWeight = '700';
      promptText.style.color = '#FFE082';
      promptText.style.margin = '4px 0 10px 0';
      promptText.innerHTML = '🍬 <em>“Which divine sweet does Lord Ganesha carry in his trunk with supreme joy?”</em>';
      pContent.appendChild(promptText);

      const choiceContainer = document.createElement('div');
      choiceContainer.className = 'puzzle-choices';

      const choices = ['modak', 'diya', 'bell', 'conch'];
      choices.forEach(key => {
        const item = SACRED_SYMBOLS[key];
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.innerHTML = `
          <div class="pic-icon">${item.svg}</div>
          <div class="pic-label">${item.name}</div>
        `;

        btn.addEventListener('click', () => {
          if (key === 'modak') {
            altarSlot.classList.add('filled');
            altarSlot.innerHTML = `
              <div class="pic-icon" style="width:42px; height:42px;">${item.svg}</div>
              <div class="pedestal-title" style="color:#00E5FF;">Sacred Modak</div>
            `;
            if (window.soundEngine) window.soundEngine.playDoorOpen();
            onPuzzleSolved('✨ Ganapati Bappa Morya! Sacred Modak Offered! Ganesha blesses the forest! ✨');
          } else {
            btn.classList.add('shake-anim');
            setTimeout(() => btn.classList.remove('shake-anim'), 400);
            if (window.soundEngine) window.soundEngine.playPuzzleWrong();
            pStatus.textContent = '💡 While auspicious, Lord Ganesha’s foremost favorite sweet is the Modak! Try the Modak.';
          }
        });
        choiceContainer.appendChild(btn);
      });
      pContent.appendChild(choiceContainer);

    } else if (levelNum === 2) {
      // ======================================================================
      // LEVEL 2: THE 4-STEP AARTI SEQUENCE (Toughness ⭐⭐: 2/5 - Rhythm & Sequence)
      // ======================================================================
      realmTag.textContent = 'Level 2 • Festival City Gateway';
      pTitle.textContent = 'The 4-Step Aarti Sequence';
      pInstruction.innerHTML = 'In the Festival City, priests perform the morning Aarti in a sacred 4-step sequence. Identify the missing offering to illuminate the city gates:';

      const seqContainer = document.createElement('div');
      seqContainer.className = 'puzzle-sequence';

      const seqKeys = ['bell', 'flower', 'diya', 'missing'];
      seqKeys.forEach((key, idx) => {
        const item = SACRED_SYMBOLS[key];
        const box = document.createElement('div');
        box.className = 'symbol-box' + (key === 'missing' ? ' missing' : '');
        box.id = `l2-seq-box-${idx}`;
        box.innerHTML = `
          <div class="pic-icon">${item.svg}</div>
          <div class="pic-label">${item.shortName}</div>
        `;
        seqContainer.appendChild(box);

        if (idx < seqKeys.length - 1) {
          const arrow = document.createElement('span');
          arrow.className = 'seq-arrow';
          arrow.textContent = '➔';
          seqContainer.appendChild(arrow);
        }
      });
      pContent.appendChild(seqContainer);

      const promptText = document.createElement('div');
      promptText.style.fontSize = '13px';
      promptText.style.color = '#FFE082';
      promptText.style.margin = '4px 0 10px 0';
      promptText.innerHTML = '🪔 <em>“1. Ring Bell 🔔 ➔ 2. Offer Lotus 🌺 ➔ 3. Light Diya 🪔 ➔ 4. ? What completes the Aarti?”</em>';
      pContent.appendChild(promptText);

      const choiceContainer = document.createElement('div');
      choiceContainer.className = 'puzzle-choices';

      const choices = ['conch', 'modak', 'energy', 'temple'];
      choices.forEach(key => {
        const item = SACRED_SYMBOLS[key];
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.innerHTML = `
          <div class="pic-icon">${item.svg}</div>
          <div class="pic-label">${item.name}</div>
        `;

        btn.addEventListener('click', () => {
          if (key === 'modak') {
            const missingBox = document.getElementById('l2-seq-box-3');
            if (missingBox) {
              missingBox.className = 'symbol-box';
              missingBox.innerHTML = `
                <div class="pic-icon">${item.svg}</div>
                <div class="pic-label">${item.shortName}</div>
              `;
            }
            if (window.soundEngine) window.soundEngine.playDoorOpen();
            onPuzzleSolved('✨ Aarti Complete! The Festival City Gates Open With Joy and Light! 🪔✨');
          } else {
            btn.classList.add('shake-anim');
            setTimeout(() => btn.classList.remove('shake-anim'), 400);
            if (window.soundEngine) window.soundEngine.playPuzzleWrong();
            pStatus.textContent = '💡 Ritual incomplete! After the sacred flame, offer Ganesha’s sweet Modak to complete the Aarti.';
          }
        });
        choiceContainer.appendChild(btn);
      });
      pContent.appendChild(choiceContainer);

    } else if (levelNum === 3) {
      // ======================================================================
      // LEVEL 3: DUAL-SACRED SANCTUM CIPHER (Toughness ⭐⭐⭐: 3/5 - Dual Riddle & Logic)
      // ======================================================================
      realmTag.textContent = 'Level 3 • Ancient Temple Sanctum';
      pTitle.textContent = 'Dual-Sacred Sanctum Cipher';
      pInstruction.innerHTML = 'The stone sanctum door is sealed with two ancient elemental locks. Read the stone verse and tap <strong>BOTH</strong> sacred offerings:';

      const promptText = document.createElement('div');
      promptText.style.fontSize = '13px';
      promptText.style.color = '#FFE082';
      promptText.style.background = 'rgba(0,0,0,0.3)';
      promptText.style.padding = '8px 12px';
      promptText.style.borderRadius = '10px';
      promptText.style.margin = '4px 0 10px 0';
      promptText.innerHTML = '📜 <em>“One offering must dispel all darkness with radiant flame (🪔), and the second must echo the cosmic breath of victory (🐚)!”</em>';
      pContent.appendChild(promptText);

      // Two Pedestal Slots
      const pedestalContainer = document.createElement('div');
      pedestalContainer.className = 'pedestal-container';

      const pSlot1 = document.createElement('div');
      pSlot1.className = 'pedestal-slot';
      pSlot1.id = 'l3-slot-flame';
      pSlot1.innerHTML = `
        <div class="pic-icon" style="width:40px; height:40px;">${SACRED_SYMBOLS['missing'].svg}</div>
        <div class="pedestal-title">1. Sacred Flame</div>
      `;

      const pSlot2 = document.createElement('div');
      pSlot2.className = 'pedestal-slot';
      pSlot2.id = 'l3-slot-sound';
      pSlot2.innerHTML = `
        <div class="pic-icon" style="width:40px; height:40px;">${SACRED_SYMBOLS['missing'].svg}</div>
        <div class="pedestal-title">2. Cosmic Sound</div>
      `;

      pedestalContainer.appendChild(pSlot1);
      pedestalContainer.appendChild(pSlot2);
      pContent.appendChild(pedestalContainer);

      const placed = { diya: false, conch: false };

      const choiceContainer = document.createElement('div');
      choiceContainer.className = 'puzzle-choices';

      const candidates = ['diya', 'conch', 'flower', 'modak', 'bell', 'energy'];
      candidates.forEach(key => {
        const item = SACRED_SYMBOLS[key];
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.id = `l3-btn-${key}`;
        btn.innerHTML = `
          <div class="pic-icon">${item.svg}</div>
          <div class="pic-label">${item.name}</div>
        `;

        btn.addEventListener('click', () => {
          if (key === 'diya' && !placed.diya) {
            placed.diya = true;
            pSlot1.classList.add('filled');
            pSlot1.innerHTML = `
              <div class="pic-icon" style="width:40px; height:40px;">${item.svg}</div>
              <div class="pedestal-title" style="color:#00E5FF;">Holy Diya Placed!</div>
            `;
            btn.style.opacity = '0.4';
            btn.style.pointerEvents = 'none';
            if (window.soundEngine) window.soundEngine.playBell();

            if (placed.conch) {
              if (window.soundEngine) window.soundEngine.playDoorOpen();
              onPuzzleSolved('✨ Sanctum Unlocked! Sacred Flame and Cosmic Horn Awaken the Temple Gate! 🛕✨');
            } else {
              pStatus.textContent = '🌟 Holy Diya placed! Now select the sacred offering of cosmic victory!';
            }
          } else if (key === 'conch' && !placed.conch) {
            placed.conch = true;
            pSlot2.classList.add('filled');
            pSlot2.innerHTML = `
              <div class="pic-icon" style="width:40px; height:40px;">${item.svg}</div>
              <div class="pedestal-title" style="color:#00E5FF;">Conch Placed!</div>
            `;
            btn.style.opacity = '0.4';
            btn.style.pointerEvents = 'none';
            if (window.soundEngine) window.soundEngine.playBell();

            if (placed.diya) {
              if (window.soundEngine) window.soundEngine.playDoorOpen();
              onPuzzleSolved('✨ Sanctum Unlocked! Sacred Flame and Cosmic Horn Awaken the Temple Gate! 🛕✨');
            } else {
              pStatus.textContent = '🌟 Sacred Conch placed! Now select the sacred offering that dispels darkness!';
            }
          } else {
            btn.classList.add('shake-anim');
            setTimeout(() => btn.classList.remove('shake-anim'), 400);
            if (window.soundEngine) window.soundEngine.playPuzzleWrong();
            pStatus.textContent = '💡 That offering is sacred, but does not fit the riddle! Find the radiant flame (🪔) and the cosmic horn (🐚).';
          }
        });
        choiceContainer.appendChild(btn);
      });
      pContent.appendChild(choiceContainer);

    } else if (levelNum === 4) {
      // ======================================================================
      // LEVEL 4: TRI-SHAKTI CELESTIAL RUNE SEQUENCE (Toughness ⭐⭐⭐⭐: 4/5 - Strict Order)
      // ======================================================================
      realmTag.textContent = 'Level 4 • Divine Challenge Realm';
      pTitle.textContent = 'Tri-Shakti Wisdom Rune Cipher';
      pInstruction.innerHTML = 'Channel Lord Ganesha’s 3 Divine Powers in the exact Sanskrit order to break the cosmic seal:';

      const promptText = document.createElement('div');
      promptText.style.fontSize = '13px';
      promptText.style.color = '#FFE082';
      promptText.style.margin = '4px 0 8px 0';
      promptText.innerHTML = '⚡ <strong>1️⃣ Vighnaharta (Breaker) ➔ 2️⃣ Shanti (Freeze) ➔ 3️⃣ Raksha (Shield)</strong>';
      pContent.appendChild(promptText);

      const stepIndicator = document.createElement('div');
      stepIndicator.className = 'rune-step-indicator';
      stepIndicator.id = 'l4-step-badge';
      stepIndicator.textContent = '👉 Step 1 of 3: Tap 🧠 Vighnaharta (Breaker)';
      pContent.appendChild(stepIndicator);

      const runesContainer = document.createElement('div');
      runesContainer.className = 'puzzle-choices';

      const runes = [
        { key: 'energy', stepIndex: 0, name: '🧠 Breaker', subtitle: 'Vighnaharta' },
        { key: 'bell', stepIndex: 1, name: '⚡ Freeze', subtitle: 'Shanti' },
        { key: 'modak', stepIndex: 2, name: '🛡️ Shield', subtitle: 'Raksha' },
        { key: 'temple', stepIndex: -1, name: '⭐ Star', subtitle: 'Tejas' }
      ];

      // Shuffle buttons so order requires reading and thought
      const shuffled = [...runes].sort(() => Math.random() - 0.5);

      let currentStep = 0;
      const stepNames = [
        '👉 Step 1 of 3: Tap 🧠 Vighnaharta (Breaker)',
        '👉 Step 2 of 3: Now tap ⚡ Shanti (Freeze)',
        '👉 Step 3 of 3: Now tap 🛡️ Raksha (Shield)'
      ];

      shuffled.forEach((r, idx) => {
        const item = SACRED_SYMBOLS[r.key];
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.id = `l4-rune-${idx}`;
        btn.style.width = '105px';
        btn.style.height = '112px';
        btn.innerHTML = `
          <div class="pic-icon">${item.svg}</div>
          <div class="pic-label">${r.name}<br><span style="font-size:9px; color:#FFE082; text-transform:none;">${r.subtitle}</span></div>
        `;

        btn.addEventListener('click', () => {
          if (r.stepIndex === currentStep) {
            // Correct step!
            btn.classList.add('rune-active');
            btn.style.borderColor = '#00E5FF';
            btn.style.background = 'linear-gradient(180deg, rgba(0, 229, 255, 0.45) 0%, rgba(38, 5, 14, 0.9) 100%)';
            btn.style.boxShadow = '0 0 18px #00E5FF';
            btn.style.transform = 'scale(1.06)';
            btn.style.pointerEvents = 'none';

            if (window.soundEngine) window.soundEngine.playBell();
            currentStep++;

            if (currentStep === 3) {
              stepIndicator.textContent = '✨ TRI-SHAKTI ACTIVATED! ✨';
              stepIndicator.style.background = 'rgba(0, 229, 255, 0.4)';
              if (window.soundEngine) window.soundEngine.playPower();
              onPuzzleSolved('✨ Tri-Shakti Channelled! Cosmic Barrier Shattered — Path to Maha Mandir Open! 🛕✨');
            } else {
              stepIndicator.textContent = stepNames[currentStep];
              pStatus.textContent = `Awakened step ${currentStep} of 3! Next: ${stepNames[currentStep]}`;
            }
          } else {
            // Wrong step or tapped out of order!
            btn.classList.add('shake-anim');
            setTimeout(() => btn.classList.remove('shake-anim'), 400);
            if (window.soundEngine) window.soundEngine.playPuzzleWrong();

            // Reset sequence
            currentStep = 0;
            stepIndicator.textContent = stepNames[0];
            pStatus.textContent = '⚠️ The celestial flow wavered! Follow the divine order: 1️⃣ Breaker ➔ 2️⃣ Freeze ➔ 3️⃣ Shield!';

            // Reset all rune buttons
            document.querySelectorAll('#puzzle-content .choice-btn').forEach(b => {
              b.classList.remove('rune-active');
              b.style.borderColor = '#FFB300';
              b.style.background = '';
              b.style.boxShadow = '';
              b.style.transform = '';
              b.style.pointerEvents = 'auto';
            });
          }
        });
        runesContainer.appendChild(btn);
      });
      pContent.appendChild(runesContainer);

    } else if (levelNum === 5) {
      // ======================================================================
      // LEVEL 5: THE GRAND MAHA MANDIR CONSECRATION (Toughness ⭐⭐⭐⭐⭐: 5/5 - Grand Finale)
      // ======================================================================
      realmTag.textContent = 'Final Level • Grand Maha Mandir Sanctum';
      pTitle.textContent = 'The Grand Maha Mandir Consecration';
      pInstruction.innerHTML = 'Lord Ganesha has arrived at the Grand Altar! Consecrate all 4 Sacred Pillars to ignite the Final Aarti and restore 100% Festival Energy:';

      const promptText = document.createElement('div');
      promptText.style.fontSize = '14px';
      promptText.style.fontWeight = '700';
      promptText.style.color = '#FFE082';
      promptText.style.margin = '4px 0 10px 0';
      promptText.innerHTML = '🛕 <em>“Consecrate each sacred offering to ignite the Great Aarti and bring the festival back!”</em>';
      pContent.appendChild(promptText);

      // 4 Altar Pedestal Slots
      const altarContainer = document.createElement('div');
      altarContainer.className = 'altar-grid';

      const pillars = [
        { key: 'bell', title: '1. Cosmic Bell' },
        { key: 'flower', title: '2. Pure Lotus' },
        { key: 'diya', title: '3. Holy Diya' },
        { key: 'modak', title: '4. Royal Modak' }
      ];

      const altarSlots = {};
      pillars.forEach(p => {
        const slot = document.createElement('div');
        slot.className = 'pedestal-slot';
        slot.id = `l5-slot-${p.key}`;
        slot.innerHTML = `
          <div class="pic-icon" style="width:36px; height:36px;">${SACRED_SYMBOLS['missing'].svg}</div>
          <div class="pedestal-title">${p.title}</div>
        `;
        altarSlots[p.key] = slot;
        altarContainer.appendChild(slot);
      });
      pContent.appendChild(altarContainer);

      let consecratedCount = 0;
      const consecrated = { bell: false, flower: false, diya: false, modak: false };

      const choiceContainer = document.createElement('div');
      choiceContainer.className = 'puzzle-choices';

      const choices = ['bell', 'flower', 'diya', 'modak'];
      // Randomize choice order
      const shuffledChoices = [...choices].sort(() => Math.random() - 0.5);

      shuffledChoices.forEach(key => {
        const item = SACRED_SYMBOLS[key];
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.id = `l5-btn-${key}`;
        btn.innerHTML = `
          <div class="pic-icon">${item.svg}</div>
          <div class="pic-label">${item.name}</div>
        `;

        btn.addEventListener('click', () => {
          if (!consecrated[key]) {
            consecrated[key] = true;
            consecratedCount++;

            const targetSlot = altarSlots[key];
            if (targetSlot) {
              targetSlot.classList.add('filled');
              targetSlot.innerHTML = `
                <div class="pic-icon" style="width:36px; height:36px;">${item.svg}</div>
                <div class="pedestal-title" style="color:#00E5FF;">Consecrated!</div>
              `;
            }

            btn.style.opacity = '0.4';
            btn.style.pointerEvents = 'none';

            if (window.soundEngine) window.soundEngine.playBell();

            if (consecratedCount === 4) {
              state.restorationProgress = 100;
              saveScoreData();
              if (window.soundEngine) window.soundEngine.playFinalCelebration();
              onPuzzleSolved('🎉 ALL 4 SACRED PILLARS CONSECRATED! THE GRAND AARTI BEGINS! 🎉');
            } else {
              pStatus.textContent = `Consecrated ${consecratedCount} of 4 Sacred Pillars! Offer the remaining elements.`;
            }
          }
        });
        choiceContainer.appendChild(btn);
      });
      pContent.appendChild(choiceContainer);

    } else if (levelNum === 6) {
      // ======================================================================
      // LEVEL 6: KAILASH SACRED BILVA & LOTUS OFFERING (Toughness ⭐⭐⭐)
      // ======================================================================
      realmTag.textContent = 'Level 6 • Kailash Foothills';
      pTitle.textContent = 'Kailash Sacred Bilva & Lotus Consecration';
      pInstruction.innerHTML = 'At the foot of Mount Kailash, Lord Shiva’s sacred shrine requires the twin offerings of devotion. Read the stone verse and tap <strong>BOTH</strong> offerings:';

      const promptText = document.createElement('div');
      promptText.style.fontSize = '13px';
      promptText.style.color = '#FFE082';
      promptText.style.background = 'rgba(0,0,0,0.3)';
      promptText.style.padding = '8px 12px';
      promptText.style.borderRadius = '10px';
      promptText.style.margin = '4px 0 10px 0';
      promptText.innerHTML = '🏔️ <em>“Offer the holy three-leaf Bilva Patra (🌿) cherished by Lord Shiva, and the pure Himalayan snow lotus (🌺)!”</em>';
      pContent.appendChild(promptText);

      const pedestalContainer = document.createElement('div');
      pedestalContainer.className = 'pedestal-container';

      const pSlot1 = document.createElement('div');
      pSlot1.className = 'pedestal-slot';
      pSlot1.id = 'l6-slot-bilva';
      pSlot1.innerHTML = `
        <div class="pic-icon" style="width:40px; height:40px;">${SACRED_SYMBOLS['missing'].svg}</div>
        <div class="pedestal-title">1. Bilva Patra</div>
      `;

      const pSlot2 = document.createElement('div');
      pSlot2.className = 'pedestal-slot';
      pSlot2.id = 'l6-slot-lotus';
      pSlot2.innerHTML = `
        <div class="pic-icon" style="width:40px; height:40px;">${SACRED_SYMBOLS['missing'].svg}</div>
        <div class="pedestal-title">2. Snow Lotus</div>
      `;

      pedestalContainer.appendChild(pSlot1);
      pedestalContainer.appendChild(pSlot2);
      pContent.appendChild(pedestalContainer);

      const placed = { bilva: false, flower: false };
      const choiceContainer = document.createElement('div');
      choiceContainer.className = 'puzzle-choices';

      const candidates = ['bilva', 'flower', 'modak', 'diya', 'bell', 'conch'];
      candidates.forEach(key => {
        const item = SACRED_SYMBOLS[key];
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.innerHTML = `
          <div class="pic-icon">${item.svg}</div>
          <div class="pic-label">${item.name}</div>
        `;

        btn.addEventListener('click', () => {
          if (key === 'bilva' && !placed.bilva) {
            placed.bilva = true;
            pSlot1.classList.add('filled');
            pSlot1.innerHTML = `
              <div class="pic-icon" style="width:40px; height:40px;">${item.svg}</div>
              <div class="pedestal-title" style="color:#00E5FF;">Bilva Offered!</div>
            `;
            btn.style.opacity = '0.4';
            btn.style.pointerEvents = 'none';
            if (window.soundEngine) window.soundEngine.playBell();

            if (placed.flower) {
              if (window.soundEngine) window.soundEngine.playDoorOpen();
              onPuzzleSolved('✨ Kailash Shrine Awakened! Lord Shiva’s blessing shines upon Ganesha! 🏔️✨');
            } else {
              pStatus.textContent = '🌿 Bilva leaf offered! Now place the sacred Himalayan Lotus.';
            }
          } else if (key === 'flower' && !placed.flower) {
            placed.flower = true;
            pSlot2.classList.add('filled');
            pSlot2.innerHTML = `
              <div class="pic-icon" style="width:40px; height:40px;">${item.svg}</div>
              <div class="pedestal-title" style="color:#00E5FF;">Lotus Offered!</div>
            `;
            btn.style.opacity = '0.4';
            btn.style.pointerEvents = 'none';
            if (window.soundEngine) window.soundEngine.playBell();

            if (placed.bilva) {
              if (window.soundEngine) window.soundEngine.playDoorOpen();
              onPuzzleSolved('✨ Kailash Shrine Awakened! Lord Shiva’s blessing shines upon Ganesha! 🏔️✨');
            } else {
              pStatus.textContent = '🌺 Snow Lotus placed! Now offer the sacred Bilva leaf.';
            }
          } else {
            btn.classList.add('shake-anim');
            setTimeout(() => btn.classList.remove('shake-anim'), 400);
            if (window.soundEngine) window.soundEngine.playPuzzleWrong();
            pStatus.textContent = '💡 Kailash calls for the Bilva leaf (🌿) and the Lotus flower (🌺)!';
          }
        });
        choiceContainer.appendChild(btn);
      });
      pContent.appendChild(choiceContainer);

    } else if (levelNum === 7) {
      // ======================================================================
      // LEVEL 7: TRIVENI SANGAM AARTI SEQUENCE (Toughness ⭐⭐⭐⭐)
      // ======================================================================
      realmTag.textContent = 'Level 7 • Celestial River Ganga';
      pTitle.textContent = 'Triveni Sangam Aarti Ritual Sequence';
      pInstruction.innerHTML = 'Along the holy waters of the Ganga, the evening Aarti follows the cosmic 4-step rhythm. Identify what sacred offering completes the river ceremony:';

      const seqContainer = document.createElement('div');
      seqContainer.className = 'puzzle-sequence';

      const seqKeys = ['conch', 'diya', 'flower', 'missing'];
      seqKeys.forEach((key, idx) => {
        const item = SACRED_SYMBOLS[key];
        const box = document.createElement('div');
        box.className = 'symbol-box' + (key === 'missing' ? ' missing' : '');
        box.id = `l7-seq-box-${idx}`;
        box.innerHTML = `
          <div class="pic-icon">${item.svg}</div>
          <div class="pic-label">${item.shortName}</div>
        `;
        seqContainer.appendChild(box);

        if (idx < seqKeys.length - 1) {
          const arrow = document.createElement('span');
          arrow.className = 'seq-arrow';
          arrow.textContent = '➔';
          seqContainer.appendChild(arrow);
        }
      });
      pContent.appendChild(seqContainer);

      const promptText = document.createElement('div');
      promptText.style.fontSize = '13px';
      promptText.style.color = '#FFE082';
      promptText.style.margin = '4px 0 10px 0';
      promptText.innerHTML = '🌊 <em>“1. Sound Conch 🐚 ➔ 2. Wave Deepa 🪔 ➔ 3. Float Lotus 🌺 ➔ 4. ? What Prasad crowns the Aarti?”</em>';
      pContent.appendChild(promptText);

      const choiceContainer = document.createElement('div');
      choiceContainer.className = 'puzzle-choices';

      const choices = ['modak', 'bell', 'bilva', 'temple'];
      choices.forEach(key => {
        const item = SACRED_SYMBOLS[key];
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.innerHTML = `
          <div class="pic-icon">${item.svg}</div>
          <div class="pic-label">${item.name}</div>
        `;

        btn.addEventListener('click', () => {
          if (key === 'modak') {
            const missingBox = document.getElementById('l7-seq-box-3');
            if (missingBox) {
              missingBox.className = 'symbol-box';
              missingBox.innerHTML = `
                <div class="pic-icon">${item.svg}</div>
                <div class="pic-label">${item.shortName}</div>
              `;
            }
            if (window.soundEngine) window.soundEngine.playDoorOpen();
            onPuzzleSolved('✨ Ganga Aarti Complete! Sacred waters illuminate with divine festival radiance! 🌊✨');
          } else {
            btn.classList.add('shake-anim');
            setTimeout(() => btn.classList.remove('shake-anim'), 400);
            if (window.soundEngine) window.soundEngine.playPuzzleWrong();
            pStatus.textContent = '💡 Ganga Aarti concludes with the Prasad of joy — Lord Ganesha’s Modak!';
          }
        });
        choiceContainer.appendChild(btn);
      });
      pContent.appendChild(choiceContainer);

    } else if (levelNum === 8) {
      // ======================================================================
      // LEVEL 8: SURYA TRI-KALA RADIANCE ALIGNMENT (Toughness ⭐⭐⭐⭐)
      // ======================================================================
      realmTag.textContent = 'Level 8 • Surya Mandir';
      pTitle.textContent = 'Surya Tri-Kala Solar Radiance Alignment';
      pInstruction.innerHTML = 'Align the 3 phases of the Sun God (Pratah, Madhyahna, Sandhya) by consecrating the three solar elements in order:';

      const promptText = document.createElement('div');
      promptText.style.fontSize = '13px';
      promptText.style.color = '#FFE082';
      promptText.style.margin = '4px 0 8px 0';
      promptText.innerHTML = '☀️ <strong>1️⃣ Holy Diya (Dawn Flame) ➔ 2️⃣ Divine Star (Zenith Radiance) ➔ 3️⃣ Sweet Modak (Dusk Prasad)</strong>';
      pContent.appendChild(promptText);

      const stepIndicator = document.createElement('div');
      stepIndicator.className = 'rune-step-indicator';
      stepIndicator.id = 'l8-step-badge';
      stepIndicator.textContent = '👉 Step 1 of 3: Tap 🪔 Holy Diya';
      pContent.appendChild(stepIndicator);

      const runesContainer = document.createElement('div');
      runesContainer.className = 'puzzle-choices';

      const solarOrder = ['diya', 'energy', 'modak'];
      let currentStep = 0;

      const candidates = ['diya', 'energy', 'modak', 'bell', 'flower', 'bilva'];
      candidates.forEach(key => {
        const item = SACRED_SYMBOLS[key];
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.innerHTML = `
          <div class="pic-icon">${item.svg}</div>
          <div class="pic-label">${item.name}</div>
        `;

        btn.addEventListener('click', () => {
          if (key === solarOrder[currentStep]) {
            currentStep++;
            btn.style.opacity = '0.4';
            btn.style.pointerEvents = 'none';
            if (window.soundEngine) window.soundEngine.playBell();

            if (currentStep === 1) {
              stepIndicator.textContent = '👉 Step 2 of 3: Tap ⭐ Divine Star (Zenith)';
              pStatus.textContent = '☀️ Dawn flame aligned! Now channel the Zenith Solar Star.';
            } else if (currentStep === 2) {
              stepIndicator.textContent = '👉 Step 3 of 3: Tap 🍬 Sweet Modak (Dusk Prasad)';
              pStatus.textContent = '☀️ Zenith Star aligned! Now offer the Dusk Prasad.';
            } else if (currentStep === 3) {
              stepIndicator.textContent = '✅ Solar Mandir Fully Aligned!';
              if (window.soundEngine) window.soundEngine.playDoorOpen();
              onPuzzleSolved('✨ Surya Mandir Aligned! Golden solar brilliance floods the cosmos! ☀️✨');
            }
          } else {
            btn.classList.add('shake-anim');
            setTimeout(() => btn.classList.remove('shake-anim'), 400);
            if (window.soundEngine) window.soundEngine.playPuzzleWrong();
            pStatus.textContent = '💡 Solar sequence disrupted! Follow the 3 phases: Diya ➔ Star ➔ Modak.';
          }
        });
        runesContainer.appendChild(btn);
      });
      pContent.appendChild(runesContainer);

    } else if (levelNum === 9) {
      // ======================================================================
      // LEVEL 9: CHATUR-DEVA ELEMENTAL HARMONY CIPHER (Toughness ⭐⭐⭐⭐⭐)
      // ======================================================================
      realmTag.textContent = 'Level 9 • Indra’s Amaravati';
      pTitle.textContent = 'Chatur-Deva Elemental Harmony Cipher';
      pInstruction.innerHTML = 'Consecrate the 4 Divine Elements to open the Heavenly Deva Sabha Gate:';

      const altarContainer = document.createElement('div');
      altarContainer.className = 'pedestal-container';

      const devas = [
        { key: 'diya', label: '1. Agni (Flame)', icon: SACRED_SYMBOLS['diya'] },
        { key: 'bell', label: '2. Vayu (Sound)', icon: SACRED_SYMBOLS['bell'] },
        { key: 'conch', label: '3. Varuna (Waters)', icon: SACRED_SYMBOLS['conch'] },
        { key: 'energy', label: '4. Indra (Thunder Star)', icon: SACRED_SYMBOLS['energy'] }
      ];

      const altarSlots = {};
      devas.forEach(d => {
        const slot = document.createElement('div');
        slot.className = 'pedestal-slot';
        slot.id = `l9-slot-${d.key}`;
        slot.innerHTML = `
          <div class="pic-icon" style="width:36px; height:36px;">${SACRED_SYMBOLS['missing'].svg}</div>
          <div class="pedestal-title">${d.label}</div>
        `;
        altarContainer.appendChild(slot);
        altarSlots[d.key] = slot;
      });
      pContent.appendChild(altarContainer);

      let consecratedDevas = 0;
      const placedDevas = {};

      const choiceContainer = document.createElement('div');
      choiceContainer.className = 'puzzle-choices';

      const choiceKeys = ['diya', 'bell', 'conch', 'energy', 'flower', 'bilva'];
      choiceKeys.forEach(key => {
        const item = SACRED_SYMBOLS[key];
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.innerHTML = `
          <div class="pic-icon">${item.svg}</div>
          <div class="pic-label">${item.name}</div>
        `;

        btn.addEventListener('click', () => {
          if (altarSlots[key] && !placedDevas[key]) {
            placedDevas[key] = true;
            consecratedDevas++;
            altarSlots[key].classList.add('filled');
            altarSlots[key].innerHTML = `
              <div class="pic-icon" style="width:36px; height:36px;">${item.svg}</div>
              <div class="pedestal-title" style="color:#00E5FF;">Harmonized!</div>
            `;
            btn.style.opacity = '0.4';
            btn.style.pointerEvents = 'none';
            if (window.soundEngine) window.soundEngine.playBell();

            if (consecratedDevas === 4) {
              if (window.soundEngine) window.soundEngine.playDoorOpen();
              onPuzzleSolved('✨ Amaravati Deva Sabha Gate Unlocked! The Devas shower celestial blossoms! 🌈✨');
            } else {
              pStatus.textContent = `Harmonized ${consecratedDevas} of 4 Elements! Select remaining deva offerings.`;
            }
          } else if (!altarSlots[key]) {
            btn.classList.add('shake-anim');
            setTimeout(() => btn.classList.remove('shake-anim'), 400);
            if (window.soundEngine) window.soundEngine.playPuzzleWrong();
            pStatus.textContent = '💡 Consecrate the 4 Deva elements: Flame (🪔), Sound (🔔), Conch (🐚), and Star (⭐)!';
          }
        });
        choiceContainer.appendChild(btn);
      });
      pContent.appendChild(choiceContainer);

    } else if (levelNum === 10) {
      // ======================================================================
      // FINAL LEVEL 10: MAHA VISHWAROOPA SUPREME CONSECRATION (MAX Toughness ⭐⭐⭐⭐⭐)
      // ======================================================================
      realmTag.textContent = 'Final Level 10 • Ananta Cosmic Sanctum';
      pTitle.textContent = 'Maha Vishwaroopa Supreme Consecration';
      pInstruction.innerHTML = 'Consecrate all 5 Supreme Sacred Offerings onto the Cosmic Altar to restore the Festival across the entire Universe:';

      const altarContainer = document.createElement('div');
      altarContainer.className = 'pedestal-container';

      const supremeOfferings = [
        { key: 'modak', label: 'Amrita Modak', icon: SACRED_SYMBOLS['modak'] },
        { key: 'diya', label: 'Akhanda Diya', icon: SACRED_SYMBOLS['diya'] },
        { key: 'flower', label: 'Brahma Lotus', icon: SACRED_SYMBOLS['flower'] },
        { key: 'bilva', label: 'Shiva Bilva', icon: SACRED_SYMBOLS['bilva'] },
        { key: 'conch', label: 'Vishnu Shankha', icon: SACRED_SYMBOLS['conch'] }
      ];

      const altarSlots = {};
      supremeOfferings.forEach(s => {
        const slot = document.createElement('div');
        slot.className = 'pedestal-slot';
        slot.id = `l10-slot-${s.key}`;
        slot.innerHTML = `
          <div class="pic-icon" style="width:36px; height:36px;">${SACRED_SYMBOLS['missing'].svg}</div>
          <div class="pedestal-title">${s.label}</div>
        `;
        altarContainer.appendChild(slot);
        altarSlots[s.key] = slot;
      });
      pContent.appendChild(altarContainer);

      let cosmicConsecrated = 0;
      const placedCosmic = {};

      const choiceContainer = document.createElement('div');
      choiceContainer.className = 'puzzle-choices';

      const choices = ['modak', 'diya', 'flower', 'bilva', 'conch'];
      // Shuffle choices slightly
      choices.forEach(key => {
        const item = SACRED_SYMBOLS[key];
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.innerHTML = `
          <div class="pic-icon">${item.svg}</div>
          <div class="pic-label">${item.name}</div>
        `;

        btn.addEventListener('click', () => {
          if (!placedCosmic[key]) {
            placedCosmic[key] = true;
            cosmicConsecrated++;
            altarSlots[key].classList.add('filled');
            altarSlots[key].innerHTML = `
              <div class="pic-icon" style="width:36px; height:36px;">${item.svg}</div>
              <div class="pedestal-title" style="color:#00E5FF;">Consecrated!</div>
            `;
            btn.style.opacity = '0.4';
            btn.style.pointerEvents = 'none';

            if (window.soundEngine) window.soundEngine.playBell();

            if (cosmicConsecrated === 5) {
              state.restorationProgress = 100;
              saveScoreData();
              if (window.soundEngine) window.soundEngine.playFinalCelebration();
              onPuzzleSolved('🌌 SUPREME COSMIC RESTORATION COMPLETE! LORD GANESHA TRANSCENDS THE UNIVERSE! 🌌');
            } else {
              pStatus.textContent = `Consecrated ${cosmicConsecrated} of 5 Supreme Offerings! Place the remaining gifts.`;
            }
          }
        });
        choiceContainer.appendChild(btn);
      });
      pContent.appendChild(choiceContainer);
    }
  }

  function onPuzzleSolved(msg) {
    const pStatus = document.getElementById('puzzle-status');
    pStatus.textContent = msg;
    if (window.soundEngine) window.soundEngine.playPuzzleCorrect();
    addScore(100, player.x, player.y);

    // If Level 3 temple gate, activate gate door slide animation
    if (state.currentLevel === 3) {
      const gate = interactiveObjects.find(o => o.type === 'temple_gate');
      if (gate) gate.activated = true;
    }

    setTimeout(() => {
      completeCurrentLevel();
    }, 1300);
  }

  // ==========================================================================
  // LEVEL COMPLETION & FINAL CELEBRATION
  // ==========================================================================
  function completeCurrentLevel() {
    state.levelCompleted = true;
    state.isPaused = true;
    if (state.timerInterval) clearInterval(state.timerInterval);

    // Time Bonus
    const timeBonus = state.timer * 5;
    state.score += 200 + timeBonus; // 200 pts for level completion + time bonus
    state.levelsCompletedCount = Math.max(state.levelsCompletedCount, state.currentLevel);
    saveScoreData();

    if (state.currentLevel === 4) {
      // 🌟 FOUR LEVELS COMPLETED: TRANSFORM GAME STYLE TO SUVARNA CELESTIAL
      state.celestialUnlocked = true;
      state.isCelestialMode = true;
      applyGameStyle('celestial');
      updateCelestialUI();
      saveScoreData();

      if (window.soundEngine) {
        window.soundEngine.playLevelComplete();
        window.soundEngine.playStyleTransform();
      }

      // Show Level Complete Transition Modal with Grand Style Transformation Announcement
      const lcTitle = document.getElementById('lc-title');
      if (lcTitle) {
        lcTitle.innerHTML = `Level 4 Complete! 🌟<br><span style="font-size:15px; color:#00E5FF; font-weight:800; display:block; margin-top:8px;">✨ 4 REALMS CONQUERED • DIVINE STYLE UNLOCKED! ✨</span>`;
      }
      const mins = Math.floor(state.timer / 60).toString().padStart(2, '0');
      const secs = (state.timer % 60).toString().padStart(2, '0');
      document.getElementById('lc-remaining-time').textContent = `${mins}:${secs}`;
      document.getElementById('lc-time-bonus').textContent = `+${timeBonus} pts`;
      document.getElementById('lc-total-score').textContent = state.score.toLocaleString();

      const nextBtn = document.getElementById('btn-next-level');
      if (nextBtn) {
        nextBtn.textContent = 'ENTER CELESTIAL SANCTUM (LEVEL 5) ▶️';
      }

      showScreen(screenLevelComplete);

    } else if (state.currentLevel === 5) {
      // LEVEL 5 RESTORED! UNLOCK SUVARNA CELESTIAL GANESHA & CELESTIAL REALMS
      state.celestialUnlocked = true;
      state.isCelestialMode = true;
      applyGameStyle('celestial');
      saveScoreData();
      updateCelestialUI();

      const champTitle = document.getElementById('champ-title');
      if (champTitle) {
        champTitle.innerHTML = '🏆 FESTIVAL RESTORED! 🏆<br><span style="font-size:18px; color:#00E5FF; font-weight:700;">✨ SUVARNA GANESHA & CELESTIAL REALMS UNLOCKED! ✨</span>';
      }
      const champDesc = document.getElementById('champ-desc');
      if (champDesc) {
        champDesc.innerHTML = 'The Earthly Festival is saved! Lord Ganesha transforms into the glorious <strong>Suvarna Golden Avatar</strong> with celestial star halo and royal Mooshika! The gates to the <strong>5 Celestial Realms (Levels 6–10)</strong> are now open!';
      }
      if (btnContinueCelestial) btnContinueCelestial.style.display = 'flex';

      triggerFinalCelebration();

    } else if (state.currentLevel === 10) {
      // SUPREME FINAL LEVEL 10 RESTORED!
      state.celestialUnlocked = true;
      state.isCelestialMode = true;
      applyGameStyle('celestial');
      saveScoreData();

      const champTitle = document.getElementById('champ-title');
      if (champTitle) {
        champTitle.innerHTML = '🌌 SUPREME COSMIC TRANSCENDENCE! 🌌';
      }
      const champDesc = document.getElementById('champ-desc');
      if (champDesc) {
        champDesc.innerHTML = 'All 10 sacred realms from the Sacred Forest to the Ananta Cosmic Sanctum are restored in eternal radiance! Lord Ganesha blesses the cosmos with infinite joy, wisdom, and celebration!';
      }
      if (btnContinueCelestial) btnContinueCelestial.style.display = 'none';

      triggerFinalCelebration();

    } else {
      // Intermediate level completion (Levels 1-3 and Levels 6-9)
      if (window.soundEngine) window.soundEngine.playLevelComplete();

      // Show Level Complete Transition Modal cleanly
      document.getElementById('lc-title').textContent = `Level ${state.currentLevel} Complete! 🌟`;
      const mins = Math.floor(state.timer / 60).toString().padStart(2, '0');
      const secs = (state.timer % 60).toString().padStart(2, '0');
      document.getElementById('lc-remaining-time').textContent = `${mins}:${secs}`;
      document.getElementById('lc-time-bonus').textContent = `+${timeBonus} pts`;
      document.getElementById('lc-total-score').textContent = state.score.toLocaleString();

      const nextBtn = document.getElementById('btn-next-level');
      if (nextBtn) {
        nextBtn.textContent = 'NEXT REALM ▶️';
      }

      showScreen(screenLevelComplete);
    }
  }

  function triggerFinalCelebration() {
    state.restorationProgress = 100;
    saveScoreData();
    if (window.soundEngine) {
      window.soundEngine.playFinalCelebration();
    }

    // Launch celebratory fireworks
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        const x = 120 + Math.random() * (CANVAS_WIDTH - 240);
        const y = CANVAS_HEIGHT;
        const targetY = 80 + Math.random() * 180;
        const colors = ['#FFD54F', '#FF1744', '#00E5FF', '#FF9800', '#E040FB', '#76FF03'];
        fireworks.push(new Firework(x, y, targetY, colors[i % colors.length]));
      }, i * 280);
    }

    // Populate Champion Modal
    document.getElementById('champ-final-score').textContent = state.score.toLocaleString();
    let hearts = '';
    for (let i = 0; i < state.lives; i++) hearts += '❤️';
    document.getElementById('champ-lives').textContent = hearts || '❤️';

    setTimeout(() => {
      showScreen(screenChampion);
    }, 1800);
  }

  function triggerGameOver(reason = 'The festival energy faded.') {
    state.isPaused = true;
    state.isPlaying = false;
    if (state.timerInterval) clearInterval(state.timerInterval);

    saveScoreData();
    if (window.soundEngine) window.soundEngine.playGameOver();

    document.getElementById('go-subtitle').textContent = reason;
    document.getElementById('go-final-score').textContent = state.score.toLocaleString();
    document.getElementById('go-level').textContent = `Level ${state.currentLevel}`;
    const cfg = LEVEL_CONFIGS[state.currentLevel];
    const energyPct = Math.min(100, Math.round((state.divineEnergyCollected / cfg.targetEnergy) * 100));
    document.getElementById('go-energy').textContent = `${energyPct}%`;
    document.getElementById('go-best-score').textContent = state.highScore.toLocaleString();

    screenGameOver.classList.add('active');
  }

  // ==========================================================================
  // GAME LOOP: UPDATE & RENDER
  // ==========================================================================
  let lastTime = 0;
  function gameLoop(time) {
    requestAnimationFrame(gameLoop);

    const dt = (time - lastTime) / 1000;
    lastTime = time;

    updateGame(dt);
    renderGame();
  }

  function updateGame(dt) {
    if (state.isPaused || !state.isPlaying || !player) return;

    player.update();

    // Smooth Camera Follow
    const targetCamX = player.x - CANVAS_WIDTH * 0.38;
    const maxCamX = LEVEL_CONFIGS[state.currentLevel].worldWidth - CANVAS_WIDTH;
    camera.x += (Math.max(0, Math.min(targetCamX, maxCamX)) - camera.x) * 0.1;

    const animTime = performance.now() * 0.001;

    // Update Collectibles & Check Collisions
    for (const item of collectibles) {
      if (!item.collected) {
        item.update(animTime);
        const dist = Math.hypot((player.x + player.width / 2) - item.x, (player.y + player.height / 2) - item.y);
        if (dist < player.width / 2 + item.radius) {
          item.collected = true;

          if (item.type === 'energy') {
            state.divineEnergyCollected++;
            state.totalDivineEnergySession++;
            addScore(50, item.x, item.y);
            spawnBurst(item.x, item.y, '#FFD54F', 18, 'star');
            if (window.soundEngine) window.soundEngine.playDivineEnergy();

            // Check if Final Level Altar restored
            if (state.currentLevel === 5) {
              state.restorationProgress = Math.min(80, state.restorationProgress + 16);
              showWisdomCard(`Altar Energy: ${state.restorationProgress}%! Approach Central Shrine!`, '🛕');
            }
          } else if (item.type === 'modak') {
            addScore(10, item.x, item.y);
            spawnBurst(item.x, item.y, '#FFF9C4', 12, 'circle');
            if (window.soundEngine) window.soundEngine.playCollectModak();
          } else if (item.type === 'flower') {
            addScore(10, item.x, item.y);
            spawnBurst(item.x, item.y, '#FF4081', 12, 'petal');
            if (window.soundEngine) window.soundEngine.playCollectFlower();
          } else if (item.type === 'wisdom') {
            addWisdomCharge(35);
            addScore(25, item.x, item.y);
            spawnBurst(item.x, item.y, '#00E5FF', 16, 'star');
            if (window.soundEngine) window.soundEngine.playBell();
          }

          updateHUD();
        }
      }
    }

    // Update Interactive Objects (Diyas, Bells, Shrine, Gate)
    for (const obj of interactiveObjects) {
      const objDist = Math.hypot((player.x + player.width / 2) - (obj.x + obj.width / 2),
                                 (player.y + player.height / 2) - (obj.y + obj.height / 2));

      if (obj.type === 'diya' && !obj.activated) {
        if (objDist < 45) {
          obj.activated = true;
          addScore(20, obj.x, obj.y);
          spawnBurst(obj.x + 16, obj.y + 14, '#FF9800', 16, 'circle');
          if (window.soundEngine) window.soundEngine.playDiyaLit();

          const litCount = interactiveObjects.filter(o => o.type === 'diya' && o.activated).length;
          const totalDiyas = interactiveObjects.filter(o => o.type === 'diya').length;
          if (litCount === totalDiyas) {
            showWisdomCard('All 5 Sacred Diyas Lit! Head to the Temple Entrance 🛕', '🪔');
          } else {
            showWisdomCard(`Sacred Diya Lit! (${litCount}/${totalDiyas})`, '🪔');
          }
        }
      } else if (obj.type === 'bell' && !obj.activated) {
        if (objDist < 40) {
          obj.activated = true;
          addScore(15, obj.x, obj.y);
          if (window.soundEngine) window.soundEngine.playBell();
          setTimeout(() => { obj.activated = false; }, 800);
        }
      } else if (obj.type === 'shrine' && !state.levelCompleted) {
        if (objDist < 100) {
          const cfg = LEVEL_CONFIGS[state.currentLevel];
          if (cfg && state.divineEnergyCollected < cfg.targetEnergy) {
            if (!obj.lastPromptTime || Date.now() - obj.lastPromptTime > 2500) {
              obj.lastPromptTime = Date.now();
              showWisdomCard(`Collect all Divine Energy Orbs (${state.divineEnergyCollected}/${cfg.targetEnergy}) to awaken the shrine!`, '⭐');
              if (window.soundEngine) window.soundEngine.playBell();
            }
          } else {
            openLevelPuzzle(state.currentLevel);
          }
        }
      } else if (obj.type === 'temple_gate' && !state.levelCompleted) {
        if (objDist < 110) {
          const cfg = LEVEL_CONFIGS[state.currentLevel];
          if (cfg && state.divineEnergyCollected < cfg.targetEnergy) {
            if (!obj.lastPromptTime || Date.now() - obj.lastPromptTime > 2500) {
              obj.lastPromptTime = Date.now();
              showWisdomCard(`Collect all Divine Energy Orbs (${state.divineEnergyCollected}/${cfg.targetEnergy}) to open the gate!`, '⭐');
              if (window.soundEngine) window.soundEngine.playBell();
            }
          } else {
            openLevelPuzzle(state.currentLevel);
          }
        }
      }
    }

    // Update Obstacles & Hazards (with fair hitboxes)
    for (const ob of obstacles) {
      ob.update();
      if (ob.active) {
        const pad = 4;
        if (player.checkOverlap(player.x + pad, player.y + pad, player.width - pad * 2, player.height - pad * 2,
                                ob.x + pad, ob.y + pad, ob.w - pad * 2, ob.h - pad * 2)) {
          player.takeDamage(ob.type);
        }
      }
    }

    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      if (particles[i].life <= 0) particles.splice(i, 1);
    }

    // Update Float Texts
    for (let i = floatTexts.length - 1; i >= 0; i--) {
      floatTexts[i].update();
      if (floatTexts[i].life <= 0) floatTexts.splice(i, 1);
    }

    // Update Fireworks
    for (let i = fireworks.length - 1; i >= 0; i--) {
      fireworks[i].update();
      if (fireworks[i].exploded) fireworks.splice(i, 1);
    }
  }

  // ==========================================================================
  // CANVAS RENDERING
  // ==========================================================================
  function renderGame() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const animTime = performance.now() * 0.001;
    const camX = camera.x;

    // 1. Draw Background
    drawBackground(ctx, camX, animTime);

    // 2. Draw Platforms
    drawPlatforms(ctx, camX);

    // 3. Draw Interactive Objects (Diyas, Bells, Shrines, Gates)
    for (const obj of interactiveObjects) {
      obj.draw(ctx, camX, animTime);
    }

    // 4. Draw Collectibles
    for (const item of collectibles) {
      item.draw(ctx, camX);
    }

    // 5. Draw Obstacles
    for (const ob of obstacles) {
      ob.draw(ctx, camX, animTime);
    }

    // 6. Draw Player & Mooshika
    if (player) {
      player.draw(ctx, camX);
    }

    // 7. Draw Particles
    for (const p of particles) {
      p.draw(ctx, camX);
    }

    // 8. Draw Float Texts
    for (const ft of floatTexts) {
      ft.draw(ctx, camX);
    }

    // 9. Draw Fireworks
    for (const fw of fireworks) {
      // Firework projectile
      if (!fw.exploded) {
        ctx.fillStyle = fw.color;
        ctx.beginPath();
        ctx.arc(fw.x, fw.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawBackground(ctx, camX, animTime) {
    const theme = LEVEL_CONFIGS[state.currentLevel].bgTheme;

    if (theme === 'forest') {
      // Sacred Forest: Lush twilight canopy with marigold torans
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      grad.addColorStop(0, '#0D2818');
      grad.addColorStop(0.5, '#164E2E');
      grad.addColorStop(1, '#051A0E');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Distant silhouetted Banyan trees (parallax)
      ctx.fillStyle = 'rgba(10, 36, 18, 0.6)';
      for (let i = 0; i < 12; i++) {
        const tx = (i * 260) - (camX * 0.3);
        ctx.fillRect(tx, 140, 48, CANVAS_HEIGHT - 140);
        ctx.beginPath();
        ctx.arc(tx + 24, 140, 70, Math.PI, 0);
        ctx.fill();
      }
    } else if (theme === 'city') {
      // Festival City: Warm festival street with illuminated temple spires
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      grad.addColorStop(0, '#2D0A14');
      grad.addColorStop(0.6, '#4A1020');
      grad.addColorStop(1, '#1A040A');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Distant city arches and lanterns (parallax)
      ctx.fillStyle = 'rgba(74, 16, 32, 0.7)';
      for (let i = 0; i < 14; i++) {
        const ax = (i * 240) - (camX * 0.35);
        ctx.fillRect(ax, 160, 60, CANVAS_HEIGHT - 160);
        ctx.beginPath();
        ctx.moveTo(ax, 160);
        ctx.lineTo(ax + 30, 90);
        ctx.lineTo(ax + 60, 160);
        ctx.closePath();
        ctx.fill();
      }
    } else if (theme === 'temple') {
      // Ancient Temple: Grand stone sanctum, deep maroon pillars
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      grad.addColorStop(0, '#1E050C');
      grad.addColorStop(0.5, '#350C16');
      grad.addColorStop(1, '#120206');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Carved Temple Pillars
      ctx.fillStyle = 'rgba(40, 8, 16, 0.85)';
      ctx.strokeStyle = 'rgba(255, 179, 0, 0.25)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 16; i++) {
        const px = (i * 200) - (camX * 0.4);
        ctx.fillRect(px, 60, 42, CANVAS_HEIGHT - 60);
        ctx.strokeRect(px, 60, 42, CANVAS_HEIGHT - 60);
      }
    } else if (theme === 'challenge') {
      // Divine Challenge: Fiery cosmic sunset
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      grad.addColorStop(0, '#311B92');
      grad.addColorStop(0.4, '#880E4F');
      grad.addColorStop(0.8, '#E65100');
      grad.addColorStop(1, '#BF360C');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else if (theme === 'sanctum') {
      // Grand Maha Mandir Sanctum: Glowing gold and divine beams
      const grad = ctx.createRadialGradient(
        CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 40,
        CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH
      );
      grad.addColorStop(0, '#5D1022');
      grad.addColorStop(0.6, '#2C060F');
      grad.addColorStop(1, '#110105');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Grand Mandala behind shrine
      ctx.save();
      ctx.translate(CANVAS_WIDTH / 2, 220);
      ctx.rotate(animTime * 0.1);
      ctx.strokeStyle = `rgba(255, 213, 79, ${0.15 + (state.restorationProgress / 200)})`;
      ctx.lineWidth = 3;
      for (let i = 0; i < 8; i++) {
        ctx.rotate(Math.PI / 4);
        ctx.strokeRect(-60, -60, 120, 120);
      }
      ctx.restore();

    } else if (theme === 'kailash') {
      // Kailash Foothills: Himalayan twilight, ice peaks, falling snow
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      grad.addColorStop(0, '#05101F');
      grad.addColorStop(0.5, '#0E2744');
      grad.addColorStop(1, '#051322');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Distant Himalayan Mountain Peaks with snow caps (parallax)
      ctx.fillStyle = '#102A45';
      for (let i = 0; i < 10; i++) {
        const mx = (i * 280) - (camX * 0.2);
        ctx.beginPath();
        ctx.moveTo(mx, CANVAS_HEIGHT - 60);
        ctx.lineTo(mx + 140, 100);
        ctx.lineTo(mx + 280, CANVAS_HEIGHT - 60);
        ctx.closePath();
        ctx.fill();

        // Snow Cap
        ctx.fillStyle = '#E1F5FE';
        ctx.beginPath();
        ctx.moveTo(mx + 105, 150);
        ctx.lineTo(mx + 140, 100);
        ctx.lineTo(mx + 175, 150);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#102A45';
      }

      // Gentle falling snowflakes in background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      for (let s = 0; s < 25; s++) {
        const sx = ((s * 43) + animTime * 20) % CANVAS_WIDTH;
        const sy = ((s * 37) + animTime * 35) % CANVAS_HEIGHT;
        ctx.fillRect(sx, sy, 2.5, 2.5);
      }

    } else if (theme === 'ganga') {
      // Celestial River Ganga: Sacred waters, river reflection & floating diyas
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      grad.addColorStop(0, '#02121E');
      grad.addColorStop(0.5, '#00332C');
      grad.addColorStop(0.85, '#004D40');
      grad.addColorStop(1, '#00251A');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Distant River Ghat Arches
      ctx.fillStyle = 'rgba(0, 60, 50, 0.7)';
      for (let i = 0; i < 12; i++) {
        const gx = (i * 260) - (camX * 0.25);
        ctx.fillRect(gx, 180, 50, CANVAS_HEIGHT - 180);
        ctx.beginPath();
        ctx.arc(gx + 25, 180, 30, Math.PI, 0);
        ctx.fill();
      }

      // Sacred river water surface ripple & floating diyas
      ctx.fillStyle = 'rgba(255, 213, 79, 0.6)';
      for (let d = 0; d < 8; d++) {
        const dx = ((d * 140) + Math.sin(animTime + d) * 15 - (camX * 0.35) + 3000) % CANVAS_WIDTH;
        const dy = CANVAS_HEIGHT - 65 + Math.sin(animTime * 2 + d) * 3;
        ctx.beginPath();
        ctx.arc(dx, dy, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

    } else if (theme === 'surya') {
      // Surya Mandir: Radiant solar saffron dawn with rotating 12-spoke Sun Wheel
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      grad.addColorStop(0, '#3E1000');
      grad.addColorStop(0.4, '#B71C1C');
      grad.addColorStop(0.75, '#E65100');
      grad.addColorStop(1, '#FF8F00');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Rotating Great Surya Sun Chakra in background sky
      ctx.save();
      ctx.translate(CANVAS_WIDTH * 0.5 - (camX * 0.08), 160);
      ctx.rotate(animTime * 0.25);

      // Sun Disc
      const sunGrad = ctx.createRadialGradient(0, 0, 20, 0, 0, 90);
      sunGrad.addColorStop(0, '#FFF9C4');
      sunGrad.addColorStop(0.4, '#FFD54F');
      sunGrad.addColorStop(0.8, '#FF6F00');
      sunGrad.addColorStop(1, 'rgba(255, 111, 0, 0)');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 90, 0, Math.PI * 2);
      ctx.fill();

      // 12 Sun Rays
      ctx.strokeStyle = 'rgba(255, 238, 88, 0.45)';
      ctx.lineWidth = 4;
      for (let r = 0; r < 12; r++) {
        ctx.rotate(Math.PI / 6);
        ctx.beginPath();
        ctx.moveTo(0, 35);
        ctx.lineTo(0, 85);
        ctx.stroke();
      }
      ctx.restore();

      // Distant Sun Temple Pillars
      ctx.fillStyle = 'rgba(80, 20, 0, 0.65)';
      for (let p = 0; p < 12; p++) {
        const px = (p * 240) - (camX * 0.3);
        ctx.fillRect(px, 140, 38, CANVAS_HEIGHT - 140);
      }

    } else if (theme === 'amaravati') {
      // Indra's Amaravati: Heavenly sky realm with billowy clouds & gold palaces
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      grad.addColorStop(0, '#1A0826');
      grad.addColorStop(0.4, '#4A148C');
      grad.addColorStop(0.8, '#0277BD');
      grad.addColorStop(1, '#004D40');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Billowing heavenly clouds in parallax
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      for (let c = 0; c < 8; c++) {
        const cx = ((c * 200) - (camX * 0.2) + 2000) % (CANVAS_WIDTH + 200) - 100;
        const cy = 120 + (c % 3) * 60;
        ctx.beginPath();
        ctx.arc(cx, cy, 55, 0, Math.PI * 2);
        ctx.arc(cx + 45, cy - 15, 45, 0, Math.PI * 2);
        ctx.arc(cx + 85, cy, 50, 0, Math.PI * 2);
        ctx.fill();
      }

    } else if (theme === 'ananta') {
      // Ananta Cosmic Sanctum: Cosmic void with rotating galaxy Sri Chakra
      const grad = ctx.createRadialGradient(
        CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 30,
        CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH
      );
      grad.addColorStop(0, '#311B92');
      grad.addColorStop(0.4, '#1A0038');
      grad.addColorStop(0.8, '#0A0017');
      grad.addColorStop(1, '#020008');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Infinite Starfield
      ctx.fillStyle = '#FFF';
      for (let s = 0; s < 60; s++) {
        const sx = (s * 53) % CANVAS_WIDTH;
        const sy = (s * 31) % CANVAS_HEIGHT;
        const twinkle = Math.sin(animTime * 3 + s) * 0.5 + 0.5;
        ctx.globalAlpha = twinkle * 0.8;
        ctx.fillRect(sx, sy, (s % 3) + 1, (s % 3) + 1);
      }
      ctx.globalAlpha = 1.0;

      // Cosmic Sri Chakra Galaxy Mandala
      ctx.save();
      ctx.translate(CANVAS_WIDTH / 2, 220);
      ctx.rotate(animTime * 0.15);
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 12; i++) {
        ctx.rotate(Math.PI / 6);
        ctx.strokeRect(-80, -80, 160, 160);
      }
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
      for (let i = 0; i < 8; i++) {
        ctx.rotate(Math.PI / 4);
        ctx.beginPath();
        ctx.arc(0, 0, 110, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Hanging Festive Torans / Floral Garlands along the top
    ctx.save();
    ctx.fillStyle = '#FF9800';
    const toranCount = Math.ceil(CANVAS_WIDTH / 40) + 1;
    for (let i = 0; i < toranCount; i++) {
      const tx = i * 40;
      ctx.beginPath();
      ctx.arc(tx, 0, 20, 0, Math.PI);
      ctx.fill();
      // Lotus dot
      ctx.fillStyle = '#D81B60';
      ctx.beginPath();
      ctx.arc(tx, 20, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FF9800';
    }
    ctx.restore();
  }

  function drawPlatforms(ctx, camX) {
    const isCelestial = state.isCelestialMode || state.currentLevel >= 5 || state.levelsCompletedCount >= 4;

    for (const p of platforms) {
      const drawX = p.x - camX;
      if (drawX + p.w < 0 || drawX > CANVAS_WIDTH) continue;

      ctx.save();

      if (p.type === 'ground') {
        // Ground platform with rich Indian decorative border & Rangoli accents
        ctx.fillStyle = isCelestial ? '#0B0217' : '#21050D';
        ctx.fillRect(drawX, p.y, p.w, p.h);

        // Gold & Cyan border trim
        ctx.fillStyle = isCelestial ? '#00E5FF' : '#FFB300';
        ctx.fillRect(drawX, p.y, p.w, 4);

        if (isCelestial) {
          ctx.fillStyle = '#FFD54F';
          ctx.fillRect(drawX, p.y + 4, p.w, 2);
        }

        // Traditional chevron/diamond pattern
        ctx.fillStyle = isCelestial ? '#7C4DFF' : '#E65100';
        for (let x = p.x; x < p.x + p.w; x += 24) {
          ctx.beginPath();
          ctx.moveTo(x - camX, p.y + (isCelestial ? 6 : 4));
          ctx.lineTo(x + 12 - camX, p.y + 14);
          ctx.lineTo(x + 24 - camX, p.y + (isCelestial ? 6 : 4));
          ctx.closePath();
          ctx.fill();
        }
      } else {
        // Floating carved stone / wood platforms
        ctx.fillStyle = isCelestial ? '#1F0A38' : '#421622';
        ctx.fillRect(drawX, p.y, p.w, p.h);

        ctx.strokeStyle = isCelestial ? '#00E5FF' : '#FFD54F';
        ctx.lineWidth = isCelestial ? 2.5 : 2;
        ctx.strokeRect(drawX, p.y, p.w, p.h);

        if (isCelestial) {
          ctx.shadowColor = '#00E5FF';
          ctx.shadowBlur = 8;
        }

        // Floral corner caps
        ctx.fillStyle = isCelestial ? '#FFD54F' : '#FFB300';
        ctx.fillRect(drawX - 2, p.y - 2, 6, p.h + 4);
        ctx.fillRect(drawX + p.w - 4, p.y - 2, 6, p.h + 4);
      }

      ctx.restore();
    }
  }

  // ==========================================================================
  // FLOWER PETAL OVERLAY (CSS PARTICLES)
  // ==========================================================================
  function initPetalOverlay() {
    if (!petalOverlay) return;
    petalOverlay.innerHTML = '';
    if (!state.petalsOn) return;

    for (let i = 0; i < 20; i++) {
      const petal = document.createElement('div');
      petal.className = 'floating-petal';
      petal.style.left = Math.random() * 100 + '%';
      petal.style.width = 10 + Math.random() * 10 + 'px';
      petal.style.height = 14 + Math.random() * 12 + 'px';
      petal.style.animationDuration = 5 + Math.random() * 6 + 's';
      petal.style.animationDelay = Math.random() * 5 + 's';
      petalOverlay.appendChild(petal);
    }
  }

  // ==========================================================================
  // EVENT LISTENERS & USER CONTROLS
  // ==========================================================================
  function setupInput() {
    // Keyboard Controls
    window.addEventListener('keydown', (e) => {
      // Audio unlock on first keypress
      if (window.soundEngine) window.soundEngine.ensureUnlocked();

      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        keys.left = true;
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        keys.right = true;
      } else if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        keys.jump = true;
        e.preventDefault();
      } else if (e.code === 'KeyE') {
        keys.power = true;
      } else if (e.code === 'Escape' || e.code === 'KeyP') {
        togglePause();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        keys.left = false;
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        keys.right = false;
      } else if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        keys.jump = false;
      } else if (e.code === 'KeyE') {
        keys.power = false;
      }
    });

    // Mobile Virtual Touch Controls
    const touchLeft = document.getElementById('touch-left');
    const touchRight = document.getElementById('touch-right');
    const touchJump = document.getElementById('touch-jump');
    const touchPower = document.getElementById('touch-power');

    function bindTouch(btn, onDown, onUp) {
      if (!btn) return;
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (window.soundEngine) window.soundEngine.ensureUnlocked();
        btn.classList.add('active');
        onDown();
      }, { passive: false });

      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        btn.classList.remove('active');
        onUp();
      }, { passive: false });

      btn.addEventListener('touchcancel', () => {
        btn.classList.remove('active');
        onUp();
      });

      // Mouse fallback for mobile preview on desktop
      btn.addEventListener('mousedown', () => {
        if (window.soundEngine) window.soundEngine.ensureUnlocked();
        btn.classList.add('active');
        onDown();
      });
      btn.addEventListener('mouseup', () => {
        btn.classList.remove('active');
        onUp();
      });
      btn.addEventListener('mouseleave', () => {
        btn.classList.remove('active');
        onUp();
      });
    }

    bindTouch(touchLeft, () => { keys.left = true; }, () => { keys.left = false; });
    bindTouch(touchRight, () => { keys.right = true; }, () => { keys.right = false; });
    bindTouch(touchJump, () => { keys.jump = true; }, () => { keys.jump = false; });
    bindTouch(touchPower, () => { triggerWisdomPower(); }, () => {});

    // HUD Button Handlers
    document.getElementById('btn-hud-sound').addEventListener('click', () => {
      state.musicOn = !state.musicOn;
      state.sfxOn = state.musicOn;
      if (window.soundEngine) {
        window.soundEngine.setMusicEnabled(state.musicOn);
        window.soundEngine.setSfxEnabled(state.sfxOn);
      }
      document.getElementById('btn-hud-sound').textContent = state.musicOn ? '🔊' : '🔇';
      document.getElementById('toggle-music').checked = state.musicOn;
      document.getElementById('toggle-sfx').checked = state.sfxOn;
    });

    document.getElementById('btn-hud-pause').addEventListener('click', () => {
      togglePause();
    });

    // Opening Screen Buttons
    document.getElementById('btn-play-game').addEventListener('click', () => {
      startGame();
    });

    document.getElementById('btn-how-to-play').addEventListener('click', () => {
      showScreen(screenInstructions);
    });
    document.getElementById('btn-close-instructions').addEventListener('click', () => {
      showScreen(screenStart);
    });

    document.getElementById('btn-high-scores').addEventListener('click', () => {
      updateScoreHUD();
      showScreen(screenHighScores);
    });
    document.getElementById('btn-close-high-scores').addEventListener('click', () => {
      showScreen(screenStart);
    });
    document.getElementById('btn-reset-scores').addEventListener('click', () => {
      try {
        localStorage.removeItem('ganesha_highscore');
        localStorage.removeItem('ganesha_highest_level');
        localStorage.removeItem('ganesha_total_energy');
        state.highScore = 0;
        state.highestLevelReached = 1;
        state.totalDivineEnergySession = 0;
        updateScoreHUD();
      } catch(e) {}
    });

    document.getElementById('btn-settings').addEventListener('click', () => {
      showScreen(screenSettings);
    });
    document.getElementById('btn-close-settings').addEventListener('click', () => {
      showScreen(screenStart);
    });
    document.getElementById('btn-settings-how').addEventListener('click', () => {
      showScreen(screenInstructions);
    });

    // Level Complete Modal Button
    document.getElementById('btn-next-level').addEventListener('click', () => {
      screenLevelComplete.classList.remove('active');
      state.currentLevel++;
      if (state.currentLevel >= 5 || state.levelsCompletedCount >= 4) {
        state.isCelestialMode = true;
        state.celestialUnlocked = true;
        applyGameStyle('celestial');
      }
      const nextBtn = document.getElementById('btn-next-level');
      if (nextBtn) nextBtn.textContent = 'NEXT REALM ▶️';
      buildLevel(state.currentLevel);
      state.isPaused = false;
      state.isPlaying = true;
    });

    // Game Over Buttons
    document.getElementById('btn-retry-level').addEventListener('click', () => {
      screenGameOver.classList.remove('active');
      state.lives = 3;
      updateLivesHUD();
      buildLevel(state.currentLevel);
      state.isPaused = false;
      state.isPlaying = true;
    });
    document.getElementById('btn-menu-from-go').addEventListener('click', () => {
      screenGameOver.classList.remove('active');
      hud.style.display = 'none';
      showScreen(screenStart);
    });

    // In-Game HUD Back Button (Opens Pause / Exit Menu)
    const btnHudBack = document.getElementById('btn-hud-back');
    if (btnHudBack) {
      btnHudBack.addEventListener('click', () => {
        togglePause();
      });
    }

    // Pause Modal Buttons
    const btnPauseResume = document.getElementById('btn-pause-resume');
    if (btnPauseResume) {
      btnPauseResume.addEventListener('click', () => {
        togglePause();
      });
    }

    const btnPauseRestart = document.getElementById('btn-pause-restart');
    if (btnPauseRestart) {
      btnPauseRestart.addEventListener('click', () => {
        state.isPaused = false;
        state.isPlaying = true;
        showScreen(null);
        buildLevel(state.currentLevel);
      });
    }

    const btnPauseMenu = document.getElementById('btn-pause-menu');
    if (btnPauseMenu) {
      btnPauseMenu.addEventListener('click', () => {
        exitToMainMenu();
      });
    }

    // Final Champion Buttons
    document.getElementById('btn-play-again').addEventListener('click', () => {
      screenChampion.classList.remove('active');
      startGame();
    });
    document.getElementById('btn-champion-scores').addEventListener('click', () => {
      screenChampion.classList.remove('active');
      showScreen(screenHighScores);
    });
    document.getElementById('btn-champion-menu').addEventListener('click', () => {
      exitToMainMenu();
    });

    // Celestial Mode & Realm Selector Buttons
    if (btnSelectLevel) {
      btnSelectLevel.addEventListener('click', () => {
        openRealmSelector();
      });
    }

    if (btnCloseRealms) {
      btnCloseRealms.addEventListener('click', () => {
        if (screenRealmSelect) screenRealmSelect.classList.remove('active');
        if (!state.isPlaying) {
          showScreen(screenStart);
        } else {
          showScreen(null);
        }
      });
    }

    if (btnContinueCelestial) {
      btnContinueCelestial.addEventListener('click', () => {
        if (screenChampion) screenChampion.classList.remove('active');
        state.isCelestialMode = true;
        state.celestialUnlocked = true;
        state.currentLevel = 6;
        state.lives = 3;
        saveScoreData();
        buildLevel(6);
        state.isPaused = false;
        state.isPlaying = true;
        hud.style.display = 'flex';
        showScreen(null);
        updateLivesHUD();
        updateScoreHUD();
        if (window.soundEngine) {
          window.soundEngine.ensureUnlocked();
          window.soundEngine.startMusic(6);
        }
      });
    }

    if (btnChampionRealms) {
      btnChampionRealms.addEventListener('click', () => {
        if (screenChampion) screenChampion.classList.remove('active');
        openRealmSelector();
      });
    }

    // Settings Toggles
    document.getElementById('toggle-music').addEventListener('change', (e) => {
      state.musicOn = e.target.checked;
      if (window.soundEngine) window.soundEngine.setMusicEnabled(state.musicOn);
      document.getElementById('btn-hud-sound').textContent = state.musicOn ? '🔊' : '🔇';
    });
    document.getElementById('toggle-sfx').addEventListener('change', (e) => {
      state.sfxOn = e.target.checked;
      if (window.soundEngine) window.soundEngine.setSfxEnabled(state.sfxOn);
    });
    document.getElementById('toggle-petals').addEventListener('change', (e) => {
      state.petalsOn = e.target.checked;
      initPetalOverlay();
    });

    const selectGameStyleElem = document.getElementById('select-game-style');
    if (selectGameStyleElem) {
      selectGameStyleElem.addEventListener('change', (e) => {
        applyGameStyle(e.target.value, true);
        if (e.target.value === 'celestial' && window.soundEngine) {
          window.soundEngine.playStyleTransform();
        }
      });
    }
  }

  function openRealmSelector() {
    if (!realmGridContainer) return;
    realmGridContainer.innerHTML = '';

    for (let lvl = 1; lvl <= 10; lvl++) {
      const cfg = LEVEL_CONFIGS[lvl];
      const isUnlocked = lvl <= state.highestLevelReached || state.celestialUnlocked || lvl === 1;
      const isCurrent = lvl === state.currentLevel;
      const isCelestialLvl = lvl >= 5;

      const card = document.createElement('div');
      card.className = `realm-card ${isUnlocked ? 'unlocked' : 'locked'} ${isCurrent ? 'current' : ''}`;
      card.id = `realm-card-level-${lvl}`;
      
      card.innerHTML = `
        <div class="realm-badge">${cfg.badge}</div>
        <div class="realm-num">LEVEL ${lvl}${isCelestialLvl ? ' • CELESTIAL' : ''}</div>
        <div class="realm-title">${cfg.name.split('—')[1]?.trim() || cfg.name}</div>
        <div class="realm-status">${isUnlocked ? (isCurrent ? '▶ Current' : 'Play Realm') : '🔒 Locked'}</div>
      `;

      if (isUnlocked) {
        card.addEventListener('click', () => {
          showScreen(null);
          if (screenRealmSelect) screenRealmSelect.classList.remove('active');
          if (window.soundEngine) {
            window.soundEngine.ensureUnlocked();
            window.soundEngine.startMusic(lvl);
          }
          if (!state.isPlaying) {
            state.score = 0;
            state.lives = 3;
            state.isPlaying = true;
            state.isPaused = false;
            hud.style.display = 'flex';
          }
          state.currentLevel = lvl;
          if (lvl >= 5 || state.levelsCompletedCount >= 4 || state.celestialUnlocked) {
            state.isCelestialMode = true;
            state.celestialUnlocked = true;
            applyGameStyle('celestial', false);
          }
          buildLevel(lvl);
          state.isPaused = false;
          state.isPlaying = true;
          updateLivesHUD();
          updateScoreHUD();
        });
      }

      realmGridContainer.appendChild(card);
    }

    if (screenRealmSelect) screenRealmSelect.classList.add('active');
  }

  // Dynamic Mobile Screen & Viewport Adaptation
  function adaptLayoutToScreen() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);

    const isMobile = window.innerWidth <= 900 || ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    const isLandscape = window.innerWidth > window.innerHeight;

    if (isMobile) {
      document.body.classList.add('mobile-device');
      if (isLandscape) {
        document.body.classList.add('mobile-landscape');
        document.body.classList.remove('mobile-portrait');
      } else {
        document.body.classList.add('mobile-portrait');
        document.body.classList.remove('mobile-landscape');
      }
    } else {
      document.body.classList.remove('mobile-device', 'mobile-landscape', 'mobile-portrait');
    }
  }

  function showScreen(targetScreen) {
    [screenStart, screenInstructions, screenHighScores, screenSettings, screenPause, screenLevelComplete, screenGameOver, screenChampion, puzzleModal, screenRealmSelect].forEach(s => {
      if (s) s.classList.remove('active');
    });
    if (targetScreen) {
      targetScreen.scrollTop = 0;
      const content = targetScreen.querySelector('.modal-content');
      if (content) content.scrollTop = 0;
      targetScreen.classList.add('active');
    }

    // Hide mobile touch controls when any modal is open so buttons don't block interaction
    if (mobileControls) {
      if (targetScreen !== null || !state.isPlaying || state.isPaused) {
        mobileControls.classList.add('hidden');
      } else {
        mobileControls.classList.remove('hidden');
      }
    }
  }

  function startGame() {
    if (window.soundEngine) {
      window.soundEngine.ensureUnlocked();
      window.soundEngine.startMusic(1);
    }

    state.currentLevel = 1;
    state.score = 0;
    state.lives = 3;
    state.wisdomPowerCharge = 0;
    state.hasShield = false;
    state.scoreMultiplier = 1;
    state.isPlaying = true;
    state.isPaused = false;
    state.sessionStartTime = Date.now();

    updateLivesHUD();
    updateScoreHUD();

    showScreen(null); // Hide all modals
    hud.style.display = 'flex';

    buildLevel(1);
  }

  function togglePause() {
    if (!state.isPlaying) return;
    state.isPaused = !state.isPaused;
    if (state.isPaused) {
      // Clear movement keys so Ganesha does not slide on resume
      keys.left = false;
      keys.right = false;
      keys.jump = false;
      keys.power = false;

      if (pauseLevelInfo) {
        pauseLevelInfo.textContent = `${LEVEL_CONFIGS[state.currentLevel].name} • Score: ${state.score.toLocaleString()}`;
      }
      showScreen(screenPause);
    } else {
      showScreen(null);
    }
  }

  function exitToMainMenu() {
    state.isPlaying = false;
    state.isPaused = false;
    if (state.timerInterval) clearInterval(state.timerInterval);
    if (window.soundEngine) window.soundEngine.stopMusic();

    saveScoreData();
    hud.style.display = 'none';
    showScreen(screenStart);
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================
  function init() {
    adaptLayoutToScreen();
    window.addEventListener('resize', adaptLayoutToScreen);
    window.addEventListener('orientationchange', () => {
      setTimeout(adaptLayoutToScreen, 120);
    });

    loadSavedData();
    initPetalOverlay();
    setupInput();
    showScreen(screenStart);

    // Start render/update animation frame loop
    requestAnimationFrame(gameLoop);
  }

  // Expose puzzle engine, level builder & state for testing & accessibility
  window.openLevelPuzzle = openLevelPuzzle;
  window.buildLevel = buildLevel;
  window.openRealmSelector = openRealmSelector;
  window.gameState = state;

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
