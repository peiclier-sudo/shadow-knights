// StaffWeapon.js - Bâton avec orbes et boule de feu (alive, realistic procedural fire)
import { WeaponBase } from './WeaponBase.js';
import { WEAPONS } from './weaponData.js';

export class StaffWeapon extends WeaponBase {
    constructor(scene, player) {
        super(scene, player, WEAPONS.STAFF);
    }

    // Tir normal - Orbe igné vivant avec turbulence
    fire(angle) {
        const data = this.data.projectile;
        const startX = this.player.x + Math.cos(angle) * 30;
        const startY = this.player.y + Math.sin(angle) * 30;

        this.createMuzzleFlash(startX, startY, this.data.color);
        this.spawnHeatPulse(startX, startY, 18, 0.26);

        const orb = this.scene.add.container(startX, startY).setDepth(150);
        const shell = this.scene.add.circle(0, 0, data.size, 0xff7a2f, 0.9);
        const magma = this.scene.add.circle(0, 0, data.size * 0.7, 0xff5316, 0.76);
        const hotCore = this.scene.add.circle(0, 0, data.size * 0.44, 0xfff4c7, 0.97);
        const halo = this.scene.add.circle(0, 0, data.size * 1.95, 0xff4e14, 0.25);
        const crownA = this.scene.add.triangle(0, -data.size * 0.95, 0, 0, -4, 10, 4, 10, 0xffc985, 0.74);
        const crownB = this.scene.add.triangle(0, data.size * 0.92, 0, 0, -3, 8, 3, 8, 0xff8a42, 0.6);

        orb.add([halo, shell, magma, hotCore, crownA, crownB]);

        orb.vx = Math.cos(angle) * data.speed;
        orb.vy = Math.sin(angle) * data.speed;
        orb.damage = data.damage;
        orb.range = data.range;
        orb.startX = startX;
        orb.startY = startY;

        this.scene.tweens.add({
            targets: [shell, magma, halo],
            scale: { from: 1, to: 1.12 },
            alpha: { from: 0.9, to: 0.66 },
            duration: 95,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        orb.update = () => {
            orb.rotation += 0.16;
            crownA.rotation += 0.35;
            crownB.rotation -= 0.28;

            crownA.y = -data.size * Phaser.Math.FloatBetween(0.76, 1.06);
            crownB.y = data.size * Phaser.Math.FloatBetween(0.72, 0.98);
            hotCore.alpha = Phaser.Math.FloatBetween(0.78, 0.98);
            halo.alpha = Phaser.Math.FloatBetween(0.16, 0.28);

            if (Math.random() > 0.52) {
                this.spawnEmber(orb.x, orb.y, Math.atan2(orb.vy, orb.vx));
            }
            if (Math.random() > 0.78) {
                this.spawnSmokePuff(orb.x, orb.y, Math.atan2(orb.vy, orb.vx) + Math.PI);
            }

            const boss = this.scene.boss;
            if (!boss) return;

            const dx = boss.x - orb.x;
            const dy = boss.y - orb.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 340) {
                orb.vx += dx * 0.028;
                orb.vy += dy * 0.028;

                const speed = Math.sqrt(orb.vx * orb.vx + orb.vy * orb.vy);
                orb.vx = (orb.vx / speed) * data.speed;
                orb.vy = (orb.vy / speed) * data.speed;
            }
        };

        orb.on('destroy', () => {
            shell.destroy();
            magma.destroy();
            hotCore.destroy();
            halo.destroy();
            crownA.destroy();
            crownB.destroy();
        });

        this.scene.projectiles.push(orb);
        this.addTrail(orb, 0xff7428, data.size + 1.1);
    }

    // Attaque chargée - Firestaff infernal détaillé
    executeChargedAttack(angle) {
        const charged = this.data.charged;
        const startX = this.player.x + Math.cos(angle) * 40;
        const startY = this.player.y + Math.sin(angle) * 40;

        const fireball = this.scene.add.container(startX, startY).setDepth(155);
        const body = this.scene.add.circle(0, 0, 20, 0xff5a16, 0.95);
        const magma = this.scene.add.circle(0, 0, 13, 0xff7f24, 0.85);
        const core = this.scene.add.circle(0, 0, 8, 0xfff3c7, 0.96);
        const corona = this.scene.add.circle(0, 0, 38, 0xff4400, 0.28);
        const tail = this.scene.add.triangle(-18, 0, 0, 0, -30, -10, -30, 10, 0xffbe6e, 0.72);
        const tailGlow = this.scene.add.rectangle(-24, 0, 18, 8, 0xffd89a, 0.42);

        fireball.add([corona, body, magma, core, tailGlow, tail]);

        this.scene.tweens.add({
            targets: [body, magma, corona],
            scale: { from: 1, to: 1.16 },
            duration: 82,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        const targetPoint = this.getClampedChargedTarget(
            this.player.x + Math.cos(angle) * charged.maxRange,
            this.player.y + Math.sin(angle) * charged.maxRange
        );
        const targetX = targetPoint.x;
        const targetY = targetPoint.y;

        let exploded = false;

        const explodeAt = (x, y) => {
            if (exploded) return;
            exploded = true;

            const explosion = this.scene.add.circle(x, y, charged.radius, 0xff6118, 0.68).setDepth(150);
            const hotRing = this.scene.add.circle(x, y, charged.radius * 0.45, 0xffd79c, 0)
                .setStrokeStyle(4, 0xffe2ad, 0.95)
                .setDepth(151);
            const pressureRing = this.scene.add.circle(x, y, charged.radius * 0.66, 0xff8f32, 0)
                .setStrokeStyle(2, 0xff8f32, 0.62)
                .setDepth(150);
            const sootRing = this.scene.add.circle(x, y, charged.radius * 0.76, 0x000000, 0)
                .setStrokeStyle(2, 0x4a1a00, 0.45)
                .setDepth(149);

            this.spawnHeatPulse(x, y, charged.radius * 0.55, 0.24);

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

            for (let i = 0; i < 26; i++) {
                const emberAngle = (i / 26) * Math.PI * 2;
                const ember = this.scene.add.circle(
                    x,
                    y,
                    Phaser.Math.FloatBetween(2.2, 5.4),
                    Phaser.Math.RND.pick([0xffe0ad, 0xffbf73, 0xff9347, 0xff6a2c]),
                    0.88
                ).setDepth(152);
                this.scene.tweens.add({
                    targets: ember,
                    x: x + Math.cos(emberAngle) * Phaser.Math.Between(58, 150),
                    y: y + Math.sin(emberAngle) * Phaser.Math.Between(58, 150),
                    alpha: 0,
                    scale: 0.32,
                    duration: Phaser.Math.Between(180, 340),
                    onComplete: () => ember.destroy()
                });
            }

            for (let i = 0; i < 10; i++) {
                const tongue = this.scene.add.triangle(
                    x,
                    y,
                    0,
                    -18,
                    -6,
                    9,
                    6,
                    9,
                    0xffcb86,
                    0.8
                ).setDepth(153);
                const dir = (i / 10) * Math.PI * 2;
                tongue.rotation = dir;

                this.scene.tweens.add({
                    targets: tongue,
                    x: x + Math.cos(dir) * Phaser.Math.Between(45, 94),
                    y: y + Math.sin(dir) * Phaser.Math.Between(45, 94),
                    alpha: 0,
                    scaleY: 0.35,
                    duration: Phaser.Math.Between(160, 290),
                    onComplete: () => tongue.destroy()
                });
            }

            for (let i = 0; i < 6; i++) {
                this.spawnSmokePuff(x, y, Phaser.Math.FloatBetween(-Math.PI, Math.PI), true);
            }

            this.scene.tweens.add({
                targets: [explosion, hotRing, pressureRing, sootRing, fireball],
                alpha: 0,
                scale: 1.55,
                duration: 320,
                onComplete: () => {
                    explosion.destroy();
                    hotRing.destroy();
                    pressureRing.destroy();
                    sootRing.destroy();
                    fireball.destroy();
                }
            });

            this.scene.cameras.main.shake(190, 0.0135);
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
                tailGlow.rotation = dir;

                core.alpha = Phaser.Math.FloatBetween(0.75, 0.98);
                corona.alpha = Phaser.Math.FloatBetween(0.18, 0.34);

                if (Math.random() > 0.44) {
                    this.spawnEmber(fireball.x, fireball.y, dir + Math.PI);
                }
                if (Math.random() > 0.77) {
                    this.spawnSmokePuff(fireball.x, fireball.y, dir + Math.PI);
                }

                const boss = this.scene.boss;
                if (!boss || exploded) return;

                const distToBoss = Phaser.Math.Distance.Between(fireball.x, fireball.y, boss.x, boss.y);
                if (distToBoss <= 52) {
                    travelTween.stop();
                    const stickTime = 125;

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
            x + Phaser.Math.Between(-5, 5),
            y + Phaser.Math.Between(-5, 5),
            Phaser.Math.FloatBetween(1.6, 3.8),
            Phaser.Math.RND.pick([0xfff0c5, 0xffcd84, 0xffa55a, 0xff7331]),
            0.92
        ).setDepth(154);

        const drift = angle + Phaser.Math.FloatBetween(-0.65, 0.65);
        this.scene.tweens.add({
            targets: ember,
            x: ember.x + Math.cos(drift) * Phaser.Math.Between(12, 32),
            y: ember.y + Math.sin(drift) * Phaser.Math.Between(12, 32),
            alpha: 0,
            scale: 0.34,
            duration: Phaser.Math.Between(90, 190),
            onComplete: () => ember.destroy()
        });
    }

    spawnSmokePuff(x, y, angle, thick = false) {
        const smoke = this.scene.add.circle(
            x + Phaser.Math.Between(-6, 6),
            y + Phaser.Math.Between(-6, 6),
            Phaser.Math.FloatBetween(thick ? 5 : 3, thick ? 10 : 6),
            0x2e1a12,
            thick ? 0.26 : 0.18
        ).setDepth(146);

        const drift = angle + Phaser.Math.FloatBetween(-0.45, 0.45);
        this.scene.tweens.add({
            targets: smoke,
            x: smoke.x + Math.cos(drift) * Phaser.Math.Between(14, 38),
            y: smoke.y + Math.sin(drift) * Phaser.Math.Between(14, 38),
            alpha: 0,
            scale: Phaser.Math.FloatBetween(1.25, 1.75),
            duration: Phaser.Math.Between(180, 340),
            onComplete: () => smoke.destroy()
        });
    }

    spawnHeatPulse(x, y, radius, alpha) {
        const pulse = this.scene.add.circle(x, y, radius, 0xff8f3a, alpha).setDepth(145);
        this.scene.tweens.add({
            targets: pulse,
            alpha: 0,
            scale: 1.5,
            duration: 170,
            onComplete: () => pulse.destroy()
        });
    }
}
