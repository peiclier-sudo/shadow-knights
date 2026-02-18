// MageClass.js - Mage
import { ClassBase } from './ClassBase.js';
import { CLASSES } from './classData.js';
import { FrostNovaSkill } from '../skills/skills/FrostNovaSkill.js';
import { ManaShieldSkill } from '../skills/skills/ManaShieldSkill.js';
import { ArcaneSurgeSkill } from '../skills/skills/ArcaneSurgeSkill.js';

export class MageClass extends ClassBase {
    constructor(scene, player) {
        super(scene, player, CLASSES.MAGE);
        this.lastDamageTime = Date.now();
        this.focusStacks = 0;
        this.nextFocusTick = Date.now() + 10000;
        this.player.passiveDamageMultiplier = 1;
    }

    createSkills() {
        this.skills = [
            new FrostNovaSkill(this.scene, this.player),
            new ManaShieldSkill(this.scene, this.player),
            new ArcaneSurgeSkill(this.scene, this.player)
        ];
    }

    dash(directionX, directionY) {
        const dashData = this.data.dash;

        if (this.player.stamina < dashData.staminaCost) return false;
        if (this.player.isDashing) return false;

        this.player.stamina -= dashData.staminaCost;
        this.player.isDashing = true;
        this.player.isInvulnerable = true;

        this.createDisappearEffect();

        const teleportRange = 200;
        const destX = this.player.x + directionX * teleportRange;
        const destY = this.player.y + directionY * teleportRange;

        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        const newX = Phaser.Math.Clamp(destX, 50, width - 50);
        const newY = Phaser.Math.Clamp(destY, 50, height - 50);

        this.player.setPosition(newX, newY);
        this.createAppearEffect();

        this.scene.time.delayedCall(100, () => {
            this.player.isDashing = false;
            this.player.isInvulnerable = false;
        });

        return true;
    }

    onTakeDamage() {
        this.lastDamageTime = Date.now();
        this.nextFocusTick = this.lastDamageTime + 10000;
        this.focusStacks = 0;
        this.player.passiveDamageMultiplier = 1;
    }

    update(time, delta) {
        super.update(time, delta);

        const now = Date.now();
        if (now >= this.nextFocusTick && this.focusStacks < 3) {
            this.focusStacks += 1;
            this.player.passiveDamageMultiplier = 1 + this.focusStacks * 0.2;
            this.nextFocusTick = now + 10000;
        }
    }

    createDisappearEffect() {
        for (let i = 0; i < 15; i++) {
            const particle = this.scene.add.circle(this.player.x, this.player.y, 4, 0x88aaff, 0.6);
            this.scene.tweens.add({
                targets: particle,
                x: particle.x + (Math.random() - 0.5) * 100,
                y: particle.y + (Math.random() - 0.5) * 100,
                alpha: 0,
                scale: 2,
                duration: 300,
                onComplete: () => particle.destroy()
            });
        }
    }

    createAppearEffect() {
        for (let i = 0; i < 15; i++) {
            const particle = this.scene.add.circle(this.player.x, this.player.y, 4, 0x88aaff, 0.6);
            this.scene.tweens.add({
                targets: particle,
                alpha: 0,
                scale: 2,
                duration: 300,
                onComplete: () => particle.destroy()
            });
        }
    }
}
