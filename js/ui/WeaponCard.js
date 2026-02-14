// WeaponCard.js - Weapon selection card component
export class WeaponCard {
    constructor(scene, x, y, weaponData, onSelect) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.weaponData = weaponData;
        this.onSelect = onSelect;
        this.selected = false;
        
        this.create();
    }
    
    create() {
        // Card background
        this.card = this.scene.add.rectangle(this.x, this.y, 200, 250, 0x333344, 0.8);
        this.card.setStrokeStyle(3, this.weaponData.color || 0x00d4ff);
        
        // Shadow
        this.shadow = this.scene.add.rectangle(this.x + 5, this.y + 5, 200, 250, 0x000000, 0.3);
        this.shadow.setDepth(-1);
        
        // Weapon icon
        this.icon = this.scene.add.text(this.x, this.y - 80, this.weaponData.icon, {
            fontSize: '48px'
        }).setOrigin(0.5);
        
        // Weapon name
        this.nameText = this.scene.add.text(this.x, this.y - 20, this.weaponData.name, {
            fontSize: '20px',
            fill: '#fff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Stats
        const stats = [
            `ATK: ${this.weaponData.projectile.damage}`,
            `SPD: ${this.weaponData.projectile.speed}`,
            `CHARGED: ${this.weaponData.charged.name}`
        ];
        
        this.statTexts = [];
        stats.forEach((stat, index) => {
            const yOffset = 20 + index * 25;
            const fill = index === 0 ? '#ffaa00' : (index === 1 ? '#88ddff' : '#ccc');
            
            const text = this.scene.add.text(this.x, this.y + yOffset, stat, {
                fontSize: '14px',
                fill: fill
            }).setOrigin(0.5);
            this.statTexts.push(text);
        });
        
        // Make interactive
        this.card.setInteractive({ useHandCursor: true });
        
        this.card.on('pointerover', () => this.onHover());
        this.card.on('pointerout', () => this.onOut());
        this.card.on('pointerdown', () => this.onClick());
    }
    
    onHover() {
        this.scene.tweens.add({
            targets: this.card,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 200
        });
    }
    
    onOut() {
        if (!this.selected) {
            this.scene.tweens.add({
                targets: this.card,
                scaleX: 1,
                scaleY: 1,
                duration: 200
            });
        }
    }
    
    onClick() {
        this.selected = true;
        this.card.setStrokeStyle(4, 0xffff00);
        this.onSelect(this.weaponData);
    }
    
    deselect() {
        this.selected = false;
        this.card.setStrokeStyle(3, this.weaponData.color || 0x00d4ff);
        this.scene.tweens.add({
            targets: this.card,
            scaleX: 1,
            scaleY: 1,
            duration: 200
        });
    }
}