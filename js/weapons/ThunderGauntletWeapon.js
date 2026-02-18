// ThunderGauntletWeapon.js - Storm Sovereign: electric storm with plasma energy and chain lightning
import { WeaponBase } from './WeaponBase.js';
import { WEAPONS } from './weaponData.js';

export class ThunderGauntletWeapon extends WeaponBase {
    constructor(scene, player) {
        super(scene, player, WEAPONS.THUNDER_GAUNTLET);
        this.ensureProceduralTextures();
        this.ultimateState = null;
        this.stormbreakerConfig = {
            maxRange: 460,
            blitzHits: 4,
            blitzInterval: 115,
            blitzDamage: 40,
            empDamage: 135,
            nodeRadius: 140,
            afterBuffDuration: 1800,
            afterBuffShots: 6
        };
    }

    ensureProceduralTextures() {
        // tg-plasma-orb: bright cyan-white gradient circle with electric stroke
        if (!this.scene.textures.exists('tg-plasma-orb')) {
            const g = this.scene.add.graphics();
            g.fillGradientStyle(0xffffff, 0xc8f4ff, 0x63cfff, 0x2098dd, 1);
            g.fillCircle(8, 8, 7);
            g.fillStyle(0xffffff, 0.95);
            g.fillCircle(8, 8, 3.5);
            g.lineStyle(1.5, 0x5ec8ff, 0.9);
            g.strokeCircle(8, 8, 7.5);
            g.generateTexture('tg-plasma-orb', 16, 16);
            g.destroy();
        }

        // tg-static-mote: small white-blue flash circle
        if (!this.scene.textures.exists('tg-static-mote')) {
            const g = this.scene.add.graphics();
            g.fillStyle(0xffffff, 1);
            g.fillCircle(4, 4, 1.8);
            g.fillStyle(0xb8e8ff, 0.9);
            g.fillCircle(4, 4, 3.2);
            g.lineStyle(1, 0x7bd4ff, 0.85);
            g.strokeCircle(4, 4, 3.8);
            g.generateTexture('tg-static-mote', 8, 8);
            g.destroy();
        }

        // tg-chain-spark: electric blue triangle/bolt shape
        if (!this.scene.textures.exists('tg-chain-spark')) {
            const g = this.scene.add.graphics();
            g.fillGradientStyle(0xc8f4ff, 0x54beff, 0x2080cc, 0x103866, 1);
            g.fillTriangle(8, 1, 13, 15, 3, 15);
            g.lineStyle(1.2, 0x9ee8ff, 0.92);
            g.strokeTriangle(8, 1, 13, 15, 3, 15);
            g.generateTexture('tg-chain-spark', 16, 16);
            g.destroy();
        }

        // tg-storm-wisp: deep blue-cyan swirl gradient
        if (!this.scene.textures.exists('tg-storm-wisp')) {
            const g = this.scene.add.graphics();
            g.fillGradientStyle(0x1a5080, 0x0d3058, 0x54beff, 0x083048, 1);
            g.fillCircle(6, 6, 5);
            g.fillStyle(0x88d8ff, 0.7);
            g.fillCircle(6, 6, 2.5);
            g.lineStyle(1, 0x3ab0ee, 0.8);
            g.strokeCircle(6, 6, 5.5);
            g.generateTexture('tg-storm-wisp', 12, 12);
            g.destroy();
        }
    }

    getUltimatePreviewConfig() {
        const cfg = this.stormbreakerConfig;
        return {
            targeting: 'line',
            maxRange: cfg.maxRange,
            width: cfg.nodeRadius
        };
    }

    // ─── BASIC ATTACK ───────────────────────────────────────────────────────────
    fire(angle) {
        const data = this.data.projectile;
        const startX = this.player.x + Math.cos(angle) * 28;
        const startY = this.player.y + Math.sin(angle) * 28;

        this.createMuzzleFlash(startX, startY, this.data.color);
        this.spawnStaticMote(startX, startY);

        // Container-based projectile
        const container = this.scene.add.container(startX, startY).setDepth(150);

        // Ionization field - outer glow
        const ionField = this.scene.add.circle(0, 0, data.size * 2.8, 0x2080cc, 0.12);

        // Bolt core - main body
        const boltCore = this.scene.add.circle(0, 0, data.size, 0x8bd6ff, 0.95);

        // Electric corona - pulsating mid-ring
        const corona = this.scene.add.circle(0, 0, data.size * 2.1, 0x54beff, 0.28);

        // Plasma shell - bright inner core
        const plasmaShell = this.scene.add.circle(0, 0, data.size * 0.45, 0xffffff, 0.95);

        // Rune ring with electric stroke
        const arcRing = this.scene.add.circle(0, 0, data.size * 1.6, 0x000000, 0)
            .setStrokeStyle(1.3, 0x9ee8ff, 0.7);

        // Procedural lightning fork graphics layer
        const forkGfx = this.scene.add.graphics();

        container.add([ionField, corona, boltCore, arcRing, plasmaShell, forkGfx]);

        container.vx = Math.cos(angle) * data.speed;
        container.vy = Math.sin(angle) * data.speed;
        container.damage = data.damage;
        container.range = data.range;
        container.startX = startX;
        container.startY = startY;
        container.piercing = false;
        container.lifeTick = 0;

        container.update = () => {
            if (!container.scene) return;
            container.lifeTick += 0.35;

            const jitterX = Phaser.Math.Between(-1, 1);
            const jitterY = Phaser.Math.Between(-1, 1);
            boltCore.x = jitterX;
            boltCore.y = jitterY;
            boltCore.alpha = Phaser.Math.FloatBetween(0.68, 1);

            plasmaShell.x = jitterX;
            plasmaShell.y = jitterY;
            plasmaShell.alpha = Phaser.Math.FloatBetween(0.78, 1);

            corona.alpha = Phaser.Math.FloatBetween(0.14, 0.34);

            // Ionization glow pulsing
            const ionPulse = 1 + Math.sin(container.lifeTick * 2.2) * 0.25;
            ionField.setScale(ionPulse);
            ionField.alpha = 0.08 + Math.abs(Math.sin(container.lifeTick * 1.6)) * 0.12;

            // Arc ring rotation
            arcRing.rotation -= 0.09;

            // Forking lightning mini-bolts drawn procedurally
            forkGfx.clear();
            if (Math.random() > 0.35) {
                const forkCount = Phaser.Math.Between(1, 3);
                for (let f = 0; f < forkCount; f++) {
                    const fAngle = Math.random() * Math.PI * 2;
                    this.drawLightningFork(forkGfx, 0, 0, fAngle);
                }
            }

            // Continuous plasma spark spawning
            if (Math.random() > 0.48) {
                this.spawnPlasmaSpark(container.x, container.y, angle + Math.PI);
            }

            // Static mote spawning
            if (Math.random() > 0.75) {
                this.spawnStaticMote(container.x, container.y);
            }

            // Electric arc trail segments
            if (Math.random() > 0.6) {
                this.spawnArcTrailSegment(container.x, container.y, angle + Math.PI);
            }
        };

        container.on('destroy', () => {
            ionField?.destroy();
            boltCore?.destroy();
            corona?.destroy();
            plasmaShell?.destroy();
            arcRing?.destroy();
            forkGfx?.destroy();
        });

        this.scene.projectiles.push(container);
        this.addTrail(container, 0x7bccff, data.size + 1.2);
    }

