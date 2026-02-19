// DasherBoss.js - Third boss (FIXED - no damage multipliers)
import { Boss } from '../Boss.js';
import { BOSSES } from '../../data/BossData.js';

export class DasherBoss extends Boss {
    constructor(scene) {
        super(scene, 3);
        this.phaseTransitioned = false;
    }

    attack(player) {
        if (this.isAttacking || this.frozen) return;

        if (this.health <= this.maxHealth * 0.5 && !this.phaseTransitioned) {
            this.phaseTransitioned = true;
            this.triggerPhaseTransition('SHADOW FURY!', 0xcc00ff);
        }

        const phase2 = this.health <= this.maxHealth * 0.5;
        this.isAttacking = true;

        const targetX = player.x;
        const targetY = player.y;
        
        // Telegraph line
        const line = this.scene.add.line(0, 0, this.x, this.y, targetX, targetY, 0xcc00ff, 0.5);
        line.setLineWidth(6);
        
        // Warning circles along the path
        const warnings = [];
        for (let i = 0.2; i <= 1; i += 0.2) {
            const warnX = this.x + (targetX - this.x) * i;
            const warnY = this.y + (targetY - this.y) * i;
            const warn = this.scene.add.circle(warnX, warnY, 20, 0xcc00ff, 0.3);
            warn.setStrokeStyle(2, 0xdd33ff);
            warnings.push(warn);
        }
        
        this.scene.tweens.add({
            targets: [...warnings, line],
            alpha: 0,
            duration: 400,
            onComplete: () => {
                line.destroy();
                warnings.forEach(w => w.destroy());

                if (this.frozen) {
                    this.isAttacking = false;
                    return;
                }
                
                // Dash
                this.scene.tweens.add({
                    targets: this,
                    x: targetX,
                    y: targetY,
                    duration: 100,
                    ease: 'Power3',
                    onUpdate: () => {
                        // Trail during dash
                        if (Math.random() > 0.5) {
                            const trail = this.scene.add.circle(this.x, this.y, 15, 0xcc00ff, 0.4);
                            this.scene.tweens.add({
                                targets: trail,
                                alpha: 0,
                                scale: 0.5,
                                duration: 200,
                                onComplete: () => trail.destroy()
                            });
                        }
                    },
                    onComplete: () => {
                        if (!this.frozen) {
                            const dist = Phaser.Math.Distance.Between(player.x, player.y, this.x, this.y);
                            if (dist < 60 && !player.isInvulnerable) {
                                player.takeDamage(phase2 ? 24 : 20);
                            }

                            // Phase 2: immediately dash a second time (afterimage strike)
                            if (phase2 && !this.frozen) {
                                this.scene.time.delayedCall(200, () => {
                                    if (this.frozen || !player?.active) { this.isAttacking = false; return; }
                                    const t2x = player.x;
                                    const t2y = player.y;
                                    this.scene.tweens.add({
                                        targets: this,
                                        x: t2x, y: t2y,
                                        duration: 80, ease: 'Power3',
                                        onUpdate: () => {
                                            const shadow = this.scene.add.circle(this.x, this.y, 14, 0xaa00ff, 0.3);
                                            this.scene.tweens.add({ targets: shadow, alpha: 0, scale: 0.4, duration: 180, onComplete: () => shadow.destroy() });
                                        },
                                        onComplete: () => {
                                            const d2 = Phaser.Math.Distance.Between(player.x, player.y, this.x, this.y);
                                            if (d2 < 60 && !player.isInvulnerable) player.takeDamage(14);
                                            this.isAttacking = false;
                                        }
                                    });
                                });
                            } else {
                                this.isAttacking = false;
                            }
                        } else {
                            this.isAttacking = false;
                        }
                    }
                });
            }
        });
    }

    update(time, player) {
        super.update(time, player);

        if (time > this.nextAttackTime && !this.isAttacking && !this.frozen && !player?.untargetable) {
            this.attack(player);
            const phase2 = this.health <= this.maxHealth * 0.5;
            this.nextAttackTime = time + (phase2 ? 2200 : 3000);
        }
    }
}