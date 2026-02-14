// MenuScene.js - Main menu
export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }
    
    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Background
        this.add.graphics()
            .fillStyle(0x0a0a14, 1)
            .fillRect(0, 0, width, height);
        
        // Title with glow
        const title = this.add.text(width/2, height/3, 'SHADOW KNIGHTS', {
            fontSize: '64px',
            fill: '#00d4ff',
            fontStyle: 'bold',
            stroke: '#fff',
            strokeThickness: 2,
            shadow: {
                offsetX: 0,
                offsetY: 0,
                color: '#00d4ff',
                blur: 20,
                fill: true
            }
        }).setOrigin(0.5);
        
        // Animate title
        this.tweens.add({
            targets: title,
            scale: 1.05,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Start button
        const startBtn = this.add.text(width/2, height/2, 'START GAME', {
            fontSize: '32px',
            fill: '#fff',
            backgroundColor: '#333',
            padding: { x: 30, y: 15 },
            stroke: '#00d4ff',
            strokeThickness: 1
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        startBtn.on('pointerover', () => {
            startBtn.setStyle({ fill: '#00d4ff' });
            this.tweens.add({ targets: startBtn, scale: 1.1, duration: 200 });
        });
        
        startBtn.on('pointerout', () => {
            startBtn.setStyle({ fill: '#fff' });
            this.tweens.add({ targets: startBtn, scale: 1, duration: 200 });
        });
        
        startBtn.on('pointerdown', () => {
            this.scene.start('ClassSelectScene');
        });
        
        // Credits
        this.add.text(width/2, height - 100, 'CREATED WITH PHASER 3', {
            fontSize: '16px',
            fill: '#666'
        }).setOrigin(0.5);
        
        // Floating particles for ambiance
        for (let i = 0; i < 30; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const particle = this.add.circle(x, y, 2, 0x00d4ff, 0.3);
            
            this.tweens.add({
                targets: particle,
                y: y + Phaser.Math.Between(-30, 30),
                alpha: 0.1,
                duration: Phaser.Math.Between(2000, 4000),
                yoyo: true,
                repeat: -1
            });
        }
    }
}