    // ─── CHARGED ATTACK ─────────────────────────────────────────────────────────
    executeChargedAttack(angle) {
        const charged = this.data.charged;
        const startX = this.player.x;
        const startY = this.player.y;
        const targetPoint = this.getClampedChargedTarget(this.scene.worldMouseX, this.scene.worldMouseY);
        const dashLine = new Phaser.Geom.Line(startX, startY, targetPoint.x, targetPoint.y);

        // Enhanced dash line with lightning web
        this.createDashLineFX(dashLine, angle);

        // Static buildup burst at start position
        this.createStaticBuildupBurst(startX, startY);
        this.createSparkleNova(startX, startY, 0xb9ecff);

        const hadInvulnerability = this.player.isInvulnerable;
        this.player.isCharging = true;
        this.player.isInvulnerable = true;
        this.player.body.setVelocity(0, 0);

        this.scene.tweens.add({
            targets: this.player,
            x: targetPoint.x,
            y: targetPoint.y,
            duration: charged.dashDuration,
            ease: 'Expo.easeIn',
            onUpdate: () => {
                // Plasma trail particles during dash
                this.spawnDashSpark(this.player.x, this.player.y, false);
                if (Math.random() > 0.5) {
                    this.spawnPlasmaSpark(this.player.x, this.player.y, angle + Math.PI);
                }
            },
            onComplete: () => {
                // Enhanced thunder burst with chain lightning visuals
                this.createThunderBurst(targetPoint.x, targetPoint.y, angle);

                // Enhanced impact: concentric electric rings and plasma explosion
                this.createChargedImpactFX(targetPoint.x, targetPoint.y);

                // Ionized ground circle at impact point
                this.createIonizedGround(targetPoint.x, targetPoint.y);

                this.hitBossOnDashPath(dashLine, charged, angle);

                this.scene.time.delayedCall(charged.snapDelay, () => {
                    this.scene.tweens.add({
                        targets: this.player,
                        x: startX,
                        y: startY,
                        duration: charged.returnDuration,
                        ease: 'Expo.easeOut',
                        onUpdate: () => {
                            // Plasma trail during return
                            this.spawnDashSpark(this.player.x, this.player.y, true);
                            if (Math.random() > 0.55) {
                                this.spawnPlasmaSpark(this.player.x, this.player.y, angle);
                            }
                        },
                        onComplete: () => {
                            this.player.isCharging = false;
                            this.player.isInvulnerable = hadInvulnerability;
                            this.player.body.setVelocity(0, 0);
                            this.createSnapbackPulse(startX, startY);
                        }
                    });
                });
            }
        });
    }

