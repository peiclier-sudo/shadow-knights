// HitEffect.js - Hit impact effect
export class HitEffect {
    constructor(scene) {
        this.scene = scene;
    }
    
    createHit(x, y, color = 0xffaa00) {
        // Impact ring
        const ring = this.scene.add.circle(x, y, 20, color, 0);
        ring.setStrokeStyle(4, color, 0.8);
        
        this.scene.tweens.add({
            targets: ring,
            radius: 50,
            alpha: 0,
            duration: 300,
            onComplete: () => ring.destroy()
        });
        
        // Impact sparks
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const spark = this.scene.add.circle(x, y, 4, color, 0.7);
            
            this.scene.tweens.add({
                targets: spark,
                x: x + Math.cos(angle) * 40,
                y: y + Math.sin(angle) * 40,
                alpha: 0,
                scale: 0.3,
                duration: 200,
                onComplete: () => spark.destroy()
            });
        }
        
        // Damage number will be handled separately
    }
    
    createCriticalHit(x, y) {
        // Bigger ring for crit
        const ring = this.scene.add.circle(x, y, 30, 0xff6600, 0);
        ring.setStrokeStyle(6, 0xffaa00, 1);
        
        this.scene.tweens.add({
            targets: ring,
            radius: 80,
            alpha: 0,
            duration: 400,
            onComplete: () => ring.destroy()
        });
        
        // More sparks for crit
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const spark = this.scene.add.circle(x, y, 6, 0xffaa00, 0.8);
            
            this.scene.tweens.add({
                targets: spark,
                x: x + Math.cos(angle) * 60,
                y: y + Math.sin(angle) * 60,
                alpha: 0,
                scale: 0.5,
                duration: 300,
                onComplete: () => spark.destroy()
            });
        }
        
        // Critical text
        const critText = this.scene.add.text(x, y - 40, 'CRITICAL!', {
            fontSize: '20px',
            fill: '#ffaa00',
            stroke: '#000',
            strokeThickness: 4,
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: critText,
            y: y - 100,
            alpha: 0,
            duration: 500,
            onComplete: () => critText.destroy()
        });
    }
    
    createBlock(x, y) {
        const blockRing = this.scene.add.circle(x, y, 25, 0x888888, 0);
        blockRing.setStrokeStyle(4, 0xffffff, 0.6);
        
        this.scene.tweens.add({
            targets: blockRing,
            radius: 40,
            alpha: 0,
            duration: 200,
            onComplete: () => blockRing.destroy()
        });
        
        const blockText = this.scene.add.text(x, y - 30, 'BLOCK', {
            fontSize: '18px',
            fill: '#aaaaaa',
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: blockText,
            y: y - 60,
            alpha: 0,
            duration: 300,
            onComplete: () => blockText.destroy()
        });
    }
}