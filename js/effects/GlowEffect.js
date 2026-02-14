// GlowEffect.js - Glow effect for objects
export class GlowEffect {
    constructor(scene, target, color = 0x00d4ff, size = 1.5) {
        this.scene = scene;
        this.target = target;
        this.color = color;
        
        this.glow = scene.add.circle(target.x, target.y, target.width || 30, color, 0.3);
        this.glow.setDepth(target.depth - 1);
        
        this.animate();
    }
    
    animate() {
        this.scene.tweens.add({
            targets: this.glow,
            scale: 1.3,
            alpha: 0.15,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
    
    update() {
        if (this.glow && this.target) {
            this.glow.x = this.target.x;
            this.glow.y = this.target.y;
        }
    }
    
    destroy() {
        if (this.glow) {
            this.glow.destroy();
        }
    }
}