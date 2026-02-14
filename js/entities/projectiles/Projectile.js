// Projectile.js - Base projectile class
export class Projectile extends Phaser.GameObjects.Container {
    constructor(scene, x, y, angle, data) {
        super(scene, x, y);
        
        this.scene = scene;
        this.data = data;
        this.damage = data.damage;
        this.speed = data.speed;
        
        // Visuals
        const core = scene.add.circle(0, 0, data.size * 0.7, 0xffffff);
        const glow = scene.add.circle(0, 0, data.size, data.color, 0.8);
        
        this.add([glow, core]);
        this.setDepth(150);
        
        // Velocity
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        
        scene.add.existing(this);
        
        // Trail effect
        this.createTrail();
    }
    
    createTrail() {
        let trailCount = 0;
        this.trailInterval = setInterval(() => {
            if (!this.scene || trailCount > 20) {
                clearInterval(this.trailInterval);
                return;
            }
            
            const trail = this.scene.add.circle(
                this.x, this.y,
                this.data.size * 0.6,
                this.data.color,
                0.5
            );
            trail.setDepth(148);
            
            this.scene.tweens.add({
                targets: trail,
                alpha: 0,
                scale: 0.5,
                duration: 200,
                onComplete: () => trail.destroy()
            });
            
            trailCount++;
        }, 40);
    }
    
    update(delta) {
        this.x += this.vx * (delta / 1000);
        this.y += this.vy * (delta / 1000);
    }
    
    isOffScreen() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        return this.x < -50 || this.x > width + 50 || this.y < -50 || this.y > height + 50;
    }
    
    destroy() {
        if (this.trailInterval) {
            clearInterval(this.trailInterval);
        }
        super.destroy();
    }
}