// StaffWeapon.js - Bâton avec orbes et boule de feu (crisp procedural fire aesthetics)
import { WeaponBase } from './WeaponBase.js';
import { WEAPONS } from './weaponData.js';

export class StaffWeapon extends WeaponBase {
    constructor(scene, player) {
        super(scene, player, WEAPONS.STAFF);
    }

    // Tir normal - Orbe incendié téléguidé
    fire(angle) {
        const data = this.data.projectile;
        const startX = this.player.x + Math.cos(angle) * 30;
        const startY = this.player.y + Math.sin(angle) * 30;

        this.createMuzzleFlash(startX, startY, this.data.color);

        const orb = this.scene.add.container(startX, startY).setDepth(150);
        const shell = this.scene.add.circle(0, 0, data.size, 0xff7a2e, 0.92);
        const hotCore = this.scene.add.circle(0, 0, data.size * 0.46, 0xfff1ba, 0.95);
        const halo = this.scene.add.circle(0, 0, data.size * 1.9, 0xff5a1a, 0.28);
        const flicker = this.scene.add.triangle(0, -data.size * 0.9, 0, 0, -4, 10, 4, 10, 0xffd18c, 0.75);

        orb.add([halo, shell, hotCore, flicker]);

        orb.vx = Math.cos(angle) * data.speed;
        orb.vy = Math.sin(angle) * data.speed;
        orb.damage = data.damage;
        orb.range = data.range;
        orb.startX = startX;
        orb.startY = startY;

        this.scene.tweens.add({
            targets: [shell, halo],
            scale: { from: 1, to: 1.12 },
            alpha: { from: 0.95, to: 0.72 },
            duration: 110,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        orb.update = () => {
            orb.rotation += 0.14;
            flicker.rotation += 0.28;
            flicker.y = -data.size * Phaser.Math.FloatBetween(0.75, 1.05);

            if (Math.random() > 0.6) {
                this.spawnEmber(orb.x, orb.y, Math.atan2(orb.vy, orb.vx));
            }

            const boss = this.scene.boss;
            if (!boss) return;

            const dx = boss.x - orb.x;
            const dy = boss.y - orb.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 320) {
                orb.vx += dx * 0.028;
                orb.vy += dy * 0.028;

                const speed = Math.sqrt(orb.vx * orb.vx + orb.vy * orb.vy);
                orb.vx = (orb.vx / speed) * data.speed;
                orb.vy = (orb.vy / speed) * data.speed;
            }
        };

        orb.on('destroy', () => {
            shell.destroy();
            hotCore.destroy();
            halo.destroy();
            flicker.destroy();
        });

        this.scene.projectiles.push(orb);
        this.addTrail(orb, 0xff7a2e, data.size + 1);
    }

    // Attaque chargée - Lance infernale procédurale
    executeChargedAttack(angle) {
        const charged = this.data.charged;
        const startX = this.player.x + Math.cos(angle) * 40;
        const startY = this.player.y + Math.sin(angle) * 40;

        const fireball = this.scene.add.container(startX, startY).setDepth(155);
        const body = this.scene.add.circle(0, 0, 20, 0xff5a16, 0.95);
        const core = this.scene.add.circle(0, 0, 9, 0xfff0bd, 0.95);
        const corona = this.scene.add.circle(0, 0, 36, 0xff4a00, 0.32);
        const tail = this.scene.add.triangle(-18, 0, 0, 0, -28, -9, -28, 9, 0xffb266, 0.66);
        fireball.add([corona, body, core, tail]);

        this.scene.tweens.add({
            targets: [body, corona],
            scale: { from: 1, to: 1.14 },
            duration: 85,
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

            const explosion = this.scene.add.circle(x, y, charged.radius, 0xff641e, 0.65).setDepth(150);
            const hotRing = this.scene.add.circle(x, y, charged.radius * 0.45, 0xffd189, 0)
                .setStrokeStyle(4, 0xffe2ab, 0.95)
                .setDepth(151);
            const darkRing = this.scene.add.circle(x, y, charged.radius * 0.68, 0x000000, 0)
                .setStrokeStyle(2, 0x5b1d00, 0.45)
                .setDepth(149);

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
                            boss.setTint(0xff6e2f);
                            this.scene.time.delayedCall(100, () => boss.clearTint());
                            tickCount++;
                        }, charged.dotInterval);
                    }
                }
            }

            for (let i = 0; i < 22; i++) {
                const emberAngle = (i / 22) * Math.PI * 2;
                const ember = this.scene.add.circle(x, y, Phaser.Math.FloatBetween(2.5, 5.2), 0xff9a48, 0.85).setDepth(152);
                this.scene.tweens.add({
                    targets: ember,
                    x: x + Math.cos(emberAngle) * Phaser.Math.Between(55, 140),
                    y: y + Math.sin(emberAngle) * Phaser.Math.Between(55, 140),
                    alpha: 0,
                    scale: 0.35,
                    duration: Phaser.Math.Between(180, 320),
                    onComplete: () => ember.destroy()
                });
            }

            for (let i = 0; i < 9; i++) {
                const tongue = this.scene.add.triangle(
                    x,
                    y,
                    0,
                    -16,
                    -6,
                    8,
                    6,
                    8,
                    0xffc67e,
                    0.78
                ).setDepth(153);
                tongue.rotation = (i / 9) * Math.PI * 2;

                this.scene.tweens.add({
                    targets: tongue,
                    x: x + Math.cos(tongue.rotation) * Phaser.Math.Between(40, 90),
                    y: y + Math.sin(tongue.rotation) * Phaser.Math.Between(40, 90),
                    alpha: 0,
                    scaleY: 0.4,
                    duration: Phaser.Math.Between(170, 280),
                    onComplete: () => tongue.destroy()
                });
            }

            this.scene.tweens.add({
                targets: [explosion, hotRing, darkRing, fireball],
                alpha: 0,
                scale: 1.5,
                duration: 300,
                onComplete: () => {
                    explosion.destroy();
                    hotRing.destroy();
                    darkRing.destroy();
                    fireball.destroy();
                }
            });

            this.scene.cameras.main.shake(180, 0.013);
        };

        const travelTween = this.scene.tweens.add({
            targets: fireball,
            x: targetX,
            y: targetY,
            duration: 420,
            ease: 'Power2',
            onUpdate: () => {
                const dir = Math.atan2(targetY - fireball.y, targetX - fireball.x);
                tail.rotation = dir;

                if (Math.random() > 0.5) {
                    this.spawnEmber(fireball.x, fireball.y, dir + Math.PI);
                }

                const boss = this.scene.boss;
                if (!boss || exploded) return;

                const distToBoss = Phaser.Math.Distance.Between(fireball.x, fireball.y, boss.x, boss.y);
                if (distToBoss <= 52) {
                    travelTween.stop();
                    const stickTime = 120;

                    fireball.setPosition(boss.x, boss.y);

                    const followHandler = () => {
                        if (!boss.scene || exploded) return;
                        fireball.setPosition(boss.x, boss.y);
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

    spawnEmber(x, y, angle) {
        const ember = this.scene.add.circle(
            x + Phaser.Math.Between(-4, 4),
            y + Phaser.Math.Between(-4, 4),
            Phaser.Math.FloatBetween(1.6, 3.4),
            Phaser.Math.RND.pick([0xffe1a3, 0xffba69, 0xff8f45]),
            0.9
        ).setDepth(154);

        const drift = angle + Phaser.Math.FloatBetween(-0.6, 0.6);
        this.scene.tweens.add({
            targets: ember,
            x: ember.x + Math.cos(drift) * Phaser.Math.Between(12, 28),
            y: ember.y + Math.sin(drift) * Phaser.Math.Between(12, 28),
            alpha: 0,
            scale: 0.35,
            duration: Phaser.Math.Between(90, 170),
            onComplete: () => ember.destroy()
        });
    }
}
