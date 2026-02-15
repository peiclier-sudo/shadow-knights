// WarriorClass.js - Guerrier
import { ClassBase } from './ClassBase.js';
import { CLASSES } from './classData.js';
import { BattleCrySkill } from '../skills/skills/BattleCrySkill.js';
import { IronWillSkill } from '../skills/skills/IronWillSkill.js';
import { ExecutionSkill } from '../skills/skills/ExecutionSkill.js';

export class WarriorClass extends ClassBase {
    constructor(scene, player) {
        super(scene, player, CLASSES.WARRIOR);
        this.passiveActive = false;
    }
    
    createSkills() {
        this.skills = [
            new BattleCrySkill(this.scene, this.player),
            new IronWillSkill(this.scene, this.player),
            new ExecutionSkill(this.scene, this.player)
        ];
    }
    
    // DASH spécifique au guerrier
    dash(directionX, directionY) {
        const result = super.dash(directionX, directionY);
        
        if (result) {
            // Effet de bouclier
            const shield = this.scene.add.circle(
                this.player.x, this.player.y,
                35, 0xffaa00, 0.2
            );
            shield.setStrokeStyle(3, 0xff6600);
            
            this.scene.tweens.add({
                targets: shield,
                scale: 1.5,
                alpha: 0,
                duration: 200,
                onComplete: () => shield.destroy()
            });
            
            // Dégâts de dash
            this.checkDashDamage();
        }
        
        return result;
    }
    
    checkDashDamage() {
        const boss = this.scene.boss;
        if (!boss) return;
        
        const dist = Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            boss.x, boss.y
        );
        
        if (dist < 100) {
            boss.takeDamage(this.data.dash.damage || 25);
            
            // Recul
            const knockbackX = boss.x + (boss.x - this.player.x) * 0.3;
            const knockbackY = boss.y + (boss.y - this.player.y) * 0.3;
            
            this.scene.tweens.add({
                targets: boss,
                x: knockbackX,
                y: knockbackY,
                duration: 150,
                ease: 'Power2'
            });
        }
    }
    
    update(time, delta) {
        super.update(time, delta);
        
        // Passif : réduction des dégâts quand faible vie
        if (this.player.health < this.player.maxHealth * 0.3) {
            if (!this.passiveActive) {
                this.passiveActive = true;
                this.player.damageReduction = 0.3;
            }
        } else {
            if (this.passiveActive) {
                this.passiveActive = false;
                this.player.damageReduction = 0;
            }
        }
    }
}