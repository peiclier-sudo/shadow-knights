// FrostNovaSkill.js - Mage skill: Freeze enemies
import { SkillBase } from '../SkillBase.js';
import { SKILL_DATA } from '../skillData.js';

export class FrostNovaSkill extends SkillBase {
    constructor(scene, player) {
        super(scene, player, SKILL_DATA.frostNova);
    }
    
    use() {
        if (!super.use()) return false;
        
        const boss = this.scene.boss;
        if (!boss) return false;
        
        // Ice explosion effect
        for (let i = 0; i < 24; i++) {
            const angle = (i / 24) * Math.PI * 2;
            const ice = this.scene.add.circle(
                this.player.x,
                this.player.y,
                8,
                0x88ccff,
                0.7
            );
            
            this.scene.tweens.add({
                targets: ice,
                x: this.player.x + Math.cos(angle) * 200,
                y: this.player.y + Math.sin(angle) * 200,
                alpha: 0,
                scale: 0.5,
                duration: 500,
                ease: 'Power2',
                onComplete: () => ice.destroy()
            });
        }
        
        // Freeze boss
        if (boss) {
            boss.frozen = true;
            boss.setTint(0x88ccff);
            
            // Ice crystals on boss
            for (let i = 0; i < 8; i++) {
                const crystal = this.scene.add.rectangle(
                    boss.x + (Math.random() - 0.5) * 80,
                    boss.y + (Math.random() - 0.5) * 80,
                    5,
                    15,
                    0xaaddff,
                    0.6
                );
                crystal.setRotation(Math.random() * Math.PI);
                
                this.scene.tweens.add({
                    targets: crystal,
                    alpha: 0,
                    duration: 2000,
                    onComplete: () => crystal.destroy()
                });
            }
            
            // Unfreeze after 2 seconds
            this.scene.time.delayedCall(2000, () => {
                boss.frozen = false;
                boss.clearTint();
            });
        }
        
        return true;
    }
}