// StaffWeapon.js - Staff with advanced procedural fire animations
import { WeaponBase } from './WeaponBase.js';
import { WEAPONS } from './weaponData.js';

export class StaffWeapon extends WeaponBase {
    constructor(scene, player) {
        super(scene, player, WEAPONS.STAFF);
        this.fireFrameCount = 12;
        this.chargedFrameCount = 18;
        this.ensureFireTextures();
        this.ensureChargedFireTextures();
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

            g.fillStyle(0xff5a00, 0.2 + pulse * 0.14);
            g.fillEllipse(cx, cy, 56 + pulse * 8, 34 + pulse * 4);

            g.fillStyle(0xff6412, 0.92);
            g.fillTriangle(6 + sway, cy, 28, cy - 14 - pulse * 2, 28, cy + 14 + pulse * 2);
            g.fillTriangle(14 + sway * 0.7, cy - 2, 30, cy - 10, 30, cy + 8);

            g.fillStyle(0xff8a1a, 0.96);
            g.fillEllipse(cx, cy, 42 + pulse * 4, 25 + pulse * 2);

            g.fillStyle(0xffb733, 0.96);
            g.fillEllipse(cx + 2, cy, 30 + pulse * 3, 18 + pulse * 1.5);

            g.fillStyle(0xffef88, 0.97);
            g.fillEllipse(cx + 5, cy - 1, 19 + pulse * 2, 11 + pulse);

            g.fillStyle(0xfff9d6, 0.78 + pulse * 0.16);
            g.fillEllipse(cx + 9, cy - 1, 8 + pulse * 1.4, 5 + pulse * 0.8);

            g.fillStyle(0xffa526, 0.78);
            g.fillTriangle(cx - 2, cy - 11, cx + 8, cy - 7, cx + 2, cy - 2);
            g.fillTriangle(cx - 1, cy + 10, cx + 8, cy + 6, cx + 1, cy + 2);

            g.fillStyle(0xffc06d, 0.62);
            g.fillEllipse(12 + sway * 0.8, cy - 7, 4, 2);
            g.fillEllipse(10 + sway * 0.6, cy + 6, 3.5, 2);
            g.fillEllipse(cx + 20 + pulse * 2, cy - 3, 2.7, 1.8);

            g.generateTexture(key, 72, 64);
            g.destroy();
        }
    }

    ensureChargedFireTextures() {
        const frameCount = this.chargedFrameCount || 18;
        for (let i = 0; i < frameCount; i++) {
            const key = `staff_charged_fireball_${i}`;
            if (this.scene.textures.exists(key)) continue;

            const g = this.scene.add.graphics();
            const phase = (i / frameCount) * Math.PI * 2;
            const pulse = (Math.sin(phase) + 1) * 0.5;
            const swirl = phase * 1.8;

            const cx = 54 + Math.sin(phase * 1.1) * 3;
            const cy = 48 + Math.cos(phase * 1.45) * 2;

            // Outer inferno aura
            g.fillStyle(0xff3f00, 0.16 + pulse * 0.08);
            g.fillEllipse(cx, cy, 88 + pulse * 16, 64 + pulse * 8);

            // Layered tail sheets
            g.fillStyle(0xff5a12, 0.82);
            g.fillTriangle(8 + Math.cos(swirl) * 8, cy + Math.sin(swirl) * 3, 42, cy - 20, 42, cy + 20);
            g.fillTriangle(16 + Math.sin(swirl * 0.8) * 6, cy - 4, 48, cy - 15, 48, cy + 10);

            g.fillStyle(0xff7d18, 0.9);
            g.fillEllipse(cx, cy, 60 + pulse * 10, 40 + pulse * 7);

            g.fillStyle(0xffa934, 0.92);
            g.fillEllipse(cx + 3, cy, 44 + pulse * 7, 28 + pulse * 4);

            g.fillStyle(0xffd768, 0.95);
            g.fillEllipse(cx + 7, cy - 1, 30 + pulse * 5, 18 + pulse * 3);

            g.fillStyle(0xfff3be, 0.9);
            g.fillEllipse(cx + 12, cy - 1, 15 + pulse * 2.5, 9 + pulse * 1.2);

            // Arcane-hot tongues around perimeter
            g.fillStyle(0xffc852, 0.72);
            for (let k = 0; k < 6; k++) {
                const a = swirl + (k / 6) * Math.PI * 2;
                const px = cx + Math.cos(a) * (24 + pulse * 9);
                const py = cy + Math.sin(a) * (16 + pulse * 7);
                g.fillTriangle(px, py, px + Math.cos(a + 0.4) * 8, py + Math.sin(a + 0.4) * 8, px + Math.cos(a - 0.4) * 8, py + Math.sin(a - 0.4) * 8);
            }

            // Micro embers
            g.fillStyle(0xffefb4, 0.58);
            for (let e = 0; e < 8; e++) {
                const a = swirl * 1.2 + (e / 8) * Math.PI * 2;
                const px = cx + Math.cos(a) * (32 + pulse * 12);
                const py = cy + Math.sin(a) * (24 + pulse * 8);
                g.fillEllipse(px, py, 3.5, 2.2);
            }

            g.generateTexture(key, 108, 96);
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

            orb.rotation = Math.atan2(orb.vy, orb.vx);
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

    // Charged attack - advanced inferno with sticky impact
    executeChargedAttack(angle) {
        const charged = this.data.charged;
        const startX = this.player.x + Math.cos(angle) * 40;
        const startY = this.player.y + Math.sin(angle) * 40;

        const forgeRing = this.scene.add.circle(startX, startY, 18, 0xffa347, 0)
            .setStrokeStyle(3, 0xffcf91, 0.85)
            .setDepth(172);
        const forgeSigil = this.scene.add.circle(startX, startY, 10, 0xfff0bf, 0.2).setDepth(173);
        this.scene.tweens.add({
            targets: [forgeRing, forgeSigil],
            scale: 2.3,
            alpha: 0,
            duration: 260,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                forgeRing.destroy();
                forgeSigil.destroy();
            }
        });

        const fireball = this.scene.add.image(startX, startY, 'staff_charged_fireball_0').setScale(0.92).setDepth(170);
        const glow = this.scene.add.circle(startX, startY, 42, 0xff661a, 0.35).setDepth(169);
        const core = this.scene.add.circle(startX, startY, 19, 0xffef88, 0.35).setDepth(171);
        const ringOuter = this.scene.add.circle(startX, startY, 34, 0xffa43a, 0).setStrokeStyle(3, 0xffc780, 0.72).setDepth(168);
        const ringInner = this.scene.add.circle(startX, startY, 25, 0xffef88, 0).setStrokeStyle(2, 0xffef88, 0.55).setDepth(168);

        this.scene.tweens.add({
            targets: [glow, core],
            scale: { from: 0.95, to: 1.18 },
            alpha: { from: 0.32, to: 0.6 },
            duration: 170,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.scene.tweens.add({
            targets: [ringOuter, ringInner],
            scale: { from: 0.9, to: 1.18 },
            alpha: { from: 0.28, to: 0.7 },
            angle: 36,
            duration: 210,
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

            const explosionCore = this.scene.add.circle(x, y, charged.radius * 0.84, 0xff6600, 0.74).setDepth(172);
            const explosionHot = this.scene.add.circle(x, y, charged.radius * 0.58, 0xffef88, 0.42).setDepth(173);
            const explosionRing = this.scene.add.circle(x, y, charged.radius * 0.34, 0xff6600, 0)
                .setStrokeStyle(4, 0xffd39b, 0.96)
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

            for (let i = 0; i < 22; i++) {
                const particleAngle = (i / 22) * Math.PI * 2;
                const particle = this.scene.add.circle(x, y, 3 + Math.random() * 6, 0xff8a1a, 0.8).setDepth(175);
                this.scene.tweens.add({
                    targets: particle,
                    x: x + Math.cos(particleAngle) * (110 + Math.random() * 52),
                    y: y + Math.sin(particleAngle) * (110 + Math.random() * 52),
                    alpha: 0,
                    scale: 0.24,
                    duration: 390,
                    ease: 'Cubic.easeOut',
                    onComplete: () => particle.destroy()
                });
            }

            for (let i = 0; i < 12; i++) {
                const ember = this.scene.add.circle(x, y, Phaser.Math.FloatBetween(1.8, 3.8), 0xffef88, 0.94).setDepth(176);
                const baseAngle = Math.random() * Math.PI * 2;
                const endRadius = Phaser.Math.Between(56, 110);
                this.scene.tweens.addCounter({
                    from: 0,
                    to: 1,
                    duration: Phaser.Math.Between(350, 520),
                    onUpdate: (tw) => {
                        const t = tw.getValue();
                        const radius = 18 + t * endRadius;
                        const a = baseAngle + t * 4.8;
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
                scale: 1.65,
                duration: 340,
                ease: 'Cubic.easeOut',
                onComplete: () => {
                    explosionCore.destroy();
                    explosionHot.destroy();
                }
            });

            this.scene.tweens.add({
                targets: explosionRing,
                alpha: 0,
                scale: 2.35,
                duration: 380,
                ease: 'Expo.easeOut',
                onComplete: () => explosionRing.destroy()
            });

            this.scene.tweens.add({
                targets: [fireball, glow, core, ringOuter, ringInner],
                alpha: 0,
                scale: 1.52,
                duration: 240,
                onComplete: cleanupCoreFx
            });

            this.scene.cameras.main.shake(200, 0.013);
        };

        const travelTween = this.scene.tweens.add({
            targets: [fireball, glow, core, ringOuter, ringInner],
            x: targetX,
            y: targetY,
            duration: 500,
            ease: 'Cubic.easeOut',
            onUpdate: () => {
                animElapsed += 16;

                fireball.setTexture(`staff_charged_fireball_${Math.floor(animElapsed / 30) % this.chargedFrameCount}`);
                fireball.setRotation(Math.atan2(targetY - fireball.y, targetX - fireball.x));

                const travelDist = Phaser.Math.Distance.Between(startX, startY, targetX, targetY) || 1;
                const traveled = Phaser.Math.Distance.Between(startX, startY, fireball.x, fireball.y);
                const progress = Phaser.Math.Clamp(traveled / travelDist, 0, 1);
                const eased = Phaser.Math.Easing.Cubic.Out(progress);
                const pulse = 1 + Math.sin(animElapsed * 0.032) * 0.085;

                // Evolutive growth over the full trajectory
                fireball.setScale((0.92 + eased * 1.48) * pulse);
                glow.setRadius(42 + eased * 42);
                core.setRadius(19 + eased * 14);
                ringOuter.setRadius(34 + eased * 24);
                ringInner.setRadius(25 + eased * 18);
                glow.alpha = 0.32 + eased * 0.32;
                core.alpha = 0.33 + eased * 0.24;

                ringOuter.rotation += 0.1 + eased * 0.18;
                ringInner.rotation -= 0.16 + eased * 0.24;
                core.x = fireball.x + Math.cos(animElapsed * 0.024) * (1.4 + eased * 1.8);
                core.y = fireball.y + Math.sin(animElapsed * 0.024) * (1.4 + eased * 1.8);

                if (Math.random() > 0.5) {
                    const ember = this.scene.add.circle(fireball.x, fireball.y, Phaser.Math.FloatBetween(1.8, 3.3), 0xffc26b, 0.62).setDepth(167);
                    this.scene.tweens.add({
                        targets: ember,
                        x: ember.x - Math.cos(fireball.rotation) * Phaser.Math.Between(12, 28),
                        y: ember.y - Math.sin(fireball.rotation) * Phaser.Math.Between(12, 28),
                        alpha: 0,
                        scale: 0.34,
                        duration: Phaser.Math.Between(120, 190),
                        onComplete: () => ember.destroy()
                    });
                }

                const boss = this.scene.boss;
                if (!boss || exploded) return;

                const distToBoss = Phaser.Math.Distance.Between(fireball.x, fireball.y, boss.x, boss.y);
                if (distToBoss <= 52) {
                    travelTween.stop();
                    const stickTime = 260;

                    // Keep impact point relative to boss to avoid visible position snapping/jumping
                    const impactOffsetX = fireball.x - boss.x;
                    const impactOffsetY = fireball.y - boss.y;

                    this.scene.tweens.add({
                        targets: [fireball, glow, core, ringOuter, ringInner],
                        scale: '+=0.38',
                        duration: 180,
                        yoyo: true,
                        ease: 'Sine.easeInOut'
                    });

                    this.scene.tweens.add({
                        targets: [ringOuter, ringInner],
                        alpha: { from: 0.75, to: 1 },
                        duration: 100,
                        yoyo: true,
                        repeat: 1
                    });

                    const followHandler = () => {
                        if (!boss.scene || exploded) return;
                        const px = boss.x + impactOffsetX;
                        const py = boss.y + impactOffsetY;
                        [fireball, glow, core, ringOuter, ringInner].forEach((obj) => obj.setPosition(px, py));
                        ringOuter.rotation += 0.24;
                        ringInner.rotation -= 0.34;
                    };
                    this.scene.events.on('update', followHandler);

                    this.scene.time.delayedCall(stickTime, () => {
                        this.scene.events.off('update', followHandler);
                        const finalX = boss.scene ? boss.x + impactOffsetX : fireball.x;
                        const finalY = boss.scene ? boss.y + impactOffsetY : fireball.y;
                        explodeAt(finalX, finalY);
                    });
                }
            },
            onComplete: () => {
                explodeAt(targetX, targetY);
            }
        });
    }
}
