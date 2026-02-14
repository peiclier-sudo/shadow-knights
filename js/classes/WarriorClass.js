// WarriorClass.js - Warrior class implementation
import { ClassBase } from './ClassBase.js';
import { CLASSES } from './classData.js';

export class WarriorClass extends ClassBase {
    constructor(scene, player) {
        super(scene, player, CLASSES.WARRIOR);
        
        this.passiveActive = false;
    }
    
    dash(direction) {
        const result = super.dash(direction);
        
        if (result) {
            this.checkDashDamage();
            
            const shield = this.scene.add.circle(this.player.x, this.player.y, 35, 0xffaa00, 0.3);
            shield.setStrokeStyle(3, 0xff6600);
            
            this.scene.tweens.add({
                targets: shield,
                scale: 1.5,
                alpha: 0,
                duration: 200,
                onComplete: () => shield.destroy()
            });
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
        
        if (this.player.health < this.player.maxHealth * 0.3) {
            if (!this.passiveActive) {
                this.passiveActive = true;
                this.player.damageReduction = 0.3;
                
                const glow = this.scene.add.circle(this.player.x, this.player.y, 50, 0xff5500, 0.2);
                this.scene.tweens.add({
                    targets: glow,
                    alpha: 0,
                    scale: 1.5,
                    duration: 1000,
                    repeat: -1,
                    onComplete: () => glow.destroy()
                });
            }
        } else {
            if (this.passiveActive) {
                this.passiveActive = false;
                this.player.damageReduction = 0;
            }
        }
    }
}