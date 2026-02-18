// ArcaneSurgeSkill.js - Mage skill: Multishot
import { SkillBase } from '../SkillBase.js';
import { SKILL_DATA } from '../skillData.js';

export class ArcaneSurgeSkill extends SkillBase {
    constructor(scene, player) {
        super(scene, player, SKILL_DATA.arcaneSurge);
    }
    
    use() {
        if (!super.use()) return false;
        
        const px = this.player.x;
        const py = this.player.y;

        // Channeling implosion: particles rush inward first, then explode
        for (let i = 0; i < 14; i++) {
            const angle = (i / 14) * Math.PI * 2;
            const startDist = 80 + Math.random() * 40;
            const gather = this.scene.add.circle(
                px + Math.cos(angle) * startDist,
                py + Math.sin(angle) * startDist,
                Phaser.Math.FloatBetween(2, 4), 0xcc99ff, 0.7
            ).setDepth(170);
            this.scene.tweens.add({
                targets: gather,
                x: px, y: py,
                alpha: 0.9,
                scale: 0.3,
                duration: 160,
                ease: 'Cubic.easeIn',
                onComplete: () => gather.destroy()
            });
        }

        // Main burst (delayed to after the gather)
        this.scene.time.delayedCall(160, () => {
            // Bright arcane core
            const core = this.scene.add.circle(px, py, 20, 0xddbbff, 0.85).setDepth(173);
            this.scene.tweens.add({
                targets: core, scale: 3.5, alpha: 0, duration: 300,
                ease: 'Power2', onComplete: () => core.destroy()
            });

            // Three staggered arcane rings
            [0, 60, 120].forEach((delay, idx) => {
                this.scene.time.delayedCall(delay, () => {
                    const r = this.scene.add.circle(px, py, 25 + idx * 15, 0xaa88ff, 0)
                        .setStrokeStyle(3 - idx, idx === 0 ? 0xddbbff : 0xaa88ff, 0.85)
                        .setDepth(171);
                    this.scene.tweens.add({
                        targets: r, scale: 3.5, alpha: 0, duration: 450,
                        ease: 'Cubic.easeOut', onComplete: () => r.destroy()
                    });
                });
            });

            // Star-burst particles: mix of elongated rays + circles
            for (let i = 0; i < 24; i++) {
                const angle = (i / 24) * Math.PI * 2;
                const speed = Phaser.Math.Between(60, 130);
                const isRay = i % 3 === 0;
                if (isRay) {
                    const ray = this.scene.add.rectangle(px, py, 3, Phaser.Math.Between(10, 20),
                        0xddbbff, 0.8).setRotation(angle).setDepth(172);
                    this.scene.tweens.add({
                        targets: ray,
                        x: px + Math.cos(angle) * speed,
                        y: py + Math.sin(angle) * speed,
                        alpha: 0, scale: 0.3, duration: Phaser.Math.Between(280, 420),
                        ease: 'Sine.easeOut', onComplete: () => ray.destroy()
                    });
                } else {
                    const particle = this.scene.add.circle(px, py,
                        Phaser.Math.FloatBetween(3, 7),
                        i % 2 === 0 ? 0xaa88ff : 0xddbbff, 0.8).setDepth(172);
                    this.scene.tweens.add({
                        targets: particle,
                        x: px + Math.cos(angle) * speed,
                        y: py + Math.sin(angle) * speed,
                        alpha: 0, scale: 0.3, duration: Phaser.Math.Between(280, 420),
                        ease: 'Sine.easeOut', onComplete: () => particle.destroy()
                    });
                }
            }
        });

        // Buff next shots
        this.player.multishot = 3;
        this.player.multishotCount = 3;

        // Visual indicator for buff – scale-in + float up
        const buffText = this.scene.add.text(px, py - 50, 'ARCANE SURGE!', {
            fontSize: '22px',
            fill: '#ddbbff',
            stroke: '#220033',
            strokeThickness: 5,
            fontStyle: 'bold'
        }).setOrigin(0.5).setScale(0.5).setDepth(180);

        this.scene.tweens.add({
            targets: buffText,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 180,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.scene.tweens.add({
                    targets: buffText,
                    y: py - 110,
                    alpha: 0,
                    duration: 900,
                    ease: 'Sine.easeIn',
                    onComplete: () => buffText.destroy()
                });
            }
        });
        
        return true;
    }
}