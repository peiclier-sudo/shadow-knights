// BossSelectScene.js - Choose your boss
import { BOSSES } from '../data/BossData.js';
import { GameData } from '../data/GameData.js';

export class BossSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BossSelectScene' });
    }
    
    init(data) {
        this.playerClass = data.playerClass || 'WARRIOR';
        this.weapon = data.weapon || 'SWORD';
    }
    
    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Background
        this.add.graphics()
            .fillStyle(0x0a0a14, 1)
            .fillRect(0, 0, width, height);
        
        // Title
        this.add.text(width/2, 80, 'SELECT BOSS', {
            fontSize: '48px',
            fill: '#00d4ff',
            fontStyle: 'bold',
            stroke: '#fff',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        const bossIds = Object.keys(BOSSES).map(Number).sort((a, b) => a - b);
        const cardWidth = 180;
        const step = Math.min(220, Math.max(170, Math.floor((width - 120) / Math.max(1, bossIds.length - 1))));
        const startX = width / 2 - (step * (bossIds.length - 1)) / 2;

        bossIds.forEach((bossId, index) => {
            const bossData = BOSSES[bossId];
            const unlocked = bossId <= GameData.unlockedBosses;
            const x = startX + index * step;
            const y = height / 2;

            // Card
            const card = this.add.rectangle(x, y, cardWidth, 300, bossData.color, unlocked ? 0.3 : 0.1);
            card.setStrokeStyle(4, bossData.glowColor, unlocked ? 1 : 0.3);

            // Boss name
            this.add.text(x, y - 110, bossData.name, {
                fontSize: '24px',
                fill: unlocked ? '#fff' : '#666',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            // Attack type label
            this.add.text(x, y - 82, bossData.attackType || '', {
                fontSize: '13px',
                fill: unlocked ? bossData.glowColor > 0 ? '#' + bossData.glowColor.toString(16).padStart(6, '0') : '#aaa' : '#555'
            }).setOrigin(0.5);

            // Boss preview circle
            const preview = this.add.circle(x, y - 22, 38, bossData.color, unlocked ? 0.5 : 0.2);
            preview.setStrokeStyle(3, bossData.glowColor, unlocked ? 0.8 : 0.3);

            // HP
            this.add.text(x, y + 42, `HP: ${bossData.hp}`, {
                fontSize: '18px',
                fill: unlocked ? '#ffaa00' : '#666'
            }).setOrigin(0.5);
            
            if (unlocked) {
                card.setInteractive({ useHandCursor: true });
                
                card.on('pointerover', () => {
                    this.tweens.add({
                        targets: [card, preview],
                        scaleX: 1.05,
                        scaleY: 1.05,
                        duration: 200
                    });
                });
                
                card.on('pointerout', () => {
                    this.tweens.add({
                        targets: [card, preview],
                        scaleX: 1,
                        scaleY: 1,
                        duration: 200
                    });
                });
                
                card.on('pointerdown', () => {
                    this.cameras.main.fade(500, 0, 0, 0);
                    this.time.delayedCall(500, () => {
                        this.scene.start('GameScene', {
                            playerConfig: {
                                class: this.playerClass,
                                weapon: this.weapon
                            },
                            bossId: bossId
                        });
                    });
                });
            } else {
                // Lock icon
                this.add.text(x, y + 80, '🔒', {
                    fontSize: '32px'
                }).setOrigin(0.5);
            }
        });
        
        // Back button
        const backBtn = this.add.text(100, height - 80, '← BACK', {
            fontSize: '24px',
            fill: '#aaa',
            backgroundColor: '#333',
            padding: { x: 15, y: 8 }
        }).setInteractive({ useHandCursor: true });
        
        backBtn.on('pointerdown', () => {
            this.scene.start('WeaponSelectScene', {
                playerClass: this.playerClass
            });
        });
    }
}