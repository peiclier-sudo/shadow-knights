// GunnerBoss.js – Second boss: GUNNER (The Relentless)
//
// Attack cycle: SPREAD → BURST → SPREAD → LASER → repeat
//   SPREAD : 5-way (→7-way) fan shot aimed at player
//   BURST  : 3 (→5) rapid single shots with short intervals – track and dodge each
//   LASER  : telegraphed beam that sweeps ±20° (→±30°) – move out of the arc
//
// Movement: kites player, keeps 200–360 px distance
// Phase 2  : wider spread, more burst shots, faster + wider laser sweep
import { Boss } from '../Boss.js';

export class GunnerBoss extends Boss {
    constructor(scene) {
        super(scene, 2);
        this.phaseTransitioned = false;
        this.cycle      = ['SPREAD', 'BURST', 'SPREAD', 'LASER'];
        this.cycleIndex = 0;
    }

    // ── Main attack dispatcher ──────────────────────────────────────────────
    attack(player) {
        if (this.isAttacking || this.frozen) return;

        if (this.health <= this.maxHealth * 0.5 && !this.phaseTransitioned) {
            this.phaseTransitioned = true;
            this._phaseFlash('GATLING OVERDRIVE!', 0xff6600);
        }

        const phase2 = this.health <= this.maxHealth * 0.5;
        const type   = this.cycle[this.cycleIndex % this.cycle.length];
        this.cycleIndex++;

        this.isAttacking = true;
        this.body?.setVelocity(0, 0);

        if (type === 'SPREAD') this._spread(player, phase2);
        if (type === 'BURST')  this._burst(player, phase2);
        if (type === 'LASER')  this._laser(player, phase2);
    }

    // ── SPREAD – wide fan of projectiles ───────────────────────────────────
    _spread(player, phase2) {
        const count       = phase2 ? 7 : 5;
        const spreadStep  = 0.22;
        const telegraphMs = 520;

        const warn = this.scene.add.circle(this.x, this.y, 42, 0xff6600, 0.28)
            .setStrokeStyle(3, 0xff8833, 0.9).setDepth(100);
        this.scene.tweens.add({
            targets: warn, scale: 1.55, alpha: 0, duration: telegraphMs,
            onComplete: () => {
                warn.destroy();
                if (this.frozen) { this.isAttacking = false; return; }

                const baseAngle = Math.atan2(player.y - this.y, player.x - this.x);
                for (let i = 0; i < count; i++) {
                    const off = (i - (count - 1) / 2) * spreadStep;
                    this._spawnProjectile(this.x, this.y, baseAngle + off, 360);
                }
                this.isAttacking = false;
            }
        });
    }

    // ── BURST – rapid sequential aimed shots ───────────────────────────────
    _burst(player, phase2) {
        const shots     = phase2 ? 5 : 3;
        const interval  = phase2 ? 190 : 270;

        for (let i = 0; i < shots; i++) {
            this.scene.time.delayedCall(i * interval, () => {
                if (this.frozen || !this.scene?.bossProjectiles) return;

                // Mini muzzle flash
                const flash = this.scene.add.circle(this.x, this.y, 18, 0xff8833, 0.60).setDepth(100);
                this.scene.tweens.add({ targets: flash, alpha: 0, scale: 1.5, duration: 130, onComplete: () => flash.destroy() });

                const angle = Math.atan2(player.y - this.y, player.x - this.x);
                this._spawnProjectile(this.x, this.y, angle, 430);

                if (i === shots - 1) this.isAttacking = false;
            });
        }
    }

