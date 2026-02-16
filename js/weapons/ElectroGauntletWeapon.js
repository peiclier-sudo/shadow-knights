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
        bolt.knockback = false;
        bolt.knockbackForce = 0;
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

        // Smooth plasma core with evolving animated storm shell.
        const halo = this.scene.add.circle(x, y, charged.radius * 0.95, 0x53cfff, 0.08).setDepth(163);
        const coreGlow = this.scene.add.circle(x, y, charged.radius * 0.26, 0x8ff3ff, 0.3).setDepth(166);
        const core = this.scene.add.circle(x, y, charged.radius * 0.17, 0xe8ffff, 0.95).setDepth(167);
        const orbitRingA = this.scene.add.circle(x, y, charged.radius * 0.62, 0x66dfff, 0)
            .setStrokeStyle(3, 0x7ce8ff, 0.8)
            .setDepth(165);
        const orbitRingB = this.scene.add.circle(x, y, charged.radius * 0.43, 0xc7f9ff, 0)
            .setStrokeStyle(2, 0xc7f9ff, 0.75)
            .setDepth(165);
        const stormRibbon = this.scene.add.graphics().setDepth(168);
        const thunderLayer = this.scene.add.graphics().setDepth(169);

        let elapsed = 0;
        const totalDuration = 900;

        const renderRibbon = (progress) => {
            stormRibbon.clear();
            const activeRadius = Phaser.Math.Linear(charged.radius * 0.35, charged.radius * 0.98, progress);

            stormRibbon.lineStyle(2.5, 0x8cefff, 0.85);
            for (let strand = 0; strand < 4; strand++) {
                const base = elapsed * 0.015 + strand * (Math.PI * 0.5);
                let prevX = x + Math.cos(base) * activeRadius * 0.2;
                let prevY = y + Math.sin(base) * activeRadius * 0.2;

                for (let i = 1; i <= 10; i++) {
                    const t = i / 10;
                    const ang = base + t * Math.PI * (1.7 + strand * 0.14);
                    const wobble = Math.sin(elapsed * 0.025 + t * 9 + strand) * (5 + 7 * progress);
                    const radius = activeRadius * t;
                    const nx = x + Math.cos(ang) * radius + Math.cos(ang + Math.PI * 0.5) * wobble;
                    const ny = y + Math.sin(ang) * radius + Math.sin(ang + Math.PI * 0.5) * wobble;
                    stormRibbon.lineBetween(prevX, prevY, nx, ny);
                    prevX = nx;
                    prevY = ny;
                }
            }

            stormRibbon.lineStyle(1.4, 0xe8feff, 0.9);
            for (let i = 0; i < 7; i++) {
                const a = elapsed * 0.018 + i * (Math.PI * 2 / 7);
                const r0 = charged.radius * 0.16;
                const r1 = activeRadius * Phaser.Math.FloatBetween(0.72, 0.96);
                stormRibbon.lineBetween(
                    x + Math.cos(a) * r0,
                    y + Math.sin(a) * r0,
                    x + Math.cos(a + 0.24) * r1,
                    y + Math.sin(a + 0.24) * r1
                );
            }
        };

        const ambientEvent = this.scene.time.addEvent({
            delay: 16,
            callback: () => {
                if (!core.scene) return;
                elapsed += 16;
                const progress = Phaser.Math.Clamp(elapsed / totalDuration, 0, 1);

                const pulse = 1 + Math.sin(elapsed * 0.025) * 0.06;
                core.setScale(Phaser.Math.Linear(0.72, 1.32, progress) * pulse);
                coreGlow.setScale(Phaser.Math.Linear(0.82, 1.5, progress) * (1 + Math.sin(elapsed * 0.018) * 0.08));
                coreGlow.alpha = 0.2 + progress * 0.24 + Math.sin(elapsed * 0.017) * 0.05;

                halo.setScale(Phaser.Math.Linear(0.8, 1.34, progress));
                halo.alpha = 0.06 + progress * 0.1;

                orbitRingA.rotation += 0.02 + progress * 0.01;
                orbitRingB.rotation -= 0.026 + progress * 0.012;
                orbitRingA.setScale(0.88 + progress * 0.34);
                orbitRingB.setScale(0.93 + progress * 0.36);

                renderRibbon(progress);

                if (Math.random() > 0.62) {
                    const a = Phaser.Math.FloatBetween(0, Math.PI * 2);
                    const r = Phaser.Math.FloatBetween(charged.radius * 0.2, charged.radius * 0.92);
                    const sparkle = this.scene.add.circle(
                        x + Math.cos(a) * r,
                        y + Math.sin(a) * r,
                        Phaser.Math.FloatBetween(1.3, 2.7),
                        0xd8feff,
                        0.9
                    ).setDepth(170);

                    this.scene.tweens.add({
                        targets: sparkle,
                        x: sparkle.x + Math.cos(a + Math.PI * 0.5) * Phaser.Math.Between(8, 20),
                        y: sparkle.y + Math.sin(a + Math.PI * 0.5) * Phaser.Math.Between(8, 20),
                        alpha: 0,
                        duration: Phaser.Math.Between(140, 240),
                        onComplete: () => sparkle.destroy()
                    });
                }
            },
            loop: true
        });

        const waves = charged.waves || 4;
        const perWaveDamage = (charged.damage / waves) * (this.player.damageMultiplier || 1.0);

        for (let wave = 0; wave < waves; wave++) {
            this.scene.time.delayedCall(230 + wave * 165, () => {
                if (!core.scene) return;

                thunderLayer.clear();
                thunderLayer.lineStyle(3.4, 0xedffff, 0.96);
                const startA = elapsed * 0.013 + wave * 0.9;
                const sx = x + Math.cos(startA) * charged.radius * 0.9;
                const sy = y + Math.sin(startA) * charged.radius * 0.9;

                let px = sx;
                let py = sy;
                for (let i = 1; i <= 8; i++) {
                    const t = i / 8;
                    const nx = Phaser.Math.Linear(sx, x, t) + Phaser.Math.Between(-11, 11) * (1 - t);
                    const ny = Phaser.Math.Linear(sy, y, t) + Phaser.Math.Between(-11, 11) * (1 - t);
                    thunderLayer.lineBetween(px, py, nx, ny);
                    px = nx;
                    py = ny;
                }

                this.scene.tweens.add({
                    targets: thunderLayer,
                    alpha: 0.15,
                    duration: 70,
                    yoyo: true
                });

                const shock = this.scene.add.circle(x, y, charged.radius * 0.25, 0x8becff, 0.22).setDepth(169);
                this.scene.tweens.add({
                    targets: shock,
                    alpha: 0,
                    scale: 1.9,
                    duration: 180,
                    onComplete: () => shock.destroy()
                });

                this.scene.cameras.main.shake(65, 0.0015 + wave * 0.0002);

                const boss = this.scene.boss;
                if (!boss) return;
                const dist = Phaser.Math.Distance.Between(x, y, boss.x, boss.y);
                if (dist <= charged.radius) {
                    boss.takeDamage(perWaveDamage);
                    boss.setTint(0x9ff8ff);
                    this.scene.time.delayedCall(80, () => boss.clearTint());
                }
            });
        }

        this.scene.time.delayedCall(totalDuration + 220, () => {
            ambientEvent.remove(false);
            this.scene.tweens.add({
                targets: [core, coreGlow, halo, orbitRingA, orbitRingB, stormRibbon, thunderLayer],
                alpha: 0,
                scale: 1.35,
                duration: 220,
                onComplete: () => {
                    core.destroy();
                    coreGlow.destroy();
                    halo.destroy();
                    orbitRingA.destroy();
                    orbitRingB.destroy();
                    stormRibbon.destroy();
                    thunderLayer.destroy();
                }
            });
        });
    }
}
