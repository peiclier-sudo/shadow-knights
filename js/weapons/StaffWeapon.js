// StaffWeapon.js - Staff with animated fire orbs and sticky fireball
import { WeaponBase } from './WeaponBase.js';
import { WEAPONS } from './weaponData.js';

export class StaffWeapon extends WeaponBase {
    constructor(scene, player) {
        super(scene, player, WEAPONS.STAFF);
        this.ensureFireTextures();
    }

    ensureFireTextures() {
        const frameCount = 8;
        for (let i = 0; i < frameCount; i++) {
            const key = `staff_fireball_${i}`;
            if (this.scene.textures.exists(key)) continue;

            const g = this.scene.add.graphics();
            const wobble = Math.sin((i / frameCount) * Math.PI * 2) * 4;

            // Outer flame
            g.fillStyle(0xff7a1a, 0.95);
            g.beginPath();
            g.moveTo(8 + wobble, 24);
            g.quadraticCurveTo(16, 8 + wobble, 38, 16);
            g.quadraticCurveTo(54, 23, 45, 33);
            g.quadraticCurveTo(30, 45, 12 + wobble, 35);
            g.quadraticCurveTo(2, 30, 8 + wobble, 24);
            g.closePath();
            g.fillPath();

            // Mid flame
            g.fillStyle(0xffb733, 0.95);
            g.beginPath();
            g.moveTo(16 + wobble * 0.5, 24);
            g.quadraticCurveTo(22, 13, 36, 19);
            g.quadraticCurveTo(47, 25, 40, 32);
            g.quadraticCurveTo(28, 40, 17 + wobble * 0.5, 33);
            g.quadraticCurveTo(11, 29, 16 + wobble * 0.5, 24);
            g.closePath();
            g.fillPath();

            // Core glow
            g.fillStyle(0xffef88, 0.95);
            g.fillEllipse(30, 25, 18, 12);

            g.generateTexture(key, 56, 48);
            g.destroy();
        }
    }

    // Basic attack - homing animated fire orb
    fire(angle) {
        const data = this.data.projectile;
        const startX = this.player.x + Math.cos(angle) * 30;
        const startY = this.player.y + Math.sin(angle) * 30;

        this.createMuzzleFlash(startX, startY, 0xff7a1a);

        const orb = this.scene.add.image(startX, startY, 'staff_fireball_0');
        orb.setDepth(150);
        orb.setScale(0.78);
        orb.setRotation(angle);

        const glow = this.scene.add.circle(startX, startY, 20, 0xff7a1a, 0.22).setDepth(149);
        orb.glow = glow;

        orb.vx = Math.cos(angle) * data.speed;
        orb.vy = Math.sin(angle) * data.speed;
        orb.damage = data.damage;
        orb.range = data.range;
        orb.startX = startX;
        orb.startY = startY;
        orb.piercing = data.piercing;
        orb.hasHit = false;
        orb.animElapsed = 0;

        orb.update = (dt = 16) => {
            const boss = this.scene.boss;
            if (boss) {
                const dx = boss.x - orb.x;
                const dy = boss.y - orb.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 300) {
                    orb.vx += dx * 0.03;
                    orb.vy += dy * 0.03;

                    const speed = Math.sqrt(orb.vx * orb.vx + orb.vy * orb.vy) || 1;
                    orb.vx = (orb.vx / speed) * data.speed;
                    orb.vy = (orb.vy / speed) * data.speed;
                }
            }

            const travelAngle = Math.atan2(orb.vy, orb.vx);
            orb.rotation = travelAngle;
            orb.animElapsed += dt;
            const frame = Math.floor(orb.animElapsed / 45) % 8;
            orb.setTexture(`staff_fireball_${frame}`);

            if (orb.glow?.scene) {
                orb.glow.setPosition(orb.x, orb.y);
                orb.glow.alpha = 0.18 + Math.sin(orb.animElapsed * 0.02) * 0.06;
            }
        };

        const originalDestroy = orb.destroy.bind(orb);
        orb.destroy = (...args) => {
            if (orb.glow?.scene) orb.glow.destroy();
            originalDestroy(...args);
        };

        this.scene.projectiles.push(orb);
        this.addTrail(orb, 0xff7a1a, 10);
    }

    // Charged attack - sticky inferno fireball
    executeChargedAttack(angle) {
        const charged = this.data.charged;

        const startX = this.player.x + Math.cos(angle) * 40;
        const startY = this.player.y + Math.sin(angle) * 40;

        const fireball = this.scene.add.image(startX, startY, 'staff_fireball_0').setScale(1.5).setDepth(170);
        const glow = this.scene.add.circle(startX, startY, 36, 0xff6600, 0.45).setDepth(169);

        const targetPoint = this.getClampedChargedTarget(
            this.player.x + Math.cos(angle) * this.data.charged.maxRange,
            this.player.y + Math.sin(angle) * this.data.charged.maxRange
        );
        const targetX = targetPoint.x;
        const targetY = targetPoint.y;

        let exploded = false;
        let animElapsed = 0;

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
                        const dotTimer = this.scene.time.addEvent({
                            delay: charged.dotInterval,
                            repeat: charged.dotTicks - 1,
                            callback: () => {
                                if (!boss.scene || tickCount >= charged.dotTicks) return;
                                const dotDamage = charged.dotDamage * (this.player.damageMultiplier || 1.0);
                                boss.takeDamage(dotDamage);
                                boss.setTint(0xff6600);
                                this.scene.time.delayedCall(100, () => boss.clearTint());
                                tickCount++;
                            }
                        });
                        if (!dotTimer) return;
                    }
                }
            }

            for (let i = 0; i < 14; i++) {
                const particleAngle = (i / 14) * Math.PI * 2;
                const particle = this.scene.add.circle(x, y, 5 + Math.random() * 5, 0xff7a1a, 0.7);
                this.scene.tweens.add({
                    targets: particle,
                    x: x + Math.cos(particleAngle) * 110,
                    y: y + Math.sin(particleAngle) * 110,
                    alpha: 0,
                    duration: 320,
                    onComplete: () => particle.destroy()
                });
            }

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

            this.scene.cameras.main.shake(170, 0.012);
        };

        const travelTween = this.scene.tweens.add({
            targets: [fireball, glow],
            x: targetX,
            y: targetY,
            duration: 420,
            ease: 'Power2',
            onUpdate: (_, target) => {
                animElapsed += 16;
                fireball.setTexture(`staff_fireball_${Math.floor(animElapsed / 40) % 8}`);
                fireball.setRotation(Math.atan2(targetY - fireball.y, targetX - fireball.x));
                glow.x = fireball.x;
                glow.y = fireball.y;

                const boss = this.scene.boss;
                if (!boss || exploded) return;

                const distToBoss = Phaser.Math.Distance.Between(fireball.x, fireball.y, boss.x, boss.y);
                if (distToBoss <= 52) {
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
