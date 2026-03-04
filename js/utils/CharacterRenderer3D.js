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

        // Three.js renderer — alpha:true with transparent clear colour.
        // The GPU alpha channel gives a perfect model/background mask
        // without needing any chroma-keying.
        this.renderer = new THREE.WebGLRenderer({
            canvas: this._glCanvas,
            alpha: true,
            antialias: true,
            preserveDrawingBuffer: true,
            premultipliedAlpha: false
        });
        this.renderer.setSize(this.size, this.size);
        this.renderer.setClearColor(0x000000, 0);
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

                    // Aggressively sanitize every material to eliminate all
                    // transparency.  Matches the proven approach from the
                    // working soulikeHTML game that uses this same model.
                    this.model.traverse((child) => {
                        if (child.isMesh) {
                            child.frustumCulled = false;
                            const mats = Array.isArray(child.material)
                                ? child.material : [child.material];
                            child.material = mats.map((m) => {
                                const mat = m.clone();
                                mat.transparent = false;
                                mat.opacity = 1.0;
                                mat.alphaTest = 0.0;
                                mat.alphaMap = null;
                                mat.transmission = 0;
                                mat.thickness = 0;
                                mat.premultipliedAlpha = false;
                                mat.blending = THREE.NormalBlending;
                                mat.side = THREE.DoubleSide;
                                mat.depthWrite = true;
                                mat.depthTest = true;
                                mat.envMapIntensity = 0.0;
                                if (mat.map) mat.map.premultiplyAlpha = false;
                                mat.needsUpdate = true;
                                return mat;
                            });
                            // Unwrap single-element arrays
                            if (Array.isArray(child.material) && child.material.length === 1) {
                                child.material = child.material[0];
                            }
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
                            // Strip any tracks that target material properties
                            // (opacity, alphaTest, etc.) — GLTF animations can
                            // include these and the mixer would override our
                            // transparency fixes every frame.
                            clip.tracks = clip.tracks.filter(t =>
                                !t.name.includes('material') &&
                                !t.name.includes('opacity') &&
                                !t.name.includes('alpha') &&
                                !t.name.includes('visible')
                            );
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

        // Read raw pixels via readPixels (avoids drawImage browser quirks).
        // The GPU alpha channel separates model (alpha>0) from background
        // (alpha==0).  We then flood-fill from canvas edges so only
        // edge-connected transparent pixels become background.  Interior
        // transparent pixels (gaps from skinning deformation) stay opaque,
        // preventing see-through holes during animation.
        const gl = this.renderer.getContext();
        const sz = this.size;
        if (!this._readBuf) this._readBuf = new Uint8Array(sz * sz * 4);
        const buf = this._readBuf;
        gl.readPixels(0, 0, sz, sz, gl.RGBA, gl.UNSIGNED_BYTE, buf);

        const ctx = this._outputCtx;
        const imageData = ctx.createImageData(sz, sz);
        const out = imageData.data;

        // Pass 1: flip vertically into output buffer, preserving GPU alpha
        for (let y = 0; y < sz; y++) {
            const srcRow = (sz - 1 - y) * sz * 4;
            const dstRow = y * sz * 4;
            for (let x = 0; x < sz; x++) {
                const si = srcRow + x * 4;
                const di = dstRow + x * 4;
                out[di]     = buf[si];
                out[di + 1] = buf[si + 1];
                out[di + 2] = buf[si + 2];
                out[di + 3] = buf[si + 3];
            }
        }

        // Pass 2: flood fill from canvas edges.
        // Transparent pixels (alpha==0) connected to the border → background.
        // Transparent pixels NOT connected to the border → interior gap → keep opaque.
        if (!this._bgMask) this._bgMask = new Uint8Array(sz * sz);
        const bg = this._bgMask;
        bg.fill(0);   // 0 = unvisited

        const stack = [];
        // Seed every edge pixel
        for (let x = 0; x < sz; x++) {
            stack.push(x);                       // top row
            stack.push((sz - 1) * sz + x);       // bottom row
        }
        for (let y = 1; y < sz - 1; y++) {
            stack.push(y * sz);                   // left column
            stack.push(y * sz + sz - 1);          // right column
        }

        while (stack.length > 0) {
            const idx = stack.pop();
            if (bg[idx]) continue;                // already visited
            if (out[idx * 4 + 3] === 0) {
                bg[idx] = 1;                      // background
                const x = idx % sz, y = (idx / sz) | 0;
                if (x > 0)      stack.push(idx - 1);
                if (x < sz - 1) stack.push(idx + 1);
                if (y > 0)      stack.push(idx - sz);
                if (y < sz - 1) stack.push(idx + sz);
            } else {
                bg[idx] = 2;                      // model — stop expanding
            }
        }

        // Pass 3: apply mask
        for (let i = 0; i < sz * sz; i++) {
            const pi = i * 4;
            if (bg[i] === 1) {
                // Background: fully transparent
                out[pi] = out[pi + 1] = out[pi + 2] = out[pi + 3] = 0;
            } else {
                // Model (or interior gap): force fully opaque
                out[pi + 3] = 255;
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
