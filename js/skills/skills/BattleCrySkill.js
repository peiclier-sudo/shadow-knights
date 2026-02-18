// BattleCrySkill.js - Warrior skill: +50% damage for 8s (FIXED)
import { SkillBase } from '../SkillBase.js';
import { SKILL_DATA } from '../skillData.js';

export class BattleCrySkill extends SkillBase {
    constructor(scene, player) {
        super(scene, player, SKILL_DATA.battleCry);
        this.buffActive = false;
    }
    
    use() {
        if (!super.use()) return false;

        const px = this.player.x;
        const py = this.player.y;

        // Three staggered expanding rings
        [0, 80, 160].forEach((delay, idx) => {
            this.scene.time.delayedCall(delay, () => {
                const r = this.scene.add.circle(px, py, 20 + idx * 10, 0xff5500, 0)
                    .setStrokeStyle(3 - idx, idx === 0 ? 0xffdd44 : 0xffaa00, 0.9)
                    .setDepth(170);
                this.scene.tweens.add({
                    targets: r,
                    scale: 5 - idx,
                    alpha: 0,
                    duration: 500,
                    ease: 'Cubic.easeOut',
                    onComplete: () => r.destroy()
                });
            });
        });

        // Inner bright core flash
        const core = this.scene.add.circle(px, py, 22, 0xffdd44, 0.7).setDepth(171);
        this.scene.tweens.add({
            targets: core,
            scale: 2.8,
            alpha: 0,
            duration: 280,
            ease: 'Power2',
            onComplete: () => core.destroy()
        });

        // Burst particles – larger, dual-color
        for (let i = 0; i < 18; i++) {
            const angle = (i / 18) * Math.PI * 2;
            const speed = Phaser.Math.Between(70, 130);
            const color = i % 2 === 0 ? 0xff5500 : 0xffdd44;
            const particle = this.scene.add.circle(px, py, Phaser.Math.FloatBetween(3, 7), color, 0.85)
                .setDepth(172);
            this.scene.tweens.add({
                targets: particle,
                x: px + Math.cos(angle) * speed,
                y: py + Math.sin(angle) * speed,
                alpha: 0,
                scale: 0.3,
                duration: Phaser.Math.Between(320, 480),
                ease: 'Sine.easeOut',
                onComplete: () => particle.destroy()
            });
        }
        
        // ✅ FIX: Appliquer le buff de dégâts correctement (+50%)
        this.buffActive = true;
        const oldMultiplier = this.player.damageMultiplier || 1.0;
        this.player.damageMultiplier = oldMultiplier * 1.5;  // +50%
        
        console.log(`🔥 BATTLE CRY! Damage: ${oldMultiplier.toFixed(1)}x → ${this.player.damageMultiplier.toFixed(1)}x`);
        
        // ✅ Buff indicator sur le joueur (orbites rouges)
        this.createBuffIndicator();
        
        // ✅ FIX: Retirer le buff après 8 secondes (pas 5)
        this.scene.time.delayedCall(8000, () => {
            this.player.damageMultiplier = oldMultiplier;
            this.buffActive = false;
            console.log(`⏱️ Battle Cry ended. Damage back to ${oldMultiplier.toFixed(1)}x`);
            
            if (this.buffIndicator) {
                this.buffIndicator.destroy();
                this.buffIndicator = null;
            }
        });
        
        return true;
    }
    
    createBuffIndicator() {
        this.buffIndicator = this.scene.add.container(0, 0).setDepth(175);

        // 5 orbiting ember particles – larger + trail-like
        const orbitCount = 5;
        for (let i = 0; i < orbitCount; i++) {
            const angle = (i / orbitCount) * Math.PI * 2;
            const color = i % 2 === 0 ? 0xff5500 : 0xffcc44;
            const particle = this.scene.add.circle(
                this.player.x + Math.cos(angle) * 46,
                this.player.y + Math.sin(angle) * 46,
                i % 2 === 0 ? 5 : 3,
                color, 0.9
            );
            this.buffIndicator.add(particle);
        }

        // Thin orbit ring
        const orbitRing = this.scene.add.circle(
            this.player.x, this.player.y,
            46, 0xff5500, 0
        ).setStrokeStyle(1, 0xff7700, 0.35);
        this.buffIndicator.add(orbitRing);

        // Orbit animation
        let rotation = 0;
        const orbitInterval = setInterval(() => {
            if (!this.buffActive || !this.buffIndicator || !this.buffIndicator.scene) {
                clearInterval(orbitInterval);
                return;
            }

            rotation += 0.045;
            this.buffIndicator.list.forEach((obj, idx) => {
                if (idx < orbitCount) {
                    const angle = (idx / orbitCount) * Math.PI * 2 + rotation;
                    obj.x = this.player.x + Math.cos(angle) * 46;
                    obj.y = this.player.y + Math.sin(angle) * 46;
                    // Pulsing alpha
                    obj.alpha = 0.6 + Math.sin(Date.now() * 0.006 + idx) * 0.35;
                } else {
                    // Ring follows player
                    obj.setPosition(this.player.x, this.player.y);
                }
            });
        }, 16);
    }
    
    update() {
        // Position déjà mise à jour dans l'interval
    }
}