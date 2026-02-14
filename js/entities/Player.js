// Player.js - Player entity
import { CLASSES } from '../classes/classData.js';

export class Player extends Phaser.GameObjects.Container {
    constructor(scene, config) {
        super(scene, scene.cameras.main.width * 0.15, scene.cameras.main.height * 0.5);
        
        this.scene = scene;
        this.classData = CLASSES[config.class];
        
        // Stats
        this.health = this.classData.baseHealth;
        this.maxHealth = this.classData.baseHealth;
        this.stamina = this.classData.baseStamina;
        this.maxStamina = this.classData.baseStamina;
        this.speed = this.classData.baseSpeed;
        this.staminaRegen = this.classData.staminaRegen;
        
        // State
        this.isDashing = false;
        this.isInvulnerable = false;
        this.isCharging = false;
        this.canAttack = true;
        this.damageMultiplier = 1.0;
        this.damageReduction = 0;
        
        // Dash properties
        this.dashSpeed = 800;
        this.dashDuration = 200;
        this.dashCooldown = 1000;
        this.lastDashTime = 0;
        
        // Create player visuals
        this.createVisuals();
        
        // Add to scene
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.body.setCircle(18);
        this.body.setCollideWorldBounds(true);
    }
    
    createVisuals() {
        // Core
        const core = this.scene.add.circle(0, 0, 18, this.classData.color);
        core.setStrokeStyle(2, 0xffffff);
        
        // Glow effects
        const innerGlow = this.scene.add.circle(0, 0, 22, this.classData.color, 0.3);
        const outerGlow = this.scene.add.circle(0, 0, 28, this.classData.color, 0.15);
        
        // Rings
        const ring1 = this.scene.add.circle(0, 0, 24, this.classData.color, 0);
        ring1.setStrokeStyle(1.5, this.classData.glowColor, 0.6);
        
        const ring2 = this.scene.add.circle(0, 0, 30, this.classData.color, 0);
        ring2.setStrokeStyle(1, this.classData.glowColor, 0.3);
        
        // Highlight for 3D effect
        const highlight = this.scene.add.circle(-4, -4, 5, 0xffffff, 0.3);
        
        this.add([outerGlow, innerGlow, core, ring1, ring2, highlight]);
        
        // Store references for animations
        this.core = core;
        this.ring1 = ring1;
        this.ring2 = ring2;
    }
    
    move(velocityX, velocityY) {
        if (!this.isDashing && !this.isCharging) {
            this.body.setVelocity(velocityX, velocityY);
        }
    }
    
    dash(directionX, directionY) {
        if (this.stamina < 40) return false;
        if (this.isDashing) return false;
        
        const now = Date.now();
        if (now - this.lastDashTime < this.dashCooldown) return false;
        
        this.stamina -= 40;
        this.isDashing = true;
        this.isInvulnerable = true;
        this.lastDashTime = now;
        
        this.body.setVelocity(
            directionX * this.dashSpeed,
            directionY * this.dashSpeed
        );
        
        this.scene.time.delayedCall(this.dashDuration, () => {
            this.isDashing = false;
            this.isInvulnerable = false;
            this.body.setVelocity(0, 0);
            
            // Effet de fin de dash - fumée
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const smoke = this.scene.add.circle(
                    this.x,
                    this.y,
                    5 + Math.random() * 5,
                    this.classData?.color || 0x00d4ff,
                    0.3
                );
                
                this.scene.tweens.add({
                    targets: smoke,
                    x: this.x + Math.cos(angle) * 40,
                    y: this.y + Math.sin(angle) * 40,
                    alpha: 0,
                    scale: 1.5,
                    duration: 200,
                    onComplete: () => smoke.destroy()
                });
            }
        });
        
        return true;
    }
    
    takeDamage(amount) {
        if (this.isInvulnerable) return 0;
        
        const reducedAmount = amount * (1 - this.damageReduction);
        this.health = Math.max(0, this.health - reducedAmount);
        
        this.scene.tweens.add({
            targets: this,
            alpha: 0.3,
            duration: 80,
            yoyo: true,
            repeat: 1
        });
        
        return reducedAmount;
    }
    
    regenerateStamina() {
        if (this.stamina < this.maxStamina) {
            this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRegen);
        }
    }
    
    update() {
        if (this.ring1) {
            this.ring1.rotation += 0.01;
        }
        if (this.ring2) {
            this.ring2.rotation -= 0.005;
        }
    }
}