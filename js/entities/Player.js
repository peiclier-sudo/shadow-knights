// Player.js - Player entity
import { WarriorClass } from '../classes/WarriorClass.js';
import { MageClass } from '../classes/MageClass.js';
import { RogueClass } from '../classes/RogueClass.js';

export class Player extends Phaser.GameObjects.Container {
    constructor(scene, config) {
        super(scene, scene.cameras.main.width * 0.15, scene.cameras.main.height * 0.5);
        
        this.scene = scene;
        this.config = config;
        
        // Stats de base (seront écrasées par la classe)
        this.health = 100;
        this.maxHealth = 100;
        this.stamina = 100;
        this.maxStamina = 100;
        this.speed = 300;
        this.staminaRegen = 0.18;
        
        // State
        this.isDashing = false;
        this.isInvulnerable = false;
        this.isCharging = false;
        this.canAttack = true;
        this.damageMultiplier = 1.0;
        this.damageReduction = 0;
        this.manaShield = false;
        this.manaShieldFx = null;
        this.multishot = 0;
        this.multishotCount = 0;
        
        // Créer la classe
        this.createClass();
        
        // Créer les visuels
        this.createVisuals();
        
        // Ajouter à la scène
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.body.setCircle(18);
        this.body.setCollideWorldBounds(true);
    }
    
    createClass() {
        switch(this.config.class) {
            case 'WARRIOR':
                this.classData = new WarriorClass(this.scene, this);
                break;
            case 'MAGE':
                this.classData = new MageClass(this.scene, this);
                break;
            case 'ROGUE':
                this.classData = new RogueClass(this.scene, this);
                break;
            default:
                this.classData = new WarriorClass(this.scene, this);
        }
    }
    
    createVisuals() {
        const color = this.classData?.data?.color || 0x00d4ff;
        const glowColor = this.classData?.data?.glowColor || 0x88ddff;
        
        // Core
        const core = this.scene.add.circle(0, 0, 18, color);
        core.setStrokeStyle(2, 0xffffff);
        
        // Glow effects
        const innerGlow = this.scene.add.circle(0, 0, 22, color, 0.3);
        const outerGlow = this.scene.add.circle(0, 0, 28, color, 0.15);
        
        // Rings
        const ring1 = this.scene.add.circle(0, 0, 24, color, 0);
        ring1.setStrokeStyle(1.5, glowColor, 0.6);
        
        const ring2 = this.scene.add.circle(0, 0, 30, color, 0);
        ring2.setStrokeStyle(1, glowColor, 0.3);
        
        // Highlight
        const highlight = this.scene.add.circle(-4, -4, 5, 0xffffff, 0.3);
        
        this.add([outerGlow, innerGlow, core, ring1, ring2, highlight]);
        
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
        // Déléguer à la classe
        return this.classData?.dash(directionX, directionY) || false;
    }
    
    useSkill(index) {
        // Déléguer à la classe
        return this.classData?.useSkill(index) || false;
    }
    
    takeDamage(amount) {
        if (this.isInvulnerable) return 0;

        // Mana Shield: convert incoming damage to stamina loss first.
        if (this.manaShield) {
            const staminaDamage = amount;
            const staminaBeforeHit = this.stamina;
            this.stamina = Math.max(0, this.stamina - staminaDamage);

            // Shield breaks when stamina is depleted; any overflow damages health.
            if (this.stamina <= 0) {
                this.manaShield = false;

                if (this.manaShieldFx) {
                    this.scene.events.off('update', this.manaShieldFx.followHandler);
                    this.manaShieldFx.shield?.destroy();
                    this.manaShieldFx.runes?.forEach(rune => rune.destroy());
                    this.manaShieldFx = null;
                }

                const overflowDamage = Math.max(0, staminaDamage - staminaBeforeHit);
                if (overflowDamage > 0) {
                    const reducedOverflow = overflowDamage * (1 - this.damageReduction);
                    this.health = Math.max(0, this.health - reducedOverflow);
                }
            }

            this.scene.tweens.add({
                targets: this,
                alpha: 0.35,
                duration: 70,
                yoyo: true,
                repeat: 1
            });

            return 0;
        }
        
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
        // Animer les rings
        if (this.ring1) this.ring1.rotation += 0.01;
        if (this.ring2) this.ring2.rotation -= 0.005;
        
        // Mettre à jour la classe
        if (this.classData) {
            this.classData.update(Date.now(), 16);
        }
    }
}
