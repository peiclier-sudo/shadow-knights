// SwordWeapon.js - Épée avec slash et laser (FIXED - damage multiplier)
import { WeaponBase } from './WeaponBase.js';
import { WEAPONS } from './weaponData.js';

export class SwordWeapon extends WeaponBase {
    constructor(scene, player) {
        super(scene, player, WEAPONS.SWORD);
    }
    
    // Tir normal - Slash
    fire(angle) {
        const data = this.data.projectile;
        const startX = this.player.x + Math.cos(angle) * 30;
        const startY = this.player.y + Math.sin(angle) * 30;
        
        this.createMuzzleFlash(startX, startY, this.data.color);
        
        // Créer le slash
        const slash = this.scene.add.graphics();
        slash.lineStyle(3, data.color, 0.8);
        slash.beginPath();
        slash.arc(0, 0, data.size * 2, angle - 0.5, angle + 0.5);
        slash.strokePath();
        slash.setPosition(startX, startY);
        slash.setDepth(150);
        
        // Propriétés du projectile
        slash.vx = Math.cos(angle) * data.speed;
        slash.vy = Math.sin(angle) * data.speed;
        slash.damage = data.damage;
        slash.range = data.range;
        slash.startX = startX;
        slash.startY = startY;
        slash.piercing = data.piercing;
        slash.hasHit = false;
        
        this.scene.projectiles.push(slash);
        this.addTrail(slash, data.color, data.size);
    }
    
    // Attaque chargée - Laser perforant
    executeChargedAttack(angle) {
        const charged = this.data.charged;
        
        const startX = this.player.x + Math.cos(angle) * 40;
        const startY = this.player.y + Math.sin(angle) * 40;
        const endX = startX + Math.cos(angle) * charged.length;
        const endY = startY + Math.sin(angle) * charged.length;
        
        let hasHit = false;
        
        // Laser principal
        const laser = this.scene.add.graphics();
        laser.lineStyle(charged.width, 0xffaa00, 0.9);
        laser.lineBetween(startX, startY, endX, endY);
        
        // Glow
        const glow = this.scene.add.graphics();
        glow.lineStyle(charged.width * 2, 0xffaa00, 0.3);
        glow.lineBetween(startX, startY, endX, endY);
        
        laser.alpha = 0;
        glow.alpha = 0;
        
        this.scene.tweens.add({
            targets: [laser, glow],
            alpha: 1,
            duration: 50,
            onComplete: () => {
                if (!hasHit) {
                    this.checkLaserHit(startX, startY, endX, endY, angle, charged);
                    hasHit = true;
                }
                
                this.scene.tweens.add({
                    targets: [laser, glow],
                    alpha: 0,
                    duration: 150,
                    delay: 50,
                    onComplete: () => {
                        laser.destroy();
                        glow.destroy();
                    }
                });
            }
        });
        
        // Particules
        for (let i = 0; i < 10; i++) {
            const dist = i * 100;
            const px = startX + Math.cos(angle) * dist;
            const py = startY + Math.sin(angle) * dist;
            
            const spark = this.scene.add.circle(px, py, 3, 0xffaa00, 0.6);
            this.scene.tweens.add({
                targets: spark,
                alpha: 0,
                scale: 1.5,
                duration: 200,
                onComplete: () => spark.destroy()
            });
        }
    }
    
    checkLaserHit(startX, startY, endX, endY, angle, charged) {
        const boss = this.scene.boss;
        if (!boss) return;
        
        // Projection du boss sur la ligne
        const dx = endX - startX;
        const dy = endY - startY;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length === 0) return;
        
        const unitX = dx / length;
        const unitY = dy / length;
        
        const toBossX = boss.x - startX;
        const toBossY = boss.y - startY;
        
        const t = (toBossX * unitX + toBossY * unitY) / length;
        
        if (t < 0 || t > 1) return;
        
        const projX = startX + unitX * (t * length);
        const projY = startY + unitY * (t * length);
        
        const perpDist = Phaser.Math.Distance.Between(boss.x, boss.y, projX, projY);
        
        if (perpDist < 50) {
            // ✅ FIX: Appliquer le multiplicateur de dégâts
            const finalDamage = charged.damage * (this.player.damageMultiplier || 1.0);
            boss.takeDamage(finalDamage);
            
            console.log(`⚔️ Laser damage: ${Math.floor(finalDamage)} (multiplier: ${this.player.damageMultiplier.toFixed(1)}x)`);
            
            if (charged.knockback) {
                this.scene.tweens.add({
                    targets: boss,
                    x: boss.x + Math.cos(angle) * 150,
                    y: boss.y + Math.sin(angle) * 150,
                    duration: 200,
                    ease: 'Power2'
                });
            }
            
            const impact = this.scene.add.circle(boss.x, boss.y, 25, 0xffaa00, 0.7);
            this.scene.tweens.add({
                targets: impact,
                alpha: 0,
                scale: 2,
                duration: 300,
                onComplete: () => impact.destroy()
            });
        }
    }
}