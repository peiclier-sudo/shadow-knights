// SwordWeapon.js - Sacred Radiance: Holy blade with divine rune energy and golden light
import { WeaponBase } from './WeaponBase.js';
import { WEAPONS } from './weaponData.js';

export class SwordWeapon extends WeaponBase {
    constructor(scene, player) {
        super(scene, player, WEAPONS.SWORD);
        this.ultimateState = null;
        this.ensureProceduralTextures();
    }

    ensureProceduralTextures() {
        if (!this.scene.textures.exists('sword-spark')) {
            const g = this.scene.add.graphics();
            g.fillStyle(0xfff5d0, 1);
            g.fillCircle(4, 4, 2);
            g.fillStyle(0xffc84a, 0.9);
            g.fillCircle(4, 4, 3.2);
            g.lineStyle(1, 0xffe8a0, 0.85);
            g.strokeCircle(4, 4, 3.8);
            g.generateTexture('sword-spark', 8, 8);
            g.destroy();
        }

        if (!this.scene.textures.exists('sword-holy-shard')) {
            const g = this.scene.add.graphics();
            g.fillGradientStyle(0xffffff, 0xffe8a0, 0xffc84a, 0xcc8800, 1);
            g.fillTriangle(8, 0, 14, 14, 2, 14);
            g.lineStyle(1.2, 0xffffff, 0.9);
            g.strokeTriangle(8, 0, 14, 14, 2, 14);
            g.generateTexture('sword-holy-shard', 16, 16);
            g.destroy();
        }

        if (!this.scene.textures.exists('sword-rune-mote')) {
            const g = this.scene.add.graphics();
            g.fillGradientStyle(0xffd07a, 0xffb84a, 0xff9020, 0x804000, 1);
            g.fillCircle(6, 6, 4.5);
            g.lineStyle(1.5, 0xfff0c0, 0.9);
            g.strokeCircle(6, 6, 5.5);
            g.generateTexture('sword-rune-mote', 12, 12);
            g.destroy();
        }

        if (!this.scene.textures.exists('sword-divine-flame')) {
            const g = this.scene.add.graphics();
            g.fillGradientStyle(0xffffff, 0xffe8a0, 0xffaa00, 0x884400, 1);
            g.fillTriangle(8, 1, 13, 15, 3, 15);
            g.lineStyle(1, 0xfff8e0, 0.85);
            g.strokeTriangle(8, 1, 13, 15, 3, 15);
            g.generateTexture('sword-divine-flame', 16, 16);
            g.destroy();
        }
    }

    createSimpleSwordVisual(scale = 1) {
        const blade = this.scene.add.polygon(0, 0, [
            -42 * scale, -4.4 * scale,
            58 * scale, -4.4 * scale,
            72 * scale, 0,
            58 * scale, 4.4 * scale,
            -42 * scale, 4.4 * scale
        ], 0xfff1dc, 0.99).setStrokeStyle(Math.max(0.6, 1.6 * scale), 0xffffff, 0.9);

        const guard = this.scene.add.rectangle(-44 * scale, 0, 12 * scale, 10 * scale, 0xd3944e, 0.96)
            .setStrokeStyle(Math.max(0.5, 1 * scale), 0xf1c489, 0.72);
        const grip = this.scene.add.rectangle(-55 * scale, 0, 12 * scale, 6 * scale, 0x714b25, 0.96)
            .setStrokeStyle(Math.max(0.45, 0.9 * scale), 0xc79558, 0.64);
        const pommel = this.scene.add.circle(-63 * scale, 0, 3.2 * scale, 0x946031, 0.96)
            .setStrokeStyle(Math.max(0.5, 1 * scale), 0xddae6f, 0.84);

        return {
            blade,
            guard,
            grip,
            pommel,
            all: [blade, guard, grip, pommel]
        };
    }

