// GreatswordWeapon.js - Tectonic Wrath: earth-shaking seismic power with magma veins
import { WeaponBase } from './WeaponBase.js';
import { WEAPONS } from './weaponData.js';

export class GreatswordWeapon extends WeaponBase {
    constructor(scene, player) {
        super(scene, player, WEAPONS.GREATSWORD);
        this.ensureProceduralTextures();
        this.ultimateState = null;
        this.worldsplitterConfig = {
            anchorDuration: 420,
            armorReduction: 0.6,
            pullRadius: 210,
            pullStrength: 0.12,
            cleaveLength: 620,
            cleaveWidth: 190,
            mainDamage: 210,
            aftershockDamage: 80,
            aftershockDelay: 180,
            aftershockSpacing: 120,
            vulnerabilityMultiplier: 1.2,
            vulnerabilityDuration: 2500
        };
    }

    ensureProceduralTextures() {
        // Magma ember - orange-red gradient circle with glow stroke
        if (!this.scene.textures.exists('gs-magma-ember')) {
            const g = this.scene.add.graphics();
            g.fillGradientStyle(0xffcc44, 0xff6611, 0xcc3300, 0x881100, 1);
            g.fillCircle(6, 6, 5);
            g.lineStyle(1.2, 0xffaa33, 0.9);
            g.strokeCircle(6, 6, 5.6);
            g.generateTexture('gs-magma-ember', 12, 12);
            g.destroy();
        }

        // Rock shard - brown-amber gradient triangle with edge
        if (!this.scene.textures.exists('gs-rock-shard')) {
            const g = this.scene.add.graphics();
            g.fillGradientStyle(0x8b6914, 0x6b4c0a, 0xcc8833, 0x3d2b05, 1);
            g.fillTriangle(8, 1, 14, 15, 2, 15);
            g.lineStyle(1.2, 0xddaa55, 0.85);
            g.strokeTriangle(8, 1, 14, 15, 2, 15);
            g.generateTexture('gs-rock-shard', 16, 16);
            g.destroy();
        }

        // Dust mote - beige-tan gradient circle, softer
        if (!this.scene.textures.exists('gs-dust-mote')) {
            const g = this.scene.add.graphics();
            g.fillGradientStyle(0xddc9a0, 0xbba878, 0x998860, 0x776644, 0.85);
            g.fillCircle(5, 5, 4.2);
            g.generateTexture('gs-dust-mote', 10, 10);
            g.destroy();
        }

        // Seismic spark - bright orange-white cross-shaped spark
        if (!this.scene.textures.exists('gs-seismic-spark')) {
            const g = this.scene.add.graphics();
            g.fillStyle(0xffffff, 1);
            g.fillRect(3, 0, 2, 8);
            g.fillRect(0, 3, 8, 2);
            g.fillStyle(0xffaa33, 0.9);
            g.fillRect(2, 1, 4, 6);
            g.fillRect(1, 2, 6, 4);
            g.fillStyle(0xffeedd, 1);
            g.fillCircle(4, 4, 1.5);
            g.generateTexture('gs-seismic-spark', 8, 8);
            g.destroy();
        }
    }

    getUltimatePreviewConfig() {
        const cfg = this.worldsplitterConfig;
        return {
            targeting: 'line',
            maxRange: cfg.cleaveLength,
            width: cfg.cleaveWidth
        };
    }

    // ─── Helper particle methods ───────────────────────────────────────

    spawnMagmaEmber(x, y, angle) {
        const ember = this.scene.add.image(
            x + Phaser.Math.Between(-4, 4),
            y + Phaser.Math.Between(-4, 4),
            'gs-magma-ember'
        ).setDepth(155).setScale(Phaser.Math.FloatBetween(0.5, 1.1)).setAlpha(0.9);

        const drift = angle + Phaser.Math.FloatBetween(-0.7, 0.7);
        const dist = Phaser.Math.Between(14, 42);
        this.scene.tweens.add({
            targets: ember,
            x: ember.x + Math.cos(drift) * dist,
            y: ember.y + Math.sin(drift) * dist - Phaser.Math.Between(4, 14),
            alpha: 0,
            scale: 0.15,
            duration: Phaser.Math.Between(180, 360),
            ease: 'Cubic.easeOut',
            onComplete: () => ember.destroy()
        });
    }

