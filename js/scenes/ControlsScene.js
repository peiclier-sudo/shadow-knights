// ControlsScene.js — Help & Controls page with live keybinding rebinding
import { KeybindingsManager, keybindingsManager, ACTION_LABELS } from '../utils/KeybindingsManager.js';
import { soundManager } from '../utils/SoundManager.js';

const C = {
    bgTop:       0x050915,
    bgBottom:    0x101a30,
    panel:       0x0f1c34,
    panelBorder: 0x2f4a74,
    rowBg:       0x091420,
    rowHover:    0x162a45,
    rowListening:0x1a1200,
    text:        '#ecf4ff',
    muted:       '#8ea6cc',
    dimmed:      '#4a6080',
    accent:      '#67e8f9',
    green:       '#34d399',
    yellow:      '#fbbf24',
    red:         '#f87171',
    keyBg:       0x1a3358,
    keyBorder:   0x2f5a8f,
    keyListening:0xfbbf24,
};

// Human-readable section headers / descriptions for each action
const ACTION_DESC = {
    dash:         'Dash toward your cursor position instantly',
    ultimate:     'Hold to charge, release to trigger your ultimate',
    rangePreview: 'Toggle the attack range circle on/off',
    skillQ:       'Activate your Q skill',
    skillE:       'Activate your E skill (some require hold)',
    skillR:       'Activate your R skill (some require hold)',
    potion:       'Consume a healing potion from your inventory',
};

