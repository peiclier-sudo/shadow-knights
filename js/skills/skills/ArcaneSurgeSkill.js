// ArcaneSurgeSkill.js - Mage skill: Multishot
import { SkillBase } from '../SkillBase.js';
import { SKILL_DATA } from '../skillData.js';

export class ArcaneSurgeSkill extends SkillBase {
    constructor(scene, player) {
        super(scene, player, SKILL_DATA.arcaneSurge);
    }
    
    use() {
        if (!super.use()) return false;
        
        // Surge effect
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 30 + Math.random() * 50;
            
            const particle = this.scene.add.circle(
                this.player.x,
                this.player.y,
                4 + Math.random() * 4,
                0xaa88ff,
                0.7
            );
            
            this.scene.tweens.add({
                targets: particle,
                x: this.player.x + Math.cos(angle) * distance,
                y: this.player.y + Math.sin(angle) * distance,
                alpha: 0,
                scale: 2,
                duration: 300,
                onComplete: () => particle.destroy()
            });
        }
        
        // Arcane rings
        const ring1 = this.scene.add.circle(this.player.x, this.player.y, 40, 0xaa88ff, 0);
        ring1.setStrokeStyle(3, 0xaa88ff, 0.8);
        
        const ring2 = this.scene.add.circle(this.player.x, this.player.y, 60, 0xaa88ff, 0);
        ring2.setStrokeStyle(2, 0xcc88ff, 0.5);
        
        this.scene.tweens.add({
            targets: [ring1, ring2],
            scale: 1.5,
            alpha: 0,
            duration: 400,
            onComplete: () => {
                ring1.destroy();
                ring2.destroy();
            }
        });
        
        // Buff next shots
        this.player.multishot = 3;
        this.player.multishotCount = 3;
        
        // Visual indicator for buff
        const buffText = this.scene.add.text(this.player.x, this.player.y - 50, 'SURGE!', {
            fontSize: '24px',
            fill: '#aa88ff',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: buffText,
            y: this.player.y - 100,
            alpha: 0,
            duration: 800,
            onComplete: () => buffText.destroy()
        });
        
        return true;
    }
}