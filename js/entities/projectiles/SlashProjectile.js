// SlashProjectile.js - Melee wave projectile (Sword)
import { Projectile } from './Projectile.js';

export class SlashProjectile extends Projectile {
    constructor(scene, x, y, angle, data) {
        super(scene, x, y, angle, data);
        
        this.removeAll();
        
        // Slash shape (arc)
        const graphics = scene.add.graphics();
        graphics.lineStyle(4, data.color, 0.8);
        graphics.beginPath();
        graphics.arc(0, 0, data.size * 2, angle - 0.5, angle + 0.5);
        graphics.strokePath();
        
        // Convert graphics to texture
        graphics.generateTexture('slash', 100, 100);
        graphics.destroy();
        
        // Create sprite from texture
        const slash = scene.add.sprite(0, 0, 'slash');
        slash.setTint(data.color);
        this.add(slash);
        
        // Fade out quickly
        scene.tweens.add({
            targets: this,
            alpha: 0,
            scale: 1.5,
            duration: 200,
            onComplete: () => this.destroy()
        });
        
        // Don't move - it's a static slash
        this.vx = 0;
        this.vy = 0;
    }
}