    hitBossOnDashPath(dashLine, charged, angle) {
        const boss = this.scene.boss;
        if (!boss?.scene) return;

        const nearest = Phaser.Geom.Line.GetNearestPoint(dashLine, { x: boss.x, y: boss.y });
        const distToPath = Phaser.Math.Distance.Between(boss.x, boss.y, nearest.x, nearest.y);
        const distToImpact = Phaser.Math.Distance.Between(dashLine.x2, dashLine.y2, boss.x, boss.y);

        if (distToPath > charged.hitRadius && distToImpact > charged.hitRadius * 1.5) return;

        const critChance = Phaser.Math.Clamp((this.player.critChanceBonus || 0), 0, 0.6);
            const critMultiplier = Math.random() < critChance ? 2 : 1;
            const finalDamage = charged.damage * (this.player.damageMultiplier || 1.0) * (this.player.passiveDamageMultiplier || 1.0) * critMultiplier;
        boss.takeDamage(finalDamage);
        this.gainUltimateGaugeFromDamage(finalDamage, { charged: true });

        boss.damageTakenMultiplier = charged.vulnerabilityMultiplier;
        boss.setTint(0x8fd8ff);

        if (boss.vulnerabilityTimer) {
            boss.vulnerabilityTimer.remove(false);
        }

        boss.vulnerabilityTimer = this.scene.time.delayedCall(charged.vulnerabilityDuration, () => {
            if (!boss.scene) return;
            boss.damageTakenMultiplier = 1.0;
            boss.clearTint();
            boss.vulnerabilityTimer = null;
        });

        const debuffText = this.scene.add.text(boss.x, boss.y - 82, '+20% DMG TAKEN', {
            fontFamily: 'Arial',
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#c6f0ff',
            stroke: '#062133',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(210);

        this.scene.tweens.add({
            targets: debuffText,
            y: debuffText.y - 36,
            alpha: 0,
            duration: 850,
            ease: 'Sine.easeOut',
            onComplete: () => debuffText.destroy()
        });

        this.scene.tweens.add({
            targets: boss,
            x: boss.x + Math.cos(angle) * 95,
            y: boss.y + Math.sin(angle) * 95,
            duration: 110,
            yoyo: true,
            ease: 'Sine.easeOut'
        });

        // Enhanced impact mark with concentric electric rings
        const mark = this.scene.add.circle(boss.x, boss.y, charged.hitRadius, 0x6bc8ff, 0.2).setDepth(155);
        const ring = this.scene.add.circle(boss.x, boss.y, charged.hitRadius * 0.5, 0x91e6ff, 0)
            .setStrokeStyle(3, 0xb6eeff, 0.95)
            .setDepth(156);

        // Additional electric rings for boss hit
        const innerElecRing = this.scene.add.circle(boss.x, boss.y, charged.hitRadius * 0.3, 0x000000, 0)
            .setStrokeStyle(2, 0xc8f4ff, 0.8).setDepth(157);
        const outerElecRing = this.scene.add.circle(boss.x, boss.y, charged.hitRadius * 0.7, 0x000000, 0)
            .setStrokeStyle(1.5, 0x5ec8ff, 0.6).setDepth(157);

        this.scene.tweens.add({
            targets: [mark, ring, innerElecRing, outerElecRing],
            alpha: 0,
            scale: 1.85,
            duration: 240,
            onComplete: () => {
                mark.destroy();
                ring.destroy();
                innerElecRing.destroy();
                outerElecRing.destroy();
            }
        });

        // Enhanced spark burst with chain spark textures
        for (let i = 0; i < 12; i++) {
            const sparkAngle = (i / 12) * Math.PI * 2;
            const spark = this.scene.add.circle(boss.x, boss.y, Phaser.Math.FloatBetween(2, 4), 0xa6eaff, 0.88).setDepth(157);
            this.scene.tweens.add({
                targets: spark,
                x: boss.x + Math.cos(sparkAngle) * Phaser.Math.Between(36, 76),
                y: boss.y + Math.sin(sparkAngle) * Phaser.Math.Between(36, 76),
                alpha: 0,
                duration: Phaser.Math.Between(120, 200),
                onComplete: () => spark.destroy()
            });
        }

        // Chain lightning bolts radiating from boss
        for (let i = 0; i < 6; i++) {
            const boltAngle = (i / 6) * Math.PI * 2 + Math.random() * 0.3;
            const boltGfx = this.scene.add.graphics().setDepth(158);
            this.drawChainLightningBolt(boltGfx, boss.x, boss.y, boltAngle, Phaser.Math.Between(40, 80));
            this.scene.tweens.add({
                targets: boltGfx,
                alpha: 0,
                duration: 150,
                onComplete: () => boltGfx.destroy()
            });
        }

        // Plasma explosion burst particles
        for (let i = 0; i < 8; i++) {
            const pAngle = (i / 8) * Math.PI * 2;
            const pSpark = this.scene.add.image(boss.x, boss.y, 'tg-chain-spark')
                .setDepth(159).setScale(Phaser.Math.FloatBetween(0.6, 1.1)).setAlpha(0.9);
            this.scene.tweens.add({
                targets: pSpark,
                x: boss.x + Math.cos(pAngle) * Phaser.Math.Between(45, 90),
                y: boss.y + Math.sin(pAngle) * Phaser.Math.Between(45, 90),
                alpha: 0,
                angle: Phaser.Math.Between(60, 240),
                scale: 0.15,
                duration: Phaser.Math.Between(140, 240),
                onComplete: () => pSpark.destroy()
            });
        }

        this.createSparkleNova(boss.x, boss.y, 0xd8f6ff);
        this.createThunderBurst(boss.x, boss.y, angle);
    }

    // ─── DASH LINE FX (enhanced with lightning web) ─────────────────────────────
    createDashLineFX(dashLine, angle) {
        const length = Phaser.Geom.Line.Length(dashLine);
        const cx = (dashLine.x1 + dashLine.x2) * 0.5;
        const cy = (dashLine.y1 + dashLine.y2) * 0.5;

        const ribbon = this.scene.add.rectangle(cx, cy, length, 24, 0x57c1ff, 0.32).setRotation(angle).setDepth(143);
        const edge = this.scene.add.rectangle(cx, cy, length, 40, 0x8be2ff, 0)
            .setRotation(angle)
            .setStrokeStyle(3, 0xe9fbff, 0.9)
            .setDepth(142);

        // Primary zigzag arc
        const arc = this.scene.add.graphics().setDepth(144);
        arc.lineStyle(3, 0xb8eeff, 0.9);
        const segments = 9;
        arc.beginPath();
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = Phaser.Math.Linear(dashLine.x1, dashLine.x2, t);
            const y = Phaser.Math.Linear(dashLine.y1, dashLine.y2, t) + (i % 2 === 0 ? -6 : 6);
            if (i === 0) arc.moveTo(x, y);
            else arc.lineTo(x, y);
        }
        arc.strokePath();

        // Lightning web graphics: multiple jagged forking paths along the dash
        const webGfx = this.scene.add.graphics().setDepth(145);
        for (let w = 0; w < 3; w++) {
            const webColor = [0xc8f4ff, 0x7bd4ff, 0x54beff][w];
            const webAlpha = [0.85, 0.65, 0.5][w];
            const webWidth = [2.2, 1.8, 1.4][w];
            webGfx.lineStyle(webWidth, webColor, webAlpha);
            webGfx.beginPath();

            let wx = dashLine.x1;
            let wy = dashLine.y1;
            webGfx.moveTo(wx, wy);

            const perpX = -Math.sin(angle);
            const perpY = Math.cos(angle);
            const webSegments = 12 + w * 3;

            for (let s = 1; s <= webSegments; s++) {
                const t = s / webSegments;
                const baseX = Phaser.Math.Linear(dashLine.x1, dashLine.x2, t);
                const baseY = Phaser.Math.Linear(dashLine.y1, dashLine.y2, t);
                const jitter = Phaser.Math.Between(-14 - w * 4, 14 + w * 4);
                wx = baseX + perpX * jitter;
                wy = baseY + perpY * jitter;
                webGfx.lineTo(wx, wy);
            }
            webGfx.strokePath();
        }

        // Spawn static motes along the dash line
        for (let i = 0; i < 6; i++) {
            const t = Math.random();
            const mx = Phaser.Math.Linear(dashLine.x1, dashLine.x2, t) + Phaser.Math.Between(-10, 10);
            const my = Phaser.Math.Linear(dashLine.y1, dashLine.y2, t) + Phaser.Math.Between(-10, 10);
            this.spawnStaticMote(mx, my);
        }

        this.scene.tweens.add({
            targets: [ribbon, edge, arc, webGfx],
            alpha: 0,
            scaleY: 1.28,
            duration: 220,
            ease: 'Sine.easeOut',
            onComplete: () => {
                ribbon.destroy();
                edge.destroy();
                arc.destroy();
                webGfx.destroy();
            }
        });
    }

    // ─── DASH SPARK (enhanced) ──────────────────────────────────────────────────
    spawnDashSpark(x, y, returnTrip) {
        const spawnChance = returnTrip ? 0.8 : 0.72;
        if (Math.random() > spawnChance) return;

        const color = returnTrip ? 0xdcf8ff : 0x86d7ff;
        const spark = this.scene.add.circle(
            x + Phaser.Math.Between(-8, 8),
            y + Phaser.Math.Between(-8, 8),
            Phaser.Math.FloatBetween(1.8, 3.8),
            color,
            0.92
        ).setDepth(156);

        this.scene.tweens.add({
            targets: spark,
            alpha: 0,
            scale: 0.3,
            duration: Phaser.Math.Between(70, 150),
            onComplete: () => spark.destroy()
        });

        if (Math.random() > 0.7) {
            const fork = this.scene.add.graphics().setDepth(155);
            fork.lineStyle(2, 0xbef0ff, 0.85);
            fork.beginPath();
            fork.moveTo(x, y);
            fork.lineTo(x + Phaser.Math.Between(-9, 9), y + Phaser.Math.Between(-9, 9));
            fork.lineTo(x + Phaser.Math.Between(-18, 18), y + Phaser.Math.Between(-18, 18));
            fork.strokePath();
            this.scene.tweens.add({
                targets: fork,
                alpha: 0,
                duration: 90,
                onComplete: () => fork.destroy()
            });
        }

        // Additional chain spark particle on dash
        if (Math.random() > 0.65) {
            const cs = this.scene.add.image(
                x + Phaser.Math.Between(-6, 6),
                y + Phaser.Math.Between(-6, 6),
                'tg-chain-spark'
            ).setDepth(157).setScale(Phaser.Math.FloatBetween(0.4, 0.8)).setAlpha(0.85);
            const driftAngle = Math.random() * Math.PI * 2;
            this.scene.tweens.add({
                targets: cs,
                x: cs.x + Math.cos(driftAngle) * Phaser.Math.Between(10, 25),
                y: cs.y + Math.sin(driftAngle) * Phaser.Math.Between(10, 25),
                alpha: 0,
                angle: Phaser.Math.Between(40, 180),
                scale: 0.1,
                duration: Phaser.Math.Between(80, 160),
                onComplete: () => cs.destroy()
            });
        }
    }

    // ─── SPARKLE NOVA ───────────────────────────────────────────────────────────
    createSparkleNova(x, y, color) {
        for (let i = 0; i < 14; i++) {
            const sparkle = this.scene.add.star(
                x + Phaser.Math.Between(-8, 8),
                y + Phaser.Math.Between(-8, 8),
                4,
                Phaser.Math.FloatBetween(1.4, 2.4),
                Phaser.Math.FloatBetween(3.4, 5.4),
                color,
                0.95
            ).setDepth(158);

            this.scene.tweens.add({
                targets: sparkle,
                x: sparkle.x + Phaser.Math.Between(-42, 42),
                y: sparkle.y + Phaser.Math.Between(-42, 42),
                angle: Phaser.Math.Between(80, 280),
                alpha: 0,
                duration: Phaser.Math.Between(170, 280),
                ease: 'Cubic.easeOut',
                onComplete: () => sparkle.destroy()
            });
        }

        // Additional plasma orb burst particles
        for (let i = 0; i < 6; i++) {
            const orb = this.scene.add.image(
                x + Phaser.Math.Between(-6, 6),
                y + Phaser.Math.Between(-6, 6),
                'tg-plasma-orb'
            ).setDepth(159).setScale(Phaser.Math.FloatBetween(0.5, 1.0)).setAlpha(0.85);

            const orbAngle = Math.random() * Math.PI * 2;
            this.scene.tweens.add({
                targets: orb,
                x: orb.x + Math.cos(orbAngle) * Phaser.Math.Between(20, 50),
                y: orb.y + Math.sin(orbAngle) * Phaser.Math.Between(20, 50),
                alpha: 0,
                scale: 0.15,
                duration: Phaser.Math.Between(160, 300),
                onComplete: () => orb.destroy()
            });
        }
    }

    // ─── THUNDER BURST (enhanced with chain lightning) ──────────────────────────
    createThunderBurst(x, y, angle) {
        // Original lightning bolts
        for (let i = 0; i < 3; i++) {
            const offsetAngle = angle + Phaser.Math.FloatBetween(-0.9, 0.9);
            const bolt = this.scene.add.graphics().setDepth(157);
            bolt.lineStyle(3 - i * 0.5, 0xd4f4ff, 0.9 - i * 0.2);
            bolt.beginPath();
            bolt.moveTo(x + Phaser.Math.Between(-8, 8), y + Phaser.Math.Between(-8, 8));

            let cx = x;
            let cy = y;
            for (let j = 0; j < 4; j++) {
                cx += Math.cos(offsetAngle) * Phaser.Math.Between(12, 24) + Phaser.Math.Between(-10, 10);
                cy += Math.sin(offsetAngle) * Phaser.Math.Between(12, 24) + Phaser.Math.Between(-10, 10);
                bolt.lineTo(cx, cy);
            }

            bolt.strokePath();
            this.scene.tweens.add({
                targets: bolt,
                alpha: 0,
                duration: 120,
                onComplete: () => bolt.destroy()
            });
        }

        // Additional chain lightning visuals
        for (let i = 0; i < 4; i++) {
            const chainAngle = angle + Phaser.Math.FloatBetween(-1.4, 1.4);
            const chainGfx = this.scene.add.graphics().setDepth(158);
            this.drawChainLightningBolt(chainGfx, x, y, chainAngle, Phaser.Math.Between(25, 55));
            this.scene.tweens.add({
                targets: chainGfx,
                alpha: 0,
                duration: Phaser.Math.Between(90, 160),
                onComplete: () => chainGfx.destroy()
            });
        }

        // Plasma burst flash
        const plasmaFlash = this.scene.add.circle(x, y, 18, 0xc8f4ff, 0.4).setDepth(156);
        this.scene.tweens.add({
            targets: plasmaFlash,
            scale: 2.2,
            alpha: 0,
            duration: 150,
            ease: 'Cubic.easeOut',
            onComplete: () => plasmaFlash.destroy()
        });
    }

    // ─── SNAPBACK PULSE ─────────────────────────────────────────────────────────
    createSnapbackPulse(x, y) {
        const pulse = this.scene.add.circle(x, y, 20, 0x8ddcff, 0.22).setDepth(150);
        const ring = this.scene.add.circle(x, y, 20, 0x9ae7ff, 0).setStrokeStyle(2, 0xe7fbff, 0.9).setDepth(151);

        this.scene.tweens.add({
            targets: [pulse, ring],
            scale: 2,
            alpha: 0,
            duration: 200,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                pulse.destroy();
                ring.destroy();
            }
        });

        // Electric discharge arcs on snapback
        const snapGfx = this.scene.add.graphics().setDepth(152);
        for (let i = 0; i < 5; i++) {
            const sAngle = (i / 5) * Math.PI * 2 + Math.random() * 0.4;
            this.drawChainLightningBolt(snapGfx, x, y, sAngle, Phaser.Math.Between(18, 38));
        }
        this.scene.tweens.add({
            targets: snapGfx,
            alpha: 0,
            duration: 180,
            onComplete: () => snapGfx.destroy()
        });

        this.createSparkleNova(x, y, 0xedfcff);
    }

