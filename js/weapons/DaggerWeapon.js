// DaggerWeapon.js - Dagues avec tir en éventail et nuage de poison (FIXED - damage multiplier)
import { WeaponBase } from './WeaponBase.js';
import { WEAPONS } from './weaponData.js';

export class DaggerWeapon extends WeaponBase {
    constructor(scene, player) {
        super(scene, player, WEAPONS.DAGGERS);
    }
    
    // Tir normal - 3 dagues en éventail
    fire(angle) {
        const data = this.data.projectile;
        
        for (let i = 0; i < data.count; i++) {
            const offset = (i - (data.count - 1) / 2) * data.spread;
            this.createDagger(angle + offset, data);
        }
        
        this.createMuzzleFlash(this.player.x, this.player.y, this.data.color);
    }
    
    createDagger(angle, data) {
        const startX = this.player.x + Math.cos(angle) * 30;
        const startY = this.player.y + Math.sin(angle) * 30;
        
        const dagger = this.scene.add.triangle(
            startX, startY,
            -data.size, -data.size,
            data.size, 0,
            -data.size, data.size,
            data.color
        );
        dagger.rotation = angle;
        dagger.setDepth(150);
        
        dagger.vx = Math.cos(angle) * data.speed;
        dagger.vy = Math.sin(angle) * data.speed;
        dagger.damage = data.damage;
        dagger.range = data.range;
        dagger.startX = startX;
        dagger.startY = startY;
        
        this.scene.projectiles.push(dagger);
        this.addTrail(dagger, data.color, data.size);
    }
    
    // Attaque chargée - Nuage de poison (directionnel)
    executeChargedAttack(angle) {
        const charged = this.data.charged;
        
        const targetPoint = this.getClampedChargedTarget(this.scene.worldMouseX, this.scene.worldMouseY);
        const cloudX = targetPoint.x;
        const cloudY = targetPoint.y;
        
        const cloud = this.scene.add.circle(cloudX, cloudY, charged.radius, 0x88aa88, 0.3);
        
        let tickCount = 0;
        const interval = setInterval(() => {
            const boss = this.scene.boss;
            if (!boss?.scene || tickCount >= charged.ticks) {
                clearInterval(interval);
                cloud.destroy();
                return;
            }
            
            const distToBoss = Phaser.Math.Distance.Between(cloudX, cloudY, boss.x, boss.y);
            if (distToBoss < charged.radius) {
                // ✅ FIX: Appliquer le multiplicateur de dégâts
                const tickDamage = (charged.damage / charged.ticks) * (this.player.damageMultiplier || 1.0);
                boss.takeDamage(tickDamage);
                this.gainUltimateGaugeFromDamage(tickDamage, { charged: true, dot: true });
                
                boss.setTint(0x88aa88);
                
                if (charged.slow) {
                    boss.slowed = true;
                }
                
                this.scene.time.delayedCall(100, () => {
                    boss.clearTint();
                    boss.slowed = false;
                });
                
                if (tickCount === 0) {
                    console.log(`☠️ Poison Cloud damage per tick: ${Math.floor(tickDamage)} (multiplier: ${this.player.damageMultiplier.toFixed(1)}x)`);
                }
            }
            
            tickCount++;
        }, charged.tickRate);
    }
}