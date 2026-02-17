// SwordWeapon.js - Procedural sword VFX with smoother badass blade projection
import { WeaponBase } from './WeaponBase.js';
import { WEAPONS } from './weaponData.js';

export class SwordWeapon extends WeaponBase {
    constructor(scene, player) {
        super(scene, player, WEAPONS.SWORD);
    }

    fire(angle) {
        const data = this.data.projectile;
        const startX = this.player.x + Math.cos(angle) * 30;
        const startY = this.player.y + Math.sin(angle) * 30;

        this.createMuzzleFlash(startX, startY, this.data.color);
        this.createSlashCastFX(startX, startY, angle, data);

        const slash = this.scene.add.container(startX, startY).setDepth(150);

        const bladeGlow = this.scene.add.rectangle(0, 0, data.size * 3.1, data.size * 0.95, 0xffb84d, 0.28);
        const bladeCore = this.scene.add.rectangle(0, 0, data.size * 2.45, data.size * 0.45, 0xfff2d3, 0.95);
        const bladeEdge = this.scene.add.rectangle(data.size * 1.22, 0, data.size * 0.85, data.size * 0.26, 0xffffff, 0.92);
        const guard = this.scene.add.rectangle(-data.size * 0.95, 0, data.size * 0.65, data.size * 0.55, 0xffa645, 0.78);

        const arc = this.scene.add.graphics();
        arc.lineStyle(3, 0xffd07f, 0.82);
        arc.beginPath();
        arc.arc(0, 0, data.size * 2.55, -0.7, 0.7);
        arc.strokePath();

        slash.rotation = angle;
        slash.add([bladeGlow, bladeCore, bladeEdge, guard, arc]);

        this.scene.tweens.add({
            targets: [bladeGlow, bladeCore],
            alpha: { from: 0.95, to: 0.62 },
            scaleX: { from: 1, to: 1.08 },
            duration: 90,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        slash.vx = Math.cos(angle) * data.speed;
        slash.vy = Math.sin(angle) * data.speed;
        slash.damage = data.damage;
        slash.range = data.range;
        slash.startX = startX;
        slash.startY = startY;
        slash.piercing = data.piercing;
        slash.hasHit = false;
        slash.visualAngle = angle;

        slash.update = () => {
            if (!slash.scene) return;

            const targetAngle = Math.atan2(slash.vy, slash.vx);
            slash.visualAngle = Phaser.Math.Angle.RotateTo(slash.visualAngle, targetAngle, 0.24);
            slash.rotation = slash.visualAngle;

            if (Math.random() > 0.6) {
                this.spawnSwordSpark(slash.x, slash.y, slash.visualAngle);
            }
            if (Math.random() > 0.72) {
                this.spawnBladeGhost(slash.x, slash.y, slash.visualAngle, data.size);
            }
        };

        slash.on('destroy', () => {
            bladeGlow.destroy();
            bladeCore.destroy();
            bladeEdge.destroy();
            guard.destroy();
            arc.destroy();
        });

        this.scene.projectiles.push(slash);
        this.addTrail(slash, data.color, data.size);
    }

    executeChargedAttack(angle) {
        const charged = this.data.charged;

        const startX = this.player.x + Math.cos(angle) * 40;
        const startY = this.player.y + Math.sin(angle) * 40;
        const endX = startX + Math.cos(angle) * charged.length;
        const endY = startY + Math.sin(angle) * charged.length;

        let hasHit = false;

        const beamAura = this.scene.add.graphics().setDepth(160);
        beamAura.lineStyle(charged.width * 3.1, 0xff9f2f, 0.24);
        beamAura.lineBetween(startX, startY, endX, endY);

        const beamCore = this.scene.add.graphics().setDepth(161);
        beamCore.lineStyle(charged.width, 0xfff0c9, 0.98);
        beamCore.lineBetween(startX, startY, endX, endY);

        const beamEdge = this.scene.add.graphics().setDepth(162);
        beamEdge.lineStyle(2.5, 0xffffff, 0.88);
        beamEdge.lineBetween(startX, startY, endX, endY);

        const crackleA = this.scene.add.graphics().setDepth(163);
        const crackleB = this.scene.add.graphics().setDepth(163);
        this.drawCrackleLine(crackleA, startX, startY, endX, endY, 0xfff3d2, 0.72, 5);
        this.drawCrackleLine(crackleB, startX, startY, endX, endY, 0xffc87d, 0.52, 9);

        [beamAura, beamCore, beamEdge, crackleA, crackleB].forEach(v => { v.alpha = 0; });

        this.scene.tweens.add({
            targets: [beamAura, beamCore, beamEdge, crackleA, crackleB],
            alpha: 1,
            duration: 40,
            onComplete: () => {
                if (!hasHit) {
                    this.checkLaserHit(startX, startY, endX, endY, angle, charged);
                    hasHit = true;
                }

                this.scene.tweens.add({
                    targets: [beamAura, beamCore, beamEdge, crackleA, crackleB],
                    alpha: 0,
                    duration: 170,
                    delay: 70,
                    onComplete: () => {
                        beamAura.destroy();
                        beamCore.destroy();
                        beamEdge.destroy();
                        crackleA.destroy();
                        crackleB.destroy();
                    }
                });
            }
        });

        this.spawnBeamParticles(startX, startY, angle, charged);
    }

    checkLaserHit(startX, startY, endX, endY, angle, charged) {
        const boss = this.scene.boss;
        if (!boss) return;

        const dx = endX - startX;
        const dy = endY - startY;
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length === 0) return;

        const unitX = dx / length;
        const unitY = dy / length;
        const toBossX = boss.x - startX;
        const toBossY = boss.y - startY;

        const t = (toBossX * unitX + toBossY * unitY) / length;
        if (t < 0 || t > 1) return;

        const projX = startX + unitX * (t * length);
        const projY = startY + unitY * (t * length);
        const perpDist = Phaser.Math.Distance.Between(boss.x, boss.y, projX, projY);

        if (perpDist < 50) {
            const finalDamage = charged.damage * (this.player.damageMultiplier || 1.0);
            boss.takeDamage(finalDamage);

            if (charged.knockback) {
                this.scene.tweens.add({
                    targets: boss,
                    x: boss.x + Math.cos(angle) * 175,
                    y: boss.y + Math.sin(angle) * 175,
                    duration: 180,
                    ease: 'Power2'
                });
            }

            const impact = this.scene.add.circle(boss.x, boss.y, 28, 0xffb566, 0.78).setDepth(170);
            const ring1 = this.scene.add.circle(boss.x, boss.y, 16, 0xffefcb, 0)
                .setStrokeStyle(3, 0xffefcb, 0.95)
                .setDepth(171);
            const ring2 = this.scene.add.circle(boss.x, boss.y, 24, 0xff9f3a, 0)
                .setStrokeStyle(2, 0xff9f3a, 0.7)
                .setDepth(170);

            this.scene.tweens.add({
                targets: [impact, ring1, ring2],
                alpha: 0,
                scale: 2.15,
                duration: 300,
                onComplete: () => {
                    impact.destroy();
                    ring1.destroy();
                    ring2.destroy();
                }
            });
        }
    }

    createSlashCastFX(x, y, angle, data) {
        const castArc = this.scene.add.graphics().setDepth(158);
        castArc.lineStyle(3, 0xffd89b, 0.84);
        castArc.beginPath();
        castArc.arc(x, y, data.size * 2.5, angle - 1.02, angle + 1.02);
        castArc.strokePath();

        const flash = this.scene.add.circle(x, y, 14, 0xfff0ce, 0.62).setDepth(159);

        this.scene.tweens.add({
            targets: [castArc, flash],
            alpha: 0,
            scale: 1.3,
            duration: 145,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                castArc.destroy();
                flash.destroy();
            }
        });

        for (let i = 0; i < 8; i++) {
            const spark = this.scene.add.circle(
                x + Phaser.Math.Between(-10, 10),
                y + Phaser.Math.Between(-10, 10),
                Phaser.Math.FloatBetween(1.8, 3.8),
                Phaser.Math.RND.pick([0xfff2d4, 0xffd79c, 0xffb55a]),
                0.88
            ).setDepth(159);

            this.scene.tweens.add({
                targets: spark,
                x: spark.x + Math.cos(angle + Phaser.Math.FloatBetween(-0.5, 0.5)) * Phaser.Math.Between(20, 36),
                y: spark.y + Math.sin(angle + Phaser.Math.FloatBetween(-0.5, 0.5)) * Phaser.Math.Between(20, 36),
                alpha: 0,
                duration: Phaser.Math.Between(90, 170),
                onComplete: () => spark.destroy()
            });
        }
    }

