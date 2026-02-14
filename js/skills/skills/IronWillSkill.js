// IronWillSkill.js - Warrior skill: Damage reduction
import { SkillBase } from '../SkillBase.js';
import { SKILL_DATA } from '../skillData.js';

export class IronWillSkill extends SkillBase {
    constructor(scene, player) {
        super(scene, player, SKILL_DATA.ironWill);
    }
    
    use() {
        if (!super.use()) return false;
        
        // Shield visual
        const shield = this.scene.add.circle(this.player.x, this.player.y, 50, 0x88aaff, 0.3);
        shield.setStrokeStyle(4, 0xffffff, 0.8);
        
        this.scene.tweens.add({
            targets: shield,
            alpha: 0.2,
            scale: 1.2,
            duration: 4000,
            onComplete: () => shield.destroy()
        });
        
        // Add orbiting particles
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const particle = this.scene.add.circle(
                this.player.x + Math.cos(angle) * 40,
                this.player.y + Math.sin(angle) * 40,
                4,
                0x88aaff,
                0.6
            );
            
            this.scene.tweens.add({
                targets: particle,
                angle: angle + Math.PI * 2,
                x: this.player.x + Math.cos(angle + Math.PI * 2) * 40,
                y: this.player.y + Math.sin(angle + Math.PI * 2) * 40,
                duration: 2000,
                repeat: -1,
                onComplete: () => particle.destroy()
            });
        }
        
        // Apply damage reduction
        this.player.damageReduction = 0.5;
        
        // Remove after duration
        this.scene.time.delayedCall(4000, () => {
            this.player.damageReduction = 0;
        });
        
        return true;
    }
}