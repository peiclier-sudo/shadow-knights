// FirestaffVFX.js
// Fully procedural firestaff VFX for Phaser 3 (no external assets)

const DEFAULT_SETTINGS = {
    tipOffsetX: 40,
    tipOffsetY: -30,

    idleBobAmplitude: 1.8,
    idleBobSpeed: 0.005,
    idleFlickerSpeed: 0.012,
    idleSwirlRadius: 3.5,

    glowSize: 40,
    intensity: 1,

    emberRate: 20,
    attackSparkBurst: 22,
    hitSparkBurst: 16,

    trailLength: 10,
    trailStepMs: 18,
    trailAlpha: 0.24,

    attackSwingDeg: 86,
    attackDurationMs: 95,
    attackOvershootDeg: 16,

    debug: false
};

export class FirestaffVFX {
    /**
     * @param {Phaser.Scene} scene
     * @param {object} settings
     */
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

        this.root = scene.add.container(0, 0);
        this.root.setDepth(200);

        this._buildStaffMesh();
        this._buildFlameLayers();
        this._buildEmitters();
        this._buildDebug();

        this.playIdle();
        this.setActive(true);
    }

    // ---------- Public API ----------

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

        if (!this.active) {
            this.emberEmitter.on = false;
            this._stopTrail();
        } else {
            this.emberEmitter.on = true;
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

        if (this.idleTween) this.idleTween.remove();
        this.idleTween = this.scene.tweens.add({
            targets: [this.flameOuter, this.auraLarge],
            alpha: { from: 0.55, to: 0.85 },
            duration: 320,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.scene.tweens.add({
            targets: [this.flameCore, this.auraSmall],
            scaleX: { from: 0.95, to: 1.08 },
            scaleY: { from: 1.02, to: 0.9 },
            duration: 180,
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

        this._spawnTipPulse(1.2);
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
                    duration: 65,
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
        this._spawnTipPulse(1.7);
        this._spawnAttackBurst(this.settings.hitSparkBurst);

        const tip = this.getTipWorldPosition();
        const hitRing = this.scene.add.image(tip.x, tip.y, 'fs_glow_soft')
            .setBlendMode(Phaser.BlendModes.ADD)
            .setDepth(this.root.depth + 5)
            .setScale(0.35)
            .setAlpha(0.95);

        this.scene.tweens.add({
            targets: hitRing,
            scale: 1.4,
            alpha: 0,
            duration: 140,
            ease: 'Cubic.easeOut',
            onComplete: () => hitRing.destroy()
        });
    }

    /**
     * Must be called from Scene.update(time, delta)
     * @param {number} dt - delta in ms
     */
    update(dt) {
        if (!this.active) return;

        this.time += dt;
        this._syncToOwner();

        const t = this.time;
        const bob = Math.sin(t * this.settings.idleBobSpeed) * this.settings.idleBobAmplitude;
        const flicker = 1 + Math.sin(t * this.settings.idleFlickerSpeed) * 0.07;

        this.flameRoot.y = bob;
        this.flameCore.scaleX = 0.95 * flicker;
        this.flameCore.scaleY = 1.08 / flicker;

        const swirlX = Math.cos(t * 0.004) * this.settings.idleSwirlRadius;
        const swirlY = Math.sin(t * 0.0032) * (this.settings.idleSwirlRadius * 0.6);
        this.flameOuter.x = swirlX;
        this.flameOuter.y = swirlY;

        this._updateEmitterFollow();
        this._updateDebug();
    }

    destroy() {
        this._stopTrail();
        this.sparkManager?.destroy();
        this.emberManager?.destroy();
        this.idleTween?.remove();
        this.debugGraphics?.destroy();
        this.debugTip?.destroy();
        this.root?.destroy(true);
    }

    // ---------- Build ----------

    _buildStaffMesh() {
        const shaft = this.scene.add.rectangle(0, 0, 74, 8, 0x4b2d19, 1);
        const shaftDark = this.scene.add.rectangle(0, 2, 74, 2, 0x2e1a10, 0.6);
        const grip1 = this.scene.add.rectangle(-10, 0, 8, 10, 0x7a512f, 0.9);
        const grip2 = this.scene.add.rectangle(-22, 0, 8, 10, 0x7a512f, 0.9);
        const cap = this.scene.add.circle(34, 0, 7, 0x9d6b3f, 1).setStrokeStyle(2, 0xd9a76a, 0.8);
        const tipMetal = this.scene.add.circle(this.settings.tipOffsetX - 6, this.settings.tipOffsetY + 2, 5, 0x5f5850, 1)
            .setStrokeStyle(2, 0xd0b88c, 0.9);

        this.root.add([shaft, shaftDark, grip1, grip2, cap, tipMetal]);
    }

    _buildFlameLayers() {
        this.flameRoot = this.scene.add.container(this.settings.tipOffsetX, this.settings.tipOffsetY);

        this.auraLarge = this.scene.add.image(0, 0, 'fs_glow_soft')
            .setBlendMode(Phaser.BlendModes.ADD)
            .setScale(this.settings.glowSize / 32)
            .setAlpha(0.55 * this.settings.intensity);

        this.auraSmall = this.scene.add.image(0, 0, 'fs_glow_soft')
            .setBlendMode(Phaser.BlendModes.ADD)
            .setScale((this.settings.glowSize * 0.6) / 32)
            .setAlpha(0.8 * this.settings.intensity);

        this.flameOuter = this.scene.add.image(0, 0, 'fs_flame_outer')
            .setBlendMode(Phaser.BlendModes.ADD)
            .setScale(0.92)
            .setAlpha(0.7);

        this.flameCore = this.scene.add.image(0, 0, 'fs_flame_core')
            .setBlendMode(Phaser.BlendModes.ADD)
            .setScale(0.72)
            .setAlpha(0.95);

        this.flameRoot.add([this.auraLarge, this.auraSmall, this.flameOuter, this.flameCore]);
        this.root.add(this.flameRoot);
    }

    _buildEmitters() {
        this.emberManager = this.scene.add.particles('fs_spark_dot');
        this.emberManager.setDepth(this.root.depth + 2);
        this.emberManager.setBlendMode(Phaser.BlendModes.ADD);

        this.emberEmitter = this.emberManager.createEmitter({
            x: 0,
            y: 0,
            lifespan: { min: 220, max: 480 },
            speed: { min: 12, max: 38 },
            angle: { min: 220, max: 320 },
            scale: { start: 0.26, end: 0 },
            alpha: { start: 0.95, end: 0 },
            tint: [0xfff1b3, 0xffc46b, 0xff8b3a],
            quantity: 1,
            frequency: Math.max(16, 1000 / this.settings.emberRate),
            blendMode: Phaser.BlendModes.ADD
        });

        this.sparkManager = this.scene.add.particles('fs_spark_dot');
        this.sparkManager.setDepth(this.root.depth + 3);
        this.sparkManager.setBlendMode(Phaser.BlendModes.ADD);

        this.sparkEmitter = this.sparkManager.createEmitter({
            x: 0,
            y: 0,
            speed: { min: 60, max: 220 },
            angle: { min: 0, max: 360 },
            lifespan: { min: 120, max: 220 },
            scale: { start: 0.38, end: 0 },
            alpha: { start: 1, end: 0 },
            tint: [0xffffff, 0xffe4a6, 0xffa54f],
            quantity: 0,
            blendMode: Phaser.BlendModes.ADD,
            emitting: false
        });
    }

    _buildDebug() {
        this.debugGraphics = this.scene.add.graphics().setDepth(this.root.depth + 10);
        this.debugTip = this.scene.add.circle(0, 0, 3, 0x00ffff, 0.9).setDepth(this.root.depth + 11);
        this.debugTip.setVisible(this.settings.debug);
    }

    // ---------- Runtime helpers ----------

    _syncToOwner() {
        if (!this.owner) return;

        const baseX = this.owner.x + (this.facing > 0 ? 16 : -16);
        const baseY = this.owner.y - 8;

        this.root.x = baseX;
        this.root.y = baseY;
    }

    _updateEmitterFollow() {
        const tip = this.getTipWorldPosition();
        this.emberEmitter.setPosition(tip.x, tip.y);
        this.sparkEmitter.setPosition(tip.x, tip.y);
    }

    _spawnTipPulse(scaleMult = 1) {
        const tip = this.getTipWorldPosition();
        const pulse = this.scene.add.image(tip.x, tip.y, 'fs_glow_soft')
            .setDepth(this.root.depth + 4)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setScale(0.35)
            .setAlpha(0.92);

        this.scene.tweens.add({
            targets: pulse,
            scale: 1.05 * scaleMult,
            alpha: 0,
            duration: 120,
            ease: 'Cubic.easeOut',
            onComplete: () => pulse.destroy()
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
                const ghost = this.scene.add.image(tip.x, tip.y, 'fs_flame_outer')
                    .setDepth(this.root.depth - 1)
                    .setBlendMode(Phaser.BlendModes.ADD)
                    .setAlpha(this.settings.trailAlpha)
                    .setScale(0.75 + Math.random() * 0.25)
                    .setRotation(this.root.rotation + Phaser.Math.FloatBetween(-0.25, 0.25));

                this.scene.tweens.add({
                    targets: ghost,
                    alpha: 0,
                    scaleX: ghost.scaleX * 0.7,
                    scaleY: ghost.scaleY * 0.7,
                    duration: 180,
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

        // Attack arc preview around owner
        const ox = this.root.x;
        const oy = this.root.y;
        const r = 56;
        const spread = Phaser.Math.DegToRad(this.settings.attackSwingDeg);
        const facingAngle = this.facing > 0 ? 0 : Math.PI;
        this.debugGraphics.beginPath();
        this.debugGraphics.arc(ox, oy, r, facingAngle - spread * 0.5, facingAngle + spread * 0.5);
        this.debugGraphics.strokePath();

        // Tip link line
        this.debugGraphics.lineBetween(ox, oy, tip.x, tip.y);
    }

    // ---------- Texture generation ----------

    _ensureTextures() {
        const tex = this.scene.textures;

        if (!tex.exists('fs_flame_core')) {
            makeCircleTexture(this.scene, 'fs_flame_core', 28, 1.8, 0xfff6d2);
        }
        if (!tex.exists('fs_flame_outer')) {
            makeCircleTexture(this.scene, 'fs_flame_outer', 36, 2.6, 0xff8c31);
        }
        if (!tex.exists('fs_glow_soft')) {
            makeCircleTexture(this.scene, 'fs_glow_soft', 44, 3.2, 0xffa048);
        }
        if (!tex.exists('fs_spark_dot')) {
            makeSparkTexture(this.scene, 'fs_spark_dot');
        }
        if (!tex.exists('fs_noise_strip')) {
            makeNoiseStripTexture(this.scene, 'fs_noise_strip', 64, 12);
        }
    }
}

/**
 * Creates a soft circular gradient texture with configurable falloff.
 * @param {Phaser.Scene} scene
 * @param {string} key
 * @param {number} radius
 * @param {number} alphaFalloff
 * @param {number} color
 */
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

/**
 * Tiny spark texture for embers/bursts.
 * @param {Phaser.Scene} scene
 * @param {string} key
 */
export function makeSparkTexture(scene, key) {
    if (scene.textures.exists(key)) return;

    const g = scene.add.graphics();
    const size = 12;
    const c = size / 2;

    g.fillStyle(0xffffff, 1);
    g.fillCircle(c, c, 2);

    g.lineStyle(1, 0xffffff, 0.85);
    g.beginPath();
    g.moveTo(c - 4, c);
    g.lineTo(c + 4, c);
    g.moveTo(c, c - 4);
    g.lineTo(c, c + 4);
    g.strokePath();

    g.generateTexture(key, size, size);
    g.destroy();
}

/**
 * Optional subtle shimmer/noise strip texture.
 * @param {Phaser.Scene} scene
 * @param {string} key
 * @param {number} width
 * @param {number} height
 */
export function makeNoiseStripTexture(scene, key, width = 64, height = 8) {
    if (scene.textures.exists(key)) return;

    const rt = scene.make.renderTexture({ x: 0, y: 0, width, height, add: false });
    const g = scene.add.graphics();

    for (let i = 0; i < 60; i++) {
        const x = Phaser.Math.Between(0, width);
        const y = Phaser.Math.Between(0, height);
        const a = Phaser.Math.FloatBetween(0.04, 0.16);
        g.fillStyle(0xffffff, a);
        g.fillRect(x, y, Phaser.Math.Between(1, 3), 1);
    }

    rt.draw(g, 0, 0);
    rt.saveTexture(key);

    g.destroy();
    rt.destroy();
}
