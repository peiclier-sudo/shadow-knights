// BowWeapon.js - Bow weapon implementation
import { WeaponBase } from './WeaponBase.js';
import { WEAPONS } from './weaponData.js';

export class BowWeapon extends WeaponBase {
    constructor(scene, player) {
        super(scene, player, WEAPONS.BOW);
    }
    
    createProjectile(angle, data) {
        const proj = super.createProjectile(angle, data);
        
        // Arrow shape (rectangle)
        proj.destroy();
        
        const startX = this.player.x + Math.cos(angle) * 30;
        const startY = this.player.y + Math.sin(angle) * 30;
        
        const arrow = this.scene.add.rectangle(startX, startY, data.size * 2, data.size, data.color);
        arrow.setDepth(150);
        arrow.vx = Math.cos(angle) * data.speed;
        arrow.vy = Math.sin(angle) * data.speed;
        arrow.damage = data.damage;
        arrow.rotation = angle;
        
        this.scene.projectiles.push(arrow);
        return arrow;
    }
    
    executeChargedAttack(angle) {
        const charged = this.data.charged;
        
        // Rain of arrows
        for (let i = 0; i < charged.arrows; i++) {
            this.scene.time.delayedCall(i * 100, () => {
                const boss = this.scene.boss;
                if (!boss) return;
                
                const offsetX = (Math.random() - 0.5) * charged.radius * 2;
                const offsetY = (Math.random() - 0.5) * charged.radius * 2;
                const targetX = boss.x + offsetX;
                const targetY = boss.y + offsetY;
                
                // Arrow falling from top
                const arrow = this.scene.add.rectangle(targetX, -50, 4, 20, 0x88dd88);
                arrow.setDepth(150);
                
                this.scene.tweens.add({
                    targets: arrow,
                    y: targetY,
                    duration: 300,
                    ease: 'Bounce.easeOut',
                    onComplete: () => {
                        // Check if hit boss
                        const dist = Phaser.Math.Distance.Between(targetX, targetY, boss.x, boss.y);
                        if (dist < 40) {
                            boss.takeDamage(charged.damage);
                            
                            // Hit effect
                            const hit = this.scene.add.circle(targetX, targetY, 10, 0x88dd88, 0.6);
                            this.scene.tweens.add({
                                targets: hit,
                                alpha: 0,
                                scale: 1.5,
                                duration: 200,
                                onComplete: () => hit.destroy()
                            });
                        }
                        
                        arrow.destroy();
                    }
                });
            });
        }
    }
}