// FlashEffect.js - Screen flash effect
export class FlashEffect {
    constructor(scene) {
        this.scene = scene;
        this.flashRect = null;
    }
    
    flash(color = 0xffffff, duration = 100, alpha = 0.8) {
        if (this.flashRect) {
            this.flashRect.destroy();
        }
        
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        this.flashRect = this.scene.add.rectangle(width/2, height/2, width, height, color, alpha);
        this.flashRect.setDepth(1000);
        
        this.scene.tweens.add({
            targets: this.flashRect,
            alpha: 0,
            duration: duration,
            onComplete: () => {
                if (this.flashRect) {
                    this.flashRect.destroy();
                    this.flashRect = null;
                }
            }
        });
    }
    
    flashDamage() {
        this.flash(0xff0000, 150, 0.3);
    }
    
    flashHeal() {
        this.flash(0x00ff00, 200, 0.2);
    }
    
    flashVictory() {
        this.flash(0xffff00, 300, 0.4);
    }
}