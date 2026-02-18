// BowWeapon.js - Eclipse Huntress: lunar/celestial arrows with moonlight energy
import { WeaponBase } from './WeaponBase.js';
import { WEAPONS } from './weaponData.js';

export class BowWeapon extends WeaponBase {
    constructor(scene, player) {
        super(scene, player, WEAPONS.BOW);
        this.ensureProceduralTextures();
        this.ultimateState = null;
    }

    // ── Procedural texture atlas ──────────────────────────────────────
    ensureProceduralTextures() {
        if (!this.scene.textures.exists('bow-lunar-spark')) {
            const g = this.scene.add.graphics();
            g.fillStyle(0xe8f0ff, 1);
            g.fillCircle(4, 4, 2.0);
            g.fillStyle(0xb0c8e8, 0.88);
            g.fillCircle(4, 4, 3.0);
            g.lineStyle(1, 0xd4e6ff, 0.95);
            g.strokeCircle(4, 4, 3.6);
            g.generateTexture('bow-lunar-spark', 8, 8);
            g.destroy();
        }

        if (!this.scene.textures.exists('bow-eclipse-shard')) {
            const g = this.scene.add.graphics();
            g.fillGradientStyle(0x1a1a44, 0x0a0a2e, 0x3344aa, 0x060618, 1);
            g.fillTriangle(8, 1, 13, 15, 3, 15);
            g.lineStyle(1.5, 0x7788cc, 0.9);
            g.strokeTriangle(8, 1, 13, 15, 3, 15);
            g.generateTexture('bow-eclipse-shard', 16, 16);
            g.destroy();
        }

        if (!this.scene.textures.exists('bow-wind-wisp')) {
            const g = this.scene.add.graphics();
            g.fillGradientStyle(0x66ddee, 0x4488bb, 0x2266aa, 0x113355, 1);
            g.fillCircle(6, 6, 4);
            g.lineStyle(1, 0x99eeff, 0.85);
            g.strokeCircle(6, 6, 5);
            g.generateTexture('bow-wind-wisp', 12, 12);
            g.destroy();
        }

        if (!this.scene.textures.exists('bow-crescent-mote')) {
            const g = this.scene.add.graphics();
            g.fillStyle(0xd8e8ff, 0.92);
            g.beginPath();
            g.arc(6, 6, 5, -Math.PI * 0.6, Math.PI * 0.6, false);
            g.arc(4, 6, 3.8, Math.PI * 0.5, -Math.PI * 0.5, true);
            g.closePath();
            g.fillPath();
            g.lineStyle(1, 0xf0f8ff, 0.9);
            g.beginPath();
            g.arc(6, 6, 5, -Math.PI * 0.6, Math.PI * 0.6, false);
            g.strokePath();
            g.generateTexture('bow-crescent-mote', 12, 12);
            g.destroy();
        }
    }

    // ── Helper particle spawners ──────────────────────────────────────
    spawnLunarSpark(x, y, angle) {
        const spark = this.scene.add.image(
            x + Phaser.Math.Between(-4, 4),
            y + Phaser.Math.Between(-4, 4),
            'bow-lunar-spark'
        ).setDepth(157);
        spark.setScale(Phaser.Math.FloatBetween(0.5, 1.0));

        const drift = angle + Phaser.Math.FloatBetween(-0.5, 0.5);
        this.scene.tweens.add({
            targets: spark,
            x: spark.x + Math.cos(drift) * Phaser.Math.Between(14, 38),
            y: spark.y + Math.sin(drift) * Phaser.Math.Between(14, 38),
            alpha: 0,
            scale: 0.15,
            duration: Phaser.Math.Between(100, 220),
            onComplete: () => spark.destroy()
        });
    }

    spawnWindWisp(x, y, angle) {
        const wisp = this.scene.add.image(
            x + Phaser.Math.Between(-5, 5),
            y + Phaser.Math.Between(-5, 5),
            'bow-wind-wisp'
        ).setDepth(155);
        wisp.setScale(Phaser.Math.FloatBetween(0.4, 0.9));

        const drift = angle + Phaser.Math.FloatBetween(-0.7, 0.7);
        this.scene.tweens.add({
            targets: wisp,
            x: wisp.x + Math.cos(drift) * Phaser.Math.Between(10, 30),
            y: wisp.y + Math.sin(drift) * Phaser.Math.Between(10, 30),
            alpha: 0,
            scale: 0.2,
            duration: Phaser.Math.Between(100, 200),
            onComplete: () => wisp.destroy()
        });
    }

    spawnCrescentMote(x, y, angle) {
        const mote = this.scene.add.image(
            x + Phaser.Math.Between(-3, 3),
            y + Phaser.Math.Between(-3, 3),
            'bow-crescent-mote'
        ).setDepth(156);
        mote.setScale(Phaser.Math.FloatBetween(0.5, 1.1));
        mote.rotation = Phaser.Math.FloatBetween(0, Math.PI * 2);

        const drift = angle + Phaser.Math.FloatBetween(-0.6, 0.6);
        this.scene.tweens.add({
            targets: mote,
            x: mote.x + Math.cos(drift) * Phaser.Math.Between(12, 34),
            y: mote.y + Math.sin(drift) * Phaser.Math.Between(12, 34),
            alpha: 0,
            scale: 0.18,
            rotation: mote.rotation + Phaser.Math.FloatBetween(-1.0, 1.0),
            duration: Phaser.Math.Between(110, 240),
            onComplete: () => mote.destroy()
        });
    }

