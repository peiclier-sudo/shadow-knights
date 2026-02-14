// ManaShieldSkill.js - Mage skill: Damage to stamina
import { SkillBase } from '../SkillBase.js';
import { SKILL_DATA } from '../skillData.js';

export class ManaShieldSkill extends SkillBase {
    constructor(scene, player) {
        super(scene, player, SKILL_DATA.manaShield);
    }
    
    use() {
        if (!super.use()) return false;
        
        // Shield visual
        const shield = this.scene.add.circle(this.player.x, this.player.y, 60, 0x3366ff, 0.2);
        shield.setStrokeStyle(4, 0x88aaff, 0.8);
        
        // Add floating runes
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const rune = this.scene.add.circle(
                this.player.x + Math.cos(angle) * 50,
                this.player.y + Math.sin(angle) * 50,
                4,
                0x88aaff,
                0.6
            );
            
            this.scene.tweens.add({
                targets: rune,
                angle: angle + Math.PI * 2,
                x: this.player.x + Math.cos(angle + Math.PI * 2) * 50,
                y: this.player.y + Math.sin(angle + Math.PI * 2) * 50,
                duration: 2000,
                repeat: -1
            });
        }
        
        // Pulsing shield animation
        this.scene.tweens.add({
            targets: shield,
            alpha: 0.3,
            scale: 1.1,
            duration: 500,
            yoyo: true,
            repeat: 5,
            onComplete: () => shield.destroy()
        });
        
        // Apply mana shield effect
        this.player.manaShield = true;
        
        // Remove after duration
        this.scene.time.delayedCall(3000, () => {
            this.player.manaShield = false;
        });
        
        return true;
    }
}