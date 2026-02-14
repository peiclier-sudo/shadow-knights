// ExecutionSkill.js - Warrior skill: Execute low health enemies
import { SkillBase } from '../SkillBase.js';
import { SKILL_DATA } from '../skillData.js';

export class ExecutionSkill extends SkillBase {
    constructor(scene, player) {
        super(scene, player, SKILL_DATA.execution);
    }
    
    use() {
        if (!super.use()) return false;
        
        const boss = this.scene.boss;
        if (!boss) return false;
        
        // Check if boss is below 20% health
        if (boss.health / boss.maxHealth < 0.2) {
            // Epic execution effect
            this.scene.cameras.main.flash(500, 255, 0, 0);
            this.scene.cameras.main.shake(300, 0.02);
            
            // Explosion particles
            for (let i = 0; i < 30; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = 50 + Math.random() * 150;
                const size = 5 + Math.random() * 10;
                
                const particle = this.scene.add.circle(
                    boss.x,
                    boss.y,
                    size,
                    0xff0000,
                    0.8
                );
                
                this.scene.tweens.add({
                    targets: particle,
                    x: boss.x + Math.cos(angle) * distance,
                    y: boss.y + Math.sin(angle) * distance,
                    alpha: 0,
                    scale: 0.5,
                    duration: 500,
                    onComplete: () => particle.destroy()
                });
            }
            
            // Execution text
            const execText = this.scene.add.text(boss.x, boss.y - 100, 'EXECUTION!', {
                fontSize: '48px',
                fill: '#ff0000',
                stroke: '#000',
                strokeThickness: 6,
                fontStyle: 'bold'
            }).setOrigin(0.5);
            
            this.scene.tweens.add({
                targets: execText,
                y: boss.y - 200,
                alpha: 0,
                scale: 1.5,
                duration: 800,
                onComplete: () => execText.destroy()
            });
            
            boss.health = 0;
            
        } else {
            // Failed execution - show message
            const failText = this.scene.add.text(boss.x, boss.y - 50, 'TOO STRONG!', {
                fontSize: '24px',
                fill: '#ffaa00',
                stroke: '#000',
                strokeThickness: 4
            }).setOrigin(0.5);
            
            this.scene.tweens.add({
                targets: failText,
                y: boss.y - 100,
                alpha: 0,
                duration: 800,
                onComplete: () => failText.destroy()
            });
        }
        
        return true;
    }
}