// StaminaBar.js - Stamina bar component
export class StaminaBar {
    constructor(scene, x, y, width = 250, height = 15) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.currentStamina = 100;
        this.maxStamina = 100;
        
        this.create();
    }
    
    create() {
        // Background
        this.bg = this.scene.add.rectangle(this.x, this.y, this.width, this.height, 0x333333);
        this.bg.setOrigin(0, 0.5);
        this.bg.setStrokeStyle(2, 0x666666);
        
        // Stamina fill
        this.fill = this.scene.add.rectangle(this.x, this.y, this.width, this.height, 0xffaa00);
        this.fill.setOrigin(0, 0.5);
        
        // Text
        this.text = this.scene.add.text(this.x + this.width + 10, this.y, '100', {
            fontSize: '14px',
            fill: '#ffaa00'
        }).setOrigin(0, 0.5);
        
        // Icon
        this.icon = this.scene.add.text(this.x - 25, this.y, '⚡', {
            fontSize: '18px',
            fill: '#ffaa00'
        }).setOrigin(0.5);
    }
    
    update(stamina, maxStamina) {
        this.currentStamina = stamina;
        this.maxStamina = maxStamina;
        
        const percent = stamina / maxStamina;
        this.fill.width = this.width * percent;
        this.text.setText(`${Math.floor(stamina)}`);
        
        // Flash red if low stamina
        if (percent < 0.2) {
            this.fill.fillColor = 0xff0000;
        } else {
            this.fill.fillColor = 0xffaa00;
        }
    }
    
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        
        this.bg.setPosition(x, y);
        this.fill.setPosition(x, y);
        this.text.setPosition(x + this.width + 10, y);
        this.icon.setPosition(x - 25, y);
    }
}