// SkillUI.js - Affichage des compétences avec forme et symbole propres à chaque classe
export class SkillUI {
    constructor(scene) {
        this.scene = scene;
        this.skillButtons = [];
        this.skillTooltip = null;
        this.createSkillButtons();
    }

    // Polygon vertices for the class-specific button shape.
    // Warrior → hexagon (shield), Mage → tall diamond (gem), Rogue → triangle (blade)
    _getShapePoints(cx, cy, r, cls) {
        if (cls === 'WARRIOR') {
            // Pointy-top hexagon
            return Array.from({ length: 6 }, (_, i) => {
                const angle = (Math.PI / 3) * i - Math.PI / 2;
                return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
            });
        } else if (cls === 'MAGE') {
            // Tall, narrow diamond
            return [
                { x: cx,            y: cy - r * 1.20 },
                { x: cx + r * 0.82, y: cy            },
                { x: cx,            y: cy + r * 1.20 },
                { x: cx - r * 0.82, y: cy            },
            ];
        } else { // ROGUE
            // Upward-pointing triangle
            return [
                { x: cx,       y: cy - r * 1.15 },
                { x: cx + r,   y: cy + r * 0.75 },
                { x: cx - r,   y: cy + r * 0.75 },
            ];
        }
    }

    // Draws the one-time class watermark glyph into a Graphics object.
    // Warrior → great helm silhouette, Mage → 6-point arcane star, Rogue → dagger
    _drawWatermark(gfx, x, y, radius, cls) {
        const s = radius * 0.58;

        if (cls === 'WARRIOR') {
            // Great helm: dome + body, visor slit
            const helmPts = [
                { x: x - s * 0.62, y: y - s * 0.05 }, // shoulder L
                { x: x - s * 0.48, y: y - s * 0.68 }, // dome L
                { x: x,            y: y - s * 0.85 }, // crown
                { x: x + s * 0.48, y: y - s * 0.68 }, // dome R
                { x: x + s * 0.62, y: y - s * 0.05 }, // shoulder R
                { x: x + s * 0.62, y: y + s * 0.58 }, // bottom R
                { x: x - s * 0.62, y: y + s * 0.58 }, // bottom L
            ];
            gfx.fillStyle(0xffffff, 0.09);
            gfx.fillPoints(helmPts, true);
            // Visor slit (dark cutout)
            gfx.fillStyle(0x000000, 0.40);
            gfx.fillRect(x - s * 0.40, y - s * 0.14, s * 0.80, s * 0.22);
            // Left eye
            gfx.fillStyle(0xffffff, 0.10);
            gfx.fillRect(x - s * 0.36, y - s * 0.12, s * 0.26, s * 0.11);
            // Right eye
            gfx.fillRect(x + s * 0.10, y - s * 0.12, s * 0.26, s * 0.11);

        } else if (cls === 'MAGE') {
            // 6-pointed arcane star
            const outer = s * 0.92;
            const inner = s * 0.40;
            const pts = [];
            for (let i = 0; i < 12; i++) {
                const r2    = i % 2 === 0 ? outer : inner;
                const angle = (Math.PI / 6) * i - Math.PI / 2;
                pts.push({ x: x + r2 * Math.cos(angle), y: y + r2 * Math.sin(angle) });
            }
            gfx.fillStyle(0xffffff, 0.09);
            gfx.fillPoints(pts, true);
            // Tiny center dot
            gfx.fillStyle(0xffffff, 0.20);
            gfx.fillCircle(x, y, s * 0.14);

        } else { // ROGUE
            // Dagger: pointed blade + crossguard
            const bladeW = s * 0.22;
            const bladeH = s * 1.05;
            const tipH   = s * 0.48;
            const guardW = s * 0.82;
            const guardT = s * 0.16;
            const baseY  = y + s * 0.52; // bottom of blade

            gfx.fillStyle(0xffffff, 0.09);
            // Blade body
            gfx.fillRect(x - bladeW / 2, baseY - bladeH, bladeW, bladeH);
            // Blade tip (triangle)
            gfx.fillPoints([
                { x: x,              y: baseY - bladeH - tipH },
                { x: x + bladeW / 2, y: baseY - bladeH       },
                { x: x - bladeW / 2, y: baseY - bladeH       },
            ], true);
            // Crossguard
            gfx.fillRect(x - guardW / 2, baseY - bladeH * 0.50 - guardT / 2, guardW, guardT);
            // Pommel (tiny square at bottom)
            gfx.fillRect(x - s * 0.18, baseY - s * 0.20, s * 0.36, s * 0.18);
        }
    }

