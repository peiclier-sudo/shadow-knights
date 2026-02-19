// PauseScene.js — In-game pause overlay (launched as a parallel scene on top of GameScene)
import { soundManager } from '../utils/SoundManager.js';

const C = {
    bgOverlay:   0x000000,
    panel:       0x0f1c34,
    panelBorder: 0x2f4a74,
    text:        '#ecf4ff',
    muted:       '#8ea6cc',
    accent:      '#67e8f9',
    green:       0x34d399,
    red:         0xf87171,
    blue:        0x67e8f9,
};

export class PauseScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PauseScene' });
    }

    init(data) {
        this._gameSceneKey = data.gameSceneKey || 'GameScene';
    }

    create() {
        const { width, height } = this.cameras.main;
        const cx = width / 2;
        const cy = height / 2;

        // ── Dimmed overlay (blocks input to game scene) ──────────────
        this.add.rectangle(0, 0, width, height, C.bgOverlay, 0.68)
            .setOrigin(0)
            .setInteractive(); // swallows clicks so game doesn't receive them

        // ── Panel ────────────────────────────────────────────────────
        const panW = 400;
        const panH = 340;
        this.add.rectangle(cx, cy, panW, panH, C.panel, 0.98)
            .setStrokeStyle(2, C.panelBorder, 1);

        // ── Title ────────────────────────────────────────────────────
        const title = this.add.text(cx, cy - panH / 2 + 44, 'PAUSED', {
            fontSize: '40px',
            fill: C.text,
            fontStyle: 'bold',
            stroke: C.accent,
            strokeThickness: 1,
        }).setOrigin(0.5);

        this.tweens.add({
            targets: title,
            alpha: { from: 0.85, to: 1 },
            duration: 900,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1,
        });

        this.add.text(cx, cy - panH / 2 + 84, 'Game suspended', {
            fontSize: '15px',
            fill: C.muted,
        }).setOrigin(0.5);

        // Divider
        const dg = this.add.graphics();
        dg.lineStyle(1, C.panelBorder, 0.7);
        dg.lineBetween(cx - panW / 2 + 28, cy - panH / 2 + 106, cx + panW / 2 - 28, cy - panH / 2 + 106);

        // ── Buttons ──────────────────────────────────────────────────
        const btns = [
            {
                label: '▶  RESUME',
                hint: 'ESC',
                color: C.green,
                hexColor: '#34d399',
                y: cy - 64,
                action: () => this._resume(),
            },
            {
                label: '⌨  CONTROLS',
                hint: '',
                color: C.blue,
                hexColor: '#67e8f9',
                y: cy + 10,
                action: () => this._openControls(),
            },
            {
                label: '⌂  RETURN TO MENU',
                hint: '',
                color: C.red,
                hexColor: '#f87171',
                y: cy + 84,
                action: () => this._quit(),
            },
        ];

        btns.forEach(({ label, hint, color, hexColor, y, action }) => {
            const btnW = 320;
            const btn = this.add.rectangle(cx, y, btnW, 46, 0x0c1828, 1)
                .setStrokeStyle(1, color, 0.55)
                .setInteractive({ useHandCursor: true });

            const labelX = hint ? cx - 14 : cx;
            this.add.text(labelX, y, label, {
                fontSize: '17px',
                fill: hexColor,
                fontStyle: 'bold',
            }).setOrigin(0.5);

            if (hint) {
                this.add.text(cx + btnW / 2 - 10, y, hint, {
                    fontSize: '11px',
                    fill: C.muted,
                    backgroundColor: '#080f1c',
                    padding: { x: 6, y: 3 },
                }).setOrigin(1, 0.5);
            }

            btn.on('pointerover', () => {
                btn.setStrokeStyle(2, color, 0.9);
                btn.setFillStyle(0x162a45, 1);
                soundManager.playHover();
            });
            btn.on('pointerout',  () => {
                btn.setStrokeStyle(1, color, 0.55);
                btn.setFillStyle(0x0c1828, 1);
            });
            btn.on('pointerdown', () => {
                soundManager.playClick();
                action();
            });
        });

        // ── ESC key resumes ──────────────────────────────────────────
        this.input.keyboard.on('keydown-ESC', () => this._resume());
    }

    _resume() {
        const gameScene = this.scene.get(this._gameSceneKey);
        gameScene?.rebindInputs?.();
        this.scene.resume(this._gameSceneKey);
        this.scene.stop('PauseScene');
    }

    _openControls() {
        this.scene.launch('ControlsScene', {
            originScene: 'PauseScene',
            gameSceneKey: this._gameSceneKey,
        });
        this.scene.pause('PauseScene');
    }

    _quit() {
        this.scene.stop(this._gameSceneKey);
        this.scene.stop('PauseScene');
        this.scene.start('MenuScene');
    }
}
