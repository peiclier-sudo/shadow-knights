// SmokeBombSkill.js - Rogue skill: Become untargetable
import { SkillBase } from '../SkillBase.js';
import { SKILL_DATA } from '../skillData.js';

export class SmokeBombSkill extends SkillBase {
    constructor(scene, player) {
        super(scene, player, SKILL_DATA.smokeBomb);
    }
    
    use() {
        if (!super.use()) return false;
        
        // Smoke effect
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 30 + Math.random() * 150;
            const size = 8 + Math.random() * 20;
            
            const smoke = this.scene.add.circle(
                this.player.x,
                this.player.y,
                size,
                0xaaaaaa,
                0.5
            );
            
            this.scene.tweens.add({
                targets: smoke,
                x: this.player.x + Math.cos(angle) * distance,
                y: this.player.y + Math.sin(angle) * distance,
                alpha: 0,
                scale: 2,
                duration: 1000,
                ease: 'Power2',
                onComplete: () => smoke.destroy()
            });
        }
        
        // Make player untargetable and semi-transparent
        this.player.untargetable = true;
        this.player.alpha = 0.3;
        
        // Exit stealth after 2 seconds
        this.scene.time.delayedCall(2000, () => {
            this.player.untargetable = false;
            
            // Fade back in
            this.scene.tweens.add({
                targets: this.player,
                alpha: 1,
                duration: 300
            });
        });
        
        return true;
    }
}