// GameScene.js - Main gameplay scene (version stable)
import { Player } from '../entities/Player.js';
import { Boss } from '../entities/Boss.js';
import { GameData } from '../data/GameData.js';

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
        
        // Background
        this.add.rectangle(0, 0, width, height, 0x0a0a14).setOrigin(0);
        
        // Simple grid
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0x00d4ff, 0.1);
        for (let i = 0; i < width; i += 50) {
            graphics.lineBetween(i, 0, i, height);
        }
        for (let i = 0; i < height; i += 50) {
            graphics.lineBetween(0, i, width, i);
        }
        
        // Create player
        this.player = new Player(this, this.playerConfig);
        
        // Create boss
        this.boss = new Boss(this, this.bossId);
        
        // Projectile arrays
        this.projectiles = [];
        this.bossProjectiles = [];
        
        // Input state
        this.leftMouseDown = false;
        this.rightMouseDown = false;
        this.mouseX = 0;
        this.mouseY = 0;
        this.aimStartX = 0;
        this.aimStartY = 0;
        
        // Weapon data (simplified)
        this.weaponData = {
            projectile: {
                size: 10,
                speed: 800,
                damage: 18,
                color: 0x66ffff,
                count: 1
            }
        };
        
        // Aim line
        this.aimLine = this.add.graphics();
        
        // UI elements
        this.createUI();
        
        // Setup input
        this.setupInput();
        
        // Camera
        this.cameras.main.startFollow(this.player, true, 0.05, 0.05);
    }
    
    createUI() {
        const width = this.cameras.main.width;
        
        // Health bar
        this.healthBarBg = this.add.rectangle(20, 20, 300, 25, 0x333333);
        this.healthBarBg.setOrigin(0, 0.5);
        this.healthBar = this.add.rectangle(20, 20, 300, 25, 0x00ff88);
        this.healthBar.setOrigin(0, 0.5);
        
        // Stamina bar
        this.staminaBarBg = this.add.rectangle(20, 55, 250, 15, 0x333333);
        this.staminaBarBg.setOrigin(0, 0.5);
        this.staminaBar = this.add.rectangle(20, 55, 250, 15, 0xffaa00);
        this.staminaBar.setOrigin(0, 0.5);
        
        // Boss health bar
        this.bossHealthBarBg = this.add.rectangle(width - 350, 30, 300, 25, 0x333333);
        this.bossHealthBarBg.setOrigin(0, 0.5);
        this.bossHealthBar = this.add.rectangle(width - 350, 30, 300, 25, 0xff5555);
        this.bossHealthBar.setOrigin(0, 0.5);
    }
    
    setupInput() {
        this.input.mouse.disableContextMenu();
        
        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                this.leftMouseDown = true;
            }
            if (pointer.rightButtonDown()) {
                this.rightMouseDown = true;
                this.aimStartX = this.player.x;
                this.aimStartY = this.player.y;
            }
        });
        
        this.input.on('pointermove', (pointer) => {
            this.mouseX = pointer.x;
            this.mouseY = pointer.y;
        });
        
        this.input.on('pointerup', (pointer) => {
            if (pointer.button === 0) {
                this.leftMouseDown = false;
            }
            if (pointer.button === 2) {
                if (this.rightMouseDown) {
                    const angle = Math.atan2(
                        this.mouseY - this.aimStartY,
                        this.mouseX - this.aimStartX
                    );
                    this.shootProjectile(angle);
                }
                this.rightMouseDown = false;
            }
        });
        
        this.input.keyboard.on('keydown-SPACE', () => {
            this.performDash();
        });
    }
    
    shootProjectile(angle) {
        if (this.player.stamina < 7) return;
        
        this.player.stamina -= 7;
        
        const startX = this.player.x + Math.cos(angle) * 30;
        const startY = this.player.y + Math.sin(angle) * 30;
        
        // Simple projectile
        const proj = this.add.circle(startX, startY, 10, 0x66ffff);
        proj.vx = Math.cos(angle) * 800;
        proj.vy = Math.sin(angle) * 800;
        proj.damage = 18;
        
        this.projectiles.push(proj);
    }
    
    performDash() {
        // Simple dash forward
        const angle = Math.atan2(
            this.mouseY - this.player.y,
            this.mouseX - this.player.x
        );
        
        this.player.dash(Math.cos(angle), Math.sin(angle));
    }
    
    update(time, delta) {
        // Player movement (left click)
        if (this.leftMouseDown) {
            const dx = this.mouseX - this.player.x;
            const dy = this.mouseY - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 10) {
                this.player.move(
                    (dx / dist) * this.player.speed,
                    (dy / dist) * this.player.speed
                );
            } else {
                this.player.move(0, 0);
            }
        } else {
            this.player.move(0, 0);
        }
        
        // Update player
        this.player.update();
        this.player.regenerateStamina();
        
        // Update boss
        this.boss.update(time, this.player);
        
        // Draw aim line
        this.aimLine.clear();
        if (this.rightMouseDown) {
            this.aimLine.lineStyle(2, 0xff6666, 0.8);
            this.aimLine.lineBetween(this.player.x, this.player.y, this.mouseX, this.mouseY);
            this.aimLine.lineStyle(2, 0xff3333, 1);
            this.aimLine.strokeCircle(this.mouseX, this.mouseY, 10);
        }
        
        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.x += proj.vx * (delta / 1000);
            proj.y += proj.vy * (delta / 1000);
            
            const dist = Phaser.Math.Distance.Between(proj.x, proj.y, this.boss.x, this.boss.y);
            if (dist < 50) {
                this.boss.takeDamage(proj.damage);
                proj.destroy();
                this.projectiles.splice(i, 1);
                continue;
            }
            
            if (proj.x < -50 || proj.x > this.cameras.main.width + 50 || 
                proj.y < -50 || proj.y > this.cameras.main.height + 50) {
                proj.destroy();
                this.projectiles.splice(i, 1);
            }
        }
        
        // Update boss projectiles
        for (let i = this.bossProjectiles.length - 1; i >= 0; i--) {
            const proj = this.bossProjectiles[i];
            proj.x += proj.vx * (delta / 1000);
            proj.y += proj.vy * (delta / 1000);
            
            const dist = Phaser.Math.Distance.Between(proj.x, proj.y, this.player.x, this.player.y);
            if (dist < 25 && !this.player.isInvulnerable) {
                this.player.takeDamage(10);
                proj.destroy();
                this.bossProjectiles.splice(i, 1);
                continue;
            }
            
            if (proj.x < -50 || proj.x > this.cameras.main.width + 50 || 
                proj.y < -50 || proj.y > this.cameras.main.height + 50) {
                proj.destroy();
                this.bossProjectiles.splice(i, 1);
            }
        }
        
        // Update UI
        this.healthBar.width = 300 * (this.player.health / this.player.maxHealth);
        this.staminaBar.width = 250 * (this.player.stamina / this.player.maxStamina);
        this.bossHealthBar.width = 300 * (this.boss.health / this.boss.maxHealth);
        
        // Check game over
        if (this.player.health <= 0) {
            this.scene.start('GameOverScene', { victory: false });
        } else if (this.boss.health <= 0) {
            GameData.unlockNextBoss();
            this.scene.start('GameOverScene', { 
                victory: true,
                bossId: this.bossId
            });
        }
    }
}