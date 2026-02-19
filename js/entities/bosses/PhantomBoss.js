// PhantomBoss.js – Fourth boss: PHANTOM (The Echo Wraith)
//
// Attack cycle: ECHO → BLINK → ECHO → CAGE → repeat
//   ECHO  : fires spectral bolt(s) at player, then a ghost echo repeats from an offset
//           position 1.4 s later – dodge twice per cycle
//   BLINK : boss vanishes and reappears 150 px to the player's flank, then fires
//           3 (→5) bolts from its new position
//   CAGE  : releases 8 (→12) bolts radially outward – dash through the gaps or
//           stand near the center; phase-2 adds a returning inward ring
//
// Movement: slow sinusoidal drift (ghost floating feel)
// Phase 2  : faster cooldowns, 3-way ECHO, more BLINK shots, denser CAGE
import { Boss } from '../Boss.js';

export class PhantomBoss extends Boss {
    constructor(scene) {
        super(scene, 4);
        this.phaseTransitioned = false;
        this.cycle      = ['ECHO', 'BLINK', 'ECHO', 'CAGE'];
        this.cycleIndex = 0;
        this._driftAngle = 0;
    }

    // ── Main attack dispatcher ──────────────────────────────────────────────
    attack(player) {
        if (this.isAttacking || this.frozen) return;

        if (this.health <= this.maxHealth * 0.5 && !this.phaseTransitioned) {
            this.phaseTransitioned = true;
            this.triggerPhaseTransition();
        }

        const phase2 = this.health <= this.maxHealth * 0.5;
        const type   = this.cycle[this.cycleIndex % this.cycle.length];
        this.cycleIndex++;

        this.isAttacking = true;
        this.body?.setVelocity(0, 0);

        if (type === 'ECHO')  this._echo(player, phase2);
        if (type === 'BLINK') this._blink(player, phase2);
        if (type === 'CAGE')  this._cage(player, phase2);
    }

    // ── ECHO – main bolt + delayed ghost echo ──────────────────────────────
    _echo(player, phase2) {
        // Echo fires from 130 px to the player's left-flank
        const echoAngle = Math.atan2(player.y - this.y, player.x - this.x) + Math.PI * 0.6;
        const echoX     = this.x + Math.cos(echoAngle) * 130;
        const echoY     = this.y + Math.sin(echoAngle) * 130;

        // Ghost silhouette at echo origin
        const ghost = this.scene.add.ellipse(echoX, echoY, 44, 64, 0x00ffcc, 0.14)
            .setStrokeStyle(2, 0x33ffee, 0.30).setDepth(100);
        const eyeL  = this.scene.add.circle(echoX - 8, echoY - 8, 4, 0x00ffcc, 0.30).setDepth(101);
        const eyeR  = this.scene.add.circle(echoX + 8, echoY - 8, 4, 0x00ffcc, 0.30).setDepth(101);

        const ghostTween = this.scene.tweens.add({
            targets: [ghost, eyeL, eyeR], alpha: 0.05, duration: 480, yoyo: true, repeat: 2,
            onComplete: () => { ghost.destroy(); eyeL.destroy(); eyeR.destroy(); }
        });

        // Boss charge-up glow
        const chargeGlow = this.scene.add.circle(this.x, this.y, 50, 0x00ffcc, 0.40).setDepth(100);
        this.scene.tweens.add({ targets: chargeGlow, scale: 1.8, alpha: 0, duration: 620, onComplete: () => chargeGlow.destroy() });

        this.scene.time.delayedCall(620, () => {
            if (this.frozen) { this.isAttacking = false; return; }

            const baseAngle = Math.atan2(player.y - this.y, player.x - this.x);
            const offsets   = phase2 ? [-0.28, 0, 0.28] : [0];
            offsets.forEach(off => this._spawnBolt(this.x, this.y, baseAngle + off, 0x00ffcc, 345, false));
            this.isAttacking = false;

            // Delayed echo burst from ghost position
            this.scene.time.delayedCall(1400, () => {
                if (!this.scene?.bossProjectiles) return;

                // Echo warning pulse
                const pulse = this.scene.add.circle(echoX, echoY, 26, 0x66ffee, 0.55).setDepth(101);
                this.scene.tweens.add({ targets: pulse, scale: 2.4, alpha: 0, duration: 320, onComplete: () => pulse.destroy() });

                this.scene.time.delayedCall(320, () => {
                    if (!this.scene?.bossProjectiles) return;
                    const ea = Math.atan2(player.y - echoY, player.x - echoX);
                    offsets.forEach(off => this._spawnBolt(echoX, echoY, ea + off, 0x66ffee, 265, true));
                });
            });
        });
    }