    spawnEclipseShard(x, y, angle) {
        const shard = this.scene.add.image(
            x + Phaser.Math.Between(-4, 4),
            y + Phaser.Math.Between(-4, 4),
            'bow-eclipse-shard'
        ).setDepth(158);
        shard.setScale(Phaser.Math.FloatBetween(0.5, 1.0));
        shard.rotation = angle + Phaser.Math.FloatBetween(-0.4, 0.4);

        const drift = angle + Phaser.Math.FloatBetween(-0.55, 0.55);
        this.scene.tweens.add({
            targets: shard,
            x: shard.x + Math.cos(drift) * Phaser.Math.Between(16, 44),
            y: shard.y + Math.sin(drift) * Phaser.Math.Between(16, 44),
            alpha: 0,
            scale: 0.12,
            rotation: shard.rotation + Phaser.Math.FloatBetween(-1.2, 1.2),
            duration: Phaser.Math.Between(120, 260),
            onComplete: () => shard.destroy()
        });
    }

    // ── Drawing helpers ───────────────────────────────────────────────
    drawLunarArrowCore(graphics, baseSize, tick) {
        graphics.clear();

        const pulse = 1 + Math.sin(tick * 1.6) * 0.14;

        // Deep blue base
        graphics.fillStyle(0x0e1638, 0.85);
        graphics.fillCircle(0, 0, baseSize * pulse);

        // Mid-layer moonlight
        graphics.fillStyle(0x4466aa, 0.8);
        graphics.fillCircle(Math.cos(tick) * 1.5, Math.sin(tick * 0.9) * 1.5, baseSize * 0.65 * pulse);

        // Bright lunar core
        graphics.fillStyle(0xd8e8ff, 0.95);
        graphics.fillCircle(0, 0, baseSize * 0.32 * pulse);

        // Ring
        graphics.lineStyle(1.4, 0x8899cc, 0.58);
        graphics.strokeCircle(0, 0, baseSize * (1.2 + Math.sin(tick * 1.5) * 0.06));
    }

    drawCelestialSigil(graphics, x, y, radius, tick) {
        graphics.clear();
        const spin = tick * 0.08;

        graphics.lineStyle(1.4, 0x8899cc, 0.5);
        graphics.strokeCircle(x, y, radius);
        graphics.lineStyle(1, 0xaabbdd, 0.35);
        graphics.strokeCircle(x, y, radius * 1.3);

        for (let i = 0; i < 8; i++) {
            const a = spin + (Math.PI * 2 * i) / 8;
            const px = x + Math.cos(a) * radius;
            const py = y + Math.sin(a) * radius;
            graphics.fillStyle(0xc8d8ff, 0.65);
            graphics.fillCircle(px, py, 2.0);
        }
    }

    // ── Basic attack: spectral lunar arrow ────────────────────────────
    fire(angle) {
        const data = this.data.projectile;
        const startX = this.player.x + Math.cos(angle) * 30;
        const startY = this.player.y + Math.sin(angle) * 30;

        this.createMuzzleFlash(startX, startY, this.data.color);
        this.spawnMuzzleCrescents(startX, startY, angle);

        // Multi-layer spectral arrow in a container
        const arrow = this.scene.add.container(startX, startY).setDepth(150);

        // Outer aura ellipse - soft moonlight haze
        const aura = this.scene.add.ellipse(0, 0, data.size * 4.2, data.size * 1.6, 0x3355aa, 0.18);
        aura.setStrokeStyle(1, 0x88aadd, 0.25);

        // Arrow shaft - long luminous body
        const shaft = this.scene.add.rectangle(0, 0, data.size * 2.5, data.size * 0.7, 0xb0c8e8, 0.92);
        shaft.setStrokeStyle(0.8, 0xd8e8ff, 0.6);

        // Glowing tip - triangular point
        const tip = this.scene.add.triangle(
            data.size * 1.4, 0,
            0, -4,
            8, 0,
            0, 4,
            0xe0f0ff, 1
        );

        // Tail feather - fading aft glow
        const tailGlow = this.scene.add.ellipse(-data.size * 1.2, 0, data.size * 1.4, data.size * 0.5, 0x667fbb, 0.35);

        // Rune ring - rotating celestial mark
        const runeRing = this.scene.add.circle(0, 0, data.size * 1.0, 0x000000, 0)
            .setStrokeStyle(1.2, 0x8899cc, 0.6);

        // Living lunar core (graphics-based for procedural wobble)
        const core = this.scene.add.graphics();

        arrow.add([aura, tailGlow, shaft, runeRing, core, tip]);
        arrow.rotation = angle;

        arrow.vx = Math.cos(angle) * data.speed;
        arrow.vy = Math.sin(angle) * data.speed;
        arrow.damage = data.damage;
        arrow.range = data.range;
        arrow.startX = startX;
        arrow.startY = startY;
        arrow.lifeTick = 0;

        arrow.update = () => {
            arrow.lifeTick += 0.28;
            const dir = Math.atan2(arrow.vy, arrow.vx);

            this.drawLunarArrowCore(core, data.size * 0.5, arrow.lifeTick);

            // Breathing animations
            aura.alpha = 0.12 + Math.abs(Math.sin(arrow.lifeTick * 1.2)) * 0.1;
            aura.scaleX = 1 + Math.sin(arrow.lifeTick * 1.4) * 0.06;
            runeRing.rotation -= 0.09;
            tailGlow.alpha = 0.25 + Math.abs(Math.sin(arrow.lifeTick * 0.9)) * 0.15;

            // Continuous particle spawning during flight
            if (Math.random() > 0.5) this.spawnLunarSpark(arrow.x, arrow.y, dir + Math.PI);
            if (Math.random() > 0.72) this.spawnWindWisp(arrow.x, arrow.y, dir + Math.PI);
            if (Math.random() > 0.85) this.spawnCrescentMote(arrow.x, arrow.y, dir + Math.PI);
        };

        arrow.on('destroy', () => {
            core.destroy();
        });

        this.scene.projectiles.push(arrow);
        this.addTrail(arrow, data.color, data.size);
    }

