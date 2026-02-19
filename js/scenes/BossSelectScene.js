// BossSelectScene.js - Choose your boss
import { BOSSES } from '../data/BossData.js';
import { GameData } from '../data/GameData.js';

const UI = {
    bgTop:      0x050915,
    bgBottom:   0x111d35,
    panel:      0x101a30,
    panelAlt:   0x132341,
    border:     0x2f4a74,
    text:       '#ecf4ff',
    sub:        '#8fa7cf',
    muted:      '#6e86ad',
    btnBg:      '#182745',
    btnBorder:  '#3b82f6',
    btnFill:    '#c8d7f4',
    btnHoverBg: '#67e8f9',
    btnHoverFill: '#031323',
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
        const width  = this.cameras.main.width;
        const height = this.cameras.main.height;

        this._drawBackground(width, height);

        // ── Title block — same position/style as ClassSelectScene ──────────
        this.add.text(width / 2, 50, 'BOSS SELECT', {
            fontSize: '48px',
            fill: UI.text,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(width / 2, 96, `${this.playerClass}  ·  ${this.weapon}  —  choose your next encounter`, {
            fontSize: '20px',
            fill: UI.sub
        }).setOrigin(0.5);

        // ── Boss card grid ─────────────────────────────────────────────────
        this._drawGrid(width, height);

        // ── Bottom navigation — same style as ClassSelectScene ─────────────
        this._drawBottomButtons(width, height);
    }

    _drawBackground(width, height) {
        // Gradient
        const bg = this.add.graphics();
        bg.fillGradientStyle(UI.bgTop, UI.bgTop, UI.bgBottom, UI.bgBottom, 1);
        bg.fillRect(0, 0, width, height);

        // Animated particles — same as ClassSelectScene (100, 0x67e8f9)
        for (let i = 0; i < 100; i++) {
            const p = this.add.circle(
                Phaser.Math.Between(0, width),
                Phaser.Math.Between(0, height),
                Phaser.Math.Between(1, 2),
                0x67e8f9,
                Phaser.Math.FloatBetween(0.05, 0.28)
            );
            this.tweens.add({
                targets: p,
                alpha: Phaser.Math.FloatBetween(0.05, 0.35),
                duration: Phaser.Math.Between(1700, 3900),
                yoyo: true,
                repeat: -1
            });
        }
    }

    _drawGrid(width, height) {
        const bossIds = Object.keys(BOSSES).map(Number).sort((a, b) => a - b);
        const count   = bossIds.length;

        // Two rows of 5 when 10 bosses; adjust for other counts
        const cols = count > 6 ? Math.ceil(count / 2) : count;
        const rows = Math.ceil(count / cols);

        const contentTop    = 130;
        const contentBottom = height - 70;
        const contentH      = contentBottom - contentTop;

        const CARD_W = Math.min(158, Math.floor((width - 100) / cols) - 14);
        const CARD_H = Math.min(210, Math.floor(contentH / rows) - 16);
        const GAP_X  = Math.floor((width - 100 - cols * CARD_W) / (cols + 1));
        const GAP_Y  = Math.floor((contentH - rows * CARD_H) / (rows + 1));

        const gridW  = cols * CARD_W + (cols - 1) * GAP_X;
        const gridH  = rows * CARD_H + (rows - 1) * GAP_Y;
        const startX = width / 2 - gridW / 2;
        const startY = contentTop + (contentH - gridH) / 2;

        bossIds.forEach((bossId, idx) => {
            const col = idx % cols;
            const row = Math.floor(idx / cols);
            const cx  = startX + col * (CARD_W + GAP_X) + CARD_W / 2;
            const cy  = startY + row * (CARD_H + GAP_Y) + CARD_H / 2;
            this._drawCard(bossId, cx, cy, CARD_W, CARD_H);
        });
    }

    _drawCard(bossId, cx, cy, cw, ch) {
        const bossData = BOSSES[bossId];
        const unlocked = bossId <= GameData.unlockedBosses;
        const defeated = GameData.isBossDefeated(bossId);
        const colorNum = bossData.color;
        const glowNum  = bossData.glowColor;
        const glowS    = hexStr(glowNum);

        const alpha = defeated ? 0.48 : unlocked ? 1 : 0.28;

        // ── Panel ──
        const bg = this.add.graphics().setDepth(5).setAlpha(alpha);
        bg.fillStyle(UI.panelAlt, 1);
        bg.fillRoundedRect(cx - cw / 2, cy - ch / 2, cw, ch, 7);
        // Colour tint on lower third
        bg.fillStyle(colorNum, 0.07);
        bg.fillRoundedRect(cx - cw / 2, cy + ch / 6, cw, ch / 3,
            { bl: 7, br: 7, tl: 0, tr: 0 });
        // Border — matching ClassSelectScene panel stroke style
        bg.lineStyle(2, unlocked ? glowNum : UI.border, unlocked ? 0.42 : 0.18);
        bg.strokeRoundedRect(cx - cw / 2, cy - ch / 2, cw, ch, 7);

        // Top colour stripe (same 3px stripe as ClassSelectScene panels use via createPanel)
        const stripe = this.add.graphics().setDepth(6).setAlpha(alpha);
        stripe.fillStyle(colorNum, 0.85);
        stripe.fillRoundedRect(cx - cw / 2, cy - ch / 2, cw, 3,
            { tl: 7, tr: 7, bl: 0, br: 0 });

        // Pulsing border glow for fight-ready cards
        if (unlocked && !defeated) {
            const glow = this.add.graphics().setDepth(4);
            glow.lineStyle(2, glowNum, 0.3);
            glow.strokeRoundedRect(cx - cw / 2 - 1, cy - ch / 2 - 1, cw + 2, ch + 2, 8);
            this.tweens.add({
                targets: glow, alpha: { from: 0.12, to: 0.7 },
                duration: 1300, ease: 'Sine.easeInOut', yoyo: true, repeat: -1
            });
        }

        // ── Boss orb ──
        const orbY = cy - ch / 2 + 50;
        if (unlocked) {
            const orbGlow = this.add.circle(cx, orbY, 28, glowNum, 0.14)
                .setDepth(7).setAlpha(alpha);
            const orb = this.add.circle(cx, orbY, 22, colorNum, defeated ? 0.38 : 0.88)
                .setDepth(8).setAlpha(alpha);
            orb.setStrokeStyle(2, glowNum, 0.9);
            this.add.circle(cx, orbY, 6, 0xffffff, defeated ? 0.22 : 0.9)
                .setDepth(9).setAlpha(alpha);
            if (!defeated) {
                this.tweens.add({
                    targets: orbGlow, scale: 1.45, alpha: 0.04,
                    duration: 1100, ease: 'Sine.easeInOut', yoyo: true, repeat: -1
                });
            }
        } else {
            this.add.circle(cx, orbY, 22, 0x0d1628, 0.8)
                .setStrokeStyle(1, UI.border, 0.5).setDepth(7);
            const lg = this.add.graphics().setDepth(8).setAlpha(0.35);
            lg.fillStyle(UI.border, 0.8);
            lg.fillRoundedRect(cx - 8, orbY - 1, 16, 12, 3);
            lg.lineStyle(2, UI.border, 0.9);
            lg.beginPath(); lg.arc(cx, orbY - 1, 6, Math.PI, 0, false); lg.strokePath();
        }

        // ── Boss number badge ──
        const nb = this.add.graphics().setDepth(7).setAlpha(alpha);
        nb.fillStyle(0x0a1020, 0.95);
        nb.fillRoundedRect(cx - cw / 2 + 7, cy - ch / 2 + 7, 26, 18, 4);
        nb.lineStyle(1, glowNum, unlocked ? 0.5 : 0.18);
        nb.strokeRoundedRect(cx - cw / 2 + 7, cy - ch / 2 + 7, 26, 18, 4);
        this.add.text(cx - cw / 2 + 20, cy - ch / 2 + 16, String(bossId), {
            fontSize: '10px', fill: unlocked ? glowS : '#2a3a4a', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(8).setAlpha(alpha);

        // ── Text ──
        const textY = cy - ch / 2 + 84;
        this.add.text(cx, textY, unlocked ? bossData.name : '? ? ? ? ?', {
            fontSize: '14px', fill: unlocked ? (defeated ? UI.muted : UI.text) : '#1a2535',
            fontStyle: 'bold', wordWrap: { width: cw - 14 }, align: 'center'
        }).setOrigin(0.5, 0).setDepth(8).setAlpha(alpha);

        if (unlocked) {
            this.add.text(cx, textY + 22, bossData.attackType || '', {
                fontSize: '10px', fill: glowS, fontStyle: 'italic'
            }).setOrigin(0.5, 0).setDepth(8).setAlpha(alpha);

            // Divider
            const dv = this.add.graphics().setDepth(7).setAlpha(alpha * 0.5);
            const dvY = cy + ch / 2 - 54;
            dv.lineStyle(1, UI.border, 0.7);
            dv.lineBetween(cx - cw / 2 + 12, dvY, cx + cw / 2 - 12, dvY);

            // HP
            this.add.text(cx, dvY + 8, `${bossData.hp}  HP`, {
                fontSize: '13px', fill: defeated ? '#3a5040' : '#c8952a', fontStyle: 'bold'
            }).setOrigin(0.5, 0).setDepth(8).setAlpha(alpha);

            // Status badge
            const label      = defeated ? 'CLEARED' : 'FIGHT';
            const badgeColor = defeated ? 0x00ff88 : glowNum;
            const badgeBg    = defeated ? 0x001a0d : 0x060f1c;
            const pillW = label.length * 6.5 + 18;
            const badY  = cy + ch / 2 - 16;

            const pillG = this.add.graphics().setDepth(7).setAlpha(alpha);
            pillG.fillStyle(badgeBg, 0.9);
            pillG.fillRoundedRect(cx - pillW / 2, badY - 9, pillW, 18, 9);
            pillG.lineStyle(1, badgeColor, defeated ? 0.55 : 0.9);
            pillG.strokeRoundedRect(cx - pillW / 2, badY - 9, pillW, 18, 9);
            this.add.text(cx, badY, label, {
                fontSize: '10px', fill: hexStr(badgeColor), fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(8).setAlpha(alpha);

            if (!defeated) {
                this.tweens.add({
                    targets: pillG,
                    alpha: { from: alpha * 0.45, to: alpha },
                    duration: 750, ease: 'Sine.easeInOut', yoyo: true, repeat: -1
                });
            }
        }

        // ── Interactivity ──
        if (!unlocked) return;

        const hit = this.add.rectangle(cx, cy, cw, ch, 0xffffff, 0)
            .setDepth(20).setInteractive({ useHandCursor: true });

        hit.on('pointerover', () => {
            this.tweens.add({ targets: bg, alpha: Math.min(alpha + 0.18, 1), duration: 130 });
            this.tweens.add({ targets: hit, scaleX: 1.03, scaleY: 1.03, duration: 130 });
        });
        hit.on('pointerout', () => {
            this.tweens.add({ targets: bg, alpha, duration: 130 });
            this.tweens.add({ targets: hit, scaleX: 1, scaleY: 1, duration: 130 });
        });
        hit.on('pointerdown', () => {
            this.cameras.main.fade(260, 5, 10, 20);
            this.time.delayedCall(260, () => {
                this.scene.start('GameScene', {
                    playerConfig: { class: this.playerClass, weapon: this.weapon },
                    bossId
                });
            });
        });
    }

    _drawBottomButtons(width, height) {
        const y = height - 32;

        // ← BACK — identical style to ClassSelectScene createBottomButton
        const backBtn = this.add.text(80, y, '← BACK', {
            fontSize: '20px',
            fill: UI.btnFill,
            backgroundColor: UI.btnBg,
            stroke: UI.btnBorder,
            strokeThickness: 1,
            padding: { x: 12, y: 7 }
        }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

        backBtn.on('pointerdown', () => {
            this.scene.start('WeaponSelectScene', { playerClass: this.playerClass });
        });
        backBtn.on('pointerover', () =>
            backBtn.setStyle({ fill: UI.btnHoverFill, backgroundColor: UI.btnHoverBg }));
        backBtn.on('pointerout', () =>
            backBtn.setStyle({ fill: UI.btnFill, backgroundColor: UI.btnBg }));

        // Progress indicator — centre
        const total    = Object.keys(BOSSES).length;
        const defeated = GameData.defeatedBosses.size;
        this.add.text(width / 2, y, `${defeated} / ${total}  bosses cleared`, {
            fontSize: '15px', fill: UI.muted
        }).setOrigin(0.5);
    }
}