    // ── BLINK – teleport to flank, then volley ──────────────────────────────
    _blink(player, phase2) {
        // Choose a flank position ~150 px from player at 90–150° offset
        const baseAngle  = Math.atan2(this.y - player.y, this.x - player.x);
        const blinkAngle = baseAngle + (Math.random() > 0.5 ? 1 : -1) * (Math.PI * 0.55 + Math.random() * 0.5);
        const blinkDist  = 150 + Math.random() * 60;
        const destX      = Phaser.Math.Clamp(player.x + Math.cos(blinkAngle) * blinkDist, 80, this.scene.cameras.main.width  - 80);
        const destY      = Phaser.Math.Clamp(player.y + Math.sin(blinkAngle) * blinkDist, 80, this.scene.cameras.main.height - 80);

        // Vanish
        this.scene.tweens.add({ targets: this, alpha: 0, duration: 260,
            onComplete: () => {
                // Ghost trail at original position
                const trail = this.scene.add.ellipse(this.x, this.y, 50, 80, 0x00ffcc, 0.25).setDepth(100);
                this.scene.tweens.add({ targets: trail, alpha: 0, scale: 1.6, duration: 400, onComplete: () => trail.destroy() });

                // Destination flash warning
                const destFlash = this.scene.add.circle(destX, destY, 30, 0x00ffcc, 0.45)
                    .setStrokeStyle(2, 0x66ffee, 0.9).setDepth(101);
                this.scene.tweens.add({ targets: destFlash, scale: 1.5, alpha: 0, duration: 320, onComplete: () => destFlash.destroy() });

                this.scene.time.delayedCall(340, () => {
                    if (!this.scene?.bossProjectiles) { this.alpha = 1; this.isAttacking = false; return; }

                    // Reappear at destination
                    this.x = destX;
                    this.y = destY;
                    this.scene.tweens.add({ targets: this, alpha: 1, duration: 180 });

                    // Reappear burst ring
                    const ring = this.scene.add.circle(this.x, this.y, 20, 0x00ffcc, 0.55).setDepth(102);
                    this.scene.tweens.add({ targets: ring, scale: 3.5, alpha: 0, duration: 350, onComplete: () => ring.destroy() });

                    // Fire volley at player
                    const shots = phase2 ? 5 : 3;
                    const spreadStep = 0.24;
                    const aim   = Math.atan2(player.y - this.y, player.x - this.x);
                    for (let i = 0; i < shots; i++) {
                        const off = (i - (shots - 1) / 2) * spreadStep;
                        this.scene.time.delayedCall(i * 90, () => {
                            if (!this.scene?.bossProjectiles) return;
                            this._spawnBolt(this.x, this.y, aim + off, 0x00ffcc, 320, false);
                        });
                    }
                    this.scene.time.delayedCall(shots * 90 + 60, () => { this.isAttacking = false; });
                });
            }
        });
    }