    // Muzzle crescent burst on fire
    spawnMuzzleCrescents(x, y, angle) {
        for (let i = 0; i < 4; i++) {
            const dir = angle + Phaser.Math.FloatBetween(-0.65, 0.65);
            const mote = this.scene.add.image(x, y, 'bow-crescent-mote').setDepth(160);
            mote.setScale(Phaser.Math.FloatBetween(0.6, 1.0));
            mote.rotation = dir;

            this.scene.tweens.add({
                targets: mote,
                x: x + Math.cos(dir) * Phaser.Math.Between(10, 26),
                y: y + Math.sin(dir) * Phaser.Math.Between(10, 26),
                alpha: 0,
                scaleY: 0.2,
                duration: Phaser.Math.Between(90, 170),
                onComplete: () => mote.destroy()
            });
        }
    }

    // ── Charged attack: Cataclysm Rain with celestial visuals ─────────
    executeChargedAttack(angle) {
        this.ensureProceduralTextures();
        const charged = this.data.charged;

        const targetPoint = this.getClampedChargedTarget(this.scene.worldMouseX, this.scene.worldMouseY);
        const centerX = targetPoint.x;
        const centerY = targetPoint.y;

        const waves = 6;
        const perWaveDamage = (charged.damage / waves) * (this.player.damageMultiplier || 1.0);

        // Ground marking circle - celestial target zone
        const groundMark = this.scene.add.graphics().setDepth(119);
        groundMark.lineStyle(2, 0x6688bb, 0.45);
        groundMark.strokeCircle(centerX, centerY, charged.radius);
        groundMark.lineStyle(1, 0x8899cc, 0.3);
        groundMark.strokeCircle(centerX, centerY, charged.radius * 0.7);

        // Celestial rune dots on the ground circle
        for (let i = 0; i < 12; i++) {
            const a = (Math.PI * 2 * i) / 12;
            const rx = centerX + Math.cos(a) * charged.radius;
            const ry = centerY + Math.sin(a) * charged.radius;
            groundMark.fillStyle(0xb0c8e8, 0.55);
            groundMark.fillCircle(rx, ry, 2.2);
        }

        // Fade ground mark out
        const groundMarkAlpha = { value: 1 };
        this.scene.tweens.add({
            targets: groundMarkAlpha,
            value: 0,
            duration: waves * 180 + 300,
            onUpdate: () => {
                if (!groundMark.scene) return;
                groundMark.alpha = groundMarkAlpha.value;
            },
            onComplete: () => groundMark.destroy()
        });

        for (let wave = 0; wave < waves; wave++) {
            this.scene.time.delayedCall(wave * 180, () => {
                // Spectral arrow visuals per rain arrow
                for (let i = 0; i < Math.ceil(charged.arrows / waves); i++) {
                    const x = centerX + (Math.random() - 0.5) * charged.radius * 2;
                    const y = centerY + (Math.random() - 0.5) * charged.radius * 2;

                    // Multi-part rain arrow instead of plain rectangle
                    const rainContainer = this.scene.add.container(x, y - 70).setDepth(155);
                    const rainShaft = this.scene.add.rectangle(0, 0, 3.5, 16, 0xb0c8e8, 0.9);
                    const rainTip = this.scene.add.triangle(0, -9, -2.5, 0, 2.5, 0, 0, -5, 0xe0f0ff, 1);
                    const rainGlow = this.scene.add.ellipse(0, 0, 6, 20, 0x4466aa, 0.2);
                    rainContainer.add([rainGlow, rainShaft, rainTip]);

                    this.scene.tweens.add({
                        targets: rainContainer,
                        y,
                        duration: 220,
                        onComplete: () => {
                            // Impact micro-burst at landing
                            if (rainContainer.scene) {
                                const impactDot = this.scene.add.circle(x, y, 4, 0xd8e8ff, 0.6).setDepth(156);
                                this.scene.tweens.add({
                                    targets: impactDot,
                                    scale: 1.8,
                                    alpha: 0,
                                    duration: 140,
                                    onComplete: () => impactDot.destroy()
                                });
                            }
                            rainContainer.destroy();
                        }
                    });

                    // Particle trail on each rain arrow
                    if (Math.random() > 0.5) {
                        this.spawnLunarSpark(x, y - 50, Math.PI * 0.5);
                    }
                }

                // Lunar impact ring per wave with expanding sigil
                const impactRing = this.scene.add.circle(centerX, centerY, charged.radius, 0x88dd88, 0.1);
                impactRing.setStrokeStyle(2, 0x8899cc, 0.5);
                impactRing.setDepth(120);

                const sigilGraphics = this.scene.add.graphics().setDepth(121);
                const waveSpin = wave * 0.5;
                for (let j = 0; j < 6; j++) {
                    const sa = waveSpin + (Math.PI * 2 * j) / 6;
                    const sx = centerX + Math.cos(sa) * charged.radius * 0.85;
                    const sy = centerY + Math.sin(sa) * charged.radius * 0.85;
                    sigilGraphics.fillStyle(0xb0c8e8, 0.45);
                    sigilGraphics.fillCircle(sx, sy, 2.5);
                }

                this.scene.tweens.add({
                    targets: impactRing,
                    alpha: 0,
                    scale: 1.08,
                    duration: 180,
                    onComplete: () => {
                        impactRing.destroy();
                        sigilGraphics.destroy();
                    }
                });

                // Wave transition crescent burst
                if (wave > 0 && wave < waves - 1) {
                    for (let k = 0; k < 3; k++) {
                        const ba = Math.random() * Math.PI * 2;
                        const bx = centerX + Math.cos(ba) * charged.radius * 0.6;
                        const by = centerY + Math.sin(ba) * charged.radius * 0.6;
                        this.spawnCrescentMote(bx, by, ba);
                    }
                }

                const boss = this.scene.boss;
                if (!boss) return;

                const distToBoss = Phaser.Math.Distance.Between(centerX, centerY, boss.x, boss.y);
                if (distToBoss <= charged.radius) {
                    boss.takeDamage(perWaveDamage);
                    this.gainUltimateGaugeFromDamage(perWaveDamage, { charged: true });
                    if (wave === 0) {
                        console.log(`\u{1F3F9} Cataclysm Rain: ${Math.floor(perWaveDamage)} per wave x${waves}`);
                    }
                }
            });
        }
    }