    // ─── ULTIMATE CHARGE ────────────────────────────────────────────────────────
    startUltimateCharge(targetX, targetY) {
        if (this.ultimateState || !this.canUseUltimate()) return false;

        const boss = this.scene.boss;
        if (!boss?.scene) return false;

        const clamped = this.getClampedUltimateTarget(targetX ?? boss.x, targetY ?? boss.y);
        const angle = Math.atan2(clamped.y - this.player.y, clamped.x - this.player.x);

        const orb = this.scene.add.circle(this.player.x, this.player.y, 16, 0x63cfff, 0.45).setDepth(186);
        const ring = this.scene.add.circle(this.player.x, this.player.y, 24, 0x000000, 0)
            .setStrokeStyle(3, 0xc8f4ff, 0.82)
            .setDepth(187);

        // Particle emitters for charge phase: plasma orbs swirling around player
        const plasmaEmitter = this.scene.add.particles(this.player.x, this.player.y, 'tg-plasma-orb', {
            speed: { min: 20, max: 65 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.9, end: 0 },
            alpha: { start: 0.8, end: 0 },
            lifespan: { min: 400, max: 900 },
            frequency: 45,
            quantity: 1,
            blendMode: 'ADD',
            emitting: true
        }).setDepth(185);

        // Static motes emitter
        const moteEmitter = this.scene.add.particles(this.player.x, this.player.y, 'tg-static-mote', {
            speed: { min: 10, max: 50 },
            scale: { start: 0.7, end: 0 },
            alpha: { start: 0.9, end: 0 },
            lifespan: { min: 300, max: 700 },
            frequency: 60,
            quantity: 1,
            blendMode: 'SCREEN',
            emitting: true
        }).setDepth(185);

        // Electric arc graphics drawn between player and orb
        const arcGraphics = this.scene.add.graphics().setDepth(188);

        // Storm charge buildup visual: expanding electric web
        const chargeWebGfx = this.scene.add.graphics().setDepth(184);

        this.ultimateState = {
            phase: 'charge',
            targetX: clamped.x,
            targetY: clamped.y,
            angle,
            boss,
            orb,
            ring,
            plasmaEmitter,
            moteEmitter,
            arcGraphics,
            chargeWebGfx,
            nodes: [],
            timers: [],
            tweens: []
        };

        return true;
    }

    updateUltimate(time, delta, targetX, targetY) {
        const state = this.ultimateState;
        if (!state || state.phase !== 'charge') return;

        const clamped = this.getClampedUltimateTarget(targetX ?? state.targetX, targetY ?? state.targetY);
        state.targetX = clamped.x;
        state.targetY = clamped.y;
        state.angle = Math.atan2(state.targetY - this.player.y, state.targetX - this.player.x);

        const pulse = 1 + Math.sin(time * 0.018) * 0.2;
        state.orb.setRadius(14 * pulse);
        state.orb.setAlpha(0.35 + (Math.sin(time * 0.022) + 1) * 0.18);
        state.ring.setRadius(22 + Math.sin(time * 0.016) * 4);

        // Update emitter positions to follow player
        state.plasmaEmitter?.setPosition?.(this.player.x, this.player.y);
        state.moteEmitter?.setPosition?.(this.player.x, this.player.y);

        // Draw electric arcs between player and the charge orb
        if (state.arcGraphics?.scene) {
            state.arcGraphics.clear();
            const orbX = this.player.x + Math.cos(state.angle) * (22 + Math.sin(time * 0.016) * 4);
            const orbY = this.player.y + Math.sin(state.angle) * (22 + Math.sin(time * 0.016) * 4);

            // Draw 2-3 arcs between player center and orb
            for (let a = 0; a < 3; a++) {
                const alpha = Phaser.Math.FloatBetween(0.45, 0.85);
                const width = Phaser.Math.FloatBetween(1.2, 2.4);
                state.arcGraphics.lineStyle(width, 0xc8f4ff, alpha);
                state.arcGraphics.beginPath();
                state.arcGraphics.moveTo(this.player.x, this.player.y);

                const midX = (this.player.x + orbX) * 0.5 + Phaser.Math.Between(-8, 8);
                const midY = (this.player.y + orbY) * 0.5 + Phaser.Math.Between(-8, 8);
                state.arcGraphics.lineTo(midX, midY);
                state.arcGraphics.lineTo(orbX, orbY);
                state.arcGraphics.strokePath();
            }

            // Procedural lightning crackling around the charge orb
            for (let c = 0; c < 2; c++) {
                const crackAngle = Math.random() * Math.PI * 2;
                this.drawLightningForkWorld(state.arcGraphics, orbX, orbY, crackAngle, 12, 0x9ee8ff, 0.7);
            }
        }

        // Storm charge buildup visual: expanding electric web
        if (state.chargeWebGfx?.scene) {
            state.chargeWebGfx.clear();
            const webRadius = 28 + Math.sin(time * 0.012) * 8;
            const spokes = 6;
            state.chargeWebGfx.lineStyle(1.2, 0x5ec8ff, 0.35);

            for (let s = 0; s < spokes; s++) {
                const sAngle = (s / spokes) * Math.PI * 2 + time * 0.003;
                const sx = this.player.x + Math.cos(sAngle) * webRadius;
                const sy = this.player.y + Math.sin(sAngle) * webRadius;
                state.chargeWebGfx.beginPath();
                state.chargeWebGfx.moveTo(this.player.x, this.player.y);
                const jx = (this.player.x + sx) * 0.5 + Phaser.Math.Between(-5, 5);
                const jy = (this.player.y + sy) * 0.5 + Phaser.Math.Between(-5, 5);
                state.chargeWebGfx.lineTo(jx, jy);
                state.chargeWebGfx.lineTo(sx, sy);
                state.chargeWebGfx.strokePath();
            }

            // Connecting ring
            state.chargeWebGfx.lineStyle(1, 0x88d8ff, 0.25);
            state.chargeWebGfx.strokeCircle(this.player.x, this.player.y, webRadius);
        }

        if (Math.random() > 0.68) {
            this.spawnDashSpark(this.player.x, this.player.y, false);
        }
    }

