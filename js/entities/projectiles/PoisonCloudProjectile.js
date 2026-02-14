// PoisonCloudProjectile.js - Poison cloud (Daggers charged)
import { Projectile } from './Projectile.js';

export class PoisonCloudProjectile extends Projectile {
    constructor(scene, x, y, data) {
        super(scene, x, y, 0, data);
        
        this.removeAll();
        this.damage = data.damage;
        this.ticks = data.ticks || 5;
        this.tickRate = 500; // ms
        this.radius = data.radius || 80;
        this.duration = 3000; // ms
        this.createTime = Date.now();
        
        // Cloud visuals
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * this.radius;
            const cloudX = Math.cos(angle) * distance;
            const cloudY = Math.sin(angle) * distance;
            const size = 10 + Math.random() * 20;
            
            const particle = scene.add.circle(cloudX, cloudY, size, 0x88aa88, 0.3);
            this.add(particle);
        }
        
        // Central core
        const core = scene.add.circle(0, 0, 15, 0x66aa66, 0.5);
        this.add(core);
        
        // Pulsing animation
        scene.tweens.add({
            targets: this,
            scale: 1.1,
            alpha: 0.6,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
        
        // Start damage ticks
        this.startTicks(scene);
    }
    
    startTicks(scene) {
        let tickCount = 0;
        this.tickInterval = setInterval(() => {
            if (!this.scene || tickCount >= this.ticks) {
                clearInterval(this.tickInterval);
                return;
            }
            
            const boss = scene.boss;
            if (boss) {
                const dist = Phaser.Math.Distance.Between(this.x, this.y, boss.x, boss.y);
                if (dist < this.radius) {
                    boss.takeDamage(this.damage);
                    
                    // Poison effect on boss
                    boss.setTint(0x88aa88);
                    scene.time.delayedCall(100, () => boss.clearTint());
                }
            }
            
            tickCount++;
        }, this.tickRate);
        
        // Auto destroy after duration
        scene.time.delayedCall(this.duration, () => {
            this.destroy();
        });
    }
    
    destroy() {
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
        }
        super.destroy();
    }
}