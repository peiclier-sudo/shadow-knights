// ManaShieldSkill.js - Mage skill: Damage to stamina
import { SkillBase } from '../SkillBase.js';
import { SKILL_DATA } from '../skillData.js';

export class ManaShieldSkill extends SkillBase {
    constructor(scene, player) {
        super(scene, player, SKILL_DATA.manaShield);
    }
    
    use() {
        if (!super.use()) return false;

        const duration = 3000;

        // Reset existing shield if recast while active
        if (this.player.manaShieldFx) {
            this.scene.events.off('update', this.player.manaShieldFx.followHandler);
            this.player.manaShieldFx.shield?.destroy();
            this.player.manaShieldFx.runes?.forEach(rune => rune.destroy());
        }

        // Shield visual
        const shield = this.scene.add.circle(this.player.x, this.player.y, 60, 0x3366ff, 0.2);
        shield.setStrokeStyle(4, 0x88aaff, 0.8);

        const runes = [];
        for (let i = 0; i < 6; i++) {
            const rune = this.scene.add.circle(this.player.x, this.player.y, 4, 0x88aaff, 0.6);
            rune.orbitAngle = (i / 6) * Math.PI * 2;
            runes.push(rune);
        }

        // Keep visual attached to player while moving
        const followHandler = () => {
            shield.setPosition(this.player.x, this.player.y);
            runes.forEach((rune, index) => {
                const angle = rune.orbitAngle + (Date.now() * 0.004) + index * 0.1;
                rune.setPosition(
                    this.player.x + Math.cos(angle) * 50,
                    this.player.y + Math.sin(angle) * 50
                );
            });
        };
        this.scene.events.on('update', followHandler);

        // Pulsing shield animation
        this.scene.tweens.add({
            targets: shield,
            alpha: 0.35,
            scale: 1.1,
            duration: 400,
            yoyo: true,
            repeat: -1
        });

        // Apply mana shield effect
        this.player.manaShield = true;
        this.player.manaShieldFx = { shield, runes, followHandler };

        // Remove after duration (or if already broken)
        this.scene.time.delayedCall(duration, () => {
            this.player.manaShield = false;
            if (this.player.manaShieldFx?.followHandler === followHandler) {
                this.scene.events.off('update', followHandler);
                shield.destroy();
                runes.forEach(rune => rune.destroy());
                this.player.manaShieldFx = null;
            }
        });

        return true;
    }
}