// CharacterRenderer3D.js - Renders a 3D GLB character from a top-down view
// Uses Three.js to render to an offscreen canvas, then feeds that into Phaser as a dynamic texture.

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class CharacterRenderer3D {
    /**
     * @param {object} options
     * @param {number} options.size       - Pixel size of the offscreen render (square). Default 128.
     * @param {string} options.modelPath  - Path to the .glb file.
     * @param {string} options.animationName - Name of the animation clip to play (e.g. "Runfast").
     */
    constructor(options = {}) {
        this.size = options.size || 128;
        this.modelPath = options.modelPath || '/RogueV3.glb';
        this.animationName = options.animationName || 'Runfast';
        this._frustum = options.frustum || 2.0;
        this._modelScale = options.modelScale || 2.6;
        // Camera tilt from vertical in radians (0 = pure top-down, ~0.35 = subtle 3/4 view)
        this._cameraTilt = options.cameraTilt != null ? options.cameraTilt : 0.35;
        this._camDist = 6;

        // Optional correction rotation for models with non-standard orientation
        // (e.g. Z-up models from Blender that weren't converted to Y-up on export)
        this._correctionQuat = null;
        if (options.correctionRotation) {
            this._correctionQuat = new THREE.Quaternion().setFromEuler(
                new THREE.Euler(
                    options.correctionRotation.x || 0,
                    options.correctionRotation.y || 0,
                    options.correctionRotation.z || 0
                )
            );
        }

        this.ready = false;
        this.model = null;
        this.mixer = null;
        this.actions = {};          // name (lowercase) → THREE.AnimationAction
        this.currentActionName = null;
        this.clock = new THREE.Clock();
        this._modelCenterY = 0;

        // WebGL canvas (internal — Three.js renders here)
        this._glCanvas = document.createElement('canvas');
        this._glCanvas.width = this.size;
        this._glCanvas.height = this.size;

        // Output 2D canvas (what callers read via .canvas)
        // We copy from WebGL and force all alpha to 1.0 here.
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.size;
        this.canvas.height = this.size;
        this._outputCtx = this.canvas.getContext('2d');

        // Three.js renderer — no alpha, solid magenta background.
        // We chroma-key the magenta out in the render() post-process
        // to create proper transparency without any alpha issues.
        this.renderer = new THREE.WebGLRenderer({
            canvas: this._glCanvas,
            alpha: false,
            antialias: true,
            preserveDrawingBuffer: true
        });
        this.renderer.setSize(this.size, this.size);
        this.renderer.setClearColor(0xff00ff, 1);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;

        // Scene
        this.scene = new THREE.Scene();

        // Orthographic camera with slight 3/4 tilt that orbits behind the character
        const frustum = this._frustum;
        this.camera = new THREE.OrthographicCamera(
            -frustum, frustum,
            frustum, -frustum,
            0.1, 100
        );
        // Initial position (updated each frame in render() based on facing)
        this.camera.position.set(0, this._camDist, 0);
        this.camera.lookAt(0, 0, 0);

        // Lighting
        const ambient = new THREE.AmbientLight(0xffffff, 1.5);
        this.scene.add(ambient);

        const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
        dirLight.position.set(2, 8, 2);
        dirLight.castShadow = false;
        this.scene.add(dirLight);

        // Rim light for visibility
        const rimLight = new THREE.DirectionalLight(0x88bbff, 0.8);
        rimLight.position.set(-2, 5, -2);
        this.scene.add(rimLight);

        // Store facing angle (radians) for rotating the model to match movement direction
        this.facingAngle = 0;
    }

    /**
     * Load the GLB model. Returns a promise that resolves when ready.
     */
    load() {
        return new Promise((resolve, reject) => {
            const loader = new GLTFLoader();
            loader.load(
                this.modelPath,
                (gltf) => {
                    this.model = gltf.scene;

                    // Apply correction rotation before computing bounds
                    // so that bounding box reflects the corrected orientation
                    if (this._correctionQuat) {
                        this.model.quaternion.copy(this._correctionQuat);
                        this.model.updateMatrixWorld(true);
                    }

                    // Auto-center and scale the model to fit the frustum
                    const box = new THREE.Box3().setFromObject(this.model);
                    const center = box.getCenter(new THREE.Vector3());
                    const bsize = box.getSize(new THREE.Vector3());
                    const maxDim = Math.max(bsize.x, bsize.y, bsize.z);
                    const scale = this._modelScale / maxDim;
                    this.model.scale.setScalar(scale);
                    // Center horizontally/depth, pin feet to ground (bottom of bbox)
                    this.model.position.set(
                        -center.x * scale,
                        -box.min.y * scale,
                        -center.z * scale
                    );

                    // Fix transparency: replace GLTF materials entirely with
                    // clean MeshLambertMaterials and strip texture alpha so
                    // the model is always 100% opaque (no see-through patches).
                    this.model.traverse((child) => {
                        if (child.isMesh) {
                            child.frustumCulled = false;
                            const oldMats = Array.isArray(child.material) ? child.material : [child.material];
                            const oldMat = oldMats[0];

                            const newMat = new THREE.MeshLambertMaterial({
                                side: THREE.DoubleSide,
                                transparent: false,
                                depthWrite: true,
                                opacity: 1.0,
                            });

                            // Copy the diffuse texture but force every pixel opaque
                            if (oldMat.map && oldMat.map.image) {
                                const img = oldMat.map.image;
                                const w = img.width || img.naturalWidth || 256;
                                const h = img.height || img.naturalHeight || 256;
                                const c = document.createElement('canvas');
                                c.width = w;
                                c.height = h;
                                const ctx = c.getContext('2d');
                                // Fill black first so alpha=0 areas get a color
                                ctx.fillStyle = '#000';
                                ctx.fillRect(0, 0, w, h);
                                ctx.drawImage(img, 0, 0, w, h);
                                // Force every pixel fully opaque
                                const id = ctx.getImageData(0, 0, w, h);
                                for (let i = 3; i < id.data.length; i += 4) id.data[i] = 255;
                                ctx.putImageData(id, 0, 0);

                                const newTex = new THREE.CanvasTexture(c);
                                newTex.flipY = oldMat.map.flipY;
                                newTex.wrapS = oldMat.map.wrapS;
                                newTex.wrapT = oldMat.map.wrapT;
                                newTex.magFilter = oldMat.map.magFilter;
                                newTex.minFilter = oldMat.map.minFilter;
                                newTex.colorSpace = oldMat.map.colorSpace;
                                newTex.needsUpdate = true;
                                newMat.map = newTex;
                            }

                            child.material = newMat;
                            for (const m of oldMats) m.dispose();
                        }
                    });

                    this.scene.add(this.model);

                    // Compute model's vertical center for camera lookAt
                    const scaledBox = new THREE.Box3().setFromObject(this.model);
                    this._modelCenterY = (scaledBox.min.y + scaledBox.max.y) / 2;

                    // Setup animations — store every clip for runtime switching
                    if (gltf.animations && gltf.animations.length > 0) {
                        this.mixer = new THREE.AnimationMixer(this.model);

                        console.log('Available animations:', gltf.animations.map(a => a.name));

                        for (const clip of gltf.animations) {
                            const action = this.mixer.clipAction(clip);
                            this.actions[clip.name.toLowerCase()] = action;
                        }

                        // Start with the requested animation
                        this.playAnimation(this.animationName);
                    }

                    this.ready = true;
                    resolve(this);
                },
                undefined,
                (error) => {
                    console.error('Failed to load 3D character:', error);
                    reject(error);
                }
            );
        });
    }

    /**
     * Set the facing direction of the character (radians).
     * 0 = right, PI/2 = down, PI = left, -PI/2 = up (in 2D screen coords).
     */
    setFacing(angleRadians) {
        this.facingAngle = angleRadians;
    }

    /**
     * Render one frame. Call this every game tick.
     * Returns the canvas element (for Phaser to read).
     */
    render() {
        if (!this.ready) return this.canvas;

        // Update animation
        if (this.mixer) {
            const delta = this.clock.getDelta();
            this.mixer.update(delta);
        }

        if (this.model) {
            // Rotate model to face movement direction
            if (this._correctionQuat) {
                // Use quaternion math so correction (world X) and facing (world Y)
                // are both applied in world space without Euler-order issues
                const facingQuat = new THREE.Quaternion().setFromAxisAngle(
                    new THREE.Vector3(0, 1, 0),
                    -this.facingAngle + Math.PI / 2
                );
                this.model.quaternion.copy(facingQuat.multiply(this._correctionQuat.clone()));
            } else {
                this.model.rotation.y = -this.facingAngle + Math.PI / 2;
            }

            // Fixed-angle camera with slight tilt for 3/4 perspective (like classic RPGs).
            // Camera is tilted from the "south" (+Z direction = bottom of screen).
            // As the model rotates, you naturally see different sides of the character.
            const tilt = this._cameraTilt;
            const d = this._camDist;

            this.camera.position.set(
                0,
                d * Math.cos(tilt),
                d * Math.sin(tilt)
            );
            this.camera.lookAt(0, this._modelCenterY, 0);
        }

        this.renderer.render(this.scene, this.camera);

        // Read raw pixels from WebGL via readPixels (avoids drawImage
        // issues where alpha:false canvases can produce alpha=0 pixels).
        // Flip vertically (WebGL Y=0 is bottom) and chroma-key out the
        // magenta background, making everything else fully opaque.
        const gl = this.renderer.getContext();
        const sz = this.size;
        if (!this._readBuf) this._readBuf = new Uint8Array(sz * sz * 4);
        const buf = this._readBuf;
        gl.readPixels(0, 0, sz, sz, gl.RGBA, gl.UNSIGNED_BYTE, buf);

        const ctx = this._outputCtx;
        const imageData = ctx.createImageData(sz, sz);
        const out = imageData.data;

        for (let y = 0; y < sz; y++) {
            const srcRow = (sz - 1 - y) * sz * 4;   // flip vertically
            const dstRow = y * sz * 4;
            for (let x = 0; x < sz; x++) {
                const si = srcRow + x * 4;
                const di = dstRow + x * 4;
                const r = buf[si], g = buf[si + 1], b = buf[si + 2];
                // Magenta background (0xff00ff) → transparent
                // Tight threshold to avoid false-matching model colours
                if (r > 240 && g < 15 && b > 240) {
                    out[di] = out[di + 1] = out[di + 2] = out[di + 3] = 0;
                } else {
                    out[di]     = r;
                    out[di + 1] = g;
                    out[di + 2] = b;
                    out[di + 3] = 255;   // force fully opaque
                }
            }
        }
        ctx.putImageData(imageData, 0, 0);

        return this.canvas;
    }

    /**
     * Switch to a named animation with a smooth crossfade.
     * No-op if already playing that animation.
     * @param {string} name - Animation name (case-insensitive).
     * @param {number} fadeDuration - Crossfade duration in seconds.
     */
    playAnimation(name, fadeDuration = 0.25) {
        if (!this.mixer) return;

        const key = name.toLowerCase();
        if (this.currentActionName === key) return;   // already playing

        // Find by exact key first, then by substring match
        let nextAction = this.actions[key];
        if (!nextAction) {
            const found = Object.keys(this.actions).find(k => k.includes(key));
            if (found) nextAction = this.actions[found];
        }

        if (!nextAction) {
            console.warn(`Animation "${name}" not found in model.`);
            return;
        }

        const prevAction = this.currentActionName ? (this.actions[this.currentActionName]
            || Object.values(this.actions).find(a => a.isRunning())) : null;

        nextAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();

        if (prevAction && prevAction !== nextAction) {
            prevAction.crossFadeTo(nextAction, fadeDuration, true);
        }

        this.currentActionName = key;
    }

    /**
     * Clean up Three.js resources.
     */
    destroy() {
        if (this.mixer) this.mixer.stopAllAction();
        if (this.renderer) this.renderer.dispose();
        if (this.model) {
            this.model.traverse((child) => {
                if (child.isMesh) {
                    child.geometry?.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(m => m.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                }
            });
        }
    }
}
