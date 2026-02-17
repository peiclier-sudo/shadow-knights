// SwordWeapon.js - Procedural sword VFX with smoother badass blade projection
import { WeaponBase } from './WeaponBase.js';
import { WEAPONS } from './weaponData.js';

export class SwordWeapon extends WeaponBase {
    constructor(scene, player) {
        super(scene, player, WEAPONS.SWORD);
        this.ultimateState = null;
        this.ensureUltimateTextures();
    }

    ensureUltimateTextures() {
        if (this.scene.textures.exists('sword-ult-dot')) return;
        const g = this.scene.add.graphics();
        g.fillStyle(0xffffff, 1);
        g.fillCircle(4, 4, 4);
        g.generateTexture('sword-ult-dot', 8, 8);
        g.destroy();
    }

    createProceduralSwordParts(scale = 1, palette = {}, options = {}) {
        const {
            aura = 0xff9f2f,
            blade = 0xffe7c5,
            edge = 0xffffff,
            guard = 0xffa941,
            rune = 0xffcf83,
            pommelCore = 0x6f4514,
            pommelRing = 0xc88941
        } = palette;
        const {
            darkKnight = false,
            largePommel = 1
        } = options;

        const auraRect = this.scene.add.rectangle(8 * scale, 0, 200 * scale, 38 * scale, aura, darkKnight ? 0.2 : 0.16);
        const bladeBody = this.scene.add.polygon(0, 0, [
            -82 * scale, -7.4 * scale,
            66 * scale, -7.4 * scale,
            94 * scale, 0,
            66 * scale, 7.4 * scale,
            -82 * scale, 7.4 * scale
        ], blade, 0.98).setStrokeStyle(1.1 * scale, edge, 0.9);

        const fuller = this.scene.add.rectangle(8 * scale, 0, 112 * scale, 2.8 * scale, darkKnight ? 0x9a99a8 : 0xe8dcc3, 0.75);
        const edgeRect = this.scene.add.polygon(0, 0, [
            36 * scale, -2.5 * scale,
            68 * scale, -2.5 * scale,
            87 * scale, 0,
            68 * scale, 2.5 * scale,
            36 * scale, 2.5 * scale
        ], edge, 0.92);

        const guardRect = this.scene.add.rectangle(-66 * scale, 0, 28 * scale, 20 * scale, guard, 0.9);
        const guardWingA = this.scene.add.triangle(-79 * scale, 0, 0, 0, -16 * scale, -8 * scale, -16 * scale, 8 * scale, guard, 0.86);
        const guardWingB = this.scene.add.triangle(-53 * scale, 0, 0, 0, 16 * scale, -8 * scale, 16 * scale, 8 * scale, guard, 0.86);

        const grip = this.scene.add.rectangle(-90 * scale, 0, 24 * scale, 10 * scale, darkKnight ? 0x1e1c26 : 0x5e3a18, 0.95)
            .setStrokeStyle(1.2 * scale, darkKnight ? 0x5d5874 : 0xbf8a4a, 0.7);

        const pommel = this.scene.add.circle(-108 * scale, 0, (8 * scale) * largePommel, pommelCore, 0.95)
            .setStrokeStyle(2 * scale, pommelRing, 0.88);
        const pommelCoreGlow = this.scene.add.circle(-108 * scale, 0, (3.4 * scale) * largePommel, edge, 0.55);

        const runeArc = this.scene.add.graphics();
        runeArc.lineStyle(2 * scale, rune, 0.72);
        runeArc.beginPath();
        runeArc.arc(0, 0, 82 * scale, -0.35, 0.35);
        runeArc.strokePath();

        return {
            aura: auraRect,
            blade: bladeBody,
            fuller,
            edge: edgeRect,
            guard: guardRect,
            guardWingA,
            guardWingB,
            grip,
            pommel,
            pommelCoreGlow,
            runeArc,
            all: [
                auraRect,
                bladeBody,
                fuller,
                edgeRect,
                guardRect,
                guardWingA,
                guardWingB,
                grip,
                pommel,
                pommelCoreGlow,
                runeArc
            ]
        };
    }

