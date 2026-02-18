// SoundManager.js - Procedural Web Audio API sound engine
// No audio files needed - all sounds are synthesized in real-time

export class SoundManager {
    constructor() {
        this._ctx = null;
        this._masterGain = null;
        this._sfxVolume = 0.45;
        this._enabled = true;

        // Persist volume preference
        const saved = localStorage.getItem('shadowKnightsSfxVolume');
        if (saved !== null) this._sfxVolume = parseFloat(saved);
        const savedEnabled = localStorage.getItem('shadowKnightsSoundEnabled');
        if (savedEnabled !== null) this._enabled = savedEnabled === 'true';
    }

    _init() {
        if (this._ctx) return;
        try {
            this._ctx = new (window.AudioContext || window.webkitAudioContext)();
            this._masterGain = this._ctx.createGain();
            this._masterGain.gain.value = this._sfxVolume;
            this._masterGain.connect(this._ctx.destination);
        } catch (e) {
            this._enabled = false;
        }
    }

    _resume() {
        if (this._ctx?.state === 'suspended') this._ctx.resume();
    }

    setEnabled(val) {
        this._enabled = val;
        localStorage.setItem('shadowKnightsSoundEnabled', val);
    }

    setVolume(vol) {
        this._sfxVolume = Phaser.Math.Clamp(vol, 0, 1);
        if (this._masterGain) this._masterGain.gain.value = this._sfxVolume;
        localStorage.setItem('shadowKnightsSfxVolume', this._sfxVolume);
    }

    _play(builderFn) {
        if (!this._enabled) return;
        this._init();
        this._resume();
        if (!this._ctx) return;
        try {
            builderFn(this._ctx, this._masterGain);
        } catch (_) {}
    }

    // ─── helpers ────────────────────────────────────────────────────────────

