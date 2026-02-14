// ParticleManager.js - Manages all particle effects
export class ParticleManager {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
    }
    
    createHitEffect(x, y, color = 0xffaa00) {
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const speed = 100 + Math.random() * 100;
            const particle = this.scene.add.circle(x, y, 4, color, 0.8);
            
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed,
                alpha: 0,
                scale: 0.3,
                duration: 400,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
    }
    
    createExplosion(x, y, color = 0xff5500, size = 30) {
        const explosion = this.scene.add.circle(x, y, size, color, 0.8);
        
        this.scene.tweens.add({
            targets: explosion,
            scale: 2,
            alpha: 0,
            duration: 300,
            onComplete: () => explosion.destroy()
        });
        
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 50 + Math.random() * 100;
            const particle = this.scene.add.circle(x, y, 3 + Math.random() * 4, color, 0.6);
            
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                scale: 0.5,
                duration: 500,
                onComplete: () => particle.destroy()
            });
        }
    }
    
    createTrail(x, y, color = 0x00d4ff, size = 10) {
        const trail = this.scene.add.circle(x, y, size, color, 0.5);
        
        this.scene.tweens.add({
            targets: trail,
            alpha: 0,
            scale: 0.5,
            duration: 200,
            onComplete: () => trail.destroy()
        });
        
        return trail;
    }
    
    createSparks(x, y, count = 8, color = 0xffaa00) {
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + (Math.random() * 0.5);
            const distance = 30 + Math.random() * 40;
            const spark = this.scene.add.circle(x, y, 2 + Math.random() * 3, color, 0.7);
            
            this.scene.tweens.add({
                targets: spark,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                scale: 0.3,
                duration: 300,
                onComplete: () => spark.destroy()
            });
        }
    }
    
    createHealEffect(x, y) {
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const particle = this.scene.add.circle(x, y, 5, 0x00ff88, 0.6);
            
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * 60,
                y: y + Math.sin(angle) * 60,
                alpha: 0,
                scale: 1.5,
                duration: 600,
                ease: 'Back.easeOut',
                onComplete: () => particle.destroy()
            });
        }
    }
    
    createDashEffect(x, y, color = 0x00d4ff) {
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const particle = this.scene.add.circle(x, y, 4 + Math.random() * 4, color, 0.7);
            
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * 80,
                y: y + Math.sin(angle) * 80,
                alpha: 0,
                scale: 0.5,
                duration: 300,
                onComplete: () => particle.destroy()
            });
        }
    }
    
    clearAll() {
        this.particles.forEach(p => p.destroy());
        this.particles = [];
    }
}