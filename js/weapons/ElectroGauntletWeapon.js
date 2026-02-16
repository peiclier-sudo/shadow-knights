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

        const preRing = this.scene.add.circle(x, y, charged.radius * 0.25, 0x7be9ff, 0)
            .setStrokeStyle(2, 0xa5f6ff, 0.75)
            .setDepth(165);
        this.scene.tweens.add({
            targets: preRing,
            alpha: 0,
            scale: 3,
            duration: 260,
            ease: 'Cubic.easeOut',
            onComplete: () => preRing.destroy()
        });

        const cage = this.scene.add.graphics().setDepth(166);
        const ringOuter = this.scene.add.circle(x, y, charged.radius, 0x74e7ff, 0).setStrokeStyle(3, 0x74e7ff, 0.8).setDepth(166);
        const ringInner = this.scene.add.circle(x, y, charged.radius * 0.7, 0xa0f5ff, 0).setStrokeStyle(2, 0xa0f5ff, 0.65).setDepth(166);

        let phase = 0;
        const redrawCage = () => {
            phase += 0.28;
            cage.clear();
            cage.lineStyle(2, 0x8aefff, 0.82);

            for (let i = 0; i < 7; i++) {
                const a = phase + (i / 7) * Math.PI * 2;
                const bx = x + Math.cos(a) * charged.radius;
                const by = y + Math.sin(a) * charged.radius;
                const cx = x + Math.cos(a + 0.4) * charged.radius * 0.72;
                const cy = y + Math.sin(a + 0.4) * charged.radius * 0.72;
                cage.lineBetween(bx, by, cx, cy);
            }
            ringOuter.rotation += 0.02;
            ringInner.rotation -= 0.03;
        };

        const cageEvent = this.scene.time.addEvent({ delay: 34, repeat: 24, callback: redrawCage });

        const waves = charged.waves || 4;
        const perWaveDamage = (charged.damage / waves) * (this.player.damageMultiplier || 1.0);

        for (let wave = 0; wave < waves; wave++) {
            this.scene.time.delayedCall(wave * 180 + 70, () => {
                if (!ringOuter.scene) return;

                const strike = this.scene.add.graphics().setDepth(168);
                strike.lineStyle(4, 0xe8ffff, 0.92);
                const startY = y - charged.radius - 120;
                const endY = y + Phaser.Math.Between(-20, 20);
                const sx = x + Phaser.Math.Between(-charged.radius * 0.6, charged.radius * 0.6);
                let px = sx;
                let py = startY;
                const segments = 8;
                for (let i = 1; i <= segments; i++) {
                    const t = i / segments;
                    const nx = sx + Phaser.Math.Between(-15, 15);
                    const ny = Phaser.Math.Linear(startY, endY, t);
                    strike.lineBetween(px, py, nx, ny);
                    px = nx;
                    py = ny;
                }

                this.scene.tweens.add({
                    targets: strike,
                    alpha: 0,
                    duration: 110,
                    onComplete: () => strike.destroy()
                });

                const shock = this.scene.add.circle(x, y, charged.radius * 0.45, 0x7be9ff, 0.18).setDepth(167);
                this.scene.tweens.add({
                    targets: shock,
                    alpha: 0,
                    scale: 1.3,
                    duration: 150,
                    onComplete: () => shock.destroy()
                });

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

        this.scene.time.delayedCall(waves * 180 + 320, () => {
            cageEvent.remove(false);
            this.scene.tweens.add({
                targets: [ringOuter, ringInner, cage],
                alpha: 0,
                scale: 1.25,
                duration: 220,
                onComplete: () => {
                    ringOuter.destroy();
                    ringInner.destroy();
                    cage.destroy();
                }
            });
        });
    }
}