    // ── Ultimate charge: Eclipse Huntress stance ──────────────────────
    startUltimateCharge(targetX, targetY) {
        if (this.ultimateState || !this.canUseUltimate()) return false;
        this.ensureProceduralTextures();

        const fallbackX = this.player.x + 1;
        const fallbackY = this.player.y;
        const target = this.getClampedChargedTarget(targetX ?? fallbackX, targetY ?? fallbackY);

        const aura = this.scene.add.graphics().setDepth(186);
        const reticle = this.scene.add.graphics().setDepth(187);
        const ribbons = this.scene.add.graphics().setDepth(185);

        // Particle emitters around the player during charge
        const lunarEmitter = this.scene.add.particles(this.player.x, this.player.y, 'bow-lunar-spark', {
            speed: { min: 15, max: 60 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.9, end: 0 },
            alpha: { start: 0.8, end: 0 },
            lifespan: { min: 400, max: 900 },
            frequency: 40,
            quantity: 1,
            blendMode: 'ADD',
            emitting: true
        }).setDepth(184);

        const shardEmitter = this.scene.add.particles(this.player.x, this.player.y, 'bow-eclipse-shard', {
            speed: { min: 20, max: 55 },
            scale: { start: 0.7, end: 0 },
            alpha: { start: 0.7, end: 0 },
            lifespan: { min: 350, max: 750 },
            frequency: 80,
            quantity: 1,
            blendMode: 'SCREEN',
            emitting: true
        }).setDepth(183);

        // Spirit bow container with breathing detail
        const spiritBow = this.scene.add.container(this.player.x, this.player.y).setDepth(188);

        // Outer glow haze
        const glow = this.scene.add.ellipse(0, 0, 150, 48, 0x3355aa, 0.16)
            .setStrokeStyle(2, 0xb0c8e8, 0.55);

        // Bow arc - lunar crescent shape
        const bowArc = this.scene.add.arc(0, 0, 42, 90, 270, false, 0xb0c8e8, 0.18)
            .setStrokeStyle(3, 0xd8e8ff, 0.9);

        // Bowstring with moonlight tint
        const bowString = this.scene.add.line(0, 0, -6, -38, -6, 38, 0xd8e8ff, 0.85).setLineWidth(2, 2);

        // Spectral arrow on the string
        const spectralArrow = this.scene.add.rectangle(8, 0, 52, 5, 0xb0e8ff, 0.88)
            .setStrokeStyle(1, 0xffffff, 0.85);

        // Crescent moon emblem on the bow
        const crescentMark = this.scene.add.arc(0, 0, 12, -60, 60, false, 0xd8e8ff, 0)
            .setStrokeStyle(1.5, 0xc8d8ff, 0.7);

        // Inner rune ring on bow body
        const bowRuneRing = this.scene.add.circle(0, 0, 28, 0x000000, 0)
            .setStrokeStyle(1, 0x6688bb, 0.4);

        spiritBow.add([glow, bowRuneRing, bowArc, bowString, spectralArrow, crescentMark]);

        this.ultimateState = {
            phase: 'charge',
            targetX: target.x,
            targetY: target.y,
            aura,
            reticle,
            spiritBow,
            ribbons,
            lunarEmitter,
            shardEmitter,
            pulse: 0
        };

        return true;
    }

