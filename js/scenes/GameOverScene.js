// GameOverScene.js - Victory/defeat screen
import { GameData } from '../data/GameData.js';
import { BOSSES } from '../data/BossData.js';

export class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }
    
    init(data) {
        this.victory = data.victory || false;
        this.bossId = data.bossId || 1;
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
                playerConfig: { class: 'WARRIOR', weapon: 'SWORD' },
                bossId: GameData.currentBossId
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
        
        // Next boss button if victory and boss not last
        if (this.victory && GameData.currentBossId < 5) {
            const nextBtn = this.add.text(width/2, height/2 + 160, 'NEXT BOSS', {
                ...buttonStyle,
                fill: '#00ff88'
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });
            
            nextBtn.on('pointerover', () => nextBtn.setStyle({ fill: '#88ffaa' }));
            nextBtn.on('pointerout', () => nextBtn.setStyle({ fill: '#00ff88' }));
            nextBtn.on('pointerdown', () => {
                GameData.currentBossId++;
                GameData.saveProgress();
                this.scene.start('GameScene', {
                    playerConfig: { class: 'WARRIOR', weapon: 'SWORD' },
                    bossId: GameData.currentBossId
                });
            });
        }
    }
}