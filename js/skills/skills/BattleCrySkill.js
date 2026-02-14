// BattleCrySkill.js - Warrior skill: Increase damage
import { SkillBase } from '../SkillBase.js';
import { SKILL_DATA } from '../skillData.js';

export class BattleCrySkill extends SkillBase {
    constructor(scene, player) {
        super(scene, player, SKILL_DATA.battleCry);
    }
    
    use() {
        if (!super.use()) return false;
        
        // Visual effect - expanding ring
        const ring = this.scene.add.circle(this.player.x, this.player.y, 30, 0xff5500, 0.5);
        ring.setStrokeStyle(4, 0xffaa00);
        
        this.scene.tweens.add({
            targets: ring,
            radius: 120,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => ring.destroy()
        });
        
        // Add particles
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const particle = this.scene.add.circle(
                this.player.x,
                this.player.y,
                5,
                0xff5500,
                0.7
            );
            
            this.scene.tweens.add({
                targets: particle,
                x: this.player.x + Math.cos(angle) * 100,
                y: this.player.y + Math.sin(angle) * 100,
                alpha: 0,
                scale: 0.5,
                duration: 400,
                onComplete: () => particle.destroy()
            });
        }
        
        // Apply damage buff
        this.player.damageMultiplier = 1.5;
        
        // Remove buff after duration
        this.scene.time.delayedCall(5000, () => {
            this.player.damageMultiplier = 1.0;
        });
        
        return true;
    }
}