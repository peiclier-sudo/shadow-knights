// ChronarchBoss.js - Tenth boss: CHRONARCH (The Eternal Sovereign)
import { Boss } from '../Boss.js';

export class ChronarchBoss extends Boss {
    constructor(scene) {
        super(scene, 10);
        this.phaseTransitioned = false;
        this.voidZones = [];
    }

    attack(player) {
        if (this.isAttacking || this.frozen) return;
        this.isAttacking = true;

        const phase2 = this.health <= this.maxHealth * 0.5;
        if (phase2 && !this.phaseTransitioned) {
            this.phaseTransitioned = true;
            this.triggerPhaseTransition();
        }

        const baseAngle = Math.atan2(player.y - this.y, player.x - this.x);

        // Telegraph: expanding void sigil
        const sigil = this.scene.add.circle(this.x, this.y, 20, 0xe0b0ff, 0.3);
        sigil.setStrokeStyle(3, 0xf5e6ff, 0.9);
        this.scene.tweens.add({
            targets: sigil,
            radius: 60,
            alpha: 0,
            duration: 550,
            onComplete: () => sigil.destroy()
        });

        this.scene.time.delayedCall(580, () => {
            if (this.frozen || !this.scene?.bossProjectiles) {
                this.isAttacking = false;
                return;
            }

            // Annihilation Wave: expanding ring of orbs
            const orbCount = phase2 ? 14 : 10;
            for (let i = 0; i < orbCount; i++) {
                const a = (Math.PI * 2 / orbCount) * i;
                const proj = this.scene.add.circle(this.x, this.y, 8, 0xf5e6ff, 0.95);
                proj.vx = Math.cos(a) * (phase2 ? 320 : 260);
                proj.vy = Math.sin(a) * (phase2 ? 320 : 260);
                proj.setDepth(150);
                const glow = this.scene.add.circle(this.x, this.y, 14, 0xe0b0ff, 0.25);
                glow.setDepth(149);
                proj.glow = glow;
                this.scene.bossProjectiles.push(proj);
            }

            // Phase 2: targeted burst toward player
            if (phase2) {
                this.scene.time.delayedCall(400, () => {
                    if (!this.scene?.bossProjectiles) return;
                    for (let i = 0; i < 5; i++) {
                        const a = baseAngle + (i - 2) * 0.18;
                        const proj = this.scene.add.circle(this.x, this.y, 7, 0xe0b0ff, 0.95);
                        proj.vx = Math.cos(a) * 400;
                        proj.vy = Math.sin(a) * 400;
                        proj.setDepth(150);
                        const glow = this.scene.add.circle(this.x, this.y, 12, 0xf5e6ff, 0.2);
                        glow.setDepth(149);
                        proj.glow = glow;
                        this.scene.bossProjectiles.push(proj);
                    }
                });

                // Void zone at player's position
                this.scene.time.delayedCall(200, () => {
                    if (!this.scene) return;
                    const zoneX = player.x;
                    const zoneY = player.y;
                    const zone = this.scene.add.circle(zoneX, zoneY, 50, 0x2a0845, 0.4);
                    zone.setStrokeStyle(2, 0xe0b0ff, 0.7);
                    zone.setDepth(5);
                    zone.lifetime = 3000;
                    zone.spawnTime = this.scene.time.now;

                    this.scene.tweens.add({
                        targets: zone,
                        alpha: 0,
                        duration: 3000,
                        onComplete: () => {
                            const idx = this.voidZones.indexOf(zone);
                            if (idx !== -1) this.voidZones.splice(idx, 1);
                            zone.destroy();
                        }
                    });

                    this.voidZones.push(zone);
                });
            }

            this.isAttacking = false;
        });
    }

    triggerPhaseTransition() {
        this._phaseCommonEffects();
        const w = this.scene.cameras.main.width;
        const h = this.scene.cameras.main.height;
        const flash = this.scene.add.rectangle(w / 2, h / 2, w, h, 0xe0b0ff, 0.28).setScrollFactor(0).setDepth(500);
        this.scene.tweens.add({ targets: flash, alpha: 0, duration: 800, onComplete: () => flash.destroy() });

        const txt = this.scene.add.text(w / 2, h / 2, 'ETERNITY UNBOUND', {
            fontSize: '42px', fill: '#f5e6ff', fontStyle: 'bold', stroke: '#000', strokeThickness: 5
        }).setOrigin(0.5).setScrollFactor(0).setDepth(501);
        this.scene.tweens.add({ targets: txt, y: h / 2 - 80, alpha: 0, duration: 1700, onComplete: () => txt.destroy() });
    }

    update(time, player) {
        // Check void zone damage
        for (const zone of this.voidZones) {
            if (!zone.active) continue;
            const dist = Phaser.Math.Distance.Between(player.x, player.y, zone.x, zone.y);
            if (dist < 50 && !player.isInvulnerable && !player.untargetable) {
                if (!zone.lastDmgTime || time - zone.lastDmgTime > 600) {
                    player.takeDamage(8);
                    zone.lastDmgTime = time;
                }
            }
        }

        const prev = this.nextAttackTime;
        super.update(time, player);
        if (this.nextAttackTime !== prev) {
            const phase2 = this.health <= this.maxHealth * 0.5;
            this.nextAttackTime = time + (phase2 ? 1600 : 2300);
        }
    }
}
