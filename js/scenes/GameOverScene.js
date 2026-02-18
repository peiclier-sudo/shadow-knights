// GameOverScene.js - Victory/defeat screen
import { GameData } from '../data/GameData.js';
import { BOSSES } from '../data/BossData.js';

const TOTAL_BOSSES = Object.keys(BOSSES).length;

export class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }
    
    init(data) {
        this.victory = data.victory || false;
        this.bossId = data.bossId || 1;
        this.playerConfig = data.playerConfig || { class: 'WARRIOR', weapon: 'SWORD' };
    }
    
    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Background
        this.add.graphics()
            .fillStyle(0x0a0a14, 1)
            .fillRect(0, 0, width, height);
        
        // Result text
        const msg = this.victory ? 'VICTORY' : 'DEFEAT';
        const color = this.victory ? '#00ff88' : '#ff3355';
        
        const title = this.add.text(width/2, height/3, msg, {
            fontSize: '72px',
            fill: color,
            fontStyle: 'bold',
            stroke: '#ffffff',
            strokeThickness: 4,
            shadow: {
                offsetX: 0,
                offsetY: 0,
                color: color,
                blur: 20,
                fill: true
            }
        }).setOrigin(0.5);
        
        // Animate title
        this.tweens.add({
            targets: title,
            scale: 1.1,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        if (this.victory) {
            const bossName = BOSSES[this.bossId]?.name || 'BOSS';
            this.add.text(width/2, height/2 - 50, `${bossName} DEFEATED`, {
                fontSize: '24px',
                fill: '#fff',
                stroke: '#000',
                strokeThickness: 2
            }).setOrigin(0.5);
        }
        
        // Buttons
        const buttonStyle = {
            fontSize: '28px',
            fill: '#fff',
            backgroundColor: '#333',
            padding: { x: 25, y: 12 },
            stroke: '#00d4ff',
            strokeThickness: 1
        };
        
        // Retry button
        const retryBtn = this.add.text(width/2 - 200, height/2 + 80, 'RETRY', buttonStyle)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });
        
        retryBtn.on('pointerover', () => retryBtn.setStyle({ fill: '#00d4ff' }));
        retryBtn.on('pointerout', () => retryBtn.setStyle({ fill: '#fff' }));
        retryBtn.on('pointerdown', () => {
            this.scene.start('GameScene', {
                playerConfig: this.playerConfig,
                bossId: this.bossId
            });
        });
        
        // Menu button
        const menuBtn = this.add.text(width/2 + 200, height/2 + 80, 'MENU', buttonStyle)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });
        
        menuBtn.on('pointerover', () => menuBtn.setStyle({ fill: '#ff6600' }));
        menuBtn.on('pointerout', () => menuBtn.setStyle({ fill: '#fff' }));
        menuBtn.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
        
        // Tower button - return to tower view
        if (this.victory) {
            // Mark boss as defeated and unlock next
            GameData.markBossDefeated(this.bossId);
            GameData.unlockNextBoss();

            const towerBtn = this.add.text(width/2, height/2 + 160, 'RETURN TO TOWER', {
                ...buttonStyle,
                fill: '#00d4ff'
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            towerBtn.on('pointerover', () => towerBtn.setStyle({ fill: '#66e0ff' }));
            towerBtn.on('pointerout', () => towerBtn.setStyle({ fill: '#00d4ff' }));
            towerBtn.on('pointerdown', () => {
                if (this.bossId < TOTAL_BOSSES) {
                    GameData.currentBossId = this.bossId + 1;
                    GameData.saveProgress();
                }
                this.scene.start('TowerScene', {
                    playerClass: this.playerConfig.class,
                    weapon: this.playerConfig.weapon
                });
            });
        }
    }
}
