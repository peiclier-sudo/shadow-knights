// ElectroGauntletWeapon.js - Electric gauntlet with arc punch and storm prison
import { WeaponBase } from './WeaponBase.js';
import { WEAPONS } from './weaponData.js';

export class ElectroGauntletWeapon extends WeaponBase {
    constructor(scene, player) {
        super(scene, player, WEAPONS.ELECTRO_GAUNTLET);
    }

    fire(angle) {
        const data = this.data.projectile;
        const startX = this.player.x + Math.cos(angle) * 26;
        const startY = this.player.y + Math.sin(angle) * 26;

        this.createMuzzleFlash(startX, startY, 0x74e7ff);

        const bolt = this.scene.add.container(startX, startY).setDepth(155);
        const arc = this.scene.add.graphics();
        const glow = this.scene.add.circle(0, 0, 13, 0x66ddff, 0.28);
        const tip = this.scene.add.circle(0, 0, 4, 0xe5ffff, 0.9);
        bolt.add([glow, arc, tip]);

        bolt.vx = Math.cos(angle) * data.speed;
        bolt.vy = Math.sin(angle) * data.speed;
        bolt.damage = data.damage;
        bolt.range = data.range;
        bolt.startX = startX;
        bolt.startY = startY;
        bolt.knockback = true;
        bolt.knockbackForce = 70;
        bolt.heavyKnockback = false;
        bolt.phase = Math.random() * Math.PI * 2;

        bolt.update = () => {
            bolt.phase += 0.46;
            const dir = Math.atan2(bolt.vy, bolt.vx);

            arc.clear();
            arc.lineStyle(2.5, 0x7be9ff, 0.9);

            const len = 30;
            const segments = 6;
            let px = -Math.cos(dir) * len * 0.5;
            let py = -Math.sin(dir) * len * 0.5;
            for (let i = 1; i <= segments; i++) {
                const t = i / segments;
                const nx = -Math.cos(dir) * len * (0.5 - t);
                const ny = -Math.sin(dir) * len * (0.5 - t);
                const offset = Math.sin(bolt.phase + i * 1.4) * (1.5 + i * 0.35);
                const ox = Math.cos(dir + Math.PI / 2) * offset;
                const oy = Math.sin(dir + Math.PI / 2) * offset;
                arc.lineBetween(px, py, nx + ox, ny + oy);
                px = nx + ox;
                py = ny + oy;
            }

            glow.alpha = 0.18 + Math.sin(bolt.phase) * 0.09;
            tip.alpha = 0.72 + Math.cos(bolt.phase * 1.7) * 0.2;

            if (Math.random() > 0.65) {
                const spark = this.scene.add.circle(bolt.x, bolt.y, Phaser.Math.FloatBetween(1.6, 2.8), 0x9ff7ff, 0.7).setDepth(154);
                this.scene.tweens.add({
                    targets: spark,
                    alpha: 0,
                    x: spark.x + Phaser.Math.Between(-12, 12),
                    y: spark.y + Phaser.Math.Between(-12, 12),
                    duration: 120,
                    onComplete: () => spark.destroy()
                });
            }
        };

        this.scene.projectiles.push(bolt);
        this.addTrail(bolt, 0x74e7ff, 8);
    }

    executeChargedAttack(angle) {
        const charged = this.data.charged;
        const targetPoint = this.getClampedChargedTarget(this.scene.worldMouseX, this.scene.worldMouseY);
        const x = targetPoint.x;
        const y = targetPoint.y;

        // Charge marker + high-voltage bloom
        const preRing = this.scene.add.circle(x, y, charged.radius * 0.22, 0x7be9ff, 0)
            .setStrokeStyle(2, 0xa5f6ff, 0.85)
            .setDepth(165);
        const preGlow = this.scene.add.circle(x, y, charged.radius * 0.5, 0x5bcfff, 0.12).setDepth(164);
        this.scene.tweens.add({
            targets: [preRing, preGlow],
            alpha: 0,
            scale: 2.9,
            duration: 280,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                preRing.destroy();
                preGlow.destroy();
            }
        });

