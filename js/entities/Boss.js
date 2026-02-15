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
        this.stunned = false;
        this.slowed = false;
        
        // Defense multiplier (pour debug)
        this.defenseMultiplier = 1.0;
        
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
        // Appliquer les multiplicateurs
        let finalDamage = amount;
        
        if (this.frozen) {
            finalDamage *= 1.5; // Bonus dégâts quand gelé
        }
        
        if (this.stunned) {
            finalDamage *= 1.3; // Bonus dégâts quand étourdi
        }
        
        // Appliquer la défense (si jamais)
        finalDamage *= this.defenseMultiplier;
        
        // Arrondir pour éviter les décimales
        finalDamage = Math.round(finalDamage);
        
        // Appliquer les dégâts
        this.health = Math.max(0, this.health - finalDamage);
        
        // Debug
        console.log(`Boss took ${finalDamage} damage (original: ${amount}). Health: ${this.health}/${this.maxHealth}`);
        
        // Visual feedback
        this.scene.tweens.add({
            targets: this,
            alpha: 0.3,
            duration: 50,
            yoyo: true
        });
        
        // Damage number
        const dmgText = this.scene.add.text(this.x, this.y - 50, finalDamage.toString(), {
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
        
        return finalDamage;
    }
    
    attack(player) {
        if (this.isAttacking || this.frozen || this.stunned) return;
        
        this.isAttacking = true;
        
        // Different attacks per boss
        switch(this.bossId) {
            case 1:
                this.slashAttack(player);
                break;
            case 2:
                this.spreadShot(player);
                break;
            case 3:
                this.dashAttack(player);
                break;
        }
    }
    
    slashAttack(player) {
        const warning = this.scene.add.rectangle(this.x - 100, this.y, 180, 150, 0xff0051, 0.3);
        warning.setStrokeStyle(4, 0xff3366);
        
        this.scene.tweens.add({
            targets: warning,
            alpha: 0.6,
            duration: 600,
            yoyo: true,
            onComplete: () => {
                warning.destroy();
                
                const slashZone = this.scene.add.rectangle(this.x - 100, this.y, 180, 150, 0xff6666, 0.7);
                
                const dist = Phaser.Math.Distance.Between(player.x, player.y, this.x, this.y);
                if (dist < 120 && !player.isInvulnerable) {
                    player.takeDamage(15);
                }
                
                this.scene.tweens.add({
                    targets: slashZone,
                    alpha: 0,
                    duration: 150,
                    onComplete: () => {
                        slashZone.destroy();
                        this.isAttacking = false;
                    }
                });
            }
        });
    }
    
    spreadShot(player) {
        const warning = this.scene.add.circle(this.x, this.y, 45, 0xff6600, 0.3);
        warning.setStrokeStyle(4, 0xff8833);
        
        this.scene.tweens.add({
            targets: warning,
            radius: 65,
            alpha: 0,
            duration: 600,
            onComplete: () => {
                warning.destroy();
                
                const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
                
                for (let i = -2; i <= 2; i++) {
                    const angle = angleToPlayer + (i * 0.2);
                    const projectile = this.scene.add.circle(this.x, this.y, 8, 0xff6600);
                    projectile.setDepth(150);
                    projectile.vx = Math.cos(angle) * 350;
                    projectile.vy = Math.sin(angle) * 350;
                    
                    // Add glow
                    const glow = this.scene.add.circle(this.x, this.y, 14, 0xff6600, 0.3);
                    glow.setDepth(149);
                    projectile.glow = glow;
                    
                    this.scene.bossProjectiles.push(projectile);
                }
                
                this.isAttacking = false;
            }
        });
    }
    
    dashAttack(player) {
        const targetX = player.x;
        const targetY = player.y;
        
        const line = this.scene.add.line(0, 0, this.x, this.y, targetX, targetY, 0xcc00ff, 0.5);
        line.setLineWidth(6);
        
        const warnings = [];
        for (let i = 0.2; i <= 1; i += 0.2) {
            const warnX = this.x + (targetX - this.x) * i;
            const warnY = this.y + (targetY - this.y) * i;
            const warn = this.scene.add.circle(warnX, warnY, 20, 0xcc00ff, 0.3);
            warn.setStrokeStyle(2, 0xdd33ff);
            warnings.push(warn);
        }
        
        this.scene.tweens.add({
            targets: [...warnings, line],
            alpha: 0,
            duration: 400,
            onComplete: () => {
                line.destroy();
                warnings.forEach(w => w.destroy());
                
                this.scene.tweens.add({
                    targets: this,
                    x: targetX,
                    y: targetY,
                    duration: 100,
                    ease: 'Power3',
                    onUpdate: () => {
                        if (Math.random() > 0.5) {
                            const trail = this.scene.add.circle(this.x, this.y, 15, 0xcc00ff, 0.4);
                            this.scene.tweens.add({
                                targets: trail,
                                alpha: 0,
                                scale: 0.5,
                                duration: 200,
                                onComplete: () => trail.destroy()
                            });
                        }
                    },
                    onComplete: () => {
                        const dist = Phaser.Math.Distance.Between(player.x, player.y, this.x, this.y);
                        if (dist < 60 && !player.isInvulnerable) {
                            player.takeDamage(20);
                        }
                        this.isAttacking = false;
                    }
                });
            }
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
        
        // Don't attack if frozen or stunned
        if (this.frozen || this.stunned) return;
        
        // Attack cooldown
        if (time > this.nextAttackTime && !this.isAttacking) {
            this.attack(player);
            this.nextAttackTime = time + 2000;
        }
    }
}