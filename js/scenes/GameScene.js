// GameScene.js - Main gameplay scene (mouvement continu)
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
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Background
        this.add.rectangle(0, 0, width, height, 0x0a0a14).setOrigin(0);
        
        // Grid
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
        this.moveDirection = { x: 0, y: 0 }; // Direction de mouvement continue
        self.recentRightClick = false;
        
        // Coordonnées de la souris
        this.worldMouseX = 0;
        this.worldMouseY = 0;
        
        // Aim line
        this.aimLine = this.add.graphics();
        
        // UI elements
        this.createUI(width, height);
        
        // Setup input
        this.setupInput();
        
        // Camera
        this.cameras.main.startFollow(this.player, true, 0.05, 0.05);
        this.cameras.main.setBounds(0, 0, width, height);
    }
    
    createUI(width, height) {
        // Health bar
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
        
        // Instructions
        this.instructions = this.add.text(width/2, height - 30, 
            'CLIC DROIT: DIRECTION | CLIC GAUCHE: TIRER | ESPACE: DASH', {
            fontSize: '14px',
            fill: '#aaa',
            backgroundColor: '#00000099',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setScrollFactor(0);
    }
    
    setupInput() {
        this.input.mouse.disableContextMenu();
        
        // CLIC DROIT - Définir la direction de mouvement
        this.input.on('pointerdown', (pointer) => {
            const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
            
            if (pointer.rightButtonDown()) {
                // Calculer la direction vers le point cliqué
                const dx = worldPoint.x - this.player.x;
                const dy = worldPoint.y - this.player.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 5) {
                    this.moveDirection.x = dx / dist;
                    this.moveDirection.y = dy / dist;
                }
                
                // Feedback visuel du clic droit
                this.showDirectionIndicator(worldPoint.x, worldPoint.y);
            }
        });
        
        // CLIC GAUCHE - Tirer
        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
                this.worldMouseX = worldPoint.x;
                this.worldMouseY = worldPoint.y;
            }
        });
        
        // Mise à jour de la position de la souris
        this.input.on('pointermove', (pointer) => {
            const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
            this.worldMouseX = worldPoint.x;
            this.worldMouseY = worldPoint.y;
        });
        
        // Tir au relâchement du clic gauche
        this.input.on('pointerup', (pointer) => {
            if (pointer.button === 0) { // Clic gauche
                const angle = Math.atan2(
                    this.worldMouseY - this.player.y,
                    this.worldMouseX - this.player.x
                );
                this.shootProjectile(angle);
            }
        });
        
        // DASH avec ESPACE
        this.input.keyboard.on('keydown-SPACE', () => {
            this.performDash();
        });
    }
    
    showDirectionIndicator(x, y) {
        // Cercle d'indication de direction
        const indicator = this.add.circle(x, y, 15, 0xff6600, 0.3);
        indicator.setStrokeStyle(2, 0xffaa00);
        
        this.tweens.add({
            targets: indicator,
            scale: 1.5,
            alpha: 0,
            duration: 500,
            onComplete: () => indicator.destroy()
        });
        
        // Ligne de la direction
        const line = this.add.line(
            this.player.x, this.player.y,
            0, 0,
            x - this.player.x, y - this.player.y,
            0xff6600, 0.5
        ).setLineWidth(2);
        
        this.tweens.add({
            targets: line,
            alpha: 0,
            duration: 300,
            onComplete: () => line.destroy()
        });
    }
    
    shootProjectile(angle) {
        if (this.player.stamina < 7 || !this.player.canAttack) return;
        
        this.player.stamina -= 7;
        this.player.canAttack = false;
        
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
        
        // Reset attack cooldown
        this.time.delayedCall(250, () => {
            this.player.canAttack = true;
        });
    }
    
    performDash() {
        if (this.player.stamina < 40 || this.player.isDashing) return;
        
        // Dash dans la direction du mouvement, ou vers la souris si pas de mouvement
        let dx = this.moveDirection.x;
        let dy = this.moveDirection.y;
        
        if (dx === 0 && dy === 0) {
            const angle = Math.atan2(
                this.worldMouseY - this.player.y,
                this.worldMouseX - this.player.x
            );
            dx = Math.cos(angle);
            dy = Math.sin(angle);
        }
        
        this.player.dash(dx, dy);
        
        // Effet de dash
        for (let i = 0; i < 8; i++) {
            this.time.delayedCall(i * 30, () => {
                const trail = this.add.circle(this.player.x, this.player.y, 15, 0x00d4ff, 0.5);
                this.tweens.add({
                    targets: trail,
                    alpha: 0,
                    scale: 1.5,
                    duration: 200,
                    onComplete: () => trail.destroy()
                });
            });
        }
    }
    
    update(time, delta) {
        // MOUVEMENT CONTINU basé sur la direction définie par clic droit
        if (this.moveDirection.x !== 0 || this.moveDirection.y !== 0) {
            this.player.move(
                this.moveDirection.x * this.player.speed,
                this.moveDirection.y * this.player.speed
            );
        } else {
            this.player.move(0, 0);
        }
        
        // Update player
        this.player.update();
        this.player.regenerateStamina();
        
        // Update boss
        this.boss.update(time, this.player);
        
        // DESSINER LA LIGNE DE VISÉE (pour le tir)
        this.aimLine.clear();
        
        // Ligne de visée (toujours visible pour montrer où on va tirer)
        this.aimLine.lineStyle(1, 0xff6666, 0.4);
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
        
        // Cercle de visée
        this.aimLine.lineStyle(2, 0xff3333, 1);
        this.aimLine.strokeCircle(this.worldMouseX, this.worldMouseY, 10);
        
        // DESSINER LA DIRECTION DE MOUVEMENT
        if (this.moveDirection.x !== 0 || this.moveDirection.y !== 0) {
            this.aimLine.lineStyle(2, 0xffaa00, 0.6);
            const moveEndX = this.player.x + this.moveDirection.x * 80;
            const moveEndY = this.player.y + this.moveDirection.y * 80;
            this.aimLine.lineBetween(this.player.x, this.player.y, moveEndX, moveEndY);
            
            // Flèche
            this.aimLine.fillStyle(0xffaa00, 0.8);
            this.aimLine.fillTriangle(
                moveEndX, moveEndY,
                moveEndX - 10 * this.moveDirection.y, moveEndY + 10 * this.moveDirection.x,
                moveEndX + 10 * this.moveDirection.y, moveEndY - 10 * this.moveDirection.x
            );
        }
        
        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.x += proj.vx * (delta / 1000);
            proj.y += proj.vy * (delta / 1000);
            
            const dist = Phaser.Math.Distance.Between(proj.x, proj.y, this.boss.x, this.boss.y);
            if (dist < 50) {
                this.boss.takeDamage(proj.damage);
                
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