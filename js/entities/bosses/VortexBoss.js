// VortexBoss.js – Seventh boss: VORTEX (The Event Horizon)
//
// Attack cycle: SINGULARITY → PULL → SINGULARITY → NOVA → repeat
//   SINGULARITY : 4 (→6) orbital orbs burst outward with gravitational pull on contact
//   PULL        : pulsing warning ring (r=130) then a gravity implosion – stand outside
//                 the ring or sprint away; inward fragments fire from the ring edge
//   NOVA        : slow ring of 10 (→16) outward orbs + phase-2 inner ring of fast inward orbs
//
// Movement: slow circular orbit around the screen center
// Phase 2  : faster cooldowns, more orbs, larger pull radius
import { Boss } from '../Boss.js';

export class VortexBoss extends Boss {
    constructor(scene) {
        super(scene, 7);
        this.phaseTransitioned = false;
        this.cycle        = ['SINGULARITY', 'PULL', 'SINGULARITY', 'NOVA'];
        this.cycleIndex   = 0;
        this._orbitAngle  = 0;
    }

    // ── Main attack dispatcher ──────────────────────────────────────────────
    attack(player) {
        if (this.isAttacking || this.frozen) return;

        if (this.health <= this.maxHealth * 0.5 && !this.phaseTransitioned) {
            this.phaseTransitioned = true;
            this.triggerPhaseTransition();
        }

        const phase2 = this.health <= this.maxHealth * 0.5;
        const type   = this.cycle[this.cycleIndex % this.cycle.length];
        this.cycleIndex++;

        this.isAttacking = true;
        this.body?.setVelocity(0, 0);

        if (type === 'SINGULARITY') this._singularity(player, phase2);
        if (type === 'PULL')        this._pull(player, phase2);
        if (type === 'NOVA')        this._nova(player, phase2);
    }

    // ── SINGULARITY – orbital burst orbs with pull property ─────────────────
    _singularity(player, phase2) {
        const orbCount = phase2 ? 6 : 4;

        const charge = this.scene.add.circle(this.x, this.y, 34, 0x3aa7ff, 0.28)
            .setStrokeStyle(2, 0x8fd3ff, 0.9).setDepth(100);
        this.scene.tweens.add({ targets: charge, scale: 2.3, alpha: 0, duration: 540, onComplete: () => charge.destroy() });

        this.scene.time.delayedCall(520, () => {
            if (this.frozen || !this.scene?.bossProjectiles) { this.isAttacking = false; return; }

            for (let i = 0; i < orbCount; i++) {
                const angle = (Math.PI * 2 * i) / orbCount;
                this._spawnOrb(this.x, this.y, angle, phase2 ? 265 : 235, phase2 ? 55 : 40);
            }

            // Brief pull pulse ring
            const pulse = this.scene.add.circle(this.x, this.y, phase2 ? 120 : 95, 0x3aa7ff, 0.16).setDepth(98);
            this.scene.tweens.add({ targets: pulse, alpha: 0, scale: 1.4, duration: 270, onComplete: () => pulse.destroy() });

            // Direct contact damage at center
            if (!player.untargetable) {
                const d = Phaser.Math.Distance.Between(player.x, player.y, this.x, this.y);
                if (d < (phase2 ? 120 : 95) && !player.isInvulnerable) {
                    player.takeDamage(phase2 ? 12 : 8);
                }
            }

            this.isAttacking = false;
        });
    }

    // ── PULL – gravity implosion: stay outside the ring or dash out ──────────
    _pull(player, phase2) {
        const ringR       = phase2 ? 155 : 130;
        const telegraphMs = phase2 ? 800 : 1000;

        // Expanding warning ring
        const warnRing = this.scene.add.circle(this.x, this.y, ringR * 0.5, 0x3aa7ff, 0.12)
            .setStrokeStyle(3, 0x8fd3ff, 0.80).setDepth(100);
        this.scene.tweens.add({ targets: warnRing, scale: 2.0, alpha: 0.40, duration: telegraphMs * 0.7,
            onComplete: () => { warnRing.setAlpha(0.40); }
        });

        // Inner charged core grows
        const core = this.scene.add.circle(this.x, this.y, 18, 0x3aa7ff, 0.55).setDepth(101);
        this.scene.tweens.add({ targets: core, scale: 2.8, duration: telegraphMs, onComplete: () => {} });

        this.scene.time.delayedCall(telegraphMs, () => {
            warnRing.destroy();
            core.destroy();
            if (this.frozen) { this.isAttacking = false; return; }

            // Implosion flash
            const implosion = this.scene.add.circle(this.x, this.y, ringR, 0x3aa7ff, 0.45).setDepth(102);
            this.scene.tweens.add({ targets: implosion, alpha: 0, scale: 0.1, duration: 380, onComplete: () => implosion.destroy() });

            // Inward shrapnel from ring edge
            const fragCount = phase2 ? 10 : 7;
            for (let i = 0; i < fragCount; i++) {
                const ang  = (Math.PI * 2 * i / fragCount);
                const fromX = this.x + Math.cos(ang) * ringR;
                const fromY = this.y + Math.sin(ang) * ringR;
                // Fires toward boss center
                this._spawnOrb(fromX, fromY, ang + Math.PI, phase2 ? 280 : 240, 0);
            }

            // Damage player if inside ring
            if (!player.untargetable) {
                const d = Phaser.Math.Distance.Between(player.x, player.y, this.x, this.y);
                if (d < ringR && !player.isInvulnerable) {
                    player.takeDamage(phase2 ? 16 : 12);
                }
            }

            this.isAttacking = false;
        });
    }

