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

        const origX = this.player.x;
        const origY = this.player.y;

        // Vanish – implosion: particles spiral inward + imploding ring
        const vanishRing = this.scene.add.circle(origX, origY, 50, 0x8b5cf6, 0)
            .setStrokeStyle(3, 0xcc44aa, 0.9)
            .setDepth(172);
        this.scene.tweens.add({
            targets: vanishRing,
            scale: 0.1,
            alpha: 0,
            duration: 180,
            ease: 'Cubic.easeIn',
            onComplete: () => vanishRing.destroy()
        });

        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const startDist = 45 + Math.random() * 20;
            const shadow = this.scene.add.circle(
                origX + Math.cos(angle) * startDist,
                origY + Math.sin(angle) * startDist,
                Phaser.Math.FloatBetween(2, 5),
                i % 2 === 0 ? 0x8b5cf6 : 0xcc44aa, 0.7
            ).setDepth(173);
            this.scene.tweens.add({
                targets: shadow,
                x: origX, y: origY,
                alpha: 0, scale: 0.2,
                duration: Phaser.Math.Between(110, 180),
                ease: 'Cubic.easeIn',
                onComplete: () => shadow.destroy()
            });
        }

        this.player.isInvulnerable = true;
        this.player.setPosition(behindX, behindY);

        // Appear – burst: bright flash + slash streaks + ring
        const appearFlash = this.scene.add.circle(behindX, behindY, 20, 0xee88ff, 0.85)
            .setDepth(174);
        this.scene.tweens.add({
            targets: appearFlash, scale: 3.5, alpha: 0, duration: 240,
            ease: 'Power2', onComplete: () => appearFlash.destroy()
        });

        const appearRing = this.scene.add.circle(behindX, behindY, 18, 0xcc44aa, 0)
            .setStrokeStyle(3, 0xdd88ff, 0.9).setDepth(173);
        this.scene.tweens.add({
            targets: appearRing, scale: 3.2, alpha: 0, duration: 300,
            ease: 'Cubic.easeOut', onComplete: () => appearRing.destroy()
        });

        // Slash streaks radiating outward at destination
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + Math.random() * 0.3;
            const len   = Phaser.Math.Between(18, 36);
            const slash = this.scene.add.rectangle(
                behindX + Math.cos(angle) * 16,
                behindY + Math.sin(angle) * 16,
                2, len, 0xee88ff, 0.8
            ).setRotation(angle).setDepth(175);
            this.scene.tweens.add({
                targets: slash,
                x: behindX + Math.cos(angle) * 70,
                y: behindY + Math.sin(angle) * 70,
                alpha: 0, scaleX: 0.2,
                duration: Phaser.Math.Between(200, 300),
                ease: 'Sine.easeOut',
                onComplete: () => slash.destroy()
            });
        }

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
