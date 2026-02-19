// GameOverScene.js - Victory/defeat screen
import { GameData } from '../data/GameData.js';
import { BOSSES } from '../data/BossData.js';
import { soundManager } from '../utils/SoundManager.js';

const TOTAL_BOSSES = Object.keys(BOSSES).length;

export class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }
    
    init(data) {
        this.victory        = data.victory        || false;
        this.bossId         = data.bossId         || 1;
        this.playerConfig   = data.playerConfig   || { class: 'WARRIOR', weapon: 'SWORD' };
        this.infiniteFloor  = data.infiniteFloor  || null;
        this.affixes        = data.affixes        || [];
        this.scaledHp       = data.scaledHp       || null;
        this.crystalsEarned = data.crystalsEarned || 0;
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
            this.add.text(width/2, height/2 - 70, `${bossName} DEFEATED`, {
                fontSize: '24px',
                fill: '#fff',
                stroke: '#000',
                strokeThickness: 2
            }).setOrigin(0.5);
        }

        // Run stats summary
        const rs = GameData.runStats;
        const noHitLabel = this.victory && rs.noHit ? '  |  NO HIT' : '';
        const elapsed = Math.floor((Date.now() - rs.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        const timeStr = `${minutes}:${String(seconds).padStart(2, '0')}`;

        const statLine = `Damage: ${Math.floor(rs.damage).toLocaleString()}  |  Crits: ${rs.crits}  |  Dodges: ${rs.dodges}  |  Best Combo: ${rs.highestCombo}x  |  Time: ${timeStr}${noHitLabel}`;
        this.add.text(width/2, height/2 - 20, statLine, {
            fontSize: '14px', fill: '#aaa', stroke: '#000', strokeThickness: 1
        }).setOrigin(0.5);

        // Crystal reward display
        if (this.crystalsEarned > 0) {
            const crystalText = this.add.text(width/2, height/2 + 10, `+${this.crystalsEarned} 💎 Shadow Crystals`, {
                fontSize: '20px', fill: '#a78bfa', fontStyle: 'bold',
                stroke: '#000', strokeThickness: 2
            }).setOrigin(0.5).setAlpha(0);

            this.tweens.add({
                targets: crystalText,
                alpha: 1, y: height/2 + 2,
                duration: 600, delay: 400, ease: 'Back.easeOut'
            });

            // Show total crystals
            this.add.text(width/2, height/2 + 34, `Total: ${GameData.coins} 💎`, {
                fontSize: '13px', fill: '#7c6fa8'
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
        const retryBtn = this.add.text(width/2 - 220, height/2 + 80, 'RETRY', buttonStyle)
            .setOrigin(0.5).setInteractive({ useHandCursor: true });
        retryBtn.on('pointerover', () => { soundManager.playHover(); retryBtn.setStyle({ fill: '#00d4ff' }); });
        retryBtn.on('pointerout', () => retryBtn.setStyle({ fill: '#fff' }));
        retryBtn.on('pointerdown', () => {
            soundManager.playClick();
            this.scene.start('GameScene', {
                playerConfig: this.playerConfig,
                bossId: this.bossId,
                affixes: this.affixes,
                scaledHp: this.scaledHp,
                infiniteFloor: this.infiniteFloor
            });
        });

        // Shop shortcut button
        const shopBtn = this.add.text(width/2, height/2 + 80, '💎 SHOP', {
            ...buttonStyle, fill: '#a78bfa', stroke: '#7c3aed'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        shopBtn.on('pointerover', () => { soundManager.playHover(); shopBtn.setStyle({ fill: '#c4b5fd' }); });
        shopBtn.on('pointerout', () => shopBtn.setStyle({ fill: '#a78bfa' }));
        shopBtn.on('pointerdown', () => {
            soundManager.playClick();
            // Go to dashboard with shop tab pre-selected
            this.registry.set('dashboardTab', 'shop');
            this.scene.start('DashboardScene');
        });

        // Menu button
        const menuBtn = this.add.text(width/2 + 220, height/2 + 80, 'MENU', buttonStyle)
            .setOrigin(0.5).setInteractive({ useHandCursor: true });
        menuBtn.on('pointerover', () => { soundManager.playHover(); menuBtn.setStyle({ fill: '#ff6600' }); });
        menuBtn.on('pointerout', () => menuBtn.setStyle({ fill: '#fff' }));
        menuBtn.on('pointerdown', () => {
            soundManager.playClick();
            this.scene.start('MenuScene');
        });
        
        // Tower / continue button on victory
        if (this.victory) {
            const isEndless = this.infiniteFloor !== null;

            if (isEndless) {
                // Advance infinite floor
                const nextFloor = this.infiniteFloor + 1;
                GameData.infiniteFloor = nextFloor;
                if (nextFloor > (GameData.infiniteBest || 0)) GameData.infiniteBest = nextFloor;
                GameData.saveProgress();

                const nextBtn = this.add.text(width/2, height/2 + 160, `FLOOR ${nextFloor}  ›`, {
                    ...buttonStyle, fill: '#00ff88'
                }).setOrigin(0.5).setInteractive({ useHandCursor: true });
                nextBtn.on('pointerover', () => nextBtn.setStyle({ fill: '#88ffaa' }));
                nextBtn.on('pointerout',  () => nextBtn.setStyle({ fill: '#00ff88' }));
                nextBtn.on('pointerdown', () => {
                    this.scene.start('TowerScene', {
                        playerClass: this.playerConfig.class,
                        weapon: this.playerConfig.weapon,
                        mode: 'endless'
                    });
                });
            } else {
                // Story mode: mark defeated, unlock next
                GameData.markBossDefeated(this.bossId);
                GameData.unlockNextBoss();
                if (this.bossId < TOTAL_BOSSES) {
                    GameData.currentBossId = this.bossId + 1;
                    GameData.saveProgress();
                }

                const towerBtn = this.add.text(width/2, height/2 + 160, 'RETURN TO TOWER', {
                    ...buttonStyle, fill: '#00d4ff'
                }).setOrigin(0.5).setInteractive({ useHandCursor: true });
                towerBtn.on('pointerover', () => towerBtn.setStyle({ fill: '#66e0ff' }));
                towerBtn.on('pointerout',  () => towerBtn.setStyle({ fill: '#00d4ff' }));
                towerBtn.on('pointerdown', () => {
                    this.scene.start('TowerScene', {
                        playerClass: this.playerConfig.class,
                        weapon: this.playerConfig.weapon,
                        mode: 'story'
                    });
                });
            }
        }
    }
}
