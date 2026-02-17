// StaffWeapon.js - Fire staff procedural visuals rebuilt for premium charged fireball fantasy
import { WeaponBase } from './WeaponBase.js';
import { WEAPONS } from './weaponData.js';

export class StaffWeapon extends WeaponBase {
    constructor(scene, player) {
        super(scene, player, WEAPONS.STAFF);
        this.ensureProceduralTextures();
    }

    ensureProceduralTextures() {
        if (this.scene.textures.exists('staff-spark')) return;

        const spark = this.scene.add.graphics();
        spark.fillStyle(0xffffff, 1);
        spark.fillCircle(4, 4, 2.1);
        spark.fillStyle(0xffaa33, 0.85);
        spark.fillCircle(4, 4, 3.2);
        spark.lineStyle(1, 0xff5500, 0.95);
        spark.strokeCircle(4, 4, 3.8);
        spark.generateTexture('staff-spark', 8, 8);
        spark.destroy();

        const flame = this.scene.add.graphics();
        flame.fillGradientStyle(0xfff3b0, 0xffb347, 0xff6622, 0x552000, 1);
        flame.fillTriangle(8, 1, 13, 15, 3, 15);
        flame.generateTexture('staff-flame', 16, 16);
        flame.destroy();
    }

    // Basic attack - fast living orb with procedural flame wobble
    fire(angle) {
        const data = this.data.projectile;
        const startX = this.player.x + Math.cos(angle) * 30;
        const startY = this.player.y + Math.sin(angle) * 30;

        this.createMuzzleFlash(startX, startY, 0xff8e3f);
        this.spawnMiniFlare(startX, startY, angle);

        const orb = this.scene.add.container(startX, startY).setDepth(150);
        const core = this.scene.add.graphics();
        const shell = this.scene.add.circle(0, 0, data.size * 1.1, 0xff5d1f, 0.35);
        orb.add([shell, core]);

        orb.vx = Math.cos(angle) * data.speed;
        orb.vy = Math.sin(angle) * data.speed;
        orb.damage = data.damage;
        orb.range = data.range;
        orb.startX = startX;
        orb.startY = startY;
        orb.lifeTick = 0;

        orb.update = () => {
            orb.lifeTick += 0.32;
            const dir = Math.atan2(orb.vy, orb.vx);

            this.drawBasicCore(core, data.size, orb.lifeTick);
            orb.rotation += 0.12;
            shell.alpha = 0.2 + Math.abs(Math.sin(orb.lifeTick * 1.5)) * 0.16;

            if (Math.random() > 0.48) this.spawnEmber(orb.x, orb.y, dir + Math.PI);
            if (Math.random() > 0.7) this.spawnSpark(orb.x, orb.y, dir + Math.PI, false);

            const boss = this.scene.boss;
            if (!boss) return;

            const dx = boss.x - orb.x;
            const dy = boss.y - orb.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 340) {
                orb.vx += dx * 0.028;
                orb.vy += dy * 0.028;
                const speed = Math.sqrt(orb.vx * orb.vx + orb.vy * orb.vy);
                if (speed > 0) {
                    orb.vx = (orb.vx / speed) * data.speed;
                    orb.vy = (orb.vy / speed) * data.speed;
                }
            }
        };

        orb.on('destroy', () => {
            core.destroy();
            shell.destroy();
        });

