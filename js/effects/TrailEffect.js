// TrailEffect.js - Trail effect for moving objects
export class TrailEffect {
    constructor(scene, target, color = 0x00d4ff, size = 20, count = 5) {
        this.scene = scene;
        this.target = target;
        this.color = color;
        this.size = size;
        this.count = count;
        this.trails = [];
        this.active = true;
        
        this.start();
    }
    
    start() {
        let trailCount = 0;
        this.interval = setInterval(() => {
            if (!this.active || !this.target.scene || trailCount > 50) {
                clearInterval(this.interval);
                return;
            }
            
            const trail = this.scene.add.circle(
                this.target.x,
                this.target.y,
                this.size,
                this.color,
                0.5
            );
            
            trail.setDepth(this.target.depth - 1);
            this.trails.push(trail);
            
            this.scene.tweens.add({
                targets: trail,
                alpha: 0,
                scale: 0.5,
                duration: 300,
                onComplete: () => {
                    const index = this.trails.indexOf(trail);
                    if (index > -1) this.trails.splice(index, 1);
                    trail.destroy();
                }
            });
            
            trailCount++;
        }, 50);
    }
    
    stop() {
        this.active = false;
        if (this.interval) {
            clearInterval(this.interval);
        }
    }
    
    clear() {
        this.stop();
        this.trails.forEach(t => t.destroy());
        this.trails = [];
    }
}