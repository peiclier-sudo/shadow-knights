// BowWeapon.js - Arc avec flèches et pluie de flèches (FIXED - damage multiplier)
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
    
    // Charged attack - Cataclysm Rain (heavier charge, guaranteed area damage)
    executeChargedAttack(angle) {
        const charged = this.data.charged;

        const targetPoint = this.getClampedChargedTarget(this.scene.worldMouseX, this.scene.worldMouseY);
        const centerX = targetPoint.x;
        const centerY = targetPoint.y;

        const waves = 6;
        const perWaveDamage = (charged.damage / waves) * (this.player.damageMultiplier || 1.0);

        for (let wave = 0; wave < waves; wave++) {
            this.scene.time.delayedCall(wave * 180, () => {
                // Visual rainfall per wave
                for (let i = 0; i < Math.ceil(charged.arrows / waves); i++) {
                    const x = centerX + (Math.random() - 0.5) * charged.radius * 2;
                    const y = centerY + (Math.random() - 0.5) * charged.radius * 2;
                    const arrow = this.scene.add.rectangle(x, y - 70, 4, 18, 0x88dd88).setDepth(155);

                    this.scene.tweens.add({
                        targets: arrow,
                        y,
                        duration: 220,
                        onComplete: () => arrow.destroy()
                    });
                }

                const impactRing = this.scene.add.circle(centerX, centerY, charged.radius, 0x88dd88, 0.1);
                impactRing.setDepth(120);
                this.scene.tweens.add({
                    targets: impactRing,
                    alpha: 0,
                    scale: 1.08,
                    duration: 180,
                    onComplete: () => impactRing.destroy()
                });

                const boss = this.scene.boss;
                if (!boss) return;

                const distToBoss = Phaser.Math.Distance.Between(centerX, centerY, boss.x, boss.y);
                if (distToBoss <= charged.radius) {
                    boss.takeDamage(perWaveDamage);
                    if (wave === 0) {
                        console.log(`🏹 Cataclysm Rain: ${Math.floor(perWaveDamage)} per wave x${waves}`);
                    }
                }
            });
        }
    }
}