    // ── NOVA – slow outward ring that must be dodged through ─────────────────
    _nova(player, phase2) {
        const outerCount  = phase2 ? 16 : 10;
        const telegraphMs = phase2 ? 600 : 780;

        // Charge: outer ripple ring
        const ripple = this.scene.add.circle(this.x, this.y, 22, 0x8fd3ff, 0.45)
            .setStrokeStyle(3, 0x3aa7ff, 0.9).setDepth(100);
        this.scene.tweens.add({ targets: ripple, scale: 4.5, alpha: 0, duration: telegraphMs, onComplete: () => ripple.destroy() });

        this.scene.time.delayedCall(telegraphMs, () => {
            if (this.frozen || !this.scene?.bossProjectiles) { this.isAttacking = false; return; }

            // Slow outward ring
            for (let i = 0; i < outerCount; i++) {
                const angle = (Math.PI * 2 * i / outerCount);
                this._spawnOrb(this.x, this.y, angle, 165, 0);
            }

            // Phase 2: fast inward ring fired from a radius of 200 px
            if (phase2) {
                const inR = 200;
                for (let i = 0; i < 8; i++) {
                    const angle = (Math.PI * 2 * i / 8) + 0.39; // rotated gap to give breathing room
                    const fromX = this.x + Math.cos(angle) * inR;
                    const fromY = this.y + Math.sin(angle) * inR;
                    this.scene.time.delayedCall(160, () => {
                        if (!this.scene?.bossProjectiles) return;
                        this._spawnOrb(fromX, fromY, angle + Math.PI, 290, 0);
                    });
                }
            }

            this.isAttacking = false;
        });
    }

    // ── Shared orb spawn ────────────────────────────────────────────────────
    _spawnOrb(fromX, fromY, angle, speed, pull) {
        const orb   = this.scene.add.circle(fromX, fromY, 7, 0x8fd3ff, 0.95).setDepth(150);
        orb.vx      = Math.cos(angle) * speed;
        orb.vy      = Math.sin(angle) * speed;
        orb.pull    = pull;
        const glow  = this.scene.add.circle(fromX, fromY, 13, 0x3aa7ff, 0.20).setDepth(149);
        orb.glow    = glow;
        this.scene.bossProjectiles.push(orb);
    }

    // ── Phase transition flash ──────────────────────────────────────────────
    triggerPhaseTransition() {
        this._phaseCommonEffects();
        const cw = this.scene.cameras.main.width;
        const ch = this.scene.cameras.main.height;
        const flash = this.scene.add.rectangle(cw / 2, ch / 2, cw, ch, 0x3aa7ff, 0.24)
            .setScrollFactor(0).setDepth(500);
        this.scene.tweens.add({ targets: flash, alpha: 0, duration: 650, onComplete: () => flash.destroy() });
        const txt = this.scene.add.text(cw / 2, ch / 2, 'EVENT HORIZON', {
            fontSize: '38px', fill: '#9edcff', fontStyle: 'bold', stroke: '#000', strokeThickness: 5
        }).setOrigin(0.5).setScrollFactor(0).setDepth(501);
        this.scene.tweens.add({ targets: txt, y: ch / 2 - 70, alpha: 0, duration: 1600, onComplete: () => txt.destroy() });
    }

    // ── Update: slow orbit + cooldown override ─────────────────────────────
    update(time, player) {
        // Slow circular orbit around screen center when idle
        if (!this.isAttacking && !this.frozen && !this.stunned) {
            this._orbitAngle += 0.006;
            const cw      = this.scene.cameras.main.width;
            const ch      = this.scene.cameras.main.height;
            const orbitR  = Math.min(cw, ch) * 0.20;
            const targetX = cw / 2 + Math.cos(this._orbitAngle) * orbitR;
            const targetY = ch / 2 + Math.sin(this._orbitAngle) * orbitR;
            this.scene.physics.moveTo(this, targetX, targetY, 55);
        } else if (this.isAttacking) {
            this.body?.setVelocity(0, 0);
        }

        const prev = this.nextAttackTime;
        super.update(time, player);
        if (this.nextAttackTime !== prev) {
            const phase2 = this.health <= this.maxHealth * 0.5;
            this.nextAttackTime = time + (phase2 ? 2200 : 3000);
        }
    }
}
