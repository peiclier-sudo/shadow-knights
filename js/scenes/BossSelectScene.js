// BossSelectScene.js - Choose your boss
import { BOSSES } from '../data/BossData.js';
import { GameData } from '../data/GameData.js';

const UI = {
    bgTop:    0x050915,
    bgBottom: 0x111d35,
    panel:    0x0d1628,
    border:   0x29446f,
    accent:   '#67e8f9',
    text:     '#ecf4ff',
    sub:      '#8fa7cf',
    muted:    '#6e86ad',
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
        this.w = this.cameras.main.width;
        this.h = this.cameras.main.height;

        this._drawBackground();
        this._drawHeader();
        this._drawBossGrid();
        this._drawFooter();
    }

    _drawBackground() {
        const { w, h } = this;

        // Gradient fill
        const bg = this.add.graphics();
        bg.fillGradientStyle(UI.bgTop, UI.bgTop, UI.bgBottom, UI.bgBottom, 1);
        bg.fillRect(0, 0, w, h);

        // Animated particles
        for (let i = 0; i < 55; i++) {
            const star = this.add.circle(
                Phaser.Math.Between(0, w),
                Phaser.Math.Between(0, h),
                Phaser.Math.Between(1, 2),
                0x60a5fa,
                Phaser.Math.FloatBetween(0.05, 0.22)
            );
            this.tweens.add({
                targets: star,
                alpha: Phaser.Math.FloatBetween(0.02, 0.3),
                y: star.y + Phaser.Math.Between(-20, 20),
                duration: Phaser.Math.Between(2000, 5000),
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
            });
        }
    }

    _drawHeader() {
        const { w } = this;

        // Header bar
        const hdr = this.add.graphics().setDepth(10);
        hdr.fillStyle(0x080f1e, 0.98);
        hdr.fillRect(0, 0, w, 68);
        hdr.lineStyle(1, UI.border, 0.8);
        hdr.lineBetween(0, 68, w, 68);

        // Scanline
        const scan = this.add.rectangle(w / 2, 34, w, 2, 0x38bdf8, 0.06).setDepth(10);
        this.tweens.add({
            targets: scan,
            alpha: { from: 0.02, to: 0.14 },
            duration: 2800,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        // Title
        const title = this.add.text(w / 2, 34, 'SELECT BOSS', {
            fontSize: '26px',
            fill: UI.text,
            fontStyle: 'bold',
            stroke: '#22d3ee',
            strokeThickness: 1,
        }).setOrigin(0.5).setDepth(11);

        this.tweens.add({
            targets: title,
            alpha: { from: 0.85, to: 1 },
            duration: 1800,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        // Back button
        const back = this.add.text(24, 34, '‹  BACK', {
            fontSize: '15px',
            fill: UI.sub,
            fontStyle: 'bold',
            backgroundColor: '#0d1a2e',
            padding: { x: 12, y: 7 }
        }).setOrigin(0, 0.5).setDepth(11).setInteractive({ useHandCursor: true });

        back.on('pointerover', () => back.setStyle({ fill: UI.accent }));
        back.on('pointerout',  () => back.setStyle({ fill: UI.sub }));
        back.on('pointerdown', () => {
            this.scene.start('WeaponSelectScene', { playerClass: this.playerClass });
        });

        // Class · weapon badge
        this.add.text(w - 20, 34, `${this.playerClass}  ·  ${this.weapon}`, {
            fontSize: '12px', fill: UI.muted
        }).setOrigin(1, 0.5).setDepth(11);
    }

    _drawBossGrid() {
        const { w, h } = this;

        const bossIds  = Object.keys(BOSSES).map(Number).sort((a, b) => a - b);
        const count    = bossIds.length;

        // Layout — two rows of 5 if 10 bosses, else single row
        const cols     = count > 6 ? Math.ceil(count / 2) : count;
        const rows     = Math.ceil(count / cols);

        const CARD_W   = Math.min(160, Math.floor((w - 100) / cols) - 12);
        const CARD_H   = 220;
        const GAP_X    = Math.floor((w - 100) / cols) - CARD_W + 12;
        const GAP_Y    = 24;

        const totalW   = cols * CARD_W + (cols - 1) * GAP_X;
        const totalH   = rows * CARD_H + (rows - 1) * GAP_Y;
        const startX   = w / 2 - totalW / 2;
        const startY   = h / 2 - totalH / 2 + 10;

        bossIds.forEach((bossId, idx) => {
            const col  = idx % cols;
            const row  = Math.floor(idx / cols);
            const cx   = startX + col * (CARD_W + GAP_X) + CARD_W / 2;
            const cy   = startY + row * (CARD_H + GAP_Y) + CARD_H / 2;
            this._drawCard(bossId, cx, cy, CARD_W, CARD_H);
        });
    }

    _drawCard(bossId, cx, cy, cw, ch) {
        const bossData  = BOSSES[bossId];
        const unlocked  = bossId <= GameData.unlockedBosses;
        const defeated  = GameData.isBossDefeated(bossId);
        const colorNum  = bossData.color;
        const glowNum   = bossData.glowColor;
        const colorS    = hexStr(colorNum);
        const glowS     = hexStr(glowNum);

        const alpha = defeated ? 0.45 : unlocked ? 1 : 0.3;

        // ── Card panel ──
        const bg = this.add.graphics().setDepth(5).setAlpha(alpha);
        bg.fillStyle(UI.panel, 1);
        bg.fillRoundedRect(cx - cw / 2, cy - ch / 2, cw, ch, 8);
        // Boss-colour tint overlay on lower half
        bg.fillStyle(colorNum, 0.06);
        bg.fillRoundedRect(cx - cw / 2, cy, cw, ch / 2, { bl: 8, br: 8, tl: 0, tr: 0 });
        // Border
        bg.lineStyle(1, unlocked ? glowNum : UI.border, unlocked ? 0.45 : 0.15);
        bg.strokeRoundedRect(cx - cw / 2, cy - ch / 2, cw, ch, 8);

        // Top colour stripe
        const stripe = this.add.graphics().setDepth(6).setAlpha(alpha);
        stripe.fillStyle(colorNum, 0.9);
        stripe.fillRoundedRect(cx - cw / 2, cy - ch / 2, cw, 3, { tl: 8, tr: 8, bl: 0, br: 0 });

        // Glow ring for active/unlocked card
        if (unlocked && !defeated) {
            const glowBorder = this.add.graphics().setDepth(4);
            glowBorder.lineStyle(2, glowNum, 0.35);
            glowBorder.strokeRoundedRect(cx - cw / 2 - 1, cy - ch / 2 - 1, cw + 2, ch + 2, 9);
            this.tweens.add({
                targets: glowBorder, alpha: { from: 0.15, to: 0.65 },
                duration: 1400, ease: 'Sine.easeInOut', yoyo: true, repeat: -1
            });
        }

        // ── Boss orb ──
        const orbY = cy - ch / 2 + 52;
        if (unlocked) {
            const orbGlow = this.add.circle(cx, orbY, 30, glowNum, 0.12)
                .setDepth(7).setAlpha(alpha);
            const orb = this.add.circle(cx, orbY, 24, colorNum, defeated ? 0.35 : 0.85)
                .setDepth(8).setAlpha(alpha);
            orb.setStrokeStyle(2, glowNum, 0.9);
            this.add.circle(cx, orbY, 7, 0xffffff, defeated ? 0.25 : 0.9)
                .setDepth(9).setAlpha(alpha);

            if (!defeated) {
                this.tweens.add({
                    targets: orbGlow, scale: 1.4, alpha: 0.04,
                    duration: 1100, ease: 'Sine.easeInOut', yoyo: true, repeat: -1
                });
            }
        } else {
            this.add.circle(cx, orbY, 24, 0x111a2a, 0.7)
                .setStrokeStyle(1, 0x1d2d4a, 0.5).setDepth(7);
            // Lock icon
            const lockG = this.add.graphics().setDepth(8).setAlpha(0.4);
            lockG.fillStyle(0x29446f, 0.7);
            lockG.fillRoundedRect(cx - 9, orbY - 2, 18, 14, 3);
            lockG.lineStyle(2.5, 0x29446f, 0.9);
            lockG.beginPath();
            lockG.arc(cx, orbY - 2, 7, Math.PI, 0, false);
            lockG.strokePath();
        }

        // ── Boss number badge ──
        const badgeG = this.add.graphics().setDepth(7).setAlpha(alpha);
        badgeG.fillStyle(0x060d1a, 0.95);
        badgeG.fillRoundedRect(cx - cw / 2 + 8, cy - ch / 2 + 8, 28, 20, 4);
        badgeG.lineStyle(1, glowNum, unlocked ? 0.5 : 0.2);
        badgeG.strokeRoundedRect(cx - cw / 2 + 8, cy - ch / 2 + 8, 28, 20, 4);
        this.add.text(cx - cw / 2 + 22, cy - ch / 2 + 18, String(bossId), {
            fontSize: '10px', fill: unlocked ? glowS : '#334455', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(8).setAlpha(alpha);

        // ── Text content ──
        const textY = cy - ch / 2 + 90;

        this.add.text(cx, textY, unlocked ? bossData.name : '? ? ? ? ?', {
            fontSize: '14px',
            fill: unlocked ? (defeated ? UI.muted : UI.text) : '#1e2a3a',
            fontStyle: 'bold',
            wordWrap: { width: cw - 16 },
            align: 'center'
        }).setOrigin(0.5, 0).setDepth(8).setAlpha(alpha);

        if (unlocked) {
            this.add.text(cx, textY + 22, bossData.attackType || '', {
                fontSize: '10px',
                fill: glowS,
                fontStyle: 'italic'
            }).setOrigin(0.5, 0).setDepth(8).setAlpha(alpha);

            // HP
            const hpY = cy + ch / 2 - 50;
            const hpG = this.add.graphics().setDepth(7).setAlpha(alpha);
            hpG.lineStyle(1, 0x29446f, 0.5);
            hpG.lineBetween(cx - cw / 2 + 14, hpY - 10, cx + cw / 2 - 14, hpY - 10);
            this.add.text(cx, hpY + 2, `${bossData.hp} HP`, {
                fontSize: '13px', fill: defeated ? '#4a6040' : '#d4a040', fontStyle: 'bold'
            }).setOrigin(0.5, 0).setDepth(8).setAlpha(alpha);

            // Status badge
            const badY = cy + ch / 2 - 22;
            const statusLabel = defeated ? 'CLEARED' : 'FIGHT';
            const statusColor = defeated ? 0x00ff88 : glowNum;
            const statusBg    = defeated ? 0x001a0d : 0x050f1a;
            const pillW = statusLabel.length * 6.5 + 18;

            const pillG = this.add.graphics().setDepth(7).setAlpha(alpha);
            pillG.fillStyle(statusBg, 0.85);
            pillG.fillRoundedRect(cx - pillW / 2, badY - 9, pillW, 18, 9);
            pillG.lineStyle(1, statusColor, defeated ? 0.6 : 0.9);
            pillG.strokeRoundedRect(cx - pillW / 2, badY - 9, pillW, 18, 9);
            this.add.text(cx, badY, statusLabel, {
                fontSize: '10px', fill: hexStr(statusColor), fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(8).setAlpha(alpha);

            if (!defeated) {
                this.tweens.add({
                    targets: pillG,
                    alpha: { from: alpha * 0.5, to: alpha },
                    duration: 800, ease: 'Sine.easeInOut', yoyo: true, repeat: -1
                });
            }
        }

        // ── Interactivity ──
        if (!unlocked) return;

        const hit = this.add.rectangle(cx, cy, cw, ch, 0xffffff, 0)
            .setDepth(20).setInteractive({ useHandCursor: true });

        hit.on('pointerover', () => {
            this.tweens.add({ targets: bg, alpha: Math.min(alpha + 0.15, 1), duration: 150 });
            this.tweens.add({ targets: [hit], scaleX: 1.03, scaleY: 1.03, duration: 150 });
        });
        hit.on('pointerout', () => {
            this.tweens.add({ targets: bg, alpha, duration: 150 });
            this.tweens.add({ targets: [hit], scaleX: 1, scaleY: 1, duration: 150 });
        });
        hit.on('pointerdown', () => {
            this.cameras.main.fade(350, 5, 9, 21);
            this.time.delayedCall(350, () => {
                this.scene.start('GameScene', {
                    playerConfig: { class: this.playerClass, weapon: this.weapon },
                    bossId
                });
            });
        });
    }

    _drawFooter() {
        const { w, h } = this;

        // Gradient fade at bottom
        const fade = this.add.graphics().setDepth(8);
        for (let i = 0; i < 40; i++) {
            fade.fillStyle(UI.bgBottom, i / 40 * 0.7);
            fade.fillRect(0, h - 60 + i, w, 1);
        }

        const total    = Object.keys(BOSSES).length;
        const defeated = GameData.defeatedBosses.size;

        this.add.text(w / 2, h - 28, `${defeated} / ${total}  BOSSES CLEARED`, {
            fontSize: '12px', fill: UI.muted
        }).setOrigin(0.5).setDepth(9);

        // Progress bar
        const bw = 260;
        const bx = w / 2 - bw / 2;
        const barG = this.add.graphics().setDepth(9);
        barG.fillStyle(0x111d35, 1);
        barG.fillRoundedRect(bx, h - 14, bw, 4, 2);
        if (defeated > 0) {
            barG.fillStyle(0x67e8f9, 0.7);
            barG.fillRoundedRect(bx, h - 14, bw * (defeated / total), 4, 2);
        }
    }
}