    spawnRockDebris(x, y, angle) {
        const shard = this.scene.add.image(
            x + Phaser.Math.Between(-6, 6),
            y + Phaser.Math.Between(-6, 6),
            'gs-rock-shard'
        ).setDepth(154).setScale(Phaser.Math.FloatBetween(0.4, 1.0))
         .setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2)).setAlpha(0.85);

        const drift = angle + Phaser.Math.FloatBetween(-0.5, 0.5);
        const dist = Phaser.Math.Between(18, 55);
        const gravity = Phaser.Math.FloatBetween(0.6, 1.4);
        const startVy = -Phaser.Math.Between(12, 32);
        const startTime = this.scene.time.now;
        const duration = Phaser.Math.Between(280, 500);
        const startX = shard.x;
        const startY = shard.y;
        const vx = Math.cos(drift) * dist;

        this.scene.tweens.add({
            targets: shard,
            alpha: 0,
            rotation: shard.rotation + Phaser.Math.FloatBetween(-2, 2),
            duration: duration,
            ease: 'Linear',
            onUpdate: (tween) => {
                const p = tween.progress;
                const t = p * (duration / 16.67);
                shard.x = startX + vx * p;
                shard.y = startY + startVy * p + 0.5 * gravity * t * p * 40;
            },
            onComplete: () => shard.destroy()
        });
    }

    spawnSeismicDust(x, y) {
        const mote = this.scene.add.image(
            x + Phaser.Math.Between(-8, 8),
            y + Phaser.Math.Between(-4, 4),
            'gs-dust-mote'
        ).setDepth(142).setScale(Phaser.Math.FloatBetween(0.4, 0.9)).setAlpha(0.55);

        this.scene.tweens.add({
            targets: mote,
            y: mote.y - Phaser.Math.Between(16, 40),
            x: mote.x + Phaser.Math.FloatBetween(-8, 8),
            alpha: 0,
            scale: Phaser.Math.FloatBetween(0.1, 0.35),
            duration: Phaser.Math.Between(350, 650),
            ease: 'Sine.easeOut',
            onComplete: () => mote.destroy()
        });
    }

    drawTectonicCrack(graphics, x1, y1, x2, y2) {
        const segments = 10;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        const perpX = -dy / len;
        const perpY = dx / len;

        // Magma fill - orange jagged path
        graphics.fillStyle(0xff6622, 0.55);
        graphics.beginPath();
        const topPoints = [];
        const botPoints = [];
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const bx = Phaser.Math.Linear(x1, x2, t);
            const by = Phaser.Math.Linear(y1, y2, t);
            const jagTop = (i === 0 || i === segments) ? 0 : (Math.sin(i * 2.3 + 0.7) * 6 + Phaser.Math.FloatBetween(-2, 2));
            const jagBot = (i === 0 || i === segments) ? 0 : (Math.sin(i * 1.9 + 1.4) * 5 + Phaser.Math.FloatBetween(-2, 2));
            const width = (i === 0 || i === segments) ? 0.5 : Phaser.Math.FloatBetween(2, 5);
            topPoints.push({ x: bx + perpX * (width + jagTop), y: by + perpY * (width + jagTop) });
            botPoints.push({ x: bx - perpX * (width + jagBot), y: by - perpY * (width + jagBot) });
        }
        graphics.moveTo(topPoints[0].x, topPoints[0].y);
        for (let i = 1; i < topPoints.length; i++) {
            graphics.lineTo(topPoints[i].x, topPoints[i].y);
        }
        for (let i = botPoints.length - 1; i >= 0; i--) {
            graphics.lineTo(botPoints[i].x, botPoints[i].y);
        }
        graphics.closePath();
        graphics.fillPath();

        // Crack edges
        graphics.lineStyle(1.8, 0xffcc66, 0.7);
        graphics.beginPath();
        graphics.moveTo(topPoints[0].x, topPoints[0].y);
        for (let i = 1; i < topPoints.length; i++) {
            graphics.lineTo(topPoints[i].x, topPoints[i].y);
        }
        graphics.strokePath();

        graphics.beginPath();
        graphics.moveTo(botPoints[0].x, botPoints[0].y);
        for (let i = 1; i < botPoints.length; i++) {
            graphics.lineTo(botPoints[i].x, botPoints[i].y);
        }
        graphics.strokePath();

        // Central hot line
        graphics.lineStyle(1.2, 0xffeeaa, 0.6);
        graphics.beginPath();
        graphics.moveTo(x1, y1);
        for (let i = 1; i <= segments; i++) {
            const t = i / segments;
            const bx = Phaser.Math.Linear(x1, x2, t);
            const by = Phaser.Math.Linear(y1, y2, t);
            const jag = (i === segments) ? 0 : Math.sin(i * 3.1) * 3;
            graphics.lineTo(bx + perpX * jag, by + perpY * jag);
        }
        graphics.strokePath();
    }

    // ─── Basic attack - animated crescent shockwave ────────────────────

    fire(angle) {
        const data = this.data.projectile;
        const startX = this.player.x + Math.cos(angle) * 30;
        const startY = this.player.y + Math.sin(angle) * 30;

        this.createMuzzleFlash(startX, startY, this.data.color);

        const wave = this.scene.add.container(startX, startY).setDepth(150);
        this.createSmoothWaveVisual(wave, angle, data);

        wave.vx = Math.cos(angle) * data.speed;
        wave.vy = Math.sin(angle) * data.speed;
        wave.damage = data.damage;
        wave.range = data.range;
        wave.startX = startX;
        wave.startY = startY;
        wave.knockback = false;
        wave.knockbackForce = 0;
        wave.heavyKnockback = false;
        wave.lifeTick = 0;

        wave.update = () => {
            wave.lifeTick += 0.35;

            // Tremor pulse oscillation on the wave
            const tremorScale = 1 + Math.sin(wave.lifeTick * 2.8) * 0.06;
            wave.setScale(tremorScale, tremorScale);

            // Ground dust particles during flight
            if (Math.random() > 0.55) {
                this.spawnSeismicDust(wave.x, wave.y);
            }

            // Rock debris trailing behind
            if (Math.random() > 0.72) {
                this.spawnRockDebris(wave.x, wave.y, angle + Math.PI);
            }

            // Magma embers from the wave
            if (Math.random() > 0.65) {
                this.spawnMagmaEmber(wave.x, wave.y, angle + Math.PI);
            }
        };

        this.scene.projectiles.push(wave);
        this.addTrail(wave, data.color, data.size);
    }

    createSmoothWaveVisual(wave, angle, data) {
        // Layer 1: seismic dust cloud background
        const dustCloud = this.scene.add.graphics();
        dustCloud.fillStyle(0x8b7355, 0.15);
        dustCloud.fillCircle(0, 0, data.size * 3.2);
        dustCloud.fillStyle(0x6b5535, 0.1);
        dustCloud.fillCircle(Math.cos(angle) * 4, Math.sin(angle) * 4, data.size * 2.6);

        // Layer 2: arc wave (main crescent)
        const arc = this.scene.add.graphics();
        arc.lineStyle(5, data.color, 0.85);
        arc.beginPath();
        arc.arc(0, 0, data.size * 2.6, -0.85, 0.85);
        arc.strokePath();
        // Secondary seismic ripple arc
        arc.lineStyle(2.5, 0xff8833, 0.45);
        arc.beginPath();
        arc.arc(0, 0, data.size * 3.0, -0.65, 0.65);
        arc.strokePath();
        arc.rotation = angle;

        // Layer 3: inner glow arc
        const innerGlow = this.scene.add.graphics();
        innerGlow.lineStyle(9, 0xffc47a, 0.28);
        innerGlow.beginPath();
        innerGlow.arc(0, 0, data.size * 2.1, -0.7, 0.7);
        innerGlow.strokePath();
        // Magma vein inner glow
        innerGlow.lineStyle(3, 0xff5511, 0.35);
        innerGlow.beginPath();
        innerGlow.arc(0, 0, data.size * 1.7, -0.55, 0.55);
        innerGlow.strokePath();
        innerGlow.rotation = angle;

        // Layer 4: blade shard
        const bladeShard = this.scene.add.triangle(
            Math.cos(angle) * data.size * 2.25,
            Math.sin(angle) * data.size * 2.25,
            0, -6,
            22, 0,
            0, 6,
            0xffd299,
            0.75
        );
        bladeShard.rotation = angle;

        // Layer 5: magma core at center of arc
        const magmaCore = this.scene.add.graphics();
        magmaCore.fillStyle(0xff6622, 0.5);
        magmaCore.fillCircle(0, 0, data.size * 0.9);
        magmaCore.fillStyle(0xffaa44, 0.65);
        magmaCore.fillCircle(0, 0, data.size * 0.5);
        magmaCore.fillStyle(0xffddaa, 0.8);
        magmaCore.fillCircle(0, 0, data.size * 0.2);

        wave.add([dustCloud, innerGlow, arc, magmaCore, bladeShard]);

        // Breathing animation for smoother feel
        this.scene.tweens.add({
            targets: [arc, innerGlow],
            alpha: { from: 0.9, to: 0.55 },
            duration: 120,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.scene.tweens.add({
            targets: bladeShard,
            scaleX: 1.25,
            scaleY: 0.88,
            alpha: { from: 0.8, to: 0.45 },
            duration: 150,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Dust cloud pulsing
        this.scene.tweens.add({
            targets: dustCloud,
            alpha: { from: 0.18, to: 0.06 },
            scaleX: { from: 1.0, to: 1.15 },
            scaleY: { from: 1.0, to: 1.15 },
            duration: 180,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Magma core flicker
        this.scene.tweens.add({
            targets: magmaCore,
            alpha: { from: 0.7, to: 0.35 },
            scaleX: { from: 1.0, to: 1.2 },
            scaleY: { from: 1.0, to: 1.2 },
            duration: 100,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    // ─── Charged attack - Colossus Breaker (directional finisher) ──────

    executeChargedAttack(angle) {
        const charged = this.data.charged;

        const startX = this.player.x;
        const startY = this.player.y;
        const targetPoint = this.getClampedChargedTarget(
            startX + Math.cos(angle) * charged.maxRange,
            startY + Math.sin(angle) * charged.maxRange
        );

        const pathLine = new Phaser.Geom.Line(startX, startY, targetPoint.x, targetPoint.y);
        this.createColossusBreakerFX(pathLine, angle, charged);

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
            const nearest = Phaser.Geom.Line.GetNearestPoint(pathLine, { x: boss.x, y: boss.y });
            const distToPath = Phaser.Math.Distance.Between(boss.x, boss.y, nearest.x, nearest.y);

            if (distToPath <= charged.radius) {
                const critChance = Phaser.Math.Clamp((this.player.critChanceBonus || 0), 0, 0.6);
            const critMultiplier = Math.random() < critChance ? 2 : 1;
            const finalDamage = charged.damage * (this.player.damageMultiplier || 1.0) * (this.player.passiveDamageMultiplier || 1.0) * critMultiplier;
                boss.takeDamage(finalDamage);
                this.gainUltimateGaugeFromDamage(finalDamage, { charged: true });

                if (charged.stun) {
                    boss.stunned = true;
                    boss.setTint(0xffc266);
                    this.scene.time.delayedCall(charged.stunDuration, () => {
                        if (!boss.scene) return;
                        boss.stunned = false;
                        boss.clearTint();
                    });
                }

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

    createColossusBreakerFX(pathLine, angle, charged) {
        const width = charged.radius * 2;
        const length = Phaser.Geom.Line.Length(pathLine);
        const cx = (pathLine.x1 + pathLine.x2) * 0.5;
        const cy = (pathLine.y1 + pathLine.y2) * 0.5;

        // Multi-layer trail: magma core
        const trailCore = this.scene.add.rectangle(cx, cy, length, width * 0.72, 0xffb566, 0.2)
            .setRotation(angle)
            .setDepth(145);

        // Seismic edge layer
        const trailEdge = this.scene.add.rectangle(cx, cy, length, width * 1.05, 0xffa13d, 0)
            .setStrokeStyle(3, 0xffd9a3, 0.65)
            .setRotation(angle)
            .setDepth(144);

        // Magma inner trail
        const magmaTrail = this.scene.add.rectangle(cx, cy, length, width * 0.3, 0xff5511, 0.35)
            .setRotation(angle)
            .setDepth(146);

        // Tectonic crack graphics drawn along the path
        const crackGraphics = this.scene.add.graphics().setDepth(147);
        this.drawTectonicCrack(crackGraphics, pathLine.x1, pathLine.y1, pathLine.x2, pathLine.y2);

        const sweep = this.scene.add.graphics().setDepth(148);
        sweep.lineStyle(7, 0xffe3be, 0.85);
        sweep.beginPath();
        sweep.arc(pathLine.x1, pathLine.y1, 34, angle - 0.9, angle + 0.9);
        sweep.strokePath();
        // Additional seismic sweep ring
        sweep.lineStyle(3, 0xff8833, 0.5);
        sweep.beginPath();
        sweep.arc(pathLine.x1, pathLine.y1, 44, angle - 0.7, angle + 0.7);
        sweep.strokePath();

        // Impact ring with expanding tectonic sigil
        const impactRing = this.scene.add.circle(pathLine.x2, pathLine.y2, 28, 0xffc680, 0)
            .setStrokeStyle(3, 0xffe4c0, 0.9)
            .setDepth(148);

        // Ground rupture visual at endpoint
        const ruptureGraphics = this.scene.add.graphics().setDepth(147);
        const rupR = 36;
        for (let i = 0; i < 6; i++) {
            const a = (Math.PI * 2 * i) / 6 + angle * 0.5;
            const rLen = Phaser.Math.Between(18, rupR);
            ruptureGraphics.lineStyle(2, 0xff8833, 0.65);
            ruptureGraphics.beginPath();
            ruptureGraphics.moveTo(pathLine.x2, pathLine.y2);
            const midX = pathLine.x2 + Math.cos(a) * rLen * 0.5 + Phaser.Math.FloatBetween(-4, 4);
            const midY = pathLine.y2 + Math.sin(a) * rLen * 0.5 + Phaser.Math.FloatBetween(-4, 4);
            ruptureGraphics.lineTo(midX, midY);
            ruptureGraphics.lineTo(pathLine.x2 + Math.cos(a) * rLen, pathLine.y2 + Math.sin(a) * rLen);
            ruptureGraphics.strokePath();
        }
        ruptureGraphics.fillStyle(0xff6622, 0.3);
        ruptureGraphics.fillCircle(pathLine.x2, pathLine.y2, 16);

        this.scene.tweens.add({
            targets: [trailCore, trailEdge, magmaTrail],
            alpha: 0,
            scaleY: 1.22,
            duration: 240,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                trailCore.destroy();
                trailEdge.destroy();
                magmaTrail.destroy();
            }
        });

        this.scene.tweens.add({
            targets: [crackGraphics, ruptureGraphics],
            alpha: 0,
            duration: 340,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                crackGraphics.destroy();
                ruptureGraphics.destroy();
            }
        });

        this.scene.tweens.add({
            targets: sweep,
            alpha: 0,
            angle: 24,
            duration: 230,
            ease: 'Sine.easeOut',
            onComplete: () => sweep.destroy()
        });

        this.scene.tweens.add({
            targets: impactRing,
            alpha: 0,
            scale: 1.8,
            duration: 280,
            ease: 'Cubic.easeOut',
            onComplete: () => impactRing.destroy()
        });

        // Magma ember particles erupting from the path
        for (let i = 0; i < 14; i++) {
            const t = i / 13;
            const px = Phaser.Math.Linear(pathLine.x1, pathLine.x2, t);
            const py = Phaser.Math.Linear(pathLine.y1, pathLine.y2, t);
            this.spawnMagmaEmber(px, py, angle + Math.PI * 0.5);
            if (Math.random() > 0.4) {
                this.spawnMagmaEmber(px, py, angle - Math.PI * 0.5);
            }
        }

        // Seismic dust cloud rising along trail
        for (let i = 0; i < 10; i++) {
            const t = i / 9;
            const px = Phaser.Math.Linear(pathLine.x1, pathLine.x2, t);
            const py = Phaser.Math.Linear(pathLine.y1, pathLine.y2, t);
            this.spawnSeismicDust(px, py);
        }

        // Rock debris along path
        for (let i = 0; i < 8; i++) {
            const t = Math.random();
            const px = Phaser.Math.Linear(pathLine.x1, pathLine.x2, t);
            const py = Phaser.Math.Linear(pathLine.y1, pathLine.y2, t);
            this.spawnRockDebris(px, py, angle + Phaser.Math.FloatBetween(-0.8, 0.8));
        }

        // Soft slash embers along path (original, kept)
        for (let i = 0; i < 9; i++) {
            const t = i / 8;
            const px = Phaser.Math.Linear(pathLine.x1, pathLine.x2, t);
            const py = Phaser.Math.Linear(pathLine.y1, pathLine.y2, t);
            const ember = this.scene.add.circle(px, py, Phaser.Math.FloatBetween(2, 4), 0xffca8a, 0.65).setDepth(149);

            this.scene.tweens.add({
                targets: ember,
                x: px + Math.cos(angle + Math.PI / 2) * Phaser.Math.Between(-12, 12),
                y: py + Math.sin(angle + Math.PI / 2) * Phaser.Math.Between(-12, 12),
                alpha: 0,
                scale: 0.35,
                duration: Phaser.Math.Between(140, 240),
                onComplete: () => ember.destroy()
            });
        }
    }

    // ─── Ultimate charge ───────────────────────────────────────────────

    startUltimateCharge(targetX, targetY) {
        if (this.ultimateState || !this.canUseUltimate()) return false;

        const aimX = targetX ?? this.player.x + 1;
        const aimY = targetY ?? this.player.y;
        const angle = Math.atan2(aimY - this.player.y, aimX - this.player.x);

        const sigil = this.scene.add.graphics().setDepth(188);
        const anchorGlow = this.scene.add.circle(this.player.x, this.player.y, 26, 0x3b1f06, 0.42).setDepth(186);
        const anchorRing = this.scene.add.circle(this.player.x, this.player.y, 30, 0x000000, 0)
            .setStrokeStyle(3, 0xffd7a6, 0.72)
            .setDepth(187);

        // Particle emitters for charge phase
        const chargeEmbers = this.scene.add.particles(this.player.x, this.player.y, 'gs-magma-ember', {
            speed: { min: 20, max: 65 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.8, end: 0 },
            alpha: { start: 0.85, end: 0 },
            lifespan: { min: 400, max: 800 },
            frequency: 45,
            quantity: 2,
            blendMode: 'ADD',
            emitting: true
        }).setDepth(189);

        const chargeRocks = this.scene.add.particles(this.player.x, this.player.y, 'gs-rock-shard', {
            speed: { min: 15, max: 50 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.7, end: 0 },
            alpha: { start: 0.75, end: 0 },
            lifespan: { min: 350, max: 700 },
            frequency: 80,
            quantity: 1,
            gravityY: -20,
            emitting: true
        }).setDepth(188);

        // Ground tremor cracks graphics
        const tremorGraphics = this.scene.add.graphics().setDepth(185);

        this.ultimateState = {
            phase: 'anchor',
            startedAt: this.scene.time.now,
            targetX: aimX,
            targetY: aimY,
            angle,
            sigil,
            anchorGlow,
            anchorRing,
            chargeEmbers,
            chargeRocks,
            tremorGraphics,
            timers: []
        };

        return true;
    }

    updateUltimate(time, delta, targetX, targetY) {
        const state = this.ultimateState;
        if (!state || state.phase !== 'anchor') return;

        state.targetX = targetX ?? state.targetX;
        state.targetY = targetY ?? state.targetY;

        const clamped = this.getClampedChargedTarget(state.targetX, state.targetY);
        state.targetX = clamped.x;
        state.targetY = clamped.y;
        state.angle = Math.atan2(state.targetY - this.player.y, state.targetX - this.player.x);

        const cfg = this.worldsplitterConfig;
        const pulse = 1 + Math.sin(time * 0.015) * 0.12;
        const spin = time * 0.0026;

        // Update particle emitter positions
        state.chargeEmbers?.setPosition?.(this.player.x, this.player.y);
        state.chargeRocks?.setPosition?.(this.player.x, this.player.y);

        // Draw enhanced sigil with tectonic crack patterns
        state.sigil.clear();

        // Outer tectonic circles
        state.sigil.lineStyle(3, 0xffbe6e, 0.52);
        state.sigil.strokeCircle(this.player.x, this.player.y, 52 * pulse);
        state.sigil.lineStyle(2, 0xffe0ba, 0.45);
        state.sigil.strokeCircle(this.player.x, this.player.y, 78 * pulse);

        // Tectonic crack pattern on sigil (radial cracks)
        state.sigil.lineStyle(1.5, 0xff7733, 0.4);
        for (let i = 0; i < 8; i++) {
            const a = spin * 0.7 + (Math.PI * 2 * i) / 8;
            const innerR = 30 * pulse;
            const outerR = 70 * pulse;
            const midR = (innerR + outerR) * 0.5;
            const jag = Math.sin(i * 2.7 + time * 0.003) * 5;
            state.sigil.beginPath();
            state.sigil.moveTo(
                this.player.x + Math.cos(a) * innerR,
                this.player.y + Math.sin(a) * innerR
            );
            state.sigil.lineTo(
                this.player.x + Math.cos(a + 0.08) * midR + jag,
                this.player.y + Math.sin(a + 0.08) * midR
            );
            state.sigil.lineTo(
                this.player.x + Math.cos(a) * outerR,
                this.player.y + Math.sin(a) * outerR
            );
            state.sigil.strokePath();
        }

        // Spinning arc segments
        state.sigil.lineStyle(2.2, 0xffb45a, 0.72);
        state.sigil.beginPath();
        state.sigil.arc(this.player.x, this.player.y, 64, spin, spin + 1.5);
        state.sigil.strokePath();
        state.sigil.beginPath();
        state.sigil.arc(this.player.x, this.player.y, 64, spin + Math.PI, spin + Math.PI + 1.5);
        state.sigil.strokePath();

        // Magma glow arc
        state.sigil.lineStyle(1.8, 0xff5511, 0.35);
        state.sigil.beginPath();
        state.sigil.arc(this.player.x, this.player.y, 58 * pulse, spin + 0.5, spin + 2.0);
        state.sigil.strokePath();

        // Aim line and target
        state.sigil.lineStyle(2.4, 0xffefcf, 0.7);
        state.sigil.lineBetween(this.player.x, this.player.y, state.targetX, state.targetY);
        state.sigil.strokeCircle(state.targetX, state.targetY, 15 + Math.sin(time * 0.018) * 3);

        // Ground tremor visual - pulsing cracks radiating outward
        state.tremorGraphics.clear();
        const tremorPulse = 0.5 + Math.abs(Math.sin(time * 0.008)) * 0.5;
        state.tremorGraphics.lineStyle(1.5, 0x8b6633, 0.3 * tremorPulse);
        for (let i = 0; i < 6; i++) {
            const a = (Math.PI * 2 * i) / 6 + time * 0.001;
            const r = 40 + tremorPulse * 50;
            const jx = Math.sin(i * 3.1 + time * 0.004) * 6;
            state.tremorGraphics.beginPath();
            state.tremorGraphics.moveTo(this.player.x, this.player.y);
            state.tremorGraphics.lineTo(
                this.player.x + Math.cos(a) * r * 0.5 + jx,
                this.player.y + Math.sin(a) * r * 0.5
            );
            state.tremorGraphics.lineTo(
                this.player.x + Math.cos(a) * r,
                this.player.y + Math.sin(a) * r + jx * 0.5
            );
            state.tremorGraphics.strokePath();
        }

        // Rising dust/rock visuals during charge
        if (Math.random() > 0.75) {
            this.spawnSeismicDust(
                this.player.x + Phaser.Math.Between(-40, 40),
                this.player.y + Phaser.Math.Between(-40, 40)
            );
        }

        state.anchorGlow.setRadius(24 + Math.sin(time * 0.018) * 4);
        state.anchorGlow.setAlpha(0.34 + (Math.sin(time * 0.022) + 1) * 0.1);
        state.anchorRing.setRadius(28 + Math.sin(time * 0.012) * 5);

        const boss = this.scene.boss;
        if (boss?.scene) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, boss.x, boss.y);
            if (dist <= cfg.pullRadius) {
                const dir = Math.atan2(this.player.y - boss.y, this.player.x - boss.x);
                boss.x += Math.cos(dir) * cfg.pullStrength;
                boss.y += Math.sin(dir) * cfg.pullStrength;
            }
        }
    }

    // ─── Ultimate release ──────────────────────────────────────────────

    releaseUltimate(targetX, targetY) {
        const state = this.ultimateState;
        if (!state || state.phase !== 'anchor') return false;

        if (!this.consumeUltimate()) {
            this.destroyUltimateState();
            return false;
        }

        const cfg = this.worldsplitterConfig;
        state.phase = 'release';

        // Stop charge emitters
        state.chargeEmbers?.stop?.();
        state.chargeRocks?.stop?.();

        state.targetX = targetX ?? state.targetX;
        state.targetY = targetY ?? state.targetY;
        const clamped = this.getClampedChargedTarget(state.targetX, state.targetY);
        state.targetX = clamped.x;
        state.targetY = clamped.y;
        state.angle = Math.atan2(state.targetY - this.player.y, state.targetX - this.player.x);

        const oldReduction = this.player.damageReduction || 0;
        this.player.damageReduction = Math.max(oldReduction, cfg.armorReduction);

        const preBurst = this.scene.add.circle(this.player.x, this.player.y, 24, 0x3a1900, 0.55).setDepth(189);
        const preRing = this.scene.add.circle(this.player.x, this.player.y, 28, 0x000000, 0)
            .setStrokeStyle(4, 0xffd9ad, 0.82)
            .setDepth(190);

        // Seismic burst of magma embers on release
        for (let i = 0; i < 12; i++) {
            const a = (Math.PI * 2 * i) / 12;
            this.spawnMagmaEmber(this.player.x, this.player.y, a);
            this.spawnRockDebris(this.player.x, this.player.y, a);
        }

        this.scene.tweens.add({
            targets: preBurst,
            radius: 82,
            alpha: 0,
            duration: cfg.anchorDuration,
            ease: 'Cubic.easeOut',
            onComplete: () => preBurst.destroy()
        });

        this.scene.tweens.add({
            targets: preRing,
            radius: 110,
            alpha: 0,
            duration: cfg.anchorDuration,
            ease: 'Sine.easeOut',
            onComplete: () => preRing.destroy()
        });

        this.scene.tweens.add({
            targets: this.player,
            scaleX: 0.92,
            scaleY: 1.12,
            duration: cfg.anchorDuration * 0.48,
            yoyo: true,
            ease: 'Sine.easeInOut'
        });

        const anchorTimer = this.scene.time.delayedCall(cfg.anchorDuration, () => {
            if (!this.ultimateState) return;
            this.player.damageReduction = oldReduction;
            this.executeWorldsplitter(state.angle);
        });

        state.timers.push(anchorTimer);
        return true;
    }

    // ─── Ultimate execute - Worldsplitter ──────────────────────────────

    executeWorldsplitter(angle) {
        const cfg = this.worldsplitterConfig;
        const startX = this.player.x;
        const startY = this.player.y;
        const endX = startX + Math.cos(angle) * cfg.cleaveLength;
        const endY = startY + Math.sin(angle) * cfg.cleaveLength;
        const centerX = (startX + endX) * 0.5;
        const centerY = (startY + endY) * 0.5;

        // Multi-layer cleave: magma core
        const cleaveCore = this.scene.add.rectangle(centerX, centerY, cfg.cleaveLength, cfg.cleaveWidth * 0.55, 0xffa44d, 0.34)
            .setRotation(angle)
            .setDepth(176);

        // Tectonic edge
        const cleaveEdge = this.scene.add.rectangle(centerX, centerY, cfg.cleaveLength, cfg.cleaveWidth * 0.9, 0x000000, 0)
            .setStrokeStyle(4, 0xffe0b6, 0.88)
            .setRotation(angle)
            .setDepth(177);

        // Inner magma vein
        const cleaveMagma = this.scene.add.rectangle(centerX, centerY, cfg.cleaveLength, cfg.cleaveWidth * 0.2, 0xff5511, 0.45)
            .setRotation(angle)
            .setDepth(178);

        // Seismic shockwave outer glow
        const cleaveShock = this.scene.add.rectangle(centerX, centerY, cfg.cleaveLength * 1.08, cfg.cleaveWidth * 1.1, 0x000000, 0)
            .setStrokeStyle(2, 0xff8833, 0.4)
            .setRotation(angle)
            .setDepth(175);

        const scorch = this.scene.add.rectangle(centerX, centerY, cfg.cleaveLength, 18, 0x1a0d05, 0.6)
            .setRotation(angle)
            .setDepth(175);

        this.scene.tweens.add({
            targets: [cleaveCore, cleaveEdge, cleaveMagma, cleaveShock, scorch],
            alpha: 0,
            duration: 280,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                cleaveCore.destroy();
                cleaveEdge.destroy();
                cleaveMagma.destroy();
                cleaveShock.destroy();
                scorch.destroy();
            }
        });

        this.spawnWorldsplitterCracks(startX, startY, endX, endY, angle);
        this.spawnWorldsplitterWaveFront(startX, startY, angle);
        this.spawnWorldsplitterShards(startX, startY, endX, endY, angle);
        this.spawnWorldsplitterMagmaEruption(startX, startY, endX, endY, angle);

        const skyCut = this.scene.add.rectangle(centerX, centerY, cfg.cleaveLength * 1.12, 4, 0xffffff, 0.92)
            .setRotation(angle)
            .setDepth(199);
        this.scene.tweens.add({
            targets: skyCut,
            alpha: 0,
            scaleY: 3.5,
            duration: 120,
            onComplete: () => skyCut.destroy()
        });

        this.scene.cameras.main.flash(180, 255, 185, 90);
        this.scene.cameras.main.shake(320, 0.012);

        const boss = this.scene.boss;
        if (boss?.scene) {
            const distLine = Phaser.Math.Distance.BetweenPoints(
                { x: boss.x, y: boss.y },
                Phaser.Geom.Line.GetNearestPoint(new Phaser.Geom.Line(startX, startY, endX, endY), { x: boss.x, y: boss.y })
            );
            const distImpact = Phaser.Math.Distance.Between(boss.x, boss.y, endX, endY);
            if (distLine <= cfg.cleaveWidth * 0.5 || distImpact <= cfg.cleaveWidth * 0.9) {
                const damage = cfg.mainDamage * (this.player.damageMultiplier || 1.0);
                boss.takeDamage(damage);
                this.gainUltimateGaugeFromDamage(damage, { charged: true });
                boss.setTint(0xffc07a);

                const knock = 170;
                this.scene.tweens.add({
                    targets: boss,
                    x: boss.x + Math.cos(angle) * knock,
                    y: boss.y + Math.sin(angle) * knock,
                    duration: 220,
                    ease: 'Power2'
                });

                const prevMult = boss.damageTakenMultiplier || 1;
                boss.damageTakenMultiplier = Math.max(prevMult, cfg.vulnerabilityMultiplier);
                this.scene.time.delayedCall(cfg.vulnerabilityDuration, () => {
                    if (!boss?.scene) return;
                    boss.damageTakenMultiplier = prevMult;
                    boss.clearTint();
                });
            }
        }

        for (let i = 1; i <= 2; i++) {
            this.scene.time.delayedCall(cfg.aftershockDelay + i * cfg.aftershockSpacing, () => {
                this.spawnAftershock(startX, startY, angle, i);
            });
        }

        this.destroyUltimateState();
    }

    // ─── Aftershock with ground rupture crater and magma splash ────────

    spawnAftershock(startX, startY, angle, index) {
        const cfg = this.worldsplitterConfig;
        const distance = (cfg.cleaveLength * 0.32) + index * 120;
        const x = startX + Math.cos(angle) * distance;
        const y = startY + Math.sin(angle) * distance;

        const ring = this.scene.add.circle(x, y, 26, 0xffb76f, 0.35).setDepth(178);
        const crack = this.scene.add.rectangle(x, y, 90, 10, 0xffe3c0, 0.82).setRotation(angle).setDepth(179);

        // Ground rupture crater
        const craterGraphics = this.scene.add.graphics().setDepth(180);
        craterGraphics.fillStyle(0x331100, 0.4);
        craterGraphics.fillCircle(x, y, 22);
        craterGraphics.fillStyle(0xff6622, 0.35);
        craterGraphics.fillCircle(x, y, 12);
        // Radial cracks from crater
        craterGraphics.lineStyle(1.5, 0xff8833, 0.5);
        for (let i = 0; i < 5; i++) {
            const a = (Math.PI * 2 * i) / 5 + index * 0.4;
            const len = Phaser.Math.Between(20, 38);
            const jag = Math.sin(i * 2.1) * 4;
            craterGraphics.beginPath();
            craterGraphics.moveTo(x, y);
            craterGraphics.lineTo(
                x + Math.cos(a) * len * 0.5 + jag,
                y + Math.sin(a) * len * 0.5
            );
            craterGraphics.lineTo(
                x + Math.cos(a) * len,
                y + Math.sin(a) * len + jag * 0.5
            );
            craterGraphics.strokePath();
        }

        // Magma splash particles
        for (let i = 0; i < 6; i++) {
            const a = (Math.PI * 2 * i) / 6;
            this.spawnMagmaEmber(x, y, a);
        }

        // Seismic dust burst
        for (let i = 0; i < 4; i++) {
            this.spawnSeismicDust(x + Phaser.Math.Between(-16, 16), y + Phaser.Math.Between(-16, 16));
        }

        // Rock debris eruption
        for (let i = 0; i < 3; i++) {
            this.spawnRockDebris(x, y, Phaser.Math.FloatBetween(0, Math.PI * 2));
        }

        this.scene.tweens.add({
            targets: ring,
            radius: 96,
            alpha: 0,
            duration: 230,
            onComplete: () => ring.destroy()
        });

        this.scene.tweens.add({
            targets: crack,
            alpha: 0,
            scaleX: 1.5,
            duration: 170,
            onComplete: () => crack.destroy()
        });

        this.scene.tweens.add({
            targets: craterGraphics,
            alpha: 0,
            duration: 380,
            ease: 'Cubic.easeOut',
            onComplete: () => craterGraphics.destroy()
        });

        const boss = this.scene.boss;
        if (!boss?.scene) return;
        const dist = Phaser.Math.Distance.Between(x, y, boss.x, boss.y);
        if (dist <= 96) {
            const damage = cfg.aftershockDamage * (this.player.damageMultiplier || 1.0);
            boss.takeDamage(damage);
            this.gainUltimateGaugeFromDamage(damage, { charged: true });
            boss.setTint(0xffd4a2);
            this.scene.time.delayedCall(120, () => boss?.clearTint?.());
        }
    }

    // ─── Enhanced crack visuals with magma glow ────────────────────────

    spawnWorldsplitterCracks(startX, startY, endX, endY, angle) {
        const graphics = this.scene.add.graphics().setDepth(181);

        // Draw full tectonic crack with magma fill using the helper
        this.drawTectonicCrack(graphics, startX, startY, endX, endY);

        // Additional branching cracks perpendicular to main line
        const perp = angle + Math.PI * 0.5;
        const segments = 12;
        for (let i = 2; i < segments; i += 3) {
            const t = i / segments;
            const bx = Phaser.Math.Linear(startX, endX, t);
            const by = Phaser.Math.Linear(startY, endY, t);
            const branchLen = Phaser.Math.Between(20, 45);
            const side = (i % 2 === 0) ? 1 : -1;
            const bex = bx + Math.cos(perp) * branchLen * side;
            const bey = by + Math.sin(perp) * branchLen * side;

            graphics.lineStyle(1.5, 0xff8833, 0.45);
            graphics.beginPath();
            graphics.moveTo(bx, by);
            const midX = (bx + bex) * 0.5 + Phaser.Math.FloatBetween(-4, 4);
            const midY = (by + bey) * 0.5 + Phaser.Math.FloatBetween(-4, 4);
            graphics.lineTo(midX, midY);
            graphics.lineTo(bex, bey);
            graphics.strokePath();

            // Magma dot at branch tip
            graphics.fillStyle(0xff6622, 0.35);
            graphics.fillCircle(bex, bey, 3);
        }

        this.scene.tweens.add({
            targets: graphics,
            alpha: 0,
            duration: 340,
            ease: 'Cubic.easeOut',
            onComplete: () => graphics.destroy()
        });
    }

    // ─── Enhanced wave fronts with seismic ripple ──────────────────────

    spawnWorldsplitterWaveFront(startX, startY, angle) {
        for (let i = 0; i < 3; i++) {
            const wave = this.scene.add.arc(startX, startY, 70 + i * 14, angle - 0.3, angle + 0.3, false, 0xffe5c7, 0)
                .setStrokeStyle(4 - i, 0xffd4a1, 0.72 - i * 0.14)
                .setDepth(182);

            this.scene.tweens.add({
                targets: wave,
                radius: 220 + i * 48,
                x: startX + Math.cos(angle) * (90 + i * 16),
                y: startY + Math.sin(angle) * (90 + i * 16),
                alpha: 0,
                duration: 260 + i * 45,
                ease: 'Sine.easeOut',
                onComplete: () => wave.destroy()
            });
        }

        // Additional seismic ripple rings expanding outward
        for (let i = 0; i < 4; i++) {
            const ripple = this.scene.add.circle(startX, startY, 30 + i * 8, 0xff8833, 0)
                .setStrokeStyle(2, 0xffaa55, 0.35 - i * 0.06)
                .setDepth(181);

            this.scene.tweens.add({
                targets: ripple,
                radius: 140 + i * 35,
                x: startX + Math.cos(angle) * (60 + i * 12),
                y: startY + Math.sin(angle) * (60 + i * 12),
                alpha: 0,
                duration: 300 + i * 50,
                ease: 'Sine.easeOut',
                delay: i * 35,
                onComplete: () => ripple.destroy()
            });
        }
    }

    // ─── Enhanced shards as rock debris with procedural textures ───────

    spawnWorldsplitterShards(startX, startY, endX, endY, angle) {
        for (let i = 0; i < 24; i++) {
            const t = Math.random();
            const baseX = Phaser.Math.Linear(startX, endX, t);
            const baseY = Phaser.Math.Linear(startY, endY, t);
            const spread = Phaser.Math.Between(-70, 70);
            const perp = angle + Math.PI * 0.5;

            const useTexture = Math.random() > 0.5;

            if (useTexture) {
                // Rock debris with procedural texture
                const shard = this.scene.add.image(
                    baseX + Math.cos(perp) * spread,
                    baseY + Math.sin(perp) * spread,
                    'gs-rock-shard'
                ).setDepth(178)
                 .setScale(Phaser.Math.FloatBetween(0.4, 1.2))
                 .setRotation(angle + Phaser.Math.FloatBetween(-0.45, 0.45))
                 .setAlpha(Phaser.Math.FloatBetween(0.5, 0.9));

                this.scene.tweens.add({
                    targets: shard,
                    x: shard.x + Math.cos(angle) * Phaser.Math.Between(55, 170),
                    y: shard.y + Math.sin(angle) * Phaser.Math.Between(55, 170) - Phaser.Math.Between(0, 20),
                    alpha: 0,
                    rotation: shard.rotation + Phaser.Math.FloatBetween(-1.5, 1.5),
                    duration: Phaser.Math.Between(150, 300),
                    ease: 'Cubic.easeOut',
                    onComplete: () => shard.destroy()
                });
            } else {
                // Original rectangle shards for variety
                const shard = this.scene.add.rectangle(
                    baseX + Math.cos(perp) * spread,
                    baseY + Math.sin(perp) * spread,
                    Phaser.Math.Between(9, 24),
                    Phaser.Math.Between(2, 5),
                    Phaser.Math.RND.pick([0xffe4c2, 0xffbd77, 0xff9149]),
                    Phaser.Math.FloatBetween(0.35, 0.82)
                ).setRotation(angle + Phaser.Math.FloatBetween(-0.45, 0.45)).setDepth(178);

                this.scene.tweens.add({
                    targets: shard,
                    x: shard.x + Math.cos(angle) * Phaser.Math.Between(55, 170),
                    y: shard.y + Math.sin(angle) * Phaser.Math.Between(55, 170),
                    alpha: 0,
                    duration: Phaser.Math.Between(150, 300),
                    ease: 'Cubic.easeOut',
                    onComplete: () => shard.destroy()
                });
            }
        }
    }

    // ─── Erupting magma particles along the cleave line ────────────────

    spawnWorldsplitterMagmaEruption(startX, startY, endX, endY, angle) {
        const perp = angle + Math.PI * 0.5;

        // Magma embers erupting from the line
        for (let i = 0; i < 18; i++) {
            const t = i / 17;
            const px = Phaser.Math.Linear(startX, endX, t);
            const py = Phaser.Math.Linear(startY, endY, t);
            const side = (i % 2 === 0) ? 1 : -1;
            this.spawnMagmaEmber(px, py, perp * side);
        }

        // Seismic dust along entire line
        for (let i = 0; i < 14; i++) {
            const t = i / 13;
            const px = Phaser.Math.Linear(startX, endX, t);
            const py = Phaser.Math.Linear(startY, endY, t);
            this.spawnSeismicDust(px, py);
        }

        // Seismic sparks at intervals
        for (let i = 0; i < 10; i++) {
            const t = Math.random();
            const px = Phaser.Math.Linear(startX, endX, t);
            const py = Phaser.Math.Linear(startY, endY, t);
            const spark = this.scene.add.image(px, py, 'gs-seismic-spark')
                .setDepth(183)
                .setScale(Phaser.Math.FloatBetween(0.7, 1.4))
                .setAlpha(0.9);

            const drift = Phaser.Math.FloatBetween(0, Math.PI * 2);
            this.scene.tweens.add({
                targets: spark,
                x: spark.x + Math.cos(drift) * Phaser.Math.Between(15, 45),
                y: spark.y + Math.sin(drift) * Phaser.Math.Between(15, 45),
                alpha: 0,
                scale: 0.1,
                rotation: Phaser.Math.FloatBetween(-1, 1),
                duration: Phaser.Math.Between(160, 320),
                ease: 'Cubic.easeOut',
                onComplete: () => spark.destroy()
            });
        }

        // Rock debris erupting upward along the line
        for (let i = 0; i < 8; i++) {
            const t = Math.random();
            const px = Phaser.Math.Linear(startX, endX, t);
            const py = Phaser.Math.Linear(startY, endY, t);
            this.spawnRockDebris(px, py, Phaser.Math.FloatBetween(0, Math.PI * 2));
        }
    }

    // ─── Destroy ultimate state ────────────────────────────────────────

    destroyUltimateState() {
        const state = this.ultimateState;
        if (!state) return;

        state.sigil?.destroy();
        state.anchorGlow?.destroy();
        state.anchorRing?.destroy();
        state.chargeEmbers?.destroy();
        state.chargeRocks?.destroy();
        state.tremorGraphics?.destroy();
        for (const timer of state.timers || []) timer?.remove?.();

        this.ultimateState = null;
    }

}
