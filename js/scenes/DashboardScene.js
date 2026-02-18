// DashboardScene.js - Player hub with progression, stats, and achievements
import { GameData } from '../data/GameData.js';
import { BOSSES } from '../data/BossData.js';
import { ACHIEVEMENTS, RARITY_COLORS } from '../data/AchievementData.js';
import { authManager } from '../data/AuthManager.js';
import { soundManager } from '../utils/SoundManager.js';

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
        this._activeTab = 'bosses'; // 'bosses' | 'stats' | 'achievements'
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.createBackground(width, height);
        this.createHeader(width);
        this.createTopStats(width);
        this.createTabs(width);
        this._contentGroup = [];
        this._renderTab(width, height);
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

        this.add.text(72, 95, 'Progression & statistics', {
            fontSize: '18px',
            fill: COLORS.muted
        });

        const user = authManager.getCurrentUser();
        const accountLabel = user?.email || 'Guest Mode';
        this.add.text(width - 300, 58, accountLabel, {
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
    }

    createTopStats(width) {
        const totalBosses = Object.keys(BOSSES).length;
        const defeated = GameData.defeatedBosses.size;
        const completion = Math.round((defeated / Math.max(totalBosses, 1)) * 100);

        const unlockedAch = GameData.unlockedAchievements.size;

        const cards = [
            { label: 'Bosses Defeated', value: `${defeated}/${totalBosses}`, color: 0x34d399 },
            { label: 'Completion', value: `${completion}%`, color: 0xfbbf24 },
            { label: 'Tower Record', value: `Floor ${GameData.infiniteBest || 0}`, color: 0xa78bfa },
            { label: 'Achievements', value: `${unlockedAch}/${ACHIEVEMENTS.length}`, color: 0x22d3ee },
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

            this.add.text(x + 16, y + 14, card.label, { fontSize: '15px', fill: COLORS.muted });

            const valueText = this.add.text(x + 16, y + 50, card.value, {
                fontSize: '28px',
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

    createTabs(width) {
        const tabs = [
            { id: 'bosses', label: 'BOSSES' },
            { id: 'stats', label: 'STATS' },
            { id: 'achievements', label: 'ACHIEVEMENTS' },
        ];

        const tabY = 282;
        const tabW = 160;
        const startX = 70;

        this._tabButtons = {};

        tabs.forEach((tab, i) => {
            const x = startX + i * (tabW + 8);
            const isActive = tab.id === this._activeTab;

            const bg = this.add.rectangle(x, tabY, tabW, 34, isActive ? 0x1e4a72 : 0x101d35, 1)
                .setOrigin(0, 0.5)
                .setStrokeStyle(1, isActive ? 0x38bdf8 : 0x2f4a74, 1)
                .setInteractive({ useHandCursor: true });

            const label = this.add.text(x + tabW / 2, tabY, tab.label, {
                fontSize: '14px',
                fill: isActive ? '#67e8f9' : COLORS.muted,
                fontStyle: isActive ? 'bold' : 'normal'
            }).setOrigin(0.5);

            this._tabButtons[tab.id] = { bg, label };

            bg.on('pointerdown', () => {
                soundManager.playClick();
                this._switchTab(tab.id, width, this.cameras.main.height);
            });
            bg.on('pointerover', () => {
                if (tab.id !== this._activeTab) bg.setFillStyle(0x162e4a, 1);
            });
            bg.on('pointerout', () => {
                if (tab.id !== this._activeTab) bg.setFillStyle(0x101d35, 1);
            });
        });
    }

    _switchTab(tabId, width, height) {
        if (tabId === this._activeTab) return;

        // Update tab button styles
        Object.entries(this._tabButtons).forEach(([id, { bg, label }]) => {
            const active = id === tabId;
            bg.setFillStyle(active ? 0x1e4a72 : 0x101d35, 1);
            bg.setStrokeStyle(1, active ? 0x38bdf8 : 0x2f4a74, 1);
            label.setStyle({ fill: active ? '#67e8f9' : COLORS.muted, fontStyle: active ? 'bold' : 'normal' });
        });

        // Destroy current content
        this._contentGroup.forEach(obj => obj?.destroy());
        this._contentGroup = [];

        this._activeTab = tabId;
        this._renderTab(width, height);
    }

    _renderTab(width, height) {
        switch (this._activeTab) {
            case 'bosses':      this._renderBossesTab(width, height); break;
            case 'stats':       this._renderStatsTab(width, height); break;
            case 'achievements': this._renderAchievementsTab(width, height); break;
        }
    }

    _panel(x, y, w, h) {
        const panel = this.add.rectangle(x, y, w, h, COLORS.panel, 0.9).setOrigin(0);
        panel.setStrokeStyle(1, COLORS.panelBorder, 0.95);
        this._contentGroup.push(panel);
        return panel;
    }

    _text(x, y, str, style) {
        const t = this.add.text(x, y, str, style);
        this._contentGroup.push(t);
        return t;
    }

    // ── TAB: Bosses ───────────────────────────────────────────────────────
    _renderBossesTab(width, height) {
        const x = 70, y = 306, w = width - 140, h = height - 406;
        this._panel(x, y, w, h);

        this._text(x + 20, y + 18, 'BOSS STATUS', {
            fontSize: '20px', fill: COLORS.accent, fontStyle: 'bold'
        });

        const headers = ['Boss', 'ID', 'Status'];
        const colX = [x + 28, x + w * 0.62, x + w * 0.78];
        headers.forEach((label, idx) => {
            this._text(colX[idx], y + 54, label, {
                fontSize: '16px', fill: '#9fb5d8', fontStyle: 'bold'
            });
        });

        const entries = Object.entries(BOSSES);
        entries.forEach(([bossId, boss], idx) => {
            const rowY = y + 88 + idx * 30;
            const defeated = GameData.isBossDefeated(Number(bossId));

            if (idx % 2 === 0) {
                const row = this.add.rectangle(x + 12, rowY - 4, w - 24, 24, 0x152545, 0.35).setOrigin(0);
                this._contentGroup.push(row);
            }

            this._text(colX[0], rowY, boss.name || `Boss ${bossId}`, { fontSize: '15px', fill: COLORS.text });
            this._text(colX[1], rowY, `${bossId}`, { fontSize: '15px', fill: '#9fb5d8' });
            this._text(colX[2], rowY, defeated ? 'Defeated' : 'Pending', {
                fontSize: '15px',
                fill: defeated ? '#34d399' : '#fbbf24',
                fontStyle: 'bold'
            });
        });
    }

    // ── TAB: Stats ────────────────────────────────────────────────────────
    _renderStatsTab(width, height) {
        const x = 70, y = 306, w = width - 140, h = height - 406;
        this._panel(x, y, w, h);

        this._text(x + 20, y + 18, 'LIFETIME STATS', {
            fontSize: '20px', fill: COLORS.accent, fontStyle: 'bold'
        });

        const s = GameData.stats;
        const playTimeMin = Math.floor((s.totalPlayTime || 0) / 60);

        const rows = [
            ['Total Runs', s.totalRuns || 0],
            ['Bosses Defeated', s.bossesDefeated || 0],
            ['Total Dodges', s.totalDodges || 0],
            ['Total Crits', s.totalCrits || 0],
            ['Total Damage', Math.floor(s.totalDamage || 0).toLocaleString()],
            ['No-Hit Clears', s.noHitBosses || 0],
            ['Highest Combo', s.highestCombo || 0],
            ['Tower Best Floor', GameData.infiniteBest || 0],
            ['Time Played', `${playTimeMin} min`],
        ];

        const colMid = x + w / 2;

        rows.forEach(([label, value], i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const cx = col === 0 ? x + 32 : colMid + 32;
            const cy = y + 64 + row * 42;

            if (i % 2 === 0) {
                const divider = this.add.rectangle(x + 12, cy - 8, w - 24, 34, 0x152545, 0.3).setOrigin(0);
                this._contentGroup.push(divider);
            }

            this._text(cx, cy, label, { fontSize: '14px', fill: COLORS.muted });
            this._text(cx, cy + 16, `${value}`, { fontSize: '17px', fill: COLORS.text, fontStyle: 'bold' });
        });
    }

    // ── TAB: Achievements ─────────────────────────────────────────────────
    _renderAchievementsTab(width, height) {
        const x = 70, y = 306, w = width - 140, h = height - 406;
        this._panel(x, y, w, h);

        const unlocked = GameData.unlockedAchievements.size;
        this._text(x + 20, y + 18, `ACHIEVEMENTS  ${unlocked}/${ACHIEVEMENTS.length}`, {
            fontSize: '20px', fill: COLORS.accent, fontStyle: 'bold'
        });

        const cols = 2;
        const itemW = Math.floor((w - 48) / cols);
        const itemH = 54;
        const gap = 8;

        ACHIEVEMENTS.forEach((ach, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const ix = x + 20 + col * (itemW + gap);
            const iy = y + 56 + row * (itemH + gap);

            const isUnlocked = GameData.isAchievementUnlocked(ach.id);
            const rarityColor = RARITY_COLORS[ach.rarity] || '#9ca3af';
            const rarityHex = parseInt(rarityColor.replace('#', ''), 16);

            const cardBg = this.add.rectangle(ix, iy, itemW, itemH, isUnlocked ? 0x0e2840 : 0x0a1520, 0.95)
                .setOrigin(0)
                .setStrokeStyle(1, isUnlocked ? rarityHex : 0x2f4a74, isUnlocked ? 0.9 : 0.4);
            this._contentGroup.push(cardBg);

            const iconText = this._text(ix + 10, iy + itemH / 2, ach.icon, {
                fontSize: '22px',
                alpha: isUnlocked ? 1 : 0.3
            }).setOrigin(0, 0.5);

            this._text(ix + 42, iy + 10, ach.name, {
                fontSize: '14px',
                fill: isUnlocked ? COLORS.text : '#4a5568',
                fontStyle: 'bold'
            });

            this._text(ix + 42, iy + 28, ach.description, {
                fontSize: '11px',
                fill: isUnlocked ? COLORS.muted : '#374151',
                wordWrap: { width: itemW - 50 }
            });

            if (isUnlocked) {
                this._text(ix + itemW - 8, iy + 8, ach.rarity.toUpperCase(), {
                    fontSize: '9px',
                    fill: rarityColor,
                    fontStyle: 'bold'
                }).setOrigin(1, 0);
            } else {
                this._text(ix + itemW / 2, iy + itemH / 2, '?', {
                    fontSize: '20px',
                    fill: '#374151',
                    fontStyle: 'bold'
                }).setOrigin(0.5);
            }
        });
    }

    // ── Action buttons ────────────────────────────────────────────────────
    createActionButtons(width, height) {
        const startBtn = this.createButton(180, height - 50, 'START RUN', () => {
            soundManager.playClick();
            this.scene.start('ClassSelectScene');
        });

        const backBtn = this.createButton(width - 180, height - 50, 'MAIN MENU', () => {
            soundManager.playClick();
            this.scene.start('MenuScene');
        });

        [startBtn, backBtn].forEach((btn) => {
            btn.on('pointerover', () => {
                soundManager.playHover();
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
