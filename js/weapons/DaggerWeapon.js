// DaggerWeapon.js - Dagues avec tir en éventail et nuage de poison (FIXED - damage multiplier)
import { WeaponBase } from './WeaponBase.js';
import { WEAPONS } from './weaponData.js';

export class DaggerWeapon extends WeaponBase {
    constructor(scene, player) {
        super(scene, player, WEAPONS.DAGGERS);
        this.ultimateState = null;

        this.shadowExecutionConfig = {
            dashDistance: 120,
            phaseDuration: 170,
            strikeCount: 3,
            strikeInterval: 125,
            strikeDamage: 36,
            finisherDamage: 95,
            markDuration: 420,
            escapeDistance: 150,
            untargetableDuration: 520
        };
    }
    
    // Tir normal - 3 dagues en éventail
    fire(angle) {
        const data = this.data.projectile;
        
        for (let i = 0; i < data.count; i++) {
            const offset = (i - (data.count - 1) / 2) * data.spread;
            this.createDagger(angle + offset, data);
        }
        
        this.createMuzzleFlash(this.player.x, this.player.y, this.data.color);
    }
    
    createDagger(angle, data) {
        const startX = this.player.x + Math.cos(angle) * 30;
        const startY = this.player.y + Math.sin(angle) * 30;
        
        const dagger = this.scene.add.triangle(
            startX, startY,
            -data.size, -data.size,
            data.size, 0,
            -data.size, data.size,
            data.color
        );
        dagger.rotation = angle;
        dagger.setDepth(150);
        
        dagger.vx = Math.cos(angle) * data.speed;
        dagger.vy = Math.sin(angle) * data.speed;
        dagger.damage = data.damage;
        dagger.range = data.range;
        dagger.startX = startX;
        dagger.startY = startY;
        
        this.scene.projectiles.push(dagger);
        this.addTrail(dagger, data.color, data.size);
    }
    
    // Attaque chargée - Nuage de poison (directionnel)
    executeChargedAttack(angle) {
        const charged = this.data.charged;
        
        const targetPoint = this.getClampedChargedTarget(this.scene.worldMouseX, this.scene.worldMouseY);
        const cloudX = targetPoint.x;
        const cloudY = targetPoint.y;
        
        const cloud = this.scene.add.circle(cloudX, cloudY, charged.radius, 0x88aa88, 0.3);
        
        let tickCount = 0;
        const interval = setInterval(() => {
            const boss = this.scene.boss;
            if (!boss?.scene || tickCount >= charged.ticks) {
                clearInterval(interval);
                cloud.destroy();
                return;
            }
            
            const distToBoss = Phaser.Math.Distance.Between(cloudX, cloudY, boss.x, boss.y);
            if (distToBoss < charged.radius) {
                // ✅ FIX: Appliquer le multiplicateur de dégâts
                const tickDamage = (charged.damage / charged.ticks) * (this.player.damageMultiplier || 1.0);
                boss.takeDamage(tickDamage);
                this.gainUltimateGaugeFromDamage(tickDamage, { charged: true, dot: true });
                
                boss.setTint(0x88aa88);
                
                if (charged.slow) {
                    boss.slowed = true;
                }
                
                this.scene.time.delayedCall(100, () => {
                    boss.clearTint();
                    boss.slowed = false;
                });
                
                if (tickCount === 0) {
                    console.log(`☠️ Poison Cloud damage per tick: ${Math.floor(tickDamage)} (multiplier: ${this.player.damageMultiplier.toFixed(1)}x)`);
                }
            }
            
            tickCount++;
        }, charged.tickRate);
    }

    startUltimateCharge(targetX, targetY) {
        if (this.ultimateState || !this.canUseUltimate()) return false;

        const boss = this.scene.boss;
        if (!boss?.scene) return false;

        const fallbackTargetX = targetX ?? boss.x;
        const fallbackTargetY = targetY ?? boss.y;
        const aimToTarget = Math.atan2(fallbackTargetY - this.player.y, fallbackTargetX - this.player.x);
        const playerToBoss = Math.atan2(boss.y - this.player.y, boss.x - this.player.x);
        const angle = Number.isFinite(aimToTarget) ? aimToTarget : playerToBoss;

        this.ultimateState = {
            phase: 'cast',
            angle,
            targetX: fallbackTargetX,
            targetY: fallbackTargetY,
            targetBoss: boss,
            created: [],
            timers: []
        };

        this.spawnCastIntent();
        return true;
    }

