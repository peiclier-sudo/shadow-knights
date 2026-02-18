// FrostNovaSkill.js - Mage skill: Freeze enemies
import { SkillBase } from '../SkillBase.js';
import { SKILL_DATA } from '../skillData.js';

export class FrostNovaSkill extends SkillBase {
    constructor(scene, player) {
        super(scene, player, SKILL_DATA.frostNova);
    }
    
    use() {
        if (!super.use()) return false;
        
        const boss = this.scene.boss;
        if (!boss) return false;

        const freezeDuration = 2000;
        const px = this.player.x;
        const py = this.player.y;

        // Three expanding frost wave rings (staggered)
        [0, 100, 200].forEach((delay, idx) => {
            this.scene.time.delayedCall(delay, () => {
                const wave = this.scene.add.circle(px, py, 20, 0x88ccff, 0)
                    .setStrokeStyle(2 + (2 - idx), 0xaaddff, 0.85)
                    .setDepth(170);
                this.scene.tweens.add({
                    targets: wave,
                    scale: 9 - idx * 1.5,
                    alpha: 0,
                    duration: 550,
                    ease: 'Cubic.easeOut',
                    onComplete: () => wave.destroy()
                });
            });
        });

        // Bright core flash
        const coreFlash = this.scene.add.circle(px, py, 24, 0xddf4ff, 0.7).setDepth(172);
        this.scene.tweens.add({
            targets: coreFlash,
            scale: 2.5,
            alpha: 0,
            duration: 280,
            ease: 'Power2',
            onComplete: () => coreFlash.destroy()
        });

        // Ice shard burst – mix of circles and thin rectangles
        for (let i = 0; i < 28; i++) {
            const angle = (i / 28) * Math.PI * 2;
            const speed = Phaser.Math.Between(100, 220);
            const isRect = i % 3 === 0;

            if (isRect) {
                const shard = this.scene.add.rectangle(px, py, 3, Phaser.Math.Between(8, 18), 0xaaddff, 0.75)
                    .setRotation(angle).setDepth(171);
                this.scene.tweens.add({
                    targets: shard,
                    x: px + Math.cos(angle) * speed,
                    y: py + Math.sin(angle) * speed,
                    alpha: 0,
                    scale: 0.4,
                    duration: Phaser.Math.Between(400, 600),
                    ease: 'Power2',
                    onComplete: () => shard.destroy()
                });
            } else {
                const ice = this.scene.add.circle(px, py, Phaser.Math.FloatBetween(3, 8),
                    i % 2 === 0 ? 0x88ccff : 0xaaddff, 0.75).setDepth(171);
                this.scene.tweens.add({
                    targets: ice,
                    x: px + Math.cos(angle) * speed,
                    y: py + Math.sin(angle) * speed,
                    alpha: 0,
                    scale: 0.4,
                    duration: Phaser.Math.Between(380, 560),
                    ease: 'Power2',
                    onComplete: () => ice.destroy()
                });
            }
        }

        // Freeze boss and cancel active attack flow
        boss.frozen = true;
        boss.isAttacking = false;
        boss.setTint(0x88ccff);

        // If a previous freeze timer exists, replace it so recasts extend freeze cleanly.
        if (boss.freezeTimer) {
            boss.freezeTimer.remove(false);
            boss.freezeTimer = null;
        }

        // Ice crystals around boss – more, with shimmer pulse
        for (let i = 0; i < 14; i++) {
            const cx = boss.x + (Math.random() - 0.5) * 110;
            const cy = boss.y + (Math.random() - 0.5) * 110;
            const crystal = this.scene.add.rectangle(cx, cy, 4 + Math.random() * 4, 14 + Math.random() * 14,
                i % 2 === 0 ? 0xaaddff : 0x88ccff, 0.7)
                .setRotation(Math.random() * Math.PI)
                .setDepth(168);

            // Shimmer in/out
            this.scene.tweens.add({
                targets: crystal,
                alpha: 0.2,
                duration: 300 + Math.random() * 400,
                yoyo: true,
                repeat: -1
            });

            // Fade away at end of freeze
            this.scene.time.delayedCall(freezeDuration - 200, () => {
                if (!crystal.scene) return;
                this.scene.tweens.killTweensOf(crystal);
                this.scene.tweens.add({
                    targets: crystal,
                    alpha: 0,
                    duration: 200,
                    onComplete: () => crystal.destroy()
                });
            });
        }

        // Unfreeze after duration
        boss.freezeTimer = this.scene.time.delayedCall(freezeDuration, () => {
            if (!boss.scene) return;
            boss.frozen = false;
            boss.clearTint();
            boss.freezeTimer = null;
        });
        
        return true;
    }
}