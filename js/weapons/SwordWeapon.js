// SwordWeapon.js - Procedural sword VFX with cinematic slash + laser
import { WeaponBase } from './WeaponBase.js';
import { WEAPONS } from './weaponData.js';

export class SwordWeapon extends WeaponBase {
    constructor(scene, player) {
        super(scene, player, WEAPONS.SWORD);
    }

    // Tir normal - Slash procédural enrichi
    fire(angle) {
        const data = this.data.projectile;
        const startX = this.player.x + Math.cos(angle) * 30;
        const startY = this.player.y + Math.sin(angle) * 30;

        this.createMuzzleFlash(startX, startY, this.data.color);
        this.createSlashCastFX(startX, startY, angle, data);

        const slash = this.scene.add.container(startX, startY).setDepth(150);

        const arcCore = this.scene.add.graphics();
        arcCore.lineStyle(4, 0xffcc66, 0.95);
        arcCore.beginPath();
        arcCore.arc(0, 0, data.size * 2.35, -0.9, 0.9);
        arcCore.strokePath();

        const arcGlow = this.scene.add.graphics();
        arcGlow.lineStyle(9, 0xffaa00, 0.3);
        arcGlow.beginPath();
        arcGlow.arc(0, 0, data.size * 2.1, -0.84, 0.84);
        arcGlow.strokePath();

        const arcEdge = this.scene.add.graphics();
        arcEdge.lineStyle(2, 0xffffff, 0.72);
        arcEdge.beginPath();
        arcEdge.arc(0, 0, data.size * 2.6, -0.76, 0.76);
        arcEdge.strokePath();

        slash.rotation = angle;
        slash.add([arcGlow, arcCore, arcEdge]);

        this.scene.tweens.add({
            targets: [arcCore, arcGlow, arcEdge],
            alpha: { from: 1, to: 0.65 },
            duration: 90,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        slash.vx = Math.cos(angle) * data.speed;
        slash.vy = Math.sin(angle) * data.speed;
        slash.damage = data.damage;
        slash.range = data.range;
        slash.startX = startX;
        slash.startY = startY;
        slash.piercing = data.piercing;
        slash.hasHit = false;

        slash.update = () => {
            if (!slash.scene) return;
            slash.rotation = Math.atan2(slash.vy, slash.vx);
            if (Math.random() > 0.62) {
                this.spawnSwordSpark(slash.x, slash.y, slash.rotation);
            }
        };

        slash.on('destroy', () => {
            arcGlow.destroy();
            arcCore.destroy();
            arcEdge.destroy();
        });

        this.scene.projectiles.push(slash);
        this.addTrail(slash, data.color, data.size);
    }

    // Attaque chargée - Laser perforant plus cinématique
    executeChargedAttack(angle) {
        const charged = this.data.charged;

        const startX = this.player.x + Math.cos(angle) * 40;
        const startY = this.player.y + Math.sin(angle) * 40;
        const endX = startX + Math.cos(angle) * charged.length;
        const endY = startY + Math.sin(angle) * charged.length;

        let hasHit = false;

        const beamCore = this.scene.add.graphics().setDepth(161);
        beamCore.lineStyle(charged.width, 0xffe8b3, 1);
        beamCore.lineBetween(startX, startY, endX, endY);

        const beamAura = this.scene.add.graphics().setDepth(160);
        beamAura.lineStyle(charged.width * 2.7, 0xffaa00, 0.3);
        beamAura.lineBetween(startX, startY, endX, endY);

        const beamCrackle = this.scene.add.graphics().setDepth(162);
        this.drawCrackleLine(beamCrackle, startX, startY, endX, endY, 0xfff0cf, 0.8);

        beamCore.alpha = 0;
        beamAura.alpha = 0;
        beamCrackle.alpha = 0;

        this.scene.tweens.add({
            targets: [beamCore, beamAura, beamCrackle],
            alpha: 1,
            duration: 45,
            onComplete: () => {
                if (!hasHit) {
                    this.checkLaserHit(startX, startY, endX, endY, angle, charged);
                    hasHit = true;
                }

                this.scene.tweens.add({
                    targets: [beamCore, beamAura, beamCrackle],
                    alpha: 0,
                    duration: 150,
                    delay: 70,
                    onComplete: () => {
                        beamCore.destroy();
                        beamAura.destroy();
                        beamCrackle.destroy();
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

            if (charged.knockback) {
                this.scene.tweens.add({
                    targets: boss,
                    x: boss.x + Math.cos(angle) * 170,
                    y: boss.y + Math.sin(angle) * 170,
                    duration: 190,
                    ease: 'Power2'
                });
            }

            const impact = this.scene.add.circle(boss.x, boss.y, 26, 0xffc06b, 0.75).setDepth(170);
            const ring = this.scene.add.circle(boss.x, boss.y, 18, 0xffefc8, 0)
                .setStrokeStyle(3, 0xffefc8, 0.95)
                .setDepth(171);

            this.scene.tweens.add({
                targets: [impact, ring],
                alpha: 0,
                scale: 2,
                duration: 280,
                onComplete: () => {
                    impact.destroy();
                    ring.destroy();
                }
            });
        }
    }

    createSlashCastFX(x, y, angle, data) {
        const castArc = this.scene.add.graphics().setDepth(158);
        castArc.lineStyle(3, 0xffce80, 0.85);
        castArc.beginPath();
        castArc.arc(x, y, data.size * 2.3, angle - 0.95, angle + 0.95);
        castArc.strokePath();

        this.scene.tweens.add({
            targets: castArc,
            alpha: 0,
            scale: 1.25,
            duration: 130,
            ease: 'Cubic.easeOut',
            onComplete: () => castArc.destroy()
        });

        for (let i = 0; i < 6; i++) {
            const spark = this.scene.add.circle(
                x + Phaser.Math.Between(-10, 10),
                y + Phaser.Math.Between(-10, 10),
                Phaser.Math.FloatBetween(1.8, 3.5),
                0xffe2ac,
                0.85
            ).setDepth(159);

            this.scene.tweens.add({
                targets: spark,
                x: spark.x + Math.cos(angle + Phaser.Math.FloatBetween(-0.5, 0.5)) * Phaser.Math.Between(18, 32),
                y: spark.y + Math.sin(angle + Phaser.Math.FloatBetween(-0.5, 0.5)) * Phaser.Math.Between(18, 32),
                alpha: 0,
                duration: Phaser.Math.Between(100, 170),
                onComplete: () => spark.destroy()
            });
        }
    }

    spawnSwordSpark(x, y, angle) {
        const spark = this.scene.add.circle(
            x + Phaser.Math.Between(-5, 5),
            y + Phaser.Math.Between(-5, 5),
            Phaser.Math.FloatBetween(1.6, 3),
            0xffedc4,
            0.88
        ).setDepth(156);

        this.scene.tweens.add({
            targets: spark,
            x: spark.x + Math.cos(angle + Phaser.Math.FloatBetween(-0.35, 0.35)) * Phaser.Math.Between(12, 22),
            y: spark.y + Math.sin(angle + Phaser.Math.FloatBetween(-0.35, 0.35)) * Phaser.Math.Between(12, 22),
            alpha: 0,
            scale: 0.3,
            duration: Phaser.Math.Between(80, 140),
            onComplete: () => spark.destroy()
        });
    }

    drawCrackleLine(graphics, x1, y1, x2, y2, color, alpha) {
        graphics.clear();
        graphics.lineStyle(2.5, color, alpha);
        graphics.beginPath();

        const segments = 16;
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = Phaser.Math.Linear(x1, x2, t);
            const y = Phaser.Math.Linear(y1, y2, t) + Phaser.Math.Between(-6, 6);
            if (i === 0) graphics.moveTo(x, y);
            else graphics.lineTo(x, y);
        }

        graphics.strokePath();
    }

    spawnBeamParticles(startX, startY, angle, charged) {
        for (let i = 0; i < 16; i++) {
            const dist = i * (charged.length / 16);
            const px = startX + Math.cos(angle) * dist;
            const py = startY + Math.sin(angle) * dist;

            const spark = this.scene.add.circle(px, py, Phaser.Math.FloatBetween(2, 3.7), 0xffd28d, 0.8).setDepth(163);
            this.scene.tweens.add({
                targets: spark,
                x: px + Math.cos(angle + Math.PI / 2) * Phaser.Math.Between(-14, 14),
                y: py + Math.sin(angle + Math.PI / 2) * Phaser.Math.Between(-14, 14),
                alpha: 0,
                scale: 0.4,
                duration: Phaser.Math.Between(110, 190),
                onComplete: () => spark.destroy()
            });
        }
    }
}
