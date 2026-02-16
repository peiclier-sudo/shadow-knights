// WeaponSelectScene.js - Choose your weapon
import { WEAPONS } from '../weapons/weaponData.js';

export class WeaponSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WeaponSelectScene' });
    }
    
    init(data) {
        this.playerClass = data.playerClass || 'WARRIOR';
    }
    
    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Background
        this.add.graphics()
            .fillStyle(0x0a0a14, 1)
            .fillRect(0, 0, width, height);
        
        // Title
        this.add.text(width/2, 80, 'CHOOSE YOUR WEAPON', {
            fontSize: '48px',
            fill: '#00d4ff',
            fontStyle: 'bold',
            stroke: '#fff',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // Class indicator
        this.add.text(width/2, 140, `Class: ${this.playerClass}`, {
            fontSize: '20px',
            fill: '#aaa'
        }).setOrigin(0.5);
        
        const weaponKeys = ['SWORD', 'BOW', 'STAFF', 'DAGGERS', 'GREATSWORD', 'ELECTRO_GAUNTLET'];
        const cardWidth = 200;
        const cardHeight = 250;
        const cols = 3;
        const spacingX = 30;
        const startX = width / 2 - ((cols - 1) * (cardWidth + spacingX)) / 2;
        
        weaponKeys.forEach((key, index) => {
            const weaponData = WEAPONS[key];
            const row = Math.floor(index / 3);
            const col = index % cols;
            const x = startX + col * (cardWidth + spacingX);
            const y = height/2 - 50 + row * (cardHeight + 30);
            
            // Card
            const card = this.add.rectangle(x, y, cardWidth, cardHeight, 0x333344, 0.8);
            card.setStrokeStyle(3, weaponData.color || 0x00d4ff);
            
            // Weapon icon
            this.add.text(x, y - 80, weaponData.icon, {
                fontSize: '48px'
            }).setOrigin(0.5);
            
            // Weapon name
            this.add.text(x, y - 20, weaponData.name, {
                fontSize: '20px',
                fill: '#fff',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            
            // Stats
            this.add.text(x, y + 20, `ATK: ${weaponData.projectile.damage}`, {
                fontSize: '16px',
                fill: '#ffaa00'
            }).setOrigin(0.5);
            
            this.add.text(x, y + 45, `SPD: ${weaponData.projectile.speed}`, {
                fontSize: '16px',
                fill: '#88ddff'
            }).setOrigin(0.5);
            
            // Charged attack name
            this.add.text(x, y + 80, `${weaponData.charged.name}`, {
                fontSize: '12px',
                fill: '#ccc'
            }).setOrigin(0.5);
            
            // Make interactive
            card.setInteractive({ useHandCursor: true });
            
            card.on('pointerover', () => {
                this.tweens.add({
                    targets: card,
                    scaleX: 1.05,
                    scaleY: 1.05,
                    duration: 200
                });
            });
            
            card.on('pointerout', () => {
                this.tweens.add({
                    targets: card,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 200
                });
            });
            
            card.on('pointerdown', () => {
                this.cameras.main.fade(500, 0, 0, 0);
                this.time.delayedCall(500, () => {
                    this.scene.start('BossSelectScene', { 
                        playerClass: this.playerClass,
                        weapon: key 
                    });
                });
            });
        });
        
        // Back button
        const backBtn = this.add.text(100, height - 80, '← BACK', {
            fontSize: '24px',
            fill: '#aaa',
            backgroundColor: '#333',
            padding: { x: 15, y: 8 }
        }).setInteractive({ useHandCursor: true });
        
        backBtn.on('pointerdown', () => {
            this.scene.start('ClassSelectScene');
        });
    }
}