// ComboDisplay.js - Hit combo counter with multiplier display
// Resets on taking damage; milestones give a brief damage boost

import { GameData } from '../data/GameData.js';
import { soundManager } from '../utils/SoundManager.js';

const MILESTONES = [5, 10, 15, 25, 50];

export class ComboDisplay {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.count = 0;
        this._resetTimer = null;
        this._milestoneReached = new Set();

        const camW = scene.cameras.main.width;
        const x = camW / 2;
        const y = 56;

        this._numText = scene.add.text(x, y, '', {
            fontSize: '32px',
            fill: '#facc15',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 4,
            shadow: { offsetX: 0, offsetY: 0, color: '#facc15', blur: 12, fill: true }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(300).setAlpha(0);

        this._labelText = scene.add.text(x, y + 26, '', {
            fontSize: '13px',
            fill: '#fde68a',
            stroke: '#000',
            strokeThickness: 2
        }).setOrigin(0.5).setScrollFactor(0).setDepth(300).setAlpha(0);
    }

    /** Call on every successful hit against the boss */
    registerHit(isCrit = false) {
        this.count++;

        GameData.recordCombo(this.count);

        const milestone = MILESTONES.find(m => m === this.count && !this._milestoneReached.has(m));
        if (milestone) {
            this._milestoneReached.add(milestone);
            soundManager.playComboMilestone(MILESTONES.indexOf(milestone) + 1);
            this._flashMilestone(milestone);
        }

        this._refresh(isCrit);
        this._resetTimeout();
    }

    /** Call when player takes damage */
    reset() {
        if (this.count === 0) return;
        this.count = 0;
        this._milestoneReached.clear();
        this._hide();
        if (this._resetTimer) {
            this._resetTimer.remove(false);
            this._resetTimer = null;
        }
    }

    _refresh(isCrit) {
        if (this.count < 3) {
            this._numText.setAlpha(0);
            this._labelText.setAlpha(0);
            return;
        }

        const tier = this._getTier();
        this._numText.setText(`${this.count}x`);
        this._numText.setStyle({ fill: tier.color });
        this._labelText.setText(`COMBO ${tier.label}`);
        this._labelText.setStyle({ fill: tier.color });

        this._numText.setAlpha(1);
        this._labelText.setAlpha(1);

        // Pop animation on hit
        this.scene.tweens.killTweensOf(this._numText);
        this.scene.tweens.add({
            targets: [this._numText, this._labelText],
            scaleX: { from: 1.3, to: 1 },
            scaleY: { from: 1.3, to: 1 },
            duration: 150,
            ease: 'Back.easeOut'
        });
    }

    _getTier() {
        if (this.count >= 50) return { color: '#f87171', label: '• GODLIKE •' };
        if (this.count >= 25) return { color: '#c084fc', label: '• LEGENDARY •' };
        if (this.count >= 15) return { color: '#fb923c', label: '• EPIC •' };
        if (this.count >= 10) return { color: '#facc15', label: '• GREAT •' };
        return { color: '#a3e635', label: '' };
    }

    _resetTimeout() {
        if (this._resetTimer) this._resetTimer.remove(false);
        // Auto-break combo after 4 seconds of no hits
        this._resetTimer = this.scene.time.delayedCall(4000, () => {
            this._fadeOut();
            this.count = 0;
            this._milestoneReached.clear();
        });
    }

    _hide() {
        this._numText.setAlpha(0);
        this._labelText.setAlpha(0);
    }

    _fadeOut() {
        this.scene.tweens.add({
            targets: [this._numText, this._labelText],
            alpha: 0,
            duration: 600,
            ease: 'Sine.easeIn'
        });
    }

    _flashMilestone(count) {
        const camW = this.scene.cameras.main.width;
        const camH = this.scene.cameras.main.height;

        const flash = this.scene.add.text(camW / 2, camH / 2 - 60, `${count} HIT COMBO!`, {
            fontSize: '48px',
            fill: '#facc15',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 6,
            shadow: { offsetX: 0, offsetY: 0, color: '#facc15', blur: 30, fill: true }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(350);

        this.scene.tweens.add({
            targets: flash,
            y: flash.y - 40,
            alpha: { from: 1, to: 0 },
            scaleX: { from: 1.1, to: 0.85 },
            scaleY: { from: 1.1, to: 0.85 },
            duration: 1200,
            ease: 'Power2',
            onComplete: () => flash.destroy()
        });
    }
}
