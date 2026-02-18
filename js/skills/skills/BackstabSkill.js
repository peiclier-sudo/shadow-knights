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

        const ring = this.scene.add.circle(this.player.x, this.player.y, 24, 0xaa44cc, 0.25)
            .setStrokeStyle(3, 0xdd99ff, 0.85);

        this.scene.tweens.add({
            targets: ring,
            radius: 90,
            alpha: 0,
            duration: 360,
            onComplete: () => ring.destroy()
        });

        this.scene.time.delayedCall(4000, () => {
            this.active = false;
            this.player.speed = this.originalSpeed || this.player.speed;
            this.originalSpeed = null;
        });

        return true;
    }
}
