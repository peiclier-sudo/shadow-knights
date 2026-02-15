// StaffWeapon.js - Bâton avec orbes et boule de feu (FIXED - damage multiplier)
import { WeaponBase } from './WeaponBase.js';
import { WEAPONS } from './weaponData.js';

export class StaffWeapon extends WeaponBase {
    constructor(scene, player) {
        super(scene, player, WEAPONS.STAFF);
    }
    
    // Tir normal - Orbe téléguidé
    fire(angle) {
        const data = this.data.projectile;
        const startX = this.player.x + Math.cos(angle) * 30;
        const startY = this.player.y + Math.sin(angle) * 30;
        
        this.createMuzzleFlash(startX, startY, this.data.color);
        
        // Créer l'orbe
        const orb = this.scene.add.star(startX, startY, 5, data.size * 0.7, data.size, data.color);
        orb.setDepth(150);
        
        orb.vx = Math.cos(angle) * data.speed;
        orb.vy = Math.sin(angle) * data.speed;
        orb.damage = data.damage;
        orb.range = data.range;
        orb.startX = startX;
        orb.startY = startY;
        
        // Comportement de homing
        orb.update = () => {
            const boss = this.scene.boss;
            if (!boss) return;
            
            const dx = boss.x - orb.x;
            const dy = boss.y - orb.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 300) {
                orb.vx += dx * 0.03;
                orb.vy += dy * 0.03;
                
                const speed = Math.sqrt(orb.vx * orb.vx + orb.vy * orb.vy);
                orb.vx = (orb.vx / speed) * data.speed;
                orb.vy = (orb.vy / speed) * data.speed;
            }
        };
        
        this.scene.projectiles.push(orb);
        this.addTrail(orb, data.color, data.size);
    }
    
    // Attaque chargée - Boule de feu (directionnelle)
    executeChargedAttack(angle) {
        const charged = this.data.charged;
        
        const startX = this.player.x + Math.cos(angle) * 40;
        const startY = this.player.y + Math.sin(angle) * 40;
        
        const fireball = this.scene.add.circle(startX, startY, 20, 0xff6600);
        const glow = this.scene.add.circle(startX, startY, 35, 0xff6600, 0.4);
        
        const targetX = this.player.x + Math.cos(angle) * 500;
        const targetY = this.player.y + Math.sin(angle) * 500;
        
        this.scene.tweens.add({
            targets: [fireball, glow],
            x: targetX,
            y: targetY,
            duration: 400,
            ease: 'Power2',
            onUpdate: () => {
                glow.x = fireball.x;
                glow.y = fireball.y;
            },
            onComplete: () => {
                const explosion = this.scene.add.circle(targetX, targetY, charged.radius, 0xff6600, 0.7);
                
                // Dégâts au boss s'il est dans l'explosion
                const boss = this.scene.boss;
                if (boss) {
                    const distToBoss = Phaser.Math.Distance.Between(targetX, targetY, boss.x, boss.y);
                    if (distToBoss < charged.radius) {
                        // ✅ FIX: Appliquer le multiplicateur de dégâts
                        const finalDamage = charged.damage * (this.player.damageMultiplier || 1.0);
                        boss.takeDamage(finalDamage);
                        
                        console.log(`🔥 Fireball damage: ${Math.floor(finalDamage)} (multiplier: ${this.player.damageMultiplier.toFixed(1)}x)`);
                        
                        // Dégâts sur la durée
                        if (charged.dotDamage) {
                            let tickCount = 0;
                            const dotInterval = setInterval(() => {
                                if (!boss.scene || tickCount >= charged.dotTicks) {
                                    clearInterval(dotInterval);
                                    return;
                                }
                                
                                // ✅ FIX: Appliquer le multiplicateur aussi au DoT
                                const dotDamage = charged.dotDamage * (this.player.damageMultiplier || 1.0);
                                boss.takeDamage(dotDamage);
                                
                                boss.setTint(0xff6600);
                                this.scene.time.delayedCall(100, () => boss.clearTint());
                                
                                if (tickCount === 0) {
                                    console.log(`🔥 Fireball DoT: ${Math.floor(dotDamage)} per tick (multiplier: ${this.player.damageMultiplier.toFixed(1)}x)`);
                                }
                                
                                tickCount++;
                            }, charged.dotInterval);
                        }
                    }
                }
                
                // Particules d'explosion
                for (let i = 0; i < 12; i++) {
                    const particleAngle = (i / 12) * Math.PI * 2;
                    const particle = this.scene.add.circle(
                        targetX, targetY,
                        5 + Math.random() * 5,
                        0xff6600,
                        0.6
                    );
                    
                    this.scene.tweens.add({
                        targets: particle,
                        x: targetX + Math.cos(particleAngle) * 100,
                        y: targetY + Math.sin(particleAngle) * 100,
                        alpha: 0,
                        duration: 300,
                        onComplete: () => particle.destroy()
                    });
                }
                
                this.scene.tweens.add({
                    targets: [explosion, glow, fireball],
                    alpha: 0,
                    scale: 1.5,
                    duration: 300,
                    onComplete: () => {
                        explosion.destroy();
                        glow.destroy();
                        fireball.destroy();
                    }
                });
                
                this.scene.cameras.main.shake(150, 0.01);
            }
        });
    }
}