// SettingsScene.js — Game settings (SFX volume, sound toggle, display options)
import { soundManager } from '../utils/SoundManager.js';
import { keybindingsManager } from '../utils/KeybindingsManager.js';

const C = {
    bg:          0x050d1c,
    panel:       0x0d1a30,
    border:      0x2a4060,
    accent:      '#67e8f9',
    text:        '#ecf4ff',
    muted:       '#7a96b8',
    green:       '#34d399',
    yellow:      '#facc15',
    red:         '#f87171',
};

export class SettingsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SettingsScene' });
    }

    init(data) {
        this._originScene = data?.originScene || 'MenuScene';
    }

    create() {
        const { width, height } = this.cameras.main;
        const cx = width / 2;

        // ── Background ──────────────────────────────────────────────
        const bg = this.add.graphics();
        bg.fillGradientStyle(C.bg, C.bg, 0x0a1525, 0x0a1525, 1);
        bg.fillRect(0, 0, width, height);

        // Subtle star particles
        for (let i = 0; i < 55; i++) {
            const s = this.add.circle(
                Phaser.Math.Between(0, width),
                Phaser.Math.Between(0, height),
                Phaser.Math.FloatBetween(0.8, 1.8),
                0x60a5fa,
                Phaser.Math.FloatBetween(0.05, 0.22)
            );
            this.tweens.add({
                targets: s,
                alpha: Phaser.Math.FloatBetween(0.02, 0.3),
                duration: Phaser.Math.Between(1800, 4200),
                yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
            });
        }

        // ── Header ──────────────────────────────────────────────────
        this.add.text(cx, 60, '⚙  SETTINGS', {
            fontSize: '44px', fill: C.text, fontStyle: 'bold',
            stroke: C.accent, strokeThickness: 1
        }).setOrigin(0.5);

        this.add.text(cx, 108, 'Configure your Shadow Knights experience', {
            fontSize: '16px', fill: C.muted
        }).setOrigin(0.5);

        // ── Main Panel ───────────────────────────────────────────────
        const panW  = Math.min(680, width - 80);
        const panH  = 480;
        const panX  = cx - panW / 2;
        const panY  = 148;

        const panel = this.add.rectangle(cx, panY + panH / 2, panW, panH, C.panel, 0.96)
            .setStrokeStyle(1, C.border, 1);

        let row = panY + 36;
        const rowH = 66;

        // ── Section: Audio ───────────────────────────────────────────
        this._sectionLabel(cx, row, '🔊  AUDIO', panW);
        row += 38;

        // Sound enabled toggle
        this._addToggleRow(cx, row, panW, 'Sound Effects', soundManager._enabled,
            (val) => {
                soundManager.setEnabled(val);
                if (val) soundManager.playClick();
            }
        );
        row += rowH;

        // Volume slider (custom drawn)
        this._addSliderRow(cx, row, panW, 'SFX Volume',
            soundManager._sfxVolume,
            0, 1,
            (val) => {
                soundManager.setVolume(val);
                soundManager.playClick();
            }
        );
        row += rowH + 10;

        // ── Section: Gameplay ────────────────────────────────────────
        this._sectionLabel(cx, row, '🎮  GAMEPLAY', panW);
        row += 38;

        // Attack range preview toggle (reads GameScene preference via localStorage)
        const savedPreview = localStorage.getItem('shadowKnightsRangePreview');
        const previewEnabled = savedPreview === null ? true : savedPreview === 'true';
        this._addToggleRow(cx, row, panW, 'Attack Range Preview (T)', previewEnabled,
            (val) => {
                localStorage.setItem('shadowKnightsRangePreview', val);
            }
        );
        row += rowH;

        // ── Section: Controls hint ───────────────────────────────────
        this._sectionLabel(cx, row, '⌨  KEYBINDINGS', panW);
        row += 38;

        const bindings = keybindingsManager.getAll?.() || {};
        const bindPairs = Object.entries(bindings).slice(0, 4);
        const bindText = bindPairs.map(([k, v]) => `${k.toUpperCase()}: [${v}]`).join('   •   ');
        this.add.text(cx, row + 12, bindText || 'SPACE: Dash   •   Q/E/R: Skills   •   1: Potion', {
            fontSize: '14px', fill: C.muted, align: 'center',
            wordWrap: { width: panW - 48 }
        }).setOrigin(0.5);

        const kbBtn = this._makeButton(cx, row + 44, 'EDIT KEYBINDINGS', 220, 36, C.accent, () => {
            soundManager.playClick();
            this.scene.launch('ControlsScene', { originScene: 'SettingsScene' });
            this.scene.pause('SettingsScene');
        });

        row += 90;

        // ── Section: About ───────────────────────────────────────────
        this._sectionLabel(cx, row, 'ℹ  ABOUT', panW);
        row += 38;
        this.add.text(cx, row + 8, 'Shadow Knights v1.4  •  All sounds synthesized in real-time via Web Audio API  •  No files needed', {
            fontSize: '13px', fill: C.muted, align: 'center',
            wordWrap: { width: panW - 48 }
        }).setOrigin(0.5);

        // ── Back Button ──────────────────────────────────────────────
        this._makeButton(cx, height - 58, '← BACK', 180, 44, C.accent, () => {
            soundManager.playClick();
            this._goBack();
        });

        // ESC key
        this.input.keyboard.on('keydown-ESC', () => {
            soundManager.playClick();
            this._goBack();
        });
    }

    _goBack() {
        if (this._originScene === 'PauseScene') {
            // Return to the pause overlay (which was paused while settings was open)
            this.scene.stop('SettingsScene');
            this.scene.resume('PauseScene');
        } else {
            this.scene.start(this._originScene);
        }
    }

    // ── Helper: section separator label ─────────────────────────────
    _sectionLabel(cx, y, text, panW) {
        this.add.text(cx - panW / 2 + 28, y, text, {
            fontSize: '13px', fill: C.accent, fontStyle: 'bold'
        });
        const g = this.add.graphics();
        g.lineStyle(1, 0x2a4060, 0.7);
        g.lineBetween(cx - panW / 2 + 28, y + 20, cx + panW / 2 - 28, y + 20);
    }

    // ── Helper: ON/OFF toggle row ────────────────────────────────────
    _addToggleRow(cx, y, panW, label, initialValue, onChange) {
        this.add.text(cx - panW / 2 + 28, y + 10, label, {
            fontSize: '16px', fill: C.text
        });

        let enabled = initialValue;
        const btnX = cx + panW / 2 - 90;
        const btnY = y + 10;

        const bg = this.add.rectangle(btnX, btnY, 72, 30, enabled ? 0x166534 : 0x4b1a1a, 1)
            .setStrokeStyle(1, enabled ? 0x34d399 : 0xf87171, 0.9)
            .setInteractive({ useHandCursor: true });

        const lbl = this.add.text(btnX, btnY, enabled ? 'ON' : 'OFF', {
            fontSize: '14px',
            fill: enabled ? C.green : C.red,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const refresh = () => {
            bg.setFillStyle(enabled ? 0x166534 : 0x4b1a1a);
            bg.setStrokeStyle(1, enabled ? 0x34d399 : 0xf87171, 0.9);
            lbl.setText(enabled ? 'ON' : 'OFF');
            lbl.setStyle({ fill: enabled ? C.green : C.red });
        };

        bg.on('pointerdown', () => {
            soundManager.playHover();
            enabled = !enabled;
            refresh();
            onChange(enabled);
        });
        bg.on('pointerover', () => bg.setAlpha(0.8));
        bg.on('pointerout',  () => bg.setAlpha(1));
    }

    // ── Helper: numeric slider row ──────────────────────────────────
    _addSliderRow(cx, y, panW, label, initialValue, min, max, onChange) {
        this.add.text(cx - panW / 2 + 28, y + 8, label, {
            fontSize: '16px', fill: C.text
        });

        const sliderW = 220;
        const sliderX = cx + panW / 2 - sliderW - 30;
        const sliderY = y + 16;
        const trackH  = 6;

        // Track background
        const trackBg = this.add.rectangle(sliderX + sliderW / 2, sliderY, sliderW, trackH, 0x1e3a5a, 1)
            .setStrokeStyle(1, 0x2a4060, 1);

        let value = Phaser.Math.Clamp(initialValue, min, max);
        const ratio = (value - min) / (max - min);

        // Filled portion
        const fill = this.add.rectangle(
            sliderX, sliderY, sliderW * ratio, trackH, 0x67e8f9, 1
        ).setOrigin(0, 0.5);

        // Thumb
        const thumb = this.add.circle(sliderX + sliderW * ratio, sliderY, 10, 0xecf4ff, 1)
            .setStrokeStyle(2, 0x67e8f9, 1)
            .setInteractive({ useHandCursor: true, draggable: true });

        // Value label
        const valText = this.add.text(sliderX + sliderW + 14, sliderY, Math.round(value * 100) + '%', {
            fontSize: '14px', fill: C.accent
        }).setOrigin(0, 0.5);

        // Drag logic
        this.input.setDraggable(thumb);
        this.input.on('drag', (_ptr, obj, dragX) => {
            if (obj !== thumb) return;
            const clampedX = Phaser.Math.Clamp(dragX, sliderX, sliderX + sliderW);
            const newRatio = (clampedX - sliderX) / sliderW;
            value = min + newRatio * (max - min);

            thumb.x = clampedX;
            fill.width = sliderW * newRatio;
            valText.setText(Math.round(value * 100) + '%');
            onChange(value);
        });
    }

    // ── Helper: simple button ────────────────────────────────────────
    _makeButton(cx, cy, text, w, h, colorHex, onClick) {
        const colorInt = parseInt(colorHex.replace('#', ''), 16);
        const bg = this.add.rectangle(cx, cy, w, h, 0x0a1828, 1)
            .setStrokeStyle(1, colorInt, 0.7)
            .setInteractive({ useHandCursor: true });

        const lbl = this.add.text(cx, cy, text, {
            fontSize: '15px', fill: colorHex, fontStyle: 'bold'
        }).setOrigin(0.5);

        bg.on('pointerover', () => { bg.setFillStyle(0x162a45); soundManager.playHover(); });
        bg.on('pointerout',  () => bg.setFillStyle(0x0a1828));
        bg.on('pointerdown', onClick);

        return bg;
    }
}