    fire(angle) {
        const data = this.data.projectile;
        const startX = this.player.x + Math.cos(angle) * 30;
        const startY = this.player.y + Math.sin(angle) * 30;

        this.createMuzzleFlash(startX, startY, this.data.color);

        const sword = this.scene.add.container(startX, startY).setDepth(150);
        const scale = 0.24 + data.size / 58;

        // One clean sword silhouette: triangle blade + curved side trails.
        const blade = this.scene.add.triangle(
            0,
            0,
            92 * scale, 0,
            -66 * scale, -12 * scale,
            -66 * scale, 12 * scale,
            0xffecd1,
            0.98
        ).setStrokeStyle(1.3 * scale, 0xffffff, 0.9);

        const sideCurves = this.scene.add.graphics();
        sideCurves.lineStyle(2, 0xffd896, 0.68);
        sideCurves.beginPath();
        sideCurves.moveTo(-60 * scale, -1 * scale);
        sideCurves.quadraticCurveTo(6 * scale, -18 * scale, 84 * scale, -4 * scale);
        sideCurves.moveTo(-60 * scale, 1 * scale);
        sideCurves.quadraticCurveTo(6 * scale, 18 * scale, 84 * scale, 4 * scale);
        sideCurves.strokePath();

        const hilt = this.scene.add.rectangle(-76 * scale, 0, 18 * scale, 14 * scale, 0xc6863f, 0.95);
        const pommel = this.scene.add.circle(-90 * scale, 0, 5.2 * scale, 0x6a3c16, 1)
            .setStrokeStyle(1.2 * scale, 0xcf9858, 0.8);

        sword.add([blade, sideCurves, hilt, pommel]);
        sword.rotation = angle;

        sword.vx = Math.cos(angle) * data.speed;
        sword.vy = Math.sin(angle) * data.speed;
        sword.damage = data.damage;
        sword.range = data.range;
        sword.startX = startX;
        sword.startY = startY;
        sword.piercing = data.piercing;
        sword.hasHit = false;
        sword.visualAngle = angle;

        sword.update = () => {
            if (!sword.scene) return;
            const targetAngle = Math.atan2(sword.vy, sword.vx);
            sword.visualAngle = Phaser.Math.Angle.RotateTo(sword.visualAngle, targetAngle, 0.24);
            sword.rotation = sword.visualAngle;
        };

        sword.on('destroy', () => {
            blade.destroy();
            sideCurves.destroy();
            hilt.destroy();
            pommel.destroy();
        });

        this.scene.projectiles.push(sword);
        this.addTrail(sword, data.color, data.size);
    }

