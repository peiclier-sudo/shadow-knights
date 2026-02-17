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
        this.cards = [];
        this.towerSections = [];
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.createBackground(width, height);

        this.add.text(width / 2, 58, 'TOWER OF BOSSES', {
            fontSize: '50px',
            fill: '#00d4ff',
            fontStyle: 'bold',
            stroke: '#ffffff',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.add.text(width / 2, 98, 'Choose a tower, then pick any boss.', {
            fontSize: '18px',
            fill: '#9fb8d8'
        }).setOrigin(0.5);

        this.createTowerSections(width);

        // Boss list container
        this.gridPanel = this.add.rectangle(width / 2, height * 0.63, Math.min(1240, width - 90), Math.min(520, height * 0.58), 0x111c2c, 0.55)
            .setStrokeStyle(2, 0x2f5d8f, 0.8);

        this.floorLabel = this.add.text(width / 2, this.gridPanel.y - this.gridPanel.height / 2 + 30, '', {
            fontSize: '24px',
            fill: '#ffd580',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.renderBossCards(width, height);

        const backBtn = this.add.text(100, height - 60, '← BACK', {
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

    createBackground(width, height) {
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x080b14, 0x0f1422, 0x0c1220, 0x141d31, 1);
        bg.fillRect(0, 0, width, height);

        for (let i = 0; i < 36; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const p = this.add.circle(x, y, Phaser.Math.Between(1, 2), 0x77ccff, Phaser.Math.FloatBetween(0.08, 0.24));
            this.tweens.add({
                targets: p,
                alpha: 0.04,
                duration: Phaser.Math.Between(1800, 3200),
                yoyo: true,
                repeat: -1
            });
        }
    }

    createTowerSections(width) {
        const sectionsY = 166;
        const sectionW = Math.min(420, Math.floor((width - 140) / 2));
        const sectionH = 116;
        const gap = 36;
        const leftX = width / 2 - (sectionW / 2 + gap / 2);
        const rightX = width / 2 + (sectionW / 2 + gap / 2);

        const makeSection = (x, floor, title, subtitle, baseColor, hardColor) => {
            const active = this.selectedFloor === floor;
            const fillColor = active ? hardColor : baseColor;
            const panel = this.add.rectangle(x, sectionsY, sectionW, sectionH, fillColor, active ? 0.5 : 0.24)
                .setStrokeStyle(3, active ? 0xffffff : 0x4e6d8f, active ? 1 : 0.7)
                .setInteractive({ useHandCursor: true });

            const titleText = this.add.text(x, sectionsY - 26, title, {
                fontSize: '30px',
                fill: active ? '#ffffff' : '#dbe7f4',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            const subText = this.add.text(x, sectionsY + 4, subtitle, {
                fontSize: '14px',
                fill: active ? '#ffe2b8' : '#9fb8d8'
            }).setOrigin(0.5);

            const countText = this.add.text(x, sectionsY + 30, '10 BOSSES', {
                fontSize: '16px',
                fill: active ? '#ffd580' : '#a8c9e8',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            panel.on('pointerdown', () => {
                this.selectedFloor = floor;
                this.updateTowerSections();
                this.renderBossCards(this.cameras.main.width, this.cameras.main.height);
            });

            panel.on('pointerover', () => {
                this.tweens.add({ targets: [panel, titleText], scaleX: 1.02, scaleY: 1.02, duration: 120 });
            });

            panel.on('pointerout', () => {
                this.tweens.add({ targets: [panel, titleText], scaleX: 1, scaleY: 1, duration: 120 });
            });

            return { floor, panel, titleText, subText, countText, baseColor, hardColor };
        };

        this.towerSections = [
            makeSection(leftX, 1, 'TOWER 1', 'Vanguard Trials', 0x1f3a5f, 0x2f5b91),
            makeSection(rightX, 2, 'TOWER 2', 'Ascended Trials (Hard)', 0x5f2f1f, 0x8a3f27)
        ];
    }

    updateTowerSections() {
        this.towerSections.forEach((section) => {
            const active = this.selectedFloor === section.floor;
            section.panel.setFillStyle(active ? section.hardColor : section.baseColor, active ? 0.5 : 0.24);
            section.panel.setStrokeStyle(3, active ? 0xffffff : 0x4e6d8f, active ? 1 : 0.7);
            section.titleText.setStyle({ fill: active ? '#ffffff' : '#dbe7f4' });
            section.subText.setStyle({ fill: active ? '#ffe2b8' : '#9fb8d8' });
            section.countText.setStyle({ fill: active ? '#ffd580' : '#a8c9e8' });
        });
    }

    renderBossCards(width, height) {
        this.cards.forEach((obj) => obj.destroy());
        this.cards = [];

        this.updateTowerSections();

        this.floorLabel.setText(this.selectedFloor === 1
            ? 'TOWER 1 • FLOOR OF ORIGINS'
            : 'TOWER 2 • FLOOR OF ASCENSION');

        const bossIds = Object.keys(BOSSES).map(Number).sort((a, b) => a - b);
        const cols = 5;
        const rows = 2;

        const panelX = this.gridPanel.x;
        const panelY = this.gridPanel.y;
        const panelW = this.gridPanel.width;
        const panelH = this.gridPanel.height;

        const horizontalPadding = 26;
        const verticalPadding = 58;
        const gapX = 18;
        const gapY = 18;

        const cardWidth = Math.floor((panelW - horizontalPadding * 2 - gapX * (cols - 1)) / cols);
        const cardHeight = Math.floor((panelH - verticalPadding * 2 - gapY * (rows - 1)) / rows);

        const startX = panelX - panelW / 2 + horizontalPadding + cardWidth / 2;
        const startY = panelY - panelH / 2 + verticalPadding + cardHeight / 2;

        bossIds.forEach((bossId, index) => {
            const bossData = BOSSES[bossId];
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = startX + col * (cardWidth + gapX);
            const y = startY + row * (cardHeight + gapY);

            const hpScale = this.selectedFloor === 2 ? 1.9 : 1;
            const effectiveHp = Math.round(bossData.hp * hpScale);

            const card = this.add.rectangle(x, y, cardWidth, cardHeight, bossData.color, 0.24);
            card.setStrokeStyle(2, bossData.glowColor, 0.9);

            const title = this.add.text(x, y - cardHeight * 0.33, bossData.name, {
                fontSize: `${Math.max(14, Math.min(20, Math.floor(cardWidth * 0.11)))}px`,
                fill: '#ffffff',
                fontStyle: 'bold',
                align: 'center',
                wordWrap: { width: cardWidth - 14 }
            }).setOrigin(0.5);

            const attack = this.add.text(x, y - cardHeight * 0.16, bossData.attackType || '', {
                fontSize: `${Math.max(10, Math.floor(cardWidth * 0.075))}px`,
                fill: '#' + bossData.glowColor.toString(16).padStart(6, '0'),
                align: 'center',
                wordWrap: { width: cardWidth - 14 }
            }).setOrigin(0.5);

            const preview = this.add.circle(x, y + 4, Math.max(16, Math.floor(cardWidth * 0.11)), bossData.color, 0.52);
            preview.setStrokeStyle(2, bossData.glowColor, 0.85);

            const hpText = this.add.text(x, y + cardHeight * 0.19, `HP: ${effectiveHp}`, {
                fontSize: `${Math.max(12, Math.floor(cardWidth * 0.09))}px`,
                fill: '#ffaa00',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            const idText = this.add.text(x, y + cardHeight * 0.31, `#${bossId}`, {
                fontSize: `${Math.max(11, Math.floor(cardWidth * 0.075))}px`,
                fill: '#c7d6e5'
            }).setOrigin(0.5);

            card.setInteractive({ useHandCursor: true });
            card.on('pointerover', () => {
                this.tweens.add({ targets: [card, preview], scaleX: 1.04, scaleY: 1.04, duration: 120 });
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

            this.cards.push(card, title, attack, preview, hpText, idText);
        });
    }
}
