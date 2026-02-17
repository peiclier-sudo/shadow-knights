// FirestaffVFX.js
// Rebuilt firestaff VFX: complex procedural arcane-fire animation (no external assets)

const DEFAULT_SETTINGS = {
    tipOffsetX: 42,
    tipOffsetY: -30,

    idleBobAmplitude: 2.2,
    idleBobSpeed: 0.0045,
    idleFlickerSpeed: 0.011,

    glowSize: 46,
    intensity: 1,

    emberRate: 28,
    attackSparkBurst: 34,
    hitSparkBurst: 24,

    trailLength: 14,
    trailStepMs: 16,
    trailAlpha: 0.24,

    attackSwingDeg: 96,
    attackDurationMs: 115,
    attackOvershootDeg: 19,

    debug: false
};

export class FirestaffVFX {
    constructor(scene, settings = {}) {
        this.scene = scene;
        this.settings = { ...DEFAULT_SETTINGS, ...settings };

        this.owner = null;
        this.facing = 1;
        this.active = true;

        this.time = 0;
        this.isAttacking = false;
        this.trailEvent = null;

        this._ensureTextures();

        this.root = scene.add.container(0, 0).setDepth(200);

        this._buildStaffMesh();
        this._buildArcaneFlameLayers();
        this._buildEmitters();
        this._buildDebug();

        this.playIdle();
        this.setActive(true);
    }

    setOwner(ownerSprite) {
        this.owner = ownerSprite;
        this._syncToOwner();
    }

    setFacing(dir) {
        this.facing = dir >= 0 ? 1 : -1;
        this.root.scaleX = this.facing;
        this._syncToOwner();
    }

    setActive(active) {
        this.active = !!active;
        this.root.setVisible(this.active);
        this.emberEmitter.on = this.active;
        this.ashEmitter.on = this.active;

        if (!this.active) {
            this._stopTrail();
        }
    }

    getContainer() {
        return this.root;
    }

    getTipWorldPosition() {
        const localTip = new Phaser.Math.Vector2(this.settings.tipOffsetX, this.settings.tipOffsetY);
        const mat = this.root.getWorldTransformMatrix();
        const out = new Phaser.Math.Vector2();
        mat.transformPoint(localTip.x, localTip.y, out);
        return out;
    }

