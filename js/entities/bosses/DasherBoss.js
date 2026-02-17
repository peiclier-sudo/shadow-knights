// DasherBoss.js - Third boss (FIXED - no damage multipliers)
import { Boss } from '../Boss.js';
import { BOSSES } from '../../data/BossData.js';

export class DasherBoss extends Boss {
    constructor(scene, towerFloor = 1) {
        super(scene, 3, towerFloor);
    }
    
    attack(player) {
        if (this.isAttacking || this.frozen) return;
        
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
                                this.dealDamage(player, 20);
                            }
                        }
                        this.isAttacking = false;
                    }
                });
            }
        });
    }
    
    update(time, player) {
        super.update(time, player);
        
        if (time > this.nextAttackTime && !this.isAttacking && !this.frozen && !player?.untargetable) {
            this.attack(player);
            this.nextAttackTime = time + this.adjustCooldown(3000);
        }
    }
}