    spawnSwordSpark(x, y, angle) {
        const spark = this.scene.add.circle(
            x + Phaser.Math.Between(-5, 5),
            y + Phaser.Math.Between(-5, 5),
            Phaser.Math.FloatBetween(1.5, 3),
            Phaser.Math.RND.pick([0xffefcb, 0xffd89b, 0xffb861]),
            0.9
        ).setDepth(156);

        this.scene.tweens.add({
            targets: spark,
            x: spark.x + Math.cos(angle + Phaser.Math.FloatBetween(-0.35, 0.35)) * Phaser.Math.Between(12, 24),
            y: spark.y + Math.sin(angle + Phaser.Math.FloatBetween(-0.35, 0.35)) * Phaser.Math.Between(12, 24),
            alpha: 0,
            scale: 0.3,
            duration: Phaser.Math.Between(80, 145),
            onComplete: () => spark.destroy()
        });
    }

    spawnBladeGhost(x, y, angle, size) {
        const ghost = this.scene.add.rectangle(x, y, size * 2.4, size * 0.4, 0xffd49a, 0.2).setDepth(148);
        ghost.rotation = angle;
        this.scene.tweens.add({
            targets: ghost,
            alpha: 0,
            scaleX: 0.6,
            duration: 120,
            onComplete: () => ghost.destroy()
        });
    }

