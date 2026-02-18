// DaggerWeapon.js - Dagues avec tir en éventail et nuage de poison (FIXED - damage multiplier)
// Void Assassin theme: shadow/void energy with toxic essence procedural visuals
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
            untargetableDuration: 520,
            dashGhostCount: 5
        };

        this.ensureProceduralTextures();
    }

    ensureProceduralTextures() {
        // Void spark: dark purple glow circle with violet stroke
        if (!this.scene.textures.exists('dagger-void-spark')) {
            const g = this.scene.add.graphics();
            g.fillStyle(0xe0b0ff, 1);
            g.fillCircle(4, 4, 2.1);
            g.fillStyle(0x6a0dad, 0.88);
            g.fillCircle(4, 4, 3.2);
            g.lineStyle(1, 0x9b30ff, 0.95);
            g.strokeCircle(4, 4, 3.8);
            g.generateTexture('dagger-void-spark', 8, 8);
            g.destroy();
        }

        // Shadow wisp: gradient from violet to black triangle
        if (!this.scene.textures.exists('dagger-shadow-wisp')) {
            const g = this.scene.add.graphics();
            g.fillGradientStyle(0x9b30ff, 0x6a0dad, 0x1a0025, 0x000000, 1);
            g.fillTriangle(8, 1, 13, 15, 3, 15);
            g.generateTexture('dagger-shadow-wisp', 16, 16);
            g.destroy();
        }

        // Toxic drop: green-purple gradient circle
        if (!this.scene.textures.exists('dagger-toxic-drop')) {
            const g = this.scene.add.graphics();
            g.fillGradientStyle(0x44dd66, 0x88aa44, 0x9b30ff, 0x2d0045, 1);
            g.fillCircle(6, 6, 5);
            g.lineStyle(1, 0x66ff88, 0.7);
            g.strokeCircle(6, 6, 5.5);
            g.generateTexture('dagger-toxic-drop', 12, 12);
            g.destroy();
        }

        // Phase shard: light purple angular shard
        if (!this.scene.textures.exists('dagger-phase-shard')) {
            const g = this.scene.add.graphics();
            g.fillStyle(0xd8b0ff, 0.92);
            g.fillTriangle(2, 0, 10, 5, 2, 10);
            g.fillStyle(0xf0ddff, 0.65);
            g.fillTriangle(3, 2, 8, 5, 3, 8);
            g.lineStyle(1, 0xc178ff, 0.8);
            g.lineBetween(2, 0, 10, 5);
            g.lineBetween(10, 5, 2, 10);
            g.generateTexture('dagger-phase-shard', 12, 12);
            g.destroy();
        }
    }

    getUltimatePreviewConfig() {
        return {
            targeting: 'self',
            aoeRadius: 260
        };
    }

    // ---- BASIC ATTACK: Tir normal - 3 dagues en éventail ----
    fire(angle) {
        const data = this.data.projectile;

        for (let i = 0; i < data.count; i++) {
            const offset = (i - (data.count - 1) / 2) * data.spread;
            this.createDagger(angle + offset, data);
        }

        this.createMuzzleFlash(this.player.x, this.player.y, this.data.color);
        this.spawnVoidMuzzleBurst(this.player.x, this.player.y, angle);
    }

    createDagger(angle, data) {
        const startX = this.player.x + Math.cos(angle) * 30;
        const startY = this.player.y + Math.sin(angle) * 30;

        // Container-based dagger with multiple visual layers
        const dagger = this.scene.add.container(startX, startY).setDepth(150);

        // Layer 1: Shadow aura (dark outer glow)
        const shadowAura = this.scene.add.circle(0, 0, data.size * 1.8, 0x1a0025, 0.25);

        // Layer 2: Blade shape (the dagger triangle)
        const blade = this.scene.add.triangle(
            0, 0,
            -data.size, -data.size * 0.7,
            data.size * 1.3, 0,
            -data.size, data.size * 0.7,
            data.color
        );

        // Layer 3: Void core (inner dark energy)
        const voidCore = this.scene.add.circle(0, 0, data.size * 0.45, 0x3d0060, 0.8);

        // Layer 4: Phase ring (spinning outer ring)
        const phaseRing = this.scene.add.circle(0, 0, data.size * 1.15, 0x000000, 0)
            .setStrokeStyle(1.2, 0xc178ff, 0.65);

        dagger.add([shadowAura, blade, voidCore, phaseRing]);
        dagger.rotation = angle;

        dagger.vx = Math.cos(angle) * data.speed;
        dagger.vy = Math.sin(angle) * data.speed;
        dagger.damage = data.damage;
        dagger.range = data.range;
        dagger.startX = startX;
        dagger.startY = startY;
        dagger.lifeTick = 0;

        dagger.update = () => {
            dagger.lifeTick += 0.35;
            const dir = Math.atan2(dagger.vy, dagger.vx);

            // Shadow aura breathing
            shadowAura.alpha = 0.15 + Math.abs(Math.sin(dagger.lifeTick * 1.2)) * 0.18;
            shadowAura.setScale(1 + Math.sin(dagger.lifeTick * 1.6) * 0.12);

            // Void core pulse
            voidCore.alpha = 0.6 + Math.abs(Math.sin(dagger.lifeTick * 2.0)) * 0.35;

            // Phase ring counter-rotation
            phaseRing.rotation -= 0.1;
            phaseRing.alpha = 0.45 + Math.sin(dagger.lifeTick * 1.8) * 0.2;

            // Blade phase-flicker: alpha oscillation
            blade.alpha = 0.82 + Math.sin(dagger.lifeTick * 3.5) * 0.18;

            // Shadow trail flicker: randomly dim the whole container
            if (Math.random() > 0.85) {
                const prevAlpha = dagger.alpha;
                dagger.alpha = 0.5 + Math.random() * 0.3;
                this.scene.time.delayedCall(30, () => {
                    if (dagger.scene) dagger.alpha = prevAlpha;
                });
            }

            // Spawn void sparks behind dagger during flight
            if (Math.random() > 0.55) {
                this.spawnVoidSpark(dagger.x, dagger.y, dir + Math.PI);
            }

            // Spawn shadow wisps less frequently
            if (Math.random() > 0.78) {
                this.spawnShadowWisp(dagger.x, dagger.y, dir + Math.PI);
            }
        };

        dagger.on('destroy', () => {
            shadowAura.destroy();
            blade.destroy();
            voidCore.destroy();
            phaseRing.destroy();
        });

        this.scene.projectiles.push(dagger);
        this.addTrail(dagger, 0x6a0dad, data.size + 1);
    }

    // ---- CHARGED ATTACK: Nuage de poison (directionnel) ----
    executeChargedAttack(angle) {
        const charged = this.data.charged;

        const targetPoint = this.getClampedChargedTarget(this.scene.worldMouseX, this.scene.worldMouseY);
        const cloudX = targetPoint.x;
        const cloudY = targetPoint.y;

        // Multi-layer cloud container
        // Layer 1: Outer miasma ring
        const miasmaRing = this.scene.add.circle(cloudX, cloudY, charged.radius * 1.15, 0x000000, 0)
            .setStrokeStyle(3.5, 0x44dd66, 0.3)
            .setDepth(149);

        // Layer 2: Main cloud body (replaces plain circle)
        const cloud = this.scene.add.circle(cloudX, cloudY, charged.radius, 0x88aa88, 0.3)
            .setDepth(150);

        // Layer 3: Inner toxic core
        const toxicCore = this.scene.add.circle(cloudX, cloudY, charged.radius * 0.45, 0x33cc55, 0.2)
            .setDepth(151);

        // Layer 4: Procedural swirl graphics (rotating pattern drawn each tick)
        const swirlGfx = this.scene.add.graphics().setDepth(152);

        let swirlTick = 0;

        // Cloud breathing/pulsing animation
        this.scene.tweens.add({
            targets: cloud,
            scaleX: 1.08,
            scaleY: 1.08,
            alpha: 0.38,
            duration: 600,
            yoyo: true,
            repeat: charged.ticks - 1,
            ease: 'Sine.easeInOut'
        });

        this.scene.tweens.add({
            targets: miasmaRing,
            scaleX: 1.06,
            scaleY: 1.06,
            alpha: { from: 0.3, to: 0.15 },
            duration: 700,
            yoyo: true,
            repeat: charged.ticks - 1,
            ease: 'Sine.easeInOut'
        });

        this.scene.tweens.add({
            targets: toxicCore,
            scaleX: 1.2,
            scaleY: 1.2,
            alpha: 0.35,
            duration: 450,
            yoyo: true,
            repeat: charged.ticks,
            ease: 'Sine.easeInOut'
        });

        // Swirl & particle update loop (runs alongside the damage interval)
        const visualInterval = setInterval(() => {
            if (!cloud.scene) {
                clearInterval(visualInterval);
                return;
            }

            swirlTick += 0.12;

            // Draw procedural swirl pattern that rotates each tick
            swirlGfx.clear();
            for (let arm = 0; arm < 3; arm++) {
                const baseAngle = swirlTick * 1.5 + (arm * Math.PI * 2 / 3);
                swirlGfx.lineStyle(2, 0x66ff88, 0.18 + Math.sin(swirlTick + arm) * 0.08);
                swirlGfx.beginPath();
                for (let s = 0; s < 20; s++) {
                    const frac = s / 20;
                    const spiralR = charged.radius * 0.15 + frac * charged.radius * 0.75;
                    const spiralA = baseAngle + frac * Math.PI * 1.6;
                    const px = cloudX + Math.cos(spiralA) * spiralR;
                    const py = cloudY + Math.sin(spiralA) * spiralR;
                    if (s === 0) swirlGfx.moveTo(px, py);
                    else swirlGfx.lineTo(px, py);
                }
                swirlGfx.strokePath();
            }

            // Rising toxic bubble particles
            if (Math.random() > 0.3) {
                const bx = cloudX + Phaser.Math.Between(-charged.radius * 0.7, charged.radius * 0.7);
                const by = cloudY + Phaser.Math.Between(-charged.radius * 0.5, charged.radius * 0.5);
                const bubble = this.scene.add.image(bx, by, 'dagger-toxic-drop')
                    .setScale(Phaser.Math.FloatBetween(0.4, 0.9))
                    .setAlpha(0.7)
                    .setDepth(153);
                this.scene.tweens.add({
                    targets: bubble,
                    y: bubble.y - Phaser.Math.Between(20, 50),
                    alpha: 0,
                    scale: 0.15,
                    duration: Phaser.Math.Between(350, 700),
                    onComplete: () => bubble.destroy()
                });
            }

            // Venomous drip particles falling from cloud
            if (Math.random() > 0.55) {
                const dx = cloudX + Phaser.Math.Between(-charged.radius * 0.6, charged.radius * 0.6);
                const dy = cloudY + charged.radius * Phaser.Math.FloatBetween(0.3, 0.8);
                const drip = this.scene.add.circle(dx, dy, Phaser.Math.FloatBetween(1.5, 3), 0x33cc55, 0.75)
                    .setDepth(148);
                this.scene.tweens.add({
                    targets: drip,
                    y: drip.y + Phaser.Math.Between(15, 40),
                    alpha: 0,
                    scaleX: 0.5,
                    scaleY: 1.6,
                    duration: Phaser.Math.Between(250, 500),
                    onComplete: () => drip.destroy()
                });
            }

            // Void sparks at cloud edges
            if (Math.random() > 0.65) {
                const ea = Math.random() * Math.PI * 2;
                const er = charged.radius * Phaser.Math.FloatBetween(0.6, 1.1);
                this.spawnVoidSpark(
                    cloudX + Math.cos(ea) * er,
                    cloudY + Math.sin(ea) * er,
                    ea
                );
            }
        }, 80);

        // Damage tick system: EXACT SAME as original
        let tickCount = 0;
        const interval = setInterval(() => {
            const boss = this.scene.boss;
            if (!boss?.scene || tickCount >= charged.ticks) {
                clearInterval(interval);
                clearInterval(visualInterval);
                // Fade out and destroy all cloud visuals
                const cloudVisuals = [cloud, miasmaRing, toxicCore];
                for (const vis of cloudVisuals) {
                    if (vis.scene) {
                        this.scene.tweens.add({
                            targets: vis,
                            alpha: 0,
                            scale: 0.6,
                            duration: 300,
                            onComplete: () => vis.destroy()
                        });
                    }
                }
                swirlGfx.destroy();
                return;
            }

            const distToBoss = Phaser.Math.Distance.Between(cloudX, cloudY, boss.x, boss.y);
            if (distToBoss < charged.radius) {
                // FIX: Appliquer le multiplicateur de degats
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
                    console.log(`\u2620\uFE0F Poison Cloud damage per tick: ${Math.floor(tickDamage)} (multiplier: ${this.player.damageMultiplier.toFixed(1)}x)`);
                }

                // Toxic hit burst: spawn extra particles on damage
                for (let p = 0; p < 4; p++) {
                    const ha = Math.random() * Math.PI * 2;
                    const hx = boss.x + Math.cos(ha) * Phaser.Math.Between(5, 20);
                    const hy = boss.y + Math.sin(ha) * Phaser.Math.Between(5, 20);
                    const hitP = this.scene.add.image(hx, hy, 'dagger-toxic-drop')
                        .setScale(Phaser.Math.FloatBetween(0.5, 0.9))
                        .setAlpha(0.8)
                        .setDepth(155);
                    this.scene.tweens.add({
                        targets: hitP,
                        x: hitP.x + Math.cos(ha) * Phaser.Math.Between(10, 25),
                        y: hitP.y + Math.sin(ha) * Phaser.Math.Between(10, 25),
                        alpha: 0,
                        scale: 0.2,
                        duration: Phaser.Math.Between(150, 300),
                        onComplete: () => hitP.destroy()
                    });
                }
            }

            tickCount++;
        }, charged.tickRate);
    }

    // ---- ULTIMATE ----
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
        const px = this.player.x;
        const py = this.player.y;

        // Void rift: dark pulsing core
        const pulse = this.scene.add.circle(px, py, 16, 0x120018, 0.5).setDepth(175);
        const ring = this.scene.add.circle(px, py, 20, 0x000000, 0)
            .setStrokeStyle(3, 0xc178ff, 0.9)
            .setDepth(176);

        // Additional void rift visual: inner void disc
        const voidDisc = this.scene.add.circle(px, py, 10, 0x2d0045, 0.7).setDepth(175);

        // Outer phase ring
        const outerPhase = this.scene.add.circle(px, py, 28, 0x000000, 0)
            .setStrokeStyle(1.5, 0x9b30ff, 0.6)
            .setDepth(174);

        // Swirling void particles around cast point
        for (let i = 0; i < 10; i++) {
            const a = (Math.PI * 2 * i) / 10;
            const r = Phaser.Math.Between(18, 40);
            const sx = px + Math.cos(a) * r;
            const sy = py + Math.sin(a) * r;
            const spark = this.scene.add.image(sx, sy, 'dagger-void-spark')
                .setScale(Phaser.Math.FloatBetween(0.5, 1.0))
                .setAlpha(0.8)
                .setDepth(177);

            this.scene.tweens.add({
                targets: spark,
                x: px + Math.cos(a + 1.2) * (r * 0.3),
                y: py + Math.sin(a + 1.2) * (r * 0.3),
                alpha: 0,
                scale: 0.1,
                duration: Phaser.Math.Between(120, 220),
                ease: 'Cubic.easeIn',
                onComplete: () => spark.destroy()
            });
        }

        // Shadow wisp ring
        for (let i = 0; i < 5; i++) {
            const a = (Math.PI * 2 * i) / 5 + Math.random() * 0.4;
            const wisp = this.scene.add.image(
                px + Math.cos(a) * 24,
                py + Math.sin(a) * 24,
                'dagger-shadow-wisp'
            ).setScale(0.7).setAlpha(0.6).setDepth(176).setRotation(a);

            this.scene.tweens.add({
                targets: wisp,
                x: px,
                y: py,
                alpha: 0,
                rotation: a + 1.5,
                scale: 0.15,
                duration: Phaser.Math.Between(140, 200),
                onComplete: () => wisp.destroy()
            });
        }

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

        this.scene.tweens.add({
            targets: voidDisc,
            radius: 30,
            alpha: 0,
            duration: 200,
            ease: 'Cubic.easeOut',
            onComplete: () => voidDisc.destroy()
        });

        this.scene.tweens.add({
            targets: outerPhase,
            radius: 68,
            alpha: 0,
            duration: 250,
            ease: 'Sine.easeOut',
            onComplete: () => outerPhase.destroy()
        });
    }

    playPhaseSlip(state, boss) {
        const cfg = this.shadowExecutionConfig;
        const fromX = this.player.x;
        const fromY = this.player.y;
        const dashAngle = Math.atan2(boss.y - fromY, boss.x - fromX);

        const throughX = boss.x + Math.cos(dashAngle) * cfg.dashDistance;
        const throughY = boss.y + Math.sin(dashAngle) * cfg.dashDistance;

        // Enhanced void trail lines
        const backbone = this.scene.add.line(0, 0, fromX, fromY, throughX, throughY, 0xf7dbff, 0.28).setDepth(177);
        backbone.setLineWidth(8, 1.5);

        const edgeA = this.scene.add.line(0, 0, fromX, fromY, throughX, throughY, 0xc785ff, 0.22)
            .setDepth(176)
            .setAngle(-1.2);
        edgeA.setLineWidth(4, 0.5);

        const edgeB = this.scene.add.line(0, 0, fromX, fromY, throughX, throughY, 0xb764ff, 0.2)
            .setDepth(176)
            .setAngle(1.2);
        edgeB.setLineWidth(4, 0.5);

        // Void trail particles using procedural textures along dash path
        for (let i = 0; i < 20; i++) {
            const t = Math.random();
            const trailX = Phaser.Math.Linear(fromX, throughX, t);
            const trailY = Phaser.Math.Linear(fromY, throughY, t);
            const perp = dashAngle + Math.PI * 0.5;
            const offset = (Math.random() - 0.5) * 24;

            const tex = Math.random() > 0.5 ? 'dagger-void-spark' : 'dagger-shadow-wisp';
            const particle = this.scene.add.image(
                trailX + Math.cos(perp) * offset,
                trailY + Math.sin(perp) * offset,
                tex
            ).setScale(Phaser.Math.FloatBetween(0.5, 1.1))
                .setAlpha(Phaser.Math.FloatBetween(0.4, 0.8))
                .setDepth(178)
                .setRotation(dashAngle + Phaser.Math.FloatBetween(-0.5, 0.5));

            this.scene.tweens.add({
                targets: particle,
                alpha: 0,
                scale: 0.1,
                x: particle.x + Math.cos(perp) * Phaser.Math.Between(8, 25) * (Math.random() > 0.5 ? 1 : -1),
                y: particle.y + Math.sin(perp) * Phaser.Math.Between(8, 25) * (Math.random() > 0.5 ? 1 : -1),
                duration: Phaser.Math.Between(150, 320),
                ease: 'Sine.easeOut',
                onComplete: () => particle.destroy()
            });
        }

        // Entry burst with void energy
        const entryBurst = this.scene.add.circle(fromX, fromY, 18, 0x1e0a2d, 0.62).setDepth(179);
        const entryRing = this.scene.add.circle(fromX, fromY, 14, 0xffffff, 0)
            .setStrokeStyle(3, 0xf1dcff, 0.88)
            .setDepth(180);

        // Extra: void collapse at entry point
        const entryVoid = this.scene.add.circle(fromX, fromY, 8, 0x000000, 0.5).setDepth(179);

        const mark = this.scene.add.text(boss.x, boss.y - 2, '\u2715', {
            fontSize: '64px',
            fill: '#f0caff',
            stroke: '#2a0c40',
            strokeThickness: 8,
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(182).setAlpha(0.85);

        this.player.untargetable = true;
        this.player.alpha = 0.15;
        this.scene.cameras.main.zoomTo(1.06, 95, 'Quad.easeOut');

        this.scene.tweens.add({
            targets: entryBurst,
            radius: 64,
            alpha: 0,
            duration: 180,
            ease: 'Cubic.easeOut',
            onComplete: () => entryBurst.destroy()
        });

        this.scene.tweens.add({
            targets: entryRing,
            radius: 78,
            alpha: 0,
            duration: 220,
            ease: 'Sine.easeOut',
            onComplete: () => entryRing.destroy()
        });

        this.scene.tweens.add({
            targets: entryVoid,
            radius: 32,
            alpha: 0,
            duration: 200,
            ease: 'Cubic.easeOut',
            onComplete: () => entryVoid.destroy()
        });

        // Shadow afterimages with more detail along dash path
        this.spawnDashAfterimages(fromX, fromY, throughX, throughY, dashAngle);
        this.spawnDashGhosts(fromX, fromY, throughX, throughY, dashAngle);
        this.spawnDashShards(fromX, fromY, throughX, throughY, dashAngle);

        this.scene.tweens.add({
            targets: this.player,
            x: throughX,
            y: throughY,
            duration: cfg.phaseDuration,
            ease: 'Cubic.easeInOut',
            onComplete: () => {
                this.player.alpha = 1;
                this.scene.cameras.main.zoomTo(1, 150, 'Quad.easeOut');
                this.scene.cameras.main.shake(80, 0.0028);

                // Arrival void burst
                const arrivalBurst = this.scene.add.circle(throughX, throughY, 14, 0x2d0045, 0.5).setDepth(179);
                this.scene.tweens.add({
                    targets: arrivalBurst,
                    radius: 40,
                    alpha: 0,
                    duration: 180,
                    ease: 'Cubic.easeOut',
                    onComplete: () => arrivalBurst.destroy()
                });

                this.playTriCut(state, boss, mark);
            }
        });

        for (const trail of [backbone, edgeA, edgeB]) {
            this.scene.tweens.add({
                targets: trail,
                alpha: 0,
                duration: 240,
                ease: 'Sine.easeOut',
                onComplete: () => trail.destroy()
            });
        }
    }

    spawnDashAfterimages(fromX, fromY, toX, toY, dashAngle) {
        // Detailed shadow afterimages: silhouettes with void core and phase ring
        for (let i = 0; i < 4; i++) {
            const t = (i + 0.5) / 4.5;
            const x = Phaser.Math.Linear(fromX, toX, t);
            const y = Phaser.Math.Linear(fromY, toY, t);

            // Silhouette body
            const body = this.scene.add.circle(x, y, 12, 0x1a0025, 0.4 - i * 0.06).setDepth(177);
            // Inner void core
            const core = this.scene.add.circle(x, y, 5, 0x6a0dad, 0.5 - i * 0.08).setDepth(178);
            // Phase ring
            const ring = this.scene.add.circle(x, y, 16, 0x000000, 0)
                .setStrokeStyle(1.5, 0xc178ff, 0.35 - i * 0.05)
                .setDepth(178);

            // Dagger-shaped slash mark
            const slash = this.scene.add.triangle(x, y, -8, -3, 12, 0, -8, 3, 0xd8b0ff, 0.3 - i * 0.05)
                .setRotation(dashAngle)
                .setDepth(178);

            const visuals = [body, core, ring, slash];
            for (const vis of visuals) {
                this.scene.tweens.add({
                    targets: vis,
                    alpha: 0,
                    scale: 0.4,
                    duration: 200 + i * 35,
                    ease: 'Sine.easeOut',
                    onComplete: () => vis.destroy()
                });
            }
        }
    }

    spawnDashGhosts(fromX, fromY, toX, toY, dashAngle) {
        const cfg = this.shadowExecutionConfig;

        for (let i = 0; i < cfg.dashGhostCount; i++) {
            const t = (i + 1) / (cfg.dashGhostCount + 1);
            const x = Phaser.Math.Linear(fromX, toX, t);
            const y = Phaser.Math.Linear(fromY, toY, t);

            // Enhanced ghost with void core and phase ring
            const ghost = this.scene.add.circle(x, y, 14 - i * 1.2, 0xe5c6ff, 0.25 - i * 0.03)
                .setDepth(178);

            // Void core inside ghost
            const ghostCore = this.scene.add.circle(x, y, 6 - i * 0.5, 0x3d0060, 0.35 - i * 0.04)
                .setDepth(179);

            // Phase ring around ghost
            const ghostRing = this.scene.add.circle(x, y, 18 - i * 1.5, 0x000000, 0)
                .setStrokeStyle(1, 0x9b30ff, 0.22 - i * 0.03)
                .setDepth(178);

            const needle = this.scene.add.rectangle(x, y, 40 - i * 4, 2.6, 0xffffff, 0.36)
                .setDepth(179)
                .setRotation(dashAngle);

            const allGhostParts = [ghost, ghostCore, ghostRing, needle];
            for (const part of allGhostParts) {
                this.scene.tweens.add({
                    targets: part,
                    alpha: 0,
                    scale: part === ghost ? 0.55 : 0.4,
                    duration: (part === needle ? 140 : 180) + i * 26,
                    ease: 'Sine.easeOut',
                    onComplete: () => part.destroy()
                });
            }
        }
    }

    spawnDashShards(fromX, fromY, toX, toY, dashAngle) {
        for (let i = 0; i < 16; i++) {
            const t = Math.random();
            const baseX = Phaser.Math.Linear(fromX, toX, t);
            const baseY = Phaser.Math.Linear(fromY, toY, t);
            const side = (Math.random() - 0.5) * 2;
            const spread = Phaser.Math.Between(8, 30) * side;
            const perp = dashAngle + Math.PI * 0.5;

            // Use procedural phase-shard texture instead of plain rectangles
            const useProcedural = Math.random() > 0.4;
            const sx = baseX + Math.cos(perp) * spread;
            const sy = baseY + Math.sin(perp) * spread;

            let shard;
            if (useProcedural) {
                shard = this.scene.add.image(sx, sy, 'dagger-phase-shard')
                    .setScale(Phaser.Math.FloatBetween(0.6, 1.4))
                    .setAlpha(Phaser.Math.FloatBetween(0.3, 0.7))
                    .setDepth(177)
                    .setRotation(dashAngle + Phaser.Math.FloatBetween(-0.5, 0.5));
            } else {
                shard = this.scene.add.rectangle(
                    sx, sy,
                    Phaser.Math.Between(8, 18),
                    Phaser.Math.Between(1, 3),
                    Phaser.Math.Between(0, 1) > 0.5 ? 0xf8e9ff : 0xc991ff,
                    Phaser.Math.FloatBetween(0.26, 0.62)
                ).setDepth(177).setRotation(dashAngle + Phaser.Math.FloatBetween(-0.5, 0.5));
            }

            this.scene.tweens.add({
                targets: shard,
                x: shard.x + Math.cos(dashAngle) * Phaser.Math.Between(40, 100),
                y: shard.y + Math.sin(dashAngle) * Phaser.Math.Between(40, 100),
                alpha: 0,
                duration: Phaser.Math.Between(140, 260),
                ease: 'Cubic.easeOut',
                onComplete: () => shard.destroy()
            });
        }
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

                // Enhanced slash with void energy
                const slash = this.scene.add.rectangle(boss.x, boss.y, 150, 8, 0xf1d5ff, 0.92)
                    .setRotation(arc)
                    .setDepth(183);

                // Void energy burst per strike (second slash layer)
                const voidSlash = this.scene.add.rectangle(boss.x, boss.y, 130, 5, 0x9b30ff, 0.65)
                    .setRotation(arc)
                    .setDepth(183);

                this.scene.tweens.add({
                    targets: slash,
                    alpha: 0,
                    scaleX: 1.2,
                    duration: 90,
                    onComplete: () => slash.destroy()
                });

                this.scene.tweens.add({
                    targets: voidSlash,
                    alpha: 0,
                    scaleX: 1.4,
                    scaleY: 2.5,
                    duration: 110,
                    onComplete: () => voidSlash.destroy()
                });

                const pop = this.scene.add.circle(hitX, hitY, 10, 0xcca1ff, 0.6).setDepth(184);
                this.scene.tweens.add({
                    targets: pop,
                    radius: 22,
                    alpha: 0,
                    duration: 120,
                    onComplete: () => pop.destroy()
                });

                // Void energy burst ring at each strike position
                const burstRing = this.scene.add.circle(hitX, hitY, 6, 0x000000, 0)
                    .setStrokeStyle(2, 0xc178ff, 0.7)
                    .setDepth(184);
                this.scene.tweens.add({
                    targets: burstRing,
                    radius: 28,
                    alpha: 0,
                    duration: 150,
                    ease: 'Sine.easeOut',
                    onComplete: () => burstRing.destroy()
                });

                // Shadow clone flicker at each strike position
                const clone = this.scene.add.circle(hitX, hitY, 11, 0x1a0025, 0.45).setDepth(182);
                const cloneCore = this.scene.add.circle(hitX, hitY, 4, 0x6a0dad, 0.5).setDepth(183);
                this.scene.tweens.add({
                    targets: clone,
                    alpha: 0,
                    scale: 0.3,
                    duration: 100,
                    onComplete: () => clone.destroy()
                });
                this.scene.tweens.add({
                    targets: cloneCore,
                    alpha: 0,
                    scale: 0.2,
                    duration: 80,
                    onComplete: () => cloneCore.destroy()
                });

                // Void spark burst at strike
                for (let s = 0; s < 5; s++) {
                    const sa = arc + Phaser.Math.FloatBetween(-1.2, 1.2);
                    const sp = this.scene.add.image(
                        boss.x + Math.cos(sa) * 10,
                        boss.y + Math.sin(sa) * 10,
                        'dagger-void-spark'
                    ).setScale(Phaser.Math.FloatBetween(0.6, 1.1)).setAlpha(0.8).setDepth(185);
                    this.scene.tweens.add({
                        targets: sp,
                        x: sp.x + Math.cos(sa) * Phaser.Math.Between(15, 40),
                        y: sp.y + Math.sin(sa) * Phaser.Math.Between(15, 40),
                        alpha: 0,
                        scale: 0.15,
                        duration: Phaser.Math.Between(80, 160),
                        onComplete: () => sp.destroy()
                    });
                }

                // Damage: EXACT SAME as original
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

        // Judgment line (same as original)
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

        // Void collapse visual: dark implosion at boss center
        const voidCollapse = this.scene.add.circle(boss.x, boss.y, 60, 0x0a0010, 0.5).setDepth(189);
        this.scene.tweens.add({
            targets: voidCollapse,
            radius: 12,
            alpha: 0.8,
            duration: 100,
            ease: 'Cubic.easeIn',
            onComplete: () => {
                // Then explode outward
                this.scene.tweens.add({
                    targets: voidCollapse,
                    radius: 100,
                    alpha: 0,
                    duration: 200,
                    ease: 'Cubic.easeOut',
                    onComplete: () => voidCollapse.destroy()
                });
            }
        });

        // Enhanced finisher flash with void energy
        const flash = this.scene.add.circle(boss.x, boss.y, 46, 0x3d1156, 0.55).setDepth(190);
        this.scene.tweens.add({
            targets: flash,
            radius: 130,
            alpha: 0,
            duration: 240,
            onComplete: () => flash.destroy()
        });

        // Expanding void rings
        for (let r = 0; r < 4; r++) {
            const voidRing = this.scene.add.circle(boss.x, boss.y, 20 + r * 5, 0x000000, 0)
                .setStrokeStyle(2.5 - r * 0.4, 0x9b30ff, 0.7 - r * 0.12)
                .setDepth(191);
            this.scene.tweens.add({
                targets: voidRing,
                radius: 70 + r * 30,
                alpha: 0,
                duration: 200 + r * 50,
                ease: 'Sine.easeOut',
                onComplete: () => voidRing.destroy()
            });
        }

        // Judgment mark explosion: burst of phase shards and void sparks
        for (let p = 0; p < 14; p++) {
            const ea = (Math.PI * 2 * p) / 14;
            const tex = p % 3 === 0 ? 'dagger-phase-shard' : (p % 3 === 1 ? 'dagger-void-spark' : 'dagger-shadow-wisp');
            const explP = this.scene.add.image(boss.x, boss.y, tex)
                .setScale(Phaser.Math.FloatBetween(0.7, 1.4))
                .setAlpha(0.85)
                .setDepth(192)
                .setRotation(ea);
            this.scene.tweens.add({
                targets: explP,
                x: boss.x + Math.cos(ea) * Phaser.Math.Between(40, 90),
                y: boss.y + Math.sin(ea) * Phaser.Math.Between(40, 90),
                alpha: 0,
                scale: 0.1,
                rotation: ea + Phaser.Math.FloatBetween(-1, 1),
                duration: Phaser.Math.Between(180, 350),
                ease: 'Cubic.easeOut',
                onComplete: () => explP.destroy()
            });
        }

        // Damage: EXACT SAME as original
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

            // Enhanced escape seam with void energy
            const seam = this.scene.add.circle(this.player.x, this.player.y, 22, 0x1d0630, 0.42).setDepth(179);
            this.scene.tweens.add({
                targets: seam,
                radius: 52,
                alpha: 0,
                duration: 260,
                ease: 'Sine.easeOut',
                onComplete: () => seam.destroy()
            });

            // Extra: void ripple at escape landing
            const escapeRipple = this.scene.add.circle(this.player.x, this.player.y, 10, 0x000000, 0)
                .setStrokeStyle(2, 0x9b30ff, 0.5)
                .setDepth(179);
            this.scene.tweens.add({
                targets: escapeRipple,
                radius: 38,
                alpha: 0,
                duration: 300,
                ease: 'Sine.easeOut',
                onComplete: () => escapeRipple.destroy()
            });

            // Scatter void sparks at landing
            for (let k = 0; k < 6; k++) {
                const ka = Math.random() * Math.PI * 2;
                const kp = this.scene.add.image(
                    this.player.x + Math.cos(ka) * 8,
                    this.player.y + Math.sin(ka) * 8,
                    'dagger-void-spark'
                ).setScale(0.7).setAlpha(0.6).setDepth(180);
                this.scene.tweens.add({
                    targets: kp,
                    x: kp.x + Math.cos(ka) * Phaser.Math.Between(15, 35),
                    y: kp.y + Math.sin(ka) * Phaser.Math.Between(15, 35),
                    alpha: 0,
                    scale: 0.1,
                    duration: Phaser.Math.Between(120, 250),
                    onComplete: () => kp.destroy()
                });
            }

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

    // ---- Particle helper methods ----

    spawnVoidSpark(x, y, angle) {
        const spark = this.scene.add.image(
            x + Phaser.Math.Between(-4, 4),
            y + Phaser.Math.Between(-4, 4),
            'dagger-void-spark'
        ).setDepth(157)
            .setScale(Phaser.Math.FloatBetween(0.45, 1.0))
            .setAlpha(0.8);

        const drift = angle + Phaser.Math.FloatBetween(-0.55, 0.55);
        this.scene.tweens.add({
            targets: spark,
            x: spark.x + Math.cos(drift) * Phaser.Math.Between(10, 30),
            y: spark.y + Math.sin(drift) * Phaser.Math.Between(10, 30),
            alpha: 0,
            scale: 0.12,
            duration: Phaser.Math.Between(90, 210),
            onComplete: () => spark.destroy()
        });
    }

    spawnShadowWisp(x, y, angle) {
        const wisp = this.scene.add.image(
            x + Phaser.Math.Between(-3, 3),
            y + Phaser.Math.Between(-3, 3),
            'dagger-shadow-wisp'
        ).setDepth(155)
            .setScale(Phaser.Math.FloatBetween(0.4, 0.9))
            .setAlpha(0.65)
            .setRotation(angle);

        const drift = angle + Phaser.Math.FloatBetween(-0.7, 0.7);
        this.scene.tweens.add({
            targets: wisp,
            x: wisp.x + Math.cos(drift) * Phaser.Math.Between(12, 32),
            y: wisp.y + Math.sin(drift) * Phaser.Math.Between(12, 32),
            alpha: 0,
            scale: 0.15,
            rotation: wisp.rotation + Phaser.Math.FloatBetween(-0.8, 0.8),
            duration: Phaser.Math.Between(120, 260),
            onComplete: () => wisp.destroy()
        });
    }

    spawnVoidMuzzleBurst(x, y, angle) {
        for (let i = 0; i < 6; i++) {
            const dir = angle + Phaser.Math.FloatBetween(-0.6, 0.6);
            const tex = i % 2 === 0 ? 'dagger-void-spark' : 'dagger-shadow-wisp';
            const burst = this.scene.add.image(x, y, tex)
                .setScale(Phaser.Math.FloatBetween(0.4, 0.85))
                .setAlpha(0.75)
                .setDepth(160)
                .setRotation(dir);

            this.scene.tweens.add({
                targets: burst,
                x: x + Math.cos(dir) * Phaser.Math.Between(8, 22),
                y: y + Math.sin(dir) * Phaser.Math.Between(8, 22),
                alpha: 0,
                scale: 0.1,
                duration: Phaser.Math.Between(80, 160),
                onComplete: () => burst.destroy()
            });
        }
    }
}
