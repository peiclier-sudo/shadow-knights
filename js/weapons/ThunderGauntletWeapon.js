import { WeaponBase } from './WeaponBase.js';
import { WEAPONS } from './weaponData.js';

export class ThunderGauntletWeapon extends WeaponBase {
    constructor(scene, player) {
        super(scene, player, WEAPONS.THUNDER_GAUNTLET);
        this.ultimateState = null;
        this.stormbreakerConfig = {
            maxRange: 460,
            blitzHits: 4,
            blitzInterval: 115,
            blitzDamage: 40,
            empDamage: 135,
            nodeRadius: 140,
            afterBuffDuration: 1800,
            afterBuffShots: 6
        };
    }

    getUltimatePreviewConfig() {
        const cfg = this.stormbreakerConfig;
        return {
            targeting: 'line',
            maxRange: cfg.maxRange,
            width: cfg.nodeRadius
        };
    }

    fire(angle) {
        const data = this.data.projectile;
        const startX = this.player.x + Math.cos(angle) * 28;
        const startY = this.player.y + Math.sin(angle) * 28;

        this.createMuzzleFlash(startX, startY, this.data.color);

        const bolt = this.scene.add.circle(startX, startY, data.size, 0x8bd6ff, 0.95).setDepth(152);
        const core = this.scene.add.circle(startX, startY, data.size * 0.45, 0xffffff, 0.95).setDepth(153);
        const corona = this.scene.add.circle(startX, startY, data.size * 2.1, 0x54beff, 0.28).setDepth(151);

        bolt.vx = Math.cos(angle) * data.speed;
        bolt.vy = Math.sin(angle) * data.speed;
        bolt.damage = data.damage;
        bolt.range = data.range;
        bolt.startX = startX;
        bolt.startY = startY;
        bolt.piercing = false;

        bolt.update = () => {
            if (!bolt.scene) return;
            const jitterX = Phaser.Math.Between(-1, 1);
            const jitterY = Phaser.Math.Between(-1, 1);

            bolt.x += jitterX;
            bolt.y += jitterY;
            bolt.alpha = Phaser.Math.FloatBetween(0.68, 1);

            core.x = bolt.x;
            core.y = bolt.y;
            core.alpha = Phaser.Math.FloatBetween(0.78, 1);

            corona.x = bolt.x;
            corona.y = bolt.y;
            corona.alpha = Phaser.Math.FloatBetween(0.14, 0.34);

            if (Math.random() > 0.55) {
                this.spawnMicroSpark(bolt.x, bolt.y);
            }
        };

        bolt.on('destroy', () => {
            core?.destroy();
            corona?.destroy();
        });

        this.scene.projectiles.push(bolt);
        this.addTrail(bolt, 0x7bccff, data.size + 1.2);
    }

    executeChargedAttack(angle) {
        const charged = this.data.charged;
        const startX = this.player.x;
        const startY = this.player.y;
        const targetPoint = this.getClampedChargedTarget(this.scene.worldMouseX, this.scene.worldMouseY);
        const dashLine = new Phaser.Geom.Line(startX, startY, targetPoint.x, targetPoint.y);

        this.createDashLineFX(dashLine, angle);
        this.createSparkleNova(startX, startY, 0xb9ecff);

        const hadInvulnerability = this.player.isInvulnerable;
        this.player.isCharging = true;
        this.player.isInvulnerable = true;
        this.player.body.setVelocity(0, 0);

        this.scene.tweens.add({
            targets: this.player,
            x: targetPoint.x,
            y: targetPoint.y,
            duration: charged.dashDuration,
            ease: 'Expo.easeIn',
            onUpdate: () => this.spawnDashSpark(this.player.x, this.player.y, false),
            onComplete: () => {
                this.createThunderBurst(targetPoint.x, targetPoint.y, angle);
                this.hitBossOnDashPath(dashLine, charged, angle);

                this.scene.time.delayedCall(charged.snapDelay, () => {
                    this.scene.tweens.add({
                        targets: this.player,
                        x: startX,
                        y: startY,
                        duration: charged.returnDuration,
                        ease: 'Expo.easeOut',
                        onUpdate: () => this.spawnDashSpark(this.player.x, this.player.y, true),
                        onComplete: () => {
                            this.player.isCharging = false;
                            this.player.isInvulnerable = hadInvulnerability;
                            this.player.body.setVelocity(0, 0);
                            this.createSnapbackPulse(startX, startY);
                        }
                    });
                });
            }
        });
    }