    createSkillButtons() {
        const width  = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        const startX  = width - 300;
        const startY  = height - 98;
        const spacing = 90;
        const radius  = 36;

        const keys        = ['Q', 'E', 'R'];
        const playerClass = this.scene.playerConfig?.class || 'WARRIOR';

        // Label sits below the lowest vertex of each shape
        const labelOffsets = { WARRIOR: radius + 8, MAGE: radius * 1.20 + 8, ROGUE: radius + 8 };
        const labelOffsetY = labelOffsets[playerClass] ?? radius + 8;

        keys.forEach((key, index) => {
            const skillKey = key.toLowerCase();
            const skill    = this.scene.skills?.[skillKey];
            const iconText = skill?.data?.icon || '❔';

            const x = startX + index * spacing;
            const y = startY;

            const shapePoints = this._getShapePoints(x, y, radius,     playerClass);
            const glowPoints  = this._getShapePoints(x, y, radius + 7, playerClass);

            // ── Layer 197: per-frame pulsing glow (redrawn in update) ──────────
            const glowGfx = this.scene.add.graphics()
                .setScrollFactor(0).setDepth(197);

            // ── Layer 198: static dark polygon background ──────────────────────
            const shapeGfx = this.scene.add.graphics()
                .setScrollFactor(0).setDepth(198);
            shapeGfx.fillStyle(0x0a0a16, 0.95);
            shapeGfx.fillPoints(shapePoints, true);

            // ── Layer 199: static class watermark glyph ───────────────────────
            const watermarkGfx = this.scene.add.graphics()
                .setScrollFactor(0).setDepth(199);
            this._drawWatermark(watermarkGfx, x, y, radius, playerClass);

            // ── Layer 200: invisible circle – hit area only ───────────────────
            const bg = this.scene.add.circle(x, y, radius, 0x000000, 0)
                .setScrollFactor(0).setDepth(200)
                .setInteractive({ useHandCursor: true });

            // Subtle top-left specular highlight
            const innerHighlight = this.scene.add.circle(x - 7, y - 7, radius * 0.38, 0xffffff, 0.05)
                .setScrollFactor(0).setDepth(200);

            // ── Layer 201: skill emoji + key label ────────────────────────────
            const icon = this.scene.add.text(x, y - 4, iconText, { fontSize: '28px' })
                .setOrigin(0.5).setScrollFactor(0).setDepth(201)
                .setInteractive({ useHandCursor: true });

            const keyText = this.scene.add.text(x, y + labelOffsetY, key, {
                fontSize: '12px',
                fill: '#8899bb',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 3,
            }).setOrigin(0.5).setScrollFactor(0).setDepth(201)
              .setInteractive({ useHandCursor: true });

            // ── Layer 203: per-frame border + cooldown overlay ────────────────
            const cooldownArc = this.scene.add.graphics()
                .setScrollFactor(0).setDepth(203);

            // ── Layer 204: cooldown countdown text ────────────────────────────
            const cdText = this.scene.add.text(x, y + 8, '', {
                fontSize: '16px',
                fill: '#ffffff',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 4,
            }).setOrigin(0.5).setScrollFactor(0).setDepth(204);

            // ── Events ────────────────────────────────────────────────────────
            const useSkill    = () => { const sk = this.scene.skills?.[skillKey]; if (sk) sk.use(); };
            const showTooltip = () => this.showSkillTooltip(skillKey, x, y - radius - 48);
            const hideTooltip = () => this.hideSkillTooltip();

            bg.on('pointerover', () => {
                this.scene.tweens.add({ targets: [icon], scale: 1.15, duration: 80 });
                showTooltip();
            });
            bg.on('pointerout', () => {
                this.scene.tweens.add({ targets: [icon], scale: 1.0, duration: 80 });
                hideTooltip();
            });

            [bg, icon, keyText].forEach(obj => obj.on('pointerdown', useSkill));
            [icon, keyText].forEach(obj => {
                obj.on('pointerover', showTooltip);
                obj.on('pointerout',  hideTooltip);
            });

            this.skillButtons.push({
                bg, shapeGfx, watermarkGfx, glowGfx, innerHighlight,
                icon, keyText, cdText, cooldownArc,
                skillKey, x, y, radius,
                shapePoints, glowPoints,
            });
        });
    }

