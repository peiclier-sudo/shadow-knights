// WarriorClass.js - Warrior
import { ClassBase } from './ClassBase.js';
import { CLASSES } from './classData.js';
import { BattleCrySkill } from '../skills/skills/BattleCrySkill.js';
import { IronWillSkill } from '../skills/skills/IronWillSkill.js';
import { GrapplingHookSkill } from '../skills/skills/GrapplingHookSkill.js';

export class WarriorClass extends ClassBase {
    constructor(scene, player) {
        super(scene, player, CLASSES.WARRIOR);
        this.passiveActive = false;
        this.hitCounter = 0;
    }

    createSkills() {
        // Q: Battle Cry, E: Grappling Hook, R: Invulnerability
        this.skills = [
            new BattleCrySkill(this.scene, this.player),
            new GrapplingHookSkill(this.scene, this.player),
            new IronWillSkill(this.scene, this.player)
        ];
    }

    dash(directionX, directionY) {
        const result = super.dash(directionX, directionY);

        if (result) {
            // Inner golden fill burst
            const shieldCore = this.scene.add.circle(this.player.x, this.player.y, 26, 0xffdd44, 0.45)
                .setDepth(155);
            this.scene.tweens.add({
                targets: shieldCore,
                scale: 2.2,
                alpha: 0,
                duration: 220,
                ease: 'Power2',
                onComplete: () => shieldCore.destroy()
            });

            // Outer orange ring
            const shieldRing = this.scene.add.circle(this.player.x, this.player.y, 38, 0xff6600, 0)
                .setStrokeStyle(4, 0xffaa00, 0.9)
                .setDepth(156);
            this.scene.tweens.add({
                targets: shieldRing,
                scale: 1.8,
                alpha: 0,
                duration: 280,
                ease: 'Cubic.easeOut',
                onComplete: () => shieldRing.destroy()
            });

            // Golden rays bursting outward
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const ray = this.scene.add.rectangle(
                    this.player.x + Math.cos(angle) * 20,
                    this.player.y + Math.sin(angle) * 20,
                    3, 18, 0xffcc44, 0.7
                ).setRotation(angle).setDepth(157);

                this.scene.tweens.add({
                    targets: ray,
                    x: this.player.x + Math.cos(angle) * 60,
                    y: this.player.y + Math.sin(angle) * 60,
                    alpha: 0,
                    scaleX: 0.4,
                    duration: 250,
                    ease: 'Cubic.easeOut',
                    onComplete: () => ray.destroy()
                });
            }

            this.checkDashDamage();
        }

        return result;
    }

    checkDashDamage() {
        const boss = this.scene.boss;
        if (!boss) return;

        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, boss.x, boss.y);

        if (dist < 100) {
            boss.takeDamage(this.data.dash.damage || 25);

            const knockbackX = boss.x + (boss.x - this.player.x) * 0.3;
            const knockbackY = boss.y + (boss.y - this.player.y) * 0.3;

            this.scene.tweens.add({
                targets: boss,
                x: knockbackX,
                y: knockbackY,
                duration: 150,
                ease: 'Power2'
            });
        }
    }

    onBossHit() {
        this.hitCounter += 1;

        if (this.hitCounter >= 10) {
            this.hitCounter = 0;
            this.player.autoChargedNextHit = true;

            // Pulsing glow burst on player
            const burstRing = this.scene.add.circle(this.player.x, this.player.y, 20, 0xffdd44, 0)
                .setStrokeStyle(3, 0xffcc00, 1.0)
                .setDepth(160);
            this.scene.tweens.add({
                targets: burstRing,
                scale: 3.5,
                alpha: 0,
                duration: 400,
                ease: 'Cubic.easeOut',
                onComplete: () => burstRing.destroy()
            });

            const txt = this.scene.add.text(this.player.x, this.player.y - 70, 'PASSIVE READY: CHARGED SHOT', {
                fontSize: '18px',
                fill: '#ffd166',
                stroke: '#000',
                strokeThickness: 5,
                fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(161);

            // Scale-in then float up
            txt.setScale(0.5);
            this.scene.tweens.add({
                targets: txt,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 150,
                ease: 'Back.easeOut',
                onComplete: () => {
                    this.scene.tweens.add({
                        targets: txt,
                        y: txt.y - 35,
                        alpha: 0,
                        duration: 900,
                        ease: 'Sine.easeIn',
                        onComplete: () => txt.destroy()
                    });
                }
            });
        }
    }

    update(time, delta) {
        super.update(time, delta);

        if (this.player.health < this.player.maxHealth * 0.3) {
            if (!this.passiveActive) {
                this.passiveActive = true;
                this.player.damageReduction = 0.3;
            }
        } else if (this.passiveActive) {
            this.passiveActive = false;
            this.player.damageReduction = 0;
        }
    }
}
