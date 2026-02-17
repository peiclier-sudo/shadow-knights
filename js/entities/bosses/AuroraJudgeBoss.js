// AuroraJudgeBoss.js - Ninth boss: AURORA JUDGE (The Final Arbiter)
import { Boss } from '../Boss.js';

export class AuroraJudgeBoss extends Boss {
    constructor(scene) {
        super(scene, 9);
        this.phaseTransitioned = false;
    }

    attack(player) {
        if (this.isAttacking || this.frozen) return;
        this.isAttacking = true;

        const phase2 = this.health <= this.maxHealth * 0.5;
        if (phase2 && !this.phaseTransitioned) {
            this.phaseTransitioned = true;
            this.triggerPhaseTransition();
        }

        const shards = phase2 ? 9 : 6;
        const baseAngle = Math.atan2(player.y - this.y, player.x - this.x);

        const sigil = this.scene.add.polygon(this.x, this.y, [0,-40, 35,-12, 22,32, -22,32, -35,-12], 0x84ff6b, 0.18);
        sigil.setStrokeStyle(2, 0xc7ffbf, 0.9);
        this.scene.tweens.add({ targets: sigil, angle: 120, alpha: 0, duration: 600, onComplete: () => sigil.destroy() });

        this.scene.time.delayedCall(620, () => {
            if (this.frozen || !this.scene?.bossProjectiles) {
                this.isAttacking = false;
                return;
            }

            for (let i = 0; i < shards; i++) {
                const offset = (i - (shards - 1) / 2) * (phase2 ? 0.12 : 0.16);
                const a = baseAngle + offset;
                const proj = this.scene.add.circle(this.x, this.y, 7, 0xc7ffbf, 0.95);
                proj.vx = Math.cos(a) * (phase2 ? 430 : 360);
                proj.vy = Math.sin(a) * (phase2 ? 430 : 360);
                proj.setDepth(150);
                const glow = this.scene.add.circle(this.x, this.y, 12, 0x84ff6b, 0.22);
                glow.setDepth(149);
                proj.glow = glow;
                this.scene.bossProjectiles.push(proj);
            }

            if (phase2) {
                // delayed mirror fan aimed at latest player position
                this.scene.time.delayedCall(320, () => {
                    if (!this.scene?.bossProjectiles) return;
                    const mirrorBase = Math.atan2(player.y - this.y, player.x - this.x);
                    for (let i = 0; i < 5; i++) {
                        const a = mirrorBase + (i - 2) * 0.2;
                        const proj = this.scene.add.circle(this.x, this.y, 6, 0x84ff6b, 0.95);
                        proj.vx = Math.cos(a) * 350;
                        proj.vy = Math.sin(a) * 350;
                        proj.setDepth(150);
                        const glow = this.scene.add.circle(this.x, this.y, 11, 0xc7ffbf, 0.2);
                        glow.setDepth(149);
                        proj.glow = glow;
                        this.scene.bossProjectiles.push(proj);
                    }
                });
            }

            this.isAttacking = false;
        });
    }

    triggerPhaseTransition() {
        const w = this.scene.cameras.main.width;
        const h = this.scene.cameras.main.height;
        const flash = this.scene.add.rectangle(w / 2, h / 2, w, h, 0x84ff6b, 0.24).setScrollFactor(0).setDepth(500);
        this.scene.tweens.add({ targets: flash, alpha: 0, duration: 700, onComplete: () => flash.destroy() });

        const txt = this.scene.add.text(w / 2, h / 2, 'FINAL SENTENCE', {
            fontSize: '40px', fill: '#dcffd7', fontStyle: 'bold', stroke: '#000', strokeThickness: 5
        }).setOrigin(0.5).setScrollFactor(0).setDepth(501);
        this.scene.tweens.add({ targets: txt, y: h / 2 - 75, alpha: 0, duration: 1650, onComplete: () => txt.destroy() });
    }

    update(time, player) {
        const prev = this.nextAttackTime;
        super.update(time, player);
        if (this.nextAttackTime !== prev) {
            const phase2 = this.health <= this.maxHealth * 0.5;
            this.nextAttackTime = time + (phase2 ? 1800 : 2500);
        }
    }
}
