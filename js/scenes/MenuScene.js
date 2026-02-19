// MenuScene.js - Main menu

const COLORS = {
    bgTop: 0x050915,
    bgBottom: 0x101a30,
    panel: 0x111d35,
    panelBorder: 0x29446f,
    accent: '#67e8f9',
    primaryText: '#ecf4ff',
    secondaryText: '#93a8ca',
    mutedText: '#6e86ad'
};

export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
        this.toastLabel = null;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.createBackground(width, height);
        this.createHeader(width);
        this.createNavigation(width, height);
        this.createInfoPanels(width, height);
        this.createDataBadge(width, height);
        this.createFooter(width, height);
    }

    createBackground(width, height) {
        const bg = this.add.graphics();
        bg.fillGradientStyle(COLORS.bgTop, COLORS.bgTop, COLORS.bgBottom, COLORS.bgBottom, 1);
        bg.fillRect(0, 0, width, height);

        for (let i = 0; i < 70; i++) {
            const glow = this.add.circle(
                Phaser.Math.Between(0, width),
                Phaser.Math.Between(0, height),
                Phaser.Math.Between(1, 2),
                0x60a5fa,
                Phaser.Math.FloatBetween(0.08, 0.28)
            );

            this.tweens.add({
                targets: glow,
                alpha: Phaser.Math.FloatBetween(0.03, 0.35),
                y: glow.y + Phaser.Math.Between(-25, 25),
                duration: Phaser.Math.Between(2200, 4800),
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
            });
        }
    }

    createHeader(width) {
        const title = this.add.text(88, 60, 'SHADOW KNIGHTS', {
            fontSize: width < 1200 ? '56px' : '68px',
            fill: COLORS.primaryText,
            fontStyle: 'bold',
            stroke: '#22d3ee',
            strokeThickness: 2
        });

        const subtitle = this.add.text(92, 132, 'Ultimate Boss Rush Experience', {
            fontSize: '24px',
            fill: COLORS.secondaryText
        });

        const liveBadge = this.add.text(width - 330, 80, 'VERSION 1.3 • LIVE', {
            fontSize: '14px',
            fill: '#a5b4fc',
            backgroundColor: '#1e1b4b',
            padding: { x: 10, y: 6 }
        });

        this.tweens.add({
            targets: title,
            scale: { from: 1, to: 1.025 },
            duration: 2200,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        this.tweens.add({
            targets: subtitle,
            alpha: { from: 0.75, to: 1 },
            duration: 1900,
            yoyo: true,
            repeat: -1
        });

        this.tweens.add({
            targets: liveBadge,
            alpha: { from: 0.6, to: 1 },
            duration: 800,
            yoyo: true,
            repeat: -1
        });
    }

    createNavigation(width, height) {
        const panel = this.createPanel(80, 190, 530, height - 300);

        this.add.text(panel.x + 28, panel.y + 22, 'NAVIGATION', {
            fontSize: '18px',
            fill: COLORS.accent,
            fontStyle: 'bold'
        });

        const buttons = [
            { label: 'NOUVELLE PARTIE', icon: '▶', action: () => this.scene.start('ClassSelectScene') },
            { label: 'DASHBOARD JOUEUR', icon: '📊', action: () => this.scene.start('DashboardScene') },
            { label: 'AIDE & CONTRÔLES', icon: '❓', action: () => this.scene.start('ControlsScene', { originScene: 'MenuScene' }) },
            { label: 'PARAMÈTRES', icon: '⚙', action: () => this.showToast('Menu paramètres disponible dans la prochaine mise à jour.') }
        ];

        buttons.forEach((item, index) => {
            this.createMenuButton(panel.x + 28, panel.y + 76 + index * 84, `${item.icon}  ${item.label}`, item.action);
        });

        // Data storage info — replaces old auth status line
        const infoText = this.add.text(
            panel.x + 28,
            panel.y + panel.height - 74,
            '💾  Progress saved locally on this browser.\nUse Save Codes (Dashboard → Stats) to transfer.',
            {
                fontSize: '14px',
                fill: '#7dd3fc',
                wordWrap: { width: panel.width - 56 },
                lineSpacing: 4
            }
        );

        this.tweens.add({
            targets: infoText,
            alpha: { from: 0.6, to: 1 },
            duration: 2400,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }

    createInfoPanels(width, height) {
        const x = width - 520;
        const firstPanel = this.createPanel(x, 190, 440, 250);
        const secondPanel = this.createPanel(x, 470, 440, height - 580);

        this.add.text(firstPanel.x + 24, firstPanel.y + 20, 'MISSION BOARD', {
            fontSize: '18px',
            fill: '#7dd3fc',
            fontStyle: 'bold'
        });

        this.add.text(firstPanel.x + 24, firstPanel.y + 56, '• Defeat a boss without taking damage\n• Reach a 25-hit combo\n• Reach Floor 10 in Infinite Tower\n• Unlock all 16 achievements', {
            fontSize: '16px',
            fill: '#d6e4ff',
            lineSpacing: 9
        });

        this.add.text(secondPanel.x + 24, secondPanel.y + 20, 'PATCH NOTES', {
            fontSize: '18px',
            fill: '#c4b5fd',
            fontStyle: 'bold'
        });

        this.add.text(secondPanel.x + 24, secondPanel.y + 56,
            '• v1.3: Shadow Crystal currency & permanent upgrades\n• v1.3: Save Code system (cross-device progress)\n• v1.2: Procedural sound engine (Web Audio API)\n• v1.2: 16 achievements + in-game popups\n• v1.2: Hit combo system with milestones', {
            fontSize: '14px',
            fill: '#dbe5ff',
            lineSpacing: 8
        });
    }

    /**
     * Small floating badge (bottom-right) that quietly explains the no-account design.
     */
    createDataBadge(width, height) {
        const badge = this.add.rectangle(width - 26, height - 26, 340, 60, 0x0b1528, 0.88).setOrigin(1, 1);
        badge.setStrokeStyle(1, 0x29446f, 0.8);

        const icon = this.add.text(width - 352, height - 56, '🔒', { fontSize: '18px' }).setOrigin(0, 0.5);

        const msg = this.add.text(
            width - 326,
            height - 56,
            'No account needed — progress lives in your browser.',
            { fontSize: '13px', fill: '#93a8ca', wordWrap: { width: 290 } }
        ).setOrigin(0, 0.5);

        this.tweens.add({
            targets: [badge, icon, msg],
            alpha: { from: 0.55, to: 0.95 },
            duration: 3000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }

    createFooter(width, height) {
        this.add.text(width / 2, height - 28, 'SHADOW KNIGHTS © 2026 • Designed for competitive boss runners', {
            fontSize: '14px',
            fill: COLORS.mutedText
        }).setOrigin(0.5);
    }

    createPanel(x, y, width, height) {
        const panel = this.add.rectangle(x, y, width, height, COLORS.panel, 0.9).setOrigin(0);
        panel.setStrokeStyle(1, COLORS.panelBorder, 0.95);

        const scanline = this.add.rectangle(x + width / 2, y + height * 0.15, width - 24, 2, 0x38bdf8, 0.08);
        this.tweens.add({
            targets: scanline,
            y: y + height * 0.85,
            alpha: { from: 0.03, to: 0.18 },
            duration: 3200,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        return panel;
    }

    createMenuButton(x, y, label, onClick) {
        const button = this.add.text(x, y, label, {
            fontSize: '24px',
            fill: '#f8fbff',
            backgroundColor: '#182748',
            padding: { x: 18, y: 11 },
            stroke: '#4cc9f0',
            strokeThickness: 1
        }).setInteractive({ useHandCursor: true });

        button.on('pointerover', () => {
            button.setScale(1.02);
            button.setStyle({ backgroundColor: '#0ea5e9', fill: '#041323' });
        });

        button.on('pointerout', () => {
            button.setScale(1);
            button.setStyle({ backgroundColor: '#182748', fill: '#f8fbff' });
        });

        button.on('pointerdown', onClick);

        this.tweens.add({
            targets: button,
            x: { from: x, to: x + 3 },
            duration: 1800 + Phaser.Math.Between(0, 400),
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }

    showToast(message) {
        this.toastLabel?.destroy();
        this.toastLabel = this.add.text(this.cameras.main.width / 2, this.cameras.main.height - 70, message, {
            fontSize: '17px',
            fill: '#071322',
            backgroundColor: '#7dd3fc',
            padding: { x: 16, y: 10 }
        }).setOrigin(0.5);

        this.tweens.add({
            targets: this.toastLabel,
            alpha: 0,
            duration: 2200,
            onComplete: () => {
                this.toastLabel?.destroy();
                this.toastLabel = null;
            }
        });
    }
}
