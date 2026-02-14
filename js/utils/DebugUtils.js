// DebugUtils.js - Debugging utilities (disabled in production)
export const DebugUtils = {
    enabled: false, // Set to false in production
    
    log(...args) {
        if (this.enabled) {
            console.log('[DEBUG]', ...args);
        }
    },
    
    warn(...args) {
        if (this.enabled) {
            console.warn('[DEBUG]', ...args);
        }
    },
    
    error(...args) {
        console.error('[ERROR]', ...args);
    },
    
    // Draw collision boxes
    drawCollision(scene, obj, color = 0xff0000) {
        if (!this.enabled) return;
        
        const graphics = scene.add.graphics();
        graphics.lineStyle(2, color, 1);
        
        if (obj.body) {
            graphics.strokeRect(
                obj.x - obj.body.width/2,
                obj.y - obj.body.height/2,
                obj.body.width,
                obj.body.height
            );
        }
    },
    
    // Draw path between two points
    drawPath(scene, x1, y1, x2, y2, color = 0x00ff00) {
        if (!this.enabled) return;
        
        const graphics = scene.add.graphics();
        graphics.lineStyle(2, color, 1);
        graphics.lineBetween(x1, y1, x2, y2);
    },
    
    // Show FPS counter
    showFPS(scene) {
        if (!this.enabled) return;
        
        const fpsText = scene.add.text(10, 10, 'FPS: 60', {
            fontSize: '16px',
            fill: '#00ff00'
        });
        
        scene.events.on('update', () => {
            fpsText.setText(`FPS: ${Math.round(scene.game.loop.actualFps)}`);
        });
    },
    
    // Show player stats overlay
    showPlayerStats(scene, player) {
        if (!this.enabled) return;
        
        const stats = scene.add.text(10, 100, '', {
            fontSize: '14px',
            fill: '#ffffff',
            backgroundColor: '#000000aa',
            padding: { x: 10, y: 5 }
        });
        
        scene.events.on('update', () => {
            stats.setText([
                `Health: ${player.health}/${player.maxHealth}`,
                `Stamina: ${player.stamina}/${player.maxStamina}`,
                `Speed: ${player.speed}`,
                `Position: (${Math.round(player.x)}, ${Math.round(player.y)})`,
                `Dashing: ${player.isDashing}`,
                `Invulnerable: ${player.isInvulnerable}`
            ].join('\n'));
        });
    },
    
    // Show boss stats
    showBossStats(scene, boss) {
        if (!this.enabled) return;
        
        const stats = scene.add.text(scene.cameras.main.width - 200, 100, '', {
            fontSize: '14px',
            fill: '#ffffff',
            backgroundColor: '#000000aa',
            padding: { x: 10, y: 5 }
        });
        
        scene.events.on('update', () => {
            stats.setText([
                `Boss: ${boss.bossData.name}`,
                `Health: ${boss.health}/${boss.maxHealth}`,
                `Attacking: ${boss.isAttacking}`,
                `Frozen: ${boss.frozen}`
            ].join('\n'));
        });
    },
    
    // Measure performance of a function
    measureTime(name, fn) {
        if (!this.enabled) return fn();
        
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        this.log(`${name} took ${end - start}ms`);
        return result;
    },
    
    // Check for memory leaks (track active objects)
    trackObjects(scene) {
        if (!this.enabled) return;
        
        let objectCount = 0;
        const text = scene.add.text(10, 200, 'Objects: 0', {
            fontSize: '14px',
            fill: '#ffff00'
        });
        
        scene.events.on('added', () => {
            objectCount++;
            text.setText(`Objects: ${objectCount}`);
        });
        
        scene.events.on('removed', () => {
            objectCount--;
            text.setText(`Objects: ${objectCount}`);
        });
    },
    
    // Toggle debug mode
    toggle() {
        this.enabled = !this.enabled;
        console.log(`Debug mode: ${this.enabled ? 'ON' : 'OFF'}`);
    }
};