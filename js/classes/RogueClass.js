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

        for (let i = 0; i < 10; i++) {
            const smoke = this.scene.add.circle(this.player.x, this.player.y, 8 + Math.random() * 10, 0x6600aa, 0.2);
            this.scene.tweens.add({
                targets: smoke,
                x: smoke.x + (Math.random() - 0.5) * 100,
                y: smoke.y + (Math.random() - 0.5) * 100,
                alpha: 0,
                scale: 2,
                duration: 500,
                onComplete: () => smoke.destroy()
            });
        }

        this.scene.time.delayedCall(1500, () => {
            this.isStealthed = false;
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