    // ── Ultimate update: animated celestial aura ──────────────────────
    updateUltimate(time, delta, targetX, targetY) {
        const state = this.ultimateState;
        if (!state || state.phase !== 'charge') return;

        const clamped = this.getClampedChargedTarget(targetX ?? state.targetX, targetY ?? state.targetY);
        state.targetX = clamped.x;
        state.targetY = clamped.y;
        state.pulse += delta * 0.008;

        const aimAngle = Math.atan2(state.targetY - this.player.y, state.targetX - this.player.x);
        state.spiritBow.x = this.player.x;
        state.spiritBow.y = this.player.y;
        state.spiritBow.rotation = aimAngle;
        state.spiritBow.scale = 1 + Math.sin(time * 0.015) * 0.05;

        // Update emitter positions
        state.lunarEmitter?.setPosition?.(this.player.x, this.player.y);
        state.shardEmitter?.setPosition?.(this.player.x, this.player.y);

        // Aura circles with animated celestial rune dots
        state.aura.clear();

        const innerR = 58 + Math.sin(time * 0.012) * 4;
        const outerR = 82 + Math.sin(time * 0.01 + 1.2) * 5;
        const midR = 70;

        // Inner circle
        state.aura.lineStyle(2.5, 0x3355aa, 0.5);
        state.aura.strokeCircle(this.player.x, this.player.y, innerR);

        // Animated celestial rune dots on inner circle
        const dotSpin1 = time * 0.003;
        for (let i = 0; i < 8; i++) {
            const da = dotSpin1 + (Math.PI * 2 * i) / 8;
            const dx = this.player.x + Math.cos(da) * innerR;
            const dy = this.player.y + Math.sin(da) * innerR;
            state.aura.fillStyle(0xb0c8e8, 0.6 + Math.sin(time * 0.02 + i) * 0.2);
            state.aura.fillCircle(dx, dy, 2.0);
        }

        // Outer circle
        state.aura.lineStyle(1.5, 0xb0c8e8, 0.45);
        state.aura.strokeCircle(this.player.x, this.player.y, outerR);

        // Animated rune dots on outer circle (counter-rotating)
        const dotSpin2 = -time * 0.0025;
        for (let i = 0; i < 12; i++) {
            const da = dotSpin2 + (Math.PI * 2 * i) / 12;
            const dx = this.player.x + Math.cos(da) * outerR;
            const dy = this.player.y + Math.sin(da) * outerR;
            state.aura.fillStyle(0xd8e8ff, 0.5 + Math.sin(time * 0.018 + i * 0.7) * 0.2);
            state.aura.fillCircle(dx, dy, 1.6);
        }

        // Sweeping arcs
        state.aura.lineStyle(1.8, 0x8899cc, 0.42);
        state.aura.beginPath();
        state.aura.arc(this.player.x, this.player.y, midR, time * 0.004, time * 0.004 + 1.1);
        state.aura.strokePath();
        state.aura.beginPath();
        state.aura.arc(this.player.x, this.player.y, midR, time * 0.004 + Math.PI, time * 0.004 + Math.PI + 1.1);
        state.aura.strokePath();

        // Ribbons with lunar particle spawning
        state.ribbons.clear();
        state.ribbons.lineStyle(2, 0x6688bb, 0.45);
        for (let i = 0; i < 2; i++) {
            const offset = i === 0 ? Math.PI * 0.5 : -Math.PI * 0.5;
            const sweep = state.pulse * 0.85 + offset;
            const sx = this.player.x + Math.cos(sweep) * 26;
            const sy = this.player.y + Math.sin(sweep) * 26;
            const mx = this.player.x + Math.cos(sweep + 0.75) * 68;
            const my = this.player.y + Math.sin(sweep + 0.75) * 68;
            const ex = this.player.x + Math.cos(sweep + 1.35) * 34;
            const ey = this.player.y + Math.sin(sweep + 1.35) * 34;
            state.ribbons.beginPath();
            state.ribbons.moveTo(sx, sy);
            const segments = 14;
            for (let j = 1; j <= segments; j++) {
                const t = j / segments;
                const inv = 1 - t;
                const cx = (inv * inv * sx) + (2 * inv * t * mx) + (t * t * ex);
                const cy = (inv * inv * sy) + (2 * inv * t * my) + (t * t * ey);
                state.ribbons.lineTo(cx, cy);
            }
            state.ribbons.strokePath();

            // Spawn lunar particles along ribbon tips
            if (Math.random() > 0.7) {
                this.spawnLunarSpark(ex, ey, sweep + 1.35);
            }
        }

        // Reticle with celestial crosshair
        state.reticle.clear();
        state.reticle.lineStyle(2, 0xb0e8ff, 0.85);
        state.reticle.strokeCircle(state.targetX, state.targetY, 34 + Math.sin(state.pulse) * 4);

        // Inner rune ring on reticle
        const reticleR = 22 + Math.sin(state.pulse * 1.3) * 2;
        state.reticle.lineStyle(1, 0x8899cc, 0.4);
        state.reticle.strokeCircle(state.targetX, state.targetY, reticleR);

        // Rotating dots on reticle
        const rDotSpin = time * 0.005;
        for (let i = 0; i < 4; i++) {
            const ra = rDotSpin + (Math.PI * 2 * i) / 4;
            const rx = state.targetX + Math.cos(ra) * reticleR;
            const ry = state.targetY + Math.sin(ra) * reticleR;
            state.reticle.fillStyle(0xd8e8ff, 0.65);
            state.reticle.fillCircle(rx, ry, 1.8);
        }

        // Crosshair
        state.reticle.lineStyle(1.2, 0xffffff, 0.68);
        state.reticle.lineBetween(state.targetX - 16, state.targetY, state.targetX + 16, state.targetY);
        state.reticle.lineBetween(state.targetX, state.targetY - 16, state.targetX, state.targetY + 16);

        // Aim line (moonbeam connector)
        state.reticle.lineStyle(1.7, 0x6699cc, 0.55);
        state.reticle.lineBetween(this.player.x, this.player.y, state.targetX, state.targetY);

        // Crescent marks along aim line
        const aimDist = Phaser.Math.Distance.Between(this.player.x, this.player.y, state.targetX, state.targetY);
        if (aimDist > 60) {
            const numMarks = Math.min(4, Math.floor(aimDist / 50));
            for (let m = 1; m <= numMarks; m++) {
                const t = m / (numMarks + 1);
                const lx = Phaser.Math.Linear(this.player.x, state.targetX, t);
                const ly = Phaser.Math.Linear(this.player.y, state.targetY, t);
                const mAlpha = 0.3 + Math.sin(time * 0.012 + m) * 0.15;
                state.reticle.fillStyle(0xb0c8e8, mAlpha);
                state.reticle.fillCircle(lx, ly, 2.2);
            }
        }
    }

