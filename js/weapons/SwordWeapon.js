// SwordWeapon.js - Procedural sword VFX with smoother badass blade projection
import { WeaponBase } from './WeaponBase.js';
import { WEAPONS } from './weaponData.js';

export class SwordWeapon extends WeaponBase {
    constructor(scene, player) {
        super(scene, player, WEAPONS.SWORD);
        this.ultimateState = null;
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

    fire(angle) {
        const data = this.data.projectile;
        const startX = this.player.x + Math.cos(angle) * 30;
        const startY = this.player.y + Math.sin(angle) * 30;

        this.createMuzzleFlash(startX, startY, this.data.color);
        this.launchSwordProjectile(angle, {
            startX,
            startY,
            speed: data.speed,
            damage: data.damage,
            range: data.range,
            size: data.size,
            color: data.color,
            piercing: data.piercing,
            trailSize: data.size
        });
    }

    launchSwordProjectile(angle, options = {}) {
        const {
            startX = this.player.x + Math.cos(angle) * 30,
            startY = this.player.y + Math.sin(angle) * 30,
            speed,
            damage,
            range,
            size,
            color,
            piercing,
            trailSize
        } = options;

        const sword = this.scene.add.container(startX, startY).setDepth(150);
        const scale = 0.26 + size / 44;
        const swordVisual = this.createSimpleSwordVisual(scale);

        sword.add(swordVisual.all);
        sword.rotation = angle;

        sword.vx = Math.cos(angle) * speed;
        sword.vy = Math.sin(angle) * speed;
        sword.damage = damage;
        sword.range = range;
        sword.startX = startX;
        sword.startY = startY;
        sword.piercing = piercing;
        sword.hasHit = false;
        sword.visualAngle = angle;
        sword.update = () => {
            if (!sword.scene) return;
            const targetAngle = Math.atan2(sword.vy, sword.vx);
            sword.visualAngle = Phaser.Math.Angle.RotateTo(sword.visualAngle, targetAngle, 0.24);
            sword.rotation = sword.visualAngle;
        };

        sword.on('destroy', () => {
            swordVisual.all.forEach((part) => part.destroy());
        });

        this.scene.projectiles.push(sword);
        this.addTrail(sword, color, trailSize ?? size);
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
        const flash = this.scene.add.circle(x, y, Math.max(6, data.size * 0.45), 0xfff0ce, 0.42).setDepth(159);
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 1.08,
            duration: 70,
            ease: 'Sine.easeOut',
            onComplete: () => flash.destroy()
        });
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

    drawCurveLine(graphics, x1, y1, cx, cy, x2, y2, segments = 14) {
        graphics.beginPath();
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const inv = 1 - t;
            const x = (inv * inv * x1) + (2 * inv * t * cx) + (t * t * x2);
            const y = (inv * inv * y1) + (2 * inv * t * cy) + (t * t * y2);
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

        const makeSummonedSword = (sign) => {
            const container = this.scene.add.container(this.player.x + sign * 60, this.player.y).setDepth(188);
            const visual = this.createSimpleSwordVisual(1.35);
            container.add(visual.all);
            container.rotation = angle + (sign < 0 ? 0.24 : -0.24);
            return { sign, container, visual, phase: Math.random() * Math.PI * 2 };
        };

        this.ultimateState = {
            phase: 'charge',
            targetX: aimX,
            targetY: aimY,
            sigil: this.scene.add.graphics().setDepth(186),
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
            const sideDist = 60;

            state.sigil.clear();
            state.sigil.lineStyle(3, 0xffd07a, 0.38);
            state.sigil.strokeCircle(this.player.x, this.player.y, 54 + Math.sin(time * 0.01) * 5);
            state.sigil.lineStyle(1.5, 0xfff0cd, 0.32);
            state.sigil.strokeCircle(this.player.x, this.player.y, 80 + Math.sin(time * 0.008) * 6);
            state.sigil.lineStyle(2, 0xfff0cd, 0.76);
            state.sigil.lineBetween(this.player.x, this.player.y, state.targetX, state.targetY);
            state.sigil.strokeCircle(state.targetX, state.targetY, 18 + Math.sin(time * 0.015) * 3);

            for (const sword of state.swords) {
                sword.phase += 0.08;
                sword.container.x = this.player.x + sword.sign * sideDist;
                sword.container.y = this.player.y + Math.sin(sword.phase) * 4;
                sword.container.rotation = angle + (sword.sign < 0 ? 0.28 : -0.28);
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

        state.phase = 'release';
        state.targetX = targetX ?? state.targetX;
        state.targetY = targetY ?? state.targetY;

        const clamped = this.getClampedChargedTarget(state.targetX, state.targetY);
        state.targetX = clamped.x;
        state.targetY = clamped.y;

        for (const summoned of state.swords) {
            const angle = Math.atan2(state.targetY - summoned.container.y, state.targetX - summoned.container.x);
            this.launchSwordProjectile(angle, {
                startX: summoned.container.x + Math.cos(angle) * 34,
                startY: summoned.container.y + Math.sin(angle) * 34,
                speed: this.data.projectile.speed,
                damage: 120,
                range: 520,
                size: this.data.projectile.size + 6,
                color: this.data.projectile.color,
                piercing: true,
                trailSize: this.data.projectile.size + 2
            });
        }

        this.scene.cameras.main.flash(120, 255, 205, 120);
        this.scene.cameras.main.shake(160, 0.007);
        this.destroyUltimateState();
        return true;
    }

    destroyUltimateState() {
        const state = this.ultimateState;
        if (!state) return;

        state.sigil?.destroy();
        for (const sword of state.swords || []) {
            sword.visual?.all?.forEach((part) => part.destroy());
            sword.container?.destroy();
        }

        this.ultimateState = null;
    }
}
