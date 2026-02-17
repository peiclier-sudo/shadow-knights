// StaffWeapon.js - Bâton avec orbes et boule de feu (procedural VFX)
import { WeaponBase } from './WeaponBase.js';
import { WEAPONS } from './weaponData.js';

export class StaffWeapon extends WeaponBase {
    constructor(scene, player) {
        super(scene, player, WEAPONS.STAFF);
    }

    // Tir normal - Orbe téléguidé
    fire(angle) {
        const data = this.data.projectile;
        const startX = this.player.x + Math.cos(angle) * 30;
        const startY = this.player.y + Math.sin(angle) * 30;

        this.createMuzzleFlash(startX, startY, this.data.color);

        const orb = this.scene.add.star(startX, startY, 5, data.size * 0.65, data.size, data.color)
            .setDepth(150);
        const glow = this.scene.add.circle(startX, startY, data.size * 1.8, 0x88aaff, 0.28).setDepth(149);

        orb.vx = Math.cos(angle) * data.speed;
        orb.vy = Math.sin(angle) * data.speed;
        orb.damage = data.damage;
        orb.range = data.range;
        orb.startX = startX;
        orb.startY = startY;

        orb.update = () => {
            orb.rotation += 0.22;
            glow.x = orb.x;
            glow.y = orb.y;
            glow.alpha = Phaser.Math.FloatBetween(0.14, 0.28);

            const boss = this.scene.boss;
            if (!boss) return;

            const dx = boss.x - orb.x;
            const dy = boss.y - orb.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 300) {
                orb.vx += dx * 0.03;
                orb.vy += dy * 0.03;

                const speed = Math.sqrt(orb.vx * orb.vx + orb.vy * orb.vy);
                orb.vx = (orb.vx / speed) * data.speed;
                orb.vy = (orb.vy / speed) * data.speed;
            }
        };

        orb.on('destroy', () => glow?.destroy());

        this.scene.projectiles.push(orb);
        this.addTrail(orb, data.color, data.size);
    }

    // Attaque chargée - Boule de feu (directionnelle)
    executeChargedAttack(angle) {
        const charged = this.data.charged;
        const startX = this.player.x + Math.cos(angle) * 40;
        const startY = this.player.y + Math.sin(angle) * 40;

        const fireball = this.scene.add.circle(startX, startY, 18, 0xff6d2d, 0.95).setDepth(155);
        const core = this.scene.add.circle(startX, startY, 8, 0xffecaf, 0.9).setDepth(156);
        const glow = this.scene.add.circle(startX, startY, 34, 0xff6600, 0.4).setDepth(154);

        this.scene.tweens.add({
            targets: [fireball, glow],
            scale: 1.1,
            duration: 90,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        const targetPoint = this.getClampedChargedTarget(
            this.player.x + Math.cos(angle) * this.data.charged.maxRange,
            this.player.y + Math.sin(angle) * this.data.charged.maxRange
        );
        const targetX = targetPoint.x;
        const targetY = targetPoint.y;

        let exploded = false;

        const explodeAt = (x, y) => {
            if (exploded) return;
            exploded = true;

            const explosion = this.scene.add.circle(x, y, charged.radius, 0xff6600, 0.65).setDepth(150);
            const ring = this.scene.add.circle(x, y, charged.radius * 0.55, 0xffc273, 0)
                .setStrokeStyle(3, 0xffdba3, 0.9)
                .setDepth(151);

            const boss = this.scene.boss;
            if (boss) {
                const distToExplosion = Phaser.Math.Distance.Between(x, y, boss.x, boss.y);
                if (distToExplosion < charged.radius) {
                    const finalDamage = charged.damage * (this.player.damageMultiplier || 1.0);
                    boss.takeDamage(finalDamage);

                    if (charged.dotDamage) {
                        let tickCount = 0;
                        const dotInterval = setInterval(() => {
                            if (!boss.scene || tickCount >= charged.dotTicks) {
                                clearInterval(dotInterval);
                                return;
                            }

                            const dotDamage = charged.dotDamage * (this.player.damageMultiplier || 1.0);
                            boss.takeDamage(dotDamage);
                            boss.setTint(0xff6600);
                            this.scene.time.delayedCall(100, () => boss.clearTint());
                            tickCount++;
                        }, charged.dotInterval);
                    }
                }
            }

            for (let i = 0; i < 14; i++) {
                const particleAngle = (i / 14) * Math.PI * 2;
                const ember = this.scene.add.circle(x, y, 4 + Math.random() * 5, 0xff8f43, 0.8).setDepth(152);

                this.scene.tweens.add({
                    targets: ember,
                    x: x + Math.cos(particleAngle) * Phaser.Math.Between(70, 120),
                    y: y + Math.sin(particleAngle) * Phaser.Math.Between(70, 120),
                    alpha: 0,
                    duration: 280,
                    onComplete: () => ember.destroy()
                });
            }

            this.scene.tweens.add({
                targets: [explosion, ring, fireball, core, glow],
                alpha: 0,
                scale: 1.45,
                duration: 260,
                onComplete: () => {
                    explosion.destroy();
                    ring.destroy();
                    fireball.destroy();
                    core.destroy();
                    glow.destroy();
                }
            });

            this.scene.cameras.main.shake(170, 0.012);
        };

        const travelTween = this.scene.tweens.add({
            targets: [fireball, core, glow],
            x: targetX,
            y: targetY,
            duration: 420,
            ease: 'Power2',
            onUpdate: () => {
                glow.x = fireball.x;
                glow.y = fireball.y;
                core.x = fireball.x;
                core.y = fireball.y;

                const boss = this.scene.boss;
                if (!boss || exploded) return;

                const distToBoss = Phaser.Math.Distance.Between(fireball.x, fireball.y, boss.x, boss.y);
                if (distToBoss <= 52) {
                    travelTween.stop();
                    const stickTime = 140;

                    fireball.setPosition(boss.x, boss.y);
                    glow.setPosition(boss.x, boss.y);
                    core.setPosition(boss.x, boss.y);

                    const followHandler = () => {
                        if (!boss.scene || exploded) return;
                        fireball.setPosition(boss.x, boss.y);
                        glow.setPosition(boss.x, boss.y);
                        core.setPosition(boss.x, boss.y);
                    };
                    this.scene.events.on('update', followHandler);

                    this.scene.time.delayedCall(stickTime, () => {
                        this.scene.events.off('update', followHandler);
                        explodeAt(boss.x, boss.y);
                    });
                }
            },
            onComplete: () => {
                explodeAt(targetX, targetY);
            }
        });
    }
}