    hitBossOnDashPath(dashLine, charged, angle) {
        const boss = this.scene.boss;
        if (!boss?.scene) return;

        const nearest = Phaser.Geom.Line.GetNearestPoint(dashLine, { x: boss.x, y: boss.y });
        const distToPath = Phaser.Math.Distance.Between(boss.x, boss.y, nearest.x, nearest.y);
        const distToImpact = Phaser.Math.Distance.Between(dashLine.x2, dashLine.y2, boss.x, boss.y);

        if (distToPath > charged.hitRadius && distToImpact > charged.hitRadius * 1.5) return;

        const finalDamage = charged.damage * (this.player.damageMultiplier || 1.0);
        boss.takeDamage(finalDamage);
        this.gainUltimateGaugeFromDamage(finalDamage, { charged: true });

        boss.damageTakenMultiplier = charged.vulnerabilityMultiplier;
        boss.setTint(0x8fd8ff);

        if (boss.vulnerabilityTimer) {
            boss.vulnerabilityTimer.remove(false);
        }

        boss.vulnerabilityTimer = this.scene.time.delayedCall(charged.vulnerabilityDuration, () => {
            if (!boss.scene) return;
            boss.damageTakenMultiplier = 1.0;
            boss.clearTint();
            boss.vulnerabilityTimer = null;
        });

        const debuffText = this.scene.add.text(boss.x, boss.y - 82, '+20% DMG TAKEN', {
            fontFamily: 'Arial',
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#c6f0ff',
            stroke: '#062133',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(210);

        this.scene.tweens.add({
            targets: debuffText,
            y: debuffText.y - 36,
            alpha: 0,
            duration: 850,
            ease: 'Sine.easeOut',
            onComplete: () => debuffText.destroy()
        });

        this.scene.tweens.add({
            targets: boss,
            x: boss.x + Math.cos(angle) * 95,
            y: boss.y + Math.sin(angle) * 95,
            duration: 110,
            yoyo: true,
            ease: 'Sine.easeOut'
        });

        const mark = this.scene.add.circle(boss.x, boss.y, charged.hitRadius, 0x6bc8ff, 0.2).setDepth(155);
        const ring = this.scene.add.circle(boss.x, boss.y, charged.hitRadius * 0.5, 0x91e6ff, 0)
            .setStrokeStyle(3, 0xb6eeff, 0.95)
            .setDepth(156);

        this.scene.tweens.add({
            targets: [mark, ring],
            alpha: 0,
            scale: 1.85,
            duration: 240,
            onComplete: () => {
                mark.destroy();
                ring.destroy();
            }
        });

        for (let i = 0; i < 12; i++) {
            const sparkAngle = (i / 12) * Math.PI * 2;
            const spark = this.scene.add.circle(boss.x, boss.y, Phaser.Math.FloatBetween(2, 4), 0xa6eaff, 0.88).setDepth(157);
            this.scene.tweens.add({
                targets: spark,
                x: boss.x + Math.cos(sparkAngle) * Phaser.Math.Between(36, 76),
                y: boss.y + Math.sin(sparkAngle) * Phaser.Math.Between(36, 76),
                alpha: 0,
                duration: Phaser.Math.Between(120, 200),
                onComplete: () => spark.destroy()
            });
        }

        this.createSparkleNova(boss.x, boss.y, 0xd8f6ff);
        this.createThunderBurst(boss.x, boss.y, angle);
    }

    createDashLineFX(dashLine, angle) {
        const length = Phaser.Geom.Line.Length(dashLine);
        const cx = (dashLine.x1 + dashLine.x2) * 0.5;
        const cy = (dashLine.y1 + dashLine.y2) * 0.5;

        const ribbon = this.scene.add.rectangle(cx, cy, length, 24, 0x57c1ff, 0.32).setRotation(angle).setDepth(143);
        const edge = this.scene.add.rectangle(cx, cy, length, 40, 0x8be2ff, 0)
            .setRotation(angle)
            .setStrokeStyle(3, 0xe9fbff, 0.9)
            .setDepth(142);

        const arc = this.scene.add.graphics().setDepth(144);
        arc.lineStyle(3, 0xb8eeff, 0.9);
        const segments = 9;
        arc.beginPath();
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = Phaser.Math.Linear(dashLine.x1, dashLine.x2, t);
            const y = Phaser.Math.Linear(dashLine.y1, dashLine.y2, t) + (i % 2 === 0 ? -6 : 6);
            if (i === 0) arc.moveTo(x, y);
            else arc.lineTo(x, y);
        }
        arc.strokePath();

        this.scene.tweens.add({
            targets: [ribbon, edge, arc],
            alpha: 0,
            scaleY: 1.28,
            duration: 220,
            ease: 'Sine.easeOut',
            onComplete: () => {
                ribbon.destroy();
                edge.destroy();
                arc.destroy();
            }
        });
    }

    spawnDashSpark(x, y, returnTrip) {
        const spawnChance = returnTrip ? 0.8 : 0.72;
        if (Math.random() > spawnChance) return;

        const color = returnTrip ? 0xdcf8ff : 0x86d7ff;
        const spark = this.scene.add.circle(
            x + Phaser.Math.Between(-8, 8),
            y + Phaser.Math.Between(-8, 8),
            Phaser.Math.FloatBetween(1.8, 3.8),
            color,
            0.92
        ).setDepth(156);

        this.scene.tweens.add({
            targets: spark,
            alpha: 0,
            scale: 0.3,
            duration: Phaser.Math.Between(70, 150),
            onComplete: () => spark.destroy()
        });

        if (Math.random() > 0.7) {
            const fork = this.scene.add.graphics().setDepth(155);
            fork.lineStyle(2, 0xbef0ff, 0.85);
            fork.beginPath();
            fork.moveTo(x, y);
            fork.lineTo(x + Phaser.Math.Between(-9, 9), y + Phaser.Math.Between(-9, 9));
            fork.lineTo(x + Phaser.Math.Between(-18, 18), y + Phaser.Math.Between(-18, 18));
            fork.strokePath();
            this.scene.tweens.add({
                targets: fork,
                alpha: 0,
                duration: 90,
                onComplete: () => fork.destroy()
            });
        }
    }

    spawnMicroSpark(x, y) {
        const spark = this.scene.add.circle(
            x + Phaser.Math.Between(-5, 5),
            y + Phaser.Math.Between(-5, 5),
            Phaser.Math.FloatBetween(1.2, 2.4),
            0xd9f6ff,
            0.85
        ).setDepth(154);

        this.scene.tweens.add({
            targets: spark,
            alpha: 0,
            scale: 0.4,
            duration: Phaser.Math.Between(70, 120),
            onComplete: () => spark.destroy()
        });
    }

    createSnapbackPulse(x, y) {
        const pulse = this.scene.add.circle(x, y, 20, 0x8ddcff, 0.22).setDepth(150);
        const ring = this.scene.add.circle(x, y, 20, 0x9ae7ff, 0).setStrokeStyle(2, 0xe7fbff, 0.9).setDepth(151);

        this.scene.tweens.add({
            targets: [pulse, ring],
            scale: 2,
            alpha: 0,
            duration: 200,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                pulse.destroy();
                ring.destroy();
            }
        });

        this.createSparkleNova(x, y, 0xedfcff);
    }

