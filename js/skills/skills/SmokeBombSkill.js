// SmokeBombSkill.js - Rogue skill: Become untargetable
import { SkillBase } from '../SkillBase.js';
import { SKILL_DATA } from '../skillData.js';

export class SmokeBombSkill extends SkillBase {
    constructor(scene, player) {
        super(scene, player, SKILL_DATA.smokeBomb);
    }
    
    use() {
        if (!super.use()) return false;
        
        const px = this.player.x;
        const py = this.player.y;

        // Flash on detonation
        const detonation = this.scene.add.circle(px, py, 18, 0xcccccc, 0.8).setDepth(172);
        this.scene.tweens.add({
            targets: detonation, scale: 3.5, alpha: 0, duration: 250,
            ease: 'Power2', onComplete: () => detonation.destroy()
        });

        // Multi-colored smoke cloud: gray, dark purple, near-black
        const smokeColors = [0xaaaaaa, 0x6600aa, 0x222222, 0x999999, 0x440066];
        for (let i = 0; i < 50; i++) {
            const angle    = Math.random() * Math.PI * 2;
            const distance = 20 + Math.random() * 160;
            const size     = 8 + Math.random() * 24;
            const color    = smokeColors[Math.floor(Math.random() * smokeColors.length)];
            const alpha    = 0.15 + Math.random() * 0.35;
            const delay    = Math.random() * 120;

            const smoke = this.scene.add.circle(px, py, size, color, alpha).setDepth(170);

            this.scene.time.delayedCall(delay, () => {
                if (!smoke.scene) return;
                this.scene.tweens.add({
                    targets: smoke,
                    x: px + Math.cos(angle) * distance,
                    y: py + Math.sin(angle) * distance,
                    alpha: 0,
                    scale: 2.5,
                    duration: 900 + Math.random() * 400,
                    ease: 'Sine.easeOut',
                    onComplete: () => smoke.destroy()
                });
            });
        }

        // Outward spark ring on detonation
        for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2;
            const spark = this.scene.add.circle(px, py, 3, 0xcc88ff, 0.8).setDepth(173);
            this.scene.tweens.add({
                targets: spark,
                x: px + Math.cos(angle) * 60,
                y: py + Math.sin(angle) * 60,
                alpha: 0, scale: 0.4,
                duration: 280, ease: 'Cubic.easeOut',
                onComplete: () => spark.destroy()
            });
        }

        // Make player untargetable and semi-transparent
        this.player.untargetable = true;
        this.player.alpha = 0.3;

        // Exit stealth after 2 seconds
        this.scene.time.delayedCall(2000, () => {
            this.player.untargetable = false;

            // Fade back in
            this.scene.tweens.add({
                targets: this.player,
                alpha: 1,
                duration: 300
            });
        });
        
        return true;
    }
}