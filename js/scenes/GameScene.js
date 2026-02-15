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
        this.weaponData = WEAPONS[this.playerConfig.weapon];
        
        // Charging state
        this.isCharging = false;
        this.chargeLevel = 0;
        this.chargeStartTime = 0;
        this.chargeGraphics = null;
        this.chargeZone = null;
        this.zoneText = null;
        this.waitingForSecondClick = false;
        
        // Input state
        this.moveTarget = { x: null, y: null };
        this.leftMouseDown = false;
        this.hasFixedDestination = false;
        this.worldMouseX = 0;
        this.worldMouseY = 0;
        this.lastShotTime = 0;
        
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
        
        // Weapon name and description
        this.weaponName = this.add.text(20, 90, this.weaponData.name, {
            fontSize: '16px',
            fill: '#fff',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 1
        }).setScrollFactor(0);
        
        this.weaponDesc = this.add.text(20, 110, this.weaponData.description, {
            fontSize: '12px',
            fill: '#aaa',
            stroke: '#000',
            strokeThickness: 1
        }).setScrollFactor(0);
        
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
                this.hasFixedDestination = true;
                this.setMoveTarget(worldPoint.x, worldPoint.y);
            }
        });
        
        // CLIC DROIT - Tirer ou charger
        this.input.on('pointerdown', (pointer) => {
            if (pointer.rightButtonDown()) {
                const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
                this.aimStartX = this.player.x;
                this.aimStartY = this.player.y;
                this.aimTargetX = worldPoint.x;
                this.aimTargetY = worldPoint.y;
                
                // Peut charger si on a une destination fixe OU si on ne bouge pas
                const canCharge = this.hasFixedDestination || 
                                 (this.player.body.velocity.x === 0 && this.player.body.velocity.y === 0);
                
                if (canCharge) {
                    this.startCharge();
                } else {
                    // Tir normal immédiat
                    this.shootProjectile(this.getAngleToTarget());
                }
            }
        });
        
        // Second clic pour valider la zone (Arc)
        this.input.on('pointerup', (pointer) => {
            if (pointer.button === 0 && this.waitingForSecondClick) {
                this.validateChargedZone();
            }
        });
        
        // Maintien du clic gauche pour déplacement continu
        this.input.on('pointermove', (pointer) => {
            const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
            this.worldMouseX = worldPoint.x;
            this.worldMouseY = worldPoint.y;
            
            if (this.leftMouseDown) {
                this.hasFixedDestination = false;
                this.setMoveTarget(worldPoint.x, worldPoint.y);
            }
        });
        
        // Relâchement du clic gauche
        this.input.on('pointerup', (pointer) => {
            if (pointer.button === 0) {
                this.leftMouseDown = false;
            }
        });
        
        // DASH avec ESPACE
        this.input.keyboard.on('keydown-SPACE', () => {
            this.performDash();
        });
    }
    
    getAngleToTarget() {
        return Math.atan2(
            this.aimTargetY - this.player.y,
            this.aimTargetX - this.player.x
        );
    }
    
    setMoveTarget(x, y) {
        this.moveTarget.x = x;
        this.moveTarget.y = y;
        
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
    
    startCharge() {
        this.isCharging = true;
        this.player.isCharging = true;
        this.chargeStartTime = Date.now();
        this.chargeLevel = 0;
        
        this.chargeGraphics = this.add.graphics();
        
        // Pour l'arc, créer une zone de visée
        if (this.playerConfig.weapon === 'BOW') {
            this.createAimZone();
        }
    }
    
    createAimZone() {
        this.chargeZone = this.add.circle(
            this.aimTargetX, this.aimTargetY,
            this.weaponData.charged.radius,
            0x88dd88,
            0.2
        );
        this.chargeZone.setStrokeStyle(2, 0x88dd88, 0.5);
        
        this.zoneText = this.add.text(
            this.aimTargetX, this.aimTargetY - 40,
            'CLIC GAUCHE POUR VALIDER',
            {
                fontSize: '14px',
                fill: '#88dd88',
                stroke: '#000',
                strokeThickness: 2
            }
        ).setOrigin(0.5);
    }
    
    validateChargedZone() {
        if (!this.waitingForSecondClick) return;
        
        this.waitingForSecondClick = false;
        this.isCharging = false;
        this.player.isCharging = false;
        
        if (this.chargeGraphics) {
            this.chargeGraphics.destroy();
            this.chargeGraphics = null;
        }
        
        if (this.player.stamina < this.weaponData.charged.staminaCost) {
            if (this.chargeZone) this.chargeZone.destroy();
            if (this.zoneText) this.zoneText.destroy();
            return;
        }
        this.player.stamina -= this.weaponData.charged.staminaCost;
        
        this.rainOfArrows(this.aimTargetX, this.aimTargetY);
        
        if (this.chargeZone) {
            this.chargeZone.destroy();
            this.chargeZone = null;
        }
        if (this.zoneText) {
            this.zoneText.destroy();
            this.zoneText = null;
        }
    }
    
    releaseCharge() {
        if (!this.isCharging) return;
        
        // Cas spécial pour l'arc
        if (this.playerConfig.weapon === 'BOW') {
            this.waitingForSecondClick = true;
            return;
        }
        
        this.isCharging = false;
        this.player.isCharging = false;
        
        if (this.chargeGraphics) {
            this.chargeGraphics.destroy();
            this.chargeGraphics = null;
        }
        
        if (this.chargeLevel < 0.3) {
            this.shootProjectile(this.getAngleToTarget());
            return;
        }
        
        if (this.player.stamina < this.weaponData.charged.staminaCost) return;
        this.player.stamina -= this.weaponData.charged.staminaCost;
        
        switch(this.playerConfig.weapon) {
            case 'SWORD':
                this.piercingLaser();
                break;
            case 'STAFF':
                this.meteorAttack();
                break;
            case 'DAGGERS':
                this.whirlingDaggers();
                break;
            case 'GREATSWORD':
                this.shockwaveLine();
                break;
        }
    }
    
    // Épée - Lame transversale
    piercingLaser() {
        const charged = this.weaponData.charged;
        const angle = this.getAngleToTarget();
        
        const distance = 1000;
        const endX = this.player.x + Math.cos(angle) * distance;
        const endY = this.player.y + Math.sin(angle) * distance;
        
        const laser = this.add.line(
            this.player.x, this.player.y,
            0, 0,
            endX - this.player.x, endY - this.player.y,
            0xffaa00, 0.8
        );
        laser.setLineWidth(3);
        
        this.tweens.add({
            targets: laser,
            alpha: 0,
            duration: 200,
            onComplete: () => laser.destroy()
        });
        
        for (let i = 0; i < distance; i += 20) {
            const checkX = this.player.x + Math.cos(angle) * i;
            const checkY = this.player.y + Math.sin(angle) * i;
            
            const distToBoss = Phaser.Math.Distance.Between(checkX, checkY, this.boss.x, this.boss.y);
            if (distToBoss < 40) {
                this.boss.takeDamage(charged.damage);
                break;
            }
        }
        
        this.cameras.main.shake(100, 0.005);
    }
    
    // Bâton - Météore
    meteorAttack() {
        const charged = this.weaponData.charged;
        const angle = this.getAngleToTarget();
        
        const meteor = this.add.circle(
            this.player.x + Math.cos(angle) * 40,
            this.player.y + Math.sin(angle) * 40,
            30,
            0xff6600,
            0.9
        );
        
        this.tweens.add({
            targets: meteor,
            x: this.aimTargetX,
            y: this.aimTargetY,
            duration: 800,
            ease: 'Linear',
            onUpdate: () => {
                const trail = this.add.circle(meteor.x, meteor.y, 20, 0xff6600, 0.3);
                this.tweens.add({
                    targets: trail,
                    alpha: 0,
                    scale: 1.5,
                    duration: 300,
                    onComplete: () => trail.destroy()
                });
            },
            onComplete: () => {
                const explosion = this.add.circle(meteor.x, meteor.y, 150, 0xff6600, 0.8);
                
                const dist = Phaser.Math.Distance.Between(meteor.x, meteor.y, this.boss.x, this.boss.y);
                if (dist < 150) {
                    this.boss.takeDamage(charged.damage);
                }
                
                this.tweens.add({
                    targets: explosion,
                    alpha: 0,
                    scale: 1.5,
                    duration: 400,
                    onComplete: () => {
                        explosion.destroy();
                        meteor.destroy();
                    }
                });
                
                this.cameras.main.shake(300, 0.015);
            }
        });
    }
    
    // Arc - Pluie de flèches
    rainOfArrows(targetX, targetY) {
        const charged = this.weaponData.charged;
        
        for (let i = 0; i < charged.arrows; i++) {
            this.time.delayedCall(i * 100, () => {
                const x = targetX + (Math.random() - 0.5) * charged.radius * 2;
                const y = targetY + (Math.random() - 0.5) * charged.radius * 2;
                
                const arrow = this.add.rectangle(x, y - 50, 4, 15, 0x88dd88);
                
                this.tweens.add({
                    targets: arrow,
                    y: y,
                    duration: 200,
                    onComplete: () => {
                        const dist = Phaser.Math.Distance.Between(x, y, this.boss.x, this.boss.y);
                        if (dist < 30) {
                            this.boss.takeDamage(charged.damage / charged.arrows);
                        }
                        arrow.destroy();
                    }
                });
            });
        }
    }
    
    // Dagues - Lames tournoyantes
    whirlingDaggers() {
        const charged = this.weaponData.charged;
        
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            
            const dagger = this.add.triangle(
                this.player.x + Math.cos(angle) * 60,
                this.player.y + Math.sin(angle) * 60,
                -8, -8,
                8, 0,
                -8, 8,
                0xcc88cc
            );
            dagger.rotation = angle;
            
            this.tweens.add({
                targets: dagger,
                angle: angle + Math.PI * 2,
                x: this.player.x + Math.cos(angle + Math.PI * 2) * 60,
                y: this.player.y + Math.sin(angle + Math.PI * 2) * 60,
                duration: 2000,
                repeat: -1
            });
            
            this.time.addEvent({
                delay: 100,
                callback: () => {
                    const dist = Phaser.Math.Distance.Between(dagger.x, dagger.y, this.boss.x, this.boss.y);
                    if (dist < 30) {
                        this.boss.takeDamage(charged.damage / 8);
                    }
                },
                repeat: 20
            });
            
            this.time.delayedCall(2000, () => {
                dagger.destroy();
            });
        }
    }
    
    // Espadon - Onde de choc
    shockwaveLine() {
        const charged = this.weaponData.charged;
        const angle = this.getAngleToTarget();
        
        const wave = this.add.rectangle(
            this.player.x,
            this.player.y,
            40,
            20,
            0xcc6600,
            0.7
        );
        wave.rotation = angle;
        
        const distance = 400;
        const endX = this.player.x + Math.cos(angle) * distance;
        const endY = this.player.y + Math.sin(angle) * distance;
        
        this.tweens.add({
            targets: wave,
            x: endX,
            y: endY,
            duration: 300,
            ease: 'Power2',
            onUpdate: () => {
                const dist = Phaser.Math.Distance.Between(wave.x, wave.y, this.boss.x, this.boss.y);
                if (dist < 40) {
                    this.boss.takeDamage(charged.damage);
                    
                    const knockbackAngle = Math.atan2(
                        this.boss.y - wave.y,
                        this.boss.x - wave.x
                    );
                    this.tweens.add({
                        targets: this.boss,
                        x: this.boss.x + Math.cos(knockbackAngle) * 150,
                        y: this.boss.y + Math.sin(knockbackAngle) * 150,
                        duration: 200,
                        ease: 'Power2'
                    });
                }
            },
            onComplete: () => wave.destroy()
        });
    }
    
    shootProjectile(angle) {
        if (this.player.stamina < 7 || !this.player.canAttack) return;
        
        const projData = this.weaponData.projectile;
        
        const now = Date.now();
        if (this.lastShotTime && now - this.lastShotTime < projData.cooldown) return;
        this.lastShotTime = now;
        
        this.player.stamina -= 7;
        this.player.canAttack = false;
        
        const startX = this.player.x + Math.cos(angle) * 30;
        const startY = this.player.y + Math.sin(angle) * 30;
        
        const flash = this.add.circle(startX, startY, 12, this.weaponData.color, 0.5);
        this.tweens.add({
            targets: flash,
            scale: 1.5,
            alpha: 0,
            duration: 100,
            onComplete: () => flash.destroy()
        });
        
        if (projData.count > 1) {
            for (let i = 0; i < projData.count; i++) {
                const offset = (i - (projData.count - 1) / 2) * projData.spread;
                this.createProjectile(angle + offset, projData);
            }
        } else {
            this.createProjectile(angle, projData);
        }
        
        this.time.delayedCall(projData.cooldown, () => {
            this.player.canAttack = true;
        });
    }
    
    createProjectile(angle, data) {
        const startX = this.player.x + Math.cos(angle) * 30;
        const startY = this.player.y + Math.sin(angle) * 30;
        
        let proj;
        
        switch(data.type) {
            case 'arrow':
                proj = this.add.container(startX, startY);
                const shaft = this.add.rectangle(0, 0, data.size * 2, data.size * 0.8, data.color);
                shaft.rotation = angle;
                const tip = this.add.triangle(
                    data.size, 0,
                    0, -3,
                    0, 3,
                    data.color
                );
                tip.rotation = angle;
                proj.add([shaft, tip]);
                break;
                
            case 'slash':
                proj = this.add.graphics();
                proj.lineStyle(3, data.color, 0.8);
                proj.beginPath();
                proj.arc(0, 0, data.size * 2, angle - 0.5, angle + 0.5);
                proj.strokePath();
                proj.setPosition(startX, startY);
                break;
                
            case 'orb':
                proj = this.add.star(startX, startY, 5, data.size * 0.7, data.size, data.color);
                break;
                
            case 'spread':
                proj = this.add.triangle(
                    startX, startY,
                    -data.size, -data.size,
                    data.size, 0,
                    -data.size, data.size,
                    data.color
                );
                proj.rotation = angle;
                break;
                
            case 'shockwave':
                proj = this.add.container(startX, startY);
                const wave = this.add.ellipse(0, 0, data.size * 4, data.size * 2, data.color, 0.6);
                wave.rotation = angle;
                const outline = this.add.ellipse(0, 0, data.size * 4, data.size * 2, data.color * 0.7, 0.3);
                outline.rotation = angle;
                proj.add([wave, outline]);
                break;
                
            default:
                proj = this.add.circle(startX, startY, data.size, data.color);
        }
        
        proj.setDepth(150);
        proj.vx = Math.cos(angle) * data.speed;
        proj.vy = Math.sin(angle) * data.speed;
        proj.damage = data.damage;
        proj.range = data.range;
        proj.startX = startX;
        proj.startY = startY;
        proj.knockback = data.knockback || false;
        proj.knockbackForce = data.knockbackForce || 150;
        proj.piercing = data.piercing || false;
        
        this.addProjectileTrail(proj, data);
        
        this.projectiles.push(proj);
        return proj;
    }
    
    addProjectileTrail(proj, data) {
        let trailCount = 0;
        const trailInterval = setInterval(() => {
            if (!proj.scene || trailCount > 6) {
                clearInterval(trailInterval);
                return;
            }
            const trail = this.add.circle(proj.x, proj.y, data.size * 0.6, data.color, 0.1);
            this.tweens.add({
                targets: trail,
                alpha: 0,
                scale: 0.5,
                duration: 200,
                onComplete: () => trail.destroy()
            });
            trailCount++;
        }, 50);
    }
    
    performDash() {
        if (this.player.stamina < 40 || this.player.isDashing) return;
        
        const angle = Math.atan2(
            this.worldMouseY - this.player.y,
            this.worldMouseX - this.player.x
        );
        
        const success = this.player.dash(Math.cos(angle), Math.sin(angle));
        
        if (success) {
            const playerColor = this.player.classData?.color || 0x00d4ff;
            
            let afterimageCount = 0;
            const afterimageInterval = setInterval(() => {
                if (!this.player.isDashing || afterimageCount > 8) {
                    clearInterval(afterimageInterval);
                    return;
                }
                
                const afterimage = this.add.container(this.player.x, this.player.y);
                const core = this.add.circle(0, 0, 18, playerColor, 0.3);
                const ring = this.add.circle(0, 0, 24, playerColor, 0.15);
                afterimage.add([ring, core]);
                afterimage.setDepth(40);
                
                this.tweens.add({
                    targets: afterimage,
                    alpha: 0,
                    scale: 0.8,
                    duration: 200,
                    ease: 'Power2',
                    onComplete: () => afterimage.destroy()
                });
                
                for (let i = 0; i < 3; i++) {
                    const particle = this.add.circle(
                        this.player.x + (Math.random() - 0.5) * 30,
                        this.player.y + (Math.random() - 0.5) * 30,
                        3 + Math.random() * 4,
                        playerColor,
                        0.4
                    );
                    
                    this.tweens.add({
                        targets: particle,
                        alpha: 0,
                        scale: 0.3,
                        x: particle.x + (Math.random() - 0.5) * 50,
                        y: particle.y + (Math.random() - 0.5) * 50,
                        duration: 300,
                        ease: 'Power2',
                        onComplete: () => particle.destroy()
                    });
                }
                
                afterimageCount++;
            }, 40);
            
            this.cameras.main.shake(100, 0.003);
        }
    }
    
    update(time, delta) {
        // Mouvement vers la destination
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
        
        this.player.update();
        this.player.regenerateStamina();
        
        if (this.boss) {
            this.boss.update(time, this.player);
        }
        
        // Gestion de la charge
        if (this.isCharging && !this.waitingForSecondClick) {
            if (this.player.body.velocity.x !== 0 || this.player.body.velocity.y !== 0) {
                this.isCharging = false;
                this.player.isCharging = false;
                if (this.chargeGraphics) {
                    this.chargeGraphics.destroy();
                    this.chargeGraphics = null;
                }
            } else {
                const elapsed = Date.now() - this.chargeStartTime;
                this.chargeLevel = Math.min(1, elapsed / this.weaponData.charged.chargeTime);
                
                if (this.chargeGraphics) {
                    this.chargeGraphics.clear();
                    const radius = 30 + this.chargeLevel * 50;
                    const alpha = 0.3 + this.chargeLevel * 0.5;
                    
                    this.chargeGraphics.lineStyle(2, 0xffaa00, alpha * 0.5);
                    this.chargeGraphics.strokeCircle(this.player.x, this.player.y, radius);
                    
                    this.chargeGraphics.fillStyle(0xffaa00, alpha * 0.2);
                    this.chargeGraphics.slice(
                        this.player.x, this.player.y,
                        radius - 5,
                        0, Math.PI * 2 * this.chargeLevel,
                        false
                    );
                    this.chargeGraphics.fillPath();
                }
            }
        }
        
        // Ligne de visée
        this.aimLine.clear();
        
        if (this.input.activePointer.rightButtonDown() && !this.waitingForSecondClick) {
            const dx = this.worldMouseX - this.player.x;
            const dy = this.worldMouseY - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            const maxAimDistance = 300;
            let aimX = this.worldMouseX;
            let aimY = this.worldMouseY;
            
            if (dist > maxAimDistance) {
                const ratio = maxAimDistance / dist;
                aimX = this.player.x + dx * ratio;
                aimY = this.player.y + dy * ratio;
            }
            
            this.aimLine.lineStyle(1, 0xff6666, 0.2);
            this.aimLine.lineBetween(this.player.x, this.player.y, aimX, aimY);
            
            const limitedDist = Math.min(dist, maxAimDistance);
            for (let i = 20; i < limitedDist; i += 30) {
                const t = i / limitedDist;
                const x1 = this.player.x + (aimX - this.player.x) * t;
                const y1 = this.player.y + (aimY - this.player.y) * t;
                const x2 = this.player.x + (aimX - this.player.x) * (t + 0.05);
                const y2 = this.player.y + (aimY - this.player.y) * (t + 0.05);
                this.aimLine.lineBetween(x1, y1, x2, y2);
            }
            
            this.aimLine.lineStyle(1, 0xff3333, 0.3);
            this.aimLine.strokeCircle(aimX, aimY, 8);
        }
        
        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.x += proj.vx * (delta / 1000);
            proj.y += proj.vy * (delta / 1000);
            
            if (proj.range) {
                const distTraveled = Phaser.Math.Distance.Between(proj.startX, proj.startY, proj.x, proj.y);
                if (distTraveled > proj.range) {
                    proj.destroy();
                    this.projectiles.splice(i, 1);
                    continue;
                }
            }
            
            if (this.boss) {
                const dist = Phaser.Math.Distance.Between(proj.x, proj.y, this.boss.x, this.boss.y);
                if (dist < 50) {
                    this.boss.takeDamage(proj.damage);
                    
                    if (proj.knockback) {
                        const angle = Math.atan2(proj.y - this.boss.y, proj.x - this.boss.x);
                        this.tweens.add({
                            targets: this.boss,
                            x: this.boss.x + Math.cos(angle) * proj.knockbackForce,
                            y: this.boss.y + Math.sin(angle) * proj.knockbackForce,
                            duration: 150,
                            ease: 'Power2'
                        });
                    }
                    
                    const impact = this.add.circle(proj.x, proj.y, 12, 0xffaa00, 0.4);
                    this.tweens.add({
                        targets: impact,
                        alpha: 0,
                        scale: 1.3,
                        duration: 150,
                        onComplete: () => impact.destroy()
                    });
                    
                    if (!proj.piercing) {
                        proj.destroy();
                        this.projectiles.splice(i, 1);
                    }
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