// SentinelBoss.js – First boss: SENTINEL (The Iron Warden)
//
// Attack cycle: SLASH → STOMP → SLASH → CHARGE → repeat
//   SLASH  : telegraphed directional cone swipe in front of boss
//   STOMP  : 3 (→5) warning circles erupt around the boss – dodge outward
//   CHARGE : boss dashes to player's position; phase-2 leaves shockwaves along path
//
// Movement: slowly walks toward player when idle, stops at ~140 px
// Phase 2  : faster cooldowns, 5 stomp zones, trail shockwaves on CHARGE
import { Boss } from '../Boss.js';

export class SentinelBoss extends Boss {
    constructor(scene) {
        super(scene, 1);
        this.phaseTransitioned = false;
        this.cycle      = ['SLASH', 'STOMP', 'SLASH', 'CHARGE'];
        this.cycleIndex = 0;
    }

    // ── Main attack dispatcher ──────────────────────────────────────────────
    attack(player) {
        if (this.isAttacking || this.frozen) return;

        if (this.health <= this.maxHealth * 0.5 && !this.phaseTransitioned) {
            this.phaseTransitioned = true;
            this._phaseFlash('BATTLE RAGE!', 0xff0051);
        }

        const phase2 = this.health <= this.maxHealth * 0.5;
        const type   = this.cycle[this.cycleIndex % this.cycle.length];
        this.cycleIndex++;

        this.isAttacking = true;
        this.body?.setVelocity(0, 0);

        if (type === 'SLASH')  this._slash(player, phase2);
        if (type === 'STOMP')  this._stomp(player, phase2);
        if (type === 'CHARGE') this._charge(player, phase2);
    }

    // ── SLASH – directional cone swipe ─────────────────────────────────────
    _slash(player, phase2) {
        const angle       = Math.atan2(player.y - this.y, player.x - this.x);
        const telegraphMs = phase2 ? 480 : 700;
        const range       = 155;

        const wx = this.x + Math.cos(angle) * 65;
        const wy = this.y + Math.sin(angle) * 65;

        const warn = this.scene.add.rectangle(wx, wy, range, 120, 0xff0051, 0.22)
            .setStrokeStyle(3, 0xff3366, 0.9).setRotation(angle).setDepth(100);

        this.scene.tweens.add({
            targets: warn, alpha: 0.50, duration: telegraphMs / 2,
            yoyo: true, repeat: 1,
            onComplete: () => {
                warn.destroy();
                if (this.frozen) { this.isAttacking = false; return; }

                const hit = this.scene.add.rectangle(wx, wy, range, 120, 0xff4477, 0.78)
                    .setRotation(angle).setDepth(101);

                const dist    = Phaser.Math.Distance.Between(player.x, player.y, this.x, this.y);
                const pa      = Math.atan2(player.y - this.y, player.x - this.x);
                const angDiff = Math.abs(Phaser.Math.Angle.Wrap(pa - angle));

                if (dist < range && angDiff < 0.65 && !player.isInvulnerable && !player.untargetable) {
                    player.takeDamage(phase2 ? 18 : 15);
                }

                this.scene.tweens.add({
                    targets: hit, alpha: 0, duration: 220,
                    onComplete: () => { hit.destroy(); this.isAttacking = false; }
                });
            }
        });
    }

    // ── STOMP – eruption zones around boss ─────────────────────────────────
    _stomp(player, phase2) {
        const count       = phase2 ? 5 : 3;
        const telegraphMs = phase2 ? 750 : 950;
        const warnings    = [];

        // Boss charge-up glow
        const glow = this.scene.add.circle(this.x, this.y, 54, 0xff0051, 0.30).setDepth(99);
        this.scene.tweens.add({ targets: glow, scale: 1.7, alpha: 0, duration: telegraphMs, onComplete: () => glow.destroy() });

        for (let i = 0; i < count; i++) {
            const ang = (Math.PI * 2 * i / count) + (Math.random() * 0.5 - 0.25);
            const d   = 70 + Math.random() * 110;
            const wx  = Phaser.Math.Clamp(this.x + Math.cos(ang) * d, 60, this.scene.cameras.main.width  - 60);
            const wy  = Phaser.Math.Clamp(this.y + Math.sin(ang) * d, 60, this.scene.cameras.main.height - 60);

            const w  = this.scene.add.circle(wx, wy, 40, 0xff3333, 0.18)
                .setStrokeStyle(3, 0xff5555, 0.80).setDepth(100);
            const tw = this.scene.tweens.add({ targets: w, alpha: 0.48, scale: 1.12, duration: 210, yoyo: true, repeat: -1 });
            warnings.push({ w, wx, wy, tw });
        }

        this.scene.time.delayedCall(telegraphMs, () => {
            if (this.frozen) {
                warnings.forEach(({ w, tw }) => { tw.stop(); w.destroy(); });
                this.isAttacking = false;
                return;
            }
            warnings.forEach(({ w, wx, wy, tw }) => {
                tw.stop();
                w.destroy();

                const impact = this.scene.add.circle(wx, wy, 42, 0xff5500, 0.82).setDepth(101);
                this.scene.tweens.add({ targets: impact, alpha: 0, scale: 1.55, duration: 290, onComplete: () => impact.destroy() });

                if (!player.untargetable) {
                    const dist = Phaser.Math.Distance.Between(player.x, player.y, wx, wy);
                    if (dist < 56 && !player.isInvulnerable) player.takeDamage(phase2 ? 14 : 12);
                }
            });
            this.isAttacking = false;
        });
    }

