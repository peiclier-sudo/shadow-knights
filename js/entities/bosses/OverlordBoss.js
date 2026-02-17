// OverlordBoss.js - Fourth boss with high HP and multi-layer mechanics
import { Boss } from '../Boss.js';

export class OverlordBoss extends Boss {
    constructor(scene) {
        super(scene, 4);
        this.nextMechanicTime = 0;
        this.stormZones = [];
        this.enraged = false;
    }

    attack(player) {
        if (this.isAttacking || this.frozen || this.stunned) return;

        this.isAttacking = true;
        const roll = Math.random();

        if (roll > 0.45 || this.enraged) {
            this.castArcVolley(player);
        } else {
            this.castStormMine(player);
        }
    }

    castArcVolley(player) {
        const telegraph = this.scene.add.circle(this.x, this.y, 58, 0x3bb8ff, 0.18)
            .setStrokeStyle(4, 0xa9ecff, 0.8)
            .setDepth(145);

        this.scene.tweens.add({
            targets: telegraph,
            radius: 105,
            alpha: 0,
            duration: 520,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                telegraph.destroy();

                if (this.frozen || this.stunned) {
                    this.isAttacking = false;
                    return;
                }

                const base = Math.atan2(player.y - this.y, player.x - this.x);
                const shots = this.enraged ? 11 : 8;
                const spread = this.enraged ? 1.35 : 0.95;

                for (let i = 0; i < shots; i++) {
                    const t = shots <= 1 ? 0.5 : i / (shots - 1);
                    const angle = base - spread + t * spread * 2;
                    this.spawnBossBolt(angle, 340 + (this.enraged ? 40 : 0), 10, 0x66d0ff);
                }

                // extra center rail shot
                this.spawnBossBolt(base, 470, 12, 0xd7f7ff);
                this.isAttacking = false;
            }
        });
    }

    castStormMine(player) {
        const tx = player.x;
        const ty = player.y;

        const marker = this.scene.add.circle(tx, ty, 32, 0x1a5f86, 0.2)
            .setStrokeStyle(3, 0x8fddff, 0.85)
            .setDepth(140);

        const pulseTween = this.scene.tweens.add({
            targets: marker,
            radius: 78,
            alpha: 0.55,
            duration: 720,
            yoyo: true,
            ease: 'Sine.easeInOut'
        });

        this.scene.time.delayedCall(820, () => {
            pulseTween?.remove?.();
            marker.destroy();

            if (this.frozen || this.stunned) {
                this.isAttacking = false;
                return;
            }

            const detonate = this.scene.add.circle(tx, ty, 24, 0x9ceaff, 0.45).setDepth(146);
            this.scene.tweens.add({
                targets: detonate,
                radius: 90,
                alpha: 0,
                duration: 180,
                onComplete: () => detonate.destroy()
            });

            const zone = this.scene.add.circle(tx, ty, this.enraged ? 110 : 95, 0x2b8fc4, 0.16)
                .setStrokeStyle(2, 0x8fdbff, 0.55)
                .setDepth(138);
            zone.expiresAt = this.scene.time.now + (this.enraged ? 3200 : 2500);
            zone.nextTick = 0;
            this.stormZones.push(zone);

            this.isAttacking = false;
        });
    }

    spawnBossBolt(angle, speed, size, color) {
        const bolt = this.scene.add.circle(this.x, this.y, size, color, 0.9).setDepth(150);
        bolt.vx = Math.cos(angle) * speed;
        bolt.vy = Math.sin(angle) * speed;

        const glow = this.scene.add.circle(this.x, this.y, size * 1.8, color, 0.26).setDepth(149);
        bolt.glow = glow;
        this.scene.bossProjectiles.push(bolt);
    }

    castMagnetPulse(player) {
        if (this.frozen || this.stunned || !player || player.untargetable) return;

        const ring = this.scene.add.circle(this.x, this.y, 34, 0x14394d, 0.22)
            .setStrokeStyle(4, 0xb6eeff, 0.9)
            .setDepth(147);

        this.scene.tweens.add({
            targets: ring,
            radius: 210,
            alpha: 0,
            duration: 560,
            ease: 'Cubic.easeOut',
            onComplete: () => ring.destroy()
        });

        const pullAngle = Math.atan2(this.y - player.y, this.x - player.x);
        const pullDistance = this.enraged ? 120 : 90;

        this.scene.tweens.add({
            targets: player,
            x: player.x + Math.cos(pullAngle) * pullDistance,
            y: player.y + Math.sin(pullAngle) * pullDistance,
            duration: 220,
            ease: 'Sine.easeInOut'
        });

        [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5].forEach((a) => {
            this.spawnBossBolt(a, 420, 9, 0xaee8ff);
        });
    }

    update(time, player) {
        super.update(time, player);

        if (!this.enraged && this.health <= this.maxHealth * 0.5) {
            this.enraged = true;
            const burst = this.scene.add.circle(this.x, this.y, 40, 0xc1f0ff, 0.35).setDepth(160);
            this.scene.tweens.add({
                targets: burst,
                radius: 160,
                alpha: 0,
                duration: 350,
                onComplete: () => burst.destroy()
            });
        }

        // periodic hazard ticks
        for (let i = this.stormZones.length - 1; i >= 0; i--) {
            const zone = this.stormZones[i];
            if (!zone?.scene || time >= zone.expiresAt) {
                zone?.destroy();
                this.stormZones.splice(i, 1);
                continue;
            }

            zone.alpha = 0.1 + Math.abs(Math.sin(time * 0.012)) * 0.12;
            if (time < zone.nextTick) continue;
            zone.nextTick = time + 360;

            const dist = Phaser.Math.Distance.Between(zone.x, zone.y, player.x, player.y);
            if (dist <= zone.radius && !player.isInvulnerable && !player.untargetable) {
                player.takeDamage(this.enraged ? 13 : 9);
            }
        }

        if (time > this.nextAttackTime && !this.isAttacking && !this.frozen && !this.stunned && !player?.untargetable) {
            this.attack(player);
            this.nextAttackTime = this.enraged ? time + 1650 : time + 2200;
        }

        if (time > this.nextMechanicTime && !this.frozen && !this.stunned && !player?.untargetable) {
            this.castMagnetPulse(player);
            this.nextMechanicTime = time + (this.enraged ? 4300 : 5600);
        }
    }
}
