// VortexBoss.js - Seventh boss: VORTEX (The Event Horizon)
import { Boss } from '../Boss.js';

export class VortexBoss extends Boss {
    constructor(scene) {
        super(scene, 7);
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

        const orbCount = phase2 ? 6 : 4;
        const charge = this.scene.add.circle(this.x, this.y, 35, 0x3aa7ff, 0.28);
        charge.setStrokeStyle(2, 0x8fd3ff, 0.9);
        this.scene.tweens.add({ targets: charge, scale: 2.2, alpha: 0, duration: 550, onComplete: () => charge.destroy() });

        this.scene.time.delayedCall(520, () => {
            if (this.frozen || !this.scene?.bossProjectiles) {
                this.isAttacking = false;
                return;
            }

            for (let i = 0; i < orbCount; i++) {
                const angle = (Math.PI * 2 * i) / orbCount;
                const orb = this.scene.add.circle(this.x, this.y, 7, 0x8fd3ff, 0.95);
                orb.vx = Math.cos(angle) * (phase2 ? 260 : 230);
                orb.vy = Math.sin(angle) * (phase2 ? 260 : 230);
                orb.setDepth(150);
                orb.pull = phase2 ? 55 : 40;

                const glow = this.scene.add.circle(this.x, this.y, 13, 0x3aa7ff, 0.2);
                glow.setDepth(149);
                orb.glow = glow;

                this.scene.bossProjectiles.push(orb);
            }

            // brief pull pulse around boss
            const pulse = this.scene.add.circle(this.x, this.y, phase2 ? 120 : 95, 0x3aa7ff, 0.16);
            pulse.setDepth(148);
            this.scene.tweens.add({ targets: pulse, alpha: 0, scale: 1.3, duration: 260, onComplete: () => pulse.destroy() });

            const d = Phaser.Math.Distance.Between(player.x, player.y, this.x, this.y);
            if (d < (phase2 ? 120 : 95) && !player.isInvulnerable && !player.untargetable) {
                player.takeDamage(phase2 ? 12 : 8);
            }

            this.isAttacking = false;
        });
    }

    triggerPhaseTransition() {
        const w = this.scene.cameras.main.width;
        const h = this.scene.cameras.main.height;
        const flash = this.scene.add.rectangle(w / 2, h / 2, w, h, 0x3aa7ff, 0.24).setScrollFactor(0).setDepth(500);
        this.scene.tweens.add({ targets: flash, alpha: 0, duration: 650, onComplete: () => flash.destroy() });

        const txt = this.scene.add.text(w / 2, h / 2, 'EVENT HORIZON', {
            fontSize: '38px', fill: '#9edcff', fontStyle: 'bold', stroke: '#000', strokeThickness: 5
        }).setOrigin(0.5).setScrollFactor(0).setDepth(501);
        this.scene.tweens.add({ targets: txt, y: h / 2 - 70, alpha: 0, duration: 1600, onComplete: () => txt.destroy() });
    }

    update(time, player) {
        const prev = this.nextAttackTime;
        super.update(time, player);
        if (this.nextAttackTime !== prev) {
            const phase2 = this.health <= this.maxHealth * 0.5;
            this.nextAttackTime = time + (phase2 ? 2200 : 3000);
        }
    }
}
