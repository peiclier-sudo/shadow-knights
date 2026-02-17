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

    // Attaque chargée - Nouveau design: Solar Comet with ritual pre-cast and inferno bloom
    executeChargedAttack(angle) {
        const charged = this.data.charged;
        const startX = this.player.x + Math.cos(angle) * 40;
        const startY = this.player.y + Math.sin(angle) * 40;

        this.createCastSigil(startX, startY, angle);

        const fireball = this.scene.add.container(startX, startY).setDepth(155);
        const body = this.scene.add.circle(0, 0, 18, 0xff4d12, 0.95);
        const mantle = this.scene.add.circle(0, 0, 13, 0xff7f20, 0.82);
        const core = this.scene.add.circle(0, 0, 7, 0xfff4cc, 0.98);
        const corona = this.scene.add.circle(0, 0, 42, 0xff4a00, 0.26);
        const tail = this.scene.add.triangle(-18, 0, 0, 0, -34, -12, -34, 12, 0xffcc85, 0.72);
        const tailGlow = this.scene.add.rectangle(-24, 0, 22, 10, 0xffd89f, 0.4);

        const orbitA = this.scene.add.circle(0, 0, 3, 0xffebb7, 0.95);
        const orbitB = this.scene.add.circle(0, 0, 2.5, 0xff9d4b, 0.88);

        fireball.add([corona, body, mantle, core, tailGlow, tail, orbitA, orbitB]);

        this.scene.tweens.add({
            targets: [body, mantle, corona],
            scale: { from: 1, to: 1.18 },
            duration: 80,
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
        let orbiterPhase = 0;

        const explodeAt = (x, y) => {
            if (exploded) return;
            exploded = true;

            const bloom = this.scene.add.circle(x, y, charged.radius, 0xff5c15, 0.72).setDepth(150);
            const coreRing = this.scene.add.circle(x, y, charged.radius * 0.4, 0xffe5b9, 0)
                .setStrokeStyle(4, 0xffefcc, 0.95)
                .setDepth(152);
            const pressureRing = this.scene.add.circle(x, y, charged.radius * 0.68, 0xff9a3f, 0)
                .setStrokeStyle(2, 0xff9a3f, 0.68)
                .setDepth(151);
            const sootRing = this.scene.add.circle(x, y, charged.radius * 0.82, 0x000000, 0)
                .setStrokeStyle(2, 0x4e1c00, 0.45)
                .setDepth(149);

            this.spawnHeatPulse(x, y, charged.radius * 0.6, 0.26);

            const afterburnRing = this.scene.add.circle(x, y, charged.radius * 0.72, 0xff6d22, 0.18).setDepth(148);
            this.scene.tweens.add({
                targets: afterburnRing,
                alpha: 0,
                scale: 1.25,
                duration: 650,
                ease: 'Sine.easeOut',
                onComplete: () => afterburnRing.destroy()
            });

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
                            this.scene.time.delayedCall(110, () => boss.clearTint());
                            tickCount++;
                        }, charged.dotInterval);
                    }
                }
            }

            for (let i = 0; i < 32; i++) {
                const emberAngle = (i / 32) * Math.PI * 2;
                const ember = this.scene.add.circle(
                    x,
                    y,
                    Phaser.Math.FloatBetween(2.1, 5.8),
                    Phaser.Math.RND.pick([0xffedbe, 0xffc579, 0xff9748, 0xff6a2f]),
                    0.9
                ).setDepth(152);
                this.scene.tweens.add({
                    targets: ember,
                    x: x + Math.cos(emberAngle) * Phaser.Math.Between(62, 170),
                    y: y + Math.sin(emberAngle) * Phaser.Math.Between(62, 170),
                    alpha: 0,
                    scale: 0.3,
                    duration: Phaser.Math.Between(170, 360),
                    onComplete: () => ember.destroy()
                });
            }

            for (let i = 0; i < 12; i++) {
                const tongue = this.scene.add.triangle(
                    x,
                    y,
                    0,
                    -20,
                    -6,
                    10,
                    6,
                    10,
                    0xffd298,
                    0.82
                ).setDepth(153);
                const dir = (i / 12) * Math.PI * 2;
                tongue.rotation = dir;

                this.scene.tweens.add({
                    targets: tongue,
                    x: x + Math.cos(dir) * Phaser.Math.Between(45, 105),
                    y: y + Math.sin(dir) * Phaser.Math.Between(45, 105),
                    alpha: 0,
                    scaleY: 0.28,
                    duration: Phaser.Math.Between(150, 300),
                    onComplete: () => tongue.destroy()
                });
            }

            for (let i = 0; i < 10; i++) {
                this.spawnSmokePuff(x, y, Phaser.Math.FloatBetween(-Math.PI, Math.PI), true);
            }

            this.scene.tweens.add({
                targets: [bloom, coreRing, pressureRing, sootRing, fireball],
                alpha: 0,
                scale: 1.62,
                duration: 340,
                onComplete: () => {
                    bloom.destroy();
                    coreRing.destroy();
                    pressureRing.destroy();
                    sootRing.destroy();
                    fireball.destroy();
                }
            });

            this.scene.cameras.main.shake(200, 0.014);
        };

        const travelTween = this.scene.tweens.add({
            targets: fireball,
            x: targetX,
            y: targetY,
            duration: 430,
            ease: 'Power2',
            onUpdate: () => {
                const dir = Math.atan2(targetY - fireball.y, targetX - fireball.x);
                tail.rotation = dir;
                tailGlow.rotation = dir;

                orbiterPhase += 0.36;
                orbitA.x = Math.cos(orbiterPhase) * 10;
                orbitA.y = Math.sin(orbiterPhase) * 6;
                orbitB.x = Math.cos(orbiterPhase + Math.PI) * 13;
                orbitB.y = Math.sin(orbiterPhase + Math.PI) * 8;

                core.alpha = Phaser.Math.FloatBetween(0.8, 1);
                corona.alpha = Phaser.Math.FloatBetween(0.18, 0.34);

                if (Math.random() > 0.42) {
                    this.spawnEmber(fireball.x, fireball.y, dir + Math.PI);
                }
                if (Math.random() > 0.68) {
                    this.spawnCinderRibbon(fireball.x, fireball.y, dir + Math.PI);
                }
                if (Math.random() > 0.79) {
                    this.spawnSmokePuff(fireball.x, fireball.y, dir + Math.PI);
                }

                const boss = this.scene.boss;
                if (!boss || exploded) return;

                const distToBoss = Phaser.Math.Distance.Between(fireball.x, fireball.y, boss.x, boss.y);
                if (distToBoss <= 52) {
                    travelTween.stop();
                    const stickTime = 130;

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

    createCastSigil(x, y, angle) {
        const sigil = this.scene.add.circle(x, y, 14, 0xff9d4a, 0).setStrokeStyle(2, 0xffc982, 0.85).setDepth(158);
        const ray = this.scene.add.rectangle(x, y, 44, 3, 0xfff1c6, 0.8).setDepth(159);
        ray.rotation = angle;

        this.scene.tweens.add({
            targets: [sigil, ray],
            alpha: 0,
            scale: 1.4,
            duration: 180,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                sigil.destroy();
                ray.destroy();
            }
        });

        for (let i = 0; i < 7; i++) {
            const spark = this.scene.add.circle(
                x + Phaser.Math.Between(-10, 10),
                y + Phaser.Math.Between(-10, 10),
                Phaser.Math.FloatBetween(1.8, 3.4),
                Phaser.Math.RND.pick([0xfff0c7, 0xffd388, 0xffa65a]),
                0.9
            ).setDepth(160);

            this.scene.tweens.add({
                targets: spark,
                x: x + Math.cos(angle + Phaser.Math.FloatBetween(-0.8, 0.8)) * Phaser.Math.Between(20, 40),
                y: y + Math.sin(angle + Phaser.Math.FloatBetween(-0.8, 0.8)) * Phaser.Math.Between(20, 40),
                alpha: 0,
                duration: Phaser.Math.Between(90, 160),
                onComplete: () => spark.destroy()
            });
        }
    }

    spawnCinderRibbon(x, y, angle) {
        const ribbon = this.scene.add.triangle(x, y, 0, -8, -3, 7, 3, 7, 0xffcf8a, 0.65).setDepth(151);
        ribbon.rotation = angle + Phaser.Math.FloatBetween(-0.4, 0.4);

        this.scene.tweens.add({
            targets: ribbon,
            x: x + Math.cos(ribbon.rotation) * Phaser.Math.Between(14, 28),
            y: y + Math.sin(ribbon.rotation) * Phaser.Math.Between(14, 28),
            alpha: 0,
            scaleY: 0.35,
            duration: Phaser.Math.Between(100, 170),
            onComplete: () => ribbon.destroy()
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
