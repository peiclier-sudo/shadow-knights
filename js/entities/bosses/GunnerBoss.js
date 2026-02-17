// GunnerBoss.js - Second boss (FIXED - no damage multipliers)
import { Boss } from '../Boss.js';
import { BOSSES } from '../../data/BossData.js';

export class GunnerBoss extends Boss {
    constructor(scene, towerFloor = 1) {
        super(scene, 2, towerFloor);
    }
    
    attack(player) {
        if (this.isAttacking || this.frozen) return;
        
        this.isAttacking = true;
        
        const warning = this.scene.add.circle(this.x, this.y, 45, 0xff6600, 0.3);
        warning.setStrokeStyle(4, 0xff8833);
        
        this.scene.tweens.add({
            targets: warning,
            radius: 65,
            alpha: 0,
            duration: 600,
            onComplete: () => {
                warning.destroy();

                if (this.frozen) {
                    this.isAttacking = false;
                    return;
                }
                
                const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
                
                for (let i = -2; i <= 2; i++) {
                    const angle = angleToPlayer + (i * 0.2);
                    const projectile = this.scene.add.circle(this.x, this.y, 8, 0xff6600);
                    projectile.setDepth(150);
                    projectile.vx = Math.cos(angle) * 350;
                    projectile.vy = Math.sin(angle) * 350;
                    
                    // Add glow
                    const glow = this.scene.add.circle(this.x, this.y, 14, 0xff6600, 0.3);
                    glow.setDepth(149);
                    projectile.glow = glow;
                    
                    this.scene.bossProjectiles.push(projectile);
                }
                
                this.isAttacking = false;
            }
        });
    }
    
    update(time, player) {
        super.update(time, player);
        
        if (time > this.nextAttackTime && !this.isAttacking && !this.frozen && !player?.untargetable) {
            this.attack(player);
            this.nextAttackTime = time + this.adjustCooldown(2500);
        }
    }
}