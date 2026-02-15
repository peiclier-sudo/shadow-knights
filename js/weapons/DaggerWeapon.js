// DaggerWeapon.js - Dagues avec tir en éventail et nuage de poison
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
        
        const cloudX = this.scene.worldMouseX;
        const cloudY = this.scene.worldMouseY;
        
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
                boss.takeDamage(charged.damage / charged.ticks);
                boss.setTint(0x88aa88);
                
                if (charged.slow) {
                    boss.slowed = true;
                }
                
                this.scene.time.delayedCall(100, () => {
                    boss.clearTint();
                    boss.slowed = false;
                });
            }
            
            tickCount++;
        }, charged.tickRate);
    }
}