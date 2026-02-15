// SkillUI.js - Affichage des compétences avec cooldown circulaire
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
        
        keys.forEach((key, index) => {
            const skillKey = key.toLowerCase();
            const skill = this.scene.skills?.[skillKey];
            const iconText = skill?.data?.icon || '❔';

            const x = startX + index * spacing;
            const y = startY;
            
            const bg = this.scene.add.circle(x, y, 35, 0x333333, 0.8);
            bg.setStrokeStyle(2, 0x666666);
            bg.setScrollFactor(0);
            bg.setDepth(200);
            bg.setInteractive({ useHandCursor: true });
            
            const icon = this.scene.add.text(x, y - 5, iconText, {
                fontSize: '30px'
            }).setOrigin(0.5);
            icon.setScrollFactor(0);
            icon.setDepth(201);
            icon.setInteractive({ useHandCursor: true });
            
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

            const useSkill = () => {
                const mappedSkill = this.scene.skills?.[skillKey];
                if (mappedSkill) {
                    mappedSkill.use();
                }
            };

            bg.on('pointerdown', useSkill);
            icon.on('pointerdown', useSkill);
            
            this.skillButtons.push({
                bg,
                icon,
                keyText,
                cooldownOverlay,
                skillKey,
                x,
                y,
                radius: 35
            });
        });
    }

    isPointerOnSkillButton(pointerX, pointerY) {
        return this.skillButtons.some((btn) => {
            const dist = Phaser.Math.Distance.Between(pointerX, pointerY, btn.x, btn.y);
            return dist <= btn.radius;
        });
    }
    
    update(skills) {
        if (!skills) return;
        
        this.skillButtons.forEach((btn) => {
            const skillKey = btn.skillKey;
            const skill = skills[skillKey];
            
            if (!skill) return;

            if (btn.icon.text !== (skill.data?.icon || btn.icon.text)) {
                btn.icon.setText(skill.data?.icon || btn.icon.text);
            }
            
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