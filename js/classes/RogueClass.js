// RogueClass.js - Rogue class implementation
import { ClassBase } from './ClassBase.js';
import { CLASSES } from './classData.js';

export class RogueClass extends ClassBase {
    constructor(scene, player) {
        super(scene, player, CLASSES.ROGUE);
        
        this.critChance = 0.2;
        this.critMultiplier = 2.0;
        this.isStealthed = false;
    }
    
    dash(direction) {
        const result = super.dash(direction);
        
        if (result) {
            this.enterStealth();
            this.createShadowTrail();
        }
        
        return result;
    }
    
    enterStealth() {
        this.isStealthed = true;
        this.player.alpha = 0.4;
        this.player.isInvulnerable = true;
        
        const stealthEffect = this.scene.add.circle(
            this.player.x, this.player.y, 60, 0x6600aa, 0.2
        );
        
        this.scene.tweens.add({
            targets: stealthEffect,
            alpha: 0,
            scale: 1.5,
            duration: 1000,
            onComplete: () => stealthEffect.destroy()
        });
        
        this.scene.time.delayedCall(1500, () => {
            this.isStealthed = false;
            this.player.alpha = 1;
            this.player.isInvulnerable = false;
        });
    }
    
    createShadowTrail() {
        let count = 0;
        const interval = setInterval(() => {
            if (!this.isStealthed || count > 5) {
                clearInterval(interval);
                return;
            }
            
            const shadow = this.scene.add.circle(
                this.player.x,
                this.player.y,
                18,
                0x6600aa,
                0.3
            );
            
            this.scene.tweens.add({
                targets: shadow,
                alpha: 0,
                scale: 1.5,
                duration: 300,
                onComplete: () => shadow.destroy()
            });
            
            count++;
        }, 100);
    }
    
    calculateDamage(baseDamage) {
        if (Math.random() < this.critChance) {
            this.showCritEffect();
            return baseDamage * this.critMultiplier;
        }
        return baseDamage;
    }
    
    showCritEffect() {
        const critText = this.scene.add.text(
            this.player.x,
            this.player.y - 30,
            'CRIT!',
            {
                fontSize: '24px',
                fill: '#ffaa00',
                stroke: '#000',
                strokeThickness: 4,
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: critText,
            y: this.player.y - 80,
            alpha: 0,
            duration: 500,
            onComplete: () => critText.destroy()
        });
    }
    
    isBehindTarget(target) {
        if (!target) return false;
        
        const angleToTarget = Math.atan2(
            target.y - this.player.y,
            target.x - this.player.x
        );
        
        const targetFacing = target.rotation || 0;
        const angleDiff = Math.abs(angleToTarget - targetFacing);
        
        return angleDiff > 2.0;
    }
    
    update(time, delta) {
        super.update(time, delta);
        
        if (this.isStealthed) {
            this.player.alpha = 0.3 + Math.sin(time * 0.01) * 0.1;
        }
    }
}