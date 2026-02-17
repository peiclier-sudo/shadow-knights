// Boss.js - Base boss entity
import { BOSSES } from '../data/BossData.js';

export class Boss extends Phaser.GameObjects.Container {
    constructor(scene, bossId, towerFloor = 1) {
        super(scene, scene.cameras.main.width * 0.85, scene.cameras.main.height * 0.5);
        
        this.scene = scene;
        this.bossData = BOSSES[bossId];
        this.bossId = bossId;
        this.towerFloor = towerFloor;
        
        // Stats
        this.healthScale = this.towerFloor >= 2 ? 1.9 : 1;
        this.attackCadenceScale = this.towerFloor >= 2 ? 0.72 : 1;
        this.damageScale = this.towerFloor >= 2 ? 1.6 : 1;
        this.health = Math.round(this.bossData.hp * this.healthScale);
        this.maxHealth = Math.round(this.bossData.hp * this.healthScale);
        this.isAttacking = false;
        this.nextAttackTime = 0;
        this.frozen = false;
        this.stunned = false;
        this.slowed = false;
        this.damageTakenMultiplier = 1.0;
        this.vulnerabilityTimer = null;
        
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

        } else if (this.bossId === 4) {
            // Phantom - The Echo Wraith
            // Ghostly wisps forming a tail
            const wispL = this.scene.add.ellipse(-16, 55, 18, 40, this.bossData.color, 0.35);
            const wispC = this.scene.add.ellipse(0, 62, 20, 46, this.bossData.color, 0.45);
            const wispR = this.scene.add.ellipse(16, 55, 18, 40, this.bossData.color, 0.35);

            // Semi-transparent floating body
            const body = this.scene.add.ellipse(0, 5, 58, 88, this.bossData.color, 0.68);
            body.setStrokeStyle(2, this.bossData.glowColor, 0.9);

            // Ghostly arm appendages
            const armL = this.scene.add.rectangle(-38, 12, 12, 36, this.bossData.secondaryColor, 0.5);
            const armR = this.scene.add.rectangle(38, 12, 12, 36, this.bossData.secondaryColor, 0.5);

            // Dark mask face
            const face = this.scene.add.circle(0, -28, 26, 0x001418, 0.88);
            face.setStrokeStyle(2, this.bossData.glowColor, 0.7);

            // Glowing teal eyes
            const eyeL = this.scene.add.ellipse(-9, -28, 10, 13, this.bossData.glowColor, 1.0);
            const eyeR = this.scene.add.ellipse(9, -28, 10, 13, this.bossData.glowColor, 1.0);

            // Bright white pupils
            const pupilL = this.scene.add.circle(-9, -28, 3, 0xffffff, 0.9);
            const pupilR = this.scene.add.circle(9, -28, 3, 0xffffff, 0.9);

            this.add([wispL, wispC, wispR, body, armL, armR, face, eyeL, eyeR, pupilL, pupilR]);

            // Animate wisps floating downward
            [wispL, wispC, wispR].forEach((wisp, i) => {
                this.scene.tweens.add({
                    targets: wisp,
                    y: wisp.y + 10,
                    scaleX: 0.8,
                    alpha: 0.12,
                    duration: 900 + i * 180,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            });

            // Body float up/down
            this.scene.tweens.add({
                targets: body,
                y: body.y - 7,
                duration: 1600,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            // Eyes pulse
            this.scene.tweens.add({
                targets: [eyeL, eyeR],
                alpha: 0.25,
                duration: 700,
                yoyo: true,
                repeat: -1
            });
        } else if (this.bossId === 5) {
            // Nebula - The Void Architect
            const outerRing = this.scene.add.circle(0, 0, 44, this.bossData.secondaryColor, 0.42);
            outerRing.setStrokeStyle(3, this.bossData.glowColor, 0.85);

            const body = this.scene.add.ellipse(0, 0, 60, 82, this.bossData.color, 0.78);
            body.setStrokeStyle(2, this.bossData.glowColor, 0.95);

            const core = this.scene.add.circle(0, -8, 13, 0xffffff, 0.95);
            const eyeL = this.scene.add.circle(-10, -20, 5, this.bossData.glowColor, 0.95);
            const eyeR = this.scene.add.circle(10, -20, 5, this.bossData.glowColor, 0.95);

            const shardTop = this.scene.add.triangle(0, -56, 0, -70, -8, -50, 8, -50, this.bossData.glowColor, 0.9);
            const shardLeft = this.scene.add.triangle(-46, -2, -60, -2, -40, -12, -40, 8, this.bossData.glowColor, 0.8);
            const shardRight = this.scene.add.triangle(46, -2, 60, -2, 40, -12, 40, 8, this.bossData.glowColor, 0.8);

            this.add([outerRing, body, core, eyeL, eyeR, shardTop, shardLeft, shardRight]);

            this.scene.tweens.add({
                targets: outerRing,
                angle: 360,
                duration: 4000,
                repeat: -1,
                ease: 'Linear'
            });

            this.scene.tweens.add({
                targets: [eyeL, eyeR],
                alpha: 0.35,
                duration: 600,
                yoyo: true,
                repeat: -1
            });

            this.scene.tweens.add({
                targets: body,
                y: -6,
                duration: 1400,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        } else if (this.bossId === 6) {
            // Overclock - The Chrono Tyrant
            const body = this.scene.add.rectangle(0, 0, 62, 92, this.bossData.color, 0.8);
            body.setStrokeStyle(3, this.bossData.glowColor, 1);

            const core = this.scene.add.circle(0, -8, 14, 0xffffff, 0.95);
            const ring = this.scene.add.ellipse(0, -8, 56, 56, this.bossData.secondaryColor, 0.35);
            ring.setStrokeStyle(2, this.bossData.glowColor, 0.95);

            const hornL = this.scene.add.triangle(-24, -56, -38, -42, -12, -42, -24, -68, this.bossData.glowColor, 0.85);
            const hornR = this.scene.add.triangle(24, -56, 12, -42, 38, -42, 24, -68, this.bossData.glowColor, 0.85);

            const legL = this.scene.add.rectangle(-16, 48, 12, 28, this.bossData.secondaryColor, 0.7);
            const legR = this.scene.add.rectangle(16, 48, 12, 28, this.bossData.secondaryColor, 0.7);

            this.add([body, core, ring, hornL, hornR, legL, legR]);

            this.scene.tweens.add({
                targets: ring,
                angle: 360,
                duration: 1800,
                repeat: -1,
                ease: 'Linear'
            });

            this.scene.tweens.add({
                targets: [hornL, hornR],
                y: '-=3',
                duration: 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        } else if (this.bossId === 7) {
            // Vortex - The Event Horizon
            const body = this.scene.add.circle(0, 0, 34, this.bossData.color, 0.78);
            body.setStrokeStyle(2, this.bossData.glowColor, 1);

            const ring1 = this.scene.add.ellipse(0, 0, 78, 48, this.bossData.secondaryColor, 0.35);
            const ring2 = this.scene.add.ellipse(0, 0, 96, 58, this.bossData.secondaryColor, 0.22);
            ring1.setStrokeStyle(2, this.bossData.glowColor, 0.85);
            ring2.setStrokeStyle(2, this.bossData.glowColor, 0.6);

            const eye = this.scene.add.circle(0, -6, 8, 0xffffff, 0.9);

            this.add([ring2, ring1, body, eye]);

            this.scene.tweens.add({
                targets: ring1,
                angle: 360,
                duration: 1800,
                repeat: -1,
                ease: 'Linear'
            });

            this.scene.tweens.add({
                targets: ring2,
                angle: -360,
                duration: 2300,
                repeat: -1,
                ease: 'Linear'
            });
        } else if (this.bossId === 8) {
            // Ember Crown - The Ash Sovereign
            const body = this.scene.add.rectangle(0, 8, 66, 90, this.bossData.color, 0.8);
            body.setStrokeStyle(3, this.bossData.glowColor, 0.95);

            const crown = this.scene.add.triangle(0, -58, -26, -42, 0, -74, 26, -42, this.bossData.glowColor, 0.9);
            const core = this.scene.add.circle(0, -12, 11, 0xfff0e6, 0.95);
            const armL = this.scene.add.rectangle(-40, 10, 12, 34, this.bossData.secondaryColor, 0.75);
            const armR = this.scene.add.rectangle(40, 10, 12, 34, this.bossData.secondaryColor, 0.75);

            this.add([body, crown, core, armL, armR]);

            this.scene.tweens.add({
                targets: crown,
                y: '-=4',
                duration: 500,
                yoyo: true,
                repeat: -1
            });

            this.scene.tweens.add({
                targets: [armL, armR],
                angle: 7,
                duration: 400,
                yoyo: true,
                repeat: -1
            });
        } else if (this.bossId === 9) {
            // Aurora Judge - The Final Arbiter
            const body = this.scene.add.ellipse(0, 6, 70, 96, this.bossData.color, 0.76);
            body.setStrokeStyle(3, this.bossData.glowColor, 0.95);

            const halo = this.scene.add.ellipse(0, -50, 72, 22, this.bossData.secondaryColor, 0.34);
            halo.setStrokeStyle(2, this.bossData.glowColor, 0.95);

            const crystalL = this.scene.add.triangle(-34, -10, -48, -10, -24, -24, -24, 4, this.bossData.glowColor, 0.9);
            const crystalR = this.scene.add.triangle(34, -10, 48, -10, 24, -24, 24, 4, this.bossData.glowColor, 0.9);
            const core = this.scene.add.circle(0, -10, 12, 0xffffff, 0.95);

            this.add([body, halo, crystalL, crystalR, core]);

            this.scene.tweens.add({
                targets: halo,
                angle: 360,
                duration: 2600,
                repeat: -1,
                ease: 'Linear'
            });

            this.scene.tweens.add({
                targets: [crystalL, crystalR],
                alpha: 0.35,
                duration: 500,
                yoyo: true,
                repeat: -1
            });
        } else if (this.bossId === 10) {
            // Null King - The Last Seal
            const body = this.scene.add.rectangle(0, 0, 68, 98, this.bossData.color, 0.78);
            body.setStrokeStyle(3, this.bossData.glowColor, 0.95);
            const mask = this.scene.add.rectangle(0, -22, 40, 28, this.bossData.secondaryColor, 0.9);
            const eyeL = this.scene.add.circle(-10, -22, 4, this.bossData.glowColor, 0.95);
            const eyeR = this.scene.add.circle(10, -22, 4, this.bossData.glowColor, 0.95);
            const plateL = this.scene.add.rectangle(-40, 6, 12, 30, this.bossData.secondaryColor, 0.75);
            const plateR = this.scene.add.rectangle(40, 6, 12, 30, this.bossData.secondaryColor, 0.75);
            this.add([body, mask, eyeL, eyeR, plateL, plateR]);

            this.scene.tweens.add({
                targets: [eyeL, eyeR],
                alpha: 0.3,
                duration: 450,
                yoyo: true,
                repeat: -1
            });

            this.scene.tweens.add({
                targets: [plateL, plateR],
                y: '+=4',
                duration: 600,
                yoyo: true,
                repeat: -1
            });
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
    


    adjustCooldown(baseCooldownMs) {
        return Math.max(350, Math.round(baseCooldownMs * (this.attackCadenceScale || 1)));
    }

    dealDamage(player, amount) {
        if (!player) return;
        player.takeDamage(Math.round(amount * (this.damageScale || 1)));
    }

    setTint(color) {
        this.list.forEach((child) => {
            if (child && typeof child.setTint === 'function') {
                child.setTint(color);
            }
        });
        return this;
    }

    clearTint() {
        this.list.forEach((child) => {
            if (child && typeof child.clearTint === 'function') {
                child.clearTint();
            }
        });
        return this;
    }

    takeDamage(amount) {
        // ✅ FIX: Appliquer les dégâts directement sans multiplicateurs
        const finalDamage = Math.round(amount * (this.damageTakenMultiplier || 1.0));
        
        // Appliquer les dégâts
        this.health = Math.max(0, this.health - finalDamage);
        
        // Debug
        console.log(`Boss took ${finalDamage} damage. Health: ${this.health}/${this.maxHealth}`);
        
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
                            this.dealDamage(player, 20);
                        }
                        this.isAttacking = false;
                    }
                });
            }
        });
    }
    
    update(time, player) {
        // Smoke Bomb: boss cannot target player while untargetable
        if (player?.untargetable) {
            this.isAttacking = false;
            return;
        }

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