    // ── LASER – slow sweeping beam that must be walked out of ───────────────
    _laser(player, phase2) {
        const telegraphMs  = phase2 ? 720 : 960;
        const sweepDurMs   = phase2 ? 700 : 480;
        const sweepTotal   = phase2 ? 0.70 : 0.44; // radians total arc
        const beamLen      = 650;
        const startAngle   = Math.atan2(player.y - this.y, player.x - this.x);

        // Faint aim line during telegraph
        const aimLine = this.scene.add.graphics().setDepth(100);
        aimLine.lineStyle(6, 0xff6600, 0.28);
        aimLine.lineBetween(
            this.x, this.y,
            this.x + Math.cos(startAngle) * beamLen,
            this.y + Math.sin(startAngle) * beamLen
        );
        const aimTween = this.scene.tweens.add({ targets: aimLine, alpha: 0.75, duration: 220, yoyo: true, repeat: -1 });

        this.scene.time.delayedCall(telegraphMs, () => {
            aimTween.stop();
            aimLine.destroy();
            if (this.frozen) { this.isAttacking = false; return; }

            // Sweeping beam
            const beam    = this.scene.add.graphics().setDepth(102);
            let elapsed   = 0;
            const step    = 40;
            let lastHit   = -999;

            const tick = () => {
                if (!this.scene?.bossProjectiles) { beam.destroy(); this.isAttacking = false; return; }

                elapsed += step;
                const progress  = Math.min(elapsed / sweepDurMs, 1);
                const curAngle  = (startAngle - sweepTotal / 2) + progress * sweepTotal;
                const endX      = this.x + Math.cos(curAngle) * beamLen;
                const endY      = this.y + Math.sin(curAngle) * beamLen;

                beam.clear();
                // Outer glow
                beam.lineStyle(18, 0xff6600, 0.30);
                beam.lineBetween(this.x, this.y, endX, endY);
                // Core beam
                beam.lineStyle(7, 0xffcc44, 0.92);
                beam.lineBetween(this.x, this.y, endX, endY);

                // Hit detection: within ~10° of beam axis
                if (!player.untargetable) {
                    const pa   = Math.atan2(player.y - this.y, player.x - this.x);
                    const diff = Math.abs(Phaser.Math.Angle.Wrap(pa - curAngle));
                    const dist = Phaser.Math.Distance.Between(player.x, player.y, this.x, this.y);
                    if (diff < 0.17 && dist < beamLen && elapsed - lastHit > 380 && !player.isInvulnerable) {
                        player.takeDamage(phase2 ? 12 : 10);
                        lastHit = elapsed;
                    }
                }

                if (progress < 1) {
                    this.scene.time.delayedCall(step, tick);
                } else {
                    beam.clear();
                    beam.destroy();
                    this.isAttacking = false;
                }
            };
            this.scene.time.delayedCall(step, tick);
        });
    }

    // ── Shared projectile spawn ─────────────────────────────────────────────
    _spawnProjectile(fromX, fromY, angle, speed) {
        const proj = this.scene.add.circle(fromX, fromY, 8, 0xff6600).setDepth(150);
        proj.vx = Math.cos(angle) * speed;
        proj.vy = Math.sin(angle) * speed;
        const glow = this.scene.add.circle(fromX, fromY, 14, 0xff6600, 0.30).setDepth(149);
        proj.glow = glow;
        this.scene.bossProjectiles.push(proj);
    }

    // ── Phase transition flash ──────────────────────────────────────────────
    _phaseFlash(text, color) {
        const cw = this.scene.cameras.main.width;
        const ch = this.scene.cameras.main.height;
        const flash = this.scene.add.rectangle(cw / 2, ch / 2, cw, ch, color, 0.32)
            .setScrollFactor(0).setDepth(500);
        this.scene.tweens.add({ targets: flash, alpha: 0, duration: 600, onComplete: () => flash.destroy() });
        const txt = this.scene.add.text(cw / 2, ch / 2, text, {
            fontSize: '38px', fill: '#ff8833', fontStyle: 'bold', stroke: '#000', strokeThickness: 5
        }).setOrigin(0.5).setScrollFactor(0).setDepth(501);
        this.scene.tweens.add({ targets: txt, y: ch / 2 - 70, alpha: 0, duration: 1600, onComplete: () => txt.destroy() });
    }

    // ── Update: kite movement + cooldown override ──────────────────────────
    update(time, player) {
        // Maintain distance from player when idle
        if (player && !this.frozen && !this.stunned && !this.isAttacking) {
            const dist  = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
            const angle = Math.atan2(this.y - player.y, this.x - player.x);
            if (dist < 200) {
                // Back away
                this.body?.setVelocity(Math.cos(angle) * 105, Math.sin(angle) * 105);
            } else if (dist > 360) {
                // Close in slightly
                this.scene.physics.moveTo(this, player.x, player.y, 58);
            } else {
                this.body?.setVelocity(0, 0);
            }
        } else if (this.isAttacking) {
            this.body?.setVelocity(0, 0);
        }

        const prev = this.nextAttackTime;
        super.update(time, player);
        if (this.nextAttackTime !== prev) {
            const phase2 = this.health <= this.maxHealth * 0.5;
            this.nextAttackTime = time + (phase2 ? 1900 : 2500);
        }
    }
}
