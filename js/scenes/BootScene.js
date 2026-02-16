// BootScene.js - First scene that loads
export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }
    
    preload() {
        // Ensure remote assets can be fetched when available
        this.load.setCORS('anonymous');

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

        // Firestaff spritesheet: 5x4 grid inside a 960x960 sheet => 192x240 frames.
        // Uses the local repository asset "firestaff (2).jpg".
        this.load.spritesheet('firestaff',
            'firestaff (2).jpg', {
                frameWidth: 192,
                frameHeight: 240
            }
        );

        this.load.on('loaderror', (file) => {
            if (file?.key === 'firestaff') {
                console.warn('[BootScene] Failed to load firestaff spritesheet:', file.src);
            }
        });
    }
    
    create() {
        // Firestaff spritesheet animations (only if texture is available)
        if (!this.textures.exists('firestaff')) {
            console.warn('[BootScene] firestaff texture not available, using fallback charged VFX.');
        } else if (!this.anims.exists('fireball-grow')) {
            this.anims.create({
                key: 'fireball-grow',
                frames: this.anims.generateFrameNumbers('firestaff', { start: 0, end: 4 }),
                frameRate: 12,
                repeat: 0
            });
        }

        if (this.textures.exists('firestaff') && !this.anims.exists('fire-comet')) {
            this.anims.create({
                key: 'fire-comet',
                frames: this.anims.generateFrameNumbers('firestaff', { start: 5, end: 9 }),
                frameRate: 20,
                repeat: -1
            });
        }

        if (this.textures.exists('firestaff') && !this.anims.exists('fire-burst')) {
            this.anims.create({
                key: 'fire-burst',
                frames: this.anims.generateFrameNumbers('firestaff', { start: 10, end: 14 }),
                frameRate: 15,
                repeat: 0
            });
        }

        if (this.textures.exists('firestaff') && !this.anims.exists('fire-explode')) {
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