    // Basic attack - sacred blade projectile with holy layers and divine particles
    fire(angle) {
        const data = this.data.projectile;
        const startX = this.player.x + Math.cos(angle) * 30;
        const startY = this.player.y + Math.sin(angle) * 30;

        this.createMuzzleFlash(startX, startY, 0xffd07a);
        this.spawnCastRunes(startX, startY, angle);

        const sword = this.scene.add.container(startX, startY).setDepth(150);
        const scale = 0.26 + data.size / 44;
        const swordVisual = this.createSimpleSwordVisual(scale);

        // Holy aura shimmer around blade
        const holyAura = this.scene.add.ellipse(0, 0, 120 * scale, 26 * scale, 0xffd07a, 0.18);
        holyAura.setStrokeStyle(1.5, 0xffe8a0, 0.4);

        // Divine glow core
        const divineCore = this.scene.add.circle(24 * scale, 0, 8 * scale, 0xfff5d0, 0.45);

        // Rune ring orbiting the blade
        const runeRing = this.scene.add.circle(0, 0, 22 * scale, 0x000000, 0)
            .setStrokeStyle(1.2, 0xffc84a, 0.55);

        sword.add([holyAura, runeRing, ...swordVisual.all, divineCore]);
        sword.rotation = angle;

        sword.vx = Math.cos(angle) * data.speed;
        sword.vy = Math.sin(angle) * data.speed;
        sword.damage = data.damage;
        sword.range = data.range;
        sword.startX = startX;
        sword.startY = startY;
        sword.piercing = data.piercing;
        sword.hasHit = false;
        sword.lifeTick = 0;

        sword.update = () => {
            if (!sword.scene) return;
            sword.lifeTick += 0.28;
            const dir = Math.atan2(sword.vy, sword.vx);

            // Smooth rotation tracking
            sword.rotation = Phaser.Math.Angle.RotateTo(sword.rotation, dir, 0.24);

            // Aura breathing
            holyAura.alpha = 0.12 + Math.abs(Math.sin(sword.lifeTick * 1.3)) * 0.14;
            holyAura.scaleX = 1 + Math.sin(sword.lifeTick * 1.8) * 0.08;

            // Divine core pulse
            divineCore.alpha = 0.3 + Math.abs(Math.sin(sword.lifeTick * 2.1)) * 0.35;
            divineCore.radius = (7 + Math.sin(sword.lifeTick * 1.6) * 2) * scale;

            // Rune ring counter-rotation
            runeRing.rotation -= 0.09;
            runeRing.alpha = 0.4 + Math.sin(sword.lifeTick * 1.4) * 0.2;

            // Continuous holy particles
            if (Math.random() > 0.5) this.spawnHolySpark(sword.x, sword.y, dir + Math.PI);
            if (Math.random() > 0.72) this.spawnDivineEmber(sword.x, sword.y, dir + Math.PI);
            if (Math.random() > 0.85) this.spawnRuneMote(sword.x, sword.y);
        };

        sword.on('destroy', () => {
            swordVisual.all.forEach((part) => part.destroy());
            holyAura.destroy();
            divineCore.destroy();
            runeRing.destroy();
        });

        this.scene.projectiles.push(sword);
        this.addTrail(sword, 0xffc84a, data.size + 1);
    }

    // Charged attack - Divine Piercing Laser with layered beam, rune crackle, and impact sigil
    executeChargedAttack(angle) {
        this.ensureProceduralTextures();
        const charged = this.data.charged;

        const startX = this.player.x + Math.cos(angle) * 40;
        const startY = this.player.y + Math.sin(angle) * 40;
        const endX = startX + Math.cos(angle) * charged.length;
        const endY = startY + Math.sin(angle) * charged.length;
        const chargePower = 0.45 + this.chargeLevel * 0.75;

        let hasHit = false;

        // Cast burst with gathering runes
        this.spawnCastBurst(startX, startY, angle, chargePower);

        // Multi-layer divine beam
        const beamDivine = this.scene.add.graphics().setDepth(158);
        beamDivine.lineStyle(charged.width * 4, 0xffd07a, 0.18);
        beamDivine.lineBetween(startX, startY, endX, endY);

        const beamAura = this.scene.add.graphics().setDepth(159);
        beamAura.lineStyle(charged.width * 2.4, 0xffb84a, 0.32);
        beamAura.lineBetween(startX, startY, endX, endY);

        const beamCore = this.scene.add.graphics().setDepth(160);
        beamCore.lineStyle(charged.width, 0xfff0c9, 0.98);
        beamCore.lineBetween(startX, startY, endX, endY);

        const beamEdge = this.scene.add.graphics().setDepth(161);
        beamEdge.lineStyle(2.5, 0xffffff, 0.92);
        beamEdge.lineBetween(startX, startY, endX, endY);

        // Runic crackle lines along beam
        const crackleA = this.scene.add.graphics().setDepth(162);
        const crackleB = this.scene.add.graphics().setDepth(162);
        this.drawRunicCrackle(crackleA, startX, startY, endX, endY, 0xfff3d2, 0.75, 6, angle);
        this.drawRunicCrackle(crackleB, startX, startY, endX, endY, 0xffc87d, 0.55, 10, angle);

        // Sigil rings along beam length
        const sigils = [];
        for (let i = 1; i <= 3; i++) {
            const t = i / 4;
            const sx = Phaser.Math.Linear(startX, endX, t);
            const sy = Phaser.Math.Linear(startY, endY, t);
            const sigil = this.scene.add.graphics().setDepth(163);
            this.drawBeamSigil(sigil, sx, sy, 18 + i * 4, i * 0.8);
            sigils.push(sigil);
        }

        const allVisuals = [beamDivine, beamAura, beamCore, beamEdge, crackleA, crackleB, ...sigils];
        allVisuals.forEach(v => { v.alpha = 0; });

        this.scene.tweens.add({
            targets: allVisuals,
            alpha: 1,
            duration: 45,
            onComplete: () => {
                if (!hasHit) {
                    this.checkLaserHit(startX, startY, endX, endY, angle, charged);
                    hasHit = true;
                }

                this.scene.tweens.add({
                    targets: allVisuals,
                    alpha: 0,
                    duration: 200,
                    delay: 80,
                    onComplete: () => allVisuals.forEach(v => v.destroy())
                });
            }
        });

        // Holy particles along beam with charge scaling
        this.spawnBeamHolyParticles(startX, startY, angle, charged, chargePower);

        // Screen effects
        this.scene.cameras.main.flash(80, 255, 220, 160);
        this.scene.cameras.main.shake(60, 0.003);
    }

