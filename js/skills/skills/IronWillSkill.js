// IronWillSkill.js - Warrior skill: temporary invulnerability
import { SkillBase } from '../SkillBase.js';
import { SKILL_DATA } from '../skillData.js';

export class IronWillSkill extends SkillBase {
    constructor(scene, player) {
        super(scene, player, SKILL_DATA.ironWill);
    }

    use() {
        if (!super.use()) return false;

        this.player.isInvulnerable = true;

        const shell = this.scene.add.circle(this.player.x, this.player.y, 34, 0xffcc66, 0.25)
            .setStrokeStyle(3, 0xffee99, 0.9)
            .setDepth(175);

        const follow = () => {
            if (!shell.scene) return;
            shell.setPosition(this.player.x, this.player.y);
        };

        this.scene.events.on('update', follow);

        this.scene.tweens.add({
            targets: shell,
            scale: 1.15,
            alpha: 0.6,
            duration: 180,
            yoyo: true,
            repeat: 6
        });

        this.scene.time.delayedCall(1500, () => {
            this.player.isInvulnerable = false;
            this.scene.events.off('update', follow);
            if (shell.scene) shell.destroy();
        });

        return true;
    }
}