        this.scene.projectiles.push(orb);
        this.addTrail(orb, 0xff7a2c, data.size + 1.2);
    }

    // Charged attack - rebuilt: charge burst + comet flight + huge explosion
    executeChargedAttack(angle) {
        this.ensureProceduralTextures();

        const charged = this.data.charged;
        const startX = this.player.x + Math.cos(angle) * 40;
        const startY = this.player.y + Math.sin(angle) * 40;
        const chargePower = 0.45 + this.chargeLevel * 0.75;

        const targetPoint = this.getClampedChargedTarget(
            this.player.x + Math.cos(angle) * charged.maxRange,
            this.player.y + Math.sin(angle) * charged.maxRange
        );

        const core = this.scene.add.graphics().setDepth(158);
        const aura = this.scene.add.circle(startX, startY, 24, 0xff7a1f, 0.2).setDepth(156);

        const flames = this.scene.add.particles(startX, startY, 'staff-flame', {
            speed: { min: 28, max: 120 + 120 * chargePower },
            angle: { min: 0, max: 360 },
            scale: { start: 0.8 + 0.6 * chargePower, end: 0 },
            alpha: { start: 0.85, end: 0 },
            lifespan: { min: 280, max: 620 },
            blendMode: 'ADD',
            frequency: 18,
            quantity: 2,
            emitting: true
        }).setDepth(157);

        const sparks = this.scene.add.particles(startX, startY, 'staff-spark', {
            speed: { min: 20, max: 70 + 70 * chargePower },
            gravityY: -15,
            scale: { start: 0.8, end: 0 },
            alpha: { start: 0.95, end: 0 },
            lifespan: { min: 200, max: 480 },
            quantity: 1,
            frequency: 28,
            blendMode: 'SCREEN',
            emitting: true
        }).setDepth(159);

        this.scene.tweens.add({
            targets: aura,
            radius: 38,
            alpha: 0,
            duration: 230,
            ease: 'Cubic.easeOut',
            onComplete: () => aura.destroy()
        });

        const flight = { x: startX, y: startY, tick: 0, exploded: false };
        const travelDuration = 430;

        const explodeAt = (x, y) => {
            if (flight.exploded) return;
            flight.exploded = true;

            flames.stop();
            sparks.stop();

            const blast = this.scene.add.circle(x, y, charged.radius * (0.48 + chargePower * 0.24), 0xff6b1c, 0.62).setDepth(154);
            const shock = this.scene.add.circle(x, y, 24, 0xffd5a1, 0)
                .setStrokeStyle(4, 0xffefca, 0.9)
                .setDepth(155);

            this.scene.tweens.add({
                targets: blast,
                radius: charged.radius,
                alpha: 0,
                duration: 340,
                ease: 'Cubic.easeOut',
                onComplete: () => blast.destroy()
            });

            this.scene.tweens.add({
                targets: shock,
                radius: charged.radius * 0.8,
                alpha: 0,
                duration: 280,
                ease: 'Sine.easeOut',
                onComplete: () => shock.destroy()
            });

            const explosion = this.scene.add.particles(x, y, 'staff-spark', {
                speed: { min: 160, max: 460 },
                angle: { min: 0, max: 360 },
                scale: { start: 1.8 + chargePower * 0.8, end: 0 },
                alpha: { start: 1, end: 0 },
                lifespan: { min: 420, max: 920 },
                quantity: Math.floor(52 + 50 * chargePower),
                blendMode: 'ADD',
                emitting: false
            }).setDepth(160);
            explosion.explode();

            const flameBurst = this.scene.add.particles(x, y, 'staff-flame', {
                speed: { min: 120, max: 340 },
                angle: { min: 0, max: 360 },
                scale: { start: 1.2 + chargePower * 0.6, end: 0 },
                alpha: { start: 0.9, end: 0 },
                lifespan: { min: 280, max: 650 },
                quantity: Math.floor(34 + 20 * chargePower),
                blendMode: 'ADD',
                emitting: false
            }).setDepth(159);
            flameBurst.explode();

            this.scene.time.delayedCall(1000, () => {
                explosion.destroy();
                flameBurst.destroy();
            });

            const boss = this.scene.boss;
            if (boss) {
                const dist = Phaser.Math.Distance.Between(x, y, boss.x, boss.y);
                if (dist <= charged.radius) {
                    const finalDamage = charged.damage * (this.player.damageMultiplier || 1.0);
                    boss.takeDamage(finalDamage);
                    this.gainUltimateGaugeFromDamage(finalDamage, { charged: true });

                    if (charged.dotDamage) {
                        let tick = 0;
                        const timer = setInterval(() => {
                            if (!boss.scene || tick >= charged.dotTicks) {
                                clearInterval(timer);
                                return;
                            }
                            const dotDamage = charged.dotDamage * (this.player.damageMultiplier || 1.0);
                            boss.takeDamage(dotDamage);
                            this.gainUltimateGaugeFromDamage(dotDamage, { charged: true, dot: true });
                            boss.setTint(0xff7f3a);
                            this.scene.time.delayedCall(120, () => boss.clearTint());
                            tick++;
                        }, charged.dotInterval);
                    }
                }
            }

            this.scene.cameras.main.flash(180, 255, 170, 95);
            this.scene.cameras.main.shake(200, 0.009 + chargePower * 0.002);

            core.destroy();
            flames.destroy();
            sparks.destroy();
        };

        this.scene.tweens.add({
            targets: flight,
            x: targetPoint.x,
            y: targetPoint.y,
            duration: travelDuration,
            ease: 'Cubic.easeIn',
            onUpdate: () => {
                flight.tick += 0.5;
                this.drawChargedCore(core, flight.x, flight.y, chargePower, flight.tick);

                flames.setPosition(flight.x, flight.y);
                sparks.setPosition(flight.x, flight.y);

                if (Math.random() > 0.36) this.spawnSpark(flight.x, flight.y, angle + Math.PI, true);
                if (Math.random() > 0.45) this.spawnEmber(flight.x, flight.y, angle + Math.PI);

                const boss = this.scene.boss;
                if (!boss || flight.exploded) return;

                const distToBoss = Phaser.Math.Distance.Between(flight.x, flight.y, boss.x, boss.y);
                if (distToBoss <= 52) {
                    flight.x = boss.x;
                    flight.y = boss.y;
                    explodeAt(boss.x, boss.y);
                }
            },
            onComplete: () => explodeAt(targetPoint.x, targetPoint.y)
        });
    }

    drawBasicCore(graphics, baseSize, tick) {
        graphics.clear();

        const pulse = 1 + Math.sin(tick * 1.8) * 0.16;
        graphics.fillStyle(0xff3e14, 0.85);
        graphics.fillCircle(0, 0, baseSize * pulse);

        graphics.fillStyle(0xff8a2b, 0.84);
        graphics.fillCircle(Math.cos(tick) * 2, Math.sin(tick * 0.8) * 2, baseSize * 0.66 * pulse);

        graphics.fillStyle(0xfff3bf, 0.98);
        graphics.fillCircle(0, 0, baseSize * 0.34 * pulse);
    }

    drawChargedCore(graphics, x, y, power, tick) {
        const main = 14 + power * 10;
        const halo = 26 + power * 14;
        const pulse = 1 + Math.sin(tick * 1.35) * (0.18 + power * 0.08);

        graphics.clear();
        graphics.fillStyle(0xff3d0f, 0.25);
        graphics.fillCircle(x, y, halo * pulse);

        graphics.fillStyle(0xff7a1f, 0.8);
        graphics.fillCircle(x, y, main * pulse);

        graphics.fillStyle(0xffb347, 0.86);
        graphics.fillCircle(
            x + Math.cos(tick * 1.2) * (2 + power * 2),
            y + Math.sin(tick * 1.1) * (2 + power * 2),
            (main * 0.66) * pulse
        );

        graphics.fillStyle(0xfff7dc, 0.98);
        graphics.fillCircle(x, y, (main * 0.34) * pulse);

        for (let i = 0; i < 3; i++) {
            const a = tick * 1.7 + (Math.PI * 2 * i) / 3;
            graphics.fillStyle(0xffdc8f, 0.62);
            graphics.fillCircle(x + Math.cos(a) * (main * 0.65), y + Math.sin(a) * (main * 0.65), 2.4 + power);
        }
    }

    spawnMiniFlare(x, y, angle) {
        for (let i = 0; i < 5; i++) {
            const dir = angle + Phaser.Math.FloatBetween(-0.7, 0.7);
            const spike = this.scene.add.triangle(x, y, 0, -7, -2, 6, 2, 6, 0xffcf88, 0.85).setDepth(160);
            spike.rotation = dir;

            this.scene.tweens.add({
                targets: spike,
                x: x + Math.cos(dir) * Phaser.Math.Between(8, 24),
                y: y + Math.sin(dir) * Phaser.Math.Between(8, 24),
                alpha: 0,
                scaleY: 0.22,
                duration: Phaser.Math.Between(90, 170),
                onComplete: () => spike.destroy()
            });
        }
    }

    spawnSpark(x, y, angle, large) {
        const spark = this.scene.add.image(
            x + Phaser.Math.Between(-4, 4),
            y + Phaser.Math.Between(-4, 4),
            'staff-spark'
        ).setDepth(157);

        spark.setScale(large ? Phaser.Math.FloatBetween(0.85, 1.2) : Phaser.Math.FloatBetween(0.45, 0.85));
        const drift = angle + Phaser.Math.FloatBetween(-0.55, 0.55);

        this.scene.tweens.add({
            targets: spark,
            x: spark.x + Math.cos(drift) * Phaser.Math.Between(large ? 22 : 12, large ? 58 : 26),
            y: spark.y + Math.sin(drift) * Phaser.Math.Between(large ? 22 : 12, large ? 58 : 26),
            alpha: 0,
            scale: 0.18,
            duration: Phaser.Math.Between(90, 220),
            onComplete: () => spark.destroy()
        });
    }

    spawnEmber(x, y, angle) {
        const ember = this.scene.add.circle(
            x + Phaser.Math.Between(-5, 5),
            y + Phaser.Math.Between(-5, 5),
            Phaser.Math.FloatBetween(1.4, 3.2),
            Phaser.Math.RND.pick([0xfff0c5, 0xffcd84, 0xffa55a, 0xff7331]),
            0.9
        ).setDepth(154);

        const drift = angle + Phaser.Math.FloatBetween(-0.65, 0.65);
        this.scene.tweens.add({
            targets: ember,
            x: ember.x + Math.cos(drift) * Phaser.Math.Between(10, 30),
            y: ember.y + Math.sin(drift) * Phaser.Math.Between(10, 30),
            alpha: 0,
            scale: 0.3,
            duration: Phaser.Math.Between(90, 190),
            onComplete: () => ember.destroy()
        });
    }
}
