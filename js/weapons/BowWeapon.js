// BowWeapon.js - Arc avec flèches raffinées et pluie chargée cinématique
import { WeaponBase } from './WeaponBase.js';
import { WEAPONS } from './weaponData.js';

export class BowWeapon extends WeaponBase {
    constructor(scene, player) {
        super(scene, player, WEAPONS.BOW);
    }

    // Tir normal - Flèche élégante et trail léger
    fire(angle) {
        const data = this.data.projectile;
        const startX = this.player.x + Math.cos(angle) * 30;
        const startY = this.player.y + Math.sin(angle) * 30;

        this.createMuzzleFlash(startX, startY, this.data.color);

        const arrow = this.scene.add.container(startX, startY).setDepth(150);
        const body = this.scene.add.rectangle(0, 0, data.size * 2.6, data.size * 0.55, 0xa6efaa, 0.88);
        const bodyGlow = this.scene.add.rectangle(-data.size * 0.35, 0, data.size * 2.1, data.size * 0.9, 0x7edc84, 0.24);
        const tip = this.scene.add.triangle(data.size * 1.35, 0, 0, -3.2, 0, 3.2, 0xeffff0, 0.95);
        const tail = this.scene.add.triangle(-data.size * 1.2, 0, 0, -3, -4, 0, 0, 3, 0xc7ffc8, 0.7);

        body.rotation = angle;
        bodyGlow.rotation = angle;
        tip.rotation = angle;
        tail.rotation = angle;
        arrow.add([bodyGlow, body, tip, tail]);

        this.scene.tweens.add({
            targets: bodyGlow,
            alpha: { from: 0.28, to: 0.1 },
            scaleX: { from: 1, to: 1.24 },
            duration: 110,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        arrow.vx = Math.cos(angle) * data.speed;
        arrow.vy = Math.sin(angle) * data.speed;
        arrow.damage = data.damage;
        arrow.range = data.range;
        arrow.startX = startX;
        arrow.startY = startY;

        this.scene.projectiles.push(arrow);
        this.addTrail(arrow, data.color, data.size);
    }

    // Charged attack - Cataclysm Rain
    executeChargedAttack(angle) {
        const charged = this.data.charged;

        const targetPoint = this.getClampedChargedTarget(this.scene.worldMouseX, this.scene.worldMouseY);
        const centerX = targetPoint.x;
        const centerY = targetPoint.y;

        const marker = this.scene.add.circle(centerX, centerY, charged.radius * 0.48, 0x9deb9f, 0)
            .setStrokeStyle(2, 0xcaf8c7, 0.55)
            .setDepth(140);
        this.scene.tweens.add({
            targets: marker,
            scale: 2.1,
            alpha: 0,
            duration: 380,
            ease: 'Cubic.easeOut',
            onComplete: () => marker.destroy()
        });

        const waves = 6;
        const perWaveDamage = (charged.damage / waves) * (this.player.damageMultiplier || 1.0);

        for (let wave = 0; wave < waves; wave++) {
            this.scene.time.delayedCall(wave * 180, () => {
                const impacts = Math.ceil(charged.arrows / waves);
                for (let i = 0; i < impacts; i++) {
                    const rx = Phaser.Math.FloatBetween(-charged.radius, charged.radius);
                    const ry = Phaser.Math.FloatBetween(-charged.radius, charged.radius);
                    const x = centerX + rx;
                    const y = centerY + ry;
                    const drop = this.scene.add.container(x, y - Phaser.Math.Between(120, 190)).setDepth(155);

                    const shaft = this.scene.add.rectangle(0, 0, 2.5, 20, 0xa6efaa, 0.82);
                    const tip = this.scene.add.triangle(0, 10, -2, 0, 2, 0, 0, 6, 0xeffff0, 0.9);
                    const glow = this.scene.add.ellipse(0, 0, 8, 22, 0x84dc8a, 0.2);
                    drop.add([glow, shaft, tip]);

                    this.scene.tweens.add({
                        targets: drop,
                        y,
                        duration: 220,
                        ease: 'Cubic.easeIn',
                        onComplete: () => {
                            drop.destroy();
                            const impact = this.scene.add.circle(x, y, 10, 0xbef6ba, 0.48).setDepth(156);
                            this.scene.tweens.add({
                                targets: impact,
                                scale: 1.8,
                                alpha: 0,
                                duration: 180,
                                onComplete: () => impact.destroy()
                            });
                        }
                    });
                }

                const impactRing = this.scene.add.circle(centerX, centerY, charged.radius * (0.86 + wave * 0.03), 0x9ee7a2, 0.08).setDepth(120);
                impactRing.setStrokeStyle(1.6, 0xd6ffd3, 0.35);
                this.scene.tweens.add({
                    targets: impactRing,
                    alpha: 0,
                    scale: 1.08,
                    duration: 180,
                    onComplete: () => impactRing.destroy()
                });

                const boss = this.scene.boss;
                if (!boss) return;

                const distToBoss = Phaser.Math.Distance.Between(centerX, centerY, boss.x, boss.y);
                if (distToBoss <= charged.radius) {
                    boss.takeDamage(perWaveDamage);
                }
            });
        }
    }
}
