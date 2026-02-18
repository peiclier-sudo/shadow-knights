// AchievementNotifier.js - In-game achievement unlock popup
// Checks all achievements and shows animated toast on unlock

import { ACHIEVEMENTS, RARITY_COLORS } from '../data/AchievementData.js';
import { GameData } from '../data/GameData.js';
import { soundManager } from '../utils/SoundManager.js';

export class AchievementNotifier {
    constructor(scene) {
        this.scene = scene;
        this._queue = [];
        this._showing = false;
    }

    /**
     * Call this after any stat change to check for newly unlocked achievements.
     */
    check() {
        for (const ach of ACHIEVEMENTS) {
            if (GameData.isAchievementUnlocked(ach.id)) continue;
            if (ach.condition(GameData)) {
                const justUnlocked = GameData.unlockAchievement(ach.id);
                if (justUnlocked) {
                    this._queue.push(ach);
                }
            }
        }
        this._flush();
    }

    _flush() {
        if (this._showing || this._queue.length === 0) return;
        this._showing = true;
        this._showNext();
    }

    _showNext() {
        if (this._queue.length === 0) {
            this._showing = false;
            return;
        }

        const ach = this._queue.shift();
        soundManager.playAchievement();
        this._renderToast(ach, () => {
            // After toast gone, show next in queue
            this.scene.time.delayedCall(300, () => {
                this._showNext();
            });
        });
    }

    _renderToast(ach, onDone) {
        const scene = this.scene;
        const camW = scene.cameras.main.width;

        const rarityColor = RARITY_COLORS[ach.rarity] || '#ffffff';
        const rarityHex = parseInt(rarityColor.replace('#', ''), 16);

        const startX = camW + 320;
        const targetX = camW - 30;
        const y = 90;

        // Background panel
        const bg = scene.add.rectangle(startX, y, 300, 72, 0x050f20, 0.95)
            .setOrigin(1, 0.5)
            .setScrollFactor(0)
            .setDepth(1000)
            .setStrokeStyle(2, rarityHex, 1);

        // Glow border pulse
        scene.tweens.add({
            targets: bg,
            alpha: { from: 0.95, to: 1 },
            duration: 600,
            yoyo: true,
            repeat: 3
        });

        // Icon
        const icon = scene.add.text(startX - 285, y, ach.icon, {
            fontSize: '28px'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(1001);

        // Header
        const header = scene.add.text(startX - 248, y - 14, 'ACHIEVEMENT UNLOCKED', {
            fontSize: '10px',
            fill: rarityColor,
            fontStyle: 'bold',
            letterSpacing: 1
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(1001);

        // Name
        const nameText = scene.add.text(startX - 248, y + 6, ach.name, {
            fontSize: '16px',
            fill: '#ecf4ff',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(1001);

        // Description
        const descText = scene.add.text(startX - 248, y + 24, ach.description, {
            fontSize: '11px',
            fill: '#93a8ca'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(1001);

        const elements = [bg, icon, header, nameText, descText];

        // Slide in
        scene.tweens.add({
            targets: elements,
            x: `-=${startX - targetX}`,
            duration: 400,
            ease: 'Back.easeOut',
            onComplete: () => {
                // Hold for 2.8 seconds then slide out
                scene.time.delayedCall(2800, () => {
                    scene.tweens.add({
                        targets: elements,
                        x: `+=${startX - targetX}`,
                        duration: 350,
                        ease: 'Back.easeIn',
                        onComplete: () => {
                            elements.forEach(e => e.destroy());
                            onDone();
                        }
                    });
                });
            }
        });
    }
}
