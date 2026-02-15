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
        wave.heavyKnockback = true;
        
        this.scene.projectiles.push(wave);
        this.addTrail(wave, data.color, data.size);
    }
    
    // Charged attack - Colossus Breaker (directional meta finisher)
    executeChargedAttack(angle) {
        const charged = this.data.charged;

        const targetPoint = this.getClampedChargedTarget(
            this.player.x + Math.cos(angle) * charged.maxRange,
            this.player.y + Math.sin(angle) * charged.maxRange
        );

        const slash = this.scene.add.rectangle(this.player.x, this.player.y, charged.maxRange, charged.radius * 2, 0xffaa55, 0.2);
        slash.setRotation(angle);
        slash.setDepth(145);

        this.scene.tweens.add({
            targets: slash,
            alpha: 0,
            duration: 220,
            onComplete: () => slash.destroy()
        });

        this.scene.tweens.add({
            targets: this.player,
            x: targetPoint.x,
            y: targetPoint.y,
            duration: 180,
            ease: 'Power2'
        });

        this.scene.cameras.main.shake(220, 0.012);

        const boss = this.scene.boss;
        if (boss) {
            const distToPath = Phaser.Math.Distance.BetweenPoints(
                { x: boss.x, y: boss.y },
                Phaser.Geom.Line.GetNearestPoint(new Phaser.Geom.Line(this.player.x, this.player.y, targetPoint.x, targetPoint.y), { x: boss.x, y: boss.y })
            );

            if (distToPath <= charged.radius) {
                const finalDamage = charged.damage * (this.player.damageMultiplier || 1.0);
                boss.takeDamage(finalDamage);

                if (charged.stun) {
                    boss.stunned = true;
                    boss.setTint(0xffc266);
                    this.scene.time.delayedCall(charged.stunDuration, () => {
                        if (!boss.scene) return;
                        boss.stunned = false;
                        boss.clearTint();
                    });
                }

                // Big knockback from the slash direction
                const push = 140;
                this.scene.tweens.add({
                    targets: boss,
                    x: boss.x + Math.cos(angle) * push,
                    y: boss.y + Math.sin(angle) * push,
                    duration: 180,
                    ease: 'Power2'
                });
            }
        }
    }
}