// StaffWeapon.js - Bâton avec orbes et boule de feu (FIXED - damage multiplier)
import { WeaponBase } from './WeaponBase.js';
import { WEAPONS } from './weaponData.js';

export class StaffWeapon extends WeaponBase {
    constructor(scene, player) {
        super(scene, player, WEAPONS.STAFF);
    }
    
    // Tir normal - Orbe téléguidé
    fire(angle) {
        const data = this.data.projectile;
        const startX = this.player.x + Math.cos(angle) * 30;
        const startY = this.player.y + Math.sin(angle) * 30;
        
        this.createMuzzleFlash(startX, startY, this.data.color);
        
        const hasFirestaffSprite = this.scene.textures.exists('firestaff');

        // Créer l'orbe (spritesheet when available, star fallback otherwise)
        const orb = hasFirestaffSprite
            ? this.scene.add.sprite(startX, startY, 'firestaff', 5)
                .setScale(0.35)
                .setBlendMode(Phaser.BlendModes.ADD)
            : this.scene.add.star(startX, startY, 5, data.size * 0.7, data.size, data.color);
        orb.setDepth(150);

        if (hasFirestaffSprite) {
            if (this.scene.anims.exists('fire-comet')) {
                orb.play('fire-comet');
            } else if (this.scene.anims.exists('fireball-grow')) {
                orb.play('fireball-grow');
            }
        }
        
        orb.vx = Math.cos(angle) * data.speed;
        orb.vy = Math.sin(angle) * data.speed;
        orb.damage = data.damage;
        orb.range = data.range;
        orb.startX = startX;
        orb.startY = startY;
        
        // Comportement de homing
        orb.update = () => {
            if (hasFirestaffSprite) {
                orb.rotation = Math.atan2(orb.vy, orb.vx);
            }
            const boss = this.scene.boss;
            if (!boss) return;
            
            const dx = boss.x - orb.x;
            const dy = boss.y - orb.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 300) {
                orb.vx += dx * 0.03;
                orb.vy += dy * 0.03;
                
                const speed = Math.sqrt(orb.vx * orb.vx + orb.vy * orb.vy);
                orb.vx = (orb.vx / speed) * data.speed;
                orb.vy = (orb.vy / speed) * data.speed;
            }
        };
        
        this.scene.projectiles.push(orb);
        this.addTrail(orb, data.color, data.size);
    }
    
    // Attaque chargée - Boule de feu (directionnelle)
    executeChargedAttack(angle) {
        const charged = this.data.charged;
        
        const startX = this.player.x + Math.cos(angle) * 40;
        const startY = this.player.y + Math.sin(angle) * 40;
        
        const hasFirestaffSprite = this.scene.textures.exists('firestaff');
        const fireball = hasFirestaffSprite
            ? this.scene.add.sprite(startX, startY, 'firestaff', 0)
                .setScale(0.5)
                .setBlendMode(Phaser.BlendModes.ADD)
            : this.scene.add.circle(startX, startY, 20, 0xff6600);
        const glow = this.scene.add.circle(startX, startY, 35, 0xff6600, 0.4);

        if (hasFirestaffSprite) {
            fireball.rotation = angle;

            if (this.scene.anims.exists('fireball-grow')) {
                fireball.play('fireball-grow');
                fireball.once('animationcomplete-fireball-grow', () => {
                    if (fireball.active && this.scene.anims.exists('fire-comet')) {
                        fireball.play('fire-comet');
                    }
                });
            } else if (this.scene.anims.exists('fire-comet')) {
                fireball.play('fire-comet');
            }
        }
        
        const targetPoint = this.getClampedChargedTarget(
            this.player.x + Math.cos(angle) * this.data.charged.maxRange,
            this.player.y + Math.sin(angle) * this.data.charged.maxRange
        );
        const targetX = targetPoint.x;
        const targetY = targetPoint.y;
        
        let exploded = false;

        const explodeAt = (x, y) => {
            if (exploded) return;
            exploded = true;

            const explosion = this.scene.add.circle(x, y, charged.radius, 0xff6600, 0.7);

            const boss = this.scene.boss;
            if (boss) {
                const distToExplosion = Phaser.Math.Distance.Between(x, y, boss.x, boss.y);
                if (distToExplosion < charged.radius) {
                    const finalDamage = charged.damage * (this.player.damageMultiplier || 1.0);
                    boss.takeDamage(finalDamage);

                    if (charged.dotDamage) {
                        let tickCount = 0;
                        const dotInterval = setInterval(() => {
                            if (!boss.scene || tickCount >= charged.dotTicks) {
                                clearInterval(dotInterval);
                                return;
                            }

                            const dotDamage = charged.dotDamage * (this.player.damageMultiplier || 1.0);
                            boss.takeDamage(dotDamage);
                            boss.setTint(0xff6600);
                            this.scene.time.delayedCall(100, () => boss.clearTint());
                            tickCount++;
                        }, charged.dotInterval);
                    }
                }
            }

            for (let i = 0; i < 12; i++) {
                const particleAngle = (i / 12) * Math.PI * 2;
                const particle = this.scene.add.circle(
                    x, y,
                    5 + Math.random() * 5,
                    0xff6600,
                    0.6
                );

                this.scene.tweens.add({
                    targets: particle,
                    x: x + Math.cos(particleAngle) * 100,
                    y: y + Math.sin(particleAngle) * 100,
                    alpha: 0,
                    duration: 300,
                    onComplete: () => particle.destroy()
                });
            }

            if (hasFirestaffSprite && this.scene.anims.exists('fire-explode')) {
                fireball.play('fire-explode');
                fireball.once('animationcomplete-fire-explode', () => {
                    if (fireball.active) {
                        fireball.destroy();
                    }
                });
            } else if (fireball.active) {
                fireball.destroy();
            }

            this.scene.tweens.add({
                targets: [explosion, glow],
                alpha: 0,
                scale: 1.5,
                duration: 300,
                onComplete: () => {
                    explosion.destroy();
                    glow.destroy();

                    if (!hasFirestaffSprite && fireball.active) {
                        fireball.destroy();
                    }
                }
            });

            this.scene.cameras.main.shake(170, 0.012);
        };

        const travelTween = this.scene.tweens.add({
            targets: [fireball, glow],
            x: targetX,
            y: targetY,
            duration: 420,
            ease: 'Power2',
            onUpdate: () => {
                glow.x = fireball.x;
                glow.y = fireball.y;

                if (hasFirestaffSprite) {
                    fireball.rotation = Phaser.Math.Angle.Between(
                        fireball.x,
                        fireball.y,
                        targetX,
                        targetY
                    );
                }

                const boss = this.scene.boss;
                if (!boss || exploded) return;

                const distToBoss = Phaser.Math.Distance.Between(fireball.x, fireball.y, boss.x, boss.y);
                if (distToBoss <= 52) {
                    // Stop on contact and glue shortly to the boss before exploding.
                    travelTween.stop();
                    const stickTime = 140;

                    fireball.setPosition(boss.x, boss.y);
                    glow.setPosition(boss.x, boss.y);

                    const followHandler = () => {
                        if (!boss.scene || exploded) return;
                        fireball.setPosition(boss.x, boss.y);
                        glow.setPosition(boss.x, boss.y);
                    };
                    this.scene.events.on('update', followHandler);

                    this.scene.time.delayedCall(stickTime, () => {
                        this.scene.events.off('update', followHandler);
                        explodeAt(boss.x, boss.y);
                    });
                }
            },
            onComplete: () => {
                explodeAt(targetX, targetY);
            }
        });
    }
}
