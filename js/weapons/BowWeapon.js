// BowWeapon.js - Arc avec flèches et pluie de flèches
import { WeaponBase } from './WeaponBase.js';
import { WEAPONS } from './weaponData.js';

export class BowWeapon extends WeaponBase {
    constructor(scene, player) {
        super(scene, player, WEAPONS.BOW);
    }
    
    // Tir normal - Flèche
    fire(angle) {
        const data = this.data.projectile;
        const startX = this.player.x + Math.cos(angle) * 30;
        const startY = this.player.y + Math.sin(angle) * 30;
        
        this.createMuzzleFlash(startX, startY, this.data.color);
        
        // Créer la flèche
        const arrow = this.scene.add.container(startX, startY);
        const shaft = this.scene.add.rectangle(0, 0, data.size * 2, data.size * 0.8, data.color);
        shaft.rotation = angle;
        const tip = this.scene.add.triangle(
            data.size, 0,
            0, -3,
            0, 3,
            data.color
        );
        tip.rotation = angle;
        arrow.add([shaft, tip]);
        arrow.setDepth(150);
        
        arrow.vx = Math.cos(angle) * data.speed;
        arrow.vy = Math.sin(angle) * data.speed;
        arrow.damage = data.damage;
        arrow.range = data.range;
        arrow.startX = startX;
        arrow.startY = startY;
        
        this.scene.projectiles.push(arrow);
        this.addTrail(arrow, data.color, data.size);
    }
    
    // Attaque chargée - Pluie de flèches (directionnelle)
    executeChargedAttack(angle) {
        const charged = this.data.charged;
        
        // Utiliser la position de la souris comme centre
        const centerX = this.scene.worldMouseX;
        const centerY = this.scene.worldMouseY;
        
        for (let i = 0; i < charged.arrows; i++) {
            this.scene.time.delayedCall(i * 100, () => {
                const x = centerX + (Math.random() - 0.5) * charged.radius * 2;
                const y = centerY + (Math.random() - 0.5) * charged.radius * 2;
                
                const arrow = this.scene.add.rectangle(x, y - 50, 4, 15, 0x88dd88);
                
                this.scene.tweens.add({
                    targets: arrow,
                    y: y,
                    duration: 200,
                    onComplete: () => {
                        const boss = this.scene.boss;
                        if (boss) {
                            const distToBoss = Phaser.Math.Distance.Between(x, y, boss.x, boss.y);
                            if (distToBoss < 30) {
                                boss.takeDamage(charged.damage / charged.arrows);
                            }
                        }
                        arrow.destroy();
                    }
                });
            });
        }
    }
}