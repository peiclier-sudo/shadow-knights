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

        // Firestaff spritesheet: 5x4 grid inside a 960x960 sheet => 192x240 frames
        // Loaded from release URL to avoid committing binaries in the repository.
        this.load.spritesheet('firestaff',
            'https://github.com/peiclier-sudo/shadow-knights/releases/download/v1.0.0/firestaff.jpg', {
                frameWidth: 192,
                frameHeight: 240
            }
        );
    }
    
    create() {
        // Firestaff spritesheet animations
        if (!this.anims.exists('fireball-grow')) {
            this.anims.create({
                key: 'fireball-grow',
                frames: this.anims.generateFrameNumbers('firestaff', { start: 0, end: 4 }),
                frameRate: 12,
                repeat: 0
            });
        }

        if (!this.anims.exists('fire-comet')) {
            this.anims.create({
                key: 'fire-comet',
                frames: this.anims.generateFrameNumbers('firestaff', { start: 5, end: 9 }),
                frameRate: 20,
                repeat: -1
            });
        }

        if (!this.anims.exists('fire-burst')) {
            this.anims.create({
                key: 'fire-burst',
                frames: this.anims.generateFrameNumbers('firestaff', { start: 10, end: 14 }),
                frameRate: 15,
                repeat: 0
            });
        }

        if (!this.anims.exists('fire-explode')) {
            this.anims.create({
                key: 'fire-explode',
                frames: this.anims.generateFrameNumbers('firestaff', { start: 15, end: 19 }),
                frameRate: 18,
                repeat: 0
            });
        }

        // Go to menu after loading
        this.scene.start('MenuScene');
    }
}
