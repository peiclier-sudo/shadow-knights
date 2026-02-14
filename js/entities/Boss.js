// Boss.js - Base boss entity
import { BOSSES } from '../data/BossData.js';

export class Boss extends Phaser.GameObjects.Container {
    constructor(scene, bossId) {
        super(scene, scene.cameras.main.width * 0.85, scene.cameras.main.height * 0.5);
        
        this.scene = scene;
        this.bossData = BOSSES[bossId];
        this.bossId = bossId;
        
        // Stats
        this.health = this.bossData.hp;
        this.maxHealth = this.bossData.hp;
        this.isAttacking = false;
        this.nextAttackTime = 0;
        this.frozen = false;
        
        // Create visuals
        this.createVisuals();
        
        // Add to scene
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.body.setSize(70, 130);
        this.body.setCollideWorldBounds(true);
        this.body.setImmovable(true);
    }
    
    createVisuals() {
        if (this.bossId === 1) {
            // Sentinel
            const body = this.scene.add.rectangle(0, 0, 70, 100, this.bossData.color);
            body.setStrokeStyle(3, this.bossData.glowColor);
            
            const head = this.scene.add.circle(0, -60, 25, this.bossData.color);
            head.setStrokeStyle(2, this.bossData.glowColor);
            
            const visor = this.scene.add.rectangle(0, -65, 20, 5, this.bossData.glowColor);
            
            const shoulderL = this.scene.add.circle(-35, -30, 15, this.bossData.secondaryColor);
            const shoulderR = this.scene.add.circle(35, -30, 15, this.bossData.secondaryColor);
            
            this.add([body, head, visor, shoulderL, shoulderR]);
            
        } else if (this.bossId === 2) {
            // Gunner
            const body = this.scene.add.rectangle(0, 0, 60, 90, this.bossData.color);
            body.setStrokeStyle(3, this.bossData.glowColor);
            
            const head = this.scene.add.rectangle(0, -50, 40, 30, this.bossData.color);
            head.setStrokeStyle(2, this.bossData.glowColor);
            
            const gunL = this.scene.add.rectangle(-35, -10, 20, 10, this.bossData.secondaryColor);
            const gunR = this.scene.add.rectangle(35, -10, 20, 10, this.bossData.secondaryColor);
            
            const barrelL = this.scene.add.rectangle(-45, -10, 15, 5, this.bossData.glowColor);
            const barrelR = this.scene.add.rectangle(45, -10, 15, 5, this.bossData.glowColor);
            
            this.add([body, head, gunL, gunR, barrelL, barrelR]);
            
        } else if (this.bossId === 3) {
            // Dasher
            const body = this.scene.add.ellipse(0, 0, 70, 100, this.bossData.color);
            body.setStrokeStyle(3, this.bossData.glowColor);
            
            const head = this.scene.add.circle(0, -60, 25, this.bossData.color);
            head.setStrokeStyle(2, this.bossData.glowColor);
            
            const bladeL = this.scene.add.triangle(-35, -20, -45, -30, -45, -10, this.bossData.glowColor);
            const bladeR = this.scene.add.triangle(35, -20, 45, -30, 45, -10, this.bossData.glowColor);
            
            const visor = this.scene.add.rectangle(0, -65, 30, 5, 0xff0000);
            
            this.add([body, head, bladeL, bladeR, visor]);
        }
        
        // Add glow effects
        this.glow1 = this.scene.add.circle(this.x, this.y, 90, this.bossData.glowColor, 0.2);
        this.glow2 = this.scene.add.circle(this.x, this.y, 120, this.bossData.glowColor, 0.1);
        
        this.scene.tweens.add({
            targets: this.glow1,
            scale: 1.1,
            alpha: 0.15,
            duration: 1200,
            yoyo: true,
            repeat: -1
        });
        
        this.scene.tweens.add({
            targets: this.glow2,
            scale: 1.2,
            alpha: 0.08,
            duration: 1600,
            yoyo: true,
            repeat: -1
        });
    }
    
    takeDamage(amount) {
        if (this.frozen) {
            amount *= 1.5; // Bonus damage when frozen
        }
        
        this.health = Math.max(0, this.health - amount);
        
        // Visual feedback
        this.scene.tweens.add({
            targets: this,
            alpha: 0.3,
            duration: 50,
            yoyo: true
        });
        
        // Damage number
        const dmgText = this.scene.add.text(this.x, this.y - 50, Math.floor(amount).toString(), {
            fontSize: '24px',
            fill: '#ffaa00',
            stroke: '#000',
            strokeThickness: 4,
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: dmgText,
            y: this.y - 100,
            alpha: 0,
            duration: 500,
            onComplete: () => dmgText.destroy()
        });
    }
    
    update(time, player) {
        // Update glow positions
        if (this.glow1) {
            this.glow1.x = this.x;
            this.glow1.y = this.y;
        }
        if (this.glow2) {
            this.glow2.x = this.x;
            this.glow2.y = this.y;
        }
        
        // Don't attack if frozen
        if (this.frozen) return;
    }
}