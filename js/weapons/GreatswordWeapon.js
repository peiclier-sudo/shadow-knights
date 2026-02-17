// GreatswordWeapon.js - Espadon with smoother slash-style animations
import { WeaponBase } from './WeaponBase.js';
import { WEAPONS } from './weaponData.js';

export class GreatswordWeapon extends WeaponBase {
    constructor(scene, player) {
        super(scene, player, WEAPONS.GREATSWORD);
        this.ultimateState = null;
        this.worldsplitterConfig = {
            anchorDuration: 420,
            armorReduction: 0.6,
            pullRadius: 210,
            pullStrength: 0.12,
            cleaveLength: 620,
            cleaveWidth: 190,
            mainDamage: 210,
            aftershockDamage: 80,
            aftershockDelay: 180,
            aftershockSpacing: 120,
            vulnerabilityMultiplier: 1.2,
            vulnerabilityDuration: 2500
        };
    }

    // Basic attack - animated crescent shockwave
    fire(angle) {
        const data = this.data.projectile;
        const startX = this.player.x + Math.cos(angle) * 30;
        const startY = this.player.y + Math.sin(angle) * 30;

        this.createMuzzleFlash(startX, startY, this.data.color);

        const wave = this.scene.add.container(startX, startY).setDepth(150);
        this.createSmoothWaveVisual(wave, angle, data);

        wave.vx = Math.cos(angle) * data.speed;
        wave.vy = Math.sin(angle) * data.speed;
        wave.damage = data.damage;
        wave.range = data.range;
        wave.startX = startX;
        wave.startY = startY;
        wave.knockback = false;
        wave.knockbackForce = 0;
        wave.heavyKnockback = false;

        this.scene.projectiles.push(wave);
        this.addTrail(wave, data.color, data.size);
    }