    // ── CHARGE – dash strike with optional trail shockwaves ─────────────────
    _charge(player, phase2) {
        const targetX     = player.x;
        const targetY     = player.y;
        const origX       = this.x;
        const origY       = this.y;
        const telegraphMs = phase2 ? 420 : 580;

        const line = this.scene.add.graphics().setDepth(99);
        line.lineStyle(4, 0xff3366, 0.50);
        line.lineBetween(this.x, this.y, targetX, targetY);

        const arrow = this.scene.add.circle(targetX, targetY, 24, 0xff0051, 0.22)
            .setStrokeStyle(3, 0xff3366, 0.80).setDepth(99);

        this.scene.tweens.add({
            targets: [line, arrow], alpha: 0, duration: telegraphMs,
            onComplete: () => {
                line.destroy(); arrow.destroy();
                if (this.frozen) { this.isAttacking = false; return; }

                this.scene.tweens.add({
                    targets: this, x: targetX, y: targetY,
                    duration: 190, ease: 'Power3',
                    onUpdate: () => {
                        const trail = this.scene.add.circle(this.x, this.y, 16, 0xff0051, 0.40).setDepth(98);
                        this.scene.tweens.add({ targets: trail, alpha: 0, scale: 0.3, duration: 240, onComplete: () => trail.destroy() });
                    },
                    onComplete: () => {
                        const dist = Phaser.Math.Distance.Between(player.x, player.y, this.x, this.y);
                        if (dist < 72 && !player.isInvulnerable && !player.untargetable) {
                            player.takeDamage(phase2 ? 22 : 18);
                        }

                        // Phase 2: shockwave circles at 33% and 66% of the dash path
                        if (phase2) {
                            [0.33, 0.66].forEach(t => {
                                const sx = origX + (targetX - origX) * t;
                                const sy = origY + (targetY - origY) * t;
                                const shock = this.scene.add.circle(sx, sy, 36, 0xff0051, 0.55).setDepth(100);
                                this.scene.tweens.add({ targets: shock, alpha: 0, scale: 1.6, duration: 380, onComplete: () => shock.destroy() });
                                if (!player.untargetable) {
                                    const sd = Phaser.Math.Distance.Between(player.x, player.y, sx, sy);
                                    if (sd < 48 && !player.isInvulnerable) player.takeDamage(8);
                                }
                            });
                        }
                        this.isAttacking = false;
                    }
                });
            }
        });
    }

    // ── Phase transition flash ──────────────────────────────────────────────
    _phaseFlash(text, color) {
        this.triggerPhaseTransition(text, color);
    }

    // ── Update: movement + cooldown override ───────────────────────────────
    update(time, player) {
        // Slowly walk toward player when idle
        if (player && !this.frozen && !this.stunned) {
            if (!this.isAttacking) {
                const dist  = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
                const speed = this.health <= this.maxHealth * 0.5 ? 78 : 52;
                if (dist > 140) {
                    this.scene.physics.moveTo(this, player.x, player.y, speed);
                } else {
                    this.body?.setVelocity(0, 0);
                }
            } else {
                this.body?.setVelocity(0, 0);
            }
        }

        const prev = this.nextAttackTime;
        super.update(time, player);
        if (this.nextAttackTime !== prev) {
            const phase2 = this.health <= this.maxHealth * 0.5;
            this.nextAttackTime = time + (phase2 ? 1700 : 2300);
        }
    }
}
