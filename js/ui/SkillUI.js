// SkillUI.js - Affichage des compétences avec cooldown circulaire + tooltip de survol
export class SkillUI {
    constructor(scene) {
        this.scene = scene;
        this.skillButtons = [];
        this.skillTooltip = null;
        this.createSkillButtons();
    }

    createSkillButtons() {
        const width  = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        const startX  = width - 300;
        const startY  = height - 98;
        const spacing = 90;
        const radius  = 36;

        const keys = ['Q', 'E', 'R'];

        keys.forEach((key, index) => {
            const skillKey  = key.toLowerCase();
            const skill     = this.scene.skills?.[skillKey];
            const iconText  = skill?.data?.icon || '❔';

            const x = startX + index * spacing;
            const y = startY;

            // Outer glow ring (shown when skill is ready)
            const glowRing = this.scene.add.circle(x, y, radius + 6, 0x00ff88, 0)
                .setScrollFactor(0).setDepth(198);

            // Dark background base
            const bgBase = this.scene.add.circle(x, y, radius, 0x0a0a16, 0.95)
                .setScrollFactor(0).setDepth(199);

            // Border ring
            const bg = this.scene.add.circle(x, y, radius, 0x1a1a2e, 0.0)
                .setStrokeStyle(2.5, 0x555577, 1.0)
                .setScrollFactor(0).setDepth(200)
                .setInteractive({ useHandCursor: true });

            // Subtle inner highlight (top-left quarter)
            const innerHighlight = this.scene.add.circle(x - 8, y - 8, radius * 0.45, 0xffffff, 0.04)
                .setScrollFactor(0).setDepth(200);

            // Cooldown arc graphics (drawn each frame)
            const cooldownArc = this.scene.add.graphics()
                .setScrollFactor(0).setDepth(203);

            // Icon emoji
            const icon = this.scene.add.text(x, y - 4, iconText, { fontSize: '28px' })
                .setOrigin(0.5).setScrollFactor(0).setDepth(201)
                .setInteractive({ useHandCursor: true });

            // Key hint label (below button)
            const keyText = this.scene.add.text(x, y + radius + 8, key, {
                fontSize: '12px',
                fill: '#8899bb',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5).setScrollFactor(0).setDepth(201)
              .setInteractive({ useHandCursor: true });

            // Cooldown timer text (centered on button)
            const cdText = this.scene.add.text(x, y + 8, '', {
                fontSize: '16px',
                fill: '#ffffff',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5).setScrollFactor(0).setDepth(204);

            const useSkill = () => {
                const mappedSkill = this.scene.skills?.[skillKey];
                if (mappedSkill) mappedSkill.use();
            };

            const showTooltip = () => this.showSkillTooltip(skillKey, x, y - 80);
            const hideTooltip = () => this.hideSkillTooltip();

            // Hover scale effect
            bg.on('pointerover', () => {
                this.scene.tweens.add({ targets: [bgBase, bg, icon], scale: 1.12, duration: 80 });
                showTooltip();
            });
            bg.on('pointerout', () => {
                this.scene.tweens.add({ targets: [bgBase, bg, icon], scale: 1.0, duration: 80 });
                hideTooltip();
            });

            [bg, icon, keyText].forEach((obj) => {
                obj.on('pointerdown', useSkill);
            });
            [icon, keyText].forEach((obj) => {
                obj.on('pointerover', showTooltip);
                obj.on('pointerout', hideTooltip);
            });

            this.skillButtons.push({
                bg, bgBase, glowRing, innerHighlight, icon, keyText, cdText,
                cooldownArc, skillKey, x, y, radius
            });
        });
    }

    showSkillTooltip(skillKey, x, y) {
        this.hideSkillTooltip();

        const camera = this.scene.cameras.main;
        const margin = 14;

        const skill = this.scene.skills?.[skillKey];
        if (!skill?.data) return;

        const skillColor  = skill.data.color ? Phaser.Display.Color.IntegerToRGB(skill.data.color) : null;
        const hexColor    = skillColor
            ? `#${((skillColor.r << 16) | (skillColor.g << 8) | skillColor.b).toString(16).padStart(6, '0')}`
            : '#88ccff';

        const cooldownS = Math.round((skill.cooldown || 0) / 1000);
        const titleLine = skill.data.name || skill.name || 'SKILL';
        const descLine  = skill.data.description || '';
        const infoLine  = `CD: ${cooldownS}s`;

        const maxLen = Math.max(titleLine.length, descLine.length, infoLine.length);
        const bw     = Math.max(210, maxLen * 7 + 24);
        const bh     = 90;

        const clampedX = Phaser.Math.Clamp(x, margin + bw / 2, camera.width  - margin - bw / 2);
        const clampedY = Phaser.Math.Clamp(y, margin + bh / 2, camera.height - margin - bh / 2);

        // Tooltip panel
        const panel = this.scene.add.rectangle(clampedX, clampedY, bw, bh, 0x060c18, 0.94)
            .setStrokeStyle(1.5, 0x334466, 0.9)
            .setScrollFactor(0).setDepth(320);

        // Color header bar at top of tooltip
        const headerBar = this.scene.add.rectangle(clampedX, clampedY - bh / 2 + 10, bw - 4, 18, 0x000000, 0.6)
            .setScrollFactor(0).setDepth(321);

        const title = this.scene.add.text(clampedX, clampedY - bh / 2 + 10, titleLine, {
            fontSize: '13px',
            fill: hexColor,
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0).setDepth(322);

        const desc = this.scene.add.text(clampedX, clampedY + 4, descLine, {
            fontSize: '11px',
            fill: '#c8d8f0',
            align: 'center',
            wordWrap: { width: bw - 20 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(322);

        const info = this.scene.add.text(clampedX, clampedY + bh / 2 - 10, infoLine, {
            fontSize: '11px',
            fill: '#ffcc88',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(322);

        // Fade in
        [panel, headerBar, title, desc, info].forEach(o => { o.alpha = 0; });
        this.scene.tweens.add({ targets: [panel, headerBar, title, desc, info], alpha: 1, duration: 80 });

        this.skillTooltip = { panel, headerBar, title, desc, info };
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
            const skill    = skills[skillKey];
            if (!skill) return;

            if (btn.icon.text !== (skill.data?.icon || btn.icon.text)) {
                btn.icon.setText(skill.data?.icon || btn.icon.text);
            }

            const cooldownProgress = skill.getCooldownProgress ? skill.getCooldownProgress() : 1;
            const skillColor       = skill.data?.color || 0x00ff88;

            // Draw cooldown arc
            btn.cooldownArc.clear();
            if (cooldownProgress < 1) {
                const remaining = Math.ceil((1 - cooldownProgress) * (skill.cooldown / 1000));

                // Dark overlay fill while on cooldown
                btn.cooldownArc.fillStyle(0x000000, 0.55);
                btn.cooldownArc.fillCircle(btn.x, btn.y, btn.radius);

                // Arc border showing time remaining
                btn.cooldownArc.lineStyle(3, 0xdd3333, 0.9);
                btn.cooldownArc.beginPath();
                const startAngle = -Math.PI / 2;
                const endAngle   = startAngle + (1 - cooldownProgress) * Math.PI * 2;
                btn.cooldownArc.arc(btn.x, btn.y, btn.radius - 2, startAngle, endAngle, false);
                btn.cooldownArc.strokePath();

                btn.cdText.setText(remaining + 's').setAlpha(1);
                btn.keyText.setAlpha(0);

                btn.glowRing.setStrokeStyle(0);
                btn.glowRing.fillAlpha = 0;
                btn.bg.setStrokeStyle(2.5, 0x553333, 0.9);
            } else {
                btn.cdText.setText('').setAlpha(0);
                btn.keyText.setAlpha(1);

                // Ready glow ring pulse
                const t = Date.now();
                const glowAlpha = 0.18 + Math.sin(t * 0.005) * 0.10;
                btn.glowRing.setStrokeStyle(3, skillColor, glowAlpha);
                btn.glowRing.fillStyle(skillColor, glowAlpha * 0.3);
                btn.glowRing.fillCircle?.(btn.x, btn.y, btn.radius + 6);

                btn.bg.setStrokeStyle(2.5, skillColor, 0.75);
                btn.keyText.setFill('#99eebb');
            }
        });
    }

    destroy() {
        this.hideSkillTooltip();

        this.skillButtons.forEach(btn => {
            btn.bg.destroy();
            btn.bgBase.destroy();
            btn.glowRing.destroy();
            btn.innerHighlight.destroy();
            btn.icon.destroy();
            btn.keyText.destroy();
            btn.cdText.destroy();
            btn.cooldownArc.destroy();
        });
        this.skillButtons = [];
    }
}
