// WeaponBase.js - Base class for all weapons
export class WeaponBase {
    constructor(scene, player, weaponData) {
        this.scene = scene;
        this.player = player;
        this.data = weaponData;
        this.lastShot = 0;
        this.isCharging = false;
        this.chargeLevel = 0;
        this.chargeStartTime = 0;
    }
    
    // Basic attack
    attack(angle) {
        const now = Date.now();
        const cooldown = 250; // ms between shots
        
        if (now - this.lastShot < cooldown) return false;
        if (this.player.stamina < 7) return false;
        
        this.lastShot = now;
        this.player.stamina -= 7;
        this.player.canAttack = false;
        
        // Create projectile(s)
        if (this.data.projectile.count > 1) {
            this.fireSpread(angle);
        } else {
            this.fireSingle(angle);
        }
        
        // Reset attack cooldown
        this.scene.time.delayedCall(cooldown, () => {
            this.player.canAttack = true;
        });
        
        // Muzzle flash
        this.createMuzzleFlash(angle);
        
        return true;
    }
    
    fireSingle(angle) {
        const projData = this.data.projectile;
        this.createProjectile(angle, projData);
    }
    
    fireSpread(angle) {
        const projData = this.data.projectile;
        const spread = projData.spread || 0.2;
        const count = projData.count || 3;
        
        for (let i = 0; i < count; i++) {
            const offset = (i - (count - 1) / 2) * spread;
            this.createProjectile(angle + offset, projData);
        }
    }
    
    createProjectile(angle, data) {
        const startX = this.player.x + Math.cos(angle) * 30;
        const startY = this.player.y + Math.sin(angle) * 30;
        
        // Base projectile
        const proj = this.scene.add.circle(startX, startY, data.size, data.color);
        proj.setDepth(150);
        proj.vx = Math.cos(angle) * data.speed;
        proj.vy = Math.sin(angle) * data.speed;
        proj.damage = data.damage;
        
        // Add trail
        this.addTrail(proj, data);
        
        this.scene.projectiles.push(proj);
        return proj;
    }
    
    addTrail(proj, data) {
        let trailCount = 0;
        const trailInterval = setInterval(() => {
            if (!proj.scene || trailCount > 20) {
                clearInterval(trailInterval);
                return;
            }
            
            const trail = this.scene.add.circle(
                proj.x, proj.y,
                data.size * 0.6,
                data.color,
                0.5
            );
            trail.setDepth(148);
            
            this.scene.tweens.add({
                targets: trail,
                alpha: 0,
                scale: 0.5,
                duration: 200,
                onComplete: () => trail.destroy()
            });
            
            trailCount++;
        }, 30);
    }
    
    createMuzzleFlash(angle) {
        const flashX = this.player.x + Math.cos(angle) * 30;
        const flashY = this.player.y + Math.sin(angle) * 30;
        
        const flash = this.scene.add.circle(flashX, flashY, 15, 0xffffff, 0.8);
        
        this.scene.tweens.add({
            targets: flash,
            scale: 2,
            alpha: 0,
            duration: 100,
            onComplete: () => flash.destroy()
        });
    }
    
    // Charged attack
    startCharge() {
        if (this.player.body.velocity.x !== 0 || this.player.body.velocity.y !== 0) {
            return false; // Can't charge while moving
        }
        
        this.isCharging = true;
        this.chargeStartTime = Date.now();
        this.chargeLevel = 0;
        
        // Visual feedback
        this.showChargeEffect();
        
        return true;
    }
    
    updateCharge() {
        if (!this.isCharging) return;
        
        const elapsed = Date.now() - this.chargeStartTime;
        this.chargeLevel = Math.min(1, elapsed / this.data.charged.chargeTime);
    }
    
    releaseCharge(angle) {
        if (!this.isCharging) return false;
        
        this.isCharging = false;
        
        if (this.chargeLevel < 0.3) {
            return false; // Not enough charge, do normal attack instead
        }
        
        if (this.player.stamina < this.data.charged.staminaCost) return false;
        
        this.player.stamina -= this.data.charged.staminaCost;
        
        // Execute charged attack (to be overridden)
        this.executeChargedAttack(angle);
        
        return true;
    }
    
    executeChargedAttack(angle) {
        // Override in child classes
        console.warn('executeChargedAttack must be implemented by child class');
    }
    
    showChargeEffect() {
        this.chargeGraphics = this.scene.add.graphics();
    }
    
    update() {
        if (this.isCharging) {
            this.updateCharge();
            
            if (this.chargeGraphics) {
                this.chargeGraphics.clear();
                const radius = 30 + this.chargeLevel * 40;
                this.chargeGraphics.lineStyle(4, 0xffaa00, 0.8);
                this.chargeGraphics.strokeCircle(this.player.x, this.player.y, radius);
            }
        } else if (this.chargeGraphics) {
            this.chargeGraphics.destroy();
            this.chargeGraphics = null;
        }
    }
}