    // ── Ultimate release: celestial arrow burst ───────────────────────
    releaseUltimate(targetX, targetY) {
        const state = this.ultimateState;
        if (!state || state.phase !== 'charge') return false;

        if (!this.consumeUltimate()) {
            this.destroyUltimateState();
            return false;
        }

        const clamped = this.getClampedChargedTarget(targetX ?? state.targetX, targetY ?? state.targetY);
        const centerX = clamped.x;
        const centerY = clamped.y;
        const aimAngle = Math.atan2(centerY - this.player.y, centerX - this.player.x);

        state.phase = 'release';

        const recoilDistance = 125;
        const startX = this.player.x;
        const startY = this.player.y;
        const recoilX = startX - Math.cos(aimAngle) * recoilDistance;
        const recoilY = startY - Math.sin(aimAngle) * recoilDistance;

        this.scene.tweens.add({
            targets: this.player,
            x: recoilX,
            duration: 210,
            ease: 'Cubic.easeOut'
        });

        this.scene.tweens.addCounter({
            from: 0,
            to: 1,
            duration: 210,
            ease: 'Sine.easeOut',
            onUpdate: (tw) => {
                const t = tw.getValue();
                const hop = Math.sin(Math.PI * t) * 34;
                this.player.y = Phaser.Math.Linear(startY, recoilY, t) - hop;
            }
        });

        // Layered release burst with multiple rings
        const burstInner = this.scene.add.circle(startX, startY, 28, 0xb0c8e8, 0.3).setDepth(175);
        burstInner.setStrokeStyle(2, 0xd8e8ff, 0.9);
        this.scene.tweens.add({
            targets: burstInner,
            scale: 1.8,
            alpha: 0,
            duration: 200,
            onComplete: () => burstInner.destroy()
        });

        const burstOuter = this.scene.add.circle(startX, startY, 40, 0x3355aa, 0.18).setDepth(174);
        burstOuter.setStrokeStyle(3, 0x8899cc, 0.7);
        this.scene.tweens.add({
            targets: burstOuter,
            scale: 2.4,
            alpha: 0,
            duration: 320,
            onComplete: () => burstOuter.destroy()
        });

        const burstCrescent = this.scene.add.circle(startX, startY, 52, 0x1a1a44, 0.08).setDepth(173);
        burstCrescent.setStrokeStyle(1.5, 0x6688bb, 0.45);
        this.scene.tweens.add({
            targets: burstCrescent,
            scale: 2.8,
            alpha: 0,
            duration: 380,
            onComplete: () => burstCrescent.destroy()
        });

        // Radial crescent particle burst on release
        for (let i = 0; i < 8; i++) {
            const ba = (Math.PI * 2 * i) / 8;
            this.spawnCrescentMote(
                startX + Math.cos(ba) * 15,
                startY + Math.sin(ba) * 15,
                ba
            );
            this.spawnLunarSpark(
                startX + Math.cos(ba) * 10,
                startY + Math.sin(ba) * 10,
                ba
            );
        }

        this.launchEclipseArrow(aimAngle, centerX, centerY);
        this.startEclipseBarrage(centerX, centerY);

        this.scene.cameras.main.flash(150, 160, 220, 255);
        this.scene.cameras.main.shake(130, 0.003);
        this.destroyUltimateState();
        return true;
    }

