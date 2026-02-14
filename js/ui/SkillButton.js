// SkillButton.js - Skill button component
export class SkillButton {
    constructor(scene, x, y, skillData, index) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.skillData = skillData;
        this.index = index;
        this.cooldown = 0;
        this.lastUsed = 0;
        
        this.create();
        this.setupInput();
    }
    
    create() {
        // Background
        this.bg = this.scene.add.circle(this.x, this.y, 35, 0x333333, 0.8);
        this.bg.setStrokeStyle(2, 0x666666);
        
        // Icon
        this.icon = this.scene.add.text(this.x, this.y - 5, this.skillData.icon, {
            fontSize: '30px'
        }).setOrigin(0.5);
        
        // Key hint
        const keyNames = ['E', 'R', 'F'];
        this.keyHint = this.scene.add.text(this.x, this.y + 25, keyNames[this.index], {
            fontSize: '14px',
            fill: '#aaa'
        }).setOrigin(0.5);
        
        // Cooldown overlay
        this.cooldownOverlay = this.scene.add.circle(this.x, this.y, 35, 0x000000, 0);
        this.cooldownOverlay.setStrokeStyle(2, 0xff0000);
        
        // Tooltip (hidden by default)
        this.tooltip = null;
    }
    
    setupInput() {
        this.bg.setInteractive({ useHandCursor: true });
        
        this.bg.on('pointerover', () => {
            this.showTooltip();
            this.scene.tweens.add({
                targets: this.bg,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 200
            });
        });
        
        this.bg.on('pointerout', () => {
            this.hideTooltip();
            this.scene.tweens.add({
                targets: this.bg,
                scaleX: 1,
                scaleY: 1,
                duration: 200
            });
        });
        
        this.bg.on('pointerdown', () => {
            this.scene.player?.classData?.skillManager?.useSkill(this.index);
        });
    }
    
    showTooltip() {
        const skill = this.scene.player?.classData?.skillManager?.getSkill(this.index);
        if (!skill) return;
        
        const cooldownLeft = skill.isOnCooldown() ? Math.ceil((skill.cooldown - (Date.now() - skill.lastUsed)) / 1000) : 0;
        const cooldownText = cooldownLeft > 0 ? ` (${cooldownLeft}s)` : '';
        
        this.tooltip = this.scene.add.container(this.x, this.y - 80);
        
        const bg = this.scene.add.rectangle(0, 0, 200, 80, 0x000000, 0.9);
        bg.setStrokeStyle(2, 0x00d4ff);
        
        const nameText = this.scene.add.text(0, -25, `${skill.name}${cooldownText}`, {
            fontSize: '16px',
            fill: '#fff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        const descText = this.scene.add.text(0, 5, skill.data.description, {
            fontSize: '12px',
            fill: '#aaa',
            wordWrap: { width: 180 }
        }).setOrigin(0.5);
        
        const costText = this.scene.add.text(0, 25, `COST: ${skill.staminaCost}`, {
            fontSize: '12px',
            fill: '#ffaa00'
        }).setOrigin(0.5);
        
        this.tooltip.add([bg, nameText, descText, costText]);
        this.tooltip.setDepth(1000);
    }
    
    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.destroy();
            this.tooltip = null;
        }
    }
    
    update() {
        const skill = this.scene.player?.classData?.skillManager?.getSkill(this.index);
        if (!skill) return;
        
        if (skill.isOnCooldown()) {
            const progress = skill.getCooldownProgress();
            this.cooldownOverlay.fillAlpha = 0.5 * (1 - progress);
            
            // Update cooldown text
            const cooldownLeft = Math.ceil((skill.cooldown - (Date.now() - skill.lastUsed)) / 1000);
            this.keyHint.setText(`${cooldownLeft}s`);
            this.keyHint.setFill('#ff0000');
        } else {
            this.cooldownOverlay.fillAlpha = 0;
            this.keyHint.setText(['E', 'R', 'F'][this.index]);
            this.keyHint.setFill('#aaa');
        }
        
        // Check if enough stamina
        if (this.scene.player.stamina < skill.staminaCost) {
            this.bg.setStrokeStyle(2, 0xff0000);
        } else {
            this.bg.setStrokeStyle(2, 0x666666);
        }
    }
}