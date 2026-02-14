// AnimationUtils.js - Animation helper functions
export const AnimationUtils = {
    // Create a simple pulse animation
    pulse(target, scale = 1.1, duration = 500) {
        return target.scene.tweens.add({
            targets: target,
            scaleX: scale,
            scaleY: scale,
            duration: duration,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    },
    
    // Create a floating animation
    float(target, distance = 10, duration = 1000) {
        return target.scene.tweens.add({
            targets: target,
            y: target.y - distance,
            duration: duration,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    },
    
    // Create a rotation animation
    rotate(target, speed = 0.01) {
        target.scene.events.on('update', () => {
            target.rotation += speed;
        });
    },
    
    // Create a fade in/out effect
    fadeInOut(target, duration = 1000, delay = 0) {
        target.alpha = 0;
        
        return target.scene.tweens.add({
            targets: target,
            alpha: 1,
            duration: duration,
            delay: delay,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    },
    
    // Create a hit effect (flash red)
    hitFlash(target, duration = 100) {
        const originalTint = target.tintTopLeft;
        
        target.setTint(0xff0000);
        
        target.scene.time.delayedCall(duration, () => {
            target.clearTint();
        });
    },
    
    // Create a shake effect
    shake(target, intensity = 5, duration = 200) {
        const originalX = target.x;
        const originalY = target.y;
        const startTime = Date.now();
        
        const shakeInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            if (elapsed >= duration) {
                target.x = originalX;
                target.y = originalY;
                clearInterval(shakeInterval);
                return;
            }
            
            target.x = originalX + (Math.random() - 0.5) * intensity;
            target.y = originalY + (Math.random() - 0.5) * intensity;
        }, 16);
    },
    
    // Create a jump animation
    jump(target, height = 30, duration = 400) {
        return target.scene.tweens.add({
            targets: target,
            y: target.y - height,
            duration: duration / 2,
            yoyo: true,
            ease: 'Power2',
            onComplete: () => {
                target.y = target.y + height;
            }
        });
    },
    
    // Create a spawn effect (scale from 0 to 1)
    spawn(target, duration = 300) {
        target.scale = 0;
        
        return target.scene.tweens.add({
            targets: target,
            scale: 1,
            duration: duration,
            ease: 'Back.easeOut'
        });
    },
    
    // Create a death effect (scale to 0 and fade)
    death(target, duration = 300) {
        return target.scene.tweens.add({
            targets: target,
            scale: 0,
            alpha: 0,
            duration: duration,
            ease: 'Power2',
            onComplete: () => target.destroy()
        });
    },
    
    // Create a trail effect
    createTrail(scene, target, color, size, count = 5) {
        let trailCount = 0;
        const interval = setInterval(() => {
            if (!target.scene || trailCount >= count) {
                clearInterval(interval);
                return;
            }
            
            const trail = scene.add.circle(target.x, target.y, size, color, 0.5);
            
            scene.tweens.add({
                targets: trail,
                alpha: 0,
                scale: 0.5,
                duration: 200,
                onComplete: () => trail.destroy()
            });
            
            trailCount++;
        }, 50);
    },
    
    // Create a text pop animation
    textPop(text, scale = 1.2, duration = 200) {
        return text.scene.tweens.add({
            targets: text,
            scaleX: scale,
            scaleY: scale,
            duration: duration,
            yoyo: true,
            ease: 'Back.easeOut'
        });
    }
};