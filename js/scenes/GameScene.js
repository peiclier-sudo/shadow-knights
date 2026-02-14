// GameScene.js - Main gameplay scene (visée précise)
import { Player } from '../entities/Player.js';
import { Boss } from '../entities/Boss.js';
import { GameData } from '../data/GameData.js';
import { WEAPONS } from '../weapons/weaponData.js';

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
        // Obtenir les dimensions actuelles
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Background
        this.add.rectangle(0, 0, width, height, 0x0a0a14).setOrigin(0);
        
        // Simple grid
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0x00d4ff, 0.1);
        const cellSize = 50;
        for (let i = 0; i < width; i += cellSize) {
            graphics.lineBetween(i, 0, i, height);
        }
        for (let i = 0; i < height; i += cellSize) {
            graphics.lineBetween(0, i, width, i);
        }
        
        // Create player
        this.player = new Player(this, this.playerConfig);
        
        // Create boss
        this.boss = new Boss(this, this.bossId);
        
        // Projectile arrays
        this.projectiles = [];
        this.bossProjectiles = [];
        
        // Weapon data
        this.weaponData = WEAPONS[this.playerConfig.weapon] || {
            projectile: {
                size: 10,
                speed: 800,
                damage: 18,
                color: 0x66ffff,
                count: 1
            }
        };
        
        // Input state
        this.leftMouseDown = false;
        this.rightMouseDown = false;
        
        // IMPORTANT: Utiliser les coordonnées du monde, pas de l'écran
        this.worldMouseX = 0;
        this.worldMouseY = 0;
        this.aimStartX = 0;
        this.aimStartY = 0;
        
        // Aim line
        this.aimLine = this.add.graphics();
        
        // UI elements (positionnés relativement)
        this.createUI(width, height);
        
        // Setup input
        this.setupInput();
        
        // Camera
        this.cameras.main.startFollow(this.player, true, 0.05, 0.05);
        this.cameras.main.setBounds(0, 0, width, height);
    }
    
    createUI(width, height) {
        // Health bar (fixe à l'écran, pas dans le monde)
        this.healthBarBg = this.add.rectangle(20, 20, 300, 25, 0x333333)
            .setScrollFactor(0).setOrigin(0, 0.5);
        this.healthBar = this.add.rectangle(20, 20, 300, 25, 0x00ff88)
            .setScrollFactor(0).setOrigin(0, 0.5);
        
        // Stamina bar
        this.staminaBarBg = this.add.rectangle(20, 55, 250, 15, 0x333333)
            .setScrollFactor(0).setOrigin(0, 0.5);
        this.staminaBar = this.add.rectangle(20, 55, 250, 15, 0xffaa00)
            .setScrollFactor(0).setOrigin(0, 0.5);
        
        // Boss health bar
        this.bossHealthBarBg = this.add.rectangle(width - 350, 30, 300, 25, 0x333333)
            .setScrollFactor(0).setOrigin(0, 0.5);
        this.bossHealthBar = this.add.rectangle(width - 350, 30, 300, 25, 0xff5555)
            .setScrollFactor(0).setOrigin(0, 0.5);
    }
    
    setupInput() {
        this.input.mouse.disableContextMenu();
        
        // Pointer down
        this.input.on('pointerdown', (pointer) => {
            // Convertir les coordonnées de l'écran en coordonnées du monde
            const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
            
            if (pointer.leftButtonDown()) {
                this.leftMouseDown = true;
            }
            if (pointer.rightButtonDown()) {
                this.rightMouseDown = true;
                this.aimStartX = this.player.x;
                this.aimStartY = this.player.y;
            }
        });
        
        // Pointer move
        this.input.on('pointermove', (pointer) => {
            // Convertir les coordonnées de l'écran en coordonnées du monde
            const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
            this.worldMouseX = worldPoint.x;
            this.worldMouseY = worldPoint.y;
        });
        
        // Pointer up
        this.input.on('pointerup', (pointer) => {
            if (pointer.button === 0) {
                this.leftMouseDown = false;
            }
            if (pointer.button === 2) {
                if (this.rightMouseDown) {
                    // Calculer l'angle avec les coordonnées du monde
                    const angle = Math.atan2(
                        this.worldMouseY - this.aimStartY,
                        this.worldMouseX - this.aimStartX
                    );
                    this.shootProjectile(angle);
                }
                this.rightMouseDown = false;
            }
        });
        
        // Keyboard dash
        this.input.keyboard.on('keydown-SPACE', () => {
            this.performDash();
        });
    }
    
    shootProjectile(angle) {
        if (this.player.stamina < 7) return;
        
        this.player.stamina -= 7;
        
        const startX = this.player.x + Math.cos(angle) * 30;
        const startY = this.player.y + Math.sin(angle) * 30;
        
        // Muzzle flash
        const flash = this.add.circle(startX, startY, 15, 0xffffff, 0.8);
        this.tweens.add({
            targets: flash,
            scale: 2,
            alpha: 0,
            duration: 100,
            onComplete: () => flash.destroy()
        });
        
        // Créer le projectile
        const proj = this.add.circle(startX, startY, 10, 0x66ffff);
        proj.vx = Math.cos(angle) * 800;
        proj.vy = Math.sin(angle) * 800;
        proj.damage = 18;
        
        this.projectiles.push(proj);
    }
    
    performDash() {
        // Dash vers la position de la souris
        const angle = Math.atan2(
            this.worldMouseY - this.player.y,
            this.worldMouseX - this.player.x
        );
        
        this.player.dash(Math.cos(angle), Math.sin(angle));
        
        // Effet de dash
        for (let i = 0; i < 5; i++) {
            const trail = this.add.circle(this.player.x, this.player.y, 15, 0x00d4ff, 0.5);
            this.tweens.add({
                targets: trail,
                alpha: 0,
                scale: 0.5,
                duration: 200,
                onComplete: () => trail.destroy()
            });
        }
    }
    
    update(time, delta) {
        // Mouvement du joueur (clic gauche)
        if (this.leftMouseDown) {
            const dx = this.worldMouseX - this.player.x;
            const dy = this.worldMouseY - this.player.y;
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
        
        // Dessiner la ligne de visée (avec les coordonnées du monde)
        this.aimLine.clear();
        if (this.rightMouseDown) {
            this.aimLine.lineStyle(2, 0xff6666, 0.8);
            this.aimLine.lineBetween(this.player.x, this.player.y, this.worldMouseX, this.worldMouseY);
            
            // Ligne pointillée
            const dx = this.worldMouseX - this.player.x;
            const dy = this.worldMouseY - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            for (let i = 20; i < dist; i += 30) {
                const t = i / dist;
                const x1 = this.player.x + dx * t;
                const y1 = this.player.y + dy * t;
                const x2 = this.player.x + dx * (t + 0.05);
                const y2 = this.player.y + dy * (t + 0.05);
                this.aimLine.lineBetween(x1, y1, x2, y2);
            }
            
            this.aimLine.lineStyle(2, 0xff3333, 1);
            this.aimLine.strokeCircle(this.worldMouseX, this.worldMouseY, 10);
        }
        
        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.x += proj.vx * (delta / 1000);
            proj.y += proj.vy * (delta / 1000);
            
            const dist = Phaser.Math.Distance.Between(proj.x, proj.y, this.boss.x, this.boss.y);
            if (dist < 50) {
                this.boss.takeDamage(proj.damage);
                
                // Effet d'impact
                const impact = this.add.circle(proj.x, proj.y, 15, 0xffaa00, 0.7);
                this.tweens.add({
                    targets: impact,
                    alpha: 0,
                    scale: 1.5,
                    duration: 200,
                    onComplete: () => impact.destroy()
                });
                
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
                
                const hit = this.add.circle(this.player.x, this.player.y, 20, 0xff0000, 0.5);
                this.tweens.add({
                    targets: hit,
                    alpha: 0,
                    scale: 1.5,
                    duration: 200,
                    onComplete: () => hit.destroy()
                });
                
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