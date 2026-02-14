// ShakeEffect.js - Camera shake effect
export class ShakeEffect {
    constructor(scene) {
        this.scene = scene;
        this.camera = scene.cameras.main;
    }
    
    shake(intensity = 0.01, duration = 100) {
        this.camera.shake(duration, intensity);
    }
    
    shakeLight() {
        this.shake(0.003, 80);
    }
    
    shakeMedium() {
        this.shake(0.007, 120);
    }
    
    shakeHeavy() {
        this.shake(0.015, 200);
    }
    
    shakeBossDeath() {
        this.shake(0.02, 300);
    }
    
    shakeExplosion() {
        this.shake(0.01, 150);
    }
}