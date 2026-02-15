// BattleCrySkill.js - Warrior skill: +30% damage for 8s (FIXED)
import { SkillBase } from '../SkillBase.js';
import { SKILL_DATA } from '../skillData.js';

export class BattleCrySkill extends SkillBase {
    constructor(scene, player) {
        super(scene, player, SKILL_DATA.battleCry);
        this.buffActive = false;
    }
    
    use() {
        if (!super.use()) return false;
        
        // Visual effect - expanding ring
        const ring = this.scene.add.circle(this.player.x, this.player.y, 30, 0xff5500, 0.5);
        ring.setStrokeStyle(4, 0xffaa00);
        
        this.scene.tweens.add({
            targets: ring,
            radius: 120,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => ring.destroy()
        });
        
        // Add particles
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const particle = this.scene.add.circle(
                this.player.x,
                this.player.y,
                5,
                0xff5500,
                0.7
            );
            
            this.scene.tweens.add({
                targets: particle,
                x: this.player.x + Math.cos(angle) * 100,
                y: this.player.y + Math.sin(angle) * 100,
                alpha: 0,
                scale: 0.5,
                duration: 400,
                onComplete: () => particle.destroy()
            });
        }
        
        // ✅ FIX: Appliquer le buff de dégâts correctement (+30%)
        this.buffActive = true;
        const oldMultiplier = this.player.damageMultiplier || 1.0;
        this.player.damageMultiplier = oldMultiplier * 1.3;  // +30%
        
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
        // Créer un indicateur visuel rotatif autour du joueur
        this.buffIndicator = this.scene.add.container(0, 0);
        
        // 3 particules qui orbitent
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2;
            const particle = this.scene.add.circle(
                this.player.x + Math.cos(angle) * 35,
                this.player.y + Math.sin(angle) * 35,
                4,
                0xff5500,
                0.8
            );
            this.buffIndicator.add(particle);
        }
        
        // Animation d'orbite
        let rotation = 0;
        const orbitInterval = setInterval(() => {
            if (!this.buffActive || !this.buffIndicator || !this.buffIndicator.scene) {
                clearInterval(orbitInterval);
                return;
            }
            
            rotation += 0.05;
            this.buffIndicator.list.forEach((particle, i) => {
                const angle = (i / 3) * Math.PI * 2 + rotation;
                particle.x = this.player.x + Math.cos(angle) * 35;
                particle.y = this.player.y + Math.sin(angle) * 35;
            });
        }, 16);
    }
    
    update() {
        // Position déjà mise à jour dans l'interval
    }
}