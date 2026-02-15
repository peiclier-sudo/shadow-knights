// config.js - Game configuration
export const GameConfig = {
    type: Phaser.WEBGL,
    parent: 'game-container',
    backgroundColor: '#0a0a14',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            fps: 144,
            timeScale: 1,
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: '100%',
        height: '100%'
    },
    render: {
        antialias: true,
        pixelArt: false,
        roundPixels: false,
        powerPreference: 'high-performance',
        transparent: false,
        clearBeforeRender: true
    },
    fps: {
        target: 144,
        forceSetTimeOut: false,
        deltaHistory: 10,
        panicMax: 144
    },
    
    // Game settings
    settings: {
        soundVolume: 0.7,
        musicVolume: 0.5,
        screenShake: true,
        particleEffects: true,
        damageNumbers: true,
        criticalHits: true
    },
    
    // Default player config
    defaultPlayer: {
        class: 'WARRIOR',
        weapon: 'SWORD'
    },
    
    // Version
    version: '1.0.0'
};