    createSparkleNova(x, y, color) {
        for (let i = 0; i < 14; i++) {
            const sparkle = this.scene.add.star(
                x + Phaser.Math.Between(-8, 8),
                y + Phaser.Math.Between(-8, 8),
                4,
                Phaser.Math.FloatBetween(1.4, 2.4),
                Phaser.Math.FloatBetween(3.4, 5.4),
                color,
                0.95
            ).setDepth(158);

            this.scene.tweens.add({
                targets: sparkle,
                x: sparkle.x + Phaser.Math.Between(-42, 42),
                y: sparkle.y + Phaser.Math.Between(-42, 42),
                angle: Phaser.Math.Between(80, 280),
                alpha: 0,
                duration: Phaser.Math.Between(170, 280),
                ease: 'Cubic.easeOut',
                onComplete: () => sparkle.destroy()
            });
        }
    }

    createThunderBurst(x, y, angle) {
        for (let i = 0; i < 3; i++) {
            const offsetAngle = angle + Phaser.Math.FloatBetween(-0.9, 0.9);
            const bolt = this.scene.add.graphics().setDepth(157);
            bolt.lineStyle(3 - i * 0.5, 0xd4f4ff, 0.9 - i * 0.2);
            bolt.beginPath();
            bolt.moveTo(x + Phaser.Math.Between(-8, 8), y + Phaser.Math.Between(-8, 8));

            let cx = x;
            let cy = y;
            for (let j = 0; j < 4; j++) {
                cx += Math.cos(offsetAngle) * Phaser.Math.Between(12, 24) + Phaser.Math.Between(-10, 10);
                cy += Math.sin(offsetAngle) * Phaser.Math.Between(12, 24) + Phaser.Math.Between(-10, 10);
                bolt.lineTo(cx, cy);
            }

            bolt.strokePath();
            this.scene.tweens.add({
                targets: bolt,
                alpha: 0,
                duration: 120,
                onComplete: () => bolt.destroy()
            });
        }
    }

