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
        const px = this.player.x;
        const py = this.player.y;

        // Imploding flash ring – contracts inward
        const voidRing = this.scene.add.circle(px, py, 60, 0x3366ff, 0)
            .setStrokeStyle(3, 0x88aaff, 0.8)
            .setDepth(155);
        this.scene.tweens.add({
            targets: voidRing,
            scale: 0.1,
            alpha: 0,
            duration: 200,
            ease: 'Cubic.easeIn',
            onComplete: () => voidRing.destroy()
        });

        // Particles rushing inward (implode)
        for (let i = 0; i < 20; i++) {
            const angle  = Math.random() * Math.PI * 2;
            const dist   = 50 + Math.random() * 60;
            const particle = this.scene.add.circle(
                px + Math.cos(angle) * dist,
                py + Math.sin(angle) * dist,
                Phaser.Math.FloatBetween(2, 5),
                i % 2 === 0 ? 0x88aaff : 0x5599ff,
                0.75
            ).setDepth(156);

            this.scene.tweens.add({
                targets: particle,
                x: px,
                y: py,
                alpha: 0,
                scale: 0.2,
                duration: Phaser.Math.Between(140, 220),
                ease: 'Cubic.easeIn',
                onComplete: () => particle.destroy()
            });
        }
    }

    createAppearEffect() {
        const px = this.player.x;
        const py = this.player.y;

        // Bright flash at destination
        const flash = this.scene.add.circle(px, py, 18, 0xaaccff, 0.9)
            .setDepth(157);
        this.scene.tweens.add({
            targets: flash,
            scale: 3.5,
            alpha: 0,
            duration: 250,
            ease: 'Cubic.easeOut',
            onComplete: () => flash.destroy()
        });

        // Expanding mana ring
        const ring = this.scene.add.circle(px, py, 12, 0x3366ff, 0)
            .setStrokeStyle(3, 0x88aaff, 1.0)
            .setDepth(156);
        this.scene.tweens.add({
            targets: ring,
            scale: 4.5,
            alpha: 0,
            duration: 320,
            ease: 'Cubic.easeOut',
            onComplete: () => ring.destroy()
        });

        // Outward burst particles
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2 + Math.random() * 0.2;
            const speed = Phaser.Math.Between(40, 90);
            const particle = this.scene.add.circle(px, py,
                Phaser.Math.FloatBetween(2, 5),
                i % 2 === 0 ? 0x88aaff : 0xaaddff,
                0.8
            ).setDepth(158);

            this.scene.tweens.add({
                targets: particle,
                x: px + Math.cos(angle) * speed,
                y: py + Math.sin(angle) * speed,
                alpha: 0,
                scale: 0.3,
                duration: Phaser.Math.Between(200, 320),
                ease: 'Sine.easeOut',
                onComplete: () => particle.destroy()
            });
        }
    }
}