    createSmoothWaveVisual(wave, angle, data) {
        const arc = this.scene.add.graphics();
        arc.lineStyle(5, data.color, 0.85);
        arc.beginPath();
        arc.arc(0, 0, data.size * 2.6, -0.85, 0.85);
        arc.strokePath();
        arc.rotation = angle;

        const innerGlow = this.scene.add.graphics();
        innerGlow.lineStyle(9, 0xffc47a, 0.28);
        innerGlow.beginPath();
        innerGlow.arc(0, 0, data.size * 2.1, -0.7, 0.7);
        innerGlow.strokePath();
        innerGlow.rotation = angle;

        const bladeShard = this.scene.add.triangle(
            Math.cos(angle) * data.size * 2.25,
            Math.sin(angle) * data.size * 2.25,
            0, -6,
            22, 0,
            0, 6,
            0xffd299,
            0.75
        );
        bladeShard.rotation = angle;

        wave.add([innerGlow, arc, bladeShard]);

        // Breathing animation for smoother feel
        this.scene.tweens.add({
            targets: [arc, innerGlow],
            alpha: { from: 0.9, to: 0.55 },
            duration: 120,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.scene.tweens.add({
            targets: bladeShard,
            scaleX: 1.25,
            scaleY: 0.88,
            alpha: { from: 0.8, to: 0.45 },
            duration: 150,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    // Charged attack - Colossus Breaker (directional finisher)
    executeChargedAttack(angle) {
        const charged = this.data.charged;

        const startX = this.player.x;
        const startY = this.player.y;
        const targetPoint = this.getClampedChargedTarget(
            startX + Math.cos(angle) * charged.maxRange,
            startY + Math.sin(angle) * charged.maxRange
        );

        const pathLine = new Phaser.Geom.Line(startX, startY, targetPoint.x, targetPoint.y);
        this.createColossusBreakerFX(pathLine, angle, charged);

        this.scene.tweens.add({
            targets: this.player,
            x: targetPoint.x,
            y: targetPoint.y,
            duration: 180,
            ease: 'Power2'
        });

        this.scene.cameras.main.shake(220, 0.012);

        const boss = this.scene.boss;
        if (boss) {
            const nearest = Phaser.Geom.Line.GetNearestPoint(pathLine, { x: boss.x, y: boss.y });
            const distToPath = Phaser.Math.Distance.Between(boss.x, boss.y, nearest.x, nearest.y);

            if (distToPath <= charged.radius) {
                const finalDamage = charged.damage * (this.player.damageMultiplier || 1.0);
                boss.takeDamage(finalDamage);
                this.gainUltimateGaugeFromDamage(finalDamage, { charged: true });

                if (charged.stun) {
                    boss.stunned = true;
                    boss.setTint(0xffc266);
                    this.scene.time.delayedCall(charged.stunDuration, () => {
                        if (!boss.scene) return;
                        boss.stunned = false;
                        boss.clearTint();
                    });
                }

                const push = 140;
                this.scene.tweens.add({
                    targets: boss,
                    x: boss.x + Math.cos(angle) * push,
                    y: boss.y + Math.sin(angle) * push,
                    duration: 180,
                    ease: 'Power2'
                });
            }
        }
    }

    createColossusBreakerFX(pathLine, angle, charged) {
        const width = charged.radius * 2;
        const length = Phaser.Geom.Line.Length(pathLine);
        const cx = (pathLine.x1 + pathLine.x2) * 0.5;
        const cy = (pathLine.y1 + pathLine.y2) * 0.5;

        const trailCore = this.scene.add.rectangle(cx, cy, length, width * 0.72, 0xffb566, 0.2)
            .setRotation(angle)
            .setDepth(145);

        const trailEdge = this.scene.add.rectangle(cx, cy, length, width * 1.05, 0xffa13d, 0)
            .setStrokeStyle(3, 0xffd9a3, 0.65)
            .setRotation(angle)
            .setDepth(144);

        const sweep = this.scene.add.graphics().setDepth(146);
        sweep.lineStyle(7, 0xffe3be, 0.85);
        sweep.beginPath();
        sweep.arc(pathLine.x1, pathLine.y1, 34, angle - 0.9, angle + 0.9);
        sweep.strokePath();

        const impactRing = this.scene.add.circle(pathLine.x2, pathLine.y2, 28, 0xffc680, 0)
            .setStrokeStyle(3, 0xffe4c0, 0.9)
            .setDepth(146);

        this.scene.tweens.add({
            targets: [trailCore, trailEdge],
            alpha: 0,
            scaleY: 1.22,
            duration: 240,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                trailCore.destroy();
                trailEdge.destroy();
            }
        });

        this.scene.tweens.add({
            targets: sweep,
            alpha: 0,
            angle: 24,
            duration: 230,
            ease: 'Sine.easeOut',
            onComplete: () => sweep.destroy()
        });

        this.scene.tweens.add({
            targets: impactRing,
            alpha: 0,
            scale: 1.8,
            duration: 280,
            ease: 'Cubic.easeOut',
            onComplete: () => impactRing.destroy()
        });

        // Soft slash embers along path
        for (let i = 0; i < 9; i++) {
            const t = i / 8;
            const px = Phaser.Math.Linear(pathLine.x1, pathLine.x2, t);
            const py = Phaser.Math.Linear(pathLine.y1, pathLine.y2, t);
            const ember = this.scene.add.circle(px, py, Phaser.Math.FloatBetween(2, 4), 0xffca8a, 0.65).setDepth(147);

            this.scene.tweens.add({
                targets: ember,
                x: px + Math.cos(angle + Math.PI / 2) * Phaser.Math.Between(-12, 12),
                y: py + Math.sin(angle + Math.PI / 2) * Phaser.Math.Between(-12, 12),
                alpha: 0,
                scale: 0.35,
                duration: Phaser.Math.Between(140, 240),
                onComplete: () => ember.destroy()
            });
        }
    }

    startUltimateCharge(targetX, targetY) {
        if (this.ultimateState || !this.canUseUltimate()) return false;

        const aimX = targetX ?? this.player.x + 1;
        const aimY = targetY ?? this.player.y;
        const angle = Math.atan2(aimY - this.player.y, aimX - this.player.x);

        const sigil = this.scene.add.graphics().setDepth(188);
        const anchorGlow = this.scene.add.circle(this.player.x, this.player.y, 26, 0x3b1f06, 0.42).setDepth(186);
        const anchorRing = this.scene.add.circle(this.player.x, this.player.y, 30, 0x000000, 0)
            .setStrokeStyle(3, 0xffd7a6, 0.72)
            .setDepth(187);

        this.ultimateState = {
            phase: 'anchor',
            startedAt: this.scene.time.now,
            targetX: aimX,
            targetY: aimY,
            angle,
            sigil,
            anchorGlow,
            anchorRing,
            timers: []
        };

        return true;
    }

    updateUltimate(time, delta, targetX, targetY) {
        const state = this.ultimateState;
        if (!state || state.phase !== 'anchor') return;

        state.targetX = targetX ?? state.targetX;
        state.targetY = targetY ?? state.targetY;

        const clamped = this.getClampedChargedTarget(state.targetX, state.targetY);
        state.targetX = clamped.x;
        state.targetY = clamped.y;
        state.angle = Math.atan2(state.targetY - this.player.y, state.targetX - this.player.x);

        const cfg = this.worldsplitterConfig;
        const pulse = 1 + Math.sin(time * 0.015) * 0.12;
        const spin = time * 0.0026;

        state.sigil.clear();
        state.sigil.lineStyle(3, 0xffbe6e, 0.52);
        state.sigil.strokeCircle(this.player.x, this.player.y, 52 * pulse);
        state.sigil.lineStyle(2, 0xffe0ba, 0.45);
        state.sigil.strokeCircle(this.player.x, this.player.y, 78 * pulse);

        state.sigil.lineStyle(2.2, 0xffb45a, 0.72);
        state.sigil.beginPath();
        state.sigil.arc(this.player.x, this.player.y, 64, spin, spin + 1.5);
        state.sigil.strokePath();
        state.sigil.beginPath();
        state.sigil.arc(this.player.x, this.player.y, 64, spin + Math.PI, spin + Math.PI + 1.5);
        state.sigil.strokePath();

        state.sigil.lineStyle(2.4, 0xffefcf, 0.7);
        state.sigil.lineBetween(this.player.x, this.player.y, state.targetX, state.targetY);
        state.sigil.strokeCircle(state.targetX, state.targetY, 15 + Math.sin(time * 0.018) * 3);

        state.anchorGlow.setRadius(24 + Math.sin(time * 0.018) * 4);
        state.anchorGlow.setAlpha(0.34 + (Math.sin(time * 0.022) + 1) * 0.1);
        state.anchorRing.setRadius(28 + Math.sin(time * 0.012) * 5);

        const boss = this.scene.boss;
        if (boss?.scene) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, boss.x, boss.y);
            if (dist <= cfg.pullRadius) {
                const dir = Math.atan2(this.player.y - boss.y, this.player.x - boss.x);
                boss.x += Math.cos(dir) * cfg.pullStrength;
                boss.y += Math.sin(dir) * cfg.pullStrength;
            }
        }
    }

    releaseUltimate(targetX, targetY) {
        const state = this.ultimateState;
        if (!state || state.phase !== 'anchor') return false;

        if (!this.consumeUltimate()) {
            this.destroyUltimateState();
            return false;
        }

        const cfg = this.worldsplitterConfig;
        state.phase = 'release';

        state.targetX = targetX ?? state.targetX;
        state.targetY = targetY ?? state.targetY;
        const clamped = this.getClampedChargedTarget(state.targetX, state.targetY);
        state.targetX = clamped.x;
        state.targetY = clamped.y;
        state.angle = Math.atan2(state.targetY - this.player.y, state.targetX - this.player.x);

        const oldReduction = this.player.damageReduction || 0;
        this.player.damageReduction = Math.max(oldReduction, cfg.armorReduction);

        const anchorTimer = this.scene.time.delayedCall(cfg.anchorDuration, () => {
            if (!this.ultimateState) return;
            this.player.damageReduction = oldReduction;
            this.executeWorldsplitter(state.angle);
        });

        state.timers.push(anchorTimer);
        return true;
    }

    executeWorldsplitter(angle) {
        const cfg = this.worldsplitterConfig;
        const startX = this.player.x;
        const startY = this.player.y;
        const endX = startX + Math.cos(angle) * cfg.cleaveLength;
        const endY = startY + Math.sin(angle) * cfg.cleaveLength;
        const centerX = (startX + endX) * 0.5;
        const centerY = (startY + endY) * 0.5;

        const cleaveCore = this.scene.add.rectangle(centerX, centerY, cfg.cleaveLength, cfg.cleaveWidth * 0.55, 0xffa44d, 0.34)
            .setRotation(angle)
            .setDepth(176);
        const cleaveEdge = this.scene.add.rectangle(centerX, centerY, cfg.cleaveLength, cfg.cleaveWidth * 0.9, 0x000000, 0)
            .setStrokeStyle(4, 0xffe0b6, 0.88)
            .setRotation(angle)
            .setDepth(177);
        const scorch = this.scene.add.rectangle(centerX, centerY, cfg.cleaveLength, 18, 0x1a0d05, 0.6)
            .setRotation(angle)
            .setDepth(175);

        this.scene.tweens.add({
            targets: [cleaveCore, cleaveEdge, scorch],
            alpha: 0,
            duration: 280,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                cleaveCore.destroy();
                cleaveEdge.destroy();
                scorch.destroy();
            }
        });

        this.spawnWorldsplitterShards(startX, startY, endX, endY, angle);
        this.scene.cameras.main.flash(180, 255, 185, 90);
        this.scene.cameras.main.shake(280, 0.011);

        const boss = this.scene.boss;
        if (boss?.scene) {
            const distLine = Phaser.Math.Distance.BetweenPoints(
                { x: boss.x, y: boss.y },
                Phaser.Geom.Line.GetNearestPoint(new Phaser.Geom.Line(startX, startY, endX, endY), { x: boss.x, y: boss.y })
            );
            const distImpact = Phaser.Math.Distance.Between(boss.x, boss.y, endX, endY);
            if (distLine <= cfg.cleaveWidth * 0.5 || distImpact <= cfg.cleaveWidth * 0.9) {
                const damage = cfg.mainDamage * (this.player.damageMultiplier || 1.0);
                boss.takeDamage(damage);
                this.gainUltimateGaugeFromDamage(damage, { charged: true });
                boss.setTint(0xffc07a);

                const knock = 170;
                this.scene.tweens.add({
                    targets: boss,
                    x: boss.x + Math.cos(angle) * knock,
                    y: boss.y + Math.sin(angle) * knock,
                    duration: 220,
                    ease: 'Power2'
                });

                const prevMult = boss.damageTakenMultiplier || 1;
                boss.damageTakenMultiplier = Math.max(prevMult, cfg.vulnerabilityMultiplier);
                this.scene.time.delayedCall(cfg.vulnerabilityDuration, () => {
                    if (!boss?.scene) return;
                    boss.damageTakenMultiplier = prevMult;
                    boss.clearTint();
                });
            }
        }

        for (let i = 1; i <= 2; i++) {
            this.scene.time.delayedCall(cfg.aftershockDelay + i * cfg.aftershockSpacing, () => {
                this.spawnAftershock(startX, startY, angle, i);
            });
        }

        this.destroyUltimateState();
    }

    spawnAftershock(startX, startY, angle, index) {
        const cfg = this.worldsplitterConfig;
        const distance = (cfg.cleaveLength * 0.32) + index * 120;
        const x = startX + Math.cos(angle) * distance;
        const y = startY + Math.sin(angle) * distance;

        const ring = this.scene.add.circle(x, y, 26, 0xffb76f, 0.35).setDepth(178);
        const crack = this.scene.add.rectangle(x, y, 90, 10, 0xffe3c0, 0.82).setRotation(angle).setDepth(179);

        this.scene.tweens.add({
            targets: ring,
            radius: 96,
            alpha: 0,
            duration: 230,
            onComplete: () => ring.destroy()
        });

        this.scene.tweens.add({
            targets: crack,
            alpha: 0,
            scaleX: 1.5,
            duration: 170,
            onComplete: () => crack.destroy()
        });

        const boss = this.scene.boss;
        if (!boss?.scene) return;
        const dist = Phaser.Math.Distance.Between(x, y, boss.x, boss.y);
        if (dist <= 96) {
            const damage = cfg.aftershockDamage * (this.player.damageMultiplier || 1.0);
            boss.takeDamage(damage);
            this.gainUltimateGaugeFromDamage(damage, { charged: true });
            boss.setTint(0xffd4a2);
            this.scene.time.delayedCall(120, () => boss?.clearTint?.());
        }
    }

    spawnWorldsplitterShards(startX, startY, endX, endY, angle) {
        for (let i = 0; i < 24; i++) {
            const t = Math.random();
            const baseX = Phaser.Math.Linear(startX, endX, t);
            const baseY = Phaser.Math.Linear(startY, endY, t);
            const spread = Phaser.Math.Between(-70, 70);
            const perp = angle + Math.PI * 0.5;

            const shard = this.scene.add.rectangle(
                baseX + Math.cos(perp) * spread,
                baseY + Math.sin(perp) * spread,
                Phaser.Math.Between(9, 24),
                Phaser.Math.Between(2, 5),
                Phaser.Math.RND.pick([0xffe4c2, 0xffbd77, 0xff9149]),
                Phaser.Math.FloatBetween(0.35, 0.82)
            ).setRotation(angle + Phaser.Math.FloatBetween(-0.45, 0.45)).setDepth(178);

            this.scene.tweens.add({
                targets: shard,
                x: shard.x + Math.cos(angle) * Phaser.Math.Between(55, 170),
                y: shard.y + Math.sin(angle) * Phaser.Math.Between(55, 170),
                alpha: 0,
                duration: Phaser.Math.Between(150, 300),
                ease: 'Cubic.easeOut',
                onComplete: () => shard.destroy()
            });
        }
    }

    destroyUltimateState() {
        const state = this.ultimateState;
        if (!state) return;

        state.sigil?.destroy();
        state.anchorGlow?.destroy();
        state.anchorRing?.destroy();
        for (const timer of state.timers || []) timer?.remove?.();

        this.ultimateState = null;
    }

}
