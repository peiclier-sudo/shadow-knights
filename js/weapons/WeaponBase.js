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
        
        // Chaque arme implémente sa propre logique de tir
        this.fire(angle);
        
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
        const flash = this.scene.add.circle(x, y, 12, color, 0.5);
        this.scene.tweens.add({
            targets: flash,
            scale: 1.5,
            alpha: 0,
            duration: 100,
            onComplete: () => flash.destroy()
        });
    }
    
    // Ajouter un trail (utilitaire)
    addTrail(proj, color, size) {
        let trailCount = 0;
        const trailInterval = setInterval(() => {
            if (!proj.scene || trailCount > 6) {
                clearInterval(trailInterval);
                return;
            }
            const trail = this.scene.add.circle(proj.x, proj.y, size * 0.6, color, 0.1);
            this.scene.tweens.add({
                targets: trail,
                alpha: 0,
                scale: 0.5,
                duration: 200,
                onComplete: () => trail.destroy()
            });
            trailCount++;
        }, 50);
    }
    
    // Réinitialiser la charge (quand annulée)
    resetCharge() {
        this.isCharging = false;
        this.chargeLevel = 0;
    }
}