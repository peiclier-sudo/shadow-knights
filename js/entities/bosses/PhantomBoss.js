// PhantomBoss.js - Fourth boss: PHANTOM (The Echo Wraith)
//
// Unique mechanic: ECHO STRIKE
//   The Phantom fires spectral bolts at the player, then 1.4 seconds later
//   a ghostly echo repeats the same attack from a phantom position slightly
//   offset from the boss. Players must dodge twice per attack cycle.
//
// Phase 1 (HP > 50%): Single echo bolt, 3 000 ms cooldown
// Phase 2 (HP <= 50%): 3-way spread + 3-way echo, 2 200 ms cooldown,
//                       screen flash and "ECHO UNLEASHED!" announcement
import { Boss } from '../Boss.js';

export class PhantomBoss extends Boss {
    constructor(scene) {
        super(scene, 4);
        this.phaseTransitioned = false;
    }

    attack(player) {
        if (this.isAttacking || this.frozen) return;
        this.isAttacking = true;

        const isPhase2 = this.health <= this.maxHealth * 0.5;

        // Trigger phase transition visual exactly once
        if (isPhase2 && !this.phaseTransitioned) {
            this.phaseTransitioned = true;
            this.triggerPhaseTransition();
        }

        // Ghost echo fires from a fixed offset (left and slightly below boss)
        const echoX = this.x - 130;
        const echoY = this.y + 50;

        // Show ghost silhouette at the echo origin so the player can
        // anticipate where the second wave will come from
        const ghostBody = this.scene.add.ellipse(echoX, echoY, 48, 68, 0x00ffcc, 0.12);
        ghostBody.setStrokeStyle(2, 0x33ffee, 0.28);
        const ghostEyeL = this.scene.add.circle(echoX - 8, echoY - 10, 4, 0x00ffcc, 0.28);
        const ghostEyeR = this.scene.add.circle(echoX + 8, echoY - 10, 4, 0x00ffcc, 0.28);

        this.scene.tweens.add({
            targets: [ghostBody, ghostEyeL, ghostEyeR],
            alpha: 0.04,
            duration: 500,
            yoyo: true,
            repeat: 2,
            onComplete: () => {
                ghostBody.destroy();
                ghostEyeL.destroy();
                ghostEyeR.destroy();
            }
        });

        // Boss charge-up glow
        const chargeGlow = this.scene.add.circle(this.x, this.y, 48, 0x00ffcc, 0.38);
        this.scene.tweens.add({
            targets: chargeGlow,
            scale: 1.7,
            alpha: 0,
            duration: 600,
            onComplete: () => chargeGlow.destroy()
        });

        // 600 ms telegraph, then fire
        this.scene.time.delayedCall(600, () => {
            if (this.frozen) {
                this.isAttacking = false;
                return;
            }

            const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
            const offsets = isPhase2 ? [-0.28, 0, 0.28] : [0];

            // Main bolt(s) from boss position
            offsets.forEach(off => {
                this.spawnProjectile(this.x, this.y, angleToPlayer + off, 0x00ffcc, 340, false);
            });

            this.isAttacking = false;

            // Echo fires 1 400 ms after the main bolt
            this.scene.time.delayedCall(1400, () => {
                // Guard: scene may have changed if player/boss died
                if (!this.scene || !this.scene.bossProjectiles) return;

                // Echo warning pulse at ghost origin
                const echoWarning = this.scene.add.circle(echoX, echoY, 28, 0x66ffee, 0.5);
                this.scene.tweens.add({
                    targets: echoWarning,
                    scale: 2.2,
                    alpha: 0,
                    duration: 350,
                    onComplete: () => echoWarning.destroy()
                });

                this.scene.time.delayedCall(350, () => {
                    if (!this.scene || !this.scene.bossProjectiles) return;

                    const echoAngle = Math.atan2(player.y - echoY, player.x - echoX);
                    offsets.forEach(off => {
                        this.spawnProjectile(echoX, echoY, echoAngle + off, 0x66ffee, 270, true);
                    });
                });
            });
        });
    }

    // Spawns a single boss projectile (main or echo)
    spawnProjectile(fromX, fromY, angle, color, speed, isEcho) {
        const radius = isEcho ? 6 : 9;
        const proj = this.scene.add.circle(fromX, fromY, radius, color);
        proj.setDepth(150);
        proj.vx = Math.cos(angle) * speed;
        proj.vy = Math.sin(angle) * speed;

        const glowRadius = isEcho ? 11 : 15;
        const glow = this.scene.add.circle(fromX, fromY, glowRadius, color, isEcho ? 0.18 : 0.28);
        glow.setDepth(149);
        proj.glow = glow;

        this.scene.bossProjectiles.push(proj);
    }

    // Full-screen flash + banner when entering phase 2
    triggerPhaseTransition() {
        const camW = this.scene.cameras.main.width;
        const camH = this.scene.cameras.main.height;

        const flash = this.scene.add.rectangle(camW / 2, camH / 2, camW, camH, 0x00ffcc, 0.28)
            .setScrollFactor(0)
            .setDepth(500);

        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 650,
            onComplete: () => flash.destroy()
        });

        const label = this.scene.add.text(camW / 2, camH / 2, 'ECHO UNLEASHED!', {
            fontSize: '40px',
            fill: '#00ffcc',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 5
        }).setOrigin(0.5).setScrollFactor(0).setDepth(501);

        this.scene.tweens.add({
            targets: label,
            y: camH / 2 - 75,
            alpha: 0,
            duration: 1800,
            ease: 'Power2',
            onComplete: () => label.destroy()
        });
    }

    update(time, player) {
        const prevNextAttack = this.nextAttackTime;
        super.update(time, player);

        // Parent always sets nextAttackTime = time + 2 000.
        // Override with phase-appropriate cooldown after each attack trigger.
        if (this.nextAttackTime !== prevNextAttack) {
            const isPhase2 = this.health <= this.maxHealth * 0.5;
            this.nextAttackTime = time + (isPhase2 ? 2200 : 3000);
        }
    }
}