    // ── Eclipse Arrow: multi-layer celestial projectile ───────────────
    launchEclipseArrow(angle, centerX, centerY) {
        const startX = this.player.x + Math.cos(angle) * 30;
        const startY = this.player.y + Math.sin(angle) * 30;

        const projectile = this.scene.add.container(startX, startY).setDepth(170);

        // Outer aura - wide moonlight haze
        const aura = this.scene.add.ellipse(0, 0, 82, 26, 0x3355aa, 0.25);
        aura.setStrokeStyle(1, 0x6688bb, 0.3);

        // Trail haze - elongated fog behind the arrow
        const trailHaze = this.scene.add.ellipse(-30, 0, 52, 16, 0x1a1a44, 0.3);

        // Main shaft - luminous celestial body
        const shaft = this.scene.add.rectangle(0, 0, 58, 8, 0xb0c8e8, 0.95);
        shaft.setStrokeStyle(1, 0xd8e8ff, 0.6);

        // Glowing tip - bright lunar point
        const tip = this.scene.add.triangle(30, 0, 0, -7, 10, 0, 0, 7, 0xe0f0ff, 1);

        // Tip glow bloom
        const tipGlow = this.scene.add.circle(34, 0, 6, 0xd8e8ff, 0.5);

        // Crescent mark on the shaft
        const crescentMark = this.scene.add.arc(0, 0, 10, -50, 50, false, 0xb0c8e8, 0)
            .setStrokeStyle(1.2, 0xd8e8ff, 0.6);

        // Tail energy wisp
        const tail = this.scene.add.ellipse(-24, 0, 44, 14, 0x4466aa, 0.35);

        // Rotating rune ring
        const runeRing = this.scene.add.circle(0, 0, 14, 0x000000, 0)
            .setStrokeStyle(1.2, 0x8899cc, 0.5);

        projectile.add([aura, trailHaze, tail, shaft, runeRing, crescentMark, tip, tipGlow]);
        projectile.rotation = angle;

        // Lifecycle ticker for continuous animation
        projectile.lifeTick = 0;

        const dx = centerX - startX;
        const dy = centerY - startY;
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const flightDuration = Phaser.Math.Clamp(dist / 2.8, 220, 420);

        this.addTrail(projectile, 0x8899cc, 9);

        this.scene.tweens.add({
            targets: projectile,
            x: centerX,
            y: centerY,
            duration: flightDuration,
            ease: 'Cubic.easeIn',
            onUpdate: () => {
                if (!projectile.scene) return;
                projectile.lifeTick += 0.3;

                // Breathing animations during flight
                aura.alpha = 0.18 + Math.sin(projectile.lifeTick * 1.2) * 0.08;
                aura.scaleX = 1 + Math.sin(projectile.lifeTick * 1.5) * 0.05;
                tipGlow.alpha = 0.4 + Math.sin(projectile.lifeTick * 2.0) * 0.2;
                tipGlow.scale = 1 + Math.sin(projectile.lifeTick * 1.8) * 0.12;
                runeRing.rotation -= 0.1;
                tail.alpha = 0.25 + Math.abs(Math.sin(projectile.lifeTick * 0.8)) * 0.15;
                trailHaze.alpha = 0.2 + Math.sin(projectile.lifeTick * 0.7) * 0.1;

                // Continuous particles during flight
                if (Math.random() > 0.4) this.spawnLunarSpark(projectile.x, projectile.y, angle + Math.PI);
                if (Math.random() > 0.65) this.spawnWindWisp(projectile.x, projectile.y, angle + Math.PI);
                if (Math.random() > 0.8) this.spawnCrescentMote(projectile.x, projectile.y, angle + Math.PI);
                if (Math.random() > 0.85) this.spawnEclipseShard(projectile.x, projectile.y, angle + Math.PI);
            },
            onComplete: () => {
                if (!projectile.scene) return;
                projectile.destroy();

                const boss = this.scene.boss;
                if (!boss) return;

                const hitDist = Phaser.Math.Distance.Between(centerX, centerY, boss.x, boss.y);
                if (hitDist > 110) return;

                const directDamage = 170 * (this.player.damageMultiplier || 1.0);
                boss.takeDamage(directDamage);
                this.gainUltimateGaugeFromDamage(directDamage, { charged: true });

                boss.eclipseMarkedUntil = this.scene.time.now + 3200;

                // Expanding lunar sigil on impact
                const impactSigil = this.scene.add.graphics().setDepth(180);
                const sigilRadius = { value: 20 };
                const sigilAlpha = { value: 0.8 };
                const sigilTick = { value: 0 };

                const sigilTween = this.scene.tweens.add({
                    targets: sigilRadius,
                    value: 70,
                    duration: 520,
                    ease: 'Sine.easeOut',
                    onUpdate: () => {
                        if (!impactSigil.scene) return;
                        sigilTick.value += 0.08;
                        impactSigil.clear();

                        // Outer mark ring
                        impactSigil.lineStyle(2.5, 0x8899cc, sigilAlpha.value * 0.8);
                        impactSigil.strokeCircle(boss.x, boss.y, sigilRadius.value);

                        // Inner glow ring
                        impactSigil.lineStyle(1.5, 0xd8e8ff, sigilAlpha.value * 0.6);
                        impactSigil.strokeCircle(boss.x, boss.y, sigilRadius.value * 0.6);

                        // Rotating rune dots
                        const spin = sigilTick.value;
                        for (let i = 0; i < 6; i++) {
                            const a = spin + (Math.PI * 2 * i) / 6;
                            const px = boss.x + Math.cos(a) * sigilRadius.value;
                            const py = boss.y + Math.sin(a) * sigilRadius.value;
                            impactSigil.fillStyle(0xd8e8ff, sigilAlpha.value * 0.7);
                            impactSigil.fillCircle(px, py, 2.2);
                        }

                        // Crescent arc sweeps
                        impactSigil.lineStyle(1.2, 0xb0c8e8, sigilAlpha.value * 0.5);
                        impactSigil.beginPath();
                        impactSigil.arc(boss.x, boss.y, sigilRadius.value * 0.8, spin, spin + 0.8);
                        impactSigil.strokePath();
                        impactSigil.beginPath();
                        impactSigil.arc(boss.x, boss.y, sigilRadius.value * 0.8, spin + Math.PI, spin + Math.PI + 0.8);
                        impactSigil.strokePath();
                    }
                });

                this.scene.tweens.add({
                    targets: sigilAlpha,
                    value: 0,
                    duration: 520,
                    onComplete: () => impactSigil.destroy()
                });

                // Radial spark burst on impact
                for (let i = 0; i < 10; i++) {
                    const ba = (Math.PI * 2 * i) / 10;
                    this.spawnLunarSpark(
                        boss.x + Math.cos(ba) * 20,
                        boss.y + Math.sin(ba) * 20,
                        ba
                    );
                    if (i % 2 === 0) {
                        this.spawnEclipseShard(
                            boss.x + Math.cos(ba) * 14,
                            boss.y + Math.sin(ba) * 14,
                            ba
                        );
                    }
                }

                // Mark ring (original effect kept)
                const markRing = this.scene.add.circle(boss.x, boss.y, 56, 0xa6d8ff, 0)
                    .setStrokeStyle(3, 0xa6d8ff, 0.86)
                    .setDepth(180);
                this.scene.tweens.add({
                    targets: markRing,
                    alpha: 0,
                    scale: 1.18,
                    duration: 520,
                    onComplete: () => markRing.destroy()
                });
            }
        });
    }

