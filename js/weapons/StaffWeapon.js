// BloodStaffWeapon.js - BloodStaff procedural visuals rebuilt for premium charged blood-orb fantasy
import { WeaponBase } from './WeaponBase.js';
import { WEAPONS } from './weaponData.js';

export class StaffWeapon extends WeaponBase {
    constructor(scene, player) {
        super(scene, player, WEAPONS.STAFF);
        this.ensureProceduralTextures();
        this.ultimateState = null;
    }

    ensureProceduralTextures() {
        if (!this.scene.textures.exists('staff-spark')) {
            const spark = this.scene.add.graphics();
            spark.fillStyle(0xffd2de, 1);
            spark.fillCircle(4, 4, 2.1);
            spark.fillStyle(0xd23861, 0.88);
            spark.fillCircle(4, 4, 3.2);
            spark.lineStyle(1, 0xff6b92, 0.95);
            spark.strokeCircle(4, 4, 3.8);
            spark.generateTexture('staff-spark', 8, 8);
            spark.destroy();
        }

        if (!this.scene.textures.exists('staff-flame')) {
            const flame = this.scene.add.graphics();
            flame.fillGradientStyle(0xffb5c9, 0xd23861, 0x7e1030, 0x220006, 1);
            flame.fillTriangle(8, 1, 13, 15, 3, 15);
            flame.generateTexture('staff-flame', 16, 16);
            flame.destroy();
        }

        if (!this.scene.textures.exists('staff-dark-flame')) {
            const darkFlame = this.scene.add.graphics();
            darkFlame.fillGradientStyle(0x7a0008, 0x2a0003, 0xb3001b, 0x050000, 1);
            darkFlame.fillTriangle(8, 1, 13, 15, 3, 15);
            darkFlame.lineStyle(1.5, 0xff3355, 0.9);
            darkFlame.strokeTriangle(8, 1, 13, 15, 3, 15);
            darkFlame.generateTexture('staff-dark-flame', 16, 16);
            darkFlame.destroy();
        }

        if (!this.scene.textures.exists('staff-dark-spark')) {
            const darkSpark = this.scene.add.graphics();
            darkSpark.fillGradientStyle(0xcc2233, 0x7a0011, 0x2a0005, 0x000000, 1);
            darkSpark.fillCircle(6, 6, 4);
            darkSpark.lineStyle(1, 0xff5577, 0.85);
            darkSpark.strokeCircle(6, 6, 5);
            darkSpark.generateTexture('staff-dark-spark', 12, 12);
            darkSpark.destroy();
        }
    }

