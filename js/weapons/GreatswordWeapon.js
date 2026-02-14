// GreatswordWeapon.js - Greatsword weapon implementation
import { WeaponBase } from './WeaponBase.js';
import { WEAPONS } from './weaponData.js';

export class GreatswordWeapon extends WeaponBase {
    constructor(scene, player) {
        super(scene, player, WEAPONS.GREATSWORD);
    }
    
    executeChargedAttack(angle) {
        const charged = this.data.charged;
        
        // Ground slam effect
        this.scene.cameras.main.shake(300, 0.02);
        
        // Shockwave ring
        const ring = this.scene.add.circle(
            this.player.x,
            this.player.y,
            20,
            0xcc6600,
            0.8
        );
        
        this.scene.tweens.add({
            targets: ring,
            radius: charged.radius,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => ring.destroy()
        });
        
        // Ground crack lines
        for (let i = 0; i < 8; i++) {
            const lineAngle = (i / 8) * Math.PI * 2;
            const line = this.scene.add.rectangle(
                this.player.x,
                this.player.y,
                5,
                charged.radius * 2,
                0xcc6600,
                0.5
            );
            line.setRotation(lineAngle);
            
            this.scene.tweens.add({
                targets: line,
                alpha: 0,
                scaleX: 1.5,
                duration: 400,
                onComplete: () => line.destroy()
            });
        }
        
        // Damage boss if in range
        const boss = this.scene.boss;
        if (boss) {
            const dist = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                boss.x, boss.y
            );
            
            if (dist < charged.radius) {
                boss.takeDamage(charged.damage);
                
                // Stun effect
                boss.setTint(0xcccccc);
                this.scene.time.delayedCall(1000, () => boss.clearTint());
                
                // Knockback
                const knockbackAngle = Math.atan2(
                    boss.y - this.player.y,
                    boss.x - this.player.x
                );
                
                this.scene.tweens.add({
                    targets: boss,
                    x: boss.x + Math.cos(knockbackAngle) * 100,
                    y: boss.y + Math.sin(knockbackAngle) * 100,
                    duration: 200,
                    ease: 'Power2'
                });
                
                // Stun indicator
                const stunText = this.scene.add.text(boss.x, boss.y - 50, 'STUNNED!', {
                    fontSize: '24px',
                    fill: '#ffff00',
                    stroke: '#000',
                    strokeThickness: 4
                }).setOrigin(0.5);
                
                this.scene.tweens.add({
                    targets: stunText,
                    y: boss.y - 100,
                    alpha: 0,
                    duration: 1000,
                    onComplete: () => stunText.destroy()
                });
            }
        }
        
        // Raise dust particles
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