// SwordWeapon.js - Épée avec slash raffiné et rayon chargé cinématique
import { WeaponBase } from './WeaponBase.js';
import { WEAPONS } from './weaponData.js';

export class SwordWeapon extends WeaponBase {
    constructor(scene, player) {
        super(scene, player, WEAPONS.SWORD);
    }

    // Tir normal - Crescent slash fluide
    fire(angle) {
        const data = this.data.projectile;
        const startX = this.player.x + Math.cos(angle) * 30;
        const startY = this.player.y + Math.sin(angle) * 30;

        this.createMuzzleFlash(startX, startY, this.data.color);

        const slash = this.scene.add.container(startX, startY).setDepth(150);
        const outerArc = this.scene.add.graphics();
        const innerArc = this.scene.add.graphics();
        const sparkCore = this.scene.add.circle(0, 0, data.size * 0.4, 0xffe4b8, 0.55);

        outerArc.lineStyle(2.4, 0xffc777, 0.62);
        outerArc.beginPath();
        outerArc.arc(0, 0, data.size * 2.25, -0.72, 0.72);
        outerArc.strokePath();
        outerArc.rotation = angle;

        innerArc.lineStyle(1.2, 0xfff0d1, 0.88);
        innerArc.beginPath();
        innerArc.arc(0, 0, data.size * 1.7, -0.68, 0.68);
        innerArc.strokePath();
        innerArc.rotation = angle;

        slash.add([outerArc, innerArc, sparkCore]);

        this.scene.tweens.add({
            targets: [outerArc, innerArc],
            alpha: { from: 0.95, to: 0.45 },
            scaleX: { from: 0.95, to: 1.08 },
            scaleY: { from: 0.95, to: 1.08 },
            duration: 130,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.scene.tweens.add({
            targets: sparkCore,
            alpha: { from: 0.6, to: 0.18 },
            scale: { from: 1.0, to: 1.45 },
            duration: 140,
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

        this.scene.projectiles.push(slash);
        this.addTrail(slash, data.color, data.size);
    }

    // Attaque chargée - Rayon élégant multi-couche
    executeChargedAttack(angle) {
        const charged = this.data.charged;

        const startX = this.player.x + Math.cos(angle) * 40;
        const startY = this.player.y + Math.sin(angle) * 40;
        const endX = startX + Math.cos(angle) * charged.length;
        const endY = startY + Math.sin(angle) * charged.length;

        let hasHit = false;

        const beamCore = this.scene.add.graphics().setDepth(170);
        const beamMid = this.scene.add.graphics().setDepth(169);
        const beamHalo = this.scene.add.graphics().setDepth(168);

        beamCore.lineStyle(Math.max(2, charged.width * 0.4), 0xfff4db, 0.95);
        beamCore.lineBetween(startX, startY, endX, endY);

        beamMid.lineStyle(Math.max(3, charged.width * 0.75), 0xffc36e, 0.48);
        beamMid.lineBetween(startX, startY, endX, endY);

        beamHalo.lineStyle(charged.width * 1.45, 0xffad42, 0.17);
        beamHalo.lineBetween(startX, startY, endX, endY);

        [beamCore, beamMid, beamHalo].forEach((g) => {
            g.alpha = 0;
            g.scaleY = 0.4;
        });

        const releaseRing = this.scene.add.circle(startX, startY, 14, 0xffc777, 0)
            .setStrokeStyle(2, 0xffe3ba, 0.8)
            .setDepth(171);

        this.scene.tweens.add({
            targets: [beamCore, beamMid, beamHalo],
            alpha: { from: 0, to: 1 },
            scaleY: { from: 0.4, to: 1 },
            duration: 80,
            onComplete: () => {
                if (!hasHit) {
                    this.checkLaserHit(startX, startY, endX, endY, angle, charged);
                    hasHit = true;
                }

                this.scene.tweens.add({
                    targets: [beamCore, beamMid, beamHalo],
                    alpha: 0,
                    scaleY: 1.2,
                    duration: 210,
                    ease: 'Cubic.easeOut',
                    onComplete: () => {
                        beamCore.destroy();
                        beamMid.destroy();
                        beamHalo.destroy();
                    }
                });
            }
        });

        this.scene.tweens.add({
            targets: releaseRing,
            alpha: 0,
            scale: 2.4,
            duration: 220,
            ease: 'Cubic.easeOut',
            onComplete: () => releaseRing.destroy()
        });

        for (let i = 0; i < 14; i++) {
            const t = i / 13;
            const px = Phaser.Math.Linear(startX, endX, t);
            const py = Phaser.Math.Linear(startY, endY, t);
            const spark = this.scene.add.circle(px, py, Phaser.Math.FloatBetween(1.5, 3.2), 0xffedcf, 0.86).setDepth(172);
            this.scene.tweens.add({
                targets: spark,
                x: px + Math.cos(angle + Math.PI / 2) * Phaser.Math.Between(-10, 10),
                y: py + Math.sin(angle + Math.PI / 2) * Phaser.Math.Between(-10, 10),
                alpha: 0,
                scale: 0.35,
                duration: Phaser.Math.Between(120, 220),
                onComplete: () => spark.destroy()
            });
        }
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
                    x: boss.x + Math.cos(angle) * 150,
                    y: boss.y + Math.sin(angle) * 150,
                    duration: 200,
                    ease: 'Power2'
                });
            }

            const impact = this.scene.add.circle(boss.x, boss.y, 25, 0xffd494, 0.68).setDepth(173);
            this.scene.tweens.add({
                targets: impact,
                alpha: 0,
                scale: 2,
                duration: 280,
                onComplete: () => impact.destroy()
            });
        }
    }
}
