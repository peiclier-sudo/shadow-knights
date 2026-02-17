// NullKingBoss.js - Tenth boss: NULL KING (The Last Seal)
import { Boss } from '../Boss.js';

export class NullKingBoss extends Boss {
    constructor(scene, towerFloor = 1) {
        super(scene, 10, towerFloor);
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

        const rays = phase2 ? 10 : 6;
        const tele = this.scene.add.rectangle(this.x, this.y, 78, 78, 0xe0e5ff, 0.2);
        tele.setStrokeStyle(2, 0xe0e5ff, 0.9);
        this.scene.tweens.add({ targets: tele, angle: 180, scale: 1.4, alpha: 0, duration: 520, onComplete: () => tele.destroy() });

        this.scene.time.delayedCall(560, () => {
            if (this.frozen || !this.scene?.bossProjectiles) {
                this.isAttacking = false;
                return;
            }

            for (let i = 0; i < rays; i++) {
                const a = i * ((Math.PI * 2) / rays);
                const proj = this.scene.add.circle(this.x, this.y, phase2 ? 8 : 7, 0xe0e5ff, 0.96);
                proj.vx = Math.cos(a) * (phase2 ? 380 : 320);
                proj.vy = Math.sin(a) * (phase2 ? 380 : 320);
                proj.setDepth(150);
                const glow = this.scene.add.circle(this.x, this.y, 13, 0x9aa0b8, 0.22);
                glow.setDepth(149);
                proj.glow = glow;
                this.scene.bossProjectiles.push(proj);
            }

            if (phase2) {
                const cross = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
                cross.forEach((a) => {
                    const proj = this.scene.add.circle(this.x, this.y, 9, 0x9aa0b8, 0.95);
                    proj.vx = Math.cos(a) * 420;
                    proj.vy = Math.sin(a) * 420;
                    proj.setDepth(150);
                    const glow = this.scene.add.circle(this.x, this.y, 14, 0xe0e5ff, 0.2);
                    glow.setDepth(149);
                    proj.glow = glow;
                    this.scene.bossProjectiles.push(proj);
                });
            }

            this.isAttacking = false;
        });
    }

    triggerPhaseTransition() {
        const w = this.scene.cameras.main.width;
        const h = this.scene.cameras.main.height;
        const flash = this.scene.add.rectangle(w / 2, h / 2, w, h, 0x9aa0b8, 0.26).setScrollFactor(0).setDepth(500);
        this.scene.tweens.add({ targets: flash, alpha: 0, duration: 700, onComplete: () => flash.destroy() });

        const txt = this.scene.add.text(w / 2, h / 2, 'VOID PROTOCOL', {
            fontSize: '40px',
            fill: '#f0f3ff',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 5
        }).setOrigin(0.5).setScrollFactor(0).setDepth(501);

        this.scene.tweens.add({ targets: txt, y: h / 2 - 75, alpha: 0, duration: 1700, onComplete: () => txt.destroy() });
    }

    update(time, player) {
        const prev = this.nextAttackTime;
        super.update(time, player);
        if (this.nextAttackTime !== prev) {
            const phase2 = this.health <= this.maxHealth * 0.5;
            this.nextAttackTime = time + this.adjustCooldown(phase2 ? 1700 : 2400);
        }
    }
}
