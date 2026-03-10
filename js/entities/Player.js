// Player.js - Player entity
import { WarriorClass } from '../classes/WarriorClass.js';
import { MageClass } from '../classes/MageClass.js';
import { RogueClass } from '../classes/RogueClass.js';
import { CharacterRenderer3D } from '../utils/CharacterRenderer3D.js';

export class Player extends Phaser.GameObjects.Container {
    constructor(scene, config) {
        super(scene, scene.cameras.main.width * 0.3, scene.cameras.main.height * 0.65);

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
        this.passiveDamageMultiplier = 1.0;
        this.damageReduction = 0;
        this.manaShield = false;
        this.manaShieldFx = null;
        this.multishot = 0;
        this.multishotCount = 0;
        this.backstabReady = false;
        this.untargetable = false;
        this.critChanceBonus = 0;
        this.autoChargedNextHit = false;

        // Ultimate gauge (future weapon ultimate skill)
        this.ultimateGauge = 0;
        this.ultimateGaugeMax = 100;

        // Track previous position for facing direction
        this._prevX = this.x;
        this._prevY = this.y;

        // Créer la classe
        this.createClass();

        // Créer les visuels (fallback 2D circles, replaced once 3D loads)
        this.createVisuals();

        // Initialize 3D character renderer
        this._init3DCharacter();

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
        // Ground shadow beneath the character (very flat for low 3/4 perspective)
        const shadow = this.scene.add.ellipse(0, 22, 56, 10, 0x000000, 0.45);
        this.add([shadow]);
        this.shadow = shadow;

        // The 3D sprite will be added once the model loads (see _init3DCharacter)
        this.core = null;
        this.ring1 = null;
        this.ring2 = null;
    }

    _init3DCharacter() {
        const SPRITE_SIZE = 128;
        const DISPLAY_SIZE = 64;

        // Class-specific 3D model and animation mapping
        const MODEL_CONFIG = {
            ROGUE:   { model: 'RogueV3.glb',            runAnim: 'RunFast',      idleAnim: 'Idle' },
            MAGE:    { model: '3K Character Mage.glb',   runAnim: 'Fast running', idleAnim: 'Idle' },
            WARRIOR: { model: 'RogueV3.glb',            runAnim: 'RunFast',      idleAnim: 'Idle' }  // fallback until warrior model exists
        };

        const classKey = (this.config.class || 'WARRIOR').toUpperCase();
        const cfg = MODEL_CONFIG[classKey] || MODEL_CONFIG.WARRIOR;
        this._runAnimName = cfg.runAnim;
        this._idleAnimName = cfg.idleAnim;

        this.charRenderer = new CharacterRenderer3D({
            size: SPRITE_SIZE,
            modelPath: cfg.model,
            animationName: cfg.idleAnim
        });

        const texKey = '__char3d_' + Date.now();
        this._charTexKey = texKey;

        this.charRenderer.load().then(() => {
            if (!this.scene || !this.scene.textures) return;

            // Create a Phaser CanvasTexture we can update every frame
            this._canvasTex = this.scene.textures.createCanvas(texKey, SPRITE_SIZE, SPRITE_SIZE);

            // Initial render
            this.charRenderer.render();
            this._canvasTex.context.drawImage(this.charRenderer.canvas, 0, 0);
            this._canvasTex.refresh();

            this._charSprite = this.scene.add.image(0, -10, texKey); // offset up for 3/4 view (feet at shadow)
            this._charSprite.setDisplaySize(DISPLAY_SIZE, DISPLAY_SIZE);
            this.add(this._charSprite);
            this.bringToTop(this._charSprite);
            this._char3DReady = true;
        }).catch(err => {
            console.warn('3D character failed to load, keeping fallback visuals:', err);
        });
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

        if (typeof this.classData?.onTakeDamage === 'function') {
            this.classData.onTakeDamage();
        }

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

        // Screen shake + red flash via GameScene
        this.scene._triggerDamageFeedback?.();

        return reducedAmount;
    }
    
    regenerateStamina() {
        if (this.stamina < this.maxStamina) {
            this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRegen);
        }
    }
    
    update() {
        // Update 3D character: facing direction, animation, re-render each frame
        if (this._char3DReady && this.charRenderer && this._canvasTex) {
            const dx = this.x - this._prevX;
            const dy = this.y - this._prevY;
            const isMoving = Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5;

            // Update facing when moving
            if (isMoving) {
                this.charRenderer.setFacing(Math.atan2(dy, dx));
            }

            // Switch between Run and Idle based on movement
            const runAnim = this._runAnimName || 'RunFast';
            const idleAnim = this._idleAnimName || 'Idle';
            if (isMoving && this._currentAnim !== runAnim) {
                this.charRenderer.playAnimation(runAnim);
                this._currentAnim = runAnim;
            } else if (!isMoving && this._currentAnim !== idleAnim) {
                this.charRenderer.playAnimation(idleAnim);
                this._currentAnim = idleAnim;
            }

            this._prevX = this.x;
            this._prevY = this.y;

            // Re-render 3D model and copy to Phaser canvas texture
            this.charRenderer.render();
            const ctx = this._canvasTex.context;
            ctx.clearRect(0, 0, this._canvasTex.width, this._canvasTex.height);
            ctx.drawImage(this.charRenderer.canvas, 0, 0);
            this._canvasTex.refresh();
        }

        // Mettre à jour la classe
        if (this.classData) {
            this.classData.update(Date.now(), 16);
        }
    }
}