        // Storm layers
        const cage = this.scene.add.graphics().setDepth(166);
        const innerArcLayer = this.scene.add.graphics().setDepth(167);
        const cloudLayer = this.scene.add.graphics().setDepth(163);

        const ringOuter = this.scene.add.circle(x, y, charged.radius, 0x74e7ff, 0)
            .setStrokeStyle(3, 0x74e7ff, 0.82)
            .setDepth(166);
        const ringInner = this.scene.add.circle(x, y, charged.radius * 0.7, 0xa0f5ff, 0)
            .setStrokeStyle(2, 0xa0f5ff, 0.68)
            .setDepth(166);

        let phase = 0;
        const redrawStorm = () => {
            phase += 0.3;

            cage.clear();
            innerArcLayer.clear();
            cloudLayer.clear();

            // Electric cloud haze
            cloudLayer.fillStyle(0x5bd8ff, 0.08);
            cloudLayer.fillEllipse(x, y, charged.radius * 2.25, charged.radius * 1.45);
            cloudLayer.fillStyle(0x9cefff, 0.06);
            cloudLayer.fillEllipse(
                x + Math.cos(phase * 0.8) * 10,
                y + Math.sin(phase * 0.75) * 8,
                charged.radius * 1.65,
                charged.radius * 1.05
            );

            // Outer cage strands
            cage.lineStyle(2, 0x8aefff, 0.84);
            for (let i = 0; i < 8; i++) {
                const a = phase + (i / 8) * Math.PI * 2;
                const bx = x + Math.cos(a) * charged.radius;
                const by = y + Math.sin(a) * charged.radius;
                const cx = x + Math.cos(a + 0.42) * charged.radius * 0.72;
                const cy = y + Math.sin(a + 0.42) * charged.radius * 0.72;
                cage.lineBetween(bx, by, cx, cy);
            }

            // Inner rotating arc lattice
            innerArcLayer.lineStyle(1.6, 0xc9fbff, 0.8);
            for (let i = 0; i < 6; i++) {
                const a = -phase * 1.2 + (i / 6) * Math.PI * 2;
                const px = x + Math.cos(a) * charged.radius * 0.52;
                const py = y + Math.sin(a) * charged.radius * 0.52;
                const qx = x + Math.cos(a + 0.7) * charged.radius * 0.34;
                const qy = y + Math.sin(a + 0.7) * charged.radius * 0.34;
                innerArcLayer.lineBetween(px, py, qx, qy);
            }

            ringOuter.rotation += 0.028;
            ringInner.rotation -= 0.04;

            // Ambient sparkles
            if (Math.random() > 0.35) {
                const sA = Phaser.Math.FloatBetween(0, Math.PI * 2);
                const sR = Phaser.Math.FloatBetween(charged.radius * 0.22, charged.radius * 0.95);
                const sparkle = this.scene.add.circle(
                    x + Math.cos(sA) * sR,
                    y + Math.sin(sA) * sR,
                    Phaser.Math.FloatBetween(1.2, 2.8),
                    0xd6fdff,
                    0.9
                ).setDepth(168);
                this.scene.tweens.add({
                    targets: sparkle,
                    alpha: 0,
                    scale: 0.2,
                    duration: Phaser.Math.Between(120, 220),
                    onComplete: () => sparkle.destroy()
                });
            }
        };

        const stormDuration = (charged.waves || 4) * 190 + 340;
        const cageEvent = this.scene.time.addEvent({
            delay: 34,
            repeat: Math.ceil(stormDuration / 34),
            callback: redrawStorm
        });

        const waves = charged.waves || 4;
        const perWaveDamage = (charged.damage / waves) * (this.player.damageMultiplier || 1.0);

