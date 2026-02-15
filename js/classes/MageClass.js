// MageClass.js - Mage
import { ClassBase } from './ClassBase.js';
import { CLASSES } from './classData.js';
import { FrostNovaSkill } from '../skills/skills/FrostNovaSkill.js';
import { ManaShieldSkill } from '../skills/skills/ManaShieldSkill.js';
import { ArcaneSurgeSkill } from '../skills/skills/ArcaneSurgeSkill.js';

export class MageClass extends ClassBase {
    constructor(scene, player) {
        super(scene, player, CLASSES.MAGE);
        this.manaShieldActive = false;
    }
    
    createSkills() {
        this.skills = [
            new FrostNovaSkill(this.scene, this.player),
            new ManaShieldSkill(this.scene, this.player),
            new ArcaneSurgeSkill(this.scene, this.player)
        ];
    }
    
    // DASH spécifique au mage (téléportation)
    dash(directionX, directionY) {
        const dashData = this.data.dash;
        
        if (this.player.stamina < dashData.staminaCost) return false;
        if (this.player.isDashing) return false;
        
        this.player.stamina -= dashData.staminaCost;
        this.player.isDashing = true;
        this.player.isInvulnerable = true;
        
        // Effet de disparition
        this.createDisappearEffect();
        
        // Calculer la destination (téléportation)
        const teleportRange = 200;
        const destX = this.player.x + directionX * teleportRange;
        const destY = this.player.y + directionY * teleportRange;
        
        // Rester dans les limites
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        const newX = Phaser.Math.Clamp(destX, 50, width - 50);
        const newY = Phaser.Math.Clamp(destY, 50, height - 50);
        
        // Téléporter
        this.player.setPosition(newX, newY);
        
        // Effet d'apparition
        this.createAppearEffect();
        
        this.scene.time.delayedCall(100, () => {
            this.player.isDashing = false;
            this.player.isInvulnerable = false;
        });
        
        return true;
    }
    
    createDisappearEffect() {
        for (let i = 0; i < 15; i++) {
            const particle = this.scene.add.circle(
                this.player.x, this.player.y,
                4, 0x88aaff, 0.6
            );
            
            this.scene.tweens.add({
                targets: particle,
                x: particle.x + (Math.random() - 0.5) * 100,
                y: particle.y + (Math.random() - 0.5) * 100,
                alpha: 0,
                scale: 2,
                duration: 300,
                onComplete: () => particle.destroy()
            });
        }
    }
    
    createAppearEffect() {
        for (let i = 0; i < 15; i++) {
            const particle = this.scene.add.circle(
                this.player.x, this.player.y,
                4, 0x88aaff, 0.6
            );
            
            this.scene.tweens.add({
                targets: particle,
                alpha: 0,
                scale: 2,
                duration: 300,
                onComplete: () => particle.destroy()
            });
        }
    }
}