    // ─── ULTIMATE RELEASE ───────────────────────────────────────────────────────
    releaseUltimate(targetX, targetY) {
        const state = this.ultimateState;
        if (!state || state.phase !== 'charge') return false;

        if (!this.consumeUltimate()) {
            this.destroyUltimateState();
            return false;
        }

        const boss = this.scene.boss;
        if (!boss?.scene) {
            this.destroyUltimateState();
            return false;
        }

        const clamped = this.getClampedUltimateTarget(targetX ?? state.targetX, targetY ?? state.targetY);
        state.targetX = clamped.x;
        state.targetY = clamped.y;
        state.angle = Math.atan2(state.targetY - this.player.y, state.targetX - this.player.x);
        state.phase = 'blitz';

        // Stop charge emitters
        state.plasmaEmitter?.stop?.();
        state.moteEmitter?.stop?.();
        state.arcGraphics?.clear?.();
        state.chargeWebGfx?.clear?.();

        const fadeTween = this.scene.tweens.add({
            targets: [state.orb, state.ring],
            alpha: 0,
            duration: 120,
            onComplete: () => {
                state.orb?.destroy();
                state.ring?.destroy();
                state.plasmaEmitter?.destroy?.();
                state.moteEmitter?.destroy?.();
                state.arcGraphics?.destroy?.();
                state.chargeWebGfx?.destroy?.();
            }
        });
        state.tweens.push(fadeTween);

        this.executeStormbreakerBlitz(state, boss);
        return true;
    }

    // ─── STORMBREAKER BLITZ (enhanced) ──────────────────────────────────────────
    executeStormbreakerBlitz(state, boss) {
        const cfg = this.stormbreakerConfig;
        this.player.untargetable = true;
        this.player.alpha = 0.2;

        let prevPx = null;
        let prevPy = null;

        for (let i = 0; i < cfg.blitzHits; i++) {
            const t = this.scene.time.delayedCall(i * cfg.blitzInterval, () => {
                if (!this.ultimateState || !boss?.scene) return;

                const arc = (Math.PI * 2 * i) / cfg.blitzHits;
                const px = boss.x + Math.cos(arc) * 68;
                const py = boss.y + Math.sin(arc) * 68;
                this.player.x = px;
                this.player.y = py;

                // Lightning chain trail between strike positions
                if (prevPx !== null && prevPy !== null) {
                    const chainGfx = this.scene.add.graphics().setDepth(189);
                    this.drawChainLightningLine(chainGfx, prevPx, prevPy, px, py, 0xc8f4ff, 0.85, 2.5);
                    // Secondary thinner chain
                    this.drawChainLightningLine(chainGfx, prevPx, prevPy, px, py, 0x5ec8ff, 0.5, 1.4);
                    const chainTween = this.scene.tweens.add({
                        targets: chainGfx,
                        alpha: 0,
                        duration: 200,
                        onComplete: () => chainGfx.destroy()
                    });
                    state.tweens.push(chainTween);
                }
                prevPx = px;
                prevPy = py;

                // Enhanced slash visuals with electric arc bursts
                const slash = this.scene.add.rectangle(boss.x, boss.y, 120, 6, 0xd6f8ff, 0.9)
                    .setRotation(arc)
                    .setDepth(190);

                // Additional arc burst around slash
                const arcBurstGfx = this.scene.add.graphics().setDepth(191);
                for (let ab = 0; ab < 3; ab++) {
                    const abAngle = arc + Phaser.Math.FloatBetween(-0.8, 0.8);
                    this.drawChainLightningBolt(arcBurstGfx, boss.x, boss.y, abAngle, Phaser.Math.Between(30, 60));
                }

                const slashTween = this.scene.tweens.add({
                    targets: slash,
                    alpha: 0,
                    scaleX: 1.25,
                    duration: 100,
                    onComplete: () => slash.destroy()
                });
                state.tweens.push(slashTween);

                const arcBurstTween = this.scene.tweens.add({
                    targets: arcBurstGfx,
                    alpha: 0,
                    duration: 130,
                    onComplete: () => arcBurstGfx.destroy()
                });
                state.tweens.push(arcBurstTween);

                // Plasma node visuals with orbiting lightning
                const node = this.scene.add.circle(px, py, 10, 0x80d9ff, 0.62).setDepth(188);

                // Orbiting plasma sparks around node
                const nodeOrbitGfx = this.scene.add.graphics().setDepth(189);
                let nodeOrbitTick = 0;
                const nodeOrbitTimer = this.scene.time.addEvent({
                    delay: 35,
                    repeat: 25,
                    callback: () => {
                        if (!node?.scene) { nodeOrbitTimer.remove(false); return; }
                        nodeOrbitTick += 0.45;
                        nodeOrbitGfx.clear();
                        for (let o = 0; o < 3; o++) {
                            const oAngle = nodeOrbitTick + (o / 3) * Math.PI * 2;
                            const ox = px + Math.cos(oAngle) * (14 + Math.sin(nodeOrbitTick * 0.8) * 3);
                            const oy = py + Math.sin(oAngle) * (14 + Math.sin(nodeOrbitTick * 0.8) * 3);
                            nodeOrbitGfx.fillStyle(0xc8f4ff, 0.7);
                            nodeOrbitGfx.fillCircle(ox, oy, 2);
                            // Lightning line from node center to orbit point
                            nodeOrbitGfx.lineStyle(1, 0x88d8ff, 0.5);
                            nodeOrbitGfx.beginPath();
                            nodeOrbitGfx.moveTo(px, py);
                            nodeOrbitGfx.lineTo(
                                (px + ox) * 0.5 + Phaser.Math.Between(-3, 3),
                                (py + oy) * 0.5 + Phaser.Math.Between(-3, 3)
                            );
                            nodeOrbitGfx.lineTo(ox, oy);
                            nodeOrbitGfx.strokePath();
                        }
                    }
                });
                state.timers.push(nodeOrbitTimer);

                state.nodes.push(node);
                const nodeTween = this.scene.tweens.add({
                    targets: node,
                    alpha: 0.38,
                    radius: 14,
                    duration: 180,
                    yoyo: true,
                    repeat: 8,
                    onComplete: () => { nodeOrbitGfx?.destroy?.(); }
                });
                state.tweens.push(nodeTween);

                const dmg = cfg.blitzDamage * (this.player.damageMultiplier || 1.0);
                boss.takeDamage(dmg);
                this.gainUltimateGaugeFromDamage(dmg, { charged: true });
                boss.setTint(0x98e2ff);
                this.scene.time.delayedCall(60, () => boss?.clearTint?.());

                // Enhanced thunder burst at each strike point
                this.createThunderBurst(px, py, arc);

                // Spawn plasma sparks at strike
                for (let ps = 0; ps < 4; ps++) {
                    this.spawnPlasmaSpark(px, py, arc + Phaser.Math.FloatBetween(-1.5, 1.5));
                }
            });
            state.timers.push(t);
        }

        const finisher = this.scene.time.delayedCall(cfg.blitzHits * cfg.blitzInterval + 90, () => {
            if (!this.ultimateState || !boss?.scene) return;
            this.executeStormbreakerEMP(state, boss);
        });
        state.timers.push(finisher);
    }