export class ControlsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ControlsScene' });
    }

    init(data) {
        this._origin      = data.originScene  || 'MenuScene';
        this._gameSceneKey = data.gameSceneKey || null;
        this._rebinding   = null;   // action currently being rebound
        this._bindingsDirty = false;
    }

    create() {
        const { width, height } = this.cameras.main;

        this._drawBackground(width, height);
        this._buildUI(width, height);
        this._setupKeyListener();
    }

    // ── Background ────────────────────────────────────────────────────

    _drawBackground(width, height) {
        if (this._origin === 'PauseScene') {
            // Semi-transparent dark layer on top of the already-paused game
            this.add.rectangle(0, 0, width, height, 0x000000, 0.78).setOrigin(0);
        } else {
            // Full gradient background (same style as other menu scenes)
            const bg = this.add.graphics();
            bg.fillGradientStyle(C.bgTop, C.bgTop, C.bgBottom, C.bgBottom, 1);
            bg.fillRect(0, 0, width, height);

            for (let i = 0; i < 55; i++) {
                const dot = this.add.circle(
                    Phaser.Math.Between(0, width),
                    Phaser.Math.Between(0, height),
                    Phaser.Math.Between(1, 2),
                    0x60a5fa,
                    Phaser.Math.FloatBetween(0.06, 0.26),
                );
                this.tweens.add({
                    targets: dot,
                    alpha: Phaser.Math.FloatBetween(0.02, 0.38),
                    y: dot.y + Phaser.Math.Between(-20, 20),
                    duration: Phaser.Math.Between(1800, 4200),
                    ease: 'Sine.easeInOut',
                    yoyo: true,
                    repeat: -1,
                });
            }
        }
    }

    // ── Main UI ───────────────────────────────────────────────────────

    _buildUI(width, height) {
        const margin = 60;
        const panX   = margin;
        const panW   = width - margin * 2;
        const panY   = 50;
        const panH   = height - 100;
        const cx     = panX + panW / 2;

        // Panel background
        this.add.rectangle(cx, panY + panH / 2, panW, panH, C.panel, 0.97)
            .setOrigin(0.5)
            .setStrokeStyle(2, C.panelBorder, 1);

        // ── Header ────────────────────────────────────────────────────
        const title = this.add.text(cx, panY + 46, 'AIDE & CONTRÔLES', {
            fontSize: '32px',
            fill: C.text,
            fontStyle: 'bold',
            stroke: C.accent,
            strokeThickness: 1,
        }).setOrigin(0.5);

        this.tweens.add({
            targets: title,
            alpha: { from: 0.88, to: 1 },
            duration: 2000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1,
        });

        this.add.text(cx, panY + 84, 'Click any keyboard binding row to reassign it  •  ESC cancels rebind', {
            fontSize: '14px',
            fill: C.muted,
        }).setOrigin(0.5);

        // Divider below header
        this._hline(panX + 24, panY + 104, panX + panW - 24, panY + 104, C.panelBorder, 0.6);

        // ── Two-column layout ─────────────────────────────────────────
        const colGap   = 24;
        const colW     = (panW - 48 - colGap) / 2;
        const leftX    = panX + 24;
        const rightX   = panX + 24 + colW + colGap;
        let   leftY    = panY + 118;
        let   rightY   = panY + 118;

        // ── LEFT COLUMN: Mouse controls (fixed) + gameplay tips ───────
        this._sectionLabel(leftX, leftY, '🖱  MOUSE CONTROLS  (not rebindable)');
        leftY += 22;

        const mouseControls = [
            { label: 'Move',               key: 'Left Click'         },
            { label: 'Basic attack',        key: 'Right Click'        },
            { label: 'Charged attack',      key: 'Hold Right Click'   },
        ];
        mouseControls.forEach(({ label, key }) => {
            this._fixedRow(leftX, leftY, colW, label, key);
            leftY += 40;
        });

        leftY += 8;
        this._hline(leftX, leftY, leftX + colW, leftY, C.panelBorder, 0.3);
        leftY += 14;

        // Gameplay tips section
        this._sectionLabel(leftX, leftY, '💡  GAMEPLAY TIPS');
        leftY += 22;

        const tips = [
            'Hold Right Click to charge, aim, then release.',
            'Skills have cooldowns — watch the UI icons.',
            'Dodge attacks to maintain your combo streak.',
            'Use potions before critical HP thresholds.',
            'Ultimate deals massive damage — save it!',
            'Range Preview shows your exact attack range.',
        ];
        tips.forEach(tip => {
            this.add.text(leftX + 8, leftY, `• ${tip}`, {
                fontSize: '13px',
                fill: C.muted,
                wordWrap: { width: colW - 16 },
            });
            leftY += 28;
        });

        // ── RIGHT COLUMN: Rebindable keyboard controls ────────────────
        this._sectionLabel(rightX, rightY, '⌨  KEYBOARD CONTROLS  (click to rebind)');
        rightY += 22;

        this._rowObjects = {};
        Object.keys(ACTION_LABELS).forEach(action => {
            this._rowObjects[action] = this._rebindRow(rightX, rightY, colW, action);
            rightY += 56;
        });

        // ── Listening indicator ───────────────────────────────────────
        this._listeningBadge = this.add.text(cx, panY + panH - 72, '', {
            fontSize: '15px',
            fill: C.yellow,
            fontStyle: 'bold',
            backgroundColor: '#0f0a00',
            padding: { x: 18, y: 8 },
        }).setOrigin(0.5).setAlpha(0).setDepth(10);

        // ── Bottom buttons ────────────────────────────────────────────
        const btnY = panY + panH - 30;

        this._makeTextBtn(cx - 110, btnY, 'RESET DEFAULTS', C.red, () => this._resetDefaults());
        this._makeTextBtn(cx + 110, btnY, '← BACK', C.text, () => this._back());

        // ESC: cancel rebind if active, otherwise go back
        this.input.keyboard.on('keydown-ESC', () => {
            if (this._rebinding) {
                this._cancelRebind();
            } else {
                this._back();
            }
        });
    }

    // ── Helpers ───────────────────────────────────────────────────────

    _hline(x1, y1, x2, y2, color, alpha) {
        const g = this.add.graphics();
        g.lineStyle(1, color, alpha);
        g.lineBetween(x1, y1, x2, y2);
    }

    _sectionLabel(x, y, text) {
        this.add.text(x, y, text, {
            fontSize: '12px',
            fill: C.dimmed,
            fontStyle: 'bold',
        });
    }

    _fixedRow(x, y, w, label, key) {
        this.add.rectangle(x + w / 2, y + 14, w, 32, C.rowBg, 0.6)
            .setOrigin(0.5)
            .setStrokeStyle(1, C.panelBorder, 0.25);

        this.add.text(x + 12, y + 14, label, {
            fontSize: '14px',
            fill: C.muted,
        }).setOrigin(0, 0.5);

        this.add.text(x + w - 12, y + 14, key, {
            fontSize: '13px',
            fill: C.dimmed,
            backgroundColor: '#060e1a',
            padding: { x: 8, y: 3 },
        }).setOrigin(1, 0.5);
    }

    _rebindRow(x, y, w, action) {
        const label      = ACTION_LABELS[action];
        const desc       = ACTION_DESC[action]  || '';
        const keyCode    = keybindingsManager.get(action);
        const displayKey = keybindingsManager.displayName(keyCode);

        // Row background (interactive)
        const rowBg = this.add.rectangle(x + w / 2, y + 22, w, 50, C.rowBg, 0.85)
            .setOrigin(0.5)
            .setStrokeStyle(1, C.panelBorder, 0.3)
            .setInteractive({ useHandCursor: true });

        // Action label
        this.add.text(x + 12, y + 11, label, {
            fontSize: '15px',
            fill: C.text,
            fontStyle: 'bold',
        });

        // Description
        this.add.text(x + 12, y + 31, desc, {
            fontSize: '11px',
            fill: C.dimmed,
        });

        // Key badge background
        const keyBadge = this.add.rectangle(x + w - 52, y + 22, 80, 28, C.keyBg, 1)
            .setOrigin(0.5)
            .setStrokeStyle(1, C.keyBorder, 0.8);

        // Key text
        const keyTxt = this.add.text(x + w - 52, y + 22, displayKey, {
            fontSize: '15px',
            fill: C.accent,
            fontStyle: 'bold',
        }).setOrigin(0.5);

        // Hover / click interactions
        rowBg.on('pointerover', () => {
            if (this._rebinding) return;
            rowBg.setFillStyle(C.rowHover, 0.9);
            keyBadge.setStrokeStyle(1, 0x67e8f9, 0.8);
            soundManager.playHover();
        });
        rowBg.on('pointerout', () => {
            if (this._rebinding === action) return;
            rowBg.setFillStyle(C.rowBg, 0.85);
            keyBadge.setStrokeStyle(1, C.keyBorder, 0.8);
        });
        rowBg.on('pointerdown', () => {
            if (this._rebinding) return;
            soundManager.playClick();
            this._startRebind(action);
        });

        return { rowBg, keyBadge, keyTxt };
    }

    _makeTextBtn(x, y, label, fill, action) {
        const btn = this.add.text(x, y, label, {
            fontSize: '14px',
            fill,
            backgroundColor: '#0a1220',
            padding: { x: 16, y: 8 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => {
            btn.setStyle({ fill: '#ffffff' });
            soundManager.playHover();
        });
        btn.on('pointerout', () => btn.setStyle({ fill }));
        btn.on('pointerdown', () => {
            soundManager.playClick();
            action();
        });
        return btn;
    }

    // ── Rebinding logic ───────────────────────────────────────────────

    _setupKeyListener() {
        this.input.keyboard.on('keydown', (event) => {
            if (!this._rebinding) return;

            // ESC is handled by the dedicated keydown-ESC listener
            if (event.keyCode === 27) return;

            const keyStr = KeybindingsManager.keycodeToString(event.keyCode);
            if (!keyStr) return;

            keybindingsManager.set(this._rebinding, keyStr);
            this._bindingsDirty = true;
            this._finishRebind(keyStr);
        });
    }

    _startRebind(action) {
        this._rebinding = action;
        const objs = this._rowObjects[action];

        objs.rowBg.setFillStyle(C.rowListening, 0.95);
        objs.keyBadge.setFillStyle(0x1a0d00, 1).setStrokeStyle(2, C.keyListening, 1);
        objs.keyTxt.setText('?').setStyle({ fill: C.yellow });

        this._listeningBadge.setText(`⌨  Press a key for  "${ACTION_LABELS[action]}"  —  ESC to cancel`);
        this.tweens.add({ targets: this._listeningBadge, alpha: 1, duration: 150 });
    }

    _finishRebind(keyStr) {
        const action = this._rebinding;
        this._rebinding = null;

        const objs       = this._rowObjects[action];
        const displayKey = keybindingsManager.displayName(keyStr);

        objs.rowBg.setFillStyle(C.rowBg, 0.85);
        objs.keyBadge.setFillStyle(C.keyBg, 1);
        objs.keyTxt.setText(displayKey).setStyle({ fill: C.accent });

        // Flash green to confirm
        objs.keyBadge.setStrokeStyle(2, 0x34d399, 1);
        this.time.delayedCall(700, () => {
            objs.keyBadge.setStrokeStyle(1, C.keyBorder, 0.8);
        });

        this.tweens.add({ targets: this._listeningBadge, alpha: 0, duration: 300 });
    }

    _cancelRebind() {
        const action = this._rebinding;
        this._rebinding = null;

        const objs       = this._rowObjects[action];
        const displayKey = keybindingsManager.displayName(keybindingsManager.get(action));

        objs.rowBg.setFillStyle(C.rowBg, 0.85);
        objs.keyBadge.setFillStyle(C.keyBg, 1).setStrokeStyle(1, C.keyBorder, 0.8);
        objs.keyTxt.setText(displayKey).setStyle({ fill: C.accent });

        this.tweens.add({ targets: this._listeningBadge, alpha: 0, duration: 200 });
    }

    _resetDefaults() {
        if (this._rebinding) this._cancelRebind();
        keybindingsManager.reset();
        this._bindingsDirty = true;

        Object.keys(ACTION_LABELS).forEach(action => {
            const objs       = this._rowObjects[action];
            const displayKey = keybindingsManager.displayName(keybindingsManager.get(action));
            objs.keyBadge.setFillStyle(C.keyBg, 1).setStrokeStyle(1, C.keyBorder, 0.8);
            objs.keyTxt.setText(displayKey).setStyle({ fill: C.accent });
            objs.rowBg.setFillStyle(C.rowBg, 0.85);
        });
    }

    _back() {
        if (this._rebinding) {
            this._cancelRebind();
            return;
        }

        if (this._origin === 'PauseScene') {
            // Apply new bindings to the live game session before resuming
            if (this._bindingsDirty && this._gameSceneKey) {
                this.scene.get(this._gameSceneKey)?.rebindInputs?.();
            }
            this.scene.stop('ControlsScene');
            this.scene.resume('PauseScene');
        } else {
            this.scene.start('MenuScene');
        }
    }
}
