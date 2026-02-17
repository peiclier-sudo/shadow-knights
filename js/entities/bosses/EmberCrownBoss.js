// EmberCrownBoss.js - Eighth boss: EMBER CROWN (The Ash Sovereign)
import { Boss } from '../Boss.js';

export class EmberCrownBoss extends Boss {
    constructor(scene, towerFloor = 1) {
        super(scene, 8, towerFloor);
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

        const rows = phase2 ? 4 : 3;
        const spread = phase2 ? 170 : 140;

        // Ground telegraphs as burning lanes moving left->right
        const warnings = [];
        for (let i = 0; i < rows; i++) {
            const y = player.y - ((rows - 1) * 0.5 - i) * 70;
            const rect = this.scene.add.rectangle(this.x - 180, y, 220, 34, 0xff5a2e, 0.28);
            rect.setStrokeStyle(2, 0xffa07a, 0.9);
            warnings.push({ rect, y });
            this.scene.tweens.add({
                targets: rect,
                x: this.x - 180 + spread,
                duration: 650,
                yoyo: true,
                onComplete: () => rect.destroy()
            });
        }

        this.scene.time.delayedCall(700, () => {
            if (this.frozen || !this.scene?.bossProjectiles) {
                this.isAttacking = false;
                return;
            }

            warnings.forEach(({ y }) => {
                const angle = Math.atan2(player.y - y, player.x - this.x);
                const proj = this.scene.add.circle(this.x, y, phase2 ? 8 : 7, 0xff7b47, 0.95);
                proj.vx = Math.cos(angle) * (phase2 ? 390 : 340);
                proj.vy = Math.sin(angle) * (phase2 ? 390 : 340);
                proj.setDepth(150);
                const glow = this.scene.add.circle(this.x, y, 13, 0xff5a2e, 0.25);
                glow.setDepth(149);
                proj.glow = glow;
                this.scene.bossProjectiles.push(proj);
            });

            this.isAttacking = false;
        });
    }

    triggerPhaseTransition() {
        const w = this.scene.cameras.main.width;
        const h = this.scene.cameras.main.height;
        const flash = this.scene.add.rectangle(w / 2, h / 2, w, h, 0xff3d1f, 0.24).setScrollFactor(0).setDepth(500);
        this.scene.tweens.add({ targets: flash, alpha: 0, duration: 650, onComplete: () => flash.destroy() });

        const txt = this.scene.add.text(w / 2, h / 2, 'ASHEN DECREE', {
            fontSize: '38px', fill: '#ffb19a', fontStyle: 'bold', stroke: '#000', strokeThickness: 5
        }).setOrigin(0.5).setScrollFactor(0).setDepth(501);
        this.scene.tweens.add({ targets: txt, y: h / 2 - 70, alpha: 0, duration: 1600, onComplete: () => txt.destroy() });
    }

    update(time, player) {
        const prev = this.nextAttackTime;
        super.update(time, player);
        if (this.nextAttackTime !== prev) {
            const phase2 = this.health <= this.maxHealth * 0.5;
            this.nextAttackTime = time + this.adjustCooldown(phase2 ? 2100 : 2900);
        }
    }
}
