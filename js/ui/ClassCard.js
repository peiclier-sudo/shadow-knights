// ClassCard.js - Class selection card component
export class ClassCard {
    constructor(scene, x, y, classData, onSelect) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.classData = classData;
        this.onSelect = onSelect;
        this.selected = false;
        
        this.create();
    }
    
    create() {
        // Card background
        this.card = this.scene.add.rectangle(this.x, this.y, 250, 300, this.classData.color, 0.2);
        this.card.setStrokeStyle(3, this.classData.glowColor);
        
        // Shadow
        this.shadow = this.scene.add.rectangle(this.x + 5, this.y + 5, 250, 300, 0x000000, 0.3);
        this.shadow.setDepth(-1);
        
        // Class name
        this.nameText = this.scene.add.text(this.x, this.y - 120, this.classData.name, {
            fontSize: '28px',
            fill: '#fff',
            fontStyle: 'bold',
            stroke: this.classData.glowColor,
            strokeThickness: 1
        }).setOrigin(0.5);
        
        // Icon
        this.icon = this.scene.add.circle(this.x, this.y - 50, 40, this.classData.color);
        this.icon.setStrokeStyle(3, this.classData.glowColor);
        
        // Stats
        const stats = [
            `❤️ ${this.classData.baseHealth}`,
            `⚡ ${this.classData.baseStamina}`,
            `🏃 ${this.classData.baseSpeed}`
        ];
        
        this.statTexts = [];
        stats.forEach((stat, index) => {
            const text = this.scene.add.text(this.x, this.y + 20 + index * 25, stat, {
                fontSize: '16px',
                fill: '#ccc'
            }).setOrigin(0.5);
            this.statTexts.push(text);
        });
        
        // Dash info
        this.dashText = this.scene.add.text(this.x, this.y + 100, `DASH: ${this.classData.dash.name}`, {
            fontSize: '12px',
            fill: '#aaa'
        }).setOrigin(0.5);
        
        // Make interactive
        this.card.setInteractive({ useHandCursor: true });
        
        this.card.on('pointerover', () => this.onHover());
        this.card.on('pointerout', () => this.onOut());
        this.card.on('pointerdown', () => this.onClick());
    }
    
    onHover() {
        this.scene.tweens.add({
            targets: [this.card, this.icon],
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 200
        });
    }
    
    onOut() {
        if (!this.selected) {
            this.scene.tweens.add({
                targets: [this.card, this.icon],
                scaleX: 1,
                scaleY: 1,
                duration: 200
            });
        }
    }
    
    onClick() {
        this.selected = true;
        this.card.setStrokeStyle(4, 0xffff00);
        this.onSelect(this.classData);
    }
    
    deselect() {
        this.selected = false;
        this.card.setStrokeStyle(3, this.classData.glowColor);
        this.scene.tweens.add({
            targets: [this.card, this.icon],
            scaleX: 1,
            scaleY: 1,
            duration: 200
        });
    }
}