import { WeaponBase } from './WeaponBase.js';
import { WEAPONS } from './weaponData.js';

export class ThunderGauntletWeapon extends WeaponBase {
    constructor(scene, player) {
        super(scene, player, WEAPONS.THUNDER_GAUNTLET);
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
    }
}
