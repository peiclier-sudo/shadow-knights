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
        const color = Number(this.data.color || 0xffffff);

        // Core pulse
        const flash = this.scene.add.circle(this.player.x, this.player.y, 34, color, 0.42).setDepth(170);
        const halo = this.scene.add.circle(this.player.x, this.player.y, 54, color, 0.14)
            .setStrokeStyle(3, color, 0.55)
            .setDepth(169);

        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 1.8,
            duration: 260,
            ease: 'Cubic.easeOut',
            onComplete: () => flash.destroy()
        });

        this.scene.tweens.add({
            targets: halo,
            alpha: 0,
            scale: 1.25,
            duration: 340,
            ease: 'Sine.easeOut',
            onComplete: () => halo.destroy()
        });

        // Rotating runic arcs
        const rune = this.scene.add.graphics().setDepth(171);
        rune.lineStyle(2, color, 0.65);
        rune.strokeCircle(this.player.x, this.player.y, 30);
        rune.lineStyle(3, color, 0.5);
        rune.beginPath();
        rune.arc(this.player.x, this.player.y, 42, -0.35, 0.35);
        rune.strokePath();
        rune.beginPath();
        rune.arc(this.player.x, this.player.y, 42, Math.PI - 0.35, Math.PI + 0.35);
        rune.strokePath();

        this.scene.tweens.add({
            targets: rune,
            angle: 120,
            alpha: 0,
            duration: 380,
            ease: 'Cubic.easeOut',
            onComplete: () => rune.destroy()
        });

        // Spark burst
        for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2 + Math.random() * 0.25;
            const speed = Phaser.Math.Between(50, 100);
            const spark = this.scene.add.circle(this.player.x, this.player.y, Phaser.Math.FloatBetween(2, 4), color, 0.85)
                .setDepth(172);

            this.scene.tweens.add({
                targets: spark,
                x: this.player.x + Math.cos(angle) * speed,
                y: this.player.y + Math.sin(angle) * speed,
                alpha: 0,
                scale: 0.3,
                duration: Phaser.Math.Between(180, 260),
                ease: 'Sine.easeOut',
                onComplete: () => spark.destroy()
            });
        }
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