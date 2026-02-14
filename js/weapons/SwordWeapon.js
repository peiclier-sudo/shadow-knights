// SwordWeapon.js - Sword weapon implementation
import { WeaponBase } from './WeaponBase.js';
import { WEAPONS } from './weaponData.js';

export class SwordWeapon extends WeaponBase {
    constructor(scene, player) {
        super(scene, player, WEAPONS.SWORD);
    }
    
    executeChargedAttack(angle) {
        const charged = this.data.charged;
        
        // Whirlwind effect
        for (let i = 0; i < charged.hits; i++) {
            this.scene.time.delayedCall(i * 200, () => {
                // Create slash ring
                const ring = this.scene.add.circle(
                    this.player.x,
                    this.player.y,
                    charged.radius,
                    0xffaa00,
                    0.5
                );
                ring.setStrokeStyle(4, 0xff6600);
                
                this.scene.tweens.add({
                    targets: ring,
                    alpha: 0,
                    scale: 1.3,
                    duration: 200,
                    onComplete: () => ring.destroy()
                });
                
                // Damage boss if in range
                const boss = this.scene.boss;
                if (boss) {
                    const dist = Phaser.Math.Distance.Between(
                        this.player.x, this.player.y,
                        boss.x, boss.y
                    );
                    
                    if (dist < charged.radius) {
                        boss.takeDamage(charged.damage / charged.hits);
                        
                        // Knockback
                        const angle = Math.atan2(
                            boss.y - this.player.y,
                            boss.x - this.player.x
                        );
                        
                        this.scene.tweens.add({
                            targets: boss,
                            x: boss.x + Math.cos(angle) * 50,
                            y: boss.y + Math.sin(angle) * 50,
                            duration: 150,
                            ease: 'Power2'
                        });
                    }
                }
            });
        }
        
        // Screen shake
        this.scene.cameras.main.shake(200, 0.01);
    }
}