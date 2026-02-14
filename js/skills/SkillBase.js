// SkillBase.js - Base class for all skills
export class SkillBase {
    constructor(scene, player, skillData) {
        this.scene = scene;
        this.player = player;
        this.data = skillData;
        this.lastUsed = 0;
        this.cooldown = skillData.cooldown || 5000;
        this.staminaCost = skillData.staminaCost || 30;
        this.icon = skillData.icon || '✨';
        this.name = skillData.name || 'Skill';
    }
    
    canUse() {
        const now = Date.now();
        const cooldownReady = (now - this.lastUsed) >= this.cooldown;
        const hasStamina = this.player.stamina >= this.staminaCost;
        const notDashing = !this.player.isDashing;
        
        return cooldownReady && hasStamina && notDashing;
    }
    
    use() {
        if (!this.canUse()) return false;
        
        this.lastUsed = Date.now();
        this.player.stamina -= this.staminaCost;
        
        // Visual feedback - skill used flash
        this.showUseEffect();
        
        return true;
    }
    
    showUseEffect() {
        // Create a simple flash effect
        const flash = this.scene.add.circle(
            this.player.x,
            this.player.y,
            40,
            parseInt(this.data.color || '0xffffff'),
            0.4
        );
        
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 1.5,
            duration: 300,
            onComplete: () => flash.destroy()
        });
    }
    
    getCooldownProgress() {
        const now = Date.now();
        const elapsed = now - this.lastUsed;
        return Math.min(1, elapsed / this.cooldown);
    }
    
    isOnCooldown() {
        return (Date.now() - this.lastUsed) < this.cooldown;
    }
    
    update() {
        // Override in child classes if needed
    }
}