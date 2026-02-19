// main.js - Entry point
import { GameConfig } from './config.js';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { ClassSelectScene } from './scenes/ClassSelectScene.js';
import { WeaponSelectScene } from './scenes/WeaponSelectScene.js';
import { BossSelectScene } from './scenes/BossSelectScene.js';
import { TowerScene } from './scenes/TowerScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';
import { DashboardScene } from './scenes/DashboardScene.js';
import { PauseScene } from './scenes/PauseScene.js';
import { ControlsScene } from './scenes/ControlsScene.js';

// Game configuration with all scenes
const config = {
    ...GameConfig,
    scene: [
        BootScene,
        MenuScene,
        ClassSelectScene,
        WeaponSelectScene,
        TowerScene,
        BossSelectScene,
        GameScene,
        GameOverScene,
        DashboardScene,
        PauseScene,
        ControlsScene
    ]
};

// Start the game when page loads
window.addEventListener('load', () => {
    // Create game instance
    const game = new Phaser.Game(config);
    
    // Log version
    console.log(`Shadow Knights v${GameConfig.version} started`);
    
    // Handle resize
    window.addEventListener('resize', () => {
        game.scale.refresh();
    });
    
    // Handle visibility change (pause/resume)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            game.sound.pauseAll();
        } else {
            game.sound.resumeAll();
        }
    });
});