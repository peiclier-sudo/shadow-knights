// EviscerateSkill.js - Rogue skill: Massive damage
import { SkillBase } from '../SkillBase.js';
import { SKILL_DATA } from '../skillData.js';

export class EviscerateSkill extends SkillBase {
    constructor(scene, player) {
        super(scene, player, SKILL_DATA.eviscerate);
    }
    
    use() {
        if (!super.use()) return false;
        
        const boss = this.scene.boss;
        if (!boss) return false;
        
        // Teleport behind boss
        const angleToBoss = Math.atan2(boss.y - this.player.y, boss.x - this.player.x);
        const rawBehindX = boss.x - Math.cos(angleToBoss) * 100;
        const rawBehindY = boss.y - Math.sin(angleToBoss) * 100;

        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        const behindX = Phaser.Math.Clamp(rawBehindX, 50, width - 50);
        const behindY = Phaser.Math.Clamp(rawBehindY, 50, height - 50);
        
        // Teleport effect
        this.scene.tweens.add({
            targets: this.player,
            x: behindX,
            y: behindY,
            duration: 150,
            ease: 'Power2',
            onComplete: () => {
                // Slash effect
                for (let i = 0; i < 15; i++) {
                    const slashAngle = angleToBoss + (Math.random() - 0.5) * 0.5;
                    const slash = this.scene.add.rectangle(
                        boss.x,
                        boss.y,
                        30 + Math.random() * 40,
                        5,
                        0xff3366,
                        0.8
                    );
                    slash.setRotation(slashAngle);
                    
                    this.scene.tweens.add({
                        targets: slash,
                        alpha: 0,
                        scaleX: 2,
                        duration: 200,
                        onComplete: () => slash.destroy()
                    });
                }
                
                // Damage boss
                const finalDamage = 60 * (this.player.damageMultiplier || 1.0);
                boss.takeDamage(finalDamage);
                
                // Screen effects
                this.scene.cameras.main.flash(200, 255, 0, 0);
                this.scene.cameras.main.shake(200, 0.01);
                
                // Critical text
                const critText = this.scene.add.text(boss.x, boss.y - 80, 'EVISCERATE!', {
                    fontSize: '36px',
                    fill: '#ff3366',
                    stroke: '#000',
                    strokeThickness: 6,
                    fontStyle: 'bold'
                }).setOrigin(0.5);
                
                this.scene.tweens.add({
                    targets: critText,
                    y: boss.y - 150,
                    alpha: 0,
                    scale: 1.5,
                    duration: 600,
                    onComplete: () => critText.destroy()
                });
            }
        });
        
        return true;
    }
}