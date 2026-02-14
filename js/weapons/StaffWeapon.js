// StaffWeapon.js - Staff weapon implementation
import { WeaponBase } from './WeaponBase.js';
import { WEAPONS } from './weaponData.js';

export class StaffWeapon extends WeaponBase {
    constructor(scene, player) {
        super(scene, player, WEAPONS.STAFF);
    }
    
    createProjectile(angle, data) {
        const proj = super.createProjectile(angle, data);
        
        // Add homing behavior
        proj.update = () => {
            const boss = this.scene.boss;
            if (!boss) return;
            
            const dx = boss.x - proj.x;
            const dy = boss.y - proj.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 300) {
                // Homing strength
                const homing = 0.05;
                proj.vx += dx * homing;
                proj.vy += dy * homing;
                
                // Normalize speed
                const speed = Math.sqrt(proj.vx * proj.vx + proj.vy * proj.vy);
                proj.vx = (proj.vx / speed) * data.speed;
                proj.vy = (proj.vy / speed) * data.speed;
            }
        };
        
        return proj;
    }
    
    executeChargedAttack(angle) {
        const charged = this.data.charged;
        const boss = this.scene.boss;
        
        if (!boss) return;
        
        // Create fireball
        const fireball = this.scene.add.circle(
            this.player.x + Math.cos(angle) * 40,
            this.player.y + Math.sin(angle) * 40,
            20,
            0xff6600
        );
        
        // Add glow
        const glow = this.scene.add.circle(
            fireball.x, fireball.y,
            35,
            0xff6600,
            0.4
        );
        
        // Animate fireball to boss
        this.scene.tweens.add({
            targets: [fireball, glow],
            x: boss.x,
            y: boss.y,
            duration: 400,
            ease: 'Power2',
            onUpdate: () => {
                glow.x = fireball.x;
                glow.y = fireball.y;
            },
            onComplete: () => {
                // Explosion
                const explosion = this.scene.add.circle(
                    boss.x,
                    boss.y,
                    charged.radius,
                    0xff6600,
                    0.7
                );
                
                // Damage boss
                boss.takeDamage(charged.damage);
                
                // Explosion particles
                for (let i = 0; i < 12; i++) {
                    const particleAngle = (i / 12) * Math.PI * 2;
                    const particle = this.scene.add.circle(
                        boss.x,
                        boss.y,
                        5 + Math.random() * 5,
                        0xff6600,
                        0.6
                    );
                    
                    this.scene.tweens.add({
                        targets: particle,
                        x: boss.x + Math.cos(particleAngle) * 100,
                        y: boss.y + Math.sin(particleAngle) * 100,
                        alpha: 0,
                        duration: 300,
                        onComplete: () => particle.destroy()
                    });
                }
                
                // Fade explosion
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
                
                // Screen shake
                this.scene.cameras.main.shake(150, 0.01);
            }
        });
    }
}