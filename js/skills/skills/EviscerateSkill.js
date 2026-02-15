// EviscerateSkill.js - Rogue skill: Massive damage (2-step targeting like grappling hook)
import { SkillBase } from '../SkillBase.js';
import { SKILL_DATA } from '../skillData.js';

export class EviscerateSkill extends SkillBase {
    constructor(scene, player) {
        super(scene, player, SKILL_DATA.eviscerate);
        this.maxRange = 420;
        this.isTargeting = false;
        this.targetingGraphics = null;
        this.directionMarker = null;
        this.waitingForConfirmKeyRelease = false;
    }
    
    use() {
        if (!this.isTargeting) {
            if (!this.canUse()) return false;
            this.startTargeting();
            return true;
        }

        if (this.waitingForConfirmKeyRelease) {
            return false;
        }

        this.confirmFromCursor();
        return true;
    }

    startTargeting() {
        this.isTargeting = true;
        this.waitingForConfirmKeyRelease = true;
        this.targetingGraphics = this.scene.add.graphics().setDepth(95);
        this.directionMarker = this.scene.add.circle(this.player.x, this.player.y, 9, 0xff3366, 0.25)
            .setStrokeStyle(2, 0xff6699, 0.95)
            .setDepth(96);
    }

    cancelTargeting() {
        this.isTargeting = false;
        this.waitingForConfirmKeyRelease = false;

        if (this.targetingGraphics) {
            this.targetingGraphics.destroy();
            this.targetingGraphics = null;
        }

        if (this.directionMarker) {
            this.directionMarker.destroy();
            this.directionMarker = null;
        }
    }

    handleConfirmKeyUp() {
        this.waitingForConfirmKeyRelease = false;
    }

    confirmFromCursor() {
        const pointer = this.scene.input.activePointer;
        const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.confirmTarget(worldPoint.x, worldPoint.y);
    }

    confirmTarget(targetX, targetY) {
        const boss = this.scene.boss;
        if (!boss) {
            this.cancelTargeting();
            return;
        }

        const dirX = targetX - this.player.x;
        const dirY = targetY - this.player.y;
        const dirLength = Math.sqrt(dirX * dirX + dirY * dirY);
        if (dirLength <= 1) {
            this.cancelTargeting();
            return;
        }

        const normalizedDirX = dirX / dirLength;
        const normalizedDirY = dirY / dirLength;

        const toBossX = boss.x - this.player.x;
        const toBossY = boss.y - this.player.y;
        const distance = Math.sqrt(toBossX * toBossX + toBossY * toBossY);
        const normalizedBossX = toBossX / Math.max(distance, 1);
        const normalizedBossY = toBossY / Math.max(distance, 1);

        // Direction needs to be close to where the boss is (same intent as grappling hook).
        const alignment = normalizedDirX * normalizedBossX + normalizedDirY * normalizedBossY;
        const minAlignment = 0.9;

        if (distance > this.maxRange || alignment < minAlignment) {
            this.showFailText(distance > this.maxRange ? 'TOO FAR!' : 'BAD DIRECTION!');
            this.cancelTargeting();
            return;
        }

        if (!super.use()) {
            this.cancelTargeting();
            return;
        }

        this.cancelTargeting();
        this.executeEviscerate(boss);
    }

    executeEviscerate(boss) {
        const angleToBoss = Math.atan2(boss.y - this.player.y, boss.x - this.player.x);
        const rawBehindX = boss.x - Math.cos(angleToBoss) * 100;
        const rawBehindY = boss.y - Math.sin(angleToBoss) * 100;

        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        const behindX = Phaser.Math.Clamp(rawBehindX, 50, width - 50);
        const behindY = Phaser.Math.Clamp(rawBehindY, 50, height - 50);

        this.scene.tweens.add({
            targets: this.player,
            x: behindX,
            y: behindY,
            duration: 150,
            ease: 'Power2',
            onComplete: () => {
                for (let i = 0; i < 15; i++) {
                    const slashAngle = angleToBoss + (Math.random() - 0.5) * 0.5;
                    const slash = this.scene.add.rectangle(
                        boss.x,
                        boss.y,
                        30 + Math.random() * 40,
                        5,
                        0xff3366,
                        0.8
                    );
                    slash.setRotation(slashAngle);

                    this.scene.tweens.add({
                        targets: slash,
                        alpha: 0,
                        scaleX: 2,
                        duration: 200,
                        onComplete: () => slash.destroy()
                    });
                }

                const finalDamage = 60 * (this.player.damageMultiplier || 1.0);
                boss.takeDamage(finalDamage);

                this.scene.cameras.main.flash(200, 255, 0, 0);
                this.scene.cameras.main.shake(200, 0.01);

                const critText = this.scene.add.text(boss.x, boss.y - 80, 'EVISCERATE!', {
                    fontSize: '36px',
                    fill: '#ff3366',
                    stroke: '#000',
                    strokeThickness: 6,
                    fontStyle: 'bold'
                }).setOrigin(0.5);

                this.scene.tweens.add({
                    targets: critText,
                    y: boss.y - 150,
                    alpha: 0,
                    scale: 1.5,
                    duration: 600,
                    onComplete: () => critText.destroy()
                });
            }
        });
    }

    showFailText(text) {
        const failText = this.scene.add.text(this.player.x, this.player.y - 50, text, {
            fontSize: '24px',
            fill: '#ff0000',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.scene.tweens.add({
            targets: failText,
            y: this.player.y - 100,
            alpha: 0,
            duration: 800,
            onComplete: () => failText.destroy()
        });
    }

    update() {
        if (!this.isTargeting || !this.targetingGraphics) return;

        const pointer = this.scene.input.activePointer;
        const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);

        const dx = worldPoint.x - this.player.x;
        const dy = worldPoint.y - this.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const clampedDist = Math.min(dist, this.maxRange);
        const dirX = dist > 0 ? dx / dist : 1;
        const dirY = dist > 0 ? dy / dist : 0;

        const endX = this.player.x + dirX * clampedDist;
        const endY = this.player.y + dirY * clampedDist;

        this.targetingGraphics.clear();
        this.targetingGraphics.lineStyle(2, 0xff3366, 0.35);
        this.targetingGraphics.strokeCircle(this.player.x, this.player.y, this.maxRange);
        this.targetingGraphics.lineStyle(3, 0xff3366, 0.75);
        this.targetingGraphics.lineBetween(this.player.x, this.player.y, endX, endY);

        this.targetingGraphics.fillStyle(0xff3366, 0.16);
        this.targetingGraphics.fillCircle(endX, endY, 14);

        if (this.directionMarker) {
            this.directionMarker.setPosition(endX, endY);
        }
    }
}
