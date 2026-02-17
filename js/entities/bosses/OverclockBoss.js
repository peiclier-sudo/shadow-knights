// OverclockBoss.js - Sixth boss: OVERCLOCK (The Chrono Tyrant)
//
// Unique mechanic: TIME SPLIT DASH
//   Overclock marks the player's recent position, then performs a rapid dash
//   sequence through that anchor and leaves afterimages that detonate shortly after.
//
// Phase 1 (HP > 50%): 2 dashes + 2 afterimages, 2 900 ms cooldown
// Phase 2 (HP <= 50%): 3 dashes + 3 afterimages, 2 100 ms cooldown
import { Boss } from '../Boss.js';

export class OverclockBoss extends Boss {
    constructor(scene) {
        super(scene, 6);
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

        const dashCount = phase2 ? 3 : 2;
        const anchorX = player.x;
        const anchorY = player.y;

        const marker = this.scene.add.circle(anchorX, anchorY, 28, 0xffd54a, 0.25);
        marker.setStrokeStyle(3, 0xffef99, 0.95);
        this.scene.tweens.add({
            targets: marker,
            scale: 1.4,
            alpha: 0,
            duration: 500,
            onComplete: () => marker.destroy()
        });

        const points = [
            { x: anchorX + 110, y: anchorY - 90 },
            { x: anchorX - 90, y: anchorY + 60 },
            { x: anchorX + 20, y: anchorY - 140 }
        ];

        let index = 0;
        const doDash = () => {
            if (this.frozen || !this.scene) {
                this.isAttacking = false;
                return;
            }

            const target = points[index];
            index++;

            const fromX = this.x;
            const fromY = this.y;
            const line = this.scene.add.line(0, 0, fromX, fromY, target.x, target.y, 0xffef99, 0.5);
            line.setLineWidth(4);
            line.setDepth(149);
            this.scene.tweens.add({
                targets: line,
                alpha: 0,
                duration: 140,
                onComplete: () => line.destroy()
            });

            this.scene.tweens.add({
                targets: this,
                x: target.x,
                y: target.y,
                duration: 110,
                ease: 'Power3',
                onComplete: () => {
                    this.spawnEchoBomb(target.x, target.y, phase2 ? 220 : 300);

                    const dist = Phaser.Math.Distance.Between(player.x, player.y, this.x, this.y);
                    if (dist < 58 && !player.isInvulnerable) {
                        player.takeDamage(phase2 ? 22 : 16);
                    }

                    if (index < dashCount) {
                        this.scene.time.delayedCall(160, doDash);
                    } else {
                        this.isAttacking = false;
                    }
                }
            });
        };

        this.scene.time.delayedCall(320, doDash);
    }

    spawnEchoBomb(x, y, fuseMs) {
        const echo = this.scene.add.circle(x, y, 14, 0xffd54a, 0.28);
        echo.setStrokeStyle(2, 0xffef99, 0.9);
        echo.setDepth(149);

        this.scene.tweens.add({
            targets: echo,
            scale: 1.6,
            alpha: 0.12,
            duration: fuseMs,
            onComplete: () => {
                if (!this.scene) return;

                const blast = this.scene.add.circle(x, y, 42, 0xffc233, 0.35);
                blast.setDepth(150);
                this.scene.tweens.add({
                    targets: blast,
                    alpha: 0,
                    scale: 1.35,
                    duration: 180,
                    onComplete: () => blast.destroy()
                });

                const player = this.scene.player;
                if (player) {
                    const dist = Phaser.Math.Distance.Between(player.x, player.y, x, y);
                    if (dist < 52 && !player.isInvulnerable && !player.untargetable) {
                        player.takeDamage(10);
                    }
                }

                echo.destroy();
            }
        });
    }

    triggerPhaseTransition() {
        const camW = this.scene.cameras.main.width;
        const camH = this.scene.cameras.main.height;

        const flash = this.scene.add.rectangle(camW / 2, camH / 2, camW, camH, 0xffd54a, 0.24)
            .setScrollFactor(0)
            .setDepth(500);

        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 650,
            onComplete: () => flash.destroy()
        });

        const label = this.scene.add.text(camW / 2, camH / 2, 'OVERCLOCKED', {
            fontSize: '40px',
            fill: '#fff1ba',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 5
        }).setOrigin(0.5).setScrollFactor(0).setDepth(501);

        this.scene.tweens.add({
            targets: label,
            y: camH / 2 - 75,
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => label.destroy()
        });
    }

    update(time, player) {
        const prevNext = this.nextAttackTime;
        super.update(time, player);

        if (this.nextAttackTime !== prevNext) {
            const phase2 = this.health <= this.maxHealth * 0.5;
            this.nextAttackTime = time + (phase2 ? 2100 : 2900);
        }
    }
}