    // ── Eclipse Barrage: celestial arrow rain ─────────────────────────
    startEclipseBarrage(centerX, centerY) {
        const waves = 8;
        const radius = 190;
        const baseWaveDamage = 33 * (this.player.damageMultiplier || 1.0);
        const executeThreshold = 0.3;

        for (let wave = 0; wave < waves; wave++) {
            this.scene.time.delayedCall(220 + wave * 240, () => {
                const boss = this.scene.boss;

                for (let i = 0; i < 7; i++) {
                    const a = Math.random() * Math.PI * 2;
                    const r = Math.random() * radius;
                    const x = centerX + Math.cos(a) * r;
                    const y = centerY + Math.sin(a) * r;

                    // Multi-part spectral rain arrow instead of plain rectangle
                    const rainContainer = this.scene.add.container(x, y - 120).setDepth(175);
                    const rainShaft = this.scene.add.rectangle(0, 0, 3.5, 30, 0xb0c8e8, 0.92);
                    rainShaft.setStrokeStyle(0.5, 0xd8e8ff, 0.4);
                    const rainTip = this.scene.add.triangle(0, -16, -3, 0, 3, 0, 0, -6, 0xe0f0ff, 1);
                    const rainGlow = this.scene.add.ellipse(0, 0, 8, 34, 0x3355aa, 0.18);
                    const rainTail = this.scene.add.ellipse(0, 12, 4, 10, 0x667fbb, 0.3);
                    rainContainer.add([rainGlow, rainShaft, rainTail, rainTip]);

                    // Impact crescent shard
                    const shard = this.scene.add.image(x, y - 120, 'bow-crescent-mote').setDepth(176);
                    shard.setScale(0.7);

                    this.scene.tweens.add({
                        targets: [rainContainer, shard],
                        y,
                        alpha: 0.2,
                        duration: 180,
                        onComplete: () => {
                            // Impact splash with expanding crescent
                            if (rainContainer.scene) {
                                const splash = this.scene.add.circle(x, y, 5, 0xd8e8ff, 0.5).setDepth(177);
                                this.scene.tweens.add({
                                    targets: splash,
                                    scale: 2.0,
                                    alpha: 0,
                                    duration: 150,
                                    onComplete: () => splash.destroy()
                                });

                                // Micro crescent on impact
                                if (Math.random() > 0.6) {
                                    this.spawnCrescentMote(x, y, -Math.PI * 0.5);
                                }
                            }
                            rainContainer.destroy();
                            shard.destroy();
                        }
                    });

                    // Lunar energy particle during fall
                    if (Math.random() > 0.55) {
                        this.spawnLunarSpark(x, y - 80, Math.PI * 0.5);
                    }
                }

                // Wave impact ring with celestial sigil detail
                const ring = this.scene.add.circle(centerX, centerY, radius * 0.96, 0x3355aa, 0.06).setDepth(130);
                ring.setStrokeStyle(2, 0x8899cc, 0.45);

                // Sigil dots on the wave ring
                const waveRuneGraphics = this.scene.add.graphics().setDepth(131);
                const waveSpin = wave * 0.45;
                for (let j = 0; j < 8; j++) {
                    const sa = waveSpin + (Math.PI * 2 * j) / 8;
                    const sx = centerX + Math.cos(sa) * radius * 0.9;
                    const sy = centerY + Math.sin(sa) * radius * 0.9;
                    waveRuneGraphics.fillStyle(0xb0c8e8, 0.4);
                    waveRuneGraphics.fillCircle(sx, sy, 2.0);
                }

                this.scene.tweens.add({
                    targets: ring,
                    alpha: 0,
                    scale: 1.08,
                    duration: 210,
                    onComplete: () => {
                        ring.destroy();
                        waveRuneGraphics.destroy();
                    }
                });

                // Expanding crescent on alternating waves
                if (wave % 2 === 0) {
                    const crescentRing = this.scene.add.circle(centerX, centerY, radius * 0.5, 0x1a1a44, 0)
                        .setStrokeStyle(1.5, 0x6688bb, 0.35)
                        .setDepth(129);
                    this.scene.tweens.add({
                        targets: crescentRing,
                        scale: 1.6,
                        alpha: 0,
                        duration: 260,
                        onComplete: () => crescentRing.destroy()
                    });
                }

                if (!boss) return;

                const dist = Phaser.Math.Distance.Between(centerX, centerY, boss.x, boss.y);
                if (dist > radius) return;

                let waveDamage = baseWaveDamage;
                const isMarked = (boss.eclipseMarkedUntil || 0) > this.scene.time.now;
                const healthRatio = boss.maxHealth > 0 ? boss.health / boss.maxHealth : 1;
                if (isMarked && healthRatio <= executeThreshold) {
                    waveDamage *= 1.8;
                }

                boss.takeDamage(waveDamage);
                this.gainUltimateGaugeFromDamage(waveDamage, { charged: true });
            });
        }
    }

    // ── Cleanup ───────────────────────────────────────────────────────
    destroyUltimateState() {
        const state = this.ultimateState;
        if (!state) return;

        state.aura?.destroy();
        state.reticle?.destroy();
        state.ribbons?.destroy();
        state.spiritBow?.destroy();
        state.lunarEmitter?.destroy();
        state.shardEmitter?.destroy();
        this.ultimateState = null;
    }
}
