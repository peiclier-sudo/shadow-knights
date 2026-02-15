// GreatswordWeapon.js - Espadon avec onde de choc et ground slam (FIXED - damage multiplier)
import { WeaponBase } from './WeaponBase.js';
import { WEAPONS } from './weaponData.js';

export class GreatswordWeapon extends WeaponBase {
    constructor(scene, player) {
        super(scene, player, WEAPONS.GREATSWORD);
    }
    
    // Tir normal - Onde de choc
    fire(angle) {
        const data = this.data.projectile;
        const startX = this.player.x + Math.cos(angle) * 30;
        const startY = this.player.y + Math.sin(angle) * 30;
        
        this.createMuzzleFlash(startX, startY, this.data.color);
        
        // Créer l'onde
        const wave = this.scene.add.container(startX, startY);
        const mainWave = this.scene.add.ellipse(0, 0, data.size * 4, data.size * 2, data.color, 0.6);
        mainWave.rotation = angle;
        const outline = this.scene.add.ellipse(0, 0, data.size * 4, data.size * 2, data.color * 0.7, 0.3);
        outline.rotation = angle;
        wave.add([mainWave, outline]);
        wave.setDepth(150);
        
        wave.vx = Math.cos(angle) * data.speed;
        wave.vy = Math.sin(angle) * data.speed;
        wave.damage = data.damage;
        wave.range = data.range;
        wave.startX = startX;
        wave.startY = startY;
        wave.knockback = data.knockback;
        wave.knockbackForce = data.knockbackForce;
        
        this.scene.projectiles.push(wave);
        this.addTrail(wave, data.color, data.size);
    }
    
    // Attaque chargée - Ground Slam (centré sur le joueur)
    executeChargedAttack(angle) {
        const charged = this.data.charged;
        
        this.scene.cameras.main.shake(200, 0.01);
        
        const slamWave = this.scene.add.circle(this.player.x, this.player.y, 30, 0xcc6600, 0.7);
        
        this.scene.tweens.add({
            targets: slamWave,
            radius: charged.radius,
            alpha: 0,
            duration: 300,
            onComplete: () => slamWave.destroy()
        });
        
        const boss = this.scene.boss;
        if (boss) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, boss.x, boss.y);
            if (dist < charged.radius) {
                // ✅ FIX: Appliquer le multiplicateur de dégâts
                const finalDamage = charged.damage * (this.player.damageMultiplier || 1.0);
                boss.takeDamage(finalDamage);
                
                console.log(`💥 Ground Slam damage: ${Math.floor(finalDamage)} (multiplier: ${this.player.damageMultiplier.toFixed(1)}x)`);
                
                if (charged.stun) {
                    boss.stunned = true;
                    boss.setTint(0xcccccc);
                    
                    this.scene.time.delayedCall(charged.stunDuration, () => {
                        boss.stunned = false;
                        boss.clearTint();
                    });
                }
            }
        }
        
        // Particules de poussière
        for (let i = 0; i < 20; i++) {
            const particleAngle = Math.random() * Math.PI * 2;
            const distance = Math.random() * charged.radius;
            const particle = this.scene.add.circle(
                this.player.x + Math.cos(particleAngle) * distance,
                this.player.y + Math.sin(particleAngle) * distance,
                3 + Math.random() * 5,
                0xaa8866,
                0.5
            );
            
            this.scene.tweens.add({
                targets: particle,
                y: particle.y - 50,
                alpha: 0,
                scale: 1.5,
                duration: 500,
                onComplete: () => particle.destroy()
            });
        }
    }
}