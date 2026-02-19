// BossSelectScene.js - Boss selection hub
// Structure mirrors DashboardScene exactly (same C palette, same layout coords)
import { BOSSES } from '../data/BossData.js';
import { GameData } from '../data/GameData.js';
import { soundManager } from '../utils/SoundManager.js';

// ── Exact same palette as DashboardScene ──────────────────────────────────────
const C = {
    bgTop: 0x060b18, bgBottom: 0x131f38,
    panel: 0x101d35, panelBorder: 0x2f4a74,
    accent: '#67e8f9', text: '#ecf4ff', muted: '#8ea6cc'
};

const hexStr = n => '#' + n.toString(16).padStart(6, '0');

export class BossSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BossSelectScene' });
    }

    init(data) {
        this.playerClass = data.playerClass || 'WARRIOR';
        this.weapon      = data.weapon      || 'SWORD';
    }

    create() {
        const { width, height } = this.cameras.main;
        this.createBackground(width, height);
        this.createHeader(width);
        this.createTopStats(width);
        this.createBossRoster(width, height);
        this.createActionButtons(width, height);
    }

    // ── Background — identical to DashboardScene.createBackground ─────────
    createBackground(width, height) {
        const bg = this.add.graphics();
        bg.fillGradientStyle(C.bgTop, C.bgTop, C.bgBottom, C.bgBottom, 1);
        bg.fillRect(0, 0, width, height);
        for (let i = 0; i < 90; i++) {
            const dot = this.add.circle(
                Phaser.Math.Between(0, width), Phaser.Math.Between(0, height),
                Phaser.Math.Between(1, 2), 0x7dd3fc, Phaser.Math.FloatBetween(0.08, 0.35));
            this.tweens.add({ targets: dot, alpha: Phaser.Math.FloatBetween(0.1, 0.55),
                duration: Phaser.Math.Between(1500, 3600), yoyo: true, repeat: -1 });
        }
    }

    // ── Header — same coords/style as DashboardScene.createHeader ─────────
    createHeader(width) {
        const title = this.add.text(70, 48, 'BOSS SELECT', {
            fontSize: '38px', fill: C.text, fontStyle: 'bold' });
        this.add.text(72, 95, `${this.playerClass}  ·  ${this.weapon}  —  choose your next encounter`, {
            fontSize: '18px', fill: C.muted });
        // Top-right progress badge (mirrors "💾 Local Save" badge position)
        const total    = Object.keys(BOSSES).length;
        const defeated = GameData.defeatedBosses.size;
        this.add.text(width - 300, 58, `⚔  ${defeated} / ${total} Bosses Cleared`, {
            fontSize: '14px', fill: '#d9f99d', backgroundColor: '#365314', padding: { x: 10, y: 5 } });
        this.tweens.add({ targets: title, x: { from: 70, to: 77 }, duration: 2600,
            ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });
    }

    // ── Top stat cards — same layout as DashboardScene.createTopStats ─────
    createTopStats(width) {
        const total    = Object.keys(BOSSES).length;
        const defeated = GameData.defeatedBosses.size;
        const currentBoss = BOSSES[GameData.currentBossId] || BOSSES[1];
        const cards = [
            { label: 'Bosses Cleared',  value: `${defeated}/${total}`,                        color: 0x34d399 },
            { label: 'Shadow Crystals', value: `${GameData.coins} 💎`,                        color: 0xa78bfa },
            { label: 'Current Target',  value: currentBoss?.name || `Boss ${GameData.currentBossId}`, color: 0x22d3ee },
            { label: 'Tower Record',    value: `Floor ${GameData.infiniteBest || 0}`,          color: 0xfbbf24 },
        ];
        const margin = 70, gap = 16;
        const cardW = Math.floor((width - margin * 2 - gap * 3) / 4);
        cards.forEach((card, i) => {
            const x = margin + i * (cardW + gap), y = 140;
            const panel = this.add.rectangle(x, y, cardW, 120, C.panel, 0.92)
                .setOrigin(0).setStrokeStyle(1, card.color, 0.8);
            this.tweens.add({ targets: panel, y: { from: y, to: y - 4 },
                duration: 1700 + i * 220, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });
            this.add.text(x + 16, y + 14, card.label, { fontSize: '15px', fill: C.muted });
            const vt = this.add.text(x + 16, y + 50, card.value, {
                fontSize: card.value.length > 10 ? '18px' : '26px',
                fill: C.text, fontStyle: 'bold', wordWrap: { width: cardW - 30 } });
            this.tweens.add({ targets: vt, alpha: { from: 0.85, to: 1 }, duration: 1300, yoyo: true, repeat: -1 });
        });
    }

    // ── Boss roster panel (content area at exact Dashboard coords) ─────────
    createBossRoster(width, height) {
        // Section header — same style as Dashboard tab bar active button
        const tabY = 282;
        const hdrBg = this.add.rectangle(70, tabY, 180, 34, 0x1e4a72, 1)
            .setOrigin(0, 0.5)
            .setStrokeStyle(1, 0x38bdf8, 1);
        this.add.text(70 + 90, tabY, 'BOSS ROSTER', {
            fontSize: '13px', fill: '#67e8f9', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Main content panel — x=70, y=306, w=width-140 same as Dashboard
        const panX = 70, panY = 306;
        const panW = width - 140;
        const panH = height - 406;

        this.add.rectangle(panX, panY, panW, panH, C.panel, 0.92)
            .setOrigin(0)
            .setStrokeStyle(1, 0x2f4a74, 0.95);

        // Column headers
        const colX = [panX + 28, panX + panW * 0.42, panX + panW * 0.58, panX + panW * 0.75, panX + panW * 0.88];
        ['Boss', 'Attack Type', 'HP', 'Status', ''].forEach((l, i) =>
            this.add.text(colX[i], panY + 18, l, {
                fontSize: '14px', fill: '#9fb5d8', fontStyle: 'bold' }));

        // Horizontal rule under headers
        const hrG = this.add.graphics();
        hrG.lineStyle(1, 0x2f4a74, 0.6);
        hrG.lineBetween(panX + 12, panY + 42, panX + panW - 12, panY + 42);

        // Boss rows
        const bossIds = Object.keys(BOSSES).map(Number).sort((a, b) => a - b);
        const rowH = Math.min(36, Math.floor((panH - 60) / bossIds.length));

        bossIds.forEach((bossId, idx) => {
            const boss     = BOSSES[bossId];
            const unlocked = bossId <= GameData.unlockedBosses;
            const defeated = GameData.isBossDefeated(bossId);
            const rowY     = panY + 54 + idx * rowH;
            const alpha    = defeated ? 0.5 : unlocked ? 1 : 0.3;

            // Alternating row tint
            if (idx % 2 === 0) {
                this.add.rectangle(panX + 12, rowY - 2, panW - 24, rowH - 2, 0x152545, 0.35).setOrigin(0);
            }

            // Colour stripe on left edge
            const stripeG = this.add.graphics().setAlpha(alpha * 0.9);
            stripeG.fillStyle(boss.color, 0.85);
            stripeG.fillRect(panX + 12, rowY - 1, 3, rowH - 4);

            // Boss orb
            const orbX = panX + 22;
            const orbG = this.add.circle(orbX, rowY + rowH / 2 - 3, 6, boss.color, unlocked ? 0.85 : 0.25)
                .setAlpha(alpha);
            orbG.setStrokeStyle(1, boss.glowColor, 0.7);

            // Boss name
            this.add.text(colX[0], rowY + 4, boss.name || `Boss ${bossId}`, {
                fontSize: '15px', fill: defeated ? '#6a8a6a' : unlocked ? C.text : '#3a4a5a',
                fontStyle: unlocked && !defeated ? 'bold' : 'normal'
            }).setAlpha(alpha);

            // Attack type
            this.add.text(colX[1], rowY + 4, boss.attackType || '—', {
                fontSize: '13px', fill: C.muted }).setAlpha(alpha);

            // HP
            this.add.text(colX[2], rowY + 4, `${boss.hp}`, {
                fontSize: '14px', fill: defeated ? '#5a7a5a' : '#c8952a', fontStyle: 'bold'
            }).setAlpha(alpha);

            // Status badge
            const statusLabel = defeated ? 'CLEARED' : unlocked ? 'FIGHT' : 'LOCKED';
            const statusColor = defeated ? '#34d399' : unlocked ? hexStr(boss.glowColor) : '#4a5568';
            this.add.text(colX[3], rowY + 4, statusLabel, {
                fontSize: '13px', fill: statusColor, fontStyle: 'bold' }).setAlpha(alpha);

            // Action button — only for unlocked, undefeated bosses
            if (unlocked) {
                const btnLabel  = defeated ? 'REPLAY' : 'START';
                const btnBg     = defeated ? '#0e2e1a' : '#0a1428';
                const btnStroke = defeated ? '#34d399' : '#38bdf8';
                const btnFill   = defeated ? '#34d399' : '#67e8f9';

                const btn = this.add.text(colX[4], rowY + rowH / 2 - 2, btnLabel, {
                    fontSize: '12px', fill: btnFill,
                    backgroundColor: btnBg,
                    padding: { x: 10, y: 4 },
                    stroke: btnStroke, strokeThickness: 1
                }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true }).setAlpha(alpha);

                btn.on('pointerover', () => {
                    soundManager.playHover();
                    btn.setScale(1.06);
                    btn.setStyle({ backgroundColor: btnStroke === '#38bdf8' ? '#0ea5e9' : '#22c55e', fill: '#041322' });
                });
                btn.on('pointerout', () => {
                    btn.setScale(1);
                    btn.setStyle({ backgroundColor: btnBg, fill: btnFill });
                });
                btn.on('pointerdown', () => {
                    soundManager.playClick();
                    this.cameras.main.fade(260, 6, 11, 24);
                    this.time.delayedCall(260, () => {
                        this.scene.start('GameScene', {
                            playerConfig: { class: this.playerClass, weapon: this.weapon },
                            bossId
                        });
                    });
                });
            }

            // Row hover highlight for unlocked bosses
            if (unlocked) {
                const hitZone = this.add.rectangle(panX + 12, rowY - 1, panW - 24, rowH, 0xffffff, 0)
                    .setOrigin(0).setInteractive({ useHandCursor: false });
                hitZone.on('pointerover', () => {
                    stripeG.setAlpha(1);
                    orbG.setAlpha(1);
                });
                hitZone.on('pointerout', () => {
                    stripeG.setAlpha(alpha * 0.9);
                    orbG.setAlpha(alpha);
                });
            }
        });
    }

    // ── Action buttons — identical style to DashboardScene.createButton ───
    createActionButtons(width, height) {
        const backBtn = this.createButton(180, height - 50, '← BACK', () => {
            soundManager.playClick();
            this.scene.start('WeaponSelectScene', { playerClass: this.playerClass });
        });
        // Label shows current loadout in center
        this.add.text(width / 2, height - 50,
            `${this.playerClass}  ·  ${this.weapon}`, {
            fontSize: '16px', fill: C.muted
        }).setOrigin(0.5);

        [backBtn].forEach(btn => {
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
        const btn = this.add.text(x, y, label, {
            fontSize: '20px', fill: '#f8fbff', backgroundColor: '#1a2b4f',
            padding: { x: 18, y: 10 }, stroke: '#38bdf8', strokeThickness: 1
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        btn.on('pointerdown', onClick);
        this.tweens.add({ targets: btn, alpha: { from: 0.85, to: 1 }, duration: 1200, yoyo: true, repeat: -1 });
        return btn;
    }
}
