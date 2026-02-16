// BootScene.js - First scene that loads
export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }
    
    preload() {
        // Show loading text
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        this.loadingText = this.add.text(width/2, height/2, 'CHARGEMENT...', {
            fontSize: '32px',
            fill: '#00d4ff',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        // Create a loading bar
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width/2 - 160, height/2 + 30, 320, 30);
        
        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x00d4ff, 1);
            progressBar.fillRect(width/2 - 160, height/2 + 30, 320 * value, 30);
        });
        
        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            this.loadingText.destroy();
        });

        // Firestaff spritesheet (remote release asset to avoid repository binary bloat)
        this.load.spritesheet('firestaff-sheet',
            'https://github.com/peiclier-sudo/shadow-knights/releases/download/v1.0.0/firestaff.jpg', {
                frameWidth: 192,
                frameHeight: 192
            }
        );
    }
    
    create() {
        // Firestaff projectile loop animation
        if (!this.anims.exists('firestaff-flight')) {
            this.anims.create({
                key: 'firestaff-flight',
                frames: this.anims.generateFrameNumbers('firestaff-sheet', {
                    start: 5,
                    end: 18
                }),
                frameRate: 18,
                repeat: -1
            });
        }

        // Go to menu after loading
        this.scene.start('MenuScene');
    }
}