    executeChargedAttack(angle) {
        const charged = this.data.charged;

        const startX = this.player.x + Math.cos(angle) * 40;
        const startY = this.player.y + Math.sin(angle) * 40;
        const endX = startX + Math.cos(angle) * charged.length;
        const endY = startY + Math.sin(angle) * charged.length;

        let hasHit = false;

        const beamAura = this.scene.add.graphics().setDepth(160);
        beamAura.lineStyle(charged.width * 3.1, 0xff9f2f, 0.24);
        beamAura.lineBetween(startX, startY, endX, endY);

        const beamCore = this.scene.add.graphics().setDepth(161);
        beamCore.lineStyle(charged.width, 0xfff0c9, 0.98);
        beamCore.lineBetween(startX, startY, endX, endY);

        const beamEdge = this.scene.add.graphics().setDepth(162);
        beamEdge.lineStyle(2.5, 0xffffff, 0.88);
        beamEdge.lineBetween(startX, startY, endX, endY);

        const crackleA = this.scene.add.graphics().setDepth(163);
        const crackleB = this.scene.add.graphics().setDepth(163);
        this.drawCrackleLine(crackleA, startX, startY, endX, endY, 0xfff3d2, 0.72, 5);
        this.drawCrackleLine(crackleB, startX, startY, endX, endY, 0xffc87d, 0.52, 9);

        [beamAura, beamCore, beamEdge, crackleA, crackleB].forEach(v => { v.alpha = 0; });

        this.scene.tweens.add({
            targets: [beamAura, beamCore, beamEdge, crackleA, crackleB],
            alpha: 1,
            duration: 40,
            onComplete: () => {
                if (!hasHit) {
                    this.checkLaserHit(startX, startY, endX, endY, angle, charged);
                    hasHit = true;
                }

                this.scene.tweens.add({
                    targets: [beamAura, beamCore, beamEdge, crackleA, crackleB],
                    alpha: 0,
                    duration: 170,
                    delay: 70,
                    onComplete: () => {
                        beamAura.destroy();
                        beamCore.destroy();
                        beamEdge.destroy();
                        crackleA.destroy();
                        crackleB.destroy();
                    }
                });
            }
        });

        this.spawnBeamParticles(startX, startY, angle, charged);
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
            const finalDamage = charged.damage * (this.player.damageMultiplier || 1.0);
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

            const impact = this.scene.add.circle(boss.x, boss.y, 28, 0xffb566, 0.78).setDepth(170);
            const ring1 = this.scene.add.circle(boss.x, boss.y, 16, 0xffefcb, 0)
                .setStrokeStyle(3, 0xffefcb, 0.95)
                .setDepth(171);
            const ring2 = this.scene.add.circle(boss.x, boss.y, 24, 0xff9f3a, 0)
                .setStrokeStyle(2, 0xff9f3a, 0.7)
                .setDepth(170);

            this.scene.tweens.add({
                targets: [impact, ring1, ring2],
                alpha: 0,
                scale: 2.15,
                duration: 300,
                onComplete: () => {
                    impact.destroy();
                    ring1.destroy();
                    ring2.destroy();
                }
            });
        }
    }

    createSlashCastFX(x, y, angle, data) {
        const castArc = this.scene.add.graphics().setDepth(158);
        castArc.lineStyle(3, 0xffd89b, 0.84);
        castArc.beginPath();
        castArc.arc(x, y, data.size * 2.5, angle - 1.02, angle + 1.02);
        castArc.strokePath();

        const flash = this.scene.add.circle(x, y, 14, 0xfff0ce, 0.62).setDepth(159);

        this.scene.tweens.add({
            targets: [castArc, flash],
            alpha: 0,
            scale: 1.3,
            duration: 145,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                castArc.destroy();
                flash.destroy();
            }
        });

        for (let i = 0; i < 8; i++) {
            const spark = this.scene.add.circle(
                x + Phaser.Math.Between(-10, 10),
                y + Phaser.Math.Between(-10, 10),
                Phaser.Math.FloatBetween(1.8, 3.8),
                Phaser.Math.RND.pick([0xfff2d4, 0xffd79c, 0xffb55a]),
                0.88
            ).setDepth(159);

            this.scene.tweens.add({
                targets: spark,
                x: spark.x + Math.cos(angle + Phaser.Math.FloatBetween(-0.5, 0.5)) * Phaser.Math.Between(20, 36),
                y: spark.y + Math.sin(angle + Phaser.Math.FloatBetween(-0.5, 0.5)) * Phaser.Math.Between(20, 36),
                alpha: 0,
                duration: Phaser.Math.Between(90, 170),
                onComplete: () => spark.destroy()
            });
        }
    }

    spawnSwordSpark(x, y, angle) {
        const spark = this.scene.add.circle(
            x + Phaser.Math.Between(-5, 5),
            y + Phaser.Math.Between(-5, 5),
            Phaser.Math.FloatBetween(1.5, 3),
            Phaser.Math.RND.pick([0xffefcb, 0xffd89b, 0xffb861]),
            0.9
        ).setDepth(156);

        this.scene.tweens.add({
            targets: spark,
            x: spark.x + Math.cos(angle + Phaser.Math.FloatBetween(-0.35, 0.35)) * Phaser.Math.Between(12, 24),
            y: spark.y + Math.sin(angle + Phaser.Math.FloatBetween(-0.35, 0.35)) * Phaser.Math.Between(12, 24),
            alpha: 0,
            scale: 0.3,
            duration: Phaser.Math.Between(80, 145),
            onComplete: () => spark.destroy()
        });
    }

    spawnBladeGhost(x, y, angle, size) {
        const ghost = this.scene.add.rectangle(x, y, size * 2.4, size * 0.4, 0xffd49a, 0.2).setDepth(148);
        ghost.rotation = angle;
        this.scene.tweens.add({
            targets: ghost,
            alpha: 0,
            scaleX: 0.6,
            duration: 120,
            onComplete: () => ghost.destroy()
        });
    }

    drawCrackleLine(graphics, x1, y1, x2, y2, color, alpha, variance = 6) {
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
    }

    spawnBeamParticles(startX, startY, angle, charged) {
        for (let i = 0; i < 20; i++) {
            const dist = i * (charged.length / 20);
            const px = startX + Math.cos(angle) * dist;
            const py = startY + Math.sin(angle) * dist;

            const spark = this.scene.add.circle(
                px,
                py,
                Phaser.Math.FloatBetween(1.8, 3.8),
                Phaser.Math.RND.pick([0xfff0d0, 0xffd08a, 0xffa84a]),
                0.84
            ).setDepth(163);

            this.scene.tweens.add({
                targets: spark,
                x: px + Math.cos(angle + Math.PI / 2) * Phaser.Math.Between(-16, 16),
                y: py + Math.sin(angle + Math.PI / 2) * Phaser.Math.Between(-16, 16),
                alpha: 0,
                scale: 0.35,
                duration: Phaser.Math.Between(100, 200),
                onComplete: () => spark.destroy()
            });
        }
    }

    startUltimateCharge(targetX, targetY) {
        if (this.ultimateState || !this.canUseUltimate()) return false;

        const aimX = targetX ?? this.player.x + 1;
        const aimY = targetY ?? this.player.y;
        const angle = Math.atan2(aimY - this.player.y, aimX - this.player.x);
        const sideDist = 62;

        const makeChargedSword = (side) => {
            const sign = side === 'left' ? -1 : 1;
            const sx = this.player.x + sign * sideDist;
            const sy = this.player.y;

            const container = this.scene.add.container(sx, sy).setDepth(188);
            const swordParts = this.createProceduralSwordParts(1.35, {
                aura: 0x5b5a82,
                blade: 0xd6d6e8,
                edge: 0xf5f8ff,
                guard: 0x2c2a38,
                rune: 0x9fa6ff,
                pommelCore: 0x121018,
                pommelRing: 0x7e85c9
            }, {
                darkKnight: true,
                largePommel: 1.45
            });
            const trail = this.scene.add.particles(0, 0, null, {
                lifespan: { min: 180, max: 300 },
                speed: { min: 40, max: 120 },
                angle: { min: 150, max: 210 },
                quantity: 1,
                frequency: 26,
                scale: { start: 0.7, end: 0 },
                alpha: { start: 0.8, end: 0 },
                tint: [0xfff3d0, 0xffd186, 0xffa948],
                emitting: true,
                blendMode: 'ADD'
            });

            trail.setTexture('sword-ult-dot');
            trail.setDepth(187);

            container.rotation = angle + (sign < 0 ? 0.2 : -0.2);
            container.add(swordParts.all);

            this.scene.tweens.add({
                targets: [swordParts.aura, swordParts.blade],
                alpha: { from: 0.55, to: 0.95 },
                scaleX: { from: 0.94, to: 1.08 },
                duration: 180,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            return {
                side,
                sign,
                container,
                parts: swordParts,
                trail,
                phase: Math.random() * Math.PI * 2
            };
        };

        this.ultimateState = {
            phase: 'charge',
            startedAt: this.scene.time.now,
            targetX: aimX,
            targetY: aimY,
            swords: [makeChargedSword('left'), makeChargedSword('right')],
            sigil: this.scene.add.graphics().setDepth(186)
        };

        return true;
    }

    updateUltimate(time, delta, targetX, targetY) {
        const state = this.ultimateState;
        if (!state) return;

        if (state.phase === 'charge') {
            state.targetX = targetX ?? state.targetX;
            state.targetY = targetY ?? state.targetY;

            const angle = Math.atan2(state.targetY - this.player.y, state.targetX - this.player.x);
            const sideDist = 62;
            const sway = Math.sin(time * 0.012) * 7;

            state.sigil.clear();
            state.sigil.lineStyle(3, 0xffd07a, 0.38);
            state.sigil.strokeCircle(this.player.x, this.player.y, 54 + Math.sin(time * 0.01) * 5);
            state.sigil.lineStyle(1.5, 0xfff0cd, 0.32);
            state.sigil.strokeCircle(this.player.x, this.player.y, 80 + Math.sin(time * 0.008) * 6);

            for (const sword of state.swords) {
                sword.phase += 0.08;
                sword.container.x = this.player.x + sword.sign * sideDist;
                sword.container.y = this.player.y + Math.sin(sword.phase) * 5;
                sword.container.rotation = angle + (sword.sign < 0 ? 0.24 : -0.24) + sway * 0.002;
                sword.trail.setPosition(sword.container.x - Math.cos(sword.container.rotation) * 50, sword.container.y - Math.sin(sword.container.rotation) * 50);
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

        state.phase = 'rush';
        state.targetX = targetX ?? state.targetX;
        state.targetY = targetY ?? state.targetY;

        const clamped = this.getClampedChargedTarget(state.targetX, state.targetY);
        state.targetX = clamped.x;
        state.targetY = clamped.y;

        const angle = Math.atan2(state.targetY - this.player.y, state.targetX - this.player.x);
        const perpX = Math.cos(angle + Math.PI * 0.5);
        const perpY = Math.sin(angle + Math.PI * 0.5);

        const boss = this.scene.boss;
        let hitApplied = false;

        for (const sword of state.swords) {
            const sideOffset = sword.sign * 52;
            const rushX = state.targetX + perpX * sideOffset;
            const rushY = state.targetY + perpY * sideOffset;
            const endX = state.targetX - perpX * sideOffset;
            const endY = state.targetY - perpY * sideOffset;

            sword.container.rotation = angle;

            this.scene.tweens.add({
                targets: sword.container,
                x: rushX,
                y: rushY,
                duration: 200,
                ease: 'Cubic.easeIn',
                onComplete: () => {
                    this.scene.tweens.add({
                        targets: sword.container,
                        x: endX,
                        y: endY,
                        duration: 260,
                        ease: 'Cubic.easeOut',
                        onComplete: () => {
                            if (boss && !hitApplied) {
                                hitApplied = true;
                                const finalDamage = 220 * (this.player.damageMultiplier || 1.0);
                                boss.takeDamage(finalDamage);
                                this.gainUltimateGaugeFromDamage(finalDamage, { charged: true });
                                boss.setTint(0xffd18a);
                                this.scene.time.delayedCall(120, () => boss.clearTint());
                            }
                            this.spawnUltimateImpact(state.targetX, state.targetY);
                        }
                    });
                }
            });
        }

        this.scene.cameras.main.flash(140, 255, 205, 120);
        this.scene.cameras.main.shake(180, 0.008);
        this.scene.time.delayedCall(640, () => this.destroyUltimateState());
        return true;
    }

    spawnUltimateImpact(x, y) {
        const burst = this.scene.add.particles(x, y, 'sword-ult-dot', {
            speed: { min: 180, max: 420 },
            angle: { min: 0, max: 360 },
            scale: { start: 1.8, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: { min: 240, max: 540 },
            quantity: 22,
            blendMode: 'ADD',
            emitting: false
        }).setDepth(191);
        burst.explode();

        const ring = this.scene.add.circle(x, y, 20, 0xffe7be, 0).setStrokeStyle(4, 0xffd187, 0.88).setDepth(192);
        this.scene.tweens.add({
            targets: ring,
            radius: 118,
            alpha: 0,
            duration: 220,
            ease: 'Sine.easeOut',
            onComplete: () => ring.destroy()
        });

        this.scene.time.delayedCall(700, () => burst.destroy());
    }

    destroyUltimateState() {
        const state = this.ultimateState;
        if (!state) return;

        state.sigil?.destroy();
        for (const sword of state.swords || []) {
            sword.parts?.all?.forEach((part) => part.destroy());
            sword.trail?.destroy();
            sword.container?.destroy();
        }

        this.ultimateState = null;
    }
}