    // ─── STORMBREAKER EMP (enhanced) ────────────────────────────────────────────
    executeStormbreakerEMP(state, boss) {
        const cfg = this.stormbreakerConfig;
        const centerX = boss.x;
        const centerY = boss.y;

        // Lightning web connecting all nodes (procedural jagged lines)
        const webGfx = this.scene.add.graphics().setDepth(191);
        for (let i = 0; i < state.nodes.length; i++) {
            const nodeA = state.nodes[i];
            if (!nodeA?.scene) continue;

            // Connect to center with jagged lightning
            this.drawChainLightningLine(webGfx, nodeA.x, nodeA.y, centerX, centerY, 0xd8f7ff, 0.9, 2.8);

            // Connect nodes to each other
            for (let j = i + 1; j < state.nodes.length; j++) {
                const nodeB = state.nodes[j];
                if (!nodeB?.scene) continue;
                this.drawChainLightningLine(webGfx, nodeA.x, nodeA.y, nodeB.x, nodeB.y, 0x88d8ff, 0.6, 1.6);
            }
        }

        const webTween = this.scene.tweens.add({
            targets: webGfx,
            alpha: 0,
            duration: 220,
            onComplete: () => webGfx.destroy()
        });
        state.tweens.push(webTween);

        // Plasma expansion sphere: multi-ring outward pulse
        for (let r = 0; r < 4; r++) {
            const plasmaRing = this.scene.add.circle(
                centerX, centerY,
                20 + r * 8,
                0x000000, 0
            ).setStrokeStyle(2.5 - r * 0.4, [0xe6fbff, 0xc8f4ff, 0x88d8ff, 0x5ec8ff][r], 0.9 - r * 0.15)
             .setDepth(192);

            const pRingTween = this.scene.tweens.add({
                targets: plasmaRing,
                radius: cfg.nodeRadius * (0.6 + r * 0.25),
                alpha: 0,
                duration: 200 + r * 50,
                delay: r * 25,
                ease: 'Cubic.easeOut',
                onComplete: () => plasmaRing.destroy()
            });
            state.tweens.push(pRingTween);
        }

        // Electric cage visual with rotating arcs
        const cage = this.scene.add.circle(centerX, centerY, cfg.nodeRadius * 0.45, 0x5ebfff, 0.25).setDepth(189);

        const cageArcGfx = this.scene.add.graphics().setDepth(193);
        const cageArcCount = 8;
        for (let ca = 0; ca < cageArcCount; ca++) {
            const cageAngle = (ca / cageArcCount) * Math.PI * 2;
            const endR = cfg.nodeRadius * 0.45;
            const ex = centerX + Math.cos(cageAngle) * endR;
            const ey = centerY + Math.sin(cageAngle) * endR;
            this.drawChainLightningLine(cageArcGfx, centerX, centerY, ex, ey, 0xc8f4ff, 0.7, 1.8);
        }

        const cageArcTween = this.scene.tweens.add({
            targets: cageArcGfx,
            alpha: 0,
            duration: 250,
            onComplete: () => cageArcGfx.destroy()
        });
        state.tweens.push(cageArcTween);

        const ring = this.scene.add.circle(centerX, centerY, 32, 0x000000, 0)
            .setStrokeStyle(4, 0xe6fbff, 0.95)
            .setDepth(192);

        const cageTween = this.scene.tweens.add({
            targets: cage,
            radius: cfg.nodeRadius,
            alpha: 0,
            duration: 260,
            ease: 'Cubic.easeOut',
            onComplete: () => cage.destroy()
        });
        const ringTween = this.scene.tweens.add({
            targets: ring,
            radius: cfg.nodeRadius * 1.25,
            alpha: 0,
            duration: 260,
            ease: 'Cubic.easeOut',
            onComplete: () => ring.destroy()
        });
        state.tweens.push(cageTween, ringTween);

        // EMP shockwave with ionization ripple
        const shockwave = this.scene.add.circle(centerX, centerY, 30, 0x000000, 0)
            .setStrokeStyle(5, 0xffffff, 0.6).setDepth(194);
        const ionRipple = this.scene.add.circle(centerX, centerY, 35, 0x63cfff, 0.15).setDepth(193);

        const shockTween = this.scene.tweens.add({
            targets: shockwave,
            radius: cfg.nodeRadius * 1.5,
            alpha: 0,
            duration: 320,
            ease: 'Sine.easeOut',
            onComplete: () => shockwave.destroy()
        });
        const ionTween = this.scene.tweens.add({
            targets: ionRipple,
            radius: cfg.nodeRadius * 1.35,
            alpha: 0,
            duration: 300,
            ease: 'Cubic.easeOut',
            onComplete: () => ionRipple.destroy()
        });
        state.tweens.push(shockTween, ionTween);

        // Chain lightning discharge burst: radial bolts
        const dischargeGfx = this.scene.add.graphics().setDepth(195);
        for (let d = 0; d < 12; d++) {
            const dAngle = (d / 12) * Math.PI * 2 + Math.random() * 0.2;
            const dLen = Phaser.Math.Between(60, cfg.nodeRadius);
            this.drawChainLightningBolt(dischargeGfx, centerX, centerY, dAngle, dLen);
        }
        const dischargeTween = this.scene.tweens.add({
            targets: dischargeGfx,
            alpha: 0,
            duration: 200,
            onComplete: () => dischargeGfx.destroy()
        });
        state.tweens.push(dischargeTween);

        // Chain spark particle explosion
        for (let cs = 0; cs < 16; cs++) {
            const csAngle = (cs / 16) * Math.PI * 2;
            const csSpark = this.scene.add.image(centerX, centerY, 'tg-chain-spark')
                .setDepth(194).setScale(Phaser.Math.FloatBetween(0.6, 1.2)).setAlpha(0.9);
            this.scene.tweens.add({
                targets: csSpark,
                x: centerX + Math.cos(csAngle) * Phaser.Math.Between(50, cfg.nodeRadius),
                y: centerY + Math.sin(csAngle) * Phaser.Math.Between(50, cfg.nodeRadius),
                alpha: 0,
                angle: Phaser.Math.Between(60, 300),
                scale: 0.12,
                duration: Phaser.Math.Between(160, 300),
                onComplete: () => csSpark.destroy()
            });
        }

        // Storm wisp burst
        for (let sw = 0; sw < 10; sw++) {
            const swAngle = Math.random() * Math.PI * 2;
            const wisp = this.scene.add.image(centerX, centerY, 'tg-storm-wisp')
                .setDepth(193).setScale(Phaser.Math.FloatBetween(0.8, 1.5)).setAlpha(0.75);
            this.scene.tweens.add({
                targets: wisp,
                x: centerX + Math.cos(swAngle) * Phaser.Math.Between(40, cfg.nodeRadius * 0.9),
                y: centerY + Math.sin(swAngle) * Phaser.Math.Between(40, cfg.nodeRadius * 0.9),
                alpha: 0,
                scale: 0.2,
                duration: Phaser.Math.Between(200, 380),
                onComplete: () => wisp.destroy()
            });
        }

        this.scene.cameras.main.flash(160, 180, 245, 255);
        this.scene.cameras.main.shake(230, 0.009);

        const empDamage = cfg.empDamage * (this.player.damageMultiplier || 1.0);
        boss.takeDamage(empDamage);
        this.gainUltimateGaugeFromDamage(empDamage, { charged: true });
        boss.setTint(0xe8fbff);

        const knockAngle = Math.atan2(boss.y - this.player.y, boss.x - this.player.x);
        this.scene.tweens.add({
            targets: boss,
            x: boss.x + Math.cos(knockAngle) * 140,
            y: boss.y + Math.sin(knockAngle) * 140,
            duration: 180,
            ease: 'Power2'
        });

        this.player.alpha = 1;
        this.player.untargetable = false;
        this.player.multishot = 1;
        this.player.multishotCount = Math.max(this.player.multishotCount || 0, cfg.afterBuffShots);

        this.scene.time.delayedCall(cfg.afterBuffDuration, () => {
            if (!this.player?.scene) return;
            this.player.multishotCount = 0;
            this.player.multishot = 0;
        });

        this.scene.time.delayedCall(120, () => boss?.clearTint?.());
        this.destroyUltimateState();
    }

    // ─── DESTROY ULTIMATE STATE ─────────────────────────────────────────────────
    destroyUltimateState() {
        const state = this.ultimateState;
        if (!state) return;

        for (const tween of state.tweens || []) {
            tween?.stop?.();
            tween?.remove?.();
        }

        this.scene.tweens.killTweensOf(state.orb);
        this.scene.tweens.killTweensOf(state.ring);
        state.orb?.destroy();
        state.ring?.destroy();
        state.plasmaEmitter?.destroy?.();
        state.moteEmitter?.destroy?.();
        state.arcGraphics?.destroy?.();
        state.chargeWebGfx?.destroy?.();

        for (const timer of state.timers || []) timer?.remove?.();
        for (const node of state.nodes || []) {
            this.scene.tweens.killTweensOf(node);
            node?.destroy?.();
        }

        this.player.alpha = 1;
        this.player.untargetable = false;
        this.ultimateState = null;
    }