    updateUltimate(time, delta, targetX, targetY) {
        const state = this.ultimateState;
        if (!state || state.phase !== 'cast') return;

        if (Number.isFinite(targetX) && Number.isFinite(targetY)) {
            state.targetX = targetX;
            state.targetY = targetY;
            state.angle = Math.atan2(targetY - this.player.y, targetX - this.player.x);
        }
    }

    releaseUltimate(targetX, targetY) {
        const state = this.ultimateState;
        if (!state || state.phase !== 'cast') return false;
        if (!this.consumeUltimate()) {
            this.destroyUltimateState();
            return false;
        }

        const boss = this.scene.boss;
        if (!boss?.scene) {
            this.destroyUltimateState();
            return false;
        }

        if (Number.isFinite(targetX) && Number.isFinite(targetY)) {
            state.targetX = targetX;
            state.targetY = targetY;
            state.angle = Math.atan2(targetY - this.player.y, targetX - this.player.x);
        }

        state.phase = 'phase-slip';
        this.playPhaseSlip(state, boss);
        return true;
    }

    spawnCastIntent() {
        const pulse = this.scene.add.circle(this.player.x, this.player.y, 16, 0x120018, 0.5).setDepth(175);
        const ring = this.scene.add.circle(this.player.x, this.player.y, 20, 0x000000, 0)
            .setStrokeStyle(3, 0xc178ff, 0.9)
            .setDepth(176);

        this.scene.tweens.add({
            targets: pulse,
            radius: 42,
            alpha: 0,
            duration: 180,
            ease: 'Cubic.easeOut',
            onComplete: () => pulse.destroy()
        });

        this.scene.tweens.add({
            targets: ring,
            radius: 58,
            alpha: 0,
            duration: 220,
            ease: 'Sine.easeOut',
            onComplete: () => ring.destroy()
        });
    }

