// AssetLoader.js - Handles loading of all game assets
export class AssetLoader {
    constructor(scene) {
        this.scene = scene;
        this.totalAssets = 0;
        this.loadedAssets = 0;
    }
    
    loadAllAssets() {
        this.loadImages();
        this.loadAudio();
        this.loadFonts();
    }
    
    loadImages() {
        // Player assets
        this.scene.load.image('player', 'assets/images/player.png');
        this.scene.load.image('player-glow', 'assets/images/player-glow.png');
        
        // Boss assets
        this.scene.load.image('sentinel', 'assets/images/bosses/sentinel.png');
        this.scene.load.image('gunner', 'assets/images/bosses/gunner.png');
        this.scene.load.image('dasher', 'assets/images/bosses/dasher.png');
        
        // Projectile assets
        this.scene.load.image('arrow', 'assets/images/projectiles/arrow.png');
        this.scene.load.image('fireball', 'assets/images/projectiles/fireball.png');
        this.scene.load.image('poison', 'assets/images/projectiles/poison.png');
        this.scene.load.image('slash', 'assets/images/projectiles/slash.png');
        
        // UI assets
        this.scene.load.image('button', 'assets/images/ui/button.png');
        this.scene.load.image('button-hover', 'assets/images/ui/button-hover.png');
        this.scene.load.image('panel', 'assets/images/ui/panel.png');
        
        // Effect assets
        this.scene.load.image('particle', 'assets/images/effects/particle.png');
        this.scene.load.image('explosion', 'assets/images/effects/explosion.png');
        this.scene.load.image('shield', 'assets/images/effects/shield.png');
    }
    
    loadAudio() {
        // Music
        this.scene.load.audio('menu-music', 'assets/audio/music/menu.mp3');
        this.scene.load.audio('battle-music', 'assets/audio/music/battle.mp3');
        this.scene.load.audio('boss-music', 'assets/audio/music/boss.mp3');
        
        // Sound effects
        this.scene.load.audio('shoot', 'assets/audio/sfx/shoot.wav');
        this.scene.load.audio('hit', 'assets/audio/sfx/hit.wav');
        this.scene.load.audio('dash', 'assets/audio/sfx/dash.wav');
        this.scene.load.audio('charge', 'assets/audio/sfx/charge.wav');
        this.scene.load.audio('explosion', 'assets/audio/sfx/explosion.wav');
        this.scene.load.audio('skill', 'assets/audio/sfx/skill.wav');
        this.scene.load.audio('victory', 'assets/audio/sfx/victory.wav');
        this.scene.load.audio('defeat', 'assets/audio/sfx/defeat.wav');
        
        // UI sounds
        this.scene.load.audio('click', 'assets/audio/sfx/click.wav');
        this.scene.load.audio('hover', 'assets/audio/sfx/hover.wav');
    }
    
    loadFonts() {
        // Custom fonts can be loaded here
        // this.scene.load.bitmapFont('pixel', 'assets/fonts/pixel.png', 'assets/fonts/pixel.xml');
    }
    
    // Progress tracking
    onAssetLoaded() {
        this.loadedAssets++;
        this.updateProgress();
    }
    
    updateProgress() {
        const progress = this.loadedAssets / this.totalAssets;
        // Emit progress event
        this.scene.events.emit('load-progress', progress);
    }
    
    // Create a loading bar
    createLoadingBar(x, y, width, height) {
        const bg = this.scene.add.rectangle(x, y, width, height, 0x333333);
        bg.setOrigin(0, 0.5);
        
        const bar = this.scene.add.rectangle(x, y, 0, height, 0x00d4ff);
        bar.setOrigin(0, 0.5);
        
        const text = this.scene.add.text(x + width/2, y - 30, 'LOADING...', {
            fontSize: '24px',
            fill: '#fff'
        }).setOrigin(0.5);
        
        this.scene.load.on('progress', (value) => {
            bar.width = width * value;
        });
        
        this.scene.load.on('complete', () => {
            bar.destroy();
            bg.destroy();
            text.destroy();
        });
        
        return { bg, bar, text };
    }
}