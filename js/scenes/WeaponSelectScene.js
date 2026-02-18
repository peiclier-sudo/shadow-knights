// WeaponSelectScene.js - polished weapon selection
import { WEAPONS } from '../weapons/weaponData.js';

const BG = {
    top: 0x050915,
    bottom: 0x111d35,
    panel: 0x101a30,
    border: 0x2f4a74,
    text: '#ecf4ff',
    sub: '#8fa7cf'
};

export class WeaponSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WeaponSelectScene' });
    }

    init(data) {
        this.playerClass = data.playerClass || 'WARRIOR';
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.drawBackground(width, height);

        this.add.text(width / 2, 58, 'SELECT YOUR WEAPON', {
            fontSize: '44px',
            fill: BG.text,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(width / 2, 102, `Class locked: ${this.playerClass}`, {
            fontSize: '18px',
            fill: BG.sub
        }).setOrigin(0.5);

        const keys = ['SWORD', 'BOW', 'STAFF', 'DAGGERS', 'GREATSWORD', 'THUNDER_GAUNTLET'];
        const cols = 3;
        const cardW = Math.min(340, Math.floor(width * 0.27));
        const cardH = 255;
        const gapX = Math.floor((width - cardW * cols) / (cols + 1));
        const gapY = 28;
        const topY = 220;

        keys.forEach((key, index) => {
            const weapon = WEAPONS[key];
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = gapX + cardW / 2 + col * (cardW + gapX);
            const y = topY + row * (cardH + gapY);
            this.createWeaponCard(x, y, cardW, cardH, key, weapon);
        });

        this.createBackButton(80, height - 60);
    }

    drawBackground(width, height) {
        const bg = this.add.graphics();
        bg.fillGradientStyle(BG.top, BG.top, BG.bottom, BG.bottom, 1);
        bg.fillRect(0, 0, width, height);

        for (let i = 0; i < 90; i++) {
            const p = this.add.circle(
                Phaser.Math.Between(0, width),
                Phaser.Math.Between(0, height),
                Phaser.Math.Between(1, 2),
                0x60a5fa,
                Phaser.Math.FloatBetween(0.07, 0.25)
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

    createWeaponCard(x, y, w, h, key, weapon) {
        const c = this.add.container(x, y);
        const shadow = this.add.rectangle(8, 10, w, h, 0x000000, 0.3).setOrigin(0.5);
        const panel = this.add.rectangle(0, 0, w, h, BG.panel, 0.92).setOrigin(0.5);
        panel.setStrokeStyle(2, weapon.color || 0x67e8f9, 0.9);

        const iconGlow = this.add.circle(-w / 2 + 52, -h / 2 + 50, 28, weapon.color || 0x67e8f9, 0.24)
            .setStrokeStyle(2, weapon.color || 0x67e8f9, 0.9);
        const icon = this.add.text(-w / 2 + 52, -h / 2 + 50, weapon.icon, { fontSize: '30px' }).setOrigin(0.5);

        const title = this.add.text(-w / 2 + 95, -h / 2 + 34, weapon.name, {
            fontSize: '22px',
            fill: '#f8fbff',
            fontStyle: 'bold'
        });

        const desc = this.add.text(-w / 2 + 20, -h / 2 + 88, weapon.description, {
            fontSize: '14px',
            fill: '#a9bddf',
            wordWrap: { width: w - 40 }
        });

        const stats = this.add.text(-w / 2 + 20, 10,
            `Basic DMG ${weapon.projectile.damage}   SPD ${weapon.projectile.speed}\nCharged: ${weapon.charged.name}\nCharged DMG ${weapon.charged.damage}   CD ${weapon.projectile.cooldown}ms`, {
                fontSize: '14px',
                fill: '#d9e7ff',
                lineSpacing: 6,
                fontFamily: 'monospace'
            });

        const pick = this.add.text(0, h / 2 - 28, 'EQUIP WEAPON', {
            fontSize: '17px',
            fill: '#031323',
            backgroundColor: '#67e8f9',
            padding: { x: 12, y: 7 },
            fontStyle: 'bold'
        }).setOrigin(0.5);

        c.add([shadow, panel, iconGlow, icon, title, desc, stats, pick]);

        panel.setInteractive({ useHandCursor: true });
        panel.on('pointerover', () => {
            c.setScale(1.02);
            this.tweens.add({ targets: iconGlow, scale: 1.12, duration: 140 });
            pick.setStyle({ backgroundColor: '#22d3ee' });
        });

        panel.on('pointerout', () => {
            c.setScale(1);
            this.tweens.add({ targets: iconGlow, scale: 1, duration: 140 });
            pick.setStyle({ backgroundColor: '#67e8f9' });
        });

        panel.on('pointerdown', () => {
            this.cameras.main.fade(260, 5, 10, 20);
            this.time.delayedCall(260, () => {
                this.scene.start('TowerScene', {
                    playerClass: this.playerClass,
                    weapon: key
                });
            });
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

        btn.on('pointerdown', () => this.scene.start('ClassSelectScene', { playerClass: this.playerClass }));
        btn.on('pointerover', () => btn.setStyle({ fill: '#031323', backgroundColor: '#67e8f9' }));
        btn.on('pointerout', () => btn.setStyle({ fill: '#c8d7f4', backgroundColor: '#182745' }));
    }
}
