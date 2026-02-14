// HealthBar.js - Health bar component
export class HealthBar {
    constructor(scene, x, y, width = 300, height = 25) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.currentHealth = 100;
        this.maxHealth = 100;
        
        this.create();
    }
    
    create() {
        // Background
        this.bg = this.scene.add.rectangle(this.x, this.y, this.width, this.height, 0x333333);
        this.bg.setOrigin(0, 0.5);
        this.bg.setStrokeStyle(2, 0x666666);
        
        // Health fill
        this.fill = this.scene.add.rectangle(this.x, this.y, this.width, this.height, 0x00ff88);
        this.fill.setOrigin(0, 0.5);
        
        // Text
        this.text = this.scene.add.text(this.x + this.width + 10, this.y, '100/100', {
            fontSize: '16px',
            fill: '#fff'
        }).setOrigin(0, 0.5);
        
        // Icon
        this.icon = this.scene.add.text(this.x - 30, this.y, '❤️', {
            fontSize: '20px'
        }).setOrigin(0.5);
    }
    
    update(health, maxHealth) {
        this.currentHealth = health;
        this.maxHealth = maxHealth;
        
        const percent = health / maxHealth;
        this.fill.width = this.width * percent;
        this.text.setText(`${Math.floor(health)}/${maxHealth}`);
        
        // Change color based on health
        if (percent < 0.3) {
            this.fill.fillColor = 0xff0000;
        } else if (percent < 0.6) {
            this.fill.fillColor = 0xffaa00;
        } else {
            this.fill.fillColor = 0x00ff88;
        }
    }
    
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        
        this.bg.setPosition(x, y);
        this.fill.setPosition(x, y);
        this.text.setPosition(x + this.width + 10, y);
        this.icon.setPosition(x - 30, y);
    }
}