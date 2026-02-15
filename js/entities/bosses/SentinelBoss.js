// SentinelBoss.js - First boss (FIXED - no damage multipliers)
import { Boss } from '../Boss.js';
import { BOSSES } from '../../data/BossData.js';

export class SentinelBoss extends Boss {
    constructor(scene) {
        super(scene, 1);
    }
    
    attack(player) {
        if (this.isAttacking || this.frozen) return;
        
        this.isAttacking = true;
        
        // Slash attack
        const warning = this.scene.add.rectangle(this.x - 100, this.y, 180, 150, 0xff0051, 0.3);
        warning.setStrokeStyle(4, 0xff3366);
        
        this.scene.tweens.add({
            targets: warning,
            alpha: 0.6,
            duration: 600,
            yoyo: true,
            onComplete: () => {
                warning.destroy();
                
                const slashZone = this.scene.add.rectangle(this.x - 100, this.y, 180, 150, 0xff6666, 0.7);
                
                const dist = Phaser.Math.Distance.Between(player.x, player.y, this.x, this.y);
                if (dist < 120 && !player.isInvulnerable) {
                    player.takeDamage(15);
                }
                
                this.scene.tweens.add({
                    targets: slashZone,
                    alpha: 0,
                    duration: 150,
                    onComplete: () => {
                        slashZone.destroy();
                        this.isAttacking = false;
                    }
                });
            }
        });
    }
    
    update(time, player) {
        super.update(time, player);
        
        // Attack cooldown
        if (time > this.nextAttackTime && !this.isAttacking && !this.frozen) {
            this.attack(player);
            this.nextAttackTime = time + 2000;
        }
    }
}