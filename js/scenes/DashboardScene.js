// DashboardScene.js - Player hub and progression overview
import { GameData } from '../data/GameData.js';
import { BOSSES } from '../data/BossData.js';
import { authManager } from '../data/AuthManager.js';

export class DashboardScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DashboardScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.createBackground(width, height);

        this.add.text(80, 48, 'DASHBOARD COMMAND CENTER', {
            fontSize: '34px',
            fill: '#e9f6ff',
            fontStyle: 'bold'
        });

        this.add.text(80, 96, 'Vue globale de ta progression et de tes performances', {
            fontSize: '18px',
            fill: '#7f92b8'
        });

        this.createTopStats(width);
        this.createBossTable(width, height);
        this.createActionButtons(width, height);
    }

    createBackground(width, height) {
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x060913, 0x060913, 0x0d1428, 0x0d1428, 1);
        bg.fillRect(0, 0, width, height);

        for (let i = 0; i < 120; i++) {
            const star = this.add.circle(
                Phaser.Math.Between(0, width),
                Phaser.Math.Between(0, height),
                Phaser.Math.Between(1, 2),
                0x7dd3fc,
                Phaser.Math.FloatBetween(0.08, 0.35)
            );

            this.tweens.add({
                targets: star,
                alpha: { from: star.alpha, to: Phaser.Math.FloatBetween(0.2, 0.7) },
                duration: Phaser.Math.Between(1800, 4200),
                repeat: -1,
                yoyo: true
            });
        }
    }

    createTopStats(width) {
        const totalBosses = Object.keys(BOSSES).length;
        const defeated = GameData.defeatedBosses.size;
        const completion = Math.round((defeated / Math.max(totalBosses, 1)) * 100);
        const user = authManager.getCurrentUser();

        const cards = [
            {
                label: 'Compte',
                value: user?.email || 'Invité',
                color: 0x00d4ff
            },
            {
                label: 'Boss vaincus',
                value: `${defeated}/${totalBosses}`,
                color: 0x22c55e
            },
            {
                label: 'Complétion',
                value: `${completion}%`,
                color: 0xf59e0b
            },
            {
                label: 'Record Tour Infinie',
                value: `${GameData.infiniteBest || 0}`,
                color: 0xa855f7
            }
        ];

        const cardWidth = 300;
        const gap = 20;

        cards.forEach((card, index) => {
            const x = 80 + (cardWidth + gap) * index;
            const y = 150;

            const container = this.add.container(x, y);
            const panel = this.add.rectangle(0, 0, cardWidth, 125, 0x0f1a33, 0.9).setOrigin(0);
            panel.setStrokeStyle(1, card.color, 0.8);

            const label = this.add.text(18, 16, card.label, {
                fontSize: '16px',
                fill: '#7f92b8'
            });

            const value = this.add.text(18, 56, card.value, {
                fontSize: '28px',
                fill: '#f8fbff',
                fontStyle: 'bold'
            });

            const glow = this.add.rectangle(cardWidth - 40, 22, 10, 10, card.color, 1).setOrigin(0.5);
            container.add([panel, label, value, glow]);
        });
    }

    createBossTable(width, height) {
        const panelX = 80;
        const panelY = 305;
        const panelW = width - 160;
        const panelH = height - 430;

        const panel = this.add.rectangle(panelX, panelY, panelW, panelH, 0x0f1a33, 0.85).setOrigin(0);
        panel.setStrokeStyle(1, 0x2d4672, 0.9);

        this.add.text(panelX + 20, panelY + 18, 'BOSSES & STATUT', {
            fontSize: '20px',
            fill: '#d8e8ff',
            fontStyle: 'bold'
        });

        const bossEntries = Object.entries(BOSSES);
        const colX = [panelX + 30, panelX + 520, panelX + 810];

        bossEntries.forEach(([bossId, boss], idx) => {
            const y = panelY + 70 + idx * 32;
            const defeated = GameData.isBossDefeated(Number(bossId));
            const status = defeated ? 'Vaincu' : 'En attente';
            const statusColor = defeated ? '#22c55e' : '#f59e0b';

            this.add.text(colX[0], y, boss.name || `Boss ${bossId}`, {
                fontSize: '17px',
                fill: '#f8fbff'
            });

            this.add.text(colX[1], y, `ID: ${bossId}`, {
                fontSize: '16px',
                fill: '#7f92b8'
            });

            this.add.text(colX[2], y, status, {
                fontSize: '16px',
                fill: statusColor,
                fontStyle: 'bold'
            });
        });
    }

    createActionButtons(width, height) {
        const backBtn = this.createButton(width - 220, height - 74, '← RETOUR MENU', () => {
            this.scene.start('MenuScene');
        });

        const startBtn = this.createButton(220, height - 74, 'LANCER UNE RUN', () => {
            this.scene.start('ClassSelectScene');
        });

        [backBtn, startBtn].forEach((btn) => {
            btn.on('pointerover', () => {
                btn.setScale(1.04);
                btn.setStyle({ backgroundColor: '#0ea5e9' });
            });

            btn.on('pointerout', () => {
                btn.setScale(1);
                btn.setStyle({ backgroundColor: '#1e293b' });
            });
        });
    }

    createButton(x, y, label, onClick) {
        const button = this.add.text(x, y, label, {
            fontSize: '20px',
            fill: '#f8fbff',
            backgroundColor: '#1e293b',
            padding: { x: 20, y: 12 },
            stroke: '#38bdf8',
            strokeThickness: 1
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        button.on('pointerdown', onClick);
        return button;
    }
}
