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

        this.ready = false;
        this.model = null;
        this.mixer = null;
        this.currentAction = null;
        this.clock = new THREE.Clock();

        // Offscreen canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.size;
        this.canvas.height = this.size;

        // Three.js renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: true,
            preserveDrawingBuffer: true
        });
        this.renderer.setSize(this.size, this.size);
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;

        // Scene
        this.scene = new THREE.Scene();

        // Top-down camera (orthographic, looking straight down)
        const aspect = 1;
        const frustum = 1.2;
        this.camera = new THREE.OrthographicCamera(
            -frustum * aspect, frustum * aspect,
            frustum, -frustum,
            0.1, 100
        );
        // Position camera above, looking down
        this.camera.position.set(0, 5, 0);
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

                    // Auto-center and scale the model
                    const box = new THREE.Box3().setFromObject(this.model);
                    const center = box.getCenter(new THREE.Vector3());
                    const size = box.getSize(new THREE.Vector3());
                    const maxDim = Math.max(size.x, size.y, size.z);
                    const scale = 1.8 / maxDim;
                    this.model.scale.setScalar(scale);
                    this.model.position.set(
                        -center.x * scale,
                        -center.y * scale,
                        -center.z * scale
                    );

                    this.scene.add(this.model);

                    // Setup animations
                    if (gltf.animations && gltf.animations.length > 0) {
                        this.mixer = new THREE.AnimationMixer(this.model);

                        // Try to find the requested animation
                        let clip = gltf.animations.find(
                            c => c.name.toLowerCase().includes(this.animationName.toLowerCase())
                        );

                        // Fallback to first animation
                        if (!clip) {
                            console.warn(`Animation "${this.animationName}" not found. Available:`,
                                gltf.animations.map(a => a.name));
                            clip = gltf.animations[0];
                        }

                        if (clip) {
                            console.log(`Playing animation: ${clip.name}`);
                            this.currentAction = this.mixer.clipAction(clip);
                            this.currentAction.play();
                        }
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

        // Rotate model to face movement direction
        // In top-down view: model Y-axis rotation maps to 2D facing angle
        if (this.model) {
            this.model.rotation.y = -this.facingAngle + Math.PI / 2;
        }

        this.renderer.render(this.scene, this.camera);
        return this.canvas;
    }

    /**
     * Play a specific animation by name.
     */
    playAnimation(name) {
        if (!this.mixer || !this.model) return;
        // Would need to store clips - for now the constructor handles this
        this.animationName = name;
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
