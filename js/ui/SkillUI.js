// SkillUI.js - Affichage des compétences avec cooldown circulaire + tooltip de survol
export class SkillUI {
    constructor(scene) {
        this.scene = scene;
        this.skillButtons = [];
        this.skillTooltip = null;
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
            keyText.setInteractive({ useHandCursor: true });
            
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

            const showTooltip = () => this.showSkillTooltip(skillKey, x, y - 70);
            const hideTooltip = () => this.hideSkillTooltip();

            [bg, icon, keyText].forEach((obj) => {
                obj.on('pointerdown', useSkill);
                obj.on('pointerover', showTooltip);
                obj.on('pointerout', hideTooltip);
            });
            
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

    showSkillTooltip(skillKey, x, y) {
        this.hideSkillTooltip();

        const skill = this.scene.skills?.[skillKey];
        if (!skill?.data) return;

        const cooldownS = Math.round((skill.cooldown || 0) / 1000);
        const lines = [
            skill.data.name || skill.name || 'SKILL',
            skill.data.description || '',
            `STA: ${skill.staminaCost}  CD: ${cooldownS}s`
        ];

        const maxLineLen = Math.max(...lines.map(line => line.length));
        const width = Math.max(200, maxLineLen * 7 + 20);
        const height = 76;

        const bg = this.scene.add.rectangle(x, y, width, height, 0x000000, 0.9)
            .setStrokeStyle(2, 0x88ccff, 0.95)
            .setScrollFactor(0)
            .setDepth(320);

        const title = this.scene.add.text(x, y - 24, lines[0], {
            fontSize: '13px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(321);

        const desc = this.scene.add.text(x, y - 3, lines[1], {
            fontSize: '12px',
            fill: '#b9d7ff',
            align: 'center',
            wordWrap: { width: width - 16 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(321);

        const info = this.scene.add.text(x, y + 24, lines[2], {
            fontSize: '11px',
            fill: '#ffaa66'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(321);

        this.skillTooltip = { bg, title, desc, info };
    }

    hideSkillTooltip() {
        if (!this.skillTooltip) return;
        Object.values(this.skillTooltip).forEach((obj) => obj?.destroy());
        this.skillTooltip = null;
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
        this.hideSkillTooltip();

        this.skillButtons.forEach(btn => {
            btn.bg.destroy();
            btn.icon.destroy();
            btn.keyText.destroy();
            btn.cooldownOverlay.destroy();
        });
        this.skillButtons = [];
    }
}
