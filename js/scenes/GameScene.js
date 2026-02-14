// GameScene.js - Main gameplay scene
import { Player } from '../entities/Player.js';
import { BossFactory } from '../entities/BossFactory.js';
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
        
        // BACKGROUND AVEC PROFONDEUR
        // Dégradé du sombre vers le légèrement plus clair
        const gradient = this.add.graphics();
        gradient.fillGradientStyle(0x0a0a14, 0x1a1a2e, 0x0a0a14, 0x1a1a2e, 1);
        gradient.fillRect(0, 0, width, height);
        
        // Étoiles lointaines
        for (let i = 0; i < 100; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const size = Phaser.Math.Between(1, 2);
            const alpha = Math.random() * 0.3;
            
            const star = this.add.circle(x, y, size, 0xffffff, alpha);
            
            this.tweens.add({
                targets: star,
                alpha: alpha * 0.3,
                duration: Phaser.Math.Between(2000, 4000),
                yoyo: true,
                repeat: -1
            });
        }
        
        // Nébuleuses subtiles
        for (let i = 0; i < 5; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const radius = Phaser.Math.Between(100, 200);
            
            const nebula = this.add.circle(x, y, radius, 0x3366ff, 0.02);
            this.tweens.add({
                targets: nebula,
                alpha: 0.01,
                duration: 8000,
                yoyo: true,
                repeat: -1
            });
        }
        
        // Create player
        this.player = new Player(this, this.playerConfig);
        const playerColor = this.player.classData?.color || 0x00d4ff;
        
        // Create boss
        this.boss = BossFactory.createBoss(this, this.bossId);
        
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
        this.moveTarget = { x: null, y: null };
        this.leftMouseDown = false;
        this.worldMouseX = 0;
        this.worldMouseY = 0;
        
        // Aim line
        this.aimLine = this.add.graphics();
        
        // UI elements
        this.createUI(width, height, playerColor);
        
        // Setup input
        this.setupInput();
        
        // Camera
        this.cameras.main.startFollow(this.player, true, 0.05, 0.05);
        this.cameras.main.setBounds(0, 0, width, height);
    }
    
    createUI(width, height, playerColor) {
        // Health bar
        this.healthBarBg = this.add.rectangle(20, 20, 300, 25, 0x333333)
            .setScrollFactor(0).setOrigin(0, 0.5);
        this.healthBar = this.add.rectangle(20, 20, 300, 25, 0x00ff88)
            .setScrollFactor(0).setOrigin(0, 0.5);
        this.healthText = this.add.text(330, 20, '100/100', {
            fontSize: '18px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 2
        }).setScrollFactor(0).setOrigin(0, 0.5);
        
        // Stamina bar
        this.staminaBarBg = this.add.rectangle(20, 55, 250, 15, 0x333333)
            .setScrollFactor(0).setOrigin(0, 0.5);
        this.staminaBar = this.add.rectangle(20, 55, 250, 15, 0xffaa00)
            .setScrollFactor(0).setOrigin(0, 0.5);
        this.staminaText = this.add.text(280, 55, '100', {
            fontSize: '16px',
            fill: '#ffaa00',
            stroke: '#000',
            strokeThickness: 2
        }).setScrollFactor(0).setOrigin(0, 0.5);
        
        // Boss health bar
        this.bossName = this.add.text(width - 200, 15, this.boss?.bossData?.name || 'BOSS', {
            fontSize: '20px',
            fill: '#ff5555',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 2
        }).setScrollFactor(0).setOrigin(0.5);
        
        this.bossHealthBarBg = this.add.rectangle(width - 350, 40, 300, 25, 0x333333)
            .setScrollFactor(0).setOrigin(0, 0.5);
        this.bossHealthBar = this.add.rectangle(width - 350, 40, 300, 25, 0xff5555)
            .setScrollFactor(0).setOrigin(0, 0.5);
        this.bossHealthText = this.add.text(width - 40, 40, '400/400', {
            fontSize: '18px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 2
        }).setScrollFactor(0).setOrigin(1, 0.5);
        
        // Instructions
        this.instructions = this.add.text(width/2, height - 30, 
            'CLIC GAUCHE: SE DÉPLACER | CLIC DROIT: TIRER | ESPACE: DASH', {
            fontSize: '14px',
            fill: '#aaa',
            backgroundColor: '#00000099',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setScrollFactor(0);
    }
    
    setupInput() {
        this.input.mouse.disableContextMenu();
        
        // CLIC GAUCHE - Déplacement
        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
                this.leftMouseDown = true;
                this.setMoveTarget(worldPoint.x, worldPoint.y);
            }
            
            // CLIC DROIT - Tirer
            if (pointer.rightButtonDown()) {
                const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
                const angle = Math.atan2(
                    worldPoint.y - this.player.y,
                    worldPoint.x - this.player.x
                );
                this.shootProjectile(angle);
            }
        });
        
        // Maintien du clic gauche pour déplacement continu
        this.input.on('pointermove', (pointer) => {
            const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
            this.worldMouseX = worldPoint.x;
            this.worldMouseY = worldPoint.y;
            
            // Si on maintient le clic gauche, mettre à jour la destination
            if (this.leftMouseDown) {
                this.setMoveTarget(worldPoint.x, worldPoint.y);
            }
        });
        
        // Relâchement du clic gauche
        this.input.on('pointerup', (pointer) => {
            if (pointer.button === 0) { // Clic gauche
                this.leftMouseDown = false;
            }
        });
        
        // DASH avec ESPACE
        this.input.keyboard.on('keydown-SPACE', () => {
            this.performDash();
        });
    }
    
    setMoveTarget(x, y) {
        this.moveTarget.x = x;
        this.moveTarget.y = y;
        
        // Effet visuel TRÈS léger du point de destination (uniquement le cercle)
        const playerColor = this.player.classData?.color || 0x00d4ff;
        const indicator = this.add.circle(x, y, 10, playerColor, 0.08);
        indicator.setStrokeStyle(1, playerColor, 0.15);
        
        this.tweens.add({
            targets: indicator,
            scale: 1.2,
            alpha: 0,
            duration: 300,
            onComplete: () => indicator.destroy()
        });
    }
    
    shootProjectile(angle) {
        if (this.player.stamina < 7 || !this.player.canAttack) return;
        
        this.player.stamina -= 7;
        this.player.canAttack = false;
        
        const startX = this.player.x + Math.cos(angle) * 30;
        const startY = this.player.y + Math.sin(angle) * 30;
        
        // Muzzle flash
        const flash = this.add.circle(startX, startY, 12, 0xffffff, 0.5);
        this.tweens.add({
            targets: flash,
            scale: 1.5,
            alpha: 0,
            duration: 100,
            onComplete: () => flash.destroy()
        });
        
        // Créer le projectile
        const proj = this.add.circle(startX, startY, 8, this.weaponData.projectile.color || 0x66ffff);
        proj.vx = Math.cos(angle) * 800;
        proj.vy = Math.sin(angle) * 800;
        proj.damage = this.weaponData.projectile.damage || 18;
        
        this.projectiles.push(proj);
        
        // Trail TRÈS léger
        let trailCount = 0;
        const trailInterval = setInterval(() => {
            if (!proj.scene || trailCount > 6) {
                clearInterval(trailInterval);
                return;
            }
            const trail = this.add.circle(proj.x, proj.y, 5, proj.fillColor, 0.1);
            this.tweens.add({
                targets: trail,
                alpha: 0,
                scale: 0.5,
                duration: 200,
                onComplete: () => trail.destroy()
            });
            trailCount++;
        }, 50);
        
        // Reset attack cooldown
        this.time.delayedCall(250, () => {
            this.player.canAttack = true;
        });
    }
    
    performDash() {
        // Vérifications
        if (this.player.stamina < 40) return;
        if (this.player.isDashing) return;
        
        // Dash vers la souris
        const angle = Math.atan2(
            this.worldMouseY - this.player.y,
            this.worldMouseX - this.player.x
        );
        
        // Appeler la méthode dash du player
        const success = this.player.dash(Math.cos(angle), Math.sin(angle));
        
        if (success) {
            // Effet de dash TRÈS léger
            const playerColor = this.player.classData?.color || 0x00d4ff;
            for (let i = 0; i < 4; i++) {
                this.time.delayedCall(i * 50, () => {
                    const trail = this.add.circle(this.player.x, this.player.y, 12, playerColor, 0.1);
                    this.tweens.add({
                        targets: trail,
                        alpha: 0,
                        scale: 1.3,
                        duration: 200,
                        onComplete: () => trail.destroy()
                    });
                });
            }
        }
    }
    
    update(time, delta) {
        // Mouvement vers la destination (clic gauche)
        if (this.moveTarget.x !== null && this.moveTarget.y !== null) {
            const dx = this.moveTarget.x - this.player.x;
            const dy = this.moveTarget.y - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 5) {
                this.player.move(
                    (dx / dist) * this.player.speed,
                    (dy / dist) * this.player.speed
                );
            } else {
                this.player.move(0, 0);
                this.moveTarget.x = null;
                this.moveTarget.y = null;
            }
        } else {
            this.player.move(0, 0);
        }
        
        // Update player
        this.player.update();
        this.player.regenerateStamina();
        
        // Update boss
        if (this.boss) {
            this.boss.update(time, this.player);
        }
        
        // DESSINER LA LIGNE DE VISÉE UNIQUEMENT QUAND ON TIRE (clic droit maintenu)
        this.aimLine.clear();
        
        // Ne dessiner la ligne que si le clic droit est enfoncé
        if (this.input.activePointer.rightButtonDown()) {
            // Calculer la direction et la distance
            const dx = this.worldMouseX - this.player.x;
            const dy = this.worldMouseY - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Limiter la distance de la ligne à 300 pixels
            const maxAimDistance = 300;
            let aimX = this.worldMouseX;
            let aimY = this.worldMouseY;
            
            if (dist > maxAimDistance) {
                const ratio = maxAimDistance / dist;
                aimX = this.player.x + dx * ratio;
                aimY = this.player.y + dy * ratio;
            }
            
            // Ligne de visée principale (limitée)
            this.aimLine.lineStyle(1, 0xff6666, 0.2);
            this.aimLine.lineBetween(this.player.x, this.player.y, aimX, aimY);
            
            // Ligne pointillée (limitée aussi)
            const limitedDist = Math.min(dist, maxAimDistance);
            for (let i = 20; i < limitedDist; i += 30) {
                const t = i / limitedDist;
                const x1 = this.player.x + (aimX - this.player.x) * t;
                const y1 = this.player.y + (aimY - this.player.y) * t;
                const x2 = this.player.x + (aimX - this.player.x) * (t + 0.05);
                const y2 = this.player.y + (aimY - this.player.y) * (t + 0.05);
                this.aimLine.lineBetween(x1, y1, x2, y2);
            }
            
            // Cercle de visée (à la position limitée)
            this.aimLine.lineStyle(1, 0xff3333, 0.3);
            this.aimLine.strokeCircle(aimX, aimY, 8);
        }
        
        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.x += proj.vx * (delta / 1000);
            proj.y += proj.vy * (delta / 1000);
            
            if (this.boss) {
                const dist = Phaser.Math.Distance.Between(proj.x, proj.y, this.boss.x, this.boss.y);
                if (dist < 50) {
                    this.boss.takeDamage(proj.damage);
                    
                    const impact = this.add.circle(proj.x, proj.y, 12, 0xffaa00, 0.4);
                    this.tweens.add({
                        targets: impact,
                        alpha: 0,
                        scale: 1.3,
                        duration: 150,
                        onComplete: () => impact.destroy()
                    });
                    
                    proj.destroy();
                    this.projectiles.splice(i, 1);
                    continue;
                }
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
                
                const hit = this.add.circle(this.player.x, this.player.y, 15, 0xff0000, 0.4);
                this.tweens.add({
                    targets: hit,
                    alpha: 0,
                    scale: 1.3,
                    duration: 150,
                    onComplete: () => hit.destroy()
                });
                
                if (proj.glow) proj.glow.destroy();
                proj.destroy();
                this.bossProjectiles.splice(i, 1);
                continue;
            }
            
            if (proj.x < -50 || proj.x > this.cameras.main.width + 50 || 
                proj.y < -50 || proj.y > this.cameras.main.height + 50) {
                if (proj.glow) proj.glow.destroy();
                proj.destroy();
                this.bossProjectiles.splice(i, 1);
            }
        }
        
        // Update UI
        if (this.player) {
            this.healthBar.width = 300 * (this.player.health / this.player.maxHealth);
            this.healthText.setText(`${Math.floor(this.player.health)}/${this.player.maxHealth}`);
            
            this.staminaBar.width = 250 * (this.player.stamina / this.player.maxStamina);
            this.staminaText.setText(`${Math.floor(this.player.stamina)}`);
        }
        
        if (this.boss) {
            this.bossHealthBar.width = 300 * (this.boss.health / this.boss.maxHealth);
            this.bossHealthText.setText(`${Math.floor(this.boss.health)}/${this.boss.maxHealth}`);
            this.bossName.setText(this.boss.bossData?.name || 'BOSS');
        }
        
        // Check game over
        if (this.player.health <= 0) {
            this.scene.start('GameOverScene', { victory: false });
        } else if (this.boss && this.boss.health <= 0) {
            GameData.unlockNextBoss();
            this.scene.start('GameOverScene', { 
                victory: true,
                bossId: this.bossId
            });
        }
    }
}