    // Basic attack - fast living orb with procedural flame wobble
    fire(angle) {
        const data = this.data.projectile;
        const startX = this.player.x + Math.cos(angle) * 30;
        const startY = this.player.y + Math.sin(angle) * 30;

        this.createMuzzleFlash(startX, startY, 0xff4a6f);
        this.spawnMiniFlare(startX, startY, angle);

        const orb = this.scene.add.container(startX, startY).setDepth(150);
        const core = this.scene.add.graphics();
        const shell = this.scene.add.circle(0, 0, data.size * 1.1, 0x5e0a1c, 0.4);
        const corona = this.scene.add.circle(0, 0, data.size * 1.55, 0xb1002f, 0.22);
        const runeRing = this.scene.add.circle(0, 0, data.size * 1.35, 0x000000, 0)
            .setStrokeStyle(1.5, 0xff6f92, 0.75);
        orb.add([corona, shell, runeRing, core]);

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
            corona.alpha = 0.12 + Math.abs(Math.sin(orb.lifeTick * 1.1)) * 0.12;
            runeRing.rotation -= 0.07;

            if (Math.random() > 0.48) this.spawnEmber(orb.x, orb.y, dir + Math.PI);
            if (Math.random() > 0.7) this.spawnSpark(orb.x, orb.y, dir + Math.PI, false);
            if (Math.random() > 0.8) this.spawnSpark(orb.x, orb.y, dir + Math.PI, true);

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
            corona.destroy();
            runeRing.destroy();
        });

        this.scene.projectiles.push(orb);
        this.addTrail(orb, 0xaa1b45, data.size + 1.3);
    }

    // Charged attack - rebuilt: charge burst + comet flight + huge explosion
    executeChargedAttack(angle) {
        this.ensureProceduralTextures();
        this.ultimateState = null;

        const charged = this.data.charged;
        const startX = this.player.x + Math.cos(angle) * 40;
        const startY = this.player.y + Math.sin(angle) * 40;
        const chargePower = 0.45 + this.chargeLevel * 0.75;

        const targetPoint = this.getClampedChargedTarget(
            this.player.x + Math.cos(angle) * charged.maxRange,
            this.player.y + Math.sin(angle) * charged.maxRange
        );

        const core = this.scene.add.graphics().setDepth(158);
        const aura = this.scene.add.circle(startX, startY, 24, 0xaa1f46, 0.24).setDepth(156);
        const sigil = this.scene.add.graphics().setDepth(157);

        const flames = this.scene.add.particles(startX, startY, 'staff-dark-flame', {
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

        const sparks = this.scene.add.particles(startX, startY, 'staff-dark-spark', {
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

            const blast = this.scene.add.circle(x, y, charged.radius * (0.48 + chargePower * 0.24), 0x8d1236, 0.62).setDepth(154);
            const shock = this.scene.add.circle(x, y, 24, 0xff8db0, 0)
                .setStrokeStyle(4, 0xff9fbe, 0.9)
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

            const explosion = this.scene.add.particles(x, y, 'staff-dark-spark', {
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

            const flameBurst = this.scene.add.particles(x, y, 'staff-dark-flame', {
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
                            boss.setTint(0xc02244);
                            this.scene.time.delayedCall(120, () => boss.clearTint());
                            tick++;
                        }, charged.dotInterval);
                    }
                }
            }

            sigil.destroy();
            this.scene.cameras.main.flash(180, 220, 70, 120);
            this.scene.cameras.main.shake(160, 0.006 + chargePower * 0.0014);

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
                this.drawChargedSigil(sigil, flight.x, flight.y, chargePower, flight.tick);

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


    startUltimateCharge(targetX, targetY) {
        if (this.ultimateState || !this.canUseUltimate()) return false;

        const angle = Math.atan2((targetY || this.player.y) - this.player.y, (targetX || this.player.x) - this.player.x);
        const centerX = this.player.x + Math.cos(angle) * 40;
        const centerY = this.player.y + Math.sin(angle) * 40;

        const core = this.scene.add.graphics().setDepth(182);
        const ring = this.scene.add.circle(centerX, centerY, 26, 0x220022, 0.22).setDepth(181);

        const flames = this.scene.add.particles(centerX, centerY, 'staff-dark-flame', {
            speed: { min: 30, max: 90 },
            angle: { min: 0, max: 360 },
            scale: { start: 1.1, end: 0 },
            alpha: { start: 0.85, end: 0 },
            lifespan: { min: 500, max: 1000 },
            frequency: 30,
            quantity: 2,
            blendMode: 'ADD',
            emitting: true
        }).setDepth(183);

        const sparks = this.scene.add.particles(centerX, centerY, 'staff-dark-spark', {
            speed: { min: 15, max: 70 },
            scale: { start: 0.8, end: 0 },
            alpha: { start: 0.8, end: 0 },
            lifespan: { min: 380, max: 800 },
            frequency: 70,
            quantity: 1,
            blendMode: 'SCREEN',
            emitting: true
        }).setDepth(184);

        this.ultimateState = {
            phase: 'charge',
            startedAt: this.scene.time.now,
            centerX,
            centerY,
            core,
            ring,
            flames,
            sparks,
            power: 1,
            targetX: targetX || this.player.x,
            targetY: targetY || this.player.y,
            coreX: centerX,
            coreY: centerY,
            releaseVector: { x: 0, y: 0 },
            orbs: [],
            beamGraphics: null,
            sigilGraphics: null,
            launchTrail: null
        };

        return true;
    }

    releaseUltimate(targetX, targetY) {
        const state = this.ultimateState;
        if (!state || state.phase !== 'charge') return false;

        if (!this.consumeUltimate()) {
            this.destroyUltimateState();
            return false;
        }

        const chargeDuration = 2300;
        const progress = Phaser.Math.Clamp((this.scene.time.now - state.startedAt) / chargeDuration, 0.2, 1);
        const power = 1 + progress * 1.25;
        state.power = power;

        state.targetX = targetX ?? state.targetX;
        state.targetY = targetY ?? state.targetY;
        const clamped = this.getClampedChargedTarget(state.targetX, state.targetY);
        state.targetX = clamped.x;
        state.targetY = clamped.y;
        const dirX = state.targetX - state.centerX;
        const dirY = state.targetY - state.centerY;
        const dirLength = Math.max(1, Math.sqrt((dirX * dirX) + (dirY * dirY)));
        state.releaseVector = { x: dirX / dirLength, y: dirY / dirLength };

        state.phase = 'launch';
        state.flames?.stop?.();
        state.sparks?.stop?.();

        state.coreX = state.centerX;
        state.coreY = state.centerY;

        state.launchTrail = this.scene.add.particles(state.centerX, state.centerY, 'staff-dark-spark', {
            speed: { min: 10, max: 40 },
            scale: { start: 0.9, end: 0 },
            alpha: { start: 0.8, end: 0 },
            lifespan: { min: 180, max: 420 },
            frequency: 22,
            quantity: 2,
            blendMode: 'ADD',
            emitting: true
        }).setDepth(186);

        this.scene.tweens.add({
            targets: state,
            centerX: state.targetX,
            centerY: state.targetY,
            duration: 430,
            ease: 'Cubic.easeInOut'
        });

        const radius = 92 + power * 34;
        const dirs = [
            { x: 0, y: -1 },
            { x: 1, y: 0 },
            { x: 0, y: 1 },
            { x: -1, y: 0 }
        ];

        for (let i = 0; i < dirs.length; i++) {
            const dir = dirs[i];
            const orbCore = this.scene.add.graphics().setDepth(186);
            const shadow = this.scene.add.circle(state.centerX, state.centerY, 18, 0x000000, 0.35).setDepth(185).setBlendMode(Phaser.BlendModes.MULTIPLY);
            const targetPos = {
                x: state.targetX + dir.x * radius,
                y: state.targetY + dir.y * radius
            };

            const trail = this.scene.add.particles(state.centerX, state.centerY, 'staff-dark-flame', {
                speed: { min: 60, max: 180 },
                angle: { min: 0, max: 360 },
                scale: { start: 0.9, end: 0 },
                alpha: { start: 0.8, end: 0 },
                lifespan: { min: 260, max: 540 },
                frequency: 16,
                quantity: 2,
                blendMode: 'SCREEN',
                emitting: true
            }).setDepth(184);

            const orb = { x: state.centerX, y: state.centerY, core: orbCore, shadow, trail, targetPos, index: i, phase: Math.random() * Math.PI * 2 };
            state.orbs.push(orb);

            this.scene.tweens.add({
                targets: orb,
                x: targetPos.x,
                y: targetPos.y,
                duration: 540,
                ease: 'Cubic.easeOut'
            });
        }

        if (state.ring?.scene) {
            this.scene.tweens.add({
                targets: state.ring,
                alpha: 0,
                scale: 2.2,
                duration: 320,
                onComplete: () => state.ring?.destroy()
            });
        }

        this.scene.time.delayedCall(620, () => {
            if (!this.ultimateState || this.ultimateState !== state) return;
            state.phase = 'surge';
            state.surgeStartedAt = this.scene.time.now;
            state.beamGraphics = this.scene.add.graphics().setDepth(187);
            state.sigilGraphics = this.scene.add.graphics().setDepth(186);
            state.launchTrail?.destroy();
            state.launchTrail = null;
        });

        this.scene.time.delayedCall(1720, () => {
            if (!this.ultimateState || this.ultimateState !== state) return;
            this.explodeUltimateCross(state);
        });

        return true;
    }

    updateUltimate(time, delta, targetX, targetY) {
        const state = this.ultimateState;
        if (!state) return;

        if (state.phase === 'charge') {
            state.targetX = targetX ?? state.targetX;
            state.targetY = targetY ?? state.targetY;
            const angle = Math.atan2(state.targetY - this.player.y, state.targetX - this.player.x);
            state.centerX = this.player.x + Math.cos(angle) * 40;
            state.centerY = this.player.y + Math.sin(angle) * 40;

            const progress = Phaser.Math.Clamp((time - state.startedAt) / 2300, 0, 1);
            state.power = 1 + progress * 1.25;
            state.coreX = state.centerX;
            state.coreY = state.centerY;

            state.flames?.setPosition?.(state.centerX, state.centerY);
            state.sparks?.setPosition?.(state.centerX, state.centerY);
            state.flames?.setFrequency?.(30 - Math.floor(progress * 22));
            state.sparks?.setFrequency?.(70 - Math.floor(progress * 45));

            if (state.ring?.scene) {
                state.ring.setPosition(state.centerX, state.centerY);
                state.ring.alpha = 0.18 + progress * 0.16;
                state.ring.radius = 26 + progress * 16;
            }

            if (state.core?.scene) {
                this.drawVoidCore(state.core, state.centerX, state.centerY, 0.7 + progress * 2.3, time * 0.01);
            }
            return;
        }

        for (const orb of state.orbs) {
            orb.phase += 0.04;
            if (orb.core?.scene) this.drawDarkOrbCore(orb.core, orb.x, orb.y, 1 + Math.sin(orb.phase) * 0.14);
            if (orb.shadow?.scene) {
                orb.shadow.setPosition(orb.x, orb.y);
                orb.shadow.radius = 18 + Math.sin(orb.phase * 1.3) * 2.5;
            }
            orb.trail?.setPosition?.(orb.x, orb.y);
        }

        if (state.phase === 'launch' && state.core?.scene) {
            state.coreX = Phaser.Math.Linear(state.coreX, state.targetX, 0.16);
            state.coreY = Phaser.Math.Linear(state.coreY, state.targetY, 0.16);
            this.drawVoidCore(state.core, state.coreX, state.coreY, 1.35 + Math.sin(time * 0.03) * 0.2, time * 0.012);
            state.launchTrail?.setPosition?.(state.coreX, state.coreY);
        }

        if (state.phase === 'surge' && state.beamGraphics) {
            const t = Phaser.Math.Clamp((time - state.surgeStartedAt) / 1000, 0, 1);
            state.beamGraphics.clear();
            state.sigilGraphics?.clear?.();

            const spin = time * 0.0015;
            for (let i = 0; i < 2; i++) {
                const radius = 42 + t * 58 + (i * 28);
                const alpha = 0.22 + (i * 0.08) + t * 0.1;
                state.sigilGraphics.lineStyle(2 + i, 0xff4470, alpha);
                state.sigilGraphics.strokeCircle(state.targetX, state.targetY, radius);

                for (let p = 0; p < 12; p++) {
                    const a = spin * (i === 0 ? 1 : -0.8) + ((Math.PI * 2 * p) / 12);
                    const px = state.targetX + Math.cos(a) * radius;
                    const py = state.targetY + Math.sin(a) * radius;
                    state.sigilGraphics.fillStyle(0xff6688, alpha * 0.95);
                    state.sigilGraphics.fillCircle(px, py, 2.4 + i);
                }
            }

            for (const orb of state.orbs) {
                const width = 4 + Math.sin((time * 0.015) + orb.index) * 2 + t * 4;
                const alpha = 0.5 + Math.sin((time * 0.02) + orb.index) * 0.22;
                state.beamGraphics.lineStyle(width, 0xff2244, Phaser.Math.Clamp(alpha, 0.28, 0.98));
                state.beamGraphics.lineBetween(orb.x, orb.y, state.targetX, state.targetY);

                const tangent = ((Math.PI * 2) / state.orbs.length) * orb.index + spin * 2;
                orb.x += Math.cos(tangent) * 0.45;
                orb.y += Math.sin(tangent) * 0.45;

                if (Math.random() > 0.35) {
                    const ember = this.scene.add.image(orb.x, orb.y, 'staff-dark-spark').setDepth(188);
                    this.scene.tweens.add({
                        targets: ember,
                        x: state.targetX + Phaser.Math.Between(-18, 18),
                        y: state.targetY + Phaser.Math.Between(-18, 18),
                        alpha: 0,
                        scale: 0.2,
                        duration: Phaser.Math.Between(170, 260),
                        onComplete: () => ember.destroy()
                    });
                }
            }
        }
    }

    explodeUltimateCross(state) {
        state.phase = 'impact';

        if (state.beamGraphics) state.beamGraphics.destroy();
        if (state.sigilGraphics) state.sigilGraphics.destroy();

        const x = state.targetX;
        const y = state.targetY;
        const power = state.power;

        const burst = this.scene.add.particles(x, y, 'staff-dark-spark', {
            speed: { min: 180, max: 520 + power * 140 },
            angle: { min: 0, max: 360 },
            scale: { start: 2.2 + power * 0.5, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: { min: 520, max: 1300 },
            quantity: Math.floor(120 + power * 55),
            blendMode: 'SCREEN',
            emitting: false
        }).setDepth(190);
        burst.explode();

        const crossAngles = [0, 90, 180, 270];
        for (const a of crossAngles) {
            const flameLine = this.scene.add.particles(x, y, 'staff-dark-flame', {
                angle: { min: a - 8, max: a + 8 },
                speed: { min: 220, max: 680 + power * 100 },
                scale: { start: 2.8 + power * 0.4, end: 0 },
                alpha: { start: 0.95, end: 0 },
                lifespan: { min: 520, max: 1250 },
                quantity: Math.floor(85 + power * 25),
                blendMode: 'ADD',
                emitting: false
            }).setDepth(189);
            flameLine.explode();
            this.scene.time.delayedCall(1200, () => flameLine.destroy());
        }

        const pullRing = this.scene.add.circle(x, y, 24, 0x2a0005, 0.38).setDepth(191).setBlendMode(Phaser.BlendModes.MULTIPLY);
        this.scene.tweens.add({
            targets: pullRing,
            radius: 230 + power * 40,
            alpha: 0,
            duration: 420,
            onComplete: () => pullRing.destroy()
        });

        for (let i = 0; i < 10; i++) {
            const ring = this.scene.add.circle(x, y, 30 + i * 4, 0xff3358, 0).setDepth(191).setStrokeStyle(2, 0xff86a2, 0.45);
            this.scene.tweens.add({
                targets: ring,
                radius: 120 + i * 26 + power * 22,
                alpha: { from: 0.55, to: 0 },
                duration: 320 + i * 28,
                ease: 'Sine.easeOut',
                onComplete: () => ring.destroy()
            });
        }

        const boss = this.scene.boss;
        if (boss) {
            const dist = Phaser.Math.Distance.Between(x, y, boss.x, boss.y);
            const damageRadius = 150 + power * 25;
            if (dist <= damageRadius) {
                const finalDamage = (170 + 85 * power) * (this.player.damageMultiplier || 1.0);
                boss.takeDamage(finalDamage);
                boss.setTint(0xaa2255);
                this.gainUltimateGaugeFromDamage(finalDamage, { charged: true });
                this.scene.time.delayedCall(180, () => boss.clearTint());
            }
        }

        this.scene.cameras.main.flash(260, 200, 20, 60);
        this.scene.cameras.main.shake(280, 0.011 + power * 0.0015);

        this.scene.time.delayedCall(1300, () => burst.destroy());
        this.destroyUltimateState();
    }

    destroyUltimateState() {
        const state = this.ultimateState;
        if (!state) return;

        state.core?.destroy();
        state.ring?.destroy();
        state.flames?.destroy();
        state.sparks?.destroy();
        state.beamGraphics?.destroy();
        state.sigilGraphics?.destroy();
        state.launchTrail?.destroy();

        for (const orb of state.orbs || []) {
            orb.core?.destroy();
            orb.shadow?.destroy();
            orb.trail?.destroy();
        }

        this.ultimateState = null;
    }

    drawVoidCore(graphics, x, y, scale, tick) {
        graphics.clear();
        graphics.fillStyle(0x120000, 0.92);
        graphics.fillCircle(x, y, 15 * scale);

        graphics.fillStyle(0x3a0008, 0.95);
        graphics.fillCircle(x, y, 12 * scale);

        graphics.fillStyle(0xaa0018, 0.62);
        graphics.fillCircle(x + Math.cos(tick * 1.4) * 3, y + Math.sin(tick) * 3, 8 * scale);

        graphics.lineStyle(Math.max(1, 2.2 * scale), 0xff4466, 0.52);
        graphics.strokeCircle(x, y, 11 * scale);
    }

    drawDarkOrbCore(graphics, x, y, scale) {
        graphics.clear();
        graphics.fillStyle(0x2f0006, 0.94);
        graphics.fillCircle(x, y, 13 * scale);
        graphics.fillStyle(0x9e0016, 0.9);
        graphics.fillCircle(x, y, 9 * scale);
        graphics.fillStyle(0xff4a66, 0.82);
        graphics.fillCircle(x, y, 4.8 * scale);
    }

    drawBasicCore(graphics, baseSize, tick) {
        graphics.clear();

        const pulse = 1 + Math.sin(tick * 1.8) * 0.16;
        graphics.fillStyle(0x4c0013, 0.85);
        graphics.fillCircle(0, 0, baseSize * pulse);

        graphics.fillStyle(0xab1741, 0.84);
        graphics.fillCircle(Math.cos(tick) * 2, Math.sin(tick * 0.8) * 2, baseSize * 0.66 * pulse);

        graphics.fillStyle(0xffb3c8, 0.98);
        graphics.fillCircle(0, 0, baseSize * 0.34 * pulse);

        graphics.lineStyle(1.5, 0xff6f92, 0.62);
        graphics.strokeCircle(0, 0, baseSize * (1.25 + Math.sin(tick * 1.7) * 0.08));
    }

    drawChargedCore(graphics, x, y, power, tick) {
        const main = 14 + power * 10;
        const halo = 26 + power * 14;
        const pulse = 1 + Math.sin(tick * 1.35) * (0.18 + power * 0.08);

        graphics.clear();
        graphics.fillStyle(0x4a0014, 0.3);
        graphics.fillCircle(x, y, halo * pulse);

        graphics.fillStyle(0x8e1238, 0.8);
        graphics.fillCircle(x, y, main * pulse);

        graphics.fillStyle(0xd33561, 0.86);
        graphics.fillCircle(
            x + Math.cos(tick * 1.2) * (2 + power * 2),
            y + Math.sin(tick * 1.1) * (2 + power * 2),
            (main * 0.66) * pulse
        );

        graphics.fillStyle(0xffbfd1, 0.98);
        graphics.fillCircle(x, y, (main * 0.34) * pulse);

        for (let i = 0; i < 3; i++) {
            const a = tick * 1.7 + (Math.PI * 2 * i) / 3;
            graphics.fillStyle(0xff7fa2, 0.62);
            graphics.fillCircle(x + Math.cos(a) * (main * 0.65), y + Math.sin(a) * (main * 0.65), 2.4 + power);
        }

        graphics.lineStyle(2, 0xff86a7, 0.38);
        graphics.strokeCircle(x, y, main * (1.22 + Math.sin(tick) * 0.08));
    }

    drawChargedSigil(graphics, x, y, power, tick) {
        graphics.clear();
        const spin = tick * 0.09;
        const radius = 18 + power * 9;

        graphics.lineStyle(1.6, 0xff6f92, 0.54);
        graphics.strokeCircle(x, y, radius);
        graphics.lineStyle(1, 0xff9cbc, 0.4);
        graphics.strokeCircle(x, y, radius * 1.35);

        for (let i = 0; i < 6; i++) {
            const a = spin + ((Math.PI * 2 * i) / 6);
            const px = x + Math.cos(a) * radius;
            const py = y + Math.sin(a) * radius;
            graphics.fillStyle(0xff7fa2, 0.68);
            graphics.fillCircle(px, py, 2.2 + power * 0.7);
        }
    }

    spawnMiniFlare(x, y, angle) {
        for (let i = 0; i < 5; i++) {
            const dir = angle + Phaser.Math.FloatBetween(-0.7, 0.7);
            const spike = this.scene.add.triangle(x, y, 0, -7, -2, 6, 2, 6, 0xff7ca4, 0.85).setDepth(160);
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
            Phaser.Math.RND.pick([0xff9bbb, 0xff6f98, 0xd23861, 0x7f1132]),
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