    _osc(ctx, dest, type, freq, startTime, dur, gainStart, gainEnd) {
        const g = ctx.createGain();
        g.gain.setValueAtTime(gainStart, startTime);
        g.gain.linearRampToValueAtTime(gainEnd, startTime + dur);
        g.connect(dest);
        const osc = ctx.createOscillator();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);
        osc.connect(g);
        osc.start(startTime);
        osc.stop(startTime + dur + 0.01);
    }

    _noise(ctx, dest, startTime, dur, gainStart, gainEnd, bandHz = 0) {
        const bufSize = Math.ceil(ctx.sampleRate * dur);
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

        const src = ctx.createBufferSource();
        src.buffer = buf;

        const g = ctx.createGain();
        g.gain.setValueAtTime(gainStart, startTime);
        g.gain.linearRampToValueAtTime(gainEnd, startTime + dur);

        if (bandHz > 0) {
            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = bandHz;
            filter.Q.value = 2;
            src.connect(filter);
            filter.connect(g);
        } else {
            src.connect(g);
        }

        g.connect(dest);
        src.start(startTime);
    }

    // ─── Game SFX ───────────────────────────────────────────────────────────

    // Basic weapon fire / projectile
    playSwordSwing() {
        this._play((ctx, dest) => {
            const t = ctx.currentTime;
            this._noise(ctx, dest, t, 0.12, 0.35, 0, 2200);
            this._osc(ctx, dest, 'sawtooth', 320, t, 0.08, 0.18, 0);
        });
    }

    playArrow() {
        this._play((ctx, dest) => {
            const t = ctx.currentTime;
            this._noise(ctx, dest, t, 0.15, 0.28, 0, 3500);
            this._osc(ctx, dest, 'sawtooth', 180, t, 0.08, 0.12, 0);
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(900, t);
            osc.frequency.linearRampToValueAtTime(300, t + 0.15);
            g.gain.setValueAtTime(0.12, t);
            g.gain.linearRampToValueAtTime(0, t + 0.15);
            osc.connect(g); g.connect(dest);
            osc.start(t); osc.stop(t + 0.16);
        });
    }

    playStaffShot() {
        this._play((ctx, dest) => {
            const t = ctx.currentTime;
            this._osc(ctx, dest, 'sine', 660, t, 0.09, 0.25, 0);
            this._osc(ctx, dest, 'sine', 880, t, 0.06, 0.15, 0);
            this._noise(ctx, dest, t, 0.1, 0.12, 0, 1800);
        });
    }

    playDaggerThrow() {
        this._play((ctx, dest) => {
            const t = ctx.currentTime;
            this._noise(ctx, dest, t, 0.08, 0.3, 0, 4000);
            this._osc(ctx, dest, 'sawtooth', 500, t, 0.07, 0.1, 0);
        });
    }

    playGreatswordSlam() {
        this._play((ctx, dest) => {
            const t = ctx.currentTime;
            this._noise(ctx, dest, t, 0.25, 0.5, 0, 200);
            this._osc(ctx, dest, 'sawtooth', 80, t, 0.22, 0.3, 0);
            this._osc(ctx, dest, 'sawtooth', 120, t + 0.05, 0.2, 0.25, 0);
        });
    }

    playThunderGauntlet() {
        this._play((ctx, dest) => {
            const t = ctx.currentTime;
            this._noise(ctx, dest, t, 0.18, 0.45, 0, 1200);
            this._osc(ctx, dest, 'sawtooth', 60, t, 0.2, 0.3, 0);
            this._osc(ctx, dest, 'square', 220, t, 0.15, 0.15, 0);
            this._osc(ctx, dest, 'sine', 440, t + 0.04, 0.1, 0.12, 0);
        });
    }

    // Hit / impact
    playHit() {
        this._play((ctx, dest) => {
            const t = ctx.currentTime;
            this._noise(ctx, dest, t, 0.08, 0.32, 0, 800);
            this._osc(ctx, dest, 'square', 150, t, 0.12, 0.08, 0);
        });
    }

    playCrit() {
        this._play((ctx, dest) => {
            const t = ctx.currentTime;
            this._noise(ctx, dest, t, 0.1, 0.45, 0, 1600);
            this._osc(ctx, dest, 'square', 200, t, 0.18, 0.12, 0);
            this._osc(ctx, dest, 'sawtooth', 400, t + 0.02, 0.08, 0.14, 0);
        });
    }

    playPlayerHit() {
        this._play((ctx, dest) => {
            const t = ctx.currentTime;
            this._noise(ctx, dest, t, 0.18, 0.55, 0, 300);
            this._osc(ctx, dest, 'sawtooth', 90, t, 0.25, 0.18, 0);
        });
    }

    // Dash
    playDash() {
        this._play((ctx, dest) => {
            const t = ctx.currentTime;
            this._noise(ctx, dest, t, 0.14, 0.2, 0, 2800);
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, t);
            osc.frequency.linearRampToValueAtTime(1200, t + 0.12);
            g.gain.setValueAtTime(0.15, t);
            g.gain.linearRampToValueAtTime(0, t + 0.14);
            osc.connect(g); g.connect(dest);
            osc.start(t); osc.stop(t + 0.15);
        });
    }

    // Skills
    playBattleCry() {
        this._play((ctx, dest) => {
            const t = ctx.currentTime;
            this._osc(ctx, dest, 'sawtooth', 120, t, 0.25, 0.35, 0);
            this._osc(ctx, dest, 'sawtooth', 180, t + 0.05, 0.18, 0.25, 0.02);
            this._noise(ctx, dest, t, 0.3, 0.3, 0, 400);
        });
    }

    playIronWill() {
        this._play((ctx, dest) => {
            const t = ctx.currentTime;
            for (let i = 0; i < 3; i++) {
                const freq = 440 + i * 160;
                this._osc(ctx, dest, 'sine', freq, t + i * 0.06, 0.15, 0.2, 0);
            }
            this._noise(ctx, dest, t, 0.2, 0.18, 0, 1000);
        });
    }

    playGrapplingHook() {
        this._play((ctx, dest) => {
            const t = ctx.currentTime;
            this._noise(ctx, dest, t, 0.2, 0.25, 0, 3000);
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, t);
            osc.frequency.linearRampToValueAtTime(80, t + 0.2);
            g.gain.setValueAtTime(0.2, t);
            g.gain.linearRampToValueAtTime(0, t + 0.2);
            osc.connect(g); g.connect(dest);
            osc.start(t); osc.stop(t + 0.21);
        });
    }

    playFrostNova() {
        this._play((ctx, dest) => {
            const t = ctx.currentTime;
            this._noise(ctx, dest, t, 0.35, 0.22, 0, 3500);
            for (let i = 0; i < 5; i++) {
                const freq = 800 + i * 200;
                this._osc(ctx, dest, 'sine', freq, t + i * 0.04, 0.14, 0.1, 0);
            }
        });
    }

    playManaShield() {
        this._play((ctx, dest) => {
            const t = ctx.currentTime;
            this._osc(ctx, dest, 'sine', 660, t, 0.08, 0.18, 0);
            this._osc(ctx, dest, 'sine', 880, t + 0.05, 0.06, 0.15, 0);
            this._osc(ctx, dest, 'sine', 1100, t + 0.1, 0.04, 0.12, 0);
        });
    }

    playArcaneSurge() {
        this._play((ctx, dest) => {
            const t = ctx.currentTime;
            this._noise(ctx, dest, t, 0.15, 0.28, 0, 2200);
            this._osc(ctx, dest, 'sawtooth', 440, t, 0.15, 0.2, 0);
            this._osc(ctx, dest, 'sawtooth', 660, t + 0.04, 0.1, 0.15, 0);
            this._osc(ctx, dest, 'sawtooth', 880, t + 0.08, 0.07, 0.12, 0);
        });
    }

    playSprint() {
        this._play((ctx, dest) => {
            const t = ctx.currentTime;
            this._noise(ctx, dest, t, 0.1, 0.15, 0, 4000);
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, t);
            osc.frequency.linearRampToValueAtTime(700, t + 0.18);
            g.gain.setValueAtTime(0.12, t);
            g.gain.linearRampToValueAtTime(0, t + 0.18);
            osc.connect(g); g.connect(dest);
            osc.start(t); osc.stop(t + 0.19);
        });
    }

    playSmokeBomb() {
        this._play((ctx, dest) => {
            const t = ctx.currentTime;
            this._noise(ctx, dest, t, 0.3, 0.35, 0, 600);
            this._osc(ctx, dest, 'square', 80, t, 0.18, 0.15, 0);
        });
    }

    playShadowStep() {
        this._play((ctx, dest) => {
            const t = ctx.currentTime;
            this._noise(ctx, dest, t, 0.15, 0.3, 0, 5000);
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, t);
            osc.frequency.linearRampToValueAtTime(200, t + 0.18);
            g.gain.setValueAtTime(0.22, t);
            g.gain.linearRampToValueAtTime(0, t + 0.18);
            osc.connect(g); g.connect(dest);
            osc.start(t); osc.stop(t + 0.19);
        });
    }

    // Charged attacks
    playChargeFull() {
        this._play((ctx, dest) => {
            const t = ctx.currentTime;
            for (let i = 0; i < 4; i++) {
                this._osc(ctx, dest, 'sine', 440 + i * 110, t + i * 0.03, 0.07, 0.12, 0.04);
            }
        });
    }

    playExplosion() {
        this._play((ctx, dest) => {
            const t = ctx.currentTime;
            this._noise(ctx, dest, t, 0.5, 0.8, 0, 150);
            this._osc(ctx, dest, 'sawtooth', 60, t, 0.4, 0.5, 0.01);
            this._osc(ctx, dest, 'sawtooth', 90, t + 0.04, 0.3, 0.4, 0);
        });
    }

    // Boss phase transition
    playBossPhase() {
        this._play((ctx, dest) => {
            const t = ctx.currentTime;
            this._noise(ctx, dest, t, 0.6, 0.9, 0, 200);
            this._osc(ctx, dest, 'sawtooth', 50, t, 0.5, 0.7, 0.05);
            this._osc(ctx, dest, 'sawtooth', 80, t + 0.1, 0.4, 0.55, 0);
            this._osc(ctx, dest, 'square', 160, t + 0.3, 0.3, 0.3, 0);
        });
    }

    // Victory / Defeat
    playVictory() {
        this._play((ctx, dest) => {
            const t = ctx.currentTime;
            const notes = [523, 659, 784, 1047];
            notes.forEach((freq, i) => {
                this._osc(ctx, dest, 'sine', freq, t + i * 0.18, 0.35, 0.28, 0);
                this._osc(ctx, dest, 'triangle', freq * 1.5, t + i * 0.18, 0.1, 0.1, 0);
            });
        });
    }

    playDefeat() {
        this._play((ctx, dest) => {
            const t = ctx.currentTime;
            this._osc(ctx, dest, 'sawtooth', 200, t, 0.22, 0.3, 0.1);
            this._osc(ctx, dest, 'sawtooth', 150, t + 0.25, 0.2, 0.25, 0.05);
            this._osc(ctx, dest, 'sawtooth', 100, t + 0.5, 0.18, 0.22, 0);
        });
    }

    // Achievement unlock
    playAchievement() {
        this._play((ctx, dest) => {
            const t = ctx.currentTime;
            const notes = [523, 659, 784, 1047, 1319];
            notes.forEach((freq, i) => {
                this._osc(ctx, dest, 'sine', freq, t + i * 0.1, 0.3, 0.2, 0);
                if (i === notes.length - 1) {
                    this._osc(ctx, dest, 'triangle', freq, t + i * 0.1, 0.15, 0.1, 0.05);
                }
            });
        });
    }

    // UI
    playClick() {
        this._play((ctx, dest) => {
            const t = ctx.currentTime;
            this._osc(ctx, dest, 'sine', 800, t, 0.05, 0.08, 0);
            this._osc(ctx, dest, 'sine', 1200, t + 0.03, 0.03, 0.06, 0);
        });
    }

    playHover() {
        this._play((ctx, dest) => {
            const t = ctx.currentTime;
            this._osc(ctx, dest, 'sine', 600, t, 0.025, 0.04, 0);
        });
    }

    // Combo milestone
    playComboMilestone(level) {
        this._play((ctx, dest) => {
            const t = ctx.currentTime;
            const base = 400 + level * 80;
            this._osc(ctx, dest, 'sine', base, t, 0.15, 0.22, 0);
            this._osc(ctx, dest, 'sine', base * 1.5, t + 0.08, 0.1, 0.15, 0);
            this._noise(ctx, dest, t, 0.12, 0.18, 0, 2000);
        });
    }

    // Weapon-specific fire sounds dispatcher
    playWeaponFire(weaponType, isCharged = false) {
        if (isCharged) {
            switch (weaponType) {
                case 'SWORD': return this.playExplosion();
                case 'BOW': return this.playArrow();
                case 'STAFF': return this.playExplosion();
                case 'DAGGERS': return this.playDaggerThrow();
                case 'GREATSWORD': return this.playGreatswordSlam();
                case 'THUNDER_GAUNTLET': return this.playExplosion();
                default: return this.playHit();
            }
        }
        switch (weaponType) {
            case 'SWORD': return this.playSwordSwing();
            case 'BOW': return this.playArrow();
            case 'STAFF': return this.playStaffShot();
            case 'DAGGERS': return this.playDaggerThrow();
            case 'GREATSWORD': return this.playGreatswordSlam();
            case 'THUNDER_GAUNTLET': return this.playThunderGauntlet();
            default: return this.playSwordSwing();
        }
    }

    // Skill sounds dispatcher
    playSkillSound(skillId) {
        switch (skillId) {
            case 'battleCry': return this.playBattleCry();
            case 'ironWill': return this.playIronWill();
            case 'grapplingHook': return this.playGrapplingHook();
            case 'frostNova': return this.playFrostNova();
            case 'manaShield': return this.playManaShield();
            case 'arcaneSurge': return this.playArcaneSurge();
            case 'sprint': return this.playSprint();
            case 'smokeBomb': return this.playSmokeBomb();
            case 'shadowStep': return this.playShadowStep();
            default: return this.playClick();
        }
    }
}

// Singleton export
export const soundManager = new SoundManager();
