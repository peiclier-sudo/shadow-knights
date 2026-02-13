// main.js - Entry point
import { GameConfig } from './config.js';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { ClassSelectScene } from './scenes/ClassSelectScene.js';
import { WeaponSelectScene } from './scenes/WeaponSelectScene.js';
import { BossSelectScene } from './scenes/BossSelectScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';

const config = {
    ...GameConfig,
    scene: [
        BootScene,
        MenuScene,
        ClassSelectScene,
        WeaponSelectScene,
        BossSelectScene,
        GameScene,
        GameOverScene
    ]
};

window.addEventListener('load', () => {
    new Phaser.Game(config);
});