    drawCrackleLine(graphics, x1, y1, x2, y2, color, alpha, variance = 6) {
        graphics.clear();
        graphics.lineStyle(2.3, color, alpha);
        graphics.beginPath();

        const segments = 18;
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = Phaser.Math.Linear(x1, x2, t);
            const y = Phaser.Math.Linear(y1, y2, t) + Phaser.Math.Between(-variance, variance);
            if (i === 0) graphics.moveTo(x, y);
            else graphics.lineTo(x, y);
        }

        graphics.strokePath();
    }

    spawnBeamParticles(startX, startY, angle, charged) {
        for (let i = 0; i < 20; i++) {
            const dist = i * (charged.length / 20);
            const px = startX + Math.cos(angle) * dist;
            const py = startY + Math.sin(angle) * dist;

            const spark = this.scene.add.circle(
                px,
                py,
                Phaser.Math.FloatBetween(1.8, 3.8),
                Phaser.Math.RND.pick([0xfff0d0, 0xffd08a, 0xffa84a]),
                0.84
            ).setDepth(163);

            this.scene.tweens.add({
                targets: spark,
                x: px + Math.cos(angle + Math.PI / 2) * Phaser.Math.Between(-16, 16),
                y: py + Math.sin(angle + Math.PI / 2) * Phaser.Math.Between(-16, 16),
                alpha: 0,
                scale: 0.35,
                duration: Phaser.Math.Between(100, 200),
                onComplete: () => spark.destroy()
            });
        }
    }
}
