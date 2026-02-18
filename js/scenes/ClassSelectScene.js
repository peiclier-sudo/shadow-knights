// ClassSelectScene.js - unified loadout with denser and clearer gameplay descriptions
import { CLASSES } from '../classes/classData.js';
import { WEAPONS } from '../weapons/weaponData.js';
import { SKILL_DATA } from '../skills/skillData.js';

const UI = {
    bgTop: 0x050915,
    bgBottom: 0x111d35,
    panel: 0x101a30,
    panelAlt: 0x132341,
    border: 0x2f4a74,
    text: '#ecf4ff',
    sub: '#8fa7cf',
    btnBg: '#182745',
    btnBorder: '#3b82f6',
    btnFill: '#c8d7f4',
    btnHoverBg: '#67e8f9',
    btnHoverFill: '#031323'
};

const CLASS_PASSIVES = {
    WARRIOR: 'PASSIF — Frappe de guerre: toutes les 10 touches sur le boss, la prochaine attaque de base déclenche automatiquement une attaque chargée bonus.',
    MAGE: 'PASSIF — Concentration arcanique: si vous ne subissez aucun dégât pendant 10s, vous gagnez +20% dégâts (cumulable 3 fois). Réinitialisé quand vous êtes touché.',
    ROGUE: 'PASSIF — Instinct du prédateur: toutes les 3s sans subir de dégâts, +15% critique (jusqu\'à 60%). Le bonus repart à 0 quand vous êtes touché.'
};

const WEAPON_GUIDE = {
    SWORD: {
        fantasy: 'Épée polyvalente de duel: pression constante à mi-courte portée.',
        basic: 'Attaque de base: slash rapide mono-cible, idéal pour maintenir un DPS régulier.',
        charged: 'Charge: Piercing Laser — rayon perçant en ligne pour punir les ouvertures.',
        ultimate: 'Ultimate (F): Sacred Radiance — grosse pression frontale en zone linéaire, excellent pour burst quand la jauge est pleine.',
        logic: 'Logique: alterner attaques rapides pour charger l\'ultimate puis utiliser la charge/ultimate quand le boss est aligné.'
    },
    BOW: {
        fantasy: 'Arc de contrôle: sécurité à longue portée et burst de zone.',
        basic: 'Attaque de base: tir précis à longue portée pour kite et poke en continu.',
        charged: 'Charge: Rain of Arrows — pluie de projectiles sur zone ciblée au sol.',
        ultimate: 'Ultimate (F): Eclipse Barrage — salve massive à distance qui domine une grande zone.',
        logic: 'Logique: rester mobile à distance, forcer les déplacements du boss, puis déclencher charge/ultimate sur ses patterns lents.'
    },
    STAFF: {
        fantasy: 'Bâton arcanique: pression magique constante et dégâts soutenus.',
        basic: 'Attaque de base: orbes homing perçants, très fiables même en mouvement.',
        charged: 'Charge: Fireball — impact explosif + dégâts sur la durée (DoT).',
        ultimate: 'Ultimate (F): Arcane Cataclysm — pic de dégâts magique sur une fenêtre courte.',
        logic: 'Logique: empiler les touches avec les orbes, poser la Fireball sur les timings immobiles, puis convertir en burst avec l\'ultimate.'
    },
    DAGGERS: {
        fantasy: 'Dagues agressives: cadence très élevée et pression rapprochée.',
        basic: 'Attaque de base: lancer en éventail, très efficace au contact et en angle serré.',
        charged: 'Charge: Poison Cloud — nuage au sol qui ralentit et use le boss dans la durée.',
        ultimate: 'Ultimate (F): Shadow Frenzy — exécution ultra-mobile multi-frappes pour burst rapide.',
        logic: 'Logique: coller le boss pour maximiser les projectiles, contrôler avec le poison, puis all-in avec l\'ultimate.'
    },
    GREATSWORD: {
        fantasy: 'Espadon lourd: gros impact, contrôle et fenêtre de punition.',
        basic: 'Attaque de base: onde de choc lente mais puissante.',
        charged: 'Charge: Colossus Breaker — coup massif avec zone d\'impact et contrôle (stun).',
        ultimate: 'Ultimate (F): Titan Collapse — énorme burst de mêlée en trajectoire engagée.',
        logic: 'Logique: jouer le tempo, interrompre les phases dangereuses avec le contrôle, puis convertir en dégâts massifs.'
    },
    THUNDER_GAUNTLET: {
        fantasy: 'Gantelet électrique: gameplay nerveux, dash offensif et vulnérabilité.',
        basic: 'Attaque de base: arc plasma rapide pour pression continue à courte portée.',
        charged: 'Charge: Thunder Snapback — traversée éclair + retour qui applique une vulnérabilité.',
        ultimate: 'Ultimate (F): Stormbreaker Protocol — séquence électrique explosive avec très gros burst.',
        logic: 'Logique: entrer/sortir vite, appliquer la vulnérabilité via la charge, puis claquer l\'ultimate pendant la fenêtre de fragilité.'
    }
};