    startUltimateCharge(targetX, targetY) {
        if (this.ultimateState || !this.canUseUltimate()) return false;

        const boss = this.scene.boss;
        if (!boss?.scene) return false;

        const clamped = this.getClampedUltimateTarget(targetX ?? boss.x, targetY ?? boss.y);
        const angle = Math.atan2(clamped.y - this.player.y, clamped.x - this.player.x);

        const orb = this.scene.add.circle(this.player.x, this.player.y, 16, 0x63cfff, 0.45).setDepth(186);
        const ring = this.scene.add.circle(this.player.x, this.player.y, 24, 0x000000, 0)
            .setStrokeStyle(3, 0xc8f4ff, 0.82)
            .setDepth(187);

        this.ultimateState = {
            phase: 'charge',
            targetX: clamped.x,
            targetY: clamped.y,
            angle,
            boss,
            orb,
            ring,
            nodes: [],
            timers: []
        };

        return true;
    }

    updateUltimate(time, delta, targetX, targetY) {
        const state = this.ultimateState;
        if (!state || state.phase !== 'charge') return;

        const clamped = this.getClampedUltimateTarget(targetX ?? state.targetX, targetY ?? state.targetY);
        state.targetX = clamped.x;
        state.targetY = clamped.y;
        state.angle = Math.atan2(state.targetY - this.player.y, state.targetX - this.player.x);

        const pulse = 1 + Math.sin(time * 0.018) * 0.2;
        state.orb.setRadius(14 * pulse);
        state.orb.setAlpha(0.35 + (Math.sin(time * 0.022) + 1) * 0.18);
        state.ring.setRadius(22 + Math.sin(time * 0.016) * 4);

        if (Math.random() > 0.68) {
            this.spawnDashSpark(this.player.x, this.player.y, false);
        }
    }

    releaseUltimate(targetX, targetY) {
        const state = this.ultimateState;
        if (!state || state.phase !== 'charge') return false;

        if (!this.consumeUltimate()) {
            this.destroyUltimateState();
            return false;
        }

        const boss = this.scene.boss;
        if (!boss?.scene) {
            this.destroyUltimateState();
            return false;
        }

        const clamped = this.getClampedUltimateTarget(targetX ?? state.targetX, targetY ?? state.targetY);
        state.targetX = clamped.x;
        state.targetY = clamped.y;
        state.angle = Math.atan2(state.targetY - this.player.y, state.targetX - this.player.x);
        state.phase = 'blitz';

        this.scene.tweens.add({
            targets: [state.orb, state.ring],
            alpha: 0,
            duration: 120,
            onComplete: () => {
                state.orb?.destroy();
                state.ring?.destroy();
            }
        });

        this.executeStormbreakerBlitz(state, boss);
        return true;
    }