    // ─── HELPER: Spawn Plasma Spark ─────────────────────────────────────────────
    spawnPlasmaSpark(x, y, angle) {
        const spark = this.scene.add.image(
            x + Phaser.Math.Between(-5, 5),
            y + Phaser.Math.Between(-5, 5),
            'tg-plasma-orb'
        ).setDepth(155).setScale(Phaser.Math.FloatBetween(0.4, 0.9)).setAlpha(0.88);

        const drift = angle + Phaser.Math.FloatBetween(-0.6, 0.6);
        this.scene.tweens.add({
            targets: spark,
            x: spark.x + Math.cos(drift) * Phaser.Math.Between(12, 32),
            y: spark.y + Math.sin(drift) * Phaser.Math.Between(12, 32),
            alpha: 0,
            scale: 0.1,
            duration: Phaser.Math.Between(80, 180),
            onComplete: () => spark.destroy()
        });
    }

    // ─── HELPER: Spawn Static Mote ──────────────────────────────────────────────
    spawnStaticMote(x, y) {
        const mote = this.scene.add.image(
            x + Phaser.Math.Between(-8, 8),
            y + Phaser.Math.Between(-8, 8),
            'tg-static-mote'
        ).setDepth(154).setScale(Phaser.Math.FloatBetween(0.5, 1.0)).setAlpha(0.9);

        const driftAngle = Math.random() * Math.PI * 2;
        this.scene.tweens.add({
            targets: mote,
            x: mote.x + Math.cos(driftAngle) * Phaser.Math.Between(6, 18),
            y: mote.y + Math.sin(driftAngle) * Phaser.Math.Between(6, 18),
            alpha: 0,
            scale: 0.2,
            duration: Phaser.Math.Between(70, 150),
            onComplete: () => mote.destroy()
        });
    }

    // ─── HELPER: Draw Lightning Fork (local coords for container graphics) ──────
    drawLightningFork(graphics, x, y, angle) {
        const color = Phaser.Math.RND.pick([0xc8f4ff, 0x9ee8ff, 0x7bd4ff]);
        const alpha = Phaser.Math.FloatBetween(0.55, 0.9);
        const width = Phaser.Math.FloatBetween(1.0, 2.2);
        graphics.lineStyle(width, color, alpha);
        graphics.beginPath();
        graphics.moveTo(x, y);

        let cx = x;
        let cy = y;
        const segs = Phaser.Math.Between(2, 4);
        const segLen = Phaser.Math.Between(6, 14);

        for (let s = 0; s < segs; s++) {
            cx += Math.cos(angle) * segLen + Phaser.Math.Between(-4, 4);
            cy += Math.sin(angle) * segLen + Phaser.Math.Between(-4, 4);
            graphics.lineTo(cx, cy);
        }
        graphics.strokePath();

        // Sub-fork branch
        if (Math.random() > 0.5 && segs >= 2) {
            const branchAngle = angle + Phaser.Math.FloatBetween(-0.8, 0.8);
            graphics.lineStyle(width * 0.6, color, alpha * 0.7);
            graphics.beginPath();
            const bx = x + Math.cos(angle) * segLen;
            const by = y + Math.sin(angle) * segLen;
            graphics.moveTo(bx, by);
            graphics.lineTo(
                bx + Math.cos(branchAngle) * segLen * 0.7 + Phaser.Math.Between(-3, 3),
                by + Math.sin(branchAngle) * segLen * 0.7 + Phaser.Math.Between(-3, 3)
            );
            graphics.strokePath();
        }
    }

    // ─── HELPER: Draw Lightning Fork (world coords) ─────────────────────────────
    drawLightningForkWorld(graphics, x, y, angle, length, color, alpha) {
        color = color || 0xc8f4ff;
        alpha = alpha || 0.8;
        length = length || 16;
        const width = Phaser.Math.FloatBetween(1.0, 2.0);
        graphics.lineStyle(width, color, alpha);
        graphics.beginPath();
        graphics.moveTo(x, y);

        let cx = x;
        let cy = y;
        const segs = Phaser.Math.Between(2, 4);
        const segLen = length / segs;

        for (let s = 0; s < segs; s++) {
            cx += Math.cos(angle) * segLen + Phaser.Math.Between(-4, 4);
            cy += Math.sin(angle) * segLen + Phaser.Math.Between(-4, 4);
            graphics.lineTo(cx, cy);
        }
        graphics.strokePath();
    }

    // ─── HELPER: Draw Chain Lightning Bolt (world coords, single direction) ─────
    drawChainLightningBolt(graphics, x, y, angle, length) {
        const colors = [0xc8f4ff, 0x9ee8ff, 0xd8f7ff];
        const color = Phaser.Math.RND.pick(colors);
        const alpha = Phaser.Math.FloatBetween(0.6, 0.92);
        const width = Phaser.Math.FloatBetween(1.2, 2.6);
        graphics.lineStyle(width, color, alpha);
        graphics.beginPath();
        graphics.moveTo(x, y);

        let cx = x;
        let cy = y;
        const segs = Phaser.Math.Between(3, 6);
        const segLen = length / segs;

        for (let s = 0; s < segs; s++) {
            cx += Math.cos(angle) * segLen + Phaser.Math.Between(-8, 8);
            cy += Math.sin(angle) * segLen + Phaser.Math.Between(-8, 8);
            graphics.lineTo(cx, cy);
        }
        graphics.strokePath();

        // Branch fork
        if (Math.random() > 0.45) {
            const branchStart = Phaser.Math.Between(1, segs - 1);
            const bx = x + Math.cos(angle) * segLen * branchStart + Phaser.Math.Between(-5, 5);
            const by = y + Math.sin(angle) * segLen * branchStart + Phaser.Math.Between(-5, 5);
            const bAngle = angle + Phaser.Math.FloatBetween(-0.9, 0.9);
            const bLen = length * Phaser.Math.FloatBetween(0.3, 0.55);
            graphics.lineStyle(width * 0.6, color, alpha * 0.65);
            graphics.beginPath();
            graphics.moveTo(bx, by);
            let bcx = bx;
            let bcy = by;
            const bSegs = Phaser.Math.Between(2, 3);
            for (let bs = 0; bs < bSegs; bs++) {
                bcx += Math.cos(bAngle) * (bLen / bSegs) + Phaser.Math.Between(-5, 5);
                bcy += Math.sin(bAngle) * (bLen / bSegs) + Phaser.Math.Between(-5, 5);
                graphics.lineTo(bcx, bcy);
            }
            graphics.strokePath();
        }
    }

