// ClassBase.js - Base class for all player classes
import { SkillManager } from '../skills/SkillManager.js';

export class ClassBase {
    constructor(scene, player, classData) {
        this.scene = scene;
        this.player = player;
        this.data = classData;
        
        // Apply base stats
        this.player.health = this.data.baseHealth;
        this.player.maxHealth = this.data.baseHealth;
        this.player.stamina = this.data.baseStamina;
        this.player.maxStamina = this.data.baseStamina;
        this.player.speed = this.data.baseSpeed;
        this.player.staminaRegen = this.data.staminaRegen;
        
        // Initialize skills
        this.skillManager = new SkillManager(scene, player, this.data);
        
        // Class-specific visual effects
        this.initVisuals();
    }
    
    initVisuals() {
        // Add class-specific glow/particles
        this.player.setTint(this.data.color);
        
        // Class aura
        this.aura = this.scene.add.graphics();
        this.updateAura();
    }
    
    // DASH - Base implementation
    dash(direction) {
        const dashData = this.data.dash;
        
        if (this.player.stamina < dashData.staminaCost) return false;
        if (this.player.isDashing) return false;
        
        this.player.stamina -= dashData.staminaCost;
        this.player.isDashing = true;
        this.player.isInvulnerable = true;
        
        // Store original position for effects
        const startX = this.player.x;
        const startY = this.player.y;
        
        // Create dash trail
        this.createDashTrail(startX, startY);
        
        // Apply dash velocity
        this.player.body.setVelocity(
            direction.x * dashData.speed,
            direction.y * dashData.speed
        );
        
        // End dash after duration
        this.scene.time.delayedCall(dashData.duration, () => {
            this.player.isDashing = false;
            this.player.isInvulnerable = false;
            this.player.body.setVelocity(0, 0);
        });
        
        return true;
    }
    
    createDashTrail(startX, startY) {
        // Create multiple afterimages
        let count = 0;
        const interval = setInterval(() => {
            if (!this.player.isDashing || count > 5) {
                clearInterval(interval);
                return;
            }
            
            const trail = this.scene.add.circle(
                this.player.x,
                this.player.y,
                18,
                this.data.color,
                0.4
            );
            
            this.scene.tweens.add({
                targets: trail,
                alpha: 0,
                scale: 0.5,
                duration: 200,
                onComplete: () => trail.destroy()
            });
            
            count++;
        }, 50);
    }
    
    // Called every frame
    update(time, delta) {
        if (this.skillManager) {
            this.skillManager.update();
        }
        this.updateAura();
    }
    
    updateAura() {
        if (!this.aura) return;
        
        this.aura.clear();
        
        // Pulse based on class color
        const pulse = 0.3 + Math.sin(Date.now() * 0.005) * 0.1;
        this.aura.lineStyle(2, this.data.glowColor, pulse);
        this.aura.strokeCircle(this.player.x, this.player.y, 40);
    }
    
    destroy() {
        if (this.aura) this.aura.destroy();
        if (this.skillManager) this.skillManager.destroy();
    }
}