    showSkillTooltip(skillKey, x, y) {
        this.hideSkillTooltip();

        const camera = this.scene.cameras.main;
        const margin = 14;

        const skill = this.scene.skills?.[skillKey];
        if (!skill?.data) return;

        const skillColor = skill.data.color ? Phaser.Display.Color.IntegerToRGB(skill.data.color) : null;
        const hexColor   = skillColor
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

        const panel = this.scene.add.rectangle(clampedX, clampedY, bw, bh, 0x060c18, 0.94)
            .setStrokeStyle(1.5, 0x334466, 0.9)
            .setScrollFactor(0).setDepth(320);

        const headerBar = this.scene.add.rectangle(clampedX, clampedY - bh / 2 + 10, bw - 4, 18, 0x000000, 0.6)
            .setScrollFactor(0).setDepth(321);

        const title = this.scene.add.text(clampedX, clampedY - bh / 2 + 10, titleLine, {
            fontSize: '13px', fill: hexColor, fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(322);

        const desc = this.scene.add.text(clampedX, clampedY + 4, descLine, {
            fontSize: '11px', fill: '#c8d8f0', align: 'center',
            wordWrap: { width: bw - 20 },
        }).setOrigin(0.5).setScrollFactor(0).setDepth(322);

        const info = this.scene.add.text(clampedX, clampedY + bh / 2 - 10, infoLine, {
            fontSize: '11px', fill: '#ffcc88', fontStyle: 'bold',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(322);

        [panel, headerBar, title, desc, info].forEach(o => { o.alpha = 0; });
        this.scene.tweens.add({ targets: [panel, headerBar, title, desc, info], alpha: 1, duration: 80 });

        this.skillTooltip = { panel, headerBar, title, desc, info };
    }

    hideSkillTooltip() {
        if (!this.skillTooltip) return;
        Object.values(this.skillTooltip).forEach(obj => obj?.destroy());
        this.skillTooltip = null;
    }

    isPointerOnSkillButton(pointerX, pointerY) {
        return this.skillButtons.some(btn => {
            const dist = Phaser.Math.Distance.Between(pointerX, pointerY, btn.x, btn.y);
            return dist <= btn.radius;
        });
    }

    update(skills) {
        if (!skills) return;

        this.skillButtons.forEach(btn => {
            const skill = skills[btn.skillKey];
            if (!skill) return;

            if (btn.icon.text !== (skill.data?.icon || btn.icon.text)) {
                btn.icon.setText(skill.data?.icon || btn.icon.text);
            }

            const cooldownProgress = skill.getCooldownProgress ? skill.getCooldownProgress() : 1;
            const skillColor       = skill.data?.color || 0x00ff88;

            btn.glowGfx.clear();
            btn.cooldownArc.clear();

            if (cooldownProgress < 1) {
                // ── On cooldown ───────────────────────────────────────────────
                const remaining = Math.ceil((1 - cooldownProgress) * (skill.cooldown / 1000));

                // Dark polygon overlay
                btn.cooldownArc.fillStyle(0x000000, 0.55);
                btn.cooldownArc.fillPoints(btn.shapePoints, true);

                // Circular arc indicator showing time remaining
                btn.cooldownArc.lineStyle(3, 0xdd3333, 0.9);
                btn.cooldownArc.beginPath();
                const startAngle = -Math.PI / 2;
                const endAngle   = startAngle + (1 - cooldownProgress) * Math.PI * 2;
                btn.cooldownArc.arc(btn.x, btn.y, btn.radius - 3, startAngle, endAngle, false);
                btn.cooldownArc.strokePath();

                // Polygon border (cooldown tint)
                btn.cooldownArc.lineStyle(2.5, 0x553333, 0.9);
                btn.cooldownArc.strokePoints(btn.shapePoints, true);

                btn.cdText.setText(remaining + 's').setAlpha(1);
                btn.keyText.setAlpha(0);

            } else {
                // ── Ready ─────────────────────────────────────────────────────
                btn.cdText.setText('').setAlpha(0);
                btn.keyText.setAlpha(1);

                // Pulsing glow on outer polygon
                const t         = Date.now();
                const glowAlpha = 0.18 + Math.sin(t * 0.005) * 0.10;
                btn.glowGfx.fillStyle(skillColor, glowAlpha * 0.22);
                btn.glowGfx.fillPoints(btn.glowPoints, true);
                btn.glowGfx.lineStyle(3, skillColor, glowAlpha);
                btn.glowGfx.strokePoints(btn.glowPoints, true);

                // Polygon border (ready tint)
                btn.cooldownArc.lineStyle(2.5, skillColor, 0.78);
                btn.cooldownArc.strokePoints(btn.shapePoints, true);

                btn.keyText.setFill('#99eebb');
            }
        });
    }

    destroy() {
        this.hideSkillTooltip();
        this.skillButtons.forEach(btn => {
            btn.bg.destroy();
            btn.shapeGfx.destroy();
            btn.watermarkGfx.destroy();
            btn.glowGfx.destroy();
            btn.innerHighlight.destroy();
            btn.icon.destroy();
            btn.keyText.destroy();
            btn.cdText.destroy();
            btn.cooldownArc.destroy();
        });
        this.skillButtons = [];
    }
}