    playIdle() {
        if (!this.active) return;

        this.idleTweenA?.remove();
        this.idleTweenB?.remove();

        this.idleTweenA = this.scene.tweens.add({
            targets: [this.flameShell, this.auraLarge, this.plasmaRibbon],
            alpha: { from: 0.48, to: 0.86 },
            duration: 360,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.idleTweenB = this.scene.tweens.add({
            targets: [this.flameCore, this.crystalGlow],
            scaleX: { from: 0.92, to: 1.16 },
            scaleY: { from: 1.08, to: 0.84 },
            duration: 210,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    playAttack() {
        if (!this.active || this.isAttacking) return;

        this.isAttacking = true;
        const baseRot = this.root.rotation;
        const swingRad = Phaser.Math.DegToRad(this.settings.attackSwingDeg * this.facing);
        const overshootRad = Phaser.Math.DegToRad(this.settings.attackOvershootDeg * this.facing);

        this._spawnTipPulse(1.4);
        this._spawnArcaneRing(0.95);
        this._spawnAttackBurst(this.settings.attackSparkBurst);
        this._startTrail();

        this.scene.tweens.add({
            targets: this.root,
            rotation: baseRot + swingRad,
            duration: this.settings.attackDurationMs,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                this.scene.tweens.add({
                    targets: this.root,
                    rotation: baseRot + swingRad - overshootRad,
                    duration: 70,
                    ease: 'Quad.easeInOut',
                    yoyo: true,
                    onComplete: () => {
                        this.isAttacking = false;
                        this._stopTrail();
                    }
                });
            }
        });
    }

    playHitFlash() {
        if (!this.active) return;

        this._spawnTipPulse(1.9);
        this._spawnArcaneRing(1.25);
        this._spawnAttackBurst(this.settings.hitSparkBurst);

        const tip = this.getTipWorldPosition();
        const impactShard = this.scene.add.image(tip.x, tip.y, 'fs_shard')
            .setDepth(this.root.depth + 6)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setScale(0.7)
            .setAlpha(0.95);

        this.scene.tweens.add({
            targets: impactShard,
            angle: 110,
            scale: 2,
            alpha: 0,
            duration: 180,
            ease: 'Cubic.easeOut',
            onComplete: () => impactShard.destroy()
        });
    }

    update(dt) {
        if (!this.active) return;

        this.time += dt;
        this._syncToOwner();

        const t = this.time;
        const bob = Math.sin(t * this.settings.idleBobSpeed) * this.settings.idleBobAmplitude;
        const flicker = 1 + Math.sin(t * this.settings.idleFlickerSpeed) * 0.09;

        this.flameRoot.y = bob;
        this.flameCore.scaleX = 0.94 * flicker;
        this.flameCore.scaleY = 1.08 / flicker;

        this.flameShell.x = Math.cos(t * 0.0037) * 4;
        this.flameShell.y = Math.sin(t * 0.0029) * 3;

        this.runeRing.rotation += 0.0019 * dt;
        this.innerRuneRing.rotation -= 0.0026 * dt;
        this.plasmaRibbon.rotation += 0.0012 * dt;

        this.crystalShine.alpha = 0.55 + Math.sin(t * 0.013) * 0.3;
        this.auraSmall.scale = (this.settings.glowSize * 0.58) / 32 + Math.sin(t * 0.009) * 0.04;

        this._updateEmitterFollow();
        this._updateDebug();
    }

    destroy() {
        this._stopTrail();

        this.idleTweenA?.remove();
        this.idleTweenB?.remove();

        this.emberManager?.destroy();
        this.sparkManager?.destroy();
        this.ashManager?.destroy();

        this.debugGraphics?.destroy();
        this.debugTip?.destroy();
        this.root?.destroy(true);
    }

    _buildStaffMesh() {
        const shaft = this.scene.add.rectangle(0, 0, 78, 8, 0x3f2518, 1);
        const grain = this.scene.add.rectangle(0, 1, 78, 2, 0x2a160d, 0.65);
        const band1 = this.scene.add.rectangle(-16, 0, 10, 12, 0x7f5b37, 0.92);
        const band2 = this.scene.add.rectangle(-28, 0, 10, 12, 0x7f5b37, 0.92);
        const ringMetal = this.scene.add.circle(33, 0, 8, 0x6d6258, 1).setStrokeStyle(2, 0xc9b48b, 0.88);

        this.crystalBase = this.scene.add.polygon(
            this.settings.tipOffsetX - 8,
            this.settings.tipOffsetY + 3,
            [0, 0, 10, -6, 16, 0, 10, 9],
            0x51473f,
            1
        ).setStrokeStyle(2, 0xc9b48b, 0.68);

        this.crystalGlow = this.scene.add.image(this.settings.tipOffsetX - 2, this.settings.tipOffsetY + 1, 'fs_glow_soft')
            .setBlendMode(Phaser.BlendModes.ADD)
            .setScale(0.58)
            .setAlpha(0.76);

        this.crystalShine = this.scene.add.image(this.settings.tipOffsetX + 2, this.settings.tipOffsetY - 3, 'fs_shard')
            .setBlendMode(Phaser.BlendModes.ADD)
            .setScale(0.38)
            .setAlpha(0.7);

        this.root.add([
            shaft,
            grain,
            band1,
            band2,
            ringMetal,
            this.crystalBase,
            this.crystalGlow,
            this.crystalShine
        ]);
    }

    _buildArcaneFlameLayers() {
        this.flameRoot = this.scene.add.container(this.settings.tipOffsetX, this.settings.tipOffsetY);

        this.auraLarge = this.scene.add.image(0, 0, 'fs_glow_soft')
            .setBlendMode(Phaser.BlendModes.ADD)
            .setScale(this.settings.glowSize / 32)
            .setAlpha(0.62 * this.settings.intensity);

        this.auraSmall = this.scene.add.image(0, 0, 'fs_glow_soft')
            .setBlendMode(Phaser.BlendModes.ADD)
            .setScale((this.settings.glowSize * 0.58) / 32)
            .setAlpha(0.9 * this.settings.intensity);

        this.runeRing = this.scene.add.image(0, 0, 'fs_rune_ring')
            .setBlendMode(Phaser.BlendModes.ADD)
            .setScale(0.92)
            .setAlpha(0.5);

        this.innerRuneRing = this.scene.add.image(0, 0, 'fs_rune_ring')
            .setBlendMode(Phaser.BlendModes.ADD)
            .setScale(0.58)
            .setAlpha(0.68);

        this.plasmaRibbon = this.scene.add.image(0, 0, 'fs_plasma_ribbon')
            .setBlendMode(Phaser.BlendModes.ADD)
            .setScale(1.05)
            .setAlpha(0.46);

        this.flameShell = this.scene.add.image(0, 0, 'fs_flame_outer')
            .setBlendMode(Phaser.BlendModes.ADD)
            .setScale(0.95)
            .setAlpha(0.72);

        this.flameCore = this.scene.add.image(0, 0, 'fs_flame_core')
            .setBlendMode(Phaser.BlendModes.ADD)
            .setScale(0.74)
            .setAlpha(0.96);

        this.flameRoot.add([
            this.auraLarge,
            this.runeRing,
            this.plasmaRibbon,
            this.flameShell,
            this.auraSmall,
            this.innerRuneRing,
            this.flameCore
        ]);

        this.root.add(this.flameRoot);
    }

    _buildEmitters() {
        this.emberManager = this.scene.add.particles('fs_spark_dot').setDepth(this.root.depth + 2).setBlendMode(Phaser.BlendModes.ADD);
        this.emberEmitter = this.emberManager.createEmitter({
            x: 0,
            y: 0,
            lifespan: { min: 280, max: 620 },
            speed: { min: 10, max: 46 },
            angle: { min: 210, max: 330 },
            scale: { start: 0.32, end: 0 },
            alpha: { start: 0.95, end: 0 },
            tint: [0xfff5d0, 0xffcb81, 0xff8436],
            quantity: 1,
            frequency: Math.max(12, 1000 / this.settings.emberRate),
            blendMode: Phaser.BlendModes.ADD
        });

        this.sparkManager = this.scene.add.particles('fs_spark_dot').setDepth(this.root.depth + 4).setBlendMode(Phaser.BlendModes.ADD);
        this.sparkEmitter = this.sparkManager.createEmitter({
            x: 0,
            y: 0,
            speed: { min: 90, max: 280 },
            angle: { min: 0, max: 360 },
            lifespan: { min: 130, max: 260 },
            scale: { start: 0.45, end: 0 },
            alpha: { start: 1, end: 0 },
            tint: [0xffffff, 0xffe6b0, 0xffa95a],
            quantity: 0,
            blendMode: Phaser.BlendModes.ADD,
            emitting: false
        });

        this.ashManager = this.scene.add.particles('fs_smoke_dot').setDepth(this.root.depth + 1);
        this.ashEmitter = this.ashManager.createEmitter({
            x: 0,
            y: 0,
            lifespan: { min: 420, max: 980 },
            speedX: { min: -16, max: 16 },
            speedY: { min: -34, max: -10 },
            scale: { start: 0.3, end: 1.15 },
            alpha: { start: 0.24, end: 0 },
            tint: [0x46332a, 0x352821, 0x5f4335],
            quantity: 1,
            frequency: 90,
            blendMode: Phaser.BlendModes.NORMAL
        });
    }

    _buildDebug() {
        this.debugGraphics = this.scene.add.graphics().setDepth(this.root.depth + 10);
        this.debugTip = this.scene.add.circle(0, 0, 3, 0x00ffff, 0.9).setDepth(this.root.depth + 11);
        this.debugTip.setVisible(this.settings.debug);
    }

    _syncToOwner() {
        if (!this.owner) return;
        const baseX = this.owner.x + (this.facing > 0 ? 16 : -16);
        const baseY = this.owner.y - 8;
        this.root.setPosition(baseX, baseY);
    }

    _updateEmitterFollow() {
        const tip = this.getTipWorldPosition();
        this.emberEmitter.setPosition(tip.x, tip.y);
        this.sparkEmitter.setPosition(tip.x, tip.y);
        this.ashEmitter.setPosition(tip.x, tip.y + 4);
    }

    _spawnTipPulse(scaleMult = 1) {
        const tip = this.getTipWorldPosition();
        const pulse = this.scene.add.image(tip.x, tip.y, 'fs_glow_soft')
            .setDepth(this.root.depth + 5)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setScale(0.4)
            .setAlpha(0.95);

        this.scene.tweens.add({
            targets: pulse,
            scale: 1.1 * scaleMult,
            alpha: 0,
            duration: 145,
            ease: 'Cubic.easeOut',
            onComplete: () => pulse.destroy()
        });
    }

    _spawnArcaneRing(scaleMult = 1) {
        const tip = this.getTipWorldPosition();
        const ring = this.scene.add.image(tip.x, tip.y, 'fs_rune_ring')
            .setDepth(this.root.depth + 5)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setScale(0.28)
            .setAlpha(0.86);

        this.scene.tweens.add({
            targets: ring,
            angle: 220,
            scale: 1.24 * scaleMult,
            alpha: 0,
            duration: 210,
            ease: 'Cubic.easeOut',
            onComplete: () => ring.destroy()
        });
    }

    _spawnAttackBurst(count) {
        this.sparkEmitter.explode(count);
    }

    _startTrail() {
        this._stopTrail();

        this.trailEvent = this.scene.time.addEvent({
            delay: this.settings.trailStepMs,
            repeat: this.settings.trailLength,
            callback: () => {
                const tip = this.getTipWorldPosition();
                const ghost = this.scene.add.image(tip.x, tip.y, 'fs_plasma_ribbon')
                    .setDepth(this.root.depth - 1)
                    .setBlendMode(Phaser.BlendModes.ADD)
                    .setAlpha(this.settings.trailAlpha)
                    .setScale(0.72 + Math.random() * 0.32)
                    .setRotation(this.root.rotation + Phaser.Math.FloatBetween(-0.3, 0.3));

                this.scene.tweens.add({
                    targets: ghost,
                    alpha: 0,
                    scaleX: ghost.scaleX * 0.68,
                    scaleY: ghost.scaleY * 0.68,
                    duration: 220,
                    ease: 'Sine.easeOut',
                    onComplete: () => ghost.destroy()
                });
            }
        });
    }

    _stopTrail() {
        if (!this.trailEvent) return;
        this.trailEvent.remove(false);
        this.trailEvent = null;
    }

    _updateDebug() {
        if (!this.settings.debug) {
            this.debugGraphics.clear();
            return;
        }

        const tip = this.getTipWorldPosition();
        this.debugTip.setVisible(true);
        this.debugTip.setPosition(tip.x, tip.y);

        this.debugGraphics.clear();
        this.debugGraphics.lineStyle(1, 0x00ffff, 0.5);

        const ox = this.root.x;
        const oy = this.root.y;
        const r = 58;
        const spread = Phaser.Math.DegToRad(this.settings.attackSwingDeg);
        const facingAngle = this.facing > 0 ? 0 : Math.PI;

        this.debugGraphics.beginPath();
        this.debugGraphics.arc(ox, oy, r, facingAngle - spread * 0.5, facingAngle + spread * 0.5);
        this.debugGraphics.strokePath();
        this.debugGraphics.lineBetween(ox, oy, tip.x, tip.y);
    }

    _ensureTextures() {
        const tex = this.scene.textures;

        if (!tex.exists('fs_flame_core')) makeCircleTexture(this.scene, 'fs_flame_core', 30, 1.65, 0xfff7d9);
        if (!tex.exists('fs_flame_outer')) makeCircleTexture(this.scene, 'fs_flame_outer', 38, 2.5, 0xff8f36);
        if (!tex.exists('fs_glow_soft')) makeCircleTexture(this.scene, 'fs_glow_soft', 46, 3.25, 0xffa04b);
        if (!tex.exists('fs_spark_dot')) makeSparkTexture(this.scene, 'fs_spark_dot');
        if (!tex.exists('fs_smoke_dot')) makeSmokeTexture(this.scene, 'fs_smoke_dot');
        if (!tex.exists('fs_rune_ring')) makeRuneRingTexture(this.scene, 'fs_rune_ring', 128);
        if (!tex.exists('fs_plasma_ribbon')) makePlasmaRibbonTexture(this.scene, 'fs_plasma_ribbon', 96, 64);
        if (!tex.exists('fs_shard')) makeShardTexture(this.scene, 'fs_shard', 52);
    }
}

export function makeCircleTexture(scene, key, radius, alphaFalloff = 2, color = 0xffffff) {
    if (scene.textures.exists(key)) return;

    const size = radius * 2;
    const g = scene.add.graphics();

    const layers = Math.max(12, Math.floor(radius));
    for (let i = layers; i >= 1; i--) {
        const t = i / layers;
        const alpha = Math.pow(t, alphaFalloff) * 0.9;
        g.fillStyle(color, alpha);
        g.fillCircle(radius, radius, radius * t);
    }

    g.generateTexture(key, size, size);
    g.destroy();
}

export function makeSparkTexture(scene, key) {
    if (scene.textures.exists(key)) return;

    const g = scene.add.graphics();
    const size = 14;
    const c = size / 2;

    g.fillStyle(0xffffff, 1);
    g.fillCircle(c, c, 2.2);

    g.lineStyle(1, 0xffffff, 0.88);
    g.beginPath();
    g.moveTo(c - 5, c);
    g.lineTo(c + 5, c);
    g.moveTo(c, c - 5);
    g.lineTo(c, c + 5);
    g.strokePath();

    g.generateTexture(key, size, size);
    g.destroy();
}

export function makeSmokeTexture(scene, key) {
    if (scene.textures.exists(key)) return;

    const g = scene.add.graphics();
    g.fillStyle(0xffffff, 0.45);
    g.fillCircle(14, 16, 10);
    g.fillCircle(21, 13, 8);
    g.fillCircle(8, 12, 7);

    g.generateTexture(key, 32, 32);
    g.destroy();
}

export function makeRuneRingTexture(scene, key, size = 128) {
    if (scene.textures.exists(key)) return;

    const g = scene.add.graphics();
    const c = size / 2;
    const outer = c - 6;

    g.lineStyle(2, 0xffdca0, 0.8);
    g.strokeCircle(c, c, outer);
    g.lineStyle(1, 0xffa24c, 0.6);
    g.strokeCircle(c, c, outer - 7);

    for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2;
        const x1 = c + Math.cos(a) * (outer - 2);
        const y1 = c + Math.sin(a) * (outer - 2);
        const x2 = c + Math.cos(a) * (outer - 11);
        const y2 = c + Math.sin(a) * (outer - 11);

        g.lineStyle(2, 0xffdca0, 0.74);
        g.lineBetween(x1, y1, x2, y2);

        const runeX = c + Math.cos(a + 0.08) * (outer - 18);
        const runeY = c + Math.sin(a + 0.08) * (outer - 18);
        g.fillStyle(0xffb865, 0.82);
        g.fillRect(runeX - 1, runeY - 3, 2, 6);
    }

    g.generateTexture(key, size, size);
    g.destroy();
}

export function makePlasmaRibbonTexture(scene, key, width = 96, height = 64) {
    if (scene.textures.exists(key)) return;

    const g = scene.add.graphics();
    const midY = height * 0.5;

    g.lineStyle(6, 0xffcb88, 0.48);
    g.beginPath();
    g.moveTo(6, midY);

    for (let x = 6; x <= width - 6; x += 6) {
        const y = midY + Math.sin(x * 0.22) * 12;
        g.lineTo(x, y);
    }

    g.strokePath();

    g.lineStyle(3, 0xfff0cf, 0.64);
    g.beginPath();
    g.moveTo(6, midY + 3);

    for (let x = 6; x <= width - 6; x += 6) {
        const y = midY + Math.sin(x * 0.22 + 0.9) * 8;
        g.lineTo(x, y);
    }

    g.strokePath();

    g.generateTexture(key, width, height);
    g.destroy();
}

export function makeShardTexture(scene, key, size = 52) {
    if (scene.textures.exists(key)) return;

    const g = scene.add.graphics();
    const c = size / 2;

    g.fillStyle(0xfff3d2, 0.9);
    g.fillPoints([
        new Phaser.Geom.Point(c, 6),
        new Phaser.Geom.Point(c + 8, c - 3),
        new Phaser.Geom.Point(c + 2, c + 16),
        new Phaser.Geom.Point(c - 7, c - 1)
    ], true);

    g.lineStyle(1, 0xffffff, 0.9);
    g.strokePoints([
        new Phaser.Geom.Point(c, 6),
        new Phaser.Geom.Point(c + 8, c - 3),
        new Phaser.Geom.Point(c + 2, c + 16),
        new Phaser.Geom.Point(c - 7, c - 1)
    ], true);

    g.generateTexture(key, size, size);
    g.destroy();
}
