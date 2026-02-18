// RogueClass.js - Rogue
import { ClassBase } from './ClassBase.js';
import { CLASSES } from './classData.js';
import { BackstabSkill } from '../skills/skills/BackstabSkill.js';
import { SmokeBombSkill } from '../skills/skills/SmokeBombSkill.js';
import { EviscerateSkill } from '../skills/skills/EviscerateSkill.js';

export class RogueClass extends ClassBase {
    constructor(scene, player) {
        super(scene, player, CLASSES.ROGUE);
        this.isStealthed = false;
        this.critStacks = 0;
        this.nextStackTime = Date.now() + 3000;
        this.player.critChanceBonus = 0;
    }

    createSkills() {
        this.skills = [
            new BackstabSkill(this.scene, this.player),
            new SmokeBombSkill(this.scene, this.player),
            new EviscerateSkill(this.scene, this.player)
        ];
    }

    dash(directionX, directionY) {
        const result = super.dash(directionX, directionY);

        if (result) {
            this.enterStealth();
        }

        return result;
    }

    onTakeDamage() {
        this.critStacks = 0;
        this.player.critChanceBonus = 0;
        this.nextStackTime = Date.now() + 3000;
    }

    enterStealth() {
        this.isStealthed = true;
        this.player.alpha = 0.3;

        const px = this.player.x;
        const py = this.player.y;

        // Dark void ring collapsing inward
        const voidRing = this.scene.add.circle(px, py, 50, 0x6600aa, 0)
            .setStrokeStyle(3, 0xaa44cc, 0.9)
            .setDepth(155);
        this.scene.tweens.add({
            targets: voidRing,
            scale: 0.2,
            alpha: 0,
            duration: 300,
            ease: 'Cubic.easeIn',
            onComplete: () => voidRing.destroy()
        });

        // Multi-layer purple smoke burst
        for (let i = 0; i < 18; i++) {
            const angle    = Math.random() * Math.PI * 2;
            const distance = 30 + Math.random() * 90;
            const size     = 6 + Math.random() * 14;
            const color    = i % 3 === 0 ? 0x9933cc : (i % 3 === 1 ? 0x6600aa : 0x330066);

            const smoke = this.scene.add.circle(px, py, size, color, 0.18 + Math.random() * 0.15)
                .setDepth(154);
            this.scene.tweens.add({
                targets: smoke,
                x: px + Math.cos(angle) * distance,
                y: py + Math.sin(angle) * distance,
                alpha: 0,
                scale: 2.5,
                duration: 550 + Math.random() * 200,
                ease: 'Sine.easeOut',
                onComplete: () => smoke.destroy()
            });
        }

        // Stealth shimmer sparks
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const spark = this.scene.add.circle(
                px + Math.cos(angle) * 28,
                py + Math.sin(angle) * 28,
                2, 0xdd88ff, 0.9
            ).setDepth(156);
            this.scene.tweens.add({
                targets: spark,
                x: px + Math.cos(angle) * 55,
                y: py + Math.sin(angle) * 55,
                alpha: 0,
                scale: 0.4,
                duration: 400,
                ease: 'Cubic.easeOut',
                onComplete: () => spark.destroy()
            });
        }

        this.scene.time.delayedCall(1500, () => {
            this.isStealthed = false;

            // Reveal flash when stealth ends
            const revealFlash = this.scene.add.circle(this.player.x, this.player.y, 22, 0xcc66ee, 0.5)
                .setDepth(157);
            this.scene.tweens.add({
                targets: revealFlash,
                scale: 2.8,
                alpha: 0,
                duration: 220,
                ease: 'Cubic.easeOut',
                onComplete: () => revealFlash.destroy()
            });

            this.player.alpha = 1;
        });
    }

    update(time, delta) {
        super.update(time, delta);

        if (this.isStealthed) {
            this.player.alpha = 0.3 + Math.sin(time * 0.01) * 0.1;
        }

        const now = Date.now();
        if (now >= this.nextStackTime && this.critStacks < 4) {
            this.critStacks += 1;
            this.player.critChanceBonus = this.critStacks * 0.15;
            this.nextStackTime = now + 3000;
        }
    }
}
