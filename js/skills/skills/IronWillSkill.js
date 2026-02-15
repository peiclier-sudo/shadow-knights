// IronWillSkill.js - Warrior skill: 50% damage reduction for 4s (FIXED - 20s cooldown)
import { SkillBase } from '../SkillBase.js';
import { SKILL_DATA } from '../skillData.js';

export class IronWillSkill extends SkillBase {
    constructor(scene, player) {
        super(scene, player, SKILL_DATA.ironWill);
        this.shieldActive = false;
    }
    
    use() {
        if (!super.use()) return false;
        
        this.shieldActive = true;
        
        // Shield visual
        this.shield = this.scene.add.circle(this.player.x, this.player.y, 50, 0x88aaff, 0.3);
        this.shield.setStrokeStyle(4, 0xffffff, 0.8);
        
        this.scene.tweens.add({
            targets: this.shield,
            alpha: 0.2,
            scale: 1.2,
            duration: 4000,
            onComplete: () => {
                if (this.shield) this.shield.destroy();
            }
        });
        
        // Add orbiting particles
        this.orbitingParticles = [];
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const particle = this.scene.add.circle(
                this.player.x + Math.cos(angle) * 40,
                this.player.y + Math.sin(angle) * 40,
                4,
                0x88aaff,
                0.6
            );
            this.orbitingParticles.push({ particle, baseAngle: angle });
        }
        
        // Orbit animation
        let rotation = 0;
        this.orbitInterval = setInterval(() => {
            if (!this.shieldActive || !this.shield || !this.shield.scene) {
                clearInterval(this.orbitInterval);
                return;
            }
            
            rotation += 0.05;
            this.orbitingParticles.forEach(({ particle, baseAngle }) => {
                const angle = baseAngle + rotation;
                particle.x = this.player.x + Math.cos(angle) * 40;
                particle.y = this.player.y + Math.sin(angle) * 40;
            });
        }, 16);
        
        // Apply damage reduction
        this.player.damageReduction = 0.5;
        
        console.log(`🛡️ IRON WILL! Damage reduction: 50%`);
        
        // Remove after 4 seconds
        this.scene.time.delayedCall(4000, () => {
            this.player.damageReduction = 0;
            this.shieldActive = false;
            
            console.log(`⏱️ Iron Will ended`);
            
            // Clean up particles
            if (this.orbitingParticles) {
                this.orbitingParticles.forEach(({ particle }) => {
                    if (particle && particle.scene) particle.destroy();
                });
                this.orbitingParticles = [];
            }
            
            if (this.orbitInterval) {
                clearInterval(this.orbitInterval);
            }
        });
        
        return true;
    }
    
    update() {
        // Update shield position
        if (this.shield && this.shieldActive) {
            this.shield.x = this.player.x;
            this.shield.y = this.player.y;
        }
    }
}