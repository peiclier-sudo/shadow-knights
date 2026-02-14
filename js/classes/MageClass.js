// MageClass.js - Mage class implementation
import { ClassBase } from './ClassBase.js';
import { CLASSES } from './classData.js';

export class MageClass extends ClassBase {
    constructor(scene, player) {
        super(scene, player, CLASSES.MAGE);
        
        this.originalRegen = this.player.staminaRegen;
        this.player.staminaRegen = this.data.staminaRegen * 1.2;
        this.manaShieldActive = false;
    }
    
    dash(direction) {
        const dashData = this.data.dash;
        
        if (this.player.stamina < dashData.staminaCost) return false;
        if (this.player.isDashing) return false;
        
        this.player.stamina -= dashData.staminaCost;
        this.player.isDashing = true;
        this.player.isInvulnerable = true;
        
        const startX = this.player.x;
        const startY = this.player.y;
        
        for (let i = 0; i < 20; i++) {
            const particle = this.scene.add.circle(
                startX + (Math.random() - 0.5) * 40,
                startY + (Math.random() - 0.5) * 40,
                4,
                0x88aaff,
                0.8
            );
            
            this.scene.tweens.add({
                targets: particle,
                alpha: 0,
                scale: 2,
                x: particle.x + (Math.random() - 0.5) * 100,
                y: particle.y + (Math.random() - 0.5) * 100,
                duration: 300,
                onComplete: () => particle.destroy()
            });
        }
        
        const teleportRange = 200;
        const destX = this.player.x + direction.x * teleportRange;
        const destY = this.player.y + direction.y * teleportRange;
        
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        const newX = Phaser.Math.Clamp(destX, 50, width - 50);
        const newY = Phaser.Math.Clamp(destY, 50, height - 50);
        
        this.player.setPosition(newX, newY);
        
        for (let i = 0; i < 20; i++) {
            const particle = this.scene.add.circle(
                newX + (Math.random() - 0.5) * 40,
                newY + (Math.random() - 0.5) * 40,
                4,
                0x88aaff,
                0.8
            );
            
            this.scene.tweens.add({
                targets: particle,
                alpha: 0,
                scale: 2,
                duration: 300,
                onComplete: () => particle.destroy()
            });
        }
        
        this.scene.time.delayedCall(100, () => {
            this.player.isDashing = false;
            this.player.isInvulnerable = false;
        });
        
        return true;
    }
    
    activateManaShield() {
        this.manaShieldActive = true;
        
        this.manaShieldVisual = this.scene.add.circle(
            this.player.x, this.player.y, 50, 0x3366ff, 0.2
        );
        this.manaShieldVisual.setStrokeStyle(3, 0x88aaff, 0.8);
        
        this.scene.tweens.add({
            targets: this.manaShieldVisual,
            alpha: 0.3,
            scale: 1.1,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
        
        this.scene.time.delayedCall(3000, () => {
            this.manaShieldActive = false;
            if (this.manaShieldVisual) {
                this.manaShieldVisual.destroy();
            }
        });
    }
    
    handleDamage(amount) {
        if (this.manaShieldActive) {
            this.player.stamina = Math.max(0, this.player.stamina - amount * 2);
            return 0;
        }
        return amount;
    }
    
    update(time, delta) {
        super.update(time, delta);
        
        if (this.manaShieldVisual) {
            this.manaShieldVisual.x = this.player.x;
            this.manaShieldVisual.y = this.player.y;
        }
    }
}