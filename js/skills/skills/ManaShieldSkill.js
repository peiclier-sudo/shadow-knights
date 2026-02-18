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

        // Activation burst
        const burstFlash = this.scene.add.circle(this.player.x, this.player.y, 20, 0x88aaff, 0.7)
            .setDepth(178);
        this.scene.tweens.add({
            targets: burstFlash,
            scale: 4.5,
            alpha: 0,
            duration: 320,
            ease: 'Cubic.easeOut',
            onComplete: () => burstFlash.destroy()
        });

        // Three-layer shield rings (outer, mid, inner)
        const shieldOuter = this.scene.add.circle(this.player.x, this.player.y, 65, 0x3366ff, 0.08)
            .setStrokeStyle(2, 0x88aaff, 0.5).setDepth(175);
        const shield = this.scene.add.circle(this.player.x, this.player.y, 52, 0x3366ff, 0.14)
            .setStrokeStyle(3, 0x88aaff, 0.85).setDepth(176);
        const shieldInner = this.scene.add.circle(this.player.x, this.player.y, 38, 0x5588ff, 0.10)
            .setStrokeStyle(2, 0xaabbff, 0.6).setDepth(177);

        // 8 orbiting arcane runes
        const runes = [];
        for (let i = 0; i < 8; i++) {
            const color = i % 2 === 0 ? 0x88aaff : 0x5566ff;
            const rune = this.scene.add.circle(this.player.x, this.player.y, i % 2 === 0 ? 4 : 3, color, 0.7)
                .setDepth(179);
            rune.orbitAngle = (i / 8) * Math.PI * 2;
            rune._orbitRadius = i % 2 === 0 ? 56 : 44;
            runes.push(rune);
        }

        // Keep visual attached to player while moving
        const followHandler = () => {
            const t = Date.now();
            [shieldOuter, shield, shieldInner].forEach(s => { if (s.scene) s.setPosition(this.player.x, this.player.y); });
            runes.forEach((rune, index) => {
                if (!rune.scene) return;
                const speed = index % 2 === 0 ? 0.0035 : -0.0028;
                const angle = rune.orbitAngle + t * speed + index * 0.1;
                rune.setPosition(
                    this.player.x + Math.cos(angle) * rune._orbitRadius,
                    this.player.y + Math.sin(angle) * rune._orbitRadius
                );
                rune.alpha = 0.5 + Math.sin(t * 0.006 + index) * 0.4;
            });
        };
        this.scene.events.on('update', followHandler);

        // Pulsing animations for all shield layers
        this.scene.tweens.add({ targets: shield,      alpha: 0.28, scale: 1.08, duration: 420, yoyo: true, repeat: -1 });
        this.scene.tweens.add({ targets: shieldOuter, alpha: 0.14, scale: 1.05, duration: 600, yoyo: true, repeat: -1 });
        this.scene.tweens.add({ targets: shieldInner, alpha: 0.18, scale: 1.12, duration: 320, yoyo: true, repeat: -1 });

        // Apply mana shield effect
        this.player.manaShield = true;
        this.player.manaShieldFx = { shield, shieldOuter, shieldInner, runes, followHandler };

        // Remove after duration (or if already broken)
        this.scene.time.delayedCall(duration, () => {
            this.player.manaShield = false;
            if (this.player.manaShieldFx?.followHandler === followHandler) {
                this.scene.events.off('update', followHandler);
                [shield, shieldOuter, shieldInner].forEach(s => {
                    if (s.scene) {
                        this.scene.tweens.killTweensOf(s);
                        this.scene.tweens.add({ targets: s, scale: 1.8, alpha: 0, duration: 200,
                            onComplete: () => s.destroy() });
                    }
                });
                runes.forEach(rune => { if (rune.scene) rune.destroy(); });
                this.player.manaShieldFx = null;
            }
        });

        return true;
    }
}