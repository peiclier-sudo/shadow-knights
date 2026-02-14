// FireballProjectile.js - Fireball projectile (Staff)
import { Projectile } from './Projectile.js';

export class FireballProjectile extends Projectile {
    constructor(scene, x, y, angle, data) {
        super(scene, x, y, angle, data);
        
        // Fireball visuals
        this.removeAll();
        
        // Core
        const core = scene.add.circle(0, 0, data.size * 0.8, 0xffaa00);
        
        // Inner glow
        const innerGlow = scene.add.circle(0, 0, data.size * 1.2, 0xff6600, 0.7);
        
        // Outer glow
        const outerGlow = scene.add.circle(0, 0, data.size * 1.8, 0xff3300, 0.4);
        
        this.add([outerGlow, innerGlow, core]);
        
        // Pulsing animation
        scene.tweens.add({
            targets: this,
            scale: 1.1,
            duration: 100,
            yoyo: true,
            repeat: -1
        });
    }
    
    update(delta) {
        super.update(delta);
        
        // Add random fire particles
        if (Math.random() > 0.7) {
            const particle = this.scene.add.circle(
                this.x + (Math.random() - 0.5) * 20,
                this.y + (Math.random() - 0.5) * 20,
                3 + Math.random() * 4,
                0xff6600,
                0.6
            );
            
            this.scene.tweens.add({
                targets: particle,
                alpha: 0,
                scale: 1.5,
                duration: 200,
                onComplete: () => particle.destroy()
            });
        }
    }
}