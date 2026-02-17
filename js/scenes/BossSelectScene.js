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
        this.selectedFloor = data.towerFloor || GameData.currentTowerFloor || 1;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.add.graphics()
            .fillStyle(0x0a0a14, 1)
            .fillRect(0, 0, width, height);

        this.add.text(width / 2, 56, 'TOWER OF BOSSES', {
            fontSize: '46px',
            fill: '#00d4ff',
            fontStyle: 'bold',
            stroke: '#fff',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.floorLabel = this.add.text(width / 2, 104, '', {
            fontSize: '24px',
            fill: '#ffd580',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const floor1Btn = this.add.text(width / 2 - 120, 144, 'FLOOR 1', {
            fontSize: '22px', fill: '#fff', backgroundColor: '#1f3a5f', padding: { x: 12, y: 6 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        const floor2Btn = this.add.text(width / 2 + 120, 144, 'FLOOR 2', {
            fontSize: '22px', fill: '#fff', backgroundColor: '#5f2f1f', padding: { x: 12, y: 6 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        floor1Btn.on('pointerdown', () => this.switchFloor(1));
        floor2Btn.on('pointerdown', () => this.switchFloor(2));

        this.floorButtons = { floor1Btn, floor2Btn };

        this.cards = [];
        this.renderBossCards(width, height);

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

    switchFloor(floor) {
        this.selectedFloor = floor;
        this.renderBossCards(this.cameras.main.width, this.cameras.main.height);
    }

    renderBossCards(width, height) {
        this.cards.forEach((obj) => obj.destroy());
        this.cards = [];

        this.floorLabel.setText(this.selectedFloor === 1 ? 'ETAGE 1 • VANGUARD TRIALS' : 'ETAGE 2 • ASCENDED TRIALS (HARD)');
        this.floorButtons.floor1Btn.setStyle({ fill: this.selectedFloor === 1 ? '#00d4ff' : '#fff' });
        this.floorButtons.floor2Btn.setStyle({ fill: this.selectedFloor === 2 ? '#ff9966' : '#fff' });

        const bossIds = Object.keys(BOSSES).map(Number).sort((a, b) => a - b);
        const cols = 5;
        const rows = 2;
        const cardWidth = 150;
        const cardHeight = 190;
        const gapX = 24;
        const gapY = 24;
        const gridW = cols * cardWidth + (cols - 1) * gapX;
        const startX = width / 2 - gridW / 2 + cardWidth / 2;
        const startY = 250;

        bossIds.forEach((bossId, index) => {
            const bossData = BOSSES[bossId];
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = startX + col * (cardWidth + gapX);
            const y = startY + row * (cardHeight + gapY);
            const effectiveHp = Math.round(bossData.hp * (this.selectedFloor === 2 ? 1.9 : 1));

            const card = this.add.rectangle(x, y, cardWidth, cardHeight, bossData.color, 0.22);
            card.setStrokeStyle(3, bossData.glowColor, 0.9);
            const title = this.add.text(x, y - 64, bossData.name, {
                fontSize: '18px',
                fill: '#fff',
                fontStyle: 'bold',
                align: 'center',
                wordWrap: { width: cardWidth - 16 }
            }).setOrigin(0.5);
            const attack = this.add.text(x, y - 32, bossData.attackType || '', {
                fontSize: '11px',
                fill: '#' + bossData.glowColor.toString(16).padStart(6, '0')
            }).setOrigin(0.5);
            const preview = this.add.circle(x, y + 2, 24, bossData.color, 0.5);
            preview.setStrokeStyle(2, bossData.glowColor, 0.8);
            const hp = this.add.text(x, y + 42, `HP: ${effectiveHp}`, { fontSize: '16px', fill: '#ffaa00' }).setOrigin(0.5);
            const id = this.add.text(x, y + 66, `#${bossId}`, { fontSize: '13px', fill: '#bbb' }).setOrigin(0.5);

            card.setInteractive({ useHandCursor: true });
            card.on('pointerover', () => {
                this.tweens.add({ targets: [card, preview], scaleX: 1.05, scaleY: 1.05, duration: 120 });
            });
            card.on('pointerout', () => {
                this.tweens.add({ targets: [card, preview], scaleX: 1, scaleY: 1, duration: 120 });
            });
            card.on('pointerdown', () => {
                GameData.currentTowerFloor = this.selectedFloor;
                GameData.currentBossId = bossId;
                GameData.saveProgress();
                this.cameras.main.fade(350, 0, 0, 0);
                this.time.delayedCall(350, () => {
                    this.scene.start('GameScene', {
                        playerConfig: { class: this.playerClass, weapon: this.weapon },
                        bossId,
                        towerFloor: this.selectedFloor
                    });
                });
            });

            this.cards.push(card, title, attack, preview, hp, id);
        });
    }
}
