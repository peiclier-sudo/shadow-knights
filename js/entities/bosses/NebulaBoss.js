// NebulaBoss.js - Fifth boss: NEBULA (The Void Architect)
//
// Unique mechanic: GRAVITY LATTICE
//   Nebula plants delayed stars around the player. Each star briefly charges,
//   then erupts into a fast projectile toward the player's last known position.
//
// Phase 1 (HP > 50%): 4 stars, 2 900 ms cooldown
// Phase 2 (HP <= 50%): 6 stars + central burst, 2 200 ms cooldown
import { Boss } from '../Boss.js';

export class NebulaBoss extends Boss {
    constructor(scene) {
        super(scene, 5);
        this.phaseTransitioned = false;
    }

    attack(player) {
        if (this.isAttacking || this.frozen) return;
        this.isAttacking = true;

        const phase2 = this.health <= this.maxHealth * 0.5;

        if (phase2 && !this.phaseTransitioned) {
            this.phaseTransitioned = true;
            this.triggerPhaseTransition();
        }

        const count = phase2 ? 6 : 4;
        const ringRadius = phase2 ? 150 : 125;
        const stars = [];

        // Place traps around the player position at cast time.
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const sx = player.x + Math.cos(angle) * ringRadius;
            const sy = player.y + Math.sin(angle) * ringRadius;

            const star = this.scene.add.star(sx, sy, 5, 4, 10, 0x7b61ff, 0.75);
            star.setStrokeStyle(2, 0xb5a6ff, 0.9);
            star.setDepth(150);

            const aura = this.scene.add.circle(sx, sy, 18, 0x7b61ff, 0.2);
            aura.setDepth(149);

            this.scene.tweens.add({
                targets: aura,
                scale: 1.8,
                alpha: 0.04,
                duration: 650,
                yoyo: true,
                repeat: 0
            });

            stars.push({ star, aura, sx, sy });
        }

        // Boss casting pulse.
        const castPulse = this.scene.add.circle(this.x, this.y, 40, 0x7b61ff, 0.35);
        this.scene.tweens.add({
            targets: castPulse,
            scale: 2,
            alpha: 0,
            duration: 650,
            onComplete: () => castPulse.destroy()
        });

        this.scene.time.delayedCall(700, () => {
            if (this.frozen || !this.scene?.bossProjectiles) {
                stars.forEach(({ star, aura }) => {
                    star.destroy();
                    aura.destroy();
                });
                this.isAttacking = false;
                return;
            }

            stars.forEach(({ star, aura, sx, sy }) => {
                // Snap target once when the star erupts.
                const angleToPlayer = Math.atan2(player.y - sy, player.x - sx);
                this.spawnProjectile(sx, sy, angleToPlayer, phase2 ? 380 : 330, 0x9f8dff);
                star.destroy();
                aura.destroy();
            });

            // Extra phase 2 center burst to pressure close dodges.
            if (phase2) {
                const centerAngle = Math.atan2(player.y - this.y, player.x - this.x);
                [-0.22, 0, 0.22].forEach((off) => {
                    this.spawnProjectile(this.x, this.y, centerAngle + off, 360, 0xb5a6ff);
                });
            }

            this.isAttacking = false;
        });
    }

    spawnProjectile(fromX, fromY, angle, speed, color) {
        const proj = this.scene.add.circle(fromX, fromY, 8, color, 0.95);
        proj.setDepth(151);
        proj.vx = Math.cos(angle) * speed;
        proj.vy = Math.sin(angle) * speed;

        const glow = this.scene.add.circle(fromX, fromY, 14, color, 0.25);
        glow.setDepth(150);
        proj.glow = glow;

        this.scene.bossProjectiles.push(proj);
    }

    triggerPhaseTransition() {
        this._phaseCommonEffects();
        const camW = this.scene.cameras.main.width;
        const camH = this.scene.cameras.main.height;

        const flash = this.scene.add.rectangle(camW / 2, camH / 2, camW, camH, 0x7b61ff, 0.24)
            .setScrollFactor(0)
            .setDepth(500);

        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 700,
            onComplete: () => flash.destroy()
        });

        const label = this.scene.add.text(camW / 2, camH / 2, 'GRAVITY LATTICE', {
            fontSize: '38px',
            fill: '#c7bbff',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 5
        }).setOrigin(0.5).setScrollFactor(0).setDepth(501);

        this.scene.tweens.add({
            targets: label,
            y: camH / 2 - 70,
            alpha: 0,
            duration: 1700,
            ease: 'Power2',
            onComplete: () => label.destroy()
        });
    }

    update(time, player) {
        const prevNext = this.nextAttackTime;
        super.update(time, player);

        if (this.nextAttackTime !== prevNext) {
            const phase2 = this.health <= this.maxHealth * 0.5;
            this.nextAttackTime = time + (phase2 ? 2200 : 2900);
        }
    }
}