    playPhaseSlip(state, boss) {
        const cfg = this.shadowExecutionConfig;
        const fromX = this.player.x;
        const fromY = this.player.y;
        const dashAngle = Math.atan2(boss.y - fromY, boss.x - fromX);

        const throughX = boss.x + Math.cos(dashAngle) * cfg.dashDistance;
        const throughY = boss.y + Math.sin(dashAngle) * cfg.dashDistance;

        const trail = this.scene.add.line(0, 0, fromX, fromY, boss.x, boss.y, 0xeeccff, 0.4).setDepth(178);
        trail.setLineWidth(6, 2);
        const mark = this.scene.add.text(boss.x, boss.y - 2, '✕', {
            fontSize: '64px',
            fill: '#f0caff',
            stroke: '#2a0c40',
            strokeThickness: 8,
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(182).setAlpha(0.85);

        this.player.untargetable = true;
        this.player.alpha = 0.35;
        this.scene.cameras.main.zoomTo(1.04, 130, 'Quad.easeOut');

        this.scene.tweens.add({
            targets: this.player,
            x: throughX,
            y: throughY,
            duration: cfg.phaseDuration,
            ease: 'Cubic.easeInOut',
            onComplete: () => {
                this.player.alpha = 1;
                this.scene.cameras.main.zoomTo(1, 160, 'Quad.easeOut');
                this.playTriCut(state, boss, mark);
            }
        });

        this.scene.tweens.add({
            targets: trail,
            alpha: 0,
            duration: 220,
            ease: 'Sine.easeOut',
            onComplete: () => trail.destroy()
        });
    }

    playTriCut(state, boss, mark) {
        const cfg = this.shadowExecutionConfig;
        state.phase = 'tri-cut';

        for (let i = 0; i < cfg.strikeCount; i++) {
            const timer = this.scene.time.delayedCall(i * cfg.strikeInterval, () => {
                if (!this.ultimateState || !boss?.scene) return;

                const arc = (Math.PI * 2 * i) / cfg.strikeCount + Math.PI * 0.25;
                const hitX = boss.x + Math.cos(arc) * 58;
                const hitY = boss.y + Math.sin(arc) * 58;

                this.player.x = hitX;
                this.player.y = hitY;

                const slash = this.scene.add.rectangle(boss.x, boss.y, 150, 8, 0xf1d5ff, 0.92)
                    .setRotation(arc)
                    .setDepth(183);
                this.scene.tweens.add({
                    targets: slash,
                    alpha: 0,
                    scaleX: 1.2,
                    duration: 90,
                    onComplete: () => slash.destroy()
                });

                const pop = this.scene.add.circle(hitX, hitY, 10, 0xcca1ff, 0.6).setDepth(184);
                this.scene.tweens.add({
                    targets: pop,
                    radius: 22,
                    alpha: 0,
                    duration: 120,
                    onComplete: () => pop.destroy()
                });

                const strikeDamage = cfg.strikeDamage * (this.player.damageMultiplier || 1.0);
                boss.takeDamage(strikeDamage);
                this.gainUltimateGaugeFromDamage(strikeDamage, { charged: true });
                boss.setTint(0xcf83ff);
                this.scene.time.delayedCall(70, () => boss?.clearTint?.());

                mark.setScale(1 + i * 0.08);
                mark.setAlpha(0.85 - i * 0.12);
            });
            state.timers.push(timer);
        }

        const finalizeTimer = this.scene.time.delayedCall(cfg.strikeCount * cfg.strikeInterval + cfg.markDuration, () => {
            if (!this.ultimateState) return;
            this.playFinisherAndEscape(state, boss, mark);
        });
        state.timers.push(finalizeTimer);
    }

    playFinisherAndEscape(state, boss, mark) {
        const cfg = this.shadowExecutionConfig;
        state.phase = 'finisher';

        if (!boss?.scene) {
            this.destroyUltimateState();
            return;
        }

        this.player.x = boss.x + 42;
        this.player.y = boss.y - 10;

        const judgeLine = this.scene.add.rectangle(
            this.scene.cameras.main.worldView.centerX,
            this.scene.cameras.main.worldView.centerY,
            this.scene.cameras.main.width * 1.2,
            3,
            0xffffff,
            0.88
        ).setDepth(500).setScrollFactor(0);

        this.scene.tweens.add({
            targets: judgeLine,
            alpha: 0,
            scaleY: 3,
            duration: 120,
            onComplete: () => judgeLine.destroy()
        });

        const flash = this.scene.add.circle(boss.x, boss.y, 46, 0x3d1156, 0.55).setDepth(190);
        this.scene.tweens.add({
            targets: flash,
            radius: 130,
            alpha: 0,
            duration: 240,
            onComplete: () => flash.destroy()
        });

        const finisherDamage = cfg.finisherDamage * (this.player.damageMultiplier || 1.0);
        boss.takeDamage(finisherDamage);
        this.gainUltimateGaugeFromDamage(finisherDamage, { charged: true });
        boss.setTint(0xffffff);
        this.scene.time.delayedCall(100, () => boss?.clearTint?.());

        mark.destroy();
        this.scene.cameras.main.shake(110, 0.004);

        this.scene.time.delayedCall(80, () => {
            const escapeAngle = Math.atan2(this.player.y - boss.y, this.player.x - boss.x);
            this.player.x = boss.x + Math.cos(escapeAngle) * cfg.escapeDistance;
            this.player.y = boss.y + Math.sin(escapeAngle) * cfg.escapeDistance;

            const seam = this.scene.add.circle(this.player.x, this.player.y, 22, 0x1d0630, 0.42).setDepth(179);
            this.scene.tweens.add({
                targets: seam,
                radius: 52,
                alpha: 0,
                duration: 260,
                ease: 'Sine.easeOut',
                onComplete: () => seam.destroy()
            });

            this.player.alpha = 0.7;
            this.scene.time.delayedCall(cfg.untargetableDuration, () => {
                this.player.untargetable = false;
                this.player.alpha = 1;
            });

            this.destroyUltimateState();
        });
    }

    destroyUltimateState() {
        const state = this.ultimateState;
        if (!state) return;

        for (const timer of state.timers || []) {
            timer?.remove?.();
        }

        for (const obj of state.created || []) {
            obj?.destroy?.();
        }

        this.player.untargetable = false;
        this.player.alpha = 1;

        this.ultimateState = null;
    }
}
