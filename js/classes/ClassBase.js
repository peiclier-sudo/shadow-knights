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
        // Multi-layer aura rings
        this.auraOuter = this.scene.add.graphics();
        this.auraInner = this.scene.add.graphics();
        this.auraCore  = this.scene.add.graphics();

        // Micro-spark particles orbiting the aura
        this._auraParticles = [];
        this._auraParticleAngle = 0;
        const particleCount = 6;
        for (let i = 0; i < particleCount; i++) {
            const spark = this.scene.add.circle(
                this.player.x, this.player.y,
                Phaser.Math.FloatBetween(1.5, 3),
                this.data.glowColor,
                0.9
            ).setDepth(51);
            spark._baseAngle = (i / particleCount) * Math.PI * 2;
            spark._orbitRadius = 42 + Phaser.Math.FloatBetween(-4, 4);
            spark._speed = Phaser.Math.FloatBetween(0.018, 0.026);
            this._auraParticles.push(spark);
        }

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
        // Enhanced afterimages – layered glow + fill
        const color     = this.data.color;
        const glowColor = this.data.glowColor;
        let count = 0;
        const interval = setInterval(() => {
            if (!this.player.isDashing || count > 7) {
                clearInterval(interval);
                return;
            }

            // Outer glow ring
            const afterOuter = this.scene.add.circle(
                this.player.x, this.player.y,
                24, glowColor, 0.18
            ).setDepth(48);

            // Inner filled afterimage
            const afterInner = this.scene.add.circle(
                this.player.x, this.player.y,
                14, color, 0.35
            ).setDepth(49);

            this.scene.tweens.add({
                targets: [afterOuter, afterInner],
                alpha: 0,
                scale: 0.7,
                duration: 240,
                ease: 'Cubic.easeOut',
                onComplete: () => { afterOuter.destroy(); afterInner.destroy(); }
            });

            count++;
        }, 30);
    }

    createDashEndEffect() {
        // Burst ring + radial smoke puffs
        const color     = this.data.color;
        const glowColor = this.data.glowColor;

        // Quick expanding ring
        const ring = this.scene.add.circle(this.player.x, this.player.y, 10, color, 0)
            .setStrokeStyle(3, glowColor, 0.9)
            .setDepth(50);
        this.scene.tweens.add({
            targets: ring,
            scale: 3.5,
            alpha: 0,
            duration: 280,
            ease: 'Cubic.easeOut',
            onComplete: () => ring.destroy()
        });

        // Radial smoke puffs
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const smoke = this.scene.add.circle(
                this.player.x, this.player.y,
                4 + Math.random() * 6,
                color, 0.25
            ).setDepth(47);

            this.scene.tweens.add({
                targets: smoke,
                x: this.player.x + Math.cos(angle) * 50,
                y: this.player.y + Math.sin(angle) * 50,
                alpha: 0,
                scale: 2,
                duration: 260,
                ease: 'Sine.easeOut',
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
    
    // Mettre à jour l'aura (multi-layer + orbiting sparks)
    updateAura() {
        if (!this.auraOuter || !this.auraInner || !this.auraCore) return;

        const t = Date.now();

        // Outer ring: slow pulse
        const outerAlpha = 0.12 + Math.sin(t * 0.003) * 0.06;
        this.auraOuter.clear();
        this.auraOuter.lineStyle(3, this.data.glowColor, outerAlpha);
        this.auraOuter.strokeCircle(this.player.x, this.player.y, 52);
        this.auraOuter.setDepth(50);

        // Middle ring: medium pulse, offset phase
        const midAlpha = 0.22 + Math.sin(t * 0.005 + 1.0) * 0.1;
        this.auraInner.clear();
        this.auraInner.lineStyle(2, this.data.color, midAlpha);
        this.auraInner.strokeCircle(this.player.x, this.player.y, 40);
        this.auraInner.setDepth(51);

        // Core soft glow: fast flicker
        const coreAlpha = 0.08 + Math.sin(t * 0.009 + 2.0) * 0.04;
        this.auraCore.clear();
        this.auraCore.fillStyle(this.data.glowColor, coreAlpha);
        this.auraCore.fillCircle(this.player.x, this.player.y, 26);
        this.auraCore.setDepth(49);

        // Update orbiting micro-sparks
        this._auraParticleAngle += 0.008;
        if (this._auraParticles) {
            this._auraParticles.forEach((spark) => {
                const angle = spark._baseAngle + this._auraParticleAngle * (spark._speed / 0.02);
                spark.x = this.player.x + Math.cos(angle) * spark._orbitRadius;
                spark.y = this.player.y + Math.sin(angle) * spark._orbitRadius;
                spark.alpha = 0.5 + Math.sin(t * 0.007 + spark._baseAngle) * 0.4;
            });
        }
    }

    // Update appelé chaque frame
    update(time, delta) {
        this.updateAura();
        this.skills.forEach(skill => skill.update());
    }

    destroy() {
        if (this.auraOuter) this.auraOuter.destroy();
        if (this.auraInner) this.auraInner.destroy();
        if (this.auraCore)  this.auraCore.destroy();
        if (this._auraParticles) {
            this._auraParticles.forEach(s => s.destroy());
            this._auraParticles = [];
        }
    }
}