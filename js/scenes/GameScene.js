// GameScene.js - Main gameplay scene
import { Player } from '../entities/Player.js';
import { BossFactory } from '../entities/BossFactory.js';
import { WEAPONS } from '../weapons/weaponData.js';
import { GameData } from '../data/GameData.js';
import { ParticleManager } from '../effects/ParticleManager.js';
import { ShakeEffect } from '../effects/ShakeEffect.js';
import { FlashEffect } from '../effects/FlashEffect.js';
import { UIManager } from '../ui/UIManager.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }
    
    init(data) {
        this.playerConfig = data.playerConfig || {
            class: 'WARRIOR',
            weapon: 'SWORD'
        };
        this.bossId = data.bossId || GameData.currentBossId;
    }
    
    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Background with gradient
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x0a0a14, 0x1a1a2e, 0x0a0a14, 0x1a1a2e, 1);
        bg.fillRect(0, 0, width, height);
        
        // Neon grid
        this.createNeonGrid();
        
        // Initialize managers
        this.particleManager = new ParticleManager(this);
        this.shakeEffect = new ShakeEffect(this);
        this.flashEffect = new FlashEffect(this);
        
        // Create player
        this.player = new Player(this, this.playerConfig);
        
        // Create boss
        this.boss = BossFactory.createBoss(this, this.bossId);
        
        // Projectile arrays
        this.projectiles = [];
        this.bossProjectiles = [];
        
        // Weapon data
        this.weaponData = WEAPONS[this.playerConfig.weapon];
        
        // Charging state
        this.isCharging = false;
        this.chargeLevel = 0;
        this.chargeStartTime = 0;
        
        // Setup input
        this.setupInput();
        
        // Setup UI
        this.uiManager = new UIManager(this);
        
        // Camera
        this.cameras.main.startFollow(this.player, true, 0.05, 0.05);
        this.cameras.main.setBounds(0, 0, width, height);
    }
    
    createNeonGrid() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const graphics = this.add.graphics();
        
        // Horizontal lines
        for (let i = 0; i < height; i += 50) {
            graphics.lineStyle(1, 0x00d4ff, 0.1);
            graphics.lineBetween(0, i, width, i);
        }
        
        // Vertical lines
        for (let i = 0; i < width; i += 50) {
            graphics.lineStyle(1, 0x00d4ff, 0.1);
            graphics.lineBetween(i, 0, i, height);
        }
    }
    
    setupInput() {
        this.input.mouse.disableContextMenu();
        
        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                this.leftMouseDown = true;
                this.mouseX = pointer.x;
                this.mouseY = pointer.y;
            }
            
            if (pointer.rightButtonDown()) {
                this.rightMouseDown = true;
                this.aimStartX = this.player.x;
                this.aimStartY = this.player.y;
                this.mouseX = pointer.x;
                this.mouseY = pointer.y;
                
                if (this.player.stamina >= 30 && !this.player.isDashing) {
                    this.startCharge();
                }
            }
        });
        
        this.input.on('pointermove', (pointer) => {
            this.mouseX = pointer.x;
            this.mouseY = pointer.y;
            
            if (this.isCharging) {
                const elapsed = Date.now() - this.chargeStartTime;
                this.chargeLevel = Math.min(1, elapsed / this.weaponData.charged.chargeTime);
            }
        });
        
        this.input.on('pointerup', (pointer) => {
            if (pointer.button === 0) {
                this.leftMouseDown = false;
            }
            
            if (pointer.button === 2) {
                if (this.isCharging) {
                    this.releaseCharge();
                } else if (this.rightMouseDown && this.player.canAttack && this.player.stamina >= 7) {
                    this.shootProjectile();
                }
                this.rightMouseDown = false;
            }
        });
        
        this.input.keyboard.on('keydown-SPACE', () => {
            this.performDash();
        });
    }
    
    startCharge() {
        if (this.player.body.velocity.x !== 0 || this.player.body.velocity.y !== 0) {
            return;
        }
        
        this.isCharging = true;
        this.player.isCharging = true;
        this.chargeStartTime = Date.now();
        this.chargeLevel = 0;
        
        this.chargeGraphics = this.add.graphics();
    }
    
    releaseCharge() {
        if (!this.isCharging) return;
        
        this.isCharging = false;
        this.player.isCharging = false;
        
        if (this.chargeGraphics) {
            this.chargeGraphics.destroy();
        }
        
        if (this.chargeLevel < 0.3) {
            this.shootProjectile();
            return;
        }
        
        // Charged attack
        const angle = Math.atan2(this.mouseY - this.player.y, this.mouseX - this.player.x);
        this.player.stamina -= this.weaponData.charged.staminaCost;
        
        // Different charged attacks per weapon
        switch(this.playerConfig.weapon) {
            case 'SWORD':
                this.whirlwindAttack();
                break;
            case 'STAFF':
                this.fireballAttack(angle);
                break;
            case 'BOW':
                this.rainOfArrows();
                break;
            case 'DAGGERS':
                this.poisonCloud();
                break;
            case 'GREATSWORD':
                this.groundSlam();
                break;
            default:
                this.shootProjectile();
        }
        
        this.flashEffect.flash(0xffffff, 150, 0.5);
        this.shakeEffect.shakeLight();
    }
    
    whirlwindAttack() {
        const charged = this.weaponData.charged;
        
        for (let i = 0; i < 3; i++) {
            this.time.delayedCall(i * 200, () => {
                const hitbox = this.add.circle(this.player.x, this.player.y, charged.radius, 0xffaa00, 0.5);
                
                const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.boss.x, this.boss.y);
                if (dist < charged.radius) {
                    this.boss.takeDamage(charged.damage / 3);
                    this.particleManager.createHitEffect(this.boss.x, this.boss.y, 0xffaa00);
                }
                
                this.tweens.add({
                    targets: hitbox,
                    alpha: 0,
                    scale: 1.5,
                    duration: 200,
                    onComplete: () => hitbox.destroy()
                });
            });
        }
    }
    
    fireballAttack(angle) {
        const charged = this.weaponData.charged;
        
        const fireball = this.add.circle(this.player.x, this.player.y, 20, 0xff6600);
        
        this.tweens.add({
            targets: fireball,
            x: this.boss.x,
            y: this.boss.y,
            duration: 400,
            ease: 'Power2',
            onComplete: () => {
                const explosion = this.add.circle(this.boss.x, this.boss.y, charged.radius, 0xff6600, 0.7);
                this.boss.takeDamage(charged.damage);
                this.particleManager.createExplosion(this.boss.x, this.boss.y, 0xff6600);
                
                this.tweens.add({
                    targets: explosion,
                    alpha: 0,
                    scale: 1.5,
                    duration: 300,
                    onComplete: () => explosion.destroy()
                });
                fireball.destroy();
            }
        });
    }
    
    rainOfArrows() {
        const charged = this.weaponData.charged;
        
        for (let i = 0; i < charged.arrows; i++) {
            this.time.delayedCall(i * 100, () => {
                const x = this.boss.x + (Math.random() - 0.5) * charged.radius * 2;
                const y = this.boss.y + (Math.random() - 0.5) * charged.radius * 2;
                
                const arrow = this.add.rectangle(x, y - 50, 4, 15, 0x88dd88);
                
                this.tweens.add({
                    targets: arrow,
                    y: y,
                    duration: 200,
                    onComplete: () => {
                        const dist = Phaser.Math.Distance.Between(x, y, this.boss.x, this.boss.y);
                        if (dist < 30) {
                            this.boss.takeDamage(charged.damage);
                            this.particleManager.createHitEffect(x, y, 0x88dd88);
                        }
                        arrow.destroy();
                    }
                });
            });
        }
    }
    
    poisonCloud() {
        const charged = this.weaponData.charged;
        
        const cloud = this.add.circle(this.boss.x, this.boss.y, charged.radius, 0x88aa88, 0.3);
        
        let tickCount = 0;
        const interval = setInterval(() => {
            if (tickCount >= 5) {
                clearInterval(interval);
                cloud.destroy();
                return;
            }
            
            this.boss.takeDamage(charged.damage);
            this.boss.setTint(0x88aa88);
            this.time.delayedCall(100, () => this.boss.clearTint());
            
            tickCount++;
        }, 500);
    }
    
    groundSlam() {
        const charged = this.weaponData.charged;
        
        this.shakeEffect.shakeHeavy();
        
        const slamWave = this.add.circle(this.player.x, this.player.y, 30, 0xcc6600, 0.7);
        
        this.tweens.add({
            targets: slamWave,
            radius: charged.radius,
            alpha: 0,
            duration: 300,
            onComplete: () => slamWave.destroy()
        });
        
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.boss.x, this.boss.y);
        if (dist < charged.radius) {
            this.boss.takeDamage(charged.damage);
            this.particleManager.createHitEffect(this.boss.x, this.boss.y, 0xcc6600);
        }
    }
    
    shootProjectile() {
        if (this.player.stamina < 7 || !this.player.canAttack) return;
        
        this.player.stamina -= 7;
        this.player.canAttack = false;
        
        const angle = Math.atan2(this.mouseY - this.player.y, this.mouseX - this.player.x);
        const projectileData = this.weaponData.projectile;
        
        if (projectileData.count > 1) {
            const spread = projectileData.spread || 0.2;
            for (let i = 0; i < projectileData.count; i++) {
                const offset = (i - (projectileData.count - 1) / 2) * spread;
                this.createProjectile(angle + offset, projectileData);
            }
        } else {
            this.createProjectile(angle, projectileData);
        }
        
        this.time.delayedCall(250, () => {
            this.player.canAttack = true;
        });
    }
    
    createProjectile(angle, data) {
        const startX = this.player.x + Math.cos(angle) * 30;
        const startY = this.player.y + Math.sin(angle) * 30;
        
        let projectile;
        
        switch(data.type) {
            case 'arrow':
                projectile = new ArrowProjectile(this, startX, startY, angle, data);
                break;
            case 'spread':
                projectile = new Projectile(this, startX, startY, angle, data);
                break;
            default:
                projectile = new Projectile(this, startX, startY, angle, data);
        }
        
        this.projectiles.push(projectile);
        return projectile;
    }
    
    performDash() {
        const direction = { x: 1, y: 0 };
        
        if (this.leftMouseDown) {
            const dx = this.mouseX - this.player.x;
            const dy = this.mouseY - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 5) {
                direction.x = dx / dist;
                direction.y = dy / dist;
            }
        }
        
        this.player.dash(direction.x, direction.y);
        this.particleManager.createDashEffect(this.player.x, this.player.y, this.player.classData.color);
    }
    
    update(time, delta) {
        // Player movement
        if (this.leftMouseDown && !this.isCharging) {
            const dx = this.mouseX - this.player.x;
            const dy = this.mouseY - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 10) {
                const speed = this.player.speed;
                this.player.move(
                    (dx / dist) * speed,
                    (dy / dist) * speed
                );
            } else {
                this.player.move(0, 0);
            }
        } else {
            this.player.move(0, 0);
        }
        
        // Update entities
        this.player.update();
        this.player.regenerateStamina();
        this.boss.update(time, this.player);
        
        // Update charge indicator
        if (this.isCharging && this.chargeGraphics) {
            this.chargeGraphics.clear();
            const radius = 30 + this.chargeLevel * 40;
            this.chargeGraphics.lineStyle(4, 0xffaa00, 0.8);
            this.chargeGraphics.strokeCircle(this.player.x, this.player.y, radius);
        }
        
        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.update(delta);
            
            const dist = Phaser.Math.Distance.Between(proj.x, proj.y, this.boss.x, this.boss.y);
            if (dist < 50) {
                this.boss.takeDamage(proj.damage);
                this.particleManager.createHitEffect(this.boss.x, this.boss.y);
                proj.destroy();
                this.projectiles.splice(i, 1);
                continue;
            }
            
            if (proj.isOffScreen()) {
                proj.destroy();
                this.projectiles.splice(i, 1);
            }
        }
        
        // Update boss projectiles
        for (let i = this.bossProjectiles.length - 1; i >= 0; i--) {
            const proj = this.bossProjectiles[i];
            proj.x += proj.vx * (delta / 1000);
            proj.y += proj.vy * (delta / 1000);
            
            if (proj.glow) {
                proj.glow.x = proj.x;
                proj.glow.y = proj.y;
            }
            
            const dist = Phaser.Math.Distance.Between(proj.x, proj.y, this.player.x, this.player.y);
            if (dist < 25 && !this.player.isInvulnerable) {
                this.player.takeDamage(10);
                this.particleManager.createHitEffect(this.player.x, this.player.y, 0xff0000);
                
                if (proj.glow) proj.glow.destroy();
                proj.destroy();
                this.bossProjectiles.splice(i, 1);
                continue;
            }
            
            if (proj.isOffScreen) {
                if (proj.glow) proj.glow.destroy();
                proj.destroy();
                this.bossProjectiles.splice(i, 1);
            }
        }
        
        // Update UI
        this.uiManager.update(this.player, this.boss);
        
        // Check game over
        if (this.player.health <= 0) {
            this.cameras.main.fade(1000, 0, 0, 0);
            this.time.delayedCall(1000, () => {
                this.scene.start('GameOverScene', { victory: false });
            });
        } else if (this.boss.health <= 0) {
            GameData.unlockNextBoss();
            this.cameras.main.fade(1000, 255, 255, 255);
            this.time.delayedCall(1000, () => {
                this.scene.start('GameOverScene', { 
                    victory: true,
                    bossId: this.bossId
                });
            });
        }
    }
}