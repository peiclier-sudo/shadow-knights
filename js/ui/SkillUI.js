// SkillUI.js - Affichage des compétences avec cooldown circulaire (UPDATED - Grappling Hook)
export class SkillUI {
    constructor(scene) {
        this.scene = scene;
        this.skillButtons = [];
        this.createSkillButtons();
    }
    
    createSkillButtons() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        const startX = width - 280;
        const startY = height - 80;
        const spacing = 90;
        
        const keys = ['Q', 'E', 'R'];
        const icons = ['📢', '🛡️', '🪝'];  // ✅ CHANGÉ: 🪝 au lieu de ⚔️
        
        keys.forEach((key, index) => {
            const x = startX + index * spacing;
            const y = startY;
            
            const bg = this.scene.add.circle(x, y, 35, 0x333333, 0.8);
            bg.setStrokeStyle(2, 0x666666);
            bg.setScrollFactor(0);
            bg.setDepth(200);
            
            const icon = this.scene.add.text(x, y - 5, icons[index], {
                fontSize: '30px'
            }).setOrigin(0.5);
            icon.setScrollFactor(0);
            icon.setDepth(201);
            
            const keyText = this.scene.add.text(x, y + 25, key, {
                fontSize: '14px',
                fill: '#aaa'
            }).setOrigin(0.5);
            keyText.setScrollFactor(0);
            keyText.setDepth(201);
            
            const cooldownOverlay = this.scene.add.circle(x, y, 35, 0x000000, 0);
            cooldownOverlay.setStrokeStyle(2, 0xff0000);
            cooldownOverlay.setScrollFactor(0);
            cooldownOverlay.setDepth(202);
            
            this.skillButtons.push({
                bg,
                icon,
                keyText,
                cooldownOverlay,
                skillKey: key.toLowerCase(),
                x,
                y
            });
        });
    }
    
    update(skills) {
        if (!skills) return;
        
        this.skillButtons.forEach((btn) => {
            const skillKey = btn.skillKey;
            const skill = skills[skillKey];
            
            if (!skill) return;
            
            const cooldownProgress = skill.getCooldownProgress ? skill.getCooldownProgress() : 1;
            
            if (cooldownProgress < 1) {
                const remaining = Math.ceil((1 - cooldownProgress) * (skill.cooldown / 1000));
                btn.cooldownOverlay.fillAlpha = 0.5 * (1 - cooldownProgress);
                btn.keyText.setText(remaining + 's');
                btn.keyText.setFill('#ff0000');
            } else {
                btn.cooldownOverlay.fillAlpha = 0;
                btn.keyText.setText(btn.skillKey.toUpperCase());
                btn.keyText.setFill('#aaa');
            }
            
            if (this.scene.player.stamina < skill.staminaCost) {
                btn.bg.setStrokeStyle(2, 0xff0000);
            } else if (cooldownProgress >= 1) {
                btn.bg.setStrokeStyle(2, 0x00ff88);
            } else {
                btn.bg.setStrokeStyle(2, 0x666666);
            }
        });
    }
    
    destroy() {
        this.skillButtons.forEach(btn => {
            btn.bg.destroy();
            btn.icon.destroy();
            btn.keyText.destroy();
            btn.cooldownOverlay.destroy();
        });
        this.skillButtons = [];
    }
}