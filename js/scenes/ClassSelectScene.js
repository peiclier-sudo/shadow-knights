// ClassSelectScene.js - polished class selection
import { CLASSES } from '../classes/classData.js';

const BG = {
    top: 0x050915,
    bottom: 0x111d35,
    panel: 0x101a30,
    border: 0x2f4a74,
    text: '#ecf4ff',
    sub: '#8fa7cf'
};

export class ClassSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ClassSelectScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.drawBackground(width, height);

        this.add.text(width / 2, 62, 'SELECT YOUR CLASS', {
            fontSize: '46px',
            fill: BG.text,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(width / 2, 106, 'Choose your combat archetype', {
            fontSize: '19px',
            fill: BG.sub
        }).setOrigin(0.5);

        const classKeys = ['WARRIOR', 'MAGE', 'ROGUE'];
        const cardWidth = Math.min(350, Math.floor(width * 0.26));
        const cardHeight = 410;
        const gap = Math.floor((width - cardWidth * 3) / 4);
        const startY = height / 2 + 40;

        classKeys.forEach((key, index) => {
            const classData = CLASSES[key];
            const x = gap + cardWidth / 2 + index * (cardWidth + gap);
            this.createClassCard(x, startY, cardWidth, cardHeight, classData, key);
        });

        this.createBackButton(80, height - 60);
    }

    drawBackground(width, height) {
        const bg = this.add.graphics();
        bg.fillGradientStyle(BG.top, BG.top, BG.bottom, BG.bottom, 1);
        bg.fillRect(0, 0, width, height);

        for (let i = 0; i < 80; i++) {
            const p = this.add.circle(
                Phaser.Math.Between(0, width),
                Phaser.Math.Between(0, height),
                Phaser.Math.Between(1, 2),
                0x67e8f9,
                Phaser.Math.FloatBetween(0.06, 0.3)
            );

            this.tweens.add({
                targets: p,
                alpha: Phaser.Math.FloatBetween(0.05, 0.45),
                duration: Phaser.Math.Between(1800, 4200),
                yoyo: true,
                repeat: -1
            });
        }
    }

    createClassCard(x, y, w, h, classData, classKey) {
        const container = this.add.container(x, y);

        const shadow = this.add.rectangle(8, 10, w, h, 0x000000, 0.28).setOrigin(0.5);
        const panel = this.add.rectangle(0, 0, w, h, BG.panel, 0.92).setOrigin(0.5);
        panel.setStrokeStyle(2, classData.glowColor, 0.85);

        const badge = this.add.circle(0, -130, 48, classData.color, 0.22).setStrokeStyle(2, classData.glowColor, 0.95);
        const icon = this.add.text(0, -132, classData.name === 'WARRIOR' ? '⚔️' : classData.name === 'MAGE' ? '✨' : '🗡️', {
            fontSize: '36px'
        }).setOrigin(0.5);

        const title = this.add.text(0, -70, classData.name, {
            fontSize: '31px',
            fill: '#f8fbff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const stats = [
            `HP      ${classData.baseHealth}`,
            `STAMINA ${classData.baseStamina}`,
            `SPEED   ${classData.baseSpeed}`
        ];

        const statTexts = stats.map((line, i) => this.add.text(-w / 2 + 34, -10 + i * 36, line, {
            fontSize: '20px',
            fill: '#dbe7ff',
            fontFamily: 'monospace'
        }));

        const dash = this.add.text(0, 112, `DASH: ${classData.dash.name}`, {
            fontSize: '15px',
            fill: '#9cb5dd'
        }).setOrigin(0.5);

        const select = this.add.text(0, 160, 'SELECT CLASS', {
            fontSize: '18px',
            fill: '#041322',
            backgroundColor: '#67e8f9',
            padding: { x: 14, y: 8 },
            fontStyle: 'bold'
        }).setOrigin(0.5);

        container.add([shadow, panel, badge, icon, title, ...statTexts, dash, select]);

        panel.setInteractive({ useHandCursor: true });
        panel.on('pointerover', () => {
            container.setScale(1.02);
            this.tweens.add({ targets: badge, scale: 1.08, duration: 160 });
            select.setStyle({ backgroundColor: '#22d3ee' });
        });

        panel.on('pointerout', () => {
            container.setScale(1);
            this.tweens.add({ targets: badge, scale: 1, duration: 160 });
            select.setStyle({ backgroundColor: '#67e8f9' });
        });

        panel.on('pointerdown', () => {
            this.cameras.main.fade(260, 5, 10, 20);
            this.time.delayedCall(260, () => this.scene.start('WeaponSelectScene', { playerClass: classKey }));
        });
    }

    createBackButton(x, y) {
        const btn = this.add.text(x, y, '← BACK', {
            fontSize: '20px',
            fill: '#c8d7f4',
            backgroundColor: '#182745',
            stroke: '#3b82f6',
            strokeThickness: 1,
            padding: { x: 12, y: 7 }
        }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

        btn.on('pointerdown', () => this.scene.start('MenuScene'));
        btn.on('pointerover', () => btn.setStyle({ fill: '#031323', backgroundColor: '#67e8f9' }));
        btn.on('pointerout', () => btn.setStyle({ fill: '#c8d7f4', backgroundColor: '#182745' }));
    }
}
