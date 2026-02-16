// DaggerWeapon.js - Dagues avec éventail raffiné et nuage toxique animé
import { WeaponBase } from './WeaponBase.js';
import { WEAPONS } from './weaponData.js';

export class DaggerWeapon extends WeaponBase {
    constructor(scene, player) {
        super(scene, player, WEAPONS.DAGGERS);
    }

    // Tir normal - 3 dagues en éventail
    fire(angle) {
        const data = this.data.projectile;

        for (let i = 0; i < data.count; i++) {
            const offset = (i - (data.count - 1) / 2) * data.spread;
            this.createDagger(angle + offset, data, i - 1);
        }

        this.createMuzzleFlash(this.player.x, this.player.y, this.data.color);
    }

    createDagger(angle, data, fanIndex = 0) {
        const startX = this.player.x + Math.cos(angle) * 30;
        const startY = this.player.y + Math.sin(angle) * 30;

        const dagger = this.scene.add.container(startX, startY).setDepth(150);
        const blade = this.scene.add.triangle(0, 0, -data.size * 0.9, -data.size * 0.58, data.size * 1.25, 0, -data.size * 0.9, data.size * 0.58, 0xe8d2f0, 0.88);
        const edge = this.scene.add.triangle(0, 0, -data.size * 0.8, -data.size * 0.22, data.size * 1.0, 0, -data.size * 0.8, data.size * 0.22, 0xffffff, 0.55);
        const aura = this.scene.add.ellipse(-data.size * 0.1, 0, data.size * 2.2, data.size * 1.25, data.color, 0.22);

        dagger.add([aura, blade, edge]);
        dagger.rotation = angle;

        this.scene.tweens.add({
            targets: aura,
            alpha: { from: 0.24, to: 0.08 },
            scaleX: { from: 1, to: 1.2 },
            scaleY: { from: 1, to: 0.9 },
            duration: 120,
            yoyo: true,
            repeat: -1,
            delay: Math.abs(fanIndex) * 20,
            ease: 'Sine.easeInOut'
        });

        dagger.vx = Math.cos(angle) * data.speed;
        dagger.vy = Math.sin(angle) * data.speed;
        dagger.damage = data.damage;
        dagger.range = data.range;
        dagger.startX = startX;
        dagger.startY = startY;

        this.scene.projectiles.push(dagger);
        this.addTrail(dagger, data.color, data.size);
    }

    // Attaque chargée - Nuage de poison (directionnel)
    executeChargedAttack(angle) {
        const charged = this.data.charged;

        const targetPoint = this.getClampedChargedTarget(this.scene.worldMouseX, this.scene.worldMouseY);
        const cloudX = targetPoint.x;
        const cloudY = targetPoint.y;

        const cloud = this.scene.add.container(cloudX, cloudY).setDepth(148);
        const fogBack = this.scene.add.circle(0, 0, charged.radius * 0.95, 0x5c8b67, 0.18);
        const fogFront = this.scene.add.circle(0, 0, charged.radius * 0.75, 0x8fc28f, 0.2);
        const toxicRing = this.scene.add.circle(0, 0, charged.radius * 0.82, 0x9ad58f, 0).setStrokeStyle(2, 0xb9f4ab, 0.45);
        cloud.add([fogBack, fogFront, toxicRing]);

        this.scene.tweens.add({
            targets: [fogBack, fogFront],
            alpha: { from: 0.16, to: 0.28 },
            scaleX: { from: 0.92, to: 1.08 },
            scaleY: { from: 0.92, to: 1.08 },
            duration: 380,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.scene.tweens.add({
            targets: toxicRing,
            rotation: Math.PI * 2,
            duration: 1200,
            repeat: -1,
            ease: 'Linear'
        });

        let tickCount = 0;
        const timer = this.scene.time.addEvent({
            delay: charged.tickRate,
            loop: true,
            callback: () => {
                const boss = this.scene.boss;
                if (!cloud.scene || tickCount >= charged.ticks || !boss?.scene) {
                    timer.remove(false);
                    this.scene.tweens.add({
                        targets: cloud,
                        alpha: 0,
                        scale: 1.2,
                        duration: 200,
                        onComplete: () => cloud.destroy()
                    });
                    return;
                }

                // particules toxiques flottantes
                for (let i = 0; i < 5; i++) {
                    const a = Phaser.Math.FloatBetween(0, Math.PI * 2);
                    const r = Phaser.Math.FloatBetween(charged.radius * 0.2, charged.radius * 0.9);
                    const mote = this.scene.add.circle(
                        cloudX + Math.cos(a) * r,
                        cloudY + Math.sin(a) * r,
                        Phaser.Math.FloatBetween(1.8, 3.4),
                        0xc6ffb7,
                        0.6
                    ).setDepth(149);
                    this.scene.tweens.add({
                        targets: mote,
                        y: mote.y - Phaser.Math.Between(8, 18),
                        x: mote.x + Phaser.Math.Between(-8, 8),
                        alpha: 0,
                        duration: Phaser.Math.Between(180, 300),
                        onComplete: () => mote.destroy()
                    });
                }

                const distToBoss = Phaser.Math.Distance.Between(cloudX, cloudY, boss.x, boss.y);
                if (distToBoss < charged.radius) {
                    const tickDamage = (charged.damage / charged.ticks) * (this.player.damageMultiplier || 1.0);
                    boss.takeDamage(tickDamage);
                    boss.setTint(0x95d892);

                    if (charged.slow) {
                        boss.slowed = true;
                    }

                    this.scene.time.delayedCall(120, () => {
                        if (!boss.scene) return;
                        boss.clearTint();
                        boss.slowed = false;
                    });
                }

                tickCount++;
            }
        });
    }
}