    // ── CAGE – radial bolt ring (dodge through gaps or stay central) ─────────
    _cage(player, phase2) {
        const count       = phase2 ? 12 : 8;
        const telegraphMs = phase2 ? 580 : 750;

        // Charge-up glow expanding ring
        const ring = this.scene.add.circle(this.x, this.y, 28, 0x00ffcc, 0.35)
            .setStrokeStyle(3, 0x33ffee, 0.8).setDepth(100);
        this.scene.tweens.add({ targets: ring, scale: 3.0, alpha: 0, duration: telegraphMs, onComplete: () => ring.destroy() });

        this.scene.time.delayedCall(telegraphMs, () => {
            if (this.frozen) { this.isAttacking = false; return; }

            // Outward ring
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 * i / count);
                this._spawnBolt(this.x, this.y, angle, 0x00ffcc, 195, false);
            }

            // Phase 2: 6 inward bolts fired from the ring circumference
            if (phase2) {
                const inwardR = 180;
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI * 2 * i / 6) + 0.26; // offset so they don't overlap outward
                    const fromX = this.x + Math.cos(angle) * inwardR;
                    const fromY = this.y + Math.sin(angle) * inwardR;
                    // Fires inward toward boss center
                    this.scene.time.delayedCall(200, () => {
                        if (!this.scene?.bossProjectiles) return;
                        this._spawnBolt(fromX, fromY, angle + Math.PI, 0x33ffee, 230, true);
                    });
                }
            }

            this.isAttacking = false;
        });
    }

    // ── Shared bolt spawn ───────────────────────────────────────────────────
    _spawnBolt(fromX, fromY, angle, color, speed, isEcho) {
        const radius = isEcho ? 6 : 9;
        const proj   = this.scene.add.circle(fromX, fromY, radius, color).setDepth(150);
        proj.vx      = Math.cos(angle) * speed;
        proj.vy      = Math.sin(angle) * speed;
        const glow   = this.scene.add.circle(fromX, fromY, isEcho ? 11 : 15, color, isEcho ? 0.18 : 0.28).setDepth(149);
        proj.glow    = glow;
        this.scene.bossProjectiles.push(proj);
    }

    // ── Phase transition flash ──────────────────────────────────────────────
    triggerPhaseTransition() {
        this._phaseCommonEffects();
        const cw = this.scene.cameras.main.width;
        const ch = this.scene.cameras.main.height;
        const flash = this.scene.add.rectangle(cw / 2, ch / 2, cw, ch, 0x00ffcc, 0.28)
            .setScrollFactor(0).setDepth(500);
        this.scene.tweens.add({ targets: flash, alpha: 0, duration: 650, onComplete: () => flash.destroy() });
        const label = this.scene.add.text(cw / 2, ch / 2, 'ECHO UNLEASHED!', {
            fontSize: '40px', fill: '#00ffcc', fontStyle: 'bold', stroke: '#000', strokeThickness: 5
        }).setOrigin(0.5).setScrollFactor(0).setDepth(501);
        this.scene.tweens.add({ targets: label, y: ch / 2 - 75, alpha: 0, duration: 1800, ease: 'Power2', onComplete: () => label.destroy() });
    }

    // ── Update: sinusoidal drift + cooldown override ────────────────────────
    update(time, player) {
        // Gentle ghost drift – oscillates perpendicular to player direction
        if (player && !this.frozen && !this.stunned && !this.isAttacking) {
            this._driftAngle += 0.018;
            const perpAngle = Math.atan2(player.y - this.y, player.x - this.x) + Math.PI / 2;
            const drift     = Math.sin(this._driftAngle) * 38;
            this.body?.setVelocity(Math.cos(perpAngle) * drift, Math.sin(perpAngle) * drift);
        } else if (this.isAttacking) {
            this.body?.setVelocity(0, 0);
        }

        const prev = this.nextAttackTime;
        super.update(time, player);
        if (this.nextAttackTime !== prev) {
            const phase2 = this.health <= this.maxHealth * 0.5;
            this.nextAttackTime = time + (phase2 ? 2100 : 3000);
        }
    }
}