        for (let wave = 0; wave < waves; wave++) {
            this.scene.time.delayedCall(wave * 190 + 70, () => {
                if (!ringOuter.scene) return;

                // Primary thunder strike
                const strike = this.scene.add.graphics().setDepth(170);
                strike.lineStyle(4, 0xe8ffff, 0.96);
                const startY = y - charged.radius - 130;
                const endY = y + Phaser.Math.Between(-24, 24);
                const sx = x + Phaser.Math.Between(-charged.radius * 0.62, charged.radius * 0.62);
                let px = sx;
                let py = startY;
                const segments = 9;
                for (let i = 1; i <= segments; i++) {
                    const t = i / segments;
                    const nx = sx + Phaser.Math.Between(-18, 18);
                    const ny = Phaser.Math.Linear(startY, endY, t);
                    strike.lineBetween(px, py, nx, ny);
                    px = nx;
                    py = ny;
                }

                // Secondary forks
                const forkCount = 2 + Math.floor(Math.random() * 2);
                for (let f = 0; f < forkCount; f++) {
                    let fx = sx + Phaser.Math.Between(-12, 12);
                    let fy = startY + Phaser.Math.Between(24, 60);
                    const fLen = Phaser.Math.Between(3, 5);
                    for (let s = 0; s < fLen; s++) {
                        const nx = fx + Phaser.Math.Between(-14, 14);
                        const ny = fy + Phaser.Math.Between(16, 26);
                        strike.lineBetween(fx, fy, nx, ny);
                        fx = nx;
                        fy = ny;
                    }
                }

                this.scene.tweens.add({
                    targets: strike,
                    alpha: 0,
                    duration: 120,
                    onComplete: () => strike.destroy()
                });

                // Screen flash + shock ring for thunder impact
                const flash = this.scene.add.rectangle(
                    this.scene.cameras.main.width * 0.5,
                    this.scene.cameras.main.height * 0.5,
                    this.scene.cameras.main.width,
                    this.scene.cameras.main.height,
                    0xb9f4ff,
                    0.06
                ).setScrollFactor(0).setDepth(999);
                this.scene.tweens.add({
                    targets: flash,
                    alpha: 0,
                    duration: 90,
                    onComplete: () => flash.destroy()
                });

                const shock = this.scene.add.circle(x, y, charged.radius * 0.4, 0x7be9ff, 0.2).setDepth(168);
                this.scene.tweens.add({
                    targets: shock,
                    alpha: 0,
                    scale: 1.45,
                    duration: 170,
                    onComplete: () => shock.destroy()
                });

                // Sparkle burst for each thunder hit
                for (let i = 0; i < 12; i++) {
                    const a = (i / 12) * Math.PI * 2;
                    const sparkle = this.scene.add.circle(x, y, Phaser.Math.FloatBetween(1.8, 3.1), 0xd7feff, 0.95).setDepth(169);
                    this.scene.tweens.add({
                        targets: sparkle,
                        x: x + Math.cos(a) * Phaser.Math.Between(24, charged.radius * 0.72),
                        y: y + Math.sin(a) * Phaser.Math.Between(24, charged.radius * 0.72),
                        alpha: 0,
                        scale: 0.25,
                        duration: Phaser.Math.Between(150, 260),
                        onComplete: () => sparkle.destroy()
                    });
                }

                const boss = this.scene.boss;
                if (!boss) return;
                const dist = Phaser.Math.Distance.Between(x, y, boss.x, boss.y);
                if (dist <= charged.radius) {
                    boss.takeDamage(perWaveDamage);
                    boss.setTint(0x9ff8ff);
                    this.scene.time.delayedCall(90, () => boss.clearTint());
                }
            });
        }

        this.scene.time.delayedCall(stormDuration, () => {
            cageEvent.remove(false);
            this.scene.tweens.add({
                targets: [ringOuter, ringInner, cage, innerArcLayer, cloudLayer],
                alpha: 0,
                scale: 1.3,
                duration: 240,
                onComplete: () => {
                    ringOuter.destroy();
                    ringInner.destroy();
                    cage.destroy();
                    innerArcLayer.destroy();
                    cloudLayer.destroy();
                }
            });
        });
    }
    }
}
