// StaffWeapon.js - Staff with animated fire orbs and sticky fireball
import { WeaponBase } from './WeaponBase.js';
import { WEAPONS } from './weaponData.js';

export class StaffWeapon extends WeaponBase {
    constructor(scene, player) {
        super(scene, player, WEAPONS.STAFF);
        this.fireFrameCount = 12;
        this.ensureFireTextures();
    }

    ensureFireTextures() {
        const frameCount = this.fireFrameCount || 12;
        for (let i = 0; i < frameCount; i++) {
            const key = `staff_fireball_${i}`;
            if (this.scene.textures.exists(key)) continue;

            const g = this.scene.add.graphics();
            const phase = (i / frameCount) * Math.PI * 2;
            const pulse = (Math.sin(phase) + 1) * 0.5;
            const sway = Math.sin(phase * 1.4) * 3.5;
            const flick = Math.cos(phase * 2.1) * 2.4;

            const cx = 38 + sway * 0.5;
            const cy = 32 + flick * 0.2;

            // Soft aura backdrop
            g.fillStyle(0xff5a00, 0.2 + pulse * 0.14);
            g.fillEllipse(cx, cy, 56 + pulse * 8, 34 + pulse * 4);

            // Flame tail layers (back to front)
            g.fillStyle(0xff6412, 0.92);
            g.fillTriangle(6 + sway, cy, 28, cy - 14 - pulse * 2, 28, cy + 14 + pulse * 2);
            g.fillTriangle(14 + sway * 0.7, cy - 2, 30, cy - 10, 30, cy + 8);

            g.fillStyle(0xff8a1a, 0.96);
            g.fillEllipse(cx, cy, 42 + pulse * 4, 25 + pulse * 2);

            // Middle hot layer
            g.fillStyle(0xffb733, 0.96);
            g.fillEllipse(cx + 2, cy, 30 + pulse * 3, 18 + pulse * 1.5);

            // Bright inner core
            g.fillStyle(0xffef88, 0.97);
            g.fillEllipse(cx + 5, cy - 1, 19 + pulse * 2, 11 + pulse);

            // White-hot nucleus flicker
            g.fillStyle(0xfff9d6, 0.78 + pulse * 0.16);
            g.fillEllipse(cx + 9, cy - 1, 8 + pulse * 1.4, 5 + pulse * 0.8);

            // Edge tongues for higher detail
            g.fillStyle(0xffa526, 0.78);
            g.fillTriangle(cx - 2, cy - 11, cx + 8, cy - 7, cx + 2, cy - 2);
            g.fillTriangle(cx - 1, cy + 10, cx + 8, cy + 6, cx + 1, cy + 2);

            // Small embers around tail/head
            g.fillStyle(0xffc06d, 0.62);
            g.fillEllipse(12 + sway * 0.8, cy - 7, 4, 2);
            g.fillEllipse(10 + sway * 0.6, cy + 6, 3.5, 2);
            g.fillEllipse(cx + 20 + pulse * 2, cy - 3, 2.7, 1.8);

            g.generateTexture(key, 72, 64);
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
        orb.setScale(0.68);
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
            const frame = Math.floor(orb.animElapsed / 42) % this.fireFrameCount;
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

        const fireball = this.scene.add.image(startX, startY, 'staff_fireball_0').setScale(1.22).setDepth(170);
        const glow = this.scene.add.circle(startX, startY, 38, 0xff6600, 0.42).setDepth(169);
        const core = this.scene.add.circle(startX, startY, 18, 0xffef88, 0.36).setDepth(171);
        const ringOuter = this.scene.add.circle(startX, startY, 30, 0xffa43a, 0).setStrokeStyle(3, 0xffc780, 0.75).setDepth(168);
        const ringInner = this.scene.add.circle(startX, startY, 22, 0xffef88, 0).setStrokeStyle(2, 0xffef88, 0.55).setDepth(168);

        this.scene.tweens.add({
            targets: [glow, core],
            scale: { from: 0.96, to: 1.1 },
            alpha: { from: 0.38, to: 0.6 },
            duration: 160,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.scene.tweens.add({
            targets: [ringOuter, ringInner],
            scale: { from: 0.9, to: 1.14 },
            alpha: { from: 0.3, to: 0.65 },
            angle: 40,
            duration: 220,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        const targetPoint = this.getClampedChargedTarget(
            this.player.x + Math.cos(angle) * this.data.charged.maxRange,
            this.player.y + Math.sin(angle) * this.data.charged.maxRange
        );
        const targetX = targetPoint.x;
        const targetY = targetPoint.y;

        let exploded = false;
        let animElapsed = 0;

        const cleanupCoreFx = () => {
            [glow, core, ringOuter, ringInner, fireball].forEach((obj) => {
                if (obj?.scene) obj.destroy();
            });
        };

        const explodeAt = (x, y) => {
            if (exploded) return;
            exploded = true;

            const explosionCore = this.scene.add.circle(x, y, charged.radius * 0.82, 0xff6600, 0.75).setDepth(172);
            const explosionHot = this.scene.add.circle(x, y, charged.radius * 0.55, 0xffef88, 0.45).setDepth(173);
            const explosionRing = this.scene.add.circle(x, y, charged.radius * 0.35, 0xff6600, 0)
                .setStrokeStyle(4, 0xffd39b, 0.95)
                .setDepth(174);

            const boss = this.scene.boss;
            if (boss) {
                const distToExplosion = Phaser.Math.Distance.Between(x, y, boss.x, boss.y);
                if (distToExplosion < charged.radius) {
                    const finalDamage = charged.damage * (this.player.damageMultiplier || 1.0);
                    boss.takeDamage(finalDamage);

                    if (charged.dotDamage) {
                        let tickCount = 0;
                        this.scene.time.addEvent({
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
                    }
                }
            }

            // Radial blast petals
            for (let i = 0; i < 18; i++) {
                const particleAngle = (i / 18) * Math.PI * 2;
                const particle = this.scene.add.circle(x, y, 4 + Math.random() * 6, 0xff8a1a, 0.78).setDepth(175);
                this.scene.tweens.add({
                    targets: particle,
                    x: x + Math.cos(particleAngle) * (100 + Math.random() * 36),
                    y: y + Math.sin(particleAngle) * (100 + Math.random() * 36),
                    alpha: 0,
                    scale: 0.25,
                    duration: 360,
                    ease: 'Cubic.easeOut',
                    onComplete: () => particle.destroy()
                });
            }

            // Spiral embers for richer look
            for (let i = 0; i < 10; i++) {
                const ember = this.scene.add.circle(x, y, Phaser.Math.FloatBetween(2, 3.8), 0xffef88, 0.92).setDepth(176);
                const baseAngle = Math.random() * Math.PI * 2;
                this.scene.tweens.addCounter({
                    from: 0,
                    to: 1,
                    duration: Phaser.Math.Between(320, 460),
                    onUpdate: (tw) => {
                        const t = tw.getValue();
                        const radius = 14 + t * Phaser.Math.Between(40, 88);
                        const a = baseAngle + t * 4.2;
                        ember.x = x + Math.cos(a) * radius;
                        ember.y = y + Math.sin(a) * radius;
                        ember.alpha = 0.95 - t;
                    },
                    onComplete: () => ember.destroy()
                });
            }

            this.scene.tweens.add({
                targets: [explosionCore, explosionHot],
                alpha: 0,
                scale: 1.55,
                duration: 320,
                ease: 'Cubic.easeOut',
                onComplete: () => {
                    explosionCore.destroy();
                    explosionHot.destroy();
                }
            });

            this.scene.tweens.add({
                targets: explosionRing,
                alpha: 0,
                scale: 2.2,
                duration: 360,
                ease: 'Expo.easeOut',
                onComplete: () => explosionRing.destroy()
            });

            // Fade out traveling projectile FX
            this.scene.tweens.add({
                targets: [fireball, glow, core, ringOuter, ringInner],
                alpha: 0,
                scale: 1.45,
                duration: 220,
                onComplete: cleanupCoreFx
            });

            this.scene.cameras.main.shake(190, 0.013);
        };

        const travelTween = this.scene.tweens.add({
            targets: [fireball, glow, core, ringOuter, ringInner],
            x: targetX,
            y: targetY,
            duration: 460,
            ease: 'Cubic.easeOut',
            onUpdate: () => {
                animElapsed += 16;

                // Animate fire sprite and orient by velocity direction
                fireball.setTexture(`staff_fireball_${Math.floor(animElapsed / 34) % this.fireFrameCount}`);
                fireball.setRotation(Math.atan2(targetY - fireball.y, targetX - fireball.x));

                // Growth over travel for a stronger charged feel
                const travelDist = Phaser.Math.Distance.Between(startX, startY, targetX, targetY) || 1;
                const traveled = Phaser.Math.Distance.Between(startX, startY, fireball.x, fireball.y);
                const progress = Phaser.Math.Clamp(traveled / travelDist, 0, 1);
                fireball.setScale(1.22 + progress * 0.78);
                glow.setRadius(38 + progress * 20);
                ringOuter.setRadius(30 + progress * 10);
                ringInner.setRadius(22 + progress * 8);

                // Rotating rings and subtle offset for lively look
                ringOuter.rotation += 0.12;
                ringInner.rotation -= 0.18;
                core.x = fireball.x + Math.cos(animElapsed * 0.02) * 1.6;
                core.y = fireball.y + Math.sin(animElapsed * 0.02) * 1.6;

                // Trail embers during travel
                if (Math.random() > 0.55) {
                    const ember = this.scene.add.circle(fireball.x, fireball.y, Phaser.Math.FloatBetween(1.8, 3.2), 0xffc26b, 0.6).setDepth(167);
                    this.scene.tweens.add({
                        targets: ember,
                        x: ember.x - Math.cos(fireball.rotation) * Phaser.Math.Between(12, 26),
                        y: ember.y - Math.sin(fireball.rotation) * Phaser.Math.Between(12, 26),
                        alpha: 0,
                        scale: 0.35,
                        duration: Phaser.Math.Between(120, 180),
                        onComplete: () => ember.destroy()
                    });
                }

                const boss = this.scene.boss;
                if (!boss || exploded) return;

                const distToBoss = Phaser.Math.Distance.Between(fireball.x, fireball.y, boss.x, boss.y);
                if (distToBoss <= 52) {
                    travelTween.stop();
                    const stickTime = 180;

                    fireball.setPosition(boss.x, boss.y);
                    glow.setPosition(boss.x, boss.y);
                    core.setPosition(boss.x, boss.y);
                    ringOuter.setPosition(boss.x, boss.y);
                    ringInner.setPosition(boss.x, boss.y);

                    this.scene.tweens.add({
                        targets: [fireball, glow, core, ringOuter, ringInner],
                        scale: '+=0.22',
                        duration: 130,
                        yoyo: true,
                        ease: 'Sine.easeInOut'
                    });

                    const followHandler = () => {
                        if (!boss.scene || exploded) return;
                        [fireball, glow, core, ringOuter, ringInner].forEach((obj) => obj.setPosition(boss.x, boss.y));
                        ringOuter.rotation += 0.22;
                        ringInner.rotation -= 0.3;
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
