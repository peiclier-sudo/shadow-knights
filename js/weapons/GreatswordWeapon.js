// GreatswordWeapon.js - Espadon with smoother slash-style animations
import { WeaponBase } from './WeaponBase.js';
import { WEAPONS } from './weaponData.js';

export class GreatswordWeapon extends WeaponBase {
    constructor(scene, player) {
        super(scene, player, WEAPONS.GREATSWORD);
    }

    // Basic attack - animated crescent shockwave
    fire(angle) {
        const data = this.data.projectile;
        const startX = this.player.x + Math.cos(angle) * 30;
        const startY = this.player.y + Math.sin(angle) * 30;

        this.createMuzzleFlash(startX, startY, this.data.color);

        const wave = this.scene.add.container(startX, startY).setDepth(150);
        this.createSmoothWaveVisual(wave, angle, data);

        wave.vx = Math.cos(angle) * data.speed;
        wave.vy = Math.sin(angle) * data.speed;
        wave.damage = data.damage;
        wave.range = data.range;
        wave.startX = startX;
        wave.startY = startY;
        wave.knockback = false;
        wave.knockbackForce = 0;
        wave.heavyKnockback = false;

        this.scene.projectiles.push(wave);
        this.addTrail(wave, data.color, data.size);
    }

    createSmoothWaveVisual(wave, angle, data) {
        const arc = this.scene.add.graphics();
        arc.lineStyle(5, data.color, 0.85);
        arc.beginPath();
        arc.arc(0, 0, data.size * 2.6, -0.85, 0.85);
        arc.strokePath();
        arc.rotation = angle;

        const innerGlow = this.scene.add.graphics();
        innerGlow.lineStyle(9, 0xffc47a, 0.28);
        innerGlow.beginPath();
        innerGlow.arc(0, 0, data.size * 2.1, -0.7, 0.7);
        innerGlow.strokePath();
        innerGlow.rotation = angle;

        const bladeShard = this.scene.add.triangle(
            Math.cos(angle) * data.size * 2.25,
            Math.sin(angle) * data.size * 2.25,
            0, -6,
            22, 0,
            0, 6,
            0xffd299,
            0.75
        );
        bladeShard.rotation = angle;

        wave.add([innerGlow, arc, bladeShard]);

        // Breathing animation for smoother feel
        this.scene.tweens.add({
            targets: [arc, innerGlow],
            alpha: { from: 0.9, to: 0.55 },
            duration: 120,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.scene.tweens.add({
            targets: bladeShard,
            scaleX: 1.25,
            scaleY: 0.88,
            alpha: { from: 0.8, to: 0.45 },
            duration: 150,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    // Charged attack - Colossus Breaker (directional finisher)
    executeChargedAttack(angle) {
        const charged = this.data.charged;

        const startX = this.player.x;
        const startY = this.player.y;
        const targetPoint = this.getClampedChargedTarget(
            startX + Math.cos(angle) * charged.maxRange,
            startY + Math.sin(angle) * charged.maxRange
        );

        const pathLine = new Phaser.Geom.Line(startX, startY, targetPoint.x, targetPoint.y);
        this.createColossusBreakerFX(pathLine, angle, charged);

        this.scene.tweens.add({
            targets: this.player,
            x: targetPoint.x,
            y: targetPoint.y,
            duration: 180,
            ease: 'Power2'
        });

        this.scene.cameras.main.shake(220, 0.012);

        const boss = this.scene.boss;
        if (boss) {
            const nearest = Phaser.Geom.Line.GetNearestPoint(pathLine, { x: boss.x, y: boss.y });
            const distToPath = Phaser.Math.Distance.Between(boss.x, boss.y, nearest.x, nearest.y);

            if (distToPath <= charged.radius) {
                const finalDamage = charged.damage * (this.player.damageMultiplier || 1.0);
                boss.takeDamage(finalDamage);
                this.gainUltimateGaugeFromDamage(finalDamage, { charged: true });

                if (charged.stun) {
                    boss.stunned = true;
                    boss.setTint(0xffc266);
                    this.scene.time.delayedCall(charged.stunDuration, () => {
                        if (!boss.scene) return;
                        boss.stunned = false;
                        boss.clearTint();
                    });
                }

                const push = 140;
                this.scene.tweens.add({
                    targets: boss,
                    x: boss.x + Math.cos(angle) * push,
                    y: boss.y + Math.sin(angle) * push,
                    duration: 180,
                    ease: 'Power2'
                });
            }
        }
    }

    createColossusBreakerFX(pathLine, angle, charged) {
        const width = charged.radius * 2;
        const length = Phaser.Geom.Line.Length(pathLine);
        const cx = (pathLine.x1 + pathLine.x2) * 0.5;
        const cy = (pathLine.y1 + pathLine.y2) * 0.5;

        const trailCore = this.scene.add.rectangle(cx, cy, length, width * 0.72, 0xffb566, 0.2)
            .setRotation(angle)
            .setDepth(145);

        const trailEdge = this.scene.add.rectangle(cx, cy, length, width * 1.05, 0xffa13d, 0)
            .setStrokeStyle(3, 0xffd9a3, 0.65)
            .setRotation(angle)
            .setDepth(144);

        const sweep = this.scene.add.graphics().setDepth(146);
        sweep.lineStyle(7, 0xffe3be, 0.85);
        sweep.beginPath();
        sweep.arc(pathLine.x1, pathLine.y1, 34, angle - 0.9, angle + 0.9);
        sweep.strokePath();

        const impactRing = this.scene.add.circle(pathLine.x2, pathLine.y2, 28, 0xffc680, 0)
            .setStrokeStyle(3, 0xffe4c0, 0.9)
            .setDepth(146);

        this.scene.tweens.add({
            targets: [trailCore, trailEdge],
            alpha: 0,
            scaleY: 1.22,
            duration: 240,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                trailCore.destroy();
                trailEdge.destroy();
            }
        });

        this.scene.tweens.add({
            targets: sweep,
            alpha: 0,
            angle: 24,
            duration: 230,
            ease: 'Sine.easeOut',
            onComplete: () => sweep.destroy()
        });

        this.scene.tweens.add({
            targets: impactRing,
            alpha: 0,
            scale: 1.8,
            duration: 280,
            ease: 'Cubic.easeOut',
            onComplete: () => impactRing.destroy()
        });

        // Soft slash embers along path
        for (let i = 0; i < 9; i++) {
            const t = i / 8;
            const px = Phaser.Math.Linear(pathLine.x1, pathLine.x2, t);
            const py = Phaser.Math.Linear(pathLine.y1, pathLine.y2, t);
            const ember = this.scene.add.circle(px, py, Phaser.Math.FloatBetween(2, 4), 0xffca8a, 0.65).setDepth(147);

            this.scene.tweens.add({
                targets: ember,
                x: px + Math.cos(angle + Math.PI / 2) * Phaser.Math.Between(-12, 12),
                y: py + Math.sin(angle + Math.PI / 2) * Phaser.Math.Between(-12, 12),
                alpha: 0,
                scale: 0.35,
                duration: Phaser.Math.Between(140, 240),
                onComplete: () => ember.destroy()
            });
        }
    }
}
