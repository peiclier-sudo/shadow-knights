// Tooltip.js - Reusable tooltip component
export class Tooltip {
    constructor(scene) {
        this.scene = scene;
        this.tooltip = null;
        this.visible = false;
    }
    
    show(x, y, title, description, options = {}) {
        this.hide();
        
        const width = options.width || 250;
        const height = options.height || 100;
        const bgColor = options.bgColor || 0x000000;
        const titleColor = options.titleColor || '#00d4ff';
        const descColor = options.descColor || '#ffffff';
        
        this.tooltip = this.scene.add.container(x, y);
        
        // Background
        const bg = this.scene.add.rectangle(0, 0, width, height, bgColor, 0.95);
        bg.setStrokeStyle(2, 0x00d4ff);
        
        // Title
        const titleText = this.scene.add.text(0, -height/2 + 20, title, {
            fontSize: '18px',
            fill: titleColor,
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Description
        const descText = this.scene.add.text(0, 10, description, {
            fontSize: '14px',
            fill: descColor,
            wordWrap: { width: width - 20 },
            align: 'center'
        }).setOrigin(0.5);
        
        // Optional cost
        if (options.cost) {
            const costText = this.scene.add.text(0, height/2 - 20, `COST: ${options.cost}`, {
                fontSize: '14px',
                fill: '#ffaa00'
            }).setOrigin(0.5);
            this.tooltip.add(costText);
        }
        
        // Optional cooldown
        if (options.cooldown) {
            const cdText = this.scene.add.text(0, height/2 - 35, `CD: ${options.cooldown}s`, {
                fontSize: '12px',
                fill: '#ff8888'
            }).setOrigin(0.5);
            this.tooltip.add(cdText);
        }
        
        this.tooltip.add([bg, titleText, descText]);
        this.tooltip.setDepth(1000);
        this.visible = true;
        
        // Auto-hide after delay
        if (options.autoHide) {
            this.scene.time.delayedCall(options.autoHide, () => this.hide());
        }
    }
    
    showSkill(skill, x, y) {
        const cooldownLeft = skill.isOnCooldown() ? 
            Math.ceil((skill.cooldown - (Date.now() - skill.lastUsed)) / 1000) : 0;
        
        this.show(x, y, skill.name, skill.data.description, {
            cost: skill.staminaCost,
            cooldown: cooldownLeft || skill.cooldown / 1000
        });
    }
    
    showItem(name, description, x, y) {
        this.show(x, y, name, description, { width: 200, height: 80 });
    }
    
    showDamage(value, x, y, isCrit = false) {
        const color = isCrit ? '#ffaa00' : '#ffffff';
        const size = isCrit ? '28px' : '24px';
        
        const text = this.scene.add.text(x, y, value.toString(), {
            fontSize: size,
            fill: color,
            stroke: '#000',
            strokeThickness: 4,
            fontStyle: isCrit ? 'bold' : 'normal'
        }).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: text,
            y: y - 50,
            alpha: 0,
            duration: 500,
            onComplete: () => text.destroy()
        });
    }
    
    showMessage(text, x, y, color = '#ffffff') {
        const msg = this.scene.add.text(x, y, text, {
            fontSize: '20px',
            fill: color,
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: msg,
            y: y - 40,
            alpha: 0,
            duration: 800,
            onComplete: () => msg.destroy()
        });
    }
    
    hide() {
        if (this.tooltip) {
            this.tooltip.destroy();
            this.tooltip = null;
        }
        this.visible = false;
    }
    
    updatePosition(x, y) {
        if (this.tooltip) {
            this.tooltip.setPosition(x, y);
        }
    }
}