    executeStormbreakerBlitz(state, boss) {
        const cfg = this.stormbreakerConfig;
        this.player.untargetable = true;
        this.player.alpha = 0.2;

        for (let i = 0; i < cfg.blitzHits; i++) {
            const t = this.scene.time.delayedCall(i * cfg.blitzInterval, () => {
                if (!this.ultimateState || !boss?.scene) return;

                const arc = (Math.PI * 2 * i) / cfg.blitzHits;
                const px = boss.x + Math.cos(arc) * 68;
                const py = boss.y + Math.sin(arc) * 68;
                this.player.x = px;
                this.player.y = py;

                const slash = this.scene.add.rectangle(boss.x, boss.y, 120, 6, 0xd6f8ff, 0.9)
                    .setRotation(arc)
                    .setDepth(190);
                this.scene.tweens.add({
                    targets: slash,
                    alpha: 0,
                    scaleX: 1.25,
                    duration: 100,
                    onComplete: () => slash.destroy()
                });

                const node = this.scene.add.circle(px, py, 10, 0x80d9ff, 0.62).setDepth(188);
                state.nodes.push(node);
                this.scene.tweens.add({
                    targets: node,
                    alpha: 0.38,
                    radius: 14,
                    duration: 180,
                    yoyo: true,
                    repeat: -1
                });

                const dmg = cfg.blitzDamage * (this.player.damageMultiplier || 1.0);
                boss.takeDamage(dmg);
                this.gainUltimateGaugeFromDamage(dmg, { charged: true });
                boss.setTint(0x98e2ff);
                this.scene.time.delayedCall(60, () => boss?.clearTint?.());
                this.createThunderBurst(px, py, arc);
            });
            state.timers.push(t);
        }

        const finisher = this.scene.time.delayedCall(cfg.blitzHits * cfg.blitzInterval + 90, () => {
            if (!this.ultimateState || !boss?.scene) return;
            this.executeStormbreakerEMP(state, boss);
        });
        state.timers.push(finisher);
    }

    executeStormbreakerEMP(state, boss) {
        const cfg = this.stormbreakerConfig;
        const centerX = boss.x;
        const centerY = boss.y;

        for (const node of state.nodes) {
            if (!node?.scene) continue;
            const beam = this.scene.add.graphics().setDepth(191);
            beam.lineStyle(2.8, 0xd8f7ff, 0.9);
            beam.beginPath();
            beam.moveTo(node.x, node.y);
            beam.lineTo(centerX, centerY);
            beam.strokePath();
            this.scene.tweens.add({
                targets: beam,
                alpha: 0,
                duration: 110,
                onComplete: () => beam.destroy()
            });
        }

        const cage = this.scene.add.circle(centerX, centerY, cfg.nodeRadius * 0.45, 0x5ebfff, 0.25).setDepth(189);
        const ring = this.scene.add.circle(centerX, centerY, 32, 0x000000, 0)
            .setStrokeStyle(4, 0xe6fbff, 0.95)
            .setDepth(192);

        this.scene.tweens.add({
            targets: cage,
            radius: cfg.nodeRadius,
            alpha: 0,
            duration: 260,
            ease: 'Cubic.easeOut',
            onComplete: () => cage.destroy()
        });
        this.scene.tweens.add({
            targets: ring,
            radius: cfg.nodeRadius * 1.25,
            alpha: 0,
            duration: 260,
            ease: 'Cubic.easeOut',
            onComplete: () => ring.destroy()
        });

        this.scene.cameras.main.flash(160, 180, 245, 255);
        this.scene.cameras.main.shake(230, 0.009);

        const empDamage = cfg.empDamage * (this.player.damageMultiplier || 1.0);
        boss.takeDamage(empDamage);
        this.gainUltimateGaugeFromDamage(empDamage, { charged: true });
        boss.setTint(0xe8fbff);

        const knockAngle = Math.atan2(boss.y - this.player.y, boss.x - this.player.x);
        this.scene.tweens.add({
            targets: boss,
            x: boss.x + Math.cos(knockAngle) * 140,
            y: boss.y + Math.sin(knockAngle) * 140,
            duration: 180,
            ease: 'Power2'
        });

        this.player.alpha = 1;
        this.player.untargetable = false;
        this.player.multishot = 1;
        this.player.multishotCount = Math.max(this.player.multishotCount || 0, cfg.afterBuffShots);

        this.scene.time.delayedCall(cfg.afterBuffDuration, () => {
            if (!this.player?.scene) return;
            this.player.multishotCount = 0;
            this.player.multishot = 0;
        });

        this.scene.time.delayedCall(120, () => boss?.clearTint?.());
        this.destroyUltimateState();
    }

    destroyUltimateState() {
        const state = this.ultimateState;
        if (!state) return;

        state.orb?.destroy();
        state.ring?.destroy();
        for (const timer of state.timers || []) timer?.remove?.();
        for (const node of state.nodes || []) node?.destroy?.();

        this.player.alpha = 1;
        this.player.untargetable = false;
        this.ultimateState = null;
    }

}
