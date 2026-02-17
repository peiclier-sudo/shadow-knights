// WeaponBase.js - Classe de base pour toutes les armes (FIXED - charge minimale requise)
export class WeaponBase {
    constructor(scene, player, weaponData) {
        this.scene = scene;
        this.player = player;
        this.data = weaponData;
        this.lastShotTime = 0;
        this.isCharging = false;
        this.chargeLevel = 0;
        this.chargeStartTime = 0;
    }
    
    // Méthode appelée pour tirer
    attack(angle) {
        if (!this.canAttack()) return false;
        
        this.lastShotTime = Date.now();
        this.player.stamina -= 7;
        this.player.canAttack = false;
        
        // Tir principal
        this.fire(angle);

        // Arcane Surge: next 3 shots fire 3 projectiles each (1 main + 2 side shots)
        if ((this.player.multishotCount || 0) > 0) {
            const spread = Phaser.Math.DegToRad(12);
            this.fire(angle - spread);
            this.fire(angle + spread);

            this.player.multishotCount--;
            if (this.player.multishotCount <= 0) {
                this.player.multishot = 0;
            }
        }
        
        // Reset cooldown
        this.scene.time.delayedCall(this.data.projectile.cooldown, () => {
            this.player.canAttack = true;
        });
        
        return true;
    }
    
    // Vérifie si on peut attaquer
    canAttack() {
        const now = Date.now();
        const cooldownOk = now - this.lastShotTime >= this.data.projectile.cooldown;
        return cooldownOk && this.player.stamina >= 7 && this.player.canAttack;
    }
    
    // À surcharger par chaque arme
    fire(angle) {
        console.warn('fire() must be implemented by weapon');
    }
    
    // Démarrer la charge
    startCharge() {
        this.isCharging = true;
        this.chargeStartTime = Date.now();
        this.chargeLevel = 0;
    }
    
    // Mettre à jour la charge
    updateCharge() {
        if (!this.isCharging) return;
        
        const elapsed = Date.now() - this.chargeStartTime;
        this.chargeLevel = Math.min(1, elapsed / this.data.charged.chargeTime);
    }
    
    // Libérer la charge
    releaseCharge(angle) {
        if (!this.isCharging) return false;
        
        this.isCharging = false;
        
        // ✅ FIX: Vérifier la charge minimale (30% par défaut, 100% si fullChargeRequired)
        const minCharge = this.data.charged.fullChargeRequired ? 1.0 : 0.3;
        
        if (this.chargeLevel < minCharge) {
            console.log(`⚠️ Charge insuffisante: ${Math.floor(this.chargeLevel * 100)}% (min: ${Math.floor(minCharge * 100)}%)`);
            return false;
        }
        
        if (this.player.stamina < this.data.charged.staminaCost) {
            console.log(`⚠️ Pas assez de stamina: ${Math.floor(this.player.stamina)}/${this.data.charged.staminaCost}`);
            return false;
        }
        
        this.player.stamina -= this.data.charged.staminaCost;
        this.executeChargedAttack(angle);
        
        console.log(`✅ Charged attack! Level: ${Math.floor(this.chargeLevel * 100)}%`);
        
        return true;
    }
    
    // À surcharger par chaque arme
    executeChargedAttack(angle) {
        console.warn('executeChargedAttack() must be implemented by weapon');
    }
    
    // Créer un effet de flash (utilitaire)
    createMuzzleFlash(x, y, color) {
        const flash = this.scene.add.circle(x, y, 12, color, 0.6).setDepth(165);
        const ring = this.scene.add.circle(x, y, 18, color, 0)
            .setStrokeStyle(2, color, 0.7)
            .setDepth(164);

        this.scene.tweens.add({
            targets: flash,
            scale: 1.8,
            alpha: 0,
            duration: 120,
            ease: 'Cubic.easeOut',
            onComplete: () => flash.destroy()
        });

        this.scene.tweens.add({
            targets: ring,
            scale: 1.35,
            alpha: 0,
            duration: 180,
            ease: 'Sine.easeOut',
            onComplete: () => ring.destroy()
        });
    }
    
    // Ajouter un trail (utilitaire)
    addTrail(proj, color, size) {
        const trailEvent = this.scene.time.addEvent({
            delay: 40,
            repeat: 8,
            callback: () => {
                if (!proj || !proj.scene) {
                    trailEvent.remove(false);
                    return;
                }

                const trail = this.scene.add.circle(proj.x, proj.y, size * 0.58, color, 0.16).setDepth(140);
                this.scene.tweens.add({
                    targets: trail,
                    alpha: 0,
                    scale: 0.35,
                    duration: 210,
                    ease: 'Sine.easeOut',
                    onComplete: () => trail.destroy()
                });
            }
        });
    }
    

    gainUltimateGaugeFromDamage(damageDealt, options = {}) {
        if (!this.player) return 0;

        const charged = !!options.charged;
        const dot = !!options.dot;
        const amount = Math.max(0, Number(damageDealt) || 0);

        if (amount <= 0) return 0;

        // Tuned for boss-rush pacing: basics fill steadily, charged bursts fill faster, DoT contributes less.
        const baseRatio = 0.16;
        const chargedBonus = charged ? 1.35 : 1;
        const dotPenalty = dot ? 0.45 : 1;
        const gain = Math.max(1, Math.round(amount * baseRatio * chargedBonus * dotPenalty));

        const maxGauge = this.player.ultimateGaugeMax || 100;
        const previous = this.player.ultimateGauge || 0;
        this.player.ultimateGauge = Phaser.Math.Clamp(previous + gain, 0, maxGauge);

        return this.player.ultimateGauge - previous;
    }

    // Réinitialiser la charge (quand annulée)
    resetCharge() {
        this.isCharging = false;
        this.chargeLevel = 0;
    }

    getNormalRange() {
        return this.data?.projectile?.range || 0;
    }

    getChargedPreviewConfig() {
        const charged = this.data?.charged || {};
        return {
            targeting: charged.targeting || 'line',
            maxRange: charged.maxRange || charged.length || 0,
            aoeRadius: charged.radius || 0
        };
    }

    getClampedChargedTarget(targetX, targetY) {
        const config = this.getChargedPreviewConfig();
        const maxRange = config.maxRange;

        if (!maxRange || config.targeting === 'self') {
            return { x: targetX, y: targetY };
        }

        const dx = targetX - this.player.x;
        const dy = targetY - this.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= maxRange || dist === 0) {
            return { x: targetX, y: targetY };
        }

        const ratio = maxRange / dist;
        return {
            x: this.player.x + dx * ratio,
            y: this.player.y + dy * ratio
        };
    }
}
