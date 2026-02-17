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

        const bolt = this.scene.add.circle(startX, startY, data.size, data.color, 0.9).setDepth(152);
        const corona = this.scene.add.circle(startX, startY, data.size * 1.9, 0xbbe6ff, 0.35).setDepth(151);

        bolt.vx = Math.cos(angle) * data.speed;
        bolt.vy = Math.sin(angle) * data.speed;
        bolt.damage = data.damage;
        bolt.range = data.range;
        bolt.startX = startX;
        bolt.startY = startY;
        bolt.piercing = false;

        bolt.update = () => {
            if (!bolt.scene) return;
            bolt.alpha = Phaser.Math.FloatBetween(0.65, 1);
            bolt.x += Phaser.Math.Between(-1, 1);
            bolt.y += Phaser.Math.Between(-1, 1);
            corona.x = bolt.x;
            corona.y = bolt.y;
            corona.alpha = Phaser.Math.FloatBetween(0.18, 0.35);
        };

        bolt.on('destroy', () => {
            if (corona?.scene) corona.destroy();
        });

        this.scene.projectiles.push(bolt);
        this.addTrail(bolt, 0x6bc8ff, data.size + 1);
    }

    executeChargedAttack(angle) {
        const charged = this.data.charged;
        const startX = this.player.x;
        const startY = this.player.y;

        const targetPoint = this.getClampedChargedTarget(this.scene.worldMouseX, this.scene.worldMouseY);
        const dashLine = new Phaser.Geom.Line(startX, startY, targetPoint.x, targetPoint.y);

        this.createDashLineFX(dashLine, angle);

        this.player.isCharging = true;
        this.player.body.setVelocity(0, 0);

        this.scene.tweens.add({
            targets: this.player,
            x: targetPoint.x,
            y: targetPoint.y,
            duration: charged.dashDuration,
            ease: 'Cubic.easeIn',
            onUpdate: () => this.spawnDashSpark(this.player.x, this.player.y),
            onComplete: () => {
                this.hitBossOnDashPath(dashLine, charged, angle);

                this.scene.time.delayedCall(45, () => {
                    this.scene.tweens.add({
                        targets: this.player,
                        x: startX,
                        y: startY,
                        duration: charged.returnDuration,
                        ease: 'Quart.easeOut',
                        onUpdate: () => this.spawnDashSpark(this.player.x, this.player.y, true),
                        onComplete: () => {
                            this.player.isCharging = false;
                            this.player.body.setVelocity(0, 0);
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
        const distToImpact = Phaser.Math.Distance.Between(targetX(dashLine), targetY(dashLine), boss.x, boss.y);

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
            x: boss.x + Math.cos(angle) * 80,
            y: boss.y + Math.sin(angle) * 80,
            duration: 120,
            yoyo: true,
            ease: 'Sine.easeOut'
        });

        const mark = this.scene.add.circle(boss.x, boss.y, charged.hitRadius, 0x6bc8ff, 0.2).setDepth(155);
        this.scene.tweens.add({
            targets: mark,
            alpha: 0,
            scale: 1.8,
            duration: 240,
            onComplete: () => mark.destroy()
        });
    }

    createDashLineFX(dashLine, angle) {
        const length = Phaser.Geom.Line.Length(dashLine);
        const cx = (dashLine.x1 + dashLine.x2) * 0.5;
        const cy = (dashLine.y1 + dashLine.y2) * 0.5;

        const ribbon = this.scene.add.rectangle(cx, cy, length, 26, 0x5ebeff, 0.28)
            .setRotation(angle)
            .setDepth(143);

        const edge = this.scene.add.rectangle(cx, cy, length, 42, 0x6dd7ff, 0)
            .setRotation(angle)
            .setStrokeStyle(3, 0xdff6ff, 0.8)
            .setDepth(142);

        this.scene.tweens.add({
            targets: [ribbon, edge],
            alpha: 0,
            scaleY: 1.3,
            duration: 260,
            ease: 'Sine.easeOut',
            onComplete: () => {
                ribbon.destroy();
                edge.destroy();
            }
        });
    }

    spawnDashSpark(x, y, returnTrip = false) {
        if (Math.random() < 0.4) return;

        const color = returnTrip ? 0xdaf6ff : 0x7ccfff;
        const spark = this.scene.add.circle(
            x + Phaser.Math.Between(-6, 6),
            y + Phaser.Math.Between(-6, 6),
            Phaser.Math.FloatBetween(1.5, 3.2),
            color,
            0.8
        ).setDepth(156);

        this.scene.tweens.add({
            targets: spark,
            alpha: 0,
            scale: 0.35,
            duration: Phaser.Math.Between(90, 180),
            onComplete: () => spark.destroy()
        });
    }
}

function targetX(line) {
    return line.x2;
}

function targetY(line) {
    return line.y2;
}