const BG = {
    top: 0x050915,
    bottom: 0x111d35,
    panel: 0x101a30,
    border: 0x2f4a74,
    text: '#ecf4ff',
    sub: '#8fa7cf'
};

export class ClassSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ClassSelectScene' });
        this.selectedClass = 'WARRIOR';
        this.selectedWeapon = 'SWORD';
        this.classCards = {};
        this.weaponCards = {};
        this.classDetailsText = null;
        this.weaponDetailsText = null;
    }

    init(data) {
        if (data?.playerClass && CLASSES[data.playerClass]) {
            this.selectedClass = data.playerClass;
        }
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.drawBackground(width, height);

        this.add.text(width / 2, 50, 'LOADOUT CONFIGURATION', {
            fontSize: '48px',
            fill: UI.text,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(width / 2, 92, 'Choose class + weapon • review complete kit before entering', {
            fontSize: '20px',
            fill: UI.sub
        }).setOrigin(0.5);

        const contentTop = 122;
        const contentBottom = height - 88;
        const contentHeight = contentBottom - contentTop;

        const totalW = width - 120;
        const leftW = Math.floor(totalW * (2 / 3));
        const rightW = totalW - leftW - 18;
        const gap = 18;
        const leftX = 60 + leftW / 2;
        const rightX = 60 + leftW + gap + rightW / 2;

        this.createSelectionColumn(leftX, contentTop, contentHeight, leftW);
        this.createDetailsColumn(rightX, contentTop, contentHeight, rightW);
        this.createBottomButtons(width, height);

        this.refreshClassSelection();
        this.refreshWeaponSelection();
        this.refreshDetails();
    }

    drawBackground(width, height) {
        const bg = this.add.graphics();
        bg.fillGradientStyle(UI.bgTop, UI.bgTop, UI.bgBottom, UI.bgBottom, 1);
        bg.fillRect(0, 0, width, height);

        for (let i = 0; i < 100; i++) {
            const p = this.add.circle(
                Phaser.Math.Between(0, width),
                Phaser.Math.Between(0, height),
                Phaser.Math.Between(1, 2),
                0x67e8f9,
                Phaser.Math.FloatBetween(0.05, 0.28)
            );

            this.tweens.add({
                targets: p,
                alpha: Phaser.Math.FloatBetween(0.05, 0.35),
                duration: Phaser.Math.Between(1700, 3900),
                yoyo: true,
                repeat: -1
            });
        }
    }

    createPanel(x, y, w, h, title) {
        const panel = this.add.rectangle(x, y, w, h, UI.panel, 0.93).setOrigin(0.5);
        panel.setStrokeStyle(2, UI.border, 0.95);

        this.add.text(x - w / 2 + 14, y - h / 2 + 12, title, {
            fontSize: '17px',
            fill: '#67e8f9',
            fontStyle: 'bold'
        });

        return panel;
    }

    createSelectionColumn(x, topY, totalH, w) {
        const classH = Math.floor(totalH * 0.36);
        const spacing = 22;
        const weaponH = totalH - classH - spacing;

        const classY = topY + classH / 2;
        const weaponY = topY + classH + spacing + weaponH / 2;

        this.createClassSection(x, classY, w, classH);
        this.createWeaponSection(x, weaponY, w, weaponH);
    }

    createClassSection(panelX, panelY, panelW, panelH) {
        this.createPanel(panelX, panelY, panelW, panelH, 'CLASS SELECTION');

        const classKeys = ['WARRIOR', 'MAGE', 'ROGUE'];
        const cardW = Math.floor((panelW - 70) / 3);
        const cardH = panelH - 58;
        const gap = (panelW - classKeys.length * cardW) / (classKeys.length + 1);
        const startX = panelX - panelW / 2 + gap + cardW / 2;

        classKeys.forEach((key, idx) => {
            const data = CLASSES[key];
            const cx = startX + idx * (cardW + gap);
            const cy = panelY + 10;
            this.classCards[key] = this.createClassCard(cx, cy, cardW, cardH, key, data);
        });
    }

    createClassCard(x, y, w, h, key, data) {
        const c = this.add.container(x, y);
        const panel = this.add.rectangle(0, 0, w, h, UI.panelAlt, 0.95).setOrigin(0.5);
        panel.setStrokeStyle(2, data.glowColor, 0.45);

        const title = this.add.text(-w / 2 + 12, -h / 2 + 12, key, {
            fontSize: '20px',
            fill: '#f8fbff',
            fontStyle: 'bold'
        });

        const stats = this.add.text(-w / 2 + 10, -h / 2 + 44,
            `HP ${data.baseHealth}  ST ${data.baseStamina}  SPD ${data.baseSpeed}\nDash: ${data.dash.name}\nRole: ${this.getClassRole(key)}`, {
                fontSize: '13px',
                fill: '#c0d4f4',
                lineSpacing: 5,
                wordWrap: { width: w - 20 }
            });

        c.add([panel, title, stats]);

        panel.setInteractive({ useHandCursor: true });
        panel.on('pointerover', () => c.setScale(1.02));
        panel.on('pointerout', () => c.setScale(1));
        panel.on('pointerdown', () => {
            this.selectedClass = key;
            this.refreshClassSelection();
            this.refreshDetails();
        });

        return { container: c, panel };
    }

    createWeaponSection(panelX, panelY, panelW, panelH) {
        this.createPanel(panelX, panelY, panelW, panelH, 'WEAPON SELECTION');

        const keys = ['SWORD', 'BOW', 'STAFF', 'DAGGERS', 'GREATSWORD', 'THUNDER_GAUNTLET'];
        const cols = 3;
        const rows = 2;
        const innerW = panelW - 36;
        const innerH = panelH - 54;
        const cardW = Math.floor((innerW - 22) / cols);
        const cardH = Math.floor((innerH - 8) / rows);
        const startX = panelX - panelW / 2 + 18 + cardW / 2;
        const startY = panelY - panelH / 2 + 38 + cardH / 2;

        keys.forEach((key, idx) => {
            const weapon = WEAPONS[key];
            const col = idx % cols;
            const row = Math.floor(idx / cols);
            const wx = startX + col * (cardW + 11);
            const wy = startY + row * (cardH + 10);
            this.weaponCards[key] = this.createWeaponCard(wx, wy, cardW, cardH, key, weapon);
        });
    }

    createWeaponCard(x, y, w, h, key, weapon) {
        const c = this.add.container(x, y);
        const panel = this.add.rectangle(0, 0, w, h, UI.panelAlt, 0.95).setOrigin(0.5);
        panel.setStrokeStyle(2, weapon.color || 0x67e8f9, 0.42);

        const title = this.add.text(-w / 2 + 10, -h / 2 + 10, weapon.name, {
            fontSize: '14px',
            fill: '#f8fbff',
            fontStyle: 'bold'
        });

        const meta = this.add.text(-w / 2 + 8, -h / 2 + 36,
            `${weapon.projectile.damage} dmg • ${weapon.projectile.cooldown}ms\nRNG ${weapon.projectile.range} • ${weapon.charged.name}`, {
                fontSize: '11px',
                fill: '#c0d4f4',
                lineSpacing: 4,
                wordWrap: { width: w - 14 }
            });

        c.add([panel, title, meta]);

        panel.setInteractive({ useHandCursor: true });
        panel.on('pointerover', () => c.setScale(1.02));
        panel.on('pointerout', () => c.setScale(1));
        panel.on('pointerdown', () => {
            this.selectedWeapon = key;
            this.refreshWeaponSelection();
            this.refreshDetails();
        });

        return { container: c, panel };
    }

    createDetailsColumn(x, topY, totalH, w) {
        const spacing = 18;
        const classBoxH = Math.floor((totalH - spacing) / 2);
        const weaponBoxH = totalH - classBoxH - spacing;

        const classY = topY + classBoxH / 2;
        const weaponY = topY + classBoxH + spacing + weaponBoxH / 2;

        this.createPanel(x, classY, w, classBoxH, 'CLASS DESCRIPTION');
        this.createPanel(x, weaponY, w, weaponBoxH, 'WEAPON DESCRIPTION');

        this.classDetailsText = this.add.text(x - w / 2 + 14, classY - classBoxH / 2 + 52, '', {
            fontSize: '14px',
            fill: '#d6e4ff',
            lineSpacing: 4,
            wordWrap: { width: w - 28 }
        });

        this.weaponDetailsText = this.add.text(x - w / 2 + 14, weaponY - weaponBoxH / 2 + 52, '', {
            fontSize: '14px',
            fill: '#d6e4ff',
            lineSpacing: 4,
            wordWrap: { width: w - 28 }
        });
    }

    refreshClassSelection() {
        Object.entries(this.classCards).forEach(([key, refs]) => {
            const selected = key === this.selectedClass;
            refs.panel.setStrokeStyle(3, selected ? 0x67e8f9 : 0x2f4a74, selected ? 1 : 0.45);
            refs.container.setScale(selected ? 1.02 : 1);
        });
    }

    refreshWeaponSelection() {
        Object.entries(this.weaponCards).forEach(([key, refs]) => {
            const selected = key === this.selectedWeapon;
            refs.panel.setStrokeStyle(3, selected ? 0x67e8f9 : 0x2f4a74, selected ? 1 : 0.45);
            refs.container.setScale(selected ? 1.02 : 1);
        });
    }

    getClassRole(key) {
        if (key === 'WARRIOR') return 'Frontline brawler';
        if (key === 'MAGE') return 'Burst caster';
        return 'Mobile assassin';
    }

    getClassSkillsText(classData) {
        return classData.skills.map((skill) => {
            const def = SKILL_DATA[skill.id];
            const desc = def?.description || 'No description';
            return `• ${skill.name}: ${desc}`;
        }).join('\n');
    }

    getWeaponGuideText(key, weapon) {
        const guide = WEAPON_GUIDE[key];
        if (!guide) {
            return `${weapon.name}\n${weapon.description}\n\n` +
                `Basic: ${weapon.projectile.damage} dmg, ${weapon.projectile.cooldown}ms, portée ${weapon.projectile.range}.\n` +
                `Charge: ${weapon.charged.name}, ${weapon.charged.damage} dmg, charge ${weapon.charged.chargeTime}ms.\n` +
                'Ultimate (F): déclenché à 100% de jauge, utilisé comme finisher de phase.';
        }

        return `${weapon.name}\n${guide.fantasy}\n\n` +
            `${guide.basic}\n` +
            `${guide.charged}\n` +
            `${guide.ultimate}\n\n` +
            `${guide.logic}`;
    }

    refreshDetails() {
        const classData = CLASSES[this.selectedClass];
        const weapon = WEAPONS[this.selectedWeapon];

        if (this.classDetailsText) {
            this.classDetailsText.setText(
                `${this.selectedClass}\n` +
                `Role: ${this.getClassRole(this.selectedClass)}\n` +
                `Stats: HP ${classData.baseHealth} • ST ${classData.baseStamina} • SPD ${classData.baseSpeed}\n` +
                `Dash: ${classData.dash.name}\n\n` +
                `${CLASS_PASSIVES[this.selectedClass]}\n\n` +
                `Skills\n${this.getClassSkillsText(classData)}`
            );
        }

        if (this.weaponDetailsText) {
            this.weaponDetailsText.setText(this.getWeaponGuideText(this.selectedWeapon, weapon));
        }
    }

    createBottomButtons(width, height) {
        const y = height - 32;

        const backBtn = this.createBottomButton(80, y, '← BACK', () => {
            this.scene.start('MenuScene');
        }, true);

        const startBtn = this.createBottomButton(width - 80, y, 'CONTINUE →', () => {
            this.cameras.main.fade(260, 5, 10, 20);
            this.time.delayedCall(260, () => {
                this.scene.start('TowerScene', {
                    playerClass: this.selectedClass,
                    weapon: this.selectedWeapon
                });
            });
        }, false);

        [backBtn, startBtn].forEach((b) => {
            b.on('pointerover', () => b.setStyle({ fill: UI.btnHoverFill, backgroundColor: UI.btnHoverBg }));
            b.on('pointerout', () => b.setStyle({ fill: UI.btnFill, backgroundColor: UI.btnBg }));
        });

        panel.on('pointerdown', () => {
            this.cameras.main.fade(260, 5, 10, 20);
            this.time.delayedCall(260, () => this.scene.start('WeaponSelectScene', { playerClass: classKey }));
        });
    }

    createBackButton(x, y) {
        const btn = this.add.text(x, y, '← BACK', {
            fontSize: '20px',
            fill: '#c8d7f4',
            backgroundColor: '#182745',
            stroke: '#3b82f6',
            strokeThickness: 1,
            padding: { x: 12, y: 7 }
        }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

        btn.on('pointerdown', () => this.scene.start('MenuScene'));
        btn.on('pointerover', () => btn.setStyle({ fill: '#031323', backgroundColor: '#67e8f9' }));
        btn.on('pointerout', () => btn.setStyle({ fill: '#c8d7f4', backgroundColor: '#182745' }));
    }

    createBottomButton(x, y, label, onClick, left) {
        const btn = this.add.text(x, y, label, {
            fontSize: '20px',
            fill: UI.btnFill,
            backgroundColor: UI.btnBg,
            stroke: UI.btnBorder,
            strokeThickness: 1,
            padding: { x: 12, y: 7 }
        }).setOrigin(left ? 0 : 1, 0.5).setInteractive({ useHandCursor: true });

        btn.on('pointerdown', onClick);
        return btn;
    }
}
