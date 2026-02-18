// DashboardScene.js - Player hub and progression overview
import { GameData } from '../data/GameData.js';
import { BOSSES } from '../data/BossData.js';
import { authManager } from '../data/AuthManager.js';

const COLORS = {
    bgTop: 0x060b18,
    bgBottom: 0x131f38,
    panel: 0x101d35,
    panelBorder: 0x2f4a74,
    accent: '#67e8f9',
    text: '#ecf4ff',
    muted: '#8ea6cc'
};

export class DashboardScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DashboardScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.createBackground(width, height);
        this.createHeader(width);
        this.createTopStats(width);
        this.createBossTable(width, height);
        this.createActionButtons(width, height);
    }

    createBackground(width, height) {
        const bg = this.add.graphics();
        bg.fillGradientStyle(COLORS.bgTop, COLORS.bgTop, COLORS.bgBottom, COLORS.bgBottom, 1);
        bg.fillRect(0, 0, width, height);

        for (let i = 0; i < 90; i++) {
            const dot = this.add.circle(
                Phaser.Math.Between(0, width),
                Phaser.Math.Between(0, height),
                Phaser.Math.Between(1, 2),
                0x7dd3fc,
                Phaser.Math.FloatBetween(0.08, 0.35)
            );

            this.tweens.add({
                targets: dot,
                alpha: Phaser.Math.FloatBetween(0.1, 0.55),
                duration: Phaser.Math.Between(1500, 3600),
                yoyo: true,
                repeat: -1
            });
        }
    }

    createHeader(width) {
        const title = this.add.text(70, 48, 'PLAYER DASHBOARD', {
            fontSize: '38px',
            fill: COLORS.text,
            fontStyle: 'bold'
        });

        const subtitle = this.add.text(72, 95, 'Progression, performances et état du compte', {
            fontSize: '18px',
            fill: COLORS.muted
        });

        const badge = this.add.text(width - 300, 58, 'LIVE SESSION', {
            fontSize: '14px',
            fill: '#d9f99d',
            backgroundColor: '#365314',
            padding: { x: 10, y: 5 }
        });

        this.tweens.add({
            targets: title,
            x: { from: 70, to: 77 },
            duration: 2600,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        this.tweens.add({
            targets: subtitle,
            alpha: { from: 0.75, to: 1 },
            duration: 1700,
            yoyo: true,
            repeat: -1
        });

        this.tweens.add({
            targets: badge,
            scale: { from: 1, to: 1.06 },
            duration: 900,
            yoyo: true,
            repeat: -1
        });
    }

    createTopStats(width) {
        const totalBosses = Object.keys(BOSSES).length;
        const defeated = GameData.defeatedBosses.size;
        const completion = Math.round((defeated / Math.max(totalBosses, 1)) * 100);
        const user = authManager.getCurrentUser();

        const cards = [
            { label: 'Compte', value: user?.email || 'Invité', color: 0x22d3ee },
            { label: 'Boss vaincus', value: `${defeated}/${totalBosses}`, color: 0x34d399 },
            { label: 'Complétion', value: `${completion}%`, color: 0xfbbf24 },
            { label: 'Record tour', value: `${GameData.infiniteBest || 0}`, color: 0xa78bfa }
        ];

        const margin = 70;
        const gap = 16;
        const cardWidth = Math.floor((width - margin * 2 - gap * 3) / 4);

        cards.forEach((card, index) => {
            const x = margin + index * (cardWidth + gap);
            const y = 140;

            const panel = this.add.rectangle(x, y, cardWidth, 120, COLORS.panel, 0.92).setOrigin(0);
            panel.setStrokeStyle(1, card.color, 0.8);

            this.tweens.add({
                targets: panel,
                y: { from: y, to: y - 4 },
                duration: 1700 + index * 220,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
            });

            this.add.text(x + 16, y + 14, card.label, {
                fontSize: '15px',
                fill: COLORS.muted
            });

            const valueText = this.add.text(x + 16, y + 50, card.value, {
                fontSize: card.label === 'Compte' ? '22px' : '30px',
                fill: COLORS.text,
                fontStyle: 'bold',
                wordWrap: { width: cardWidth - 30 }
            });

            this.tweens.add({
                targets: valueText,
                alpha: { from: 0.85, to: 1 },
                duration: 1300,
                yoyo: true,
                repeat: -1
            });
        });
    }

    createBossTable(width, height) {
        const x = 70;
        const y = 290;
        const w = width - 140;
        const h = height - 390;

        const panel = this.add.rectangle(x, y, w, h, COLORS.panel, 0.9).setOrigin(0);
        panel.setStrokeStyle(1, COLORS.panelBorder, 0.95);

        const sweep = this.add.rectangle(x + w / 2, y + 30, w - 30, 2, 0x38bdf8, 0.08);
        this.tweens.add({
            targets: sweep,
            y: y + h - 20,
            alpha: { from: 0.03, to: 0.2 },
            duration: 2800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.add.text(x + 20, y + 18, 'BOSSES STATUS', {
            fontSize: '20px',
            fill: COLORS.accent,
            fontStyle: 'bold'
        });

        const headers = ['Boss', 'ID', 'Statut'];
        const colX = [x + 28, x + w * 0.62, x + w * 0.78];

        headers.forEach((label, idx) => {
            this.add.text(colX[idx], y + 56, label, {
                fontSize: '16px',
                fill: '#9fb5d8',
                fontStyle: 'bold'
            });
        });

        const entries = Object.entries(BOSSES);
        entries.forEach(([bossId, boss], idx) => {
            const rowY = y + 90 + idx * 33;
            const defeated = GameData.isBossDefeated(Number(bossId));

            if (idx % 2 === 0) {
                this.add.rectangle(x + 12, rowY - 4, w - 24, 28, 0x152545, 0.35).setOrigin(0);
            }

            this.add.text(colX[0], rowY, boss.name || `Boss ${bossId}`, {
                fontSize: '16px',
                fill: COLORS.text
            });

            this.add.text(colX[1], rowY, `${bossId}`, {
                fontSize: '16px',
                fill: '#9fb5d8'
            });

            this.add.text(colX[2], rowY, defeated ? 'Vaincu' : 'Non vaincu', {
                fontSize: '16px',
                fill: defeated ? '#34d399' : '#fbbf24',
                fontStyle: 'bold'
            });
        });
    }

    createActionButtons(width, height) {
        const startBtn = this.createButton(180, height - 60, 'LANCER UNE RUN', () => {
            this.scene.start('ClassSelectScene');
        });

        const backBtn = this.createButton(width - 180, height - 60, 'RETOUR MENU', () => {
            this.scene.start('MenuScene');
        });

        [startBtn, backBtn].forEach((btn) => {
            btn.on('pointerover', () => {
                btn.setScale(1.03);
                btn.setStyle({ backgroundColor: '#0ea5e9', fill: '#041322' });
            });

            btn.on('pointerout', () => {
                btn.setScale(1);
                btn.setStyle({ backgroundColor: '#1a2b4f', fill: '#f8fbff' });
            });
        });
    }

    createButton(x, y, label, onClick) {
        const button = this.add.text(x, y, label, {
            fontSize: '20px',
            fill: '#f8fbff',
            backgroundColor: '#1a2b4f',
            padding: { x: 18, y: 10 },
            stroke: '#38bdf8',
            strokeThickness: 1
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        button.on('pointerdown', onClick);

        this.tweens.add({
            targets: button,
            alpha: { from: 0.85, to: 1 },
            duration: 1200,
            yoyo: true,
            repeat: -1
        });

        return button;
    }
}
