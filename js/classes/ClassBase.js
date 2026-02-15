// ClassBase.js - Classe de base pour toutes les classes
export class ClassBase {
    constructor(scene, player, classData) {
        this.scene = scene;
        this.player = player;
        this.data = classData;
        
        // Appliquer les stats de base
        this.player.health = this.data.baseHealth;
        this.player.maxHealth = this.data.baseHealth;
        this.player.stamina = this.data.baseStamina;
        this.player.maxStamina = this.data.baseStamina;
        this.player.speed = this.data.baseSpeed;
        this.player.staminaRegen = this.data.staminaRegen;
        
        // Skills
        this.skills = [];
        this.createSkills();
        
        // Visuals
        this.initVisuals();
    }
    
    createSkills() {
        // À surcharger par chaque classe
        console.warn('createSkills() must be implemented by class');
    }
    
    initVisuals() {
        // Aura de classe
        this.aura = this.scene.add.graphics();
        this.updateAura();
    }
    
    // DASH - Chaque classe peut surcharger
    dash(directionX, directionY) {
        const dashData = this.data.dash;
        
        if (this.player.stamina < dashData.staminaCost) return false;
        if (this.player.isDashing) return false;
        
        this.player.stamina -= dashData.staminaCost;
        this.player.isDashing = true;
        this.player.isInvulnerable = true;
        
        // Appliquer la vélocité du dash
        this.player.body.setVelocity(
            directionX * dashData.speed,
            directionY * dashData.speed
        );
        
        // Effet de dash de base
        this.createDashEffect();
        
        // Fin du dash
        this.scene.time.delayedCall(dashData.duration, () => {
            this.player.isDashing = false;
            this.player.isInvulnerable = false;
            this.player.body.setVelocity(0, 0);
            this.createDashEndEffect();
        });
        
        return true;
    }
    
    createDashEffect() {
        // Effet de base - afterimages
        const color = this.data.color;
        let count = 0;
        const interval = setInterval(() => {
            if (!this.player.isDashing || count > 5) {
                clearInterval(interval);
                return;
            }
            
            const afterimage = this.scene.add.circle(
                this.player.x, this.player.y,
                18, color, 0.2
            );
            
            this.scene.tweens.add({
                targets: afterimage,
                alpha: 0,
                scale: 0.8,
                duration: 200,
                onComplete: () => afterimage.destroy()
            });
            
            count++;
        }, 40);
    }
    
    createDashEndEffect() {
        // Effet de fin de dash - fumée
        const color = this.data.color;
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const smoke = this.scene.add.circle(
                this.player.x, this.player.y,
                5 + Math.random() * 5,
                color,
                0.2
            );
            
            this.scene.tweens.add({
                targets: smoke,
                x: this.player.x + Math.cos(angle) * 40,
                y: this.player.y + Math.sin(angle) * 40,
                alpha: 0,
                scale: 1.5,
                duration: 200,
                onComplete: () => smoke.destroy()
            });
        }
    }
    
    // Utiliser une compétence
    useSkill(index) {
        if (index < 0 || index >= this.skills.length) return false;
        
        const skill = this.skills[index];
        if (!skill.canUse()) return false;
        
        return skill.use();
    }
    
    // Mettre à jour l'aura
    updateAura() {
        if (!this.aura) return;
        
        this.aura.clear();
        const pulse = 0.2 + Math.sin(Date.now() * 0.005) * 0.1;
        this.aura.lineStyle(2, this.data.glowColor, pulse);
        this.aura.strokeCircle(this.player.x, this.player.y, 40);
    }
    
    // Update appelé chaque frame
    update(time, delta) {
        this.updateAura();
        this.skills.forEach(skill => skill.update());
    }
    
    destroy() {
        if (this.aura) this.aura.destroy();
    }
}