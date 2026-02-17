// BowWeapon.js - Arc avec flèches et pluie de flèches (FIXED - damage multiplier)
import { WeaponBase } from './WeaponBase.js';
import { WEAPONS } from './weaponData.js';

export class BowWeapon extends WeaponBase {
    constructor(scene, player) {
        super(scene, player, WEAPONS.BOW);
        this.ultimateState = null;
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
                    this.gainUltimateGaugeFromDamage(perWaveDamage, { charged: true });
                    if (wave === 0) {
                        console.log(`🏹 Cataclysm Rain: ${Math.floor(perWaveDamage)} per wave x${waves}`);
                    }
                }
            });
        }
    }

    startUltimateCharge(targetX, targetY) {
        if (this.ultimateState || !this.canUseUltimate()) return false;

        const fallbackX = this.player.x + 1;
        const fallbackY = this.player.y;
        const target = this.getClampedChargedTarget(targetX ?? fallbackX, targetY ?? fallbackY);

        const aura = this.scene.add.graphics().setDepth(186);
        const reticle = this.scene.add.graphics().setDepth(187);
        const ribbons = this.scene.add.graphics().setDepth(185);

        const spiritBow = this.scene.add.container(this.player.x, this.player.y).setDepth(188);
        const glow = this.scene.add.ellipse(0, 0, 150, 48, 0x6f8cff, 0.16)
            .setStrokeStyle(2, 0xcfe3ff, 0.55);
        const bowArc = this.scene.add.arc(0, 0, 42, 90, 270, false, 0xcfe3ff, 0.18)
            .setStrokeStyle(3, 0xe7f1ff, 0.9);
        const bowString = this.scene.add.line(0, 0, -6, -38, -6, 38, 0xffffff, 0.85).setLineWidth(2, 2);
        const spectralArrow = this.scene.add.rectangle(8, 0, 52, 5, 0xb6f7ff, 0.88)
            .setStrokeStyle(1, 0xffffff, 0.85);
        spiritBow.add([glow, bowArc, bowString, spectralArrow]);

        this.ultimateState = {
            phase: 'charge',
            targetX: target.x,
            targetY: target.y,
            aura,
            reticle,
            spiritBow,
            ribbons,
            pulse: 0
        };

        return true;
    }

    updateUltimate(time, delta, targetX, targetY) {
        const state = this.ultimateState;
        if (!state || state.phase !== 'charge') return;

        const clamped = this.getClampedChargedTarget(targetX ?? state.targetX, targetY ?? state.targetY);
        state.targetX = clamped.x;
        state.targetY = clamped.y;
        state.pulse += delta * 0.008;

        const aimAngle = Math.atan2(state.targetY - this.player.y, state.targetX - this.player.x);
        state.spiritBow.x = this.player.x;
        state.spiritBow.y = this.player.y;
        state.spiritBow.rotation = aimAngle;
        state.spiritBow.scale = 1 + Math.sin(time * 0.015) * 0.05;

        state.aura.clear();
        state.aura.lineStyle(2.5, 0x6f8cff, 0.5);
        state.aura.strokeCircle(this.player.x, this.player.y, 58 + Math.sin(time * 0.012) * 4);
        state.aura.lineStyle(1.5, 0xd9f2ff, 0.45);
        state.aura.strokeCircle(this.player.x, this.player.y, 82 + Math.sin(time * 0.01 + 1.2) * 5);
        state.aura.lineStyle(1.8, 0xbde1ff, 0.42);
        state.aura.beginPath();
        state.aura.arc(this.player.x, this.player.y, 70, time * 0.004, time * 0.004 + 1.1);
        state.aura.strokePath();
        state.aura.beginPath();
        state.aura.arc(this.player.x, this.player.y, 70, time * 0.004 + Math.PI, time * 0.004 + Math.PI + 1.1);
        state.aura.strokePath();

        state.ribbons.clear();
        state.ribbons.lineStyle(2, 0x9fd8ff, 0.45);
        for (let i = 0; i < 2; i++) {
            const offset = i === 0 ? Math.PI * 0.5 : -Math.PI * 0.5;
            const sweep = state.pulse * 0.85 + offset;
            const sx = this.player.x + Math.cos(sweep) * 26;
            const sy = this.player.y + Math.sin(sweep) * 26;
            const mx = this.player.x + Math.cos(sweep + 0.75) * 68;
            const my = this.player.y + Math.sin(sweep + 0.75) * 68;
            const ex = this.player.x + Math.cos(sweep + 1.35) * 34;
            const ey = this.player.y + Math.sin(sweep + 1.35) * 34;
            state.ribbons.beginPath();
            state.ribbons.moveTo(sx, sy);
            state.ribbons.quadraticCurveTo(mx, my, ex, ey);
            state.ribbons.strokePath();
        }

        state.reticle.clear();
        state.reticle.lineStyle(2, 0xb6f7ff, 0.85);
        state.reticle.strokeCircle(state.targetX, state.targetY, 34 + Math.sin(state.pulse) * 4);
        state.reticle.lineStyle(1.2, 0xffffff, 0.68);
        state.reticle.lineBetween(state.targetX - 16, state.targetY, state.targetX + 16, state.targetY);
        state.reticle.lineBetween(state.targetX, state.targetY - 16, state.targetX, state.targetY + 16);
        state.reticle.lineStyle(1.7, 0x8dd7ff, 0.55);
        state.reticle.lineBetween(this.player.x, this.player.y, state.targetX, state.targetY);
    }

    releaseUltimate(targetX, targetY) {
        const state = this.ultimateState;
        if (!state || state.phase !== 'charge') return false;

        if (!this.consumeUltimate()) {
            this.destroyUltimateState();
            return false;
        }

        const clamped = this.getClampedChargedTarget(targetX ?? state.targetX, targetY ?? state.targetY);
        const centerX = clamped.x;
        const centerY = clamped.y;
        const aimAngle = Math.atan2(centerY - this.player.y, centerX - this.player.x);

        state.phase = 'release';

        const recoilDistance = 125;
        const startX = this.player.x;
        const startY = this.player.y;
        const recoilX = startX - Math.cos(aimAngle) * recoilDistance;
        const recoilY = startY - Math.sin(aimAngle) * recoilDistance;

        this.scene.tweens.add({
            targets: this.player,
            x: recoilX,
            duration: 210,
            ease: 'Cubic.easeOut'
        });

        this.scene.tweens.addCounter({
            from: 0,
            to: 1,
            duration: 210,
            ease: 'Sine.easeOut',
            onUpdate: (tw) => {
                const t = tw.getValue();
                const hop = Math.sin(Math.PI * t) * 34;
                this.player.y = Phaser.Math.Linear(startY, recoilY, t) - hop;
            }
        });

        const releaseBurst = this.scene.add.circle(startX, startY, 40, 0xb5deff, 0.22).setDepth(175);
        releaseBurst.setStrokeStyle(3, 0xe7f5ff, 0.85);
        this.scene.tweens.add({
            targets: releaseBurst,
            scale: 2.1,
            alpha: 0,
            duration: 280,
            onComplete: () => releaseBurst.destroy()
        });

        this.launchEclipseArrow(aimAngle, centerX, centerY);
        this.startEclipseBarrage(centerX, centerY);

        this.scene.cameras.main.flash(150, 160, 220, 255);
        this.scene.cameras.main.shake(130, 0.003);
        this.destroyUltimateState();
        return true;
    }

    launchEclipseArrow(angle, centerX, centerY) {
        const startX = this.player.x + Math.cos(angle) * 30;
        const startY = this.player.y + Math.sin(angle) * 30;

        const projectile = this.scene.add.container(startX, startY).setDepth(170);
        const shaft = this.scene.add.rectangle(0, 0, 58, 8, 0xdaf6ff, 0.95);
        const tip = this.scene.add.triangle(30, 0, 0, -7, 0, 7, 0x9de0ff, 1);
        const aura = this.scene.add.ellipse(0, 0, 70, 22, 0x82beff, 0.32);
        const tail = this.scene.add.ellipse(-24, 0, 44, 14, 0xbde8ff, 0.35);
        projectile.add([aura, tail, shaft, tip]);
        projectile.rotation = angle;

        const dx = centerX - startX;
        const dy = centerY - startY;
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const flightDuration = Phaser.Math.Clamp(dist / 2.8, 220, 420);

        this.addTrail(projectile, 0x9de0ff, 9);

        this.scene.tweens.add({
            targets: projectile,
            x: centerX,
            y: centerY,
            duration: flightDuration,
            ease: 'Cubic.easeIn',
            onComplete: () => {
                if (!projectile.scene) return;
                projectile.destroy();

                const boss = this.scene.boss;
                if (!boss) return;

                const hitDist = Phaser.Math.Distance.Between(centerX, centerY, boss.x, boss.y);
                if (hitDist > 110) return;

                const directDamage = 170 * (this.player.damageMultiplier || 1.0);
                boss.takeDamage(directDamage);
                this.gainUltimateGaugeFromDamage(directDamage, { charged: true });

                boss.eclipseMarkedUntil = this.scene.time.now + 3200;
                const markRing = this.scene.add.circle(boss.x, boss.y, 56, 0xa6d8ff, 0)
                    .setStrokeStyle(3, 0xa6d8ff, 0.86)
                    .setDepth(180);
                this.scene.tweens.add({
                    targets: markRing,
                    alpha: 0,
                    scale: 1.18,
                    duration: 520,
                    onComplete: () => markRing.destroy()
                });
            }
        });
    }

    startEclipseBarrage(centerX, centerY) {
        const waves = 8;
        const radius = 190;
        const baseWaveDamage = 33 * (this.player.damageMultiplier || 1.0);
        const executeThreshold = 0.3;

        for (let wave = 0; wave < waves; wave++) {
            this.scene.time.delayedCall(220 + wave * 240, () => {
                const boss = this.scene.boss;

                for (let i = 0; i < 7; i++) {
                    const a = Math.random() * Math.PI * 2;
                    const r = Math.random() * radius;
                    const x = centerX + Math.cos(a) * r;
                    const y = centerY + Math.sin(a) * r;
                    const rain = this.scene.add.rectangle(x, y - 120, 4, 34, 0xc8f0ff, 0.95).setDepth(175);
                    const shard = this.scene.add.circle(x, y - 120, 3, 0xe9f7ff, 0.9).setDepth(176);

                    this.scene.tweens.add({
                        targets: [rain, shard],
                        y,
                        alpha: 0.2,
                        duration: 180,
                        onComplete: () => { rain.destroy(); shard.destroy(); }
                    });
                }

                const ring = this.scene.add.circle(centerX, centerY, radius * 0.96, 0x8ec7ff, 0.08).setDepth(130);
                ring.setStrokeStyle(2, 0xa8d6ff, 0.45);
                this.scene.tweens.add({
                    targets: ring,
                    alpha: 0,
                    scale: 1.08,
                    duration: 210,
                    onComplete: () => ring.destroy()
                });

                if (!boss) return;

                const dist = Phaser.Math.Distance.Between(centerX, centerY, boss.x, boss.y);
                if (dist > radius) return;

                let waveDamage = baseWaveDamage;
                const isMarked = (boss.eclipseMarkedUntil || 0) > this.scene.time.now;
                const healthRatio = boss.maxHealth > 0 ? boss.health / boss.maxHealth : 1;
                if (isMarked && healthRatio <= executeThreshold) {
                    waveDamage *= 1.8;
                }

                boss.takeDamage(waveDamage);
                this.gainUltimateGaugeFromDamage(waveDamage, { charged: true });
            });
        }
    }

    destroyUltimateState() {
        const state = this.ultimateState;
        if (!state) return;

        state.aura?.destroy();
        state.reticle?.destroy();
        state.ribbons?.destroy();
        state.spiritBow?.destroy();
        this.ultimateState = null;
    }
}