    // ─── HELPER: Draw Chain Lightning Line (point to point with jags) ───────────
    drawChainLightningLine(graphics, x1, y1, x2, y2, color, alpha, width) {
        color = color || 0xc8f4ff;
        alpha = alpha || 0.8;
        width = width || 2;

        const dist = Phaser.Math.Distance.Between(x1, y1, x2, y2);
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const perpX = -Math.sin(angle);
        const perpY = Math.cos(angle);
        const segs = Math.max(3, Math.floor(dist / 18));

        graphics.lineStyle(width, color, alpha);
        graphics.beginPath();
        graphics.moveTo(x1, y1);

        for (let s = 1; s < segs; s++) {
            const t = s / segs;
            const baseX = Phaser.Math.Linear(x1, x2, t);
            const baseY = Phaser.Math.Linear(y1, y2, t);
            const jitter = Phaser.Math.Between(-10, 10);
            graphics.lineTo(baseX + perpX * jitter, baseY + perpY * jitter);
        }

        graphics.lineTo(x2, y2);
        graphics.strokePath();

        // Add a branch fork at a random point along the line
        if (dist > 40 && Math.random() > 0.4) {
            const bt = Phaser.Math.FloatBetween(0.25, 0.75);
            const bx = Phaser.Math.Linear(x1, x2, bt) + Phaser.Math.Between(-5, 5);
            const by = Phaser.Math.Linear(y1, y2, bt) + Phaser.Math.Between(-5, 5);
            const bAngle = angle + Phaser.Math.FloatBetween(-1.2, 1.2);
            const bLen = dist * Phaser.Math.FloatBetween(0.15, 0.35);
            graphics.lineStyle(width * 0.55, color, alpha * 0.6);
            graphics.beginPath();
            graphics.moveTo(bx, by);
            graphics.lineTo(
                bx + Math.cos(bAngle) * bLen * 0.5 + Phaser.Math.Between(-4, 4),
                by + Math.sin(bAngle) * bLen * 0.5 + Phaser.Math.Between(-4, 4)
            );
            graphics.lineTo(
                bx + Math.cos(bAngle) * bLen + Phaser.Math.Between(-4, 4),
                by + Math.sin(bAngle) * bLen + Phaser.Math.Between(-4, 4)
            );
            graphics.strokePath();
        }
    }

    // ─── HELPER: Spawn Arc Trail Segment ────────────────────────────────────────
    spawnArcTrailSegment(x, y, angle) {
        const arcSeg = this.scene.add.graphics().setDepth(153);
        const arcColor = Phaser.Math.RND.pick([0xb8eeff, 0x9ee8ff, 0x7bd4ff]);
        arcSeg.lineStyle(Phaser.Math.FloatBetween(1, 2), arcColor, Phaser.Math.FloatBetween(0.5, 0.85));
        arcSeg.beginPath();
        arcSeg.moveTo(x, y);
        const drift = angle + Phaser.Math.FloatBetween(-0.5, 0.5);
        arcSeg.lineTo(
            x + Math.cos(drift) * Phaser.Math.Between(6, 14) + Phaser.Math.Between(-3, 3),
            y + Math.sin(drift) * Phaser.Math.Between(6, 14) + Phaser.Math.Between(-3, 3)
        );
        arcSeg.strokePath();
        this.scene.tweens.add({
            targets: arcSeg,
            alpha: 0,
            duration: Phaser.Math.Between(60, 120),
            onComplete: () => arcSeg.destroy()
        });
    }

    // ─── HELPER: Static Buildup Burst (for charged attack start) ────────────────
    createStaticBuildupBurst(x, y) {
        // Radial static motes
        for (let i = 0; i < 10; i++) {
            const mote = this.scene.add.image(x, y, 'tg-static-mote')
                .setDepth(159).setScale(Phaser.Math.FloatBetween(0.6, 1.2)).setAlpha(0.9);
            const burstAngle = (i / 10) * Math.PI * 2;
            this.scene.tweens.add({
                targets: mote,
                x: x + Math.cos(burstAngle) * Phaser.Math.Between(18, 42),
                y: y + Math.sin(burstAngle) * Phaser.Math.Between(18, 42),
                alpha: 0,
                scale: 0.15,
                duration: Phaser.Math.Between(100, 200),
                onComplete: () => mote.destroy()
            });
        }

        // Electric burst arcs
        const burstGfx = this.scene.add.graphics().setDepth(160);
        for (let i = 0; i < 6; i++) {
            const bAngle = (i / 6) * Math.PI * 2 + Math.random() * 0.3;
            this.drawChainLightningBolt(burstGfx, x, y, bAngle, Phaser.Math.Between(20, 45));
        }
        this.scene.tweens.add({
            targets: burstGfx,
            alpha: 0,
            duration: 180,
            onComplete: () => burstGfx.destroy()
        });

        // Central flash
        const flash = this.scene.add.circle(x, y, 22, 0xc8f4ff, 0.45).setDepth(158);
        this.scene.tweens.add({
            targets: flash,
            scale: 2,
            alpha: 0,
            duration: 160,
            ease: 'Cubic.easeOut',
            onComplete: () => flash.destroy()
        });
    }

    // ─── HELPER: Charged Impact FX (concentric electric rings + plasma explosion)
    createChargedImpactFX(x, y) {
        // Concentric electric rings
        for (let r = 0; r < 3; r++) {
            const impactRing = this.scene.add.circle(x, y, 16 + r * 8, 0x000000, 0)
                .setStrokeStyle(2.5 - r * 0.5, [0xe6fbff, 0xc8f4ff, 0x88d8ff][r], 0.85 - r * 0.15)
                .setDepth(158);
            this.scene.tweens.add({
                targets: impactRing,
                radius: 50 + r * 25,
                alpha: 0,
                duration: 180 + r * 40,
                delay: r * 20,
                ease: 'Cubic.easeOut',
                onComplete: () => impactRing.destroy()
            });
        }

        // Plasma explosion particles
        for (let p = 0; p < 8; p++) {
            const pAngle = (p / 8) * Math.PI * 2;
            const particle = this.scene.add.image(x, y, 'tg-plasma-orb')
                .setDepth(159).setScale(Phaser.Math.FloatBetween(0.6, 1.1)).setAlpha(0.9);
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(pAngle) * Phaser.Math.Between(30, 65),
                y: y + Math.sin(pAngle) * Phaser.Math.Between(30, 65),
                alpha: 0,
                scale: 0.12,
                duration: Phaser.Math.Between(130, 240),
                onComplete: () => particle.destroy()
            });
        }

        // Chain spark burst
        for (let cs = 0; cs < 6; cs++) {
            const csAngle = Math.random() * Math.PI * 2;
            const csp = this.scene.add.image(x, y, 'tg-chain-spark')
                .setDepth(160).setScale(Phaser.Math.FloatBetween(0.5, 0.9)).setAlpha(0.85);
            this.scene.tweens.add({
                targets: csp,
                x: x + Math.cos(csAngle) * Phaser.Math.Between(25, 55),
                y: y + Math.sin(csAngle) * Phaser.Math.Between(25, 55),
                alpha: 0,
                angle: Phaser.Math.Between(50, 200),
                scale: 0.1,
                duration: Phaser.Math.Between(120, 220),
                onComplete: () => csp.destroy()
            });
        }
    }

    // ─── HELPER: Ionized Ground Circle ──────────────────────────────────────────
    createIonizedGround(x, y) {
        // Expanding ionized ground circle
        const groundCircle = this.scene.add.circle(x, y, 18, 0x3ab0ee, 0.18).setDepth(140);
        const groundRing = this.scene.add.circle(x, y, 18, 0x000000, 0)
            .setStrokeStyle(1.5, 0x88d8ff, 0.55).setDepth(141);

        // Crackling lightning across ground
        const groundGfx = this.scene.add.graphics().setDepth(142);
        for (let i = 0; i < 4; i++) {
            const gAngle = (i / 4) * Math.PI * 2 + Math.random() * 0.5;
            this.drawLightningForkWorld(groundGfx, x, y, gAngle, Phaser.Math.Between(20, 40), 0x88d8ff, 0.5);
        }

        this.scene.tweens.add({
            targets: groundCircle,
            radius: 50,
            alpha: 0,
            duration: 600,
            ease: 'Sine.easeOut',
            onComplete: () => groundCircle.destroy()
        });
        this.scene.tweens.add({
            targets: groundRing,
            radius: 55,
            alpha: 0,
            duration: 650,
            ease: 'Sine.easeOut',
            onComplete: () => groundRing.destroy()
        });
        this.scene.tweens.add({
            targets: groundGfx,
            alpha: 0,
            duration: 500,
            onComplete: () => groundGfx.destroy()
        });

        // Static motes rising from ionized ground
        for (let m = 0; m < 5; m++) {
            this.scene.time.delayedCall(m * 80, () => {
                const mAngle = Math.random() * Math.PI * 2;
                const mDist = Phaser.Math.Between(5, 30);
                this.spawnStaticMote(
                    x + Math.cos(mAngle) * mDist,
                    y + Math.sin(mAngle) * mDist
                );
            });
        }
    }

}
