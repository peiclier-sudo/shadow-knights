// GameScene.js - Main gameplay scene (FIXED - projectiles hit only once)
import { Player } from '../entities/Player.js';
import { BossFactory } from '../entities/BossFactory.js';
import { GameData } from '../data/GameData.js';
import { SwordWeapon } from '../weapons/SwordWeapon.js';
import { BowWeapon } from '../weapons/BowWeapon.js';
import { StaffWeapon } from '../weapons/StaffWeapon.js';
import { DaggerWeapon } from '../weapons/DaggerWeapon.js';
import { GreatswordWeapon } from '../weapons/GreatswordWeapon.js';

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
        this.createBackground(width, height);
        
        // Player
        this.player = new Player(this, this.playerConfig);
        
        // Boss
        this.boss = BossFactory.createBoss(this, this.bossId);
        
        // Projectiles arrays
        this.projectiles = [];
        this.bossProjectiles = [];
        
        // Créer l'arme
        this.createWeapon();
        
        // Input state
        this.moveTarget = null;
        this.leftMouseDown = false;
        this.worldMouseX = 0;
        this.worldMouseY = 0;
        this.aimCurrentX = 0;
        this.aimCurrentY = 0;
        
        // Aim line
        this.aimLine = this.add.graphics();
        this.chargeGraphics = null;
        
        // Tooltip
        this.tooltip = null;
        
        // UI
        this.createUI(width, height);
        this.createSkillButtons();
        
        // Input
        this.setupInput();
        
        // Camera
        this.cameras.main.startFollow(this.player, true, 0.05, 0.05);
        this.cameras.main.setBounds(0, 0, width, height);
    }
    
    createBackground(width, height) {
        // Dégradé
        const gradient = this.add.graphics();
        gradient.fillGradientStyle(0x0a0a14, 0x1a1a2e, 0x0a0a14, 0x1a1a2e, 1);
        gradient.fillRect(0, 0, width, height);
        
        // Étoiles
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
    }
    
    createWeapon() {
        switch(this.playerConfig.weapon) {
            case 'SWORD':
                this.weapon = new SwordWeapon(this, this.player);
                break;
            case 'BOW':
                this.weapon = new BowWeapon(this, this.player);
                break;
            case 'STAFF':
                this.weapon = new StaffWeapon(this, this.player);
                break;
            case 'DAGGERS':
                this.weapon = new DaggerWeapon(this, this.player);
                break;
            case 'GREATSWORD':
                this.weapon = new GreatswordWeapon(this, this.player);
                break;
            default:
                this.weapon = new SwordWeapon(this, this.player);
        }
    }
    
    createUI(width, height) {
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
        
        // Boss health
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
        
        // Weapon info
        this.weaponName = this.add.text(20, 90, this.weapon?.data?.name || 'WEAPON', {
            fontSize: '16px',
            fill: '#fff',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 1
        }).setScrollFactor(0);
        
        this.weaponDesc = this.add.text(20, 110, this.weapon?.data?.description || '', {
            fontSize: '12px',
            fill: '#aaa',
            stroke: '#000',
            strokeThickness: 1
        }).setScrollFactor(0);
        
        // Instructions
        this.add.text(width/2, height - 30, 
            'CLIC GAUCHE: DÉPLACEMENT | CLIC DROIT: TIRER/CHARGER | ESPACE: DASH | E/R/F: COMPÉTENCES', {
            fontSize: '14px',
            fill: '#aaa',
            backgroundColor: '#00000099',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setScrollFactor(0);
    }
    
    createSkillButtons() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        this.skillButtons = [];
        const skills = this.player.classData?.skills || [];
        
        skills.forEach((skill, index) => {
            const x = width - 300 + index * 90;
            const y = height - 80;
            
            // Bouton
            const button = this.add.container(x, y);
            
            // Fond
            const bg = this.add.circle(0, 0, 30, 0x333333, 0.8);
            bg.setStrokeStyle(2, this.player.classData?.data?.color || 0x00d4ff);
            
            // Icône
            const icon = this.add.text(0, -2, skill.icon, { fontSize: '24px' }).setOrigin(0.5);
            
            // Raccourci
            const keyHint = this.add.text(0, 22, ['E', 'R', 'F'][index], {
                fontSize: '12px',
                fill: '#aaa'
            }).setOrigin(0.5);
            
            // Cooldown overlay
            const cooldownOverlay = this.add.circle(0, 0, 30, 0x000000, 0);
            
            button.add([bg, icon, keyHint, cooldownOverlay]);
            button.setSize(60, 60);
            button.setInteractive({ useHandCursor: true });
            
            button.on('pointerdown', () => {
                this.player.useSkill(index);
            });
            
            button.on('pointerover', () => {
                this.showSkillTooltip(skill, x, y - 60);
            });
            
            button.on('pointerout', () => {
                if (this.tooltip) {
                    this.tooltip.destroy();
                    this.tooltip = null;
                }
            });
            
            // Stocker pour mise à jour
            this.skillButtons.push({
                container: button,
                cooldownOverlay,
                skill,
                lastUsed: 0
            });
        });
    }
    
    showSkillTooltip(skill, x, y) {
        if (this.tooltip) this.tooltip.destroy();
        
        this.tooltip = this.add.container(x, y);
        
        const bg = this.add.rectangle(0, 0, 200, 80, 0x000000, 0.9);
        bg.setStrokeStyle(2, 0x00d4ff);
        
        const nameText = this.add.text(0, -25, skill.name, {
            fontSize: '16px',
            fill: '#fff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        const descText = this.add.text(0, 5, skill.data.description, {
            fontSize: '12px',
            fill: '#aaa',
            wordWrap: { width: 180 },
            align: 'center'
        }).setOrigin(0.5);
        
        const costText = this.add.text(0, 25, `COÛT: ${skill.staminaCost}`, {
            fontSize: '12px',
            fill: '#ffaa00'
        }).setOrigin(0.5);
        
        this.tooltip.add([bg, nameText, descText, costText]);
        this.tooltip.setDepth(1000);
    }
    
    setupInput() {
        this.input.mouse.disableContextMenu();
        
        // CLIC GAUCHE - Déplacement
        this.input.on('pointerdown', (pointer) => {
            const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
            
            if (pointer.leftButtonDown()) {
                this.leftMouseDown = true;
                this.setMoveTarget(worldPoint.x, worldPoint.y);
            }
            
            // CLIC DROIT - Tirer ou charger
            if (pointer.rightButtonDown()) {
                this.aimCurrentX = worldPoint.x;
                this.aimCurrentY = worldPoint.y;
                
                this.weapon.startCharge();
                this.chargeGraphics = this.add.graphics();
            }
        });
        
        // Maintien du clic gauche pour déplacement continu
        this.input.on('pointermove', (pointer) => {
            const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
            this.worldMouseX = worldPoint.x;
            this.worldMouseY = worldPoint.y;
            
            // Mettre à jour la position actuelle pour la visée
            if (this.input.activePointer.rightButtonDown()) {
                this.aimCurrentX = worldPoint.x;
                this.aimCurrentY = worldPoint.y;
            }
            
            if (this.leftMouseDown) {
                this.setMoveTarget(worldPoint.x, worldPoint.y);
            }
        });
        
        // Relâchement des clics
        this.input.on('pointerup', (pointer) => {
            if (pointer.button === 0) {
                this.leftMouseDown = false;
            }
            
            if (pointer.button === 2) {
                // ✅ FIX: Calculer l'angle depuis la position ACTUELLE du joueur
                const angle = Math.atan2(
                    this.aimCurrentY - this.player.y,
                    this.aimCurrentX - this.player.x
                );
                
                // Tenter l'attaque chargée, sinon attaque normale
                if (!this.weapon.releaseCharge(angle)) {
                    this.weapon.attack(angle);
                }
                
                // Nettoyer l'indicateur de charge
                if (this.chargeGraphics) {
                    this.chargeGraphics.destroy();
                    this.chargeGraphics = null;
                }
            }
        });
        
        // DASH avec ESPACE
        this.input.keyboard.on('keydown-SPACE', () => {
            this.performDash();
        });
        
        // COMPÉTENCES avec E, R, F
        this.input.keyboard.on('keydown-E', () => {
            this.player.useSkill(0);
        });
        
        this.input.keyboard.on('keydown-R', () => {
            this.player.useSkill(1);
        });
        
        this.input.keyboard.on('keydown-F', () => {
            this.player.useSkill(2);
        });
    }
    
    setMoveTarget(x, y) {
        this.moveTarget = { x, y };
        const color = this.player.classData?.data?.color || 0x00d4ff;
        const indicator = this.add.circle(x, y, 10, color, 0.08);
        indicator.setStrokeStyle(1, color, 0.15);
        
        this.tweens.add({
            targets: indicator,
            scale: 1.2,
            alpha: 0,
            duration: 300,
            onComplete: () => indicator.destroy()
        });
    }
    
    performDash() {
        if (!this.player) return;
        
        const angle = Math.atan2(
            this.worldMouseY - this.player.y,
            this.worldMouseX - this.player.x
        );
        
        this.player.dash(Math.cos(angle), Math.sin(angle));
    }
    
    update(time, delta) {
        // Mouvement
        if (this.moveTarget) {
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
                this.moveTarget = null;
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
        
        // Gestion de la charge
        this.weapon.updateCharge();
        if (this.weapon.isCharging) {
            const isMovingConstant = this.leftMouseDown;
            
            if (isMovingConstant) {
                this.weapon.resetCharge();
                if (this.chargeGraphics) {
                    this.chargeGraphics.destroy();
                    this.chargeGraphics = null;
                }
            } else if (this.chargeGraphics) {
                this.chargeGraphics.clear();
                const radius = 30 + this.weapon.chargeLevel * 50;
                const alpha = 0.3 + this.weapon.chargeLevel * 0.5;
                
                this.chargeGraphics.lineStyle(2, 0xffaa00, alpha * 0.5);
                this.chargeGraphics.strokeCircle(this.player.x, this.player.y, radius);
                
                this.chargeGraphics.fillStyle(0xffaa00, alpha * 0.2);
                this.chargeGraphics.slice(
                    this.player.x, this.player.y,
                    radius - 5,
                    0, Math.PI * 2 * this.weapon.chargeLevel,
                    false
                );
                this.chargeGraphics.fillPath();
            }
        }
        
        // Ligne de visée
        this.aimLine.clear();
        if (this.input.activePointer.rightButtonDown()) {
            const dx = this.aimCurrentX - this.player.x;
            const dy = this.aimCurrentY - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxDist = 300;
            
            let aimX = this.aimCurrentX;
            let aimY = this.aimCurrentY;
            
            if (dist > maxDist) {
                const ratio = maxDist / dist;
                aimX = this.player.x + dx * ratio;
                aimY = this.player.y + dy * ratio;
            }
            
            this.aimLine.lineStyle(1, 0xff6666, 0.2);
            this.aimLine.lineBetween(this.player.x, this.player.y, aimX, aimY);
            
            for (let i = 20; i < Math.min(dist, maxDist); i += 30) {
                const t = i / Math.min(dist, maxDist);
                const x1 = this.player.x + (aimX - this.player.x) * t;
                const y1 = this.player.y + (aimY - this.player.y) * t;
                const x2 = this.player.x + (aimX - this.player.x) * (t + 0.05);
                const y2 = this.player.y + (aimY - this.player.y) * (t + 0.05);
                this.aimLine.lineBetween(x1, y1, x2, y2);
            }
            
            this.aimLine.lineStyle(1, 0xff3333, 0.3);
            this.aimLine.strokeCircle(aimX, aimY, 8);
        }
        
        // Update skill buttons (cooldowns)
        this.skillButtons?.forEach(btn => {
            const cooldownProgress = btn.skill.getCooldownProgress?.() || 0;
            btn.cooldownOverlay.fillAlpha = 0.5 * (1 - cooldownProgress);
        });
        
        // ✅ PROJECTILES JOUEUR - FIXED VERSION
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            if (proj.update) proj.update();
            
            proj.x += proj.vx * (delta / 1000);
            proj.y += proj.vy * (delta / 1000);
            
            // ✅ Check 1: Range
            if (proj.range) {
                const distTraveled = Phaser.Math.Distance.Between(proj.startX, proj.startY, proj.x, proj.y);
                if (distTraveled > proj.range) {
                    proj.destroy();
                    this.projectiles.splice(i, 1);
                    continue; // ✅ FIXED - Skip to next projectile immediately
                }
            }
            
            // ✅ Check 2: Boss collision
            if (this.boss) {
                const dist = Phaser.Math.Distance.Between(proj.x, proj.y, this.boss.x, this.boss.y);
                if (dist < 50) {
                    // ✅ FIX: Vérifier si le projectile a déjà touché
                    if (proj.hasHit !== undefined && proj.hasHit) {
                        continue; // Skip si déjà touché
                    }
                    
                    // Marquer comme ayant touché
                    if (proj.hasHit !== undefined) {
                        proj.hasHit = true;
                    }
                    
                    this.boss.takeDamage(proj.damage);
                    
                    // Knockback
                    if (proj.knockback) {
                        const angle = Math.atan2(proj.vy, proj.vx);
                        this.tweens.add({
                            targets: this.boss,
                            x: this.boss.x + Math.cos(angle) * proj.knockbackForce,
                            y: this.boss.y + Math.sin(angle) * proj.knockbackForce,
                            duration: 150,
                            ease: 'Power2'
                        });
                    }
                    
                    // Impact effect
                    const impact = this.add.circle(proj.x, proj.y, 12, 0xffaa00, 0.4);
                    this.tweens.add({
                        targets: impact,
                        alpha: 0,
                        scale: 1.3,
                        duration: 150,
                        onComplete: () => impact.destroy()
                    });
                    
                    // ✅ CRITICAL FIX: Destroy projectile immediately
                    if (!proj.piercing) {
                        proj.destroy();
                        this.projectiles.splice(i, 1);
                        continue; // ✅ FIXED - Skip rest of loop for this projectile
                    }
                    // If piercing, projectile continues through
                    continue; // ✅ FIXED - Also skip for piercing projectiles after hit
                }
            }
            
            // ✅ Check 3: Out of bounds
            if (proj.x < -50 || proj.x > this.cameras.main.width + 50 || 
                proj.y < -50 || proj.y > this.cameras.main.height + 50) {
                proj.destroy();
                this.projectiles.splice(i, 1);
                continue; // ✅ FIXED - Clean exit from loop
            }
        }
        
        // Boss projectiles
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
        }
        
        // Game over
        if (this.player.health <= 0) {
            this.scene.start('GameOverScene', { victory: false });
        } else if (this.boss?.health <= 0) {
            GameData.unlockNextBoss();
            this.scene.start('GameOverScene', { 
                victory: true, 
                bossId: this.bossId 
            });
        }
    }
}