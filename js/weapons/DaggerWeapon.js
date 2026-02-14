// DaggerWeapon.js - Dagger weapon implementation
import { WeaponBase } from './WeaponBase.js';
import { WEAPONS } from './weaponData.js';

export class DaggerWeapon extends WeaponBase {
    constructor(scene, player) {
        super(scene, player, WEAPONS.DAGGERS);
    }
    
    executeChargedAttack(angle) {
        const charged = this.data.charged;
        const boss = this.scene.boss;
        
        if (!boss) return;
        
        // Poison cloud at boss location
        const cloud = this.scene.add.circle(boss.x, boss.y, charged.radius, 0x88aa88, 0.3);
        
        // Add poison particles
        for (let i = 0; i < 20; i++) {
            const particleAngle = Math.random() * Math.PI * 2;
            const distance = Math.random() * charged.radius;
            const particle = this.scene.add.circle(
                boss.x + Math.cos(particleAngle) * distance,
                boss.y + Math.sin(particleAngle) * distance,
                5 + Math.random() * 10,
                0x88aa88,
                0.4
            );
            cloud.add(particle);
        }
        
        // Poison ticks
        let tickCount = 0;
        const tickInterval = setInterval(() => {
            if (!boss.scene || tickCount >= charged.ticks) {
                clearInterval(tickInterval);
                return;
            }
            
            boss.takeDamage(charged.damage);
            
            // Poison effect on boss
            boss.setTint(0x88aa88);
            this.scene.time.delayedCall(100, () => boss.clearTint());
            
            // Poison text
            const poisonText = this.scene.add.text(boss.x, boss.y - 30, 'POISON', {
                fontSize: '16px',
                fill: '#88aa88',
                stroke: '#000',
                strokeThickness: 2
            }).setOrigin(0.5);
            
            this.scene.tweens.add({
                targets: poisonText,
                y: boss.y - 60,
                alpha: 0,
                duration: 500,
                onComplete: () => poisonText.destroy()
            });
            
            tickCount++;
        }, 500);
        
        // Cloud disappears after duration
        this.scene.time.delayedCall(3000, () => {
            clearInterval(tickInterval);
            this.scene.tweens.add({
                targets: cloud,
                alpha: 0,
                duration: 500,
                onComplete: () => cloud.destroy()
            });
        });
    }
}