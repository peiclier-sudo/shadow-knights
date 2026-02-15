// ExecutionSkill.js - Warrior skill: Execute low health enemies (FIXED - 250px range)
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
        
        // ✅ FIX: Portée augmentée (250 au lieu de proche contact)
        const distance = Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            boss.x, boss.y
        );
        
        const executionRange = 250;  // ✅ Portée généreuse
        
        // Afficher la portée visuellement
        const rangeCircle = this.scene.add.circle(this.player.x, this.player.y, executionRange, 0xff0000, 0);
        rangeCircle.setStrokeStyle(2, 0xff0000, 0.3);
        
        this.scene.tweens.add({
            targets: rangeCircle,
            alpha: 0,
            duration: 300,
            onComplete: () => rangeCircle.destroy()
        });
        
        // ✅ Vérifier la portée
        if (distance > executionRange) {
            console.log(`❌ EXECUTION hors de portée: ${Math.floor(distance)}/${executionRange}`);
            
            // Message "TOO FAR"
            const failText = this.scene.add.text(boss.x, boss.y - 50, 'TOO FAR!', {
                fontSize: '24px',
                fill: '#ff0000',
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
            
            return true;  // Skill utilisée mais pas d'effet
        }
        
        // Check if boss is below 20% health
        if (boss.health / boss.maxHealth < 0.2) {
            // Epic execution effect
            this.scene.cameras.main.flash(500, 255, 0, 0);
            this.scene.cameras.main.shake(300, 0.02);
            
            // Slash effect vers le boss
            const slashCount = 15;
            for (let i = 0; i < slashCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 60;
                const slash = this.scene.add.rectangle(
                    boss.x + Math.cos(angle) * distance,
                    boss.y + Math.sin(angle) * distance,
                    30 + Math.random() * 40,
                    5,
                    0xff0000,
                    0.8
                );
                slash.setRotation(angle);
                
                this.scene.tweens.add({
                    targets: slash,
                    alpha: 0,
                    scaleX: 2,
                    duration: 200,
                    delay: i * 20,
                    onComplete: () => slash.destroy()
                });
            }
            
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
            
            console.log(`💀 EXECUTION SUCCESS! Boss killed instantly.`);
            
        } else {
            // Failed execution - show message
            const healthPercent = Math.floor((boss.health / boss.maxHealth) * 100);
            const failText = this.scene.add.text(boss.x, boss.y - 50, `TOO STRONG! (${healthPercent}%)`, {
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
            
            console.log(`⚠️ EXECUTION failed: Boss at ${healthPercent}% (need < 20%)`);
        }
        
        return true;
    }
}