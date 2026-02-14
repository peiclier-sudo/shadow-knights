// ClassSelectScene.js - Choose your class
import { CLASSES } from '../classes/classData.js';

export class ClassSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ClassSelectScene' });
    }
    
    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Background
        this.add.graphics()
            .fillStyle(0x0a0a14, 1)
            .fillRect(0, 0, width, height);
        
        // Title
        this.add.text(width/2, 80, 'CHOOSE YOUR CLASS', {
            fontSize: '48px',
            fill: '#00d4ff',
            fontStyle: 'bold',
            stroke: '#fff',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        const classKeys = ['WARRIOR', 'MAGE', 'ROGUE'];
        const startX = width/2 - 350;
        const cardWidth = 300;
        
        classKeys.forEach((key, index) => {
            const classData = CLASSES[key];
            const x = startX + index * (cardWidth + 50);
            const y = height/2;
            
            // Card background with gradient effect
            const card = this.add.rectangle(x, y, cardWidth, 350, classData.color, 0.2);
            card.setStrokeStyle(4, classData.glowColor, 0.8);
            
            // Card shadow
            const shadow = this.add.rectangle(x + 10, y + 10, cardWidth, 350, 0x000000, 0.3);
            shadow.setDepth(-1);
            
            // Class name
            this.add.text(x, y - 140, classData.name, {
                fontSize: '36px',
                fill: '#fff',
                fontStyle: 'bold',
                stroke: classData.glowColor,
                strokeThickness: 1
            }).setOrigin(0.5);
            
            // Class icon (simulated with colored circle)
            const icon = this.add.circle(x, y - 60, 40, classData.color);
            icon.setStrokeStyle(3, classData.glowColor);
            
            // Stats
            this.add.text(x, y + 20, `HEALTH: ${classData.baseHealth}`, {
                fontSize: '18px',
                fill: '#ff8888'
            }).setOrigin(0.5);
            
            this.add.text(x, y + 50, `STAMINA: ${classData.baseStamina}`, {
                fontSize: '18px',
                fill: '#ffaa00'
            }).setOrigin(0.5);
            
            this.add.text(x, y + 80, `SPEED: ${classData.baseSpeed}`, {
                fontSize: '18px',
                fill: '#88ddff'
            }).setOrigin(0.5);
            
            // Dash info
            this.add.text(x, y + 120, `DASH: ${classData.dash.name}`, {
                fontSize: '14px',
                fill: '#ccc'
            }).setOrigin(0.5);
            
            // Make card interactive
            card.setInteractive({ useHandCursor: true });
            
            card.on('pointerover', () => {
                this.tweens.add({
                    targets: [card, icon],
                    scaleX: 1.05,
                    scaleY: 1.05,
                    duration: 200
                });
            });
            
            card.on('pointerout', () => {
                this.tweens.add({
                    targets: [card, icon],
                    scaleX: 1,
                    scaleY: 1,
                    duration: 200
                });
            });
            
            card.on('pointerdown', () => {
                // Fade out effect
                this.cameras.main.fade(500, 0, 0, 0);
                this.time.delayedCall(500, () => {
                    this.scene.start('WeaponSelectScene', { playerClass: key });
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
            this.scene.start('MenuScene');
        });
    }
}