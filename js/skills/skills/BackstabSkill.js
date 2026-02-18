// BackstabSkill.js - Rogue skill refont to Sprint
import { SkillBase } from '../SkillBase.js';
import { SKILL_DATA } from '../skillData.js';

export class BackstabSkill extends SkillBase {
    constructor(scene, player) {
        super(scene, player, SKILL_DATA.backstab);
        this.active = false;
        this.speedBonus = 1.3;
        this.originalSpeed = null;
    }

    use() {
        if (!super.use()) return false;

        if (!this.active) {
            this.originalSpeed = this.player.speed;
        }

        this.active = true;
        this.player.speed = this.originalSpeed * this.speedBonus;

        const px = this.player.x;
        const py = this.player.y;

        // Core burst ring
        const ring = this.scene.add.circle(px, py, 24, 0xaa44cc, 0.25)
            .setStrokeStyle(3, 0xdd99ff, 0.9)
            .setDepth(170);
        this.scene.tweens.add({
            targets: ring,
            scale: 3.8,
            alpha: 0,
            duration: 360,
            ease: 'Cubic.easeOut',
            onComplete: () => ring.destroy()
        });

        // Speed-line rays bursting backward (8 directions)
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const speed = Phaser.Math.Between(55, 110);
            const ray = this.scene.add.rectangle(
                px + Math.cos(angle) * 18,
                py + Math.sin(angle) * 18,
                2, Phaser.Math.Between(12, 24), 0xdd99ff, 0.7
            ).setRotation(angle).setDepth(171);

            this.scene.tweens.add({
                targets: ray,
                x: px + Math.cos(angle) * speed,
                y: py + Math.sin(angle) * speed,
                alpha: 0,
                scaleX: 0.3,
                duration: Phaser.Math.Between(220, 350),
                ease: 'Sine.easeOut',
                onComplete: () => ray.destroy()
            });
        }

        // Bright purple core flash
        const flash = this.scene.add.circle(px, py, 16, 0xdd88ff, 0.75).setDepth(172);
        this.scene.tweens.add({
            targets: flash, scale: 2.8, alpha: 0, duration: 250,
            ease: 'Power2', onComplete: () => flash.destroy()
        });

        this.scene.time.delayedCall(4000, () => {
            this.active = false;
            this.player.speed = this.originalSpeed || this.player.speed;
            this.originalSpeed = null;
        });

        return true;
    }
}
