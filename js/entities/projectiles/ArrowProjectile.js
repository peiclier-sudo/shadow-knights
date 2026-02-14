// ArrowProjectile.js - Arrow projectile (Bow)
import { Projectile } from './Projectile.js';

export class ArrowProjectile extends Projectile {
    constructor(scene, x, y, angle, data) {
        super(scene, x, y, angle, data);
        
        // Arrow shape (rectangle instead of circle)
        this.removeAll();
        
        const arrow = scene.add.rectangle(0, 0, data.size * 2, data.size, data.color);
        arrow.setStrokeStyle(1, 0xffffff);
        
        const tip = scene.add.triangle(data.size, 0, 0, -3, 0, 3, 5, 0, data.color);
        
        this.add([arrow, tip]);
        this.setRotation(angle);
    }
    
    update(delta) {
        super.update(delta);
        
        // Rotate to face direction
        this.rotation = Math.atan2(this.vy, this.vx);
    }
}