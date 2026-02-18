// EviscerateSkill.js - Rogue skill refont: Shadow Step
import { SkillBase } from '../SkillBase.js';
import { SKILL_DATA } from '../skillData.js';

export class EviscerateSkill extends SkillBase {
    constructor(scene, player) {
        super(scene, player, SKILL_DATA.eviscerate);
    }

    use() {
        if (!super.use()) return false;

        const boss = this.scene.boss;
        if (!boss) return false;

        const angleToBoss = Math.atan2(boss.y - this.player.y, boss.x - this.player.x);
        const behindX = Phaser.Math.Clamp(boss.x - Math.cos(angleToBoss) * 85, 50, this.scene.cameras.main.width - 50);
        const behindY = Phaser.Math.Clamp(boss.y - Math.sin(angleToBoss) * 85, 50, this.scene.cameras.main.height - 50);

        const vanish = this.scene.add.circle(this.player.x, this.player.y, 28, 0x8b5cf6, 0.35);
        this.scene.tweens.add({
            targets: vanish,
            scale: 0.3,
            alpha: 0,
            duration: 150,
            onComplete: () => vanish.destroy()
        });

        this.player.isInvulnerable = true;
        this.player.setPosition(behindX, behindY);

        const appear = this.scene.add.circle(behindX, behindY, 20, 0xcc44aa, 0.45);
        this.scene.tweens.add({
            targets: appear,
            scale: 2,
            alpha: 0,
            duration: 220,
            onComplete: () => appear.destroy()
        });

        // Apply debuff: boss takes +30% damage for 5 seconds
        boss.damageTakenMultiplier = 1.3;
        boss.setTint(0xff8ecb);

        if (boss.vulnerabilityTimer) {
            boss.vulnerabilityTimer.remove(false);
            boss.vulnerabilityTimer = null;
        }

        boss.vulnerabilityTimer = this.scene.time.delayedCall(5000, () => {
            if (!boss.scene) return;
            boss.damageTakenMultiplier = 1.0;
            boss.clearTint();
            boss.vulnerabilityTimer = null;
        });

        // Immediate strike on arrival
        const strikeDamage = 35 * ((this.player.damageMultiplier || 1) * (this.player.passiveDamageMultiplier || 1));
        boss.takeDamage(strikeDamage);

        this.scene.time.delayedCall(250, () => {
            this.player.isInvulnerable = false;
        });

        return true;
    }
}