    checkLaserHit(startX, startY, endX, endY, angle, charged) {
        const boss = this.scene.boss;
        if (!boss) return;

        const dx = endX - startX;
        const dy = endY - startY;
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length === 0) return;

        const unitX = dx / length;
        const unitY = dy / length;
        const toBossX = boss.x - startX;
        const toBossY = boss.y - startY;

        const t = (toBossX * unitX + toBossY * unitY) / length;
        if (t < 0 || t > 1) return;

        const projX = startX + unitX * (t * length);
        const projY = startY + unitY * (t * length);
        const perpDist = Phaser.Math.Distance.Between(boss.x, boss.y, projX, projY);

        if (perpDist < 50) {
            const critChance = Phaser.Math.Clamp((this.player.critChanceBonus || 0), 0, 0.6);
            const critMultiplier = Math.random() < critChance ? 2 : 1;
            const finalDamage = charged.damage * (this.player.damageMultiplier || 1.0) * (this.player.passiveDamageMultiplier || 1.0) * critMultiplier;
            boss.takeDamage(finalDamage);
            this.gainUltimateGaugeFromDamage(finalDamage, { charged: true });

            if (charged.knockback) {
                this.scene.tweens.add({
                    targets: boss,
                    x: boss.x + Math.cos(angle) * 175,
                    y: boss.y + Math.sin(angle) * 175,
                    duration: 180,
                    ease: 'Power2'
                });
            }

            // Enhanced impact with divine sigil
            this.spawnDivineImpact(boss.x, boss.y, angle);
        }
    }

    // Ultimate - Sacred Convergence: dual holy blades with rune orbit and divine explosion
    startUltimateCharge(targetX, targetY) {
        if (this.ultimateState || !this.canUseUltimate()) return false;

        const aimX = targetX ?? this.player.x + 1;
        const aimY = targetY ?? this.player.y;
        const angle = Math.atan2(aimY - this.player.y, aimX - this.player.x);

        const makeSummonedSword = (sign) => {
            const container = this.scene.add.container(this.player.x + sign * 60, this.player.y).setDepth(188);
            const visual = this.createSimpleSwordVisual(1.35);

            // Holy aura envelope
            const aura = this.scene.add.ellipse(0, 0, 150, 36, 0xffd07a, 0.16)
                .setStrokeStyle(2, 0xfff0c9, 0.55);

            // Divine core at blade center
            const coreGlow = this.scene.add.circle(12, 0, 10, 0xfff5d0, 0.35);

            // Rune orbit ring
            const rune = this.scene.add.graphics();
            rune.lineStyle(2, 0xffc84a, 0.62);
            rune.beginPath();
            rune.arc(-4, 0, 28, -0.6, 0.6);
            rune.strokePath();
            rune.lineStyle(1.2, 0xfff0c9, 0.42);
            rune.beginPath();
            rune.arc(-4, 0, 36, -0.4, 0.4);
            rune.strokePath();

            // Spinning rune dots
            const runeDots = this.scene.add.graphics();

            container.add([aura, ...visual.all, coreGlow, rune, runeDots]);
            container.rotation = angle + (sign < 0 ? 0.24 : -0.24);
            return { sign, container, visual, aura, coreGlow, rune, runeDots, phase: Math.random() * Math.PI * 2 };
        };

        // Holy ground sigil
        const sigil = this.scene.add.graphics().setDepth(186);
        // Summoning particles
        const summonFlames = this.scene.add.particles(this.player.x, this.player.y, 'sword-divine-flame', {
            speed: { min: 20, max: 70 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.8, end: 0 },
            alpha: { start: 0.7, end: 0 },
            lifespan: { min: 400, max: 800 },
            frequency: 35,
            quantity: 2,
            blendMode: 'ADD',
            emitting: true
        }).setDepth(185);

        const sparks = this.scene.add.particles(this.player.x, this.player.y, 'sword-spark', {
            speed: { min: 10, max: 50 },
            scale: { start: 0.7, end: 0 },
            alpha: { start: 0.85, end: 0 },
            lifespan: { min: 300, max: 600 },
            frequency: 55,
            quantity: 1,
            blendMode: 'SCREEN',
            emitting: true
        }).setDepth(187);

        this.ultimateState = {
            phase: 'charge',
            startedAt: this.scene.time.now,
            targetX: aimX,
            targetY: aimY,
            sigil,
            summonFlames,
            sparks,
            swords: [makeSummonedSword(-1), makeSummonedSword(1)]
        };

        return true;
    }

    updateUltimate(time, delta, targetX, targetY) {
        const state = this.ultimateState;
        if (!state) return;

        if (state.phase === 'charge') {
            state.targetX = targetX ?? state.targetX;
            state.targetY = targetY ?? state.targetY;

            const clamped = this.getClampedChargedTarget(state.targetX, state.targetY);
            state.targetX = clamped.x;
            state.targetY = clamped.y;

            const angle = Math.atan2(state.targetY - this.player.y, state.targetX - this.player.x);
            const progress = Phaser.Math.Clamp((time - state.startedAt) / 2000, 0, 1);
            const sideDist = 60 - progress * 8;

            // Update summoning particles
            state.summonFlames?.setPosition?.(this.player.x, this.player.y);
            state.sparks?.setPosition?.(this.player.x, this.player.y);

            // Intensify particles with progress
            state.summonFlames?.setFrequency?.(35 - Math.floor(progress * 20));
            state.sparks?.setFrequency?.(55 - Math.floor(progress * 30));

            // Draw sacred sigil on ground
            const spin = time * 0.004;
            const pulse = 1 + Math.sin(time * 0.013) * 0.1;
            state.sigil.clear();

            // Inner sacred circle
            state.sigil.lineStyle(3, 0xffd07a, 0.45 + progress * 0.2);
            state.sigil.strokeCircle(this.player.x, this.player.y, (52 + progress * 8) * pulse);

            // Outer divine ring
            state.sigil.lineStyle(1.8, 0xfff0cd, 0.35 + progress * 0.15);
            state.sigil.strokeCircle(this.player.x, this.player.y, (78 + progress * 10) * pulse);

            // Rotating arc segments
            state.sigil.lineStyle(2.2, 0xffc84a, 0.6 + progress * 0.15);
            for (let i = 0; i < 3; i++) {
                const arcStart = spin + (Math.PI * 2 * i) / 3;
                state.sigil.beginPath();
                state.sigil.arc(this.player.x, this.player.y, 65 * pulse, arcStart, arcStart + 0.9);
                state.sigil.strokePath();
            }

            // Spinning rune dots on outer ring
            for (let i = 0; i < 8; i++) {
                const a = spin * 1.5 + (Math.PI * 2 * i) / 8;
                const rx = this.player.x + Math.cos(a) * 65 * pulse;
                const ry = this.player.y + Math.sin(a) * 65 * pulse;
                state.sigil.fillStyle(0xfff0c9, 0.6 + progress * 0.2);
                state.sigil.fillCircle(rx, ry, 2.2 + progress);
            }

            // Aim line and target reticle
            state.sigil.lineStyle(2, 0xfff0cd, 0.7);
            state.sigil.lineBetween(this.player.x, this.player.y, state.targetX, state.targetY);
            state.sigil.lineStyle(1.6, 0xffd07a, 0.65);
            state.sigil.strokeCircle(state.targetX, state.targetY, 18 + Math.sin(time * 0.015) * 3);

            // Cross-hair on target
            const ch = 12;
            state.sigil.lineStyle(1.2, 0xfff0c9, 0.6);
            state.sigil.lineBetween(state.targetX - ch, state.targetY, state.targetX + ch, state.targetY);
            state.sigil.lineBetween(state.targetX, state.targetY - ch, state.targetX, state.targetY + ch);

            // Animate summoned swords
            for (const sword of state.swords) {
                sword.phase += 0.07;
                sword.container.x = this.player.x + sword.sign * sideDist;
                sword.container.y = this.player.y + Math.sin(sword.phase) * 6;
                sword.container.rotation = angle + (sword.sign < 0 ? 0.28 : -0.28);

                // Aura breathing
                sword.aura.scaleX = 1 + Math.sin(time * 0.013 + sword.sign) * 0.18;
                sword.aura.scaleY = 1 + Math.cos(time * 0.011 + sword.sign) * 0.12;
                sword.aura.alpha = 0.14 + (Math.sin(time * 0.018 + sword.sign) + 1) * 0.08;

                // Core glow pulse
                sword.coreGlow.alpha = 0.25 + Math.abs(Math.sin(time * 0.02 + sword.sign)) * 0.3;
                sword.coreGlow.radius = 9 + Math.sin(time * 0.016 + sword.sign) * 2;

                // Rune arc rotation
                sword.rune.rotation += 0.04 * sword.sign;

                // Animated rune dots
                sword.runeDots.clear();
                for (let i = 0; i < 5; i++) {
                    const a = (sword.phase * 0.6 * sword.sign) + (Math.PI * 2 * i) / 5;
                    const r = 22 + Math.sin(sword.phase + i) * 4;
                    sword.runeDots.fillStyle(0xffd07a, 0.55 + Math.sin(sword.phase + i * 0.5) * 0.2);
                    sword.runeDots.fillCircle(Math.cos(a) * r, Math.sin(a) * r, 1.8 + progress);
                }
            }
        }

        if (state.phase === 'converge') {
            // Convergence phase - swords flying to target, handled by tweens
            for (const sword of state.swords) {
                sword.phase += 0.1;
                if (sword.coreGlow?.scene) {
                    sword.coreGlow.alpha = 0.5 + Math.abs(Math.sin(sword.phase * 2)) * 0.4;
                }
            }
        }
    }

    releaseUltimate(targetX, targetY) {
        const state = this.ultimateState;
        if (!state || state.phase !== 'charge') return false;

        if (!this.consumeUltimate()) {
            this.destroyUltimateState();
            return false;
        }

        state.phase = 'converge';
        state.targetX = targetX ?? state.targetX;
        state.targetY = targetY ?? state.targetY;

        const clamped = this.getClampedChargedTarget(state.targetX, state.targetY);
        state.targetX = clamped.x;
        state.targetY = clamped.y;

        // Stop summoning particles
        state.summonFlames?.stop?.();
        state.sparks?.stop?.();

        // Launch trail particles
        const launchTrail = this.scene.add.particles(this.player.x, this.player.y, 'sword-holy-shard', {
            speed: { min: 30, max: 90 },
            scale: { start: 0.8, end: 0 },
            alpha: { start: 0.7, end: 0 },
            lifespan: { min: 200, max: 450 },
            frequency: 20,
            quantity: 2,
            blendMode: 'ADD',
            emitting: true
        }).setDepth(186);

        // Converge both swords toward target
        for (const summoned of state.swords) {
            const angle = Math.atan2(state.targetY - summoned.container.y, state.targetX - summoned.container.x);

            this.scene.tweens.add({
                targets: summoned.container,
                x: state.targetX + summoned.sign * 12,
                y: state.targetY,
                rotation: angle,
                duration: 340,
                ease: 'Cubic.easeIn',
                onUpdate: () => {
                    if (Math.random() > 0.4) {
                        this.spawnHolySpark(summoned.container.x, summoned.container.y, angle + Math.PI);
                    }
                    launchTrail.setPosition(
                        (state.swords[0].container.x + state.swords[1].container.x) * 0.5,
                        (state.swords[0].container.y + state.swords[1].container.y) * 0.5
                    );
                }
            });
        }

        // Impact after convergence
        this.scene.time.delayedCall(360, () => {
            if (!this.ultimateState || this.ultimateState !== state) return;
            launchTrail.stop();
            this.scene.time.delayedCall(500, () => launchTrail.destroy());
            this.explodeSacredConvergence(state);
        });

        return true;
    }

    explodeSacredConvergence(state) {
        const x = state.targetX;
        const y = state.targetY;

        // Cross-slash visual
        const crossA = this.scene.add.rectangle(x, y, 280, 6, 0xfff5d0, 0.95)
            .setRotation(Math.PI * 0.25).setDepth(195);
        const crossB = this.scene.add.rectangle(x, y, 280, 6, 0xfff5d0, 0.95)
            .setRotation(-Math.PI * 0.25).setDepth(195);

        this.scene.tweens.add({
            targets: [crossA, crossB],
            scaleX: 1.6,
            scaleY: 4,
            alpha: 0,
            duration: 180,
            onComplete: () => { crossA.destroy(); crossB.destroy(); }
        });

        // Massive divine burst
        const burst = this.scene.add.particles(x, y, 'sword-holy-shard', {
            speed: { min: 200, max: 550 },
            angle: { min: 0, max: 360 },
            scale: { start: 2 + 0.5, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: { min: 450, max: 1100 },
            quantity: 120,
            blendMode: 'ADD',
            emitting: false
        }).setDepth(192);
        burst.explode();

        // Directional holy flame cross
        const crossAngles = [45, 135, 225, 315];
        for (const a of crossAngles) {
            const flameLine = this.scene.add.particles(x, y, 'sword-divine-flame', {
                angle: { min: a - 12, max: a + 12 },
                speed: { min: 180, max: 560 },
                scale: { start: 2.2, end: 0 },
                alpha: { start: 0.9, end: 0 },
                lifespan: { min: 400, max: 1000 },
                quantity: 65,
                blendMode: 'ADD',
                emitting: false
            }).setDepth(191);
            flameLine.explode();
            this.scene.time.delayedCall(1100, () => flameLine.destroy());
        }

        // Expanding sacred rings
        for (let i = 0; i < 8; i++) {
            const ring = this.scene.add.circle(x, y, 25 + i * 5, 0xffd07a, 0)
                .setStrokeStyle(2.5 - i * 0.2, 0xfff0c9, 0.55).setDepth(193);
            this.scene.tweens.add({
                targets: ring,
                radius: 100 + i * 28,
                alpha: { from: 0.6, to: 0 },
                duration: 300 + i * 30,
                ease: 'Sine.easeOut',
                onComplete: () => ring.destroy()
            });
        }

        // Sacred ground sigil at impact
        const impactSigil = this.scene.add.graphics().setDepth(194);
        this.drawImpactSigil(impactSigil, x, y, 0);
        this.scene.tweens.add({
            targets: impactSigil,
            alpha: 0,
            duration: 600,
            onComplete: () => impactSigil.destroy()
        });

        // Boss damage
        const boss = this.scene.boss;
        if (boss) {
            const dist = Phaser.Math.Distance.Between(x, y, boss.x, boss.y);
            if (dist <= 160) {
                const finalDamage = 240 * (this.player.damageMultiplier || 1.0);
                boss.takeDamage(finalDamage);
                boss.setTint(0xffe8a0);
                this.gainUltimateGaugeFromDamage(finalDamage, { charged: true });
                this.scene.time.delayedCall(200, () => boss.clearTint());
            }
        }

        this.scene.cameras.main.flash(200, 255, 230, 160);
        this.scene.cameras.main.shake(240, 0.01);

        this.scene.time.delayedCall(1200, () => burst.destroy());
        this.destroyUltimateState();
    }

    destroyUltimateState() {
        const state = this.ultimateState;
        if (!state) return;

        state.sigil?.destroy();
        state.summonFlames?.destroy();
        state.sparks?.destroy();

        for (const sword of state.swords || []) {
            sword.visual?.all?.forEach((part) => part.destroy());
            sword.aura?.destroy();
            sword.coreGlow?.destroy();
            sword.rune?.destroy();
            sword.runeDots?.destroy();
            sword.container?.destroy();
        }

        this.ultimateState = null;
    }

    // --- Helper drawing methods ---

    drawRunicCrackle(graphics, x1, y1, x2, y2, color, alpha, variance, angle) {
        graphics.clear();
        graphics.lineStyle(2.3, color, alpha);
        graphics.beginPath();

        const segments = 18;
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = Phaser.Math.Linear(x1, x2, t);
            const y = Phaser.Math.Linear(y1, y2, t) + Phaser.Math.Between(-variance, variance);
            if (i === 0) graphics.moveTo(x, y);
            else graphics.lineTo(x, y);
        }

        graphics.strokePath();

        // Rune marks along crackle
        for (let i = 0; i < 4; i++) {
            const t = (i + 0.5) / 4;
            const rx = Phaser.Math.Linear(x1, x2, t);
            const ry = Phaser.Math.Linear(y1, y2, t);
            graphics.fillStyle(color, alpha * 0.7);
            graphics.fillCircle(rx, ry, 2.5);
        }
    }

    drawBeamSigil(graphics, x, y, radius, tick) {
        graphics.lineStyle(1.5, 0xffd07a, 0.5);
        graphics.strokeCircle(x, y, radius);
        for (let i = 0; i < 4; i++) {
            const a = tick + (Math.PI * 2 * i) / 4;
            graphics.fillStyle(0xfff0c9, 0.6);
            graphics.fillCircle(x + Math.cos(a) * radius, y + Math.sin(a) * radius, 2);
        }
    }

    drawImpactSigil(graphics, x, y, tick) {
        // Outer circle
        graphics.lineStyle(2.5, 0xffd07a, 0.7);
        graphics.strokeCircle(x, y, 65);

        // Inner circle
        graphics.lineStyle(1.8, 0xfff0c9, 0.55);
        graphics.strokeCircle(x, y, 42);

        // Cross lines
        graphics.lineStyle(2, 0xffc84a, 0.6);
        const crossSize = 55;
        graphics.lineBetween(x - crossSize, y, x + crossSize, y);
        graphics.lineBetween(x, y - crossSize, x, y + crossSize);

        // Diagonal accent lines
        graphics.lineStyle(1.4, 0xfff5d0, 0.45);
        const dSize = 40;
        graphics.lineBetween(x - dSize, y - dSize, x + dSize, y + dSize);
        graphics.lineBetween(x + dSize, y - dSize, x - dSize, y + dSize);

        // Rune dots on circle
        for (let i = 0; i < 12; i++) {
            const a = (Math.PI * 2 * i) / 12;
            graphics.fillStyle(0xfff0c9, 0.7);
            graphics.fillCircle(x + Math.cos(a) * 65, y + Math.sin(a) * 65, 2.8);
        }
    }

    // --- Particle spawning helpers ---

    spawnCastRunes(x, y, angle) {
        for (let i = 0; i < 6; i++) {
            const dir = angle + Phaser.Math.FloatBetween(-0.8, 0.8);
            const rune = this.scene.add.image(x, y, 'sword-rune-mote').setDepth(160)
                .setScale(Phaser.Math.FloatBetween(0.5, 0.9));

            this.scene.tweens.add({
                targets: rune,
                x: x + Math.cos(dir) * Phaser.Math.Between(10, 30),
                y: y + Math.sin(dir) * Phaser.Math.Between(10, 30),
                alpha: 0,
                scale: 0.2,
                rotation: Phaser.Math.FloatBetween(-1, 1),
                duration: Phaser.Math.Between(100, 200),
                onComplete: () => rune.destroy()
            });
        }
    }

    spawnCastBurst(x, y, angle, power) {
        // Central flash
        const flash = this.scene.add.circle(x, y, 20, 0xfff5d0, 0.55).setDepth(164);
        const ring = this.scene.add.circle(x, y, 16, 0x000000, 0)
            .setStrokeStyle(3, 0xffd07a, 0.85).setDepth(165);

        this.scene.tweens.add({
            targets: flash,
            radius: 42 + power * 10,
            alpha: 0,
            duration: 200,
            ease: 'Cubic.easeOut',
            onComplete: () => flash.destroy()
        });

        this.scene.tweens.add({
            targets: ring,
            radius: 58 + power * 14,
            alpha: 0,
            duration: 250,
            ease: 'Sine.easeOut',
            onComplete: () => ring.destroy()
        });

        // Gathering rune motes
        for (let i = 0; i < Math.floor(8 + power * 6); i++) {
            const a = (Math.PI * 2 * i) / 12 + Phaser.Math.FloatBetween(-0.3, 0.3);
            const dist = Phaser.Math.Between(30, 60);
            const mote = this.scene.add.image(
                x + Math.cos(a) * dist,
                y + Math.sin(a) * dist,
                'sword-rune-mote'
            ).setDepth(162).setScale(Phaser.Math.FloatBetween(0.4, 0.8)).setAlpha(0.8);

            this.scene.tweens.add({
                targets: mote,
                x: x,
                y: y,
                alpha: 0,
                scale: 0.15,
                duration: Phaser.Math.Between(120, 220),
                onComplete: () => mote.destroy()
            });
        }
    }

    spawnHolySpark(x, y, angle) {
        const spark = this.scene.add.image(
            x + Phaser.Math.Between(-4, 4),
            y + Phaser.Math.Between(-4, 4),
            'sword-spark'
        ).setDepth(156).setScale(Phaser.Math.FloatBetween(0.5, 0.95));

        const drift = angle + Phaser.Math.FloatBetween(-0.5, 0.5);
        this.scene.tweens.add({
            targets: spark,
            x: spark.x + Math.cos(drift) * Phaser.Math.Between(14, 36),
            y: spark.y + Math.sin(drift) * Phaser.Math.Between(14, 36),
            alpha: 0,
            scale: 0.15,
            duration: Phaser.Math.Between(90, 180),
            onComplete: () => spark.destroy()
        });
    }

    spawnDivineEmber(x, y, angle) {
        const ember = this.scene.add.circle(
            x + Phaser.Math.Between(-5, 5),
            y + Phaser.Math.Between(-5, 5),
            Phaser.Math.FloatBetween(1.5, 3.4),
            Phaser.Math.RND.pick([0xfff5d0, 0xffd07a, 0xffc84a, 0xffaa00]),
            0.88
        ).setDepth(154);

        const drift = angle + Phaser.Math.FloatBetween(-0.6, 0.6);
        this.scene.tweens.add({
            targets: ember,
            x: ember.x + Math.cos(drift) * Phaser.Math.Between(12, 32),
            y: ember.y + Math.sin(drift) * Phaser.Math.Between(12, 32),
            alpha: 0,
            scale: 0.25,
            duration: Phaser.Math.Between(100, 200),
            onComplete: () => ember.destroy()
        });
    }

    spawnRuneMote(x, y) {
        const mote = this.scene.add.image(x, y, 'sword-rune-mote')
            .setDepth(155).setScale(Phaser.Math.FloatBetween(0.3, 0.6)).setAlpha(0.7);

        this.scene.tweens.add({
            targets: mote,
            y: mote.y - Phaser.Math.Between(16, 34),
            alpha: 0,
            scale: 0.15,
            rotation: Phaser.Math.FloatBetween(-0.8, 0.8),
            duration: Phaser.Math.Between(180, 320),
            onComplete: () => mote.destroy()
        });
    }

    spawnDivineImpact(bx, by, angle) {
        // Impact flash
        const impact = this.scene.add.circle(bx, by, 30, 0xffd07a, 0.8).setDepth(170);
        const ring1 = this.scene.add.circle(bx, by, 18, 0xfff5d0, 0)
            .setStrokeStyle(3, 0xfff5d0, 0.95).setDepth(171);
        const ring2 = this.scene.add.circle(bx, by, 28, 0xffc84a, 0)
            .setStrokeStyle(2, 0xffc84a, 0.7).setDepth(170);

        this.scene.tweens.add({
            targets: [impact, ring1, ring2],
            alpha: 0,
            scale: 2.4,
            duration: 320,
            onComplete: () => { impact.destroy(); ring1.destroy(); ring2.destroy(); }
        });

        // Divine sigil at impact
        const sigil = this.scene.add.graphics().setDepth(172);
        sigil.lineStyle(2, 0xffd07a, 0.65);
        sigil.strokeCircle(bx, by, 32);
        for (let i = 0; i < 6; i++) {
            const a = (Math.PI * 2 * i) / 6;
            sigil.fillStyle(0xfff0c9, 0.55);
            sigil.fillCircle(bx + Math.cos(a) * 32, by + Math.sin(a) * 32, 2.5);
        }

        this.scene.tweens.add({
            targets: sigil,
            alpha: 0,
            duration: 400,
            onComplete: () => sigil.destroy()
        });

        // Radial spark burst
        for (let i = 0; i < 16; i++) {
            const a = (Math.PI * 2 * i) / 16;
            const spark = this.scene.add.image(bx, by, 'sword-spark').setDepth(168)
                .setScale(Phaser.Math.FloatBetween(0.6, 1.1));
            this.scene.tweens.add({
                targets: spark,
                x: bx + Math.cos(a) * Phaser.Math.Between(38, 80),
                y: by + Math.sin(a) * Phaser.Math.Between(38, 80),
                alpha: 0,
                scale: 0.2,
                duration: Phaser.Math.Between(130, 240),
                onComplete: () => spark.destroy()
            });
        }
    }

    spawnBeamHolyParticles(startX, startY, angle, charged, power) {
        const count = Math.floor(22 + power * 10);
        for (let i = 0; i < count; i++) {
            const dist = i * (charged.length / count);
            const px = startX + Math.cos(angle) * dist;
            const py = startY + Math.sin(angle) * dist;

            const spark = this.scene.add.circle(
                px,
                py,
                Phaser.Math.FloatBetween(1.8, 4),
                Phaser.Math.RND.pick([0xfff5d0, 0xffd07a, 0xffc84a]),
                0.85
            ).setDepth(163);

            this.scene.tweens.add({
                targets: spark,
                x: px + Math.cos(angle + Math.PI / 2) * Phaser.Math.Between(-18, 18),
                y: py + Math.sin(angle + Math.PI / 2) * Phaser.Math.Between(-18, 18),
                alpha: 0,
                scale: 0.3,
                duration: Phaser.Math.Between(100, 220),
                onComplete: () => spark.destroy()
            });

            // Extra rune mote particles along beam
            if (i % 4 === 0) {
                const mote = this.scene.add.image(px, py, 'sword-rune-mote')
                    .setDepth(162).setScale(0.5).setAlpha(0.7);
                this.scene.tweens.add({
                    targets: mote,
                    y: mote.y + Phaser.Math.Between(-22, 22),
                    alpha: 0,
                    scale: 0.15,
                    rotation: Phaser.Math.FloatBetween(-1, 1),
                    duration: Phaser.Math.Between(160, 260),
                    onComplete: () => mote.destroy()
                });
            }
        }
    }
}
