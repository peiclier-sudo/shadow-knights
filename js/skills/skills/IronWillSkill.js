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

        // Activation burst
        const burstRing = this.scene.add.circle(this.player.x, this.player.y, 20, 0xffee99, 0)
            .setStrokeStyle(4, 0xffdd44, 1.0)
            .setDepth(176);
        this.scene.tweens.add({
            targets: burstRing,
            scale: 3.8,
            alpha: 0,
            duration: 300,
            ease: 'Cubic.easeOut',
            onComplete: () => burstRing.destroy()
        });

        // Three layered shield rings with different radii
        const shells = [
            this.scene.add.circle(this.player.x, this.player.y, 42, 0xffee99, 0.08)
                .setStrokeStyle(3, 0xffee99, 0.85).setDepth(175),
            this.scene.add.circle(this.player.x, this.player.y, 32, 0xffcc66, 0.12)
                .setStrokeStyle(2, 0xffcc66, 0.7).setDepth(174),
            this.scene.add.circle(this.player.x, this.player.y, 22, 0xffaa44, 0.18)
                .setStrokeStyle(2, 0xffaa44, 0.5).setDepth(173)
        ];

        // 6 golden sparks orbiting the shield
        const sparks = [];
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const spark = this.scene.add.circle(
                this.player.x + Math.cos(angle) * 42,
                this.player.y + Math.sin(angle) * 42,
                3, 0xffdd44, 0.95
            ).setDepth(177);
            spark._baseAngle = angle;
            sparks.push(spark);
        }

        const follow = () => {
            shells.forEach(s => { if (s.scene) s.setPosition(this.player.x, this.player.y); });
            const t = Date.now();
            sparks.forEach((spark, i) => {
                if (!spark.scene) return;
                const angle = spark._baseAngle + t * 0.003;
                spark.x = this.player.x + Math.cos(angle) * 42;
                spark.y = this.player.y + Math.sin(angle) * 42;
                spark.alpha = 0.6 + Math.sin(t * 0.008 + i) * 0.35;
            });
        };
        this.scene.events.on('update', follow);

        // Pulsing animation for all shells
        shells.forEach((shell, i) => {
            this.scene.tweens.add({
                targets: shell,
                scale: 1.1 + i * 0.05,
                alpha: shell.fillAlpha + 0.15,
                duration: 200 + i * 40,
                yoyo: true,
                repeat: -1
            });
        });

        this.scene.time.delayedCall(1500, () => {
            this.player.isInvulnerable = false;
            this.scene.events.off('update', follow);

            // Shatter effect: rings expand and fade
            shells.forEach((shell, i) => {
                this.scene.tweens.killTweensOf(shell);
                if (shell.scene) {
                    this.scene.tweens.add({
                        targets: shell,
                        scale: 2.5,
                        alpha: 0,
                        duration: 220,
                        ease: 'Cubic.easeOut',
                        onComplete: () => shell.destroy()
                    });
                }
            });
            sparks.forEach(spark => {
                if (spark.scene) {
                    this.scene.tweens.add({
                        targets: spark,
                        scale: 0.1,
                        alpha: 0,
                        duration: 180,
                        onComplete: () => spark.destroy()
                    });
                }
            });
        });

        return true;
    }
}
