// BackstabSkill.js - Rogue skill: Bonus damage from behind
import { SkillBase } from '../SkillBase.js';
import { SKILL_DATA } from '../skillData.js';

export class BackstabSkill extends SkillBase {
    constructor(scene, player) {
        super(scene, player, SKILL_DATA.backstab);
    }
    
    use() {
        if (!super.use()) return false;
        
        // Enable backstab for next attack
        this.player.backstabReady = true;
        
        // Visual indicator
        const indicator = this.scene.add.circle(this.player.x, this.player.y, 40, 0xaa44cc, 0.2);
        indicator.setStrokeStyle(3, 0xff88ff, 0.8);
        
        // Floating daggers
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2 + Date.now() * 0.001;
            const dagger = this.scene.add.rectangle(
                this.player.x + Math.cos(angle) * 50,
                this.player.y + Math.sin(angle) * 50,
                3,
                15,
                0xaa44cc,
                0.6
            );
            dagger.setRotation(angle);
            
            this.scene.tweens.add({
                targets: dagger,
                alpha: 0,
                duration: 3000,
                onComplete: () => dagger.destroy()
            });
        }
        
        // Pulse animation
        this.scene.tweens.add({
            targets: indicator,
            alpha: 0.4,
            scale: 1.2,
            duration: 500,
            yoyo: true,
            repeat: 5,
            onComplete: () => {
                this.player.backstabReady = false;
                indicator.destroy();
            }
        });
        
        return true;
    }
}