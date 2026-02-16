// GreatswordWeapon.js - Espadon avec identité visuelle raffinée et nuancée
import { WeaponBase } from './WeaponBase.js';
import { WEAPONS } from './weaponData.js';

export class GreatswordWeapon extends WeaponBase {
    constructor(scene, player) {
        super(scene, player, WEAPONS.GREATSWORD);
    }

    // Basic attack - vague de lame en croissant, plus fine et plus lisible
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
        const outerArc = this.scene.add.graphics();
        outerArc.lineStyle(2.8, 0xffb56a, 0.56);
        outerArc.beginPath();
        outerArc.arc(0, 0, data.size * 2.8, -0.92, 0.92);
        outerArc.strokePath();
        outerArc.rotation = angle;

        const midArc = this.scene.add.graphics();
        midArc.lineStyle(1.8, 0xffd7ac, 0.7);
        midArc.beginPath();
        midArc.arc(0, 0, data.size * 2.35, -0.82, 0.82);
        midArc.strokePath();
        midArc.rotation = angle;

        const innerArc = this.scene.add.graphics();
        innerArc.lineStyle(1.1, 0xfff0dd, 0.9);
        innerArc.beginPath();
        innerArc.arc(0, 0, data.size * 1.9, -0.72, 0.72);
        innerArc.strokePath();
        innerArc.rotation = angle;

        const spark = this.scene.add.circle(
            Math.cos(angle) * data.size * 2.35,
            Math.sin(angle) * data.size * 2.35,
            3.2,
            0xfff4e4,
            0.82
        );

        wave.add([outerArc, midArc, innerArc, spark]);

        this.scene.tweens.add({
            targets: [outerArc, midArc, innerArc],
            alpha: { from: 0.95, to: 0.42 },
            scaleX: { from: 0.95, to: 1.08 },
            scaleY: { from: 0.95, to: 1.08 },
            duration: 135,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.scene.tweens.add({
            targets: spark,
            alpha: { from: 0.9, to: 0.2 },
            scale: { from: 0.95, to: 1.65 },
            duration: 120,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    // Charged attack - Colossus Breaker
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

        this.scene.cameras.main.shake(220, 0.01);

        const boss = this.scene.boss;
        if (boss) {
            const nearest = Phaser.Geom.Line.GetNearestPoint(pathLine, { x: boss.x, y: boss.y });
            const distToPath = Phaser.Math.Distance.Between(boss.x, boss.y, nearest.x, nearest.y);

            if (distToPath <= charged.radius) {
                const finalDamage = charged.damage * (this.player.damageMultiplier || 1.0);
                boss.takeDamage(finalDamage);

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

        const laneSoft = this.scene.add.rectangle(cx, cy, length, width * 0.84, 0xffb566, 0.12)
            .setRotation(angle)
            .setDepth(144);
        const laneCore = this.scene.add.rectangle(cx, cy, length, width * 0.5, 0xffd7a6, 0.2)
            .setRotation(angle)
            .setDepth(145);

        const edgeLine = this.scene.add.graphics().setDepth(146);
        edgeLine.lineStyle(1.4, 0xffefd7, 0.68);
        edgeLine.lineBetween(pathLine.x1, pathLine.y1, pathLine.x2, pathLine.y2);

        const sweep = this.scene.add.graphics().setDepth(147);
        sweep.lineStyle(3, 0xfff0d4, 0.72);
        sweep.beginPath();
        sweep.arc(pathLine.x1, pathLine.y1, 36, angle - 0.88, angle + 0.88);
        sweep.strokePath();

        const impactRing = this.scene.add.circle(pathLine.x2, pathLine.y2, 26, 0xffd8a8, 0)
            .setStrokeStyle(2, 0xffefd7, 0.86)
            .setDepth(147);

        this.scene.tweens.add({
            targets: [laneSoft, laneCore, edgeLine],
            alpha: 0,
            scaleY: 1.2,
            duration: 240,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                laneSoft.destroy();
                laneCore.destroy();
                edgeLine.destroy();
            }
        });

        this.scene.tweens.add({
            targets: sweep,
            alpha: 0,
            angle: 18,
            duration: 230,
            ease: 'Sine.easeOut',
            onComplete: () => sweep.destroy()
        });

        this.scene.tweens.add({
            targets: impactRing,
            alpha: 0,
            scale: 1.9,
            duration: 280,
            ease: 'Cubic.easeOut',
            onComplete: () => impactRing.destroy()
        });

        for (let i = 0; i < 12; i++) {
            const t = i / 11;
            const px = Phaser.Math.Linear(pathLine.x1, pathLine.x2, t);
            const py = Phaser.Math.Linear(pathLine.y1, pathLine.y2, t);
            const ember = this.scene.add.circle(px, py, Phaser.Math.FloatBetween(1.7, 3.2), 0xffdfb6, 0.7).setDepth(148);

            this.scene.tweens.add({
                targets: ember,
                x: px + Math.cos(angle + Math.PI / 2) * Phaser.Math.Between(-10, 10),
                y: py + Math.sin(angle + Math.PI / 2) * Phaser.Math.Between(-10, 10),
                alpha: 0,
                scale: 0.35,
                duration: Phaser.Math.Between(140, 240),
                onComplete: () => ember.destroy()
            });
        }
    }
}
