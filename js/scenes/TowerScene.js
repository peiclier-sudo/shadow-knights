// TowerScene.js - The Tower: A vertical boss-rush progression screen
import { BOSSES } from '../data/BossData.js';
import { GameData } from '../data/GameData.js';

// Floor subtitles for each boss
const FLOOR_SUBTITLES = {
    1: 'The Iron Gate',
    2: 'The Firing Range',
    3: 'The Wind Corridor',
    4: 'The Echo Chamber',
    5: 'The Starfall Sanctum',
    6: 'The Clockwork Spire',
    7: 'The Singularity Well',
    8: 'The Molten Throne',
    9: 'The Prismatic Court',
    10: 'The Eternal Summit'
};

export class TowerScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TowerScene' });
    }

    init(data) {
        this.playerClass = data.playerClass || 'WARRIOR';
        this.weapon = data.weapon || 'SWORD';
    }

    create() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        const bossIds = Object.keys(BOSSES).map(Number).sort((a, b) => a - b);
        const totalFloors = bossIds.length;

        // Layout constants
        const FLOOR_H = 160;
        const TOWER_W = 420;
        const PADDING_TOP = 200;
        const PADDING_BOT = 160;
        const totalH = PADDING_TOP + totalFloors * FLOOR_H + PADDING_BOT;

        // World bounds for scrolling
        this.cameras.main.setBounds(0, 0, w, totalH);

        // ── Background ──
        const bg = this.add.graphics();
        bg.fillStyle(0x040409, 1);
        bg.fillRect(0, 0, w, totalH);

        // Subtle vertical gradient overlay
        for (let i = 0; i < totalH; i += 4) {
            const t = i / totalH;
            const r = Math.floor(4 + t * 12);
            const g = Math.floor(4 + t * 4);
            const b = Math.floor(9 + t * 20);
            bg.fillStyle(Phaser.Display.Color.GetColor(r, g, b), 0.3);
            bg.fillRect(0, i, w, 4);
        }

        // ── Ambient star particles ──
        for (let i = 0; i < 80; i++) {
            const sx = Phaser.Math.Between(0, w);
            const sy = Phaser.Math.Between(0, totalH);
            const size = Phaser.Math.FloatBetween(0.5, 2);
            const star = this.add.circle(sx, sy, size, 0xffffff, Phaser.Math.FloatBetween(0.08, 0.3));
            this.tweens.add({
                targets: star,
                alpha: Phaser.Math.FloatBetween(0.02, 0.12),
                duration: Phaser.Math.Between(1500, 4000),
                yoyo: true,
                repeat: -1
            });
        }

        // ── Floating embers rising through the tower ──
        for (let i = 0; i < 20; i++) {
            const ex = Phaser.Math.Between(w / 2 - TOWER_W / 2 - 40, w / 2 + TOWER_W / 2 + 40);
            const ey = Phaser.Math.Between(0, totalH);
            const ember = this.add.circle(ex, ey, Phaser.Math.FloatBetween(1, 3), 0x00d4ff, 0.25);
            this.tweens.add({
                targets: ember,
                y: ey - Phaser.Math.Between(200, 500),
                x: ex + Phaser.Math.Between(-40, 40),
                alpha: 0,
                duration: Phaser.Math.Between(4000, 8000),
                repeat: -1,
                delay: Phaser.Math.Between(0, 3000)
            });
        }

        // ── Tower title at the very top ──
        const titleY = PADDING_TOP - 120;
        this.add.text(w / 2, titleY, 'THE TOWER', {
            fontSize: '56px',
            fill: '#00d4ff',
            fontStyle: 'bold',
            stroke: '#fff',
            strokeThickness: 2,
            shadow: { offsetX: 0, offsetY: 0, color: '#00d4ff', blur: 30, fill: true }
        }).setOrigin(0.5);

        this.add.text(w / 2, titleY + 48, 'Ascend through the darkness', {
            fontSize: '16px',
            fill: '#556677'
        }).setOrigin(0.5);

        // ── Central tower spine ──
        const towerG = this.add.graphics();
        const towerX = w / 2;
        const spineLeft = towerX - TOWER_W / 2;
        const spineRight = towerX + TOWER_W / 2;
        const towerTop = PADDING_TOP - 20;
        const towerBot = PADDING_TOP + totalFloors * FLOOR_H + 20;

        // Tower walls (dark stone)
        towerG.fillStyle(0x0c0c18, 0.85);
        towerG.fillRect(spineLeft, towerTop, TOWER_W, towerBot - towerTop);

        // Tower wall borders
        towerG.lineStyle(2, 0x1a1a2e, 0.9);
        towerG.strokeRect(spineLeft, towerTop, TOWER_W, towerBot - towerTop);

        // Decorative vertical lines inside tower walls
        towerG.lineStyle(1, 0x111122, 0.5);
        for (let lx = spineLeft + 30; lx < spineRight; lx += 30) {
            towerG.lineBetween(lx, towerTop, lx, towerBot);
        }

        // Decorative horizontal stone lines
        towerG.lineStyle(1, 0x111122, 0.4);
        for (let ly = towerTop; ly < towerBot; ly += 20) {
            towerG.lineBetween(spineLeft, ly, spineRight, ly);
        }

        // ── Build each floor (bottom = floor 1, top = floor 10) ──
        this.floorContainers = [];

        bossIds.forEach((bossId, index) => {
            const bossData = BOSSES[bossId];
            const unlocked = bossId <= GameData.unlockedBosses;
            const defeated = GameData.isBossDefeated(bossId);
            const isCurrent = !defeated && bossId === Math.min(GameData.currentBossId, GameData.unlockedBosses);

            // Floor 1 at bottom, floor 10 at top
            const floorIndex = totalFloors - index - 1;
            const floorY = PADDING_TOP + floorIndex * FLOOR_H + FLOOR_H / 2;

            // ── Floor platform ──
            const g = this.add.graphics();

            // Floor background
            const floorAlpha = unlocked ? 0.25 : 0.08;
            const colorHex = bossData.color;
            g.fillStyle(colorHex, floorAlpha);
            g.fillRoundedRect(spineLeft + 10, floorY - 60, TOWER_W - 20, 120, 8);

            // Floor border
            const borderAlpha = isCurrent ? 1 : unlocked ? 0.6 : 0.15;
            g.lineStyle(isCurrent ? 3 : 2, bossData.glowColor, borderAlpha);
            g.strokeRoundedRect(spineLeft + 10, floorY - 60, TOWER_W - 20, 120, 8);

            // Current floor: animated glow border
            if (isCurrent) {
                const glowRect = this.add.graphics();
                glowRect.lineStyle(4, bossData.glowColor, 0.5);
                glowRect.strokeRoundedRect(spineLeft + 6, floorY - 64, TOWER_W - 12, 128, 10);
                this.tweens.add({
                    targets: glowRect,
                    alpha: 0.15,
                    duration: 1200,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }

            // ── Connector chain to floor above ──
            if (index > 0) {
                const chainY1 = floorY - 60;
                const chainY0 = floorY - FLOOR_H + 60;
                const chainG = this.add.graphics();
                const chainColor = unlocked ? 0x2a2a4a : 0x111122;
                chainG.lineStyle(2, chainColor, unlocked ? 0.7 : 0.3);
                // Two parallel chain lines
                chainG.lineBetween(towerX - 8, chainY0, towerX - 8, chainY1);
                chainG.lineBetween(towerX + 8, chainY0, towerX + 8, chainY1);
                // Chain links
                for (let cy = chainY0 + 10; cy < chainY1; cy += 18) {
                    chainG.lineStyle(1, chainColor, unlocked ? 0.5 : 0.2);
                    chainG.lineBetween(towerX - 8, cy, towerX + 8, cy);
                }
            }

            // ── Floor number badge (left side) ──
            const badgeX = spineLeft + 40;
            const badgeCircle = this.add.circle(badgeX, floorY, 22, 0x0a0a14, 0.9);
            badgeCircle.setStrokeStyle(2, unlocked ? bossData.glowColor : 0x333344, unlocked ? 0.9 : 0.4);
            this.add.text(badgeX, floorY, `${bossId}`, {
                fontSize: '20px',
                fill: unlocked ? '#fff' : '#444',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            // ── Boss preview orb (right of badge) ──
            const orbX = spineLeft + 100;
            const orbRadius = 30;

            if (unlocked) {
                // Colored boss orb
                const orbGlow = this.add.circle(orbX, floorY, orbRadius + 8, bossData.glowColor, 0.12);
                const orb = this.add.circle(orbX, floorY, orbRadius, bossData.color, 0.6);
                orb.setStrokeStyle(2, bossData.glowColor, 0.9);

                // Inner core
                this.add.circle(orbX, floorY, 8, 0xffffff, 0.7);

                if (isCurrent) {
                    this.tweens.add({
                        targets: orbGlow,
                        scale: 1.3,
                        alpha: 0.04,
                        duration: 1000,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                    });
                }

                if (defeated) {
                    // Defeated: dimmed with check
                    orb.setAlpha(0.3);
                    orbGlow.setAlpha(0.05);
                }
            } else {
                // Locked: dark silhouette
                this.add.circle(orbX, floorY, orbRadius, 0x111122, 0.5);
                this.add.circle(orbX, floorY, orbRadius, 0x000000, 0).setStrokeStyle(2, 0x222233, 0.5);
            }

            // ── Boss info text ──
            const textX = spineLeft + 155;

            // Boss name
            const nameColor = unlocked ? '#fff' : '#333';
            const nameText = this.add.text(textX, floorY - 28, unlocked ? bossData.name : '? ? ?', {
                fontSize: '22px',
                fill: nameColor,
                fontStyle: 'bold',
                shadow: isCurrent ? { offsetX: 0, offsetY: 0, color: '#' + bossData.glowColor.toString(16).padStart(6, '0'), blur: 12, fill: true } : undefined
            });

            // Floor subtitle
            const subtitleColor = unlocked ? '#' + bossData.glowColor.toString(16).padStart(6, '0') : '#222';
            this.add.text(textX, floorY - 4, FLOOR_SUBTITLES[bossId] || '', {
                fontSize: '13px',
                fill: subtitleColor,
                fontStyle: 'italic'
            });

            // Attack type
            if (unlocked) {
                this.add.text(textX, floorY + 16, bossData.attackType, {
                    fontSize: '12px',
                    fill: '#667788'
                });
            }

            // HP display
            if (unlocked) {
                this.add.text(textX, floorY + 34, `HP ${bossData.hp}`, {
                    fontSize: '14px',
                    fill: '#cc8844',
                    fontStyle: 'bold'
                });
            }

            // ── Status indicator (right side) ──
            const statusX = spineRight - 50;
            if (defeated) {
                // Checkmark
                const checkG = this.add.graphics();
                checkG.lineStyle(3, 0x00ff88, 0.9);
                checkG.lineBetween(statusX - 10, floorY, statusX - 3, floorY + 8);
                checkG.lineBetween(statusX - 3, floorY + 8, statusX + 10, floorY - 8);
                this.add.text(statusX, floorY + 22, 'CLEARED', {
                    fontSize: '10px',
                    fill: '#00ff88'
                }).setOrigin(0.5);
            } else if (isCurrent && unlocked) {
                // Current floor arrow indicator
                const arrow = this.add.text(statusX, floorY - 6, '>>>', {
                    fontSize: '20px',
                    fill: '#00d4ff',
                    fontStyle: 'bold'
                }).setOrigin(0.5);
                this.tweens.add({
                    targets: arrow,
                    x: statusX + 6,
                    alpha: 0.3,
                    duration: 600,
                    yoyo: true,
                    repeat: -1
                });
                this.add.text(statusX, floorY + 18, 'ENTER', {
                    fontSize: '11px',
                    fill: '#00d4ff',
                    fontStyle: 'bold'
                }).setOrigin(0.5);
            } else if (!unlocked) {
                // Lock
                const lockG = this.add.graphics();
                // Lock body
                lockG.fillStyle(0x222233, 0.8);
                lockG.fillRoundedRect(statusX - 12, floorY - 6, 24, 18, 3);
                // Lock shackle
                lockG.lineStyle(3, 0x333344, 0.8);
                lockG.beginPath();
                lockG.arc(statusX, floorY - 8, 8, Math.PI, 0, false);
                lockG.strokePath();
                this.add.text(statusX, floorY + 22, 'LOCKED', {
                    fontSize: '10px',
                    fill: '#333'
                }).setOrigin(0.5);
            }

            // ── Interactivity ──
            if (unlocked) {
                const hitArea = this.add.rectangle(towerX, floorY, TOWER_W - 20, 120, 0xffffff, 0)
                    .setInteractive({ useHandCursor: true });

                hitArea.on('pointerover', () => {
                    g.clear();
                    g.fillStyle(colorHex, floorAlpha + 0.12);
                    g.fillRoundedRect(spineLeft + 10, floorY - 60, TOWER_W - 20, 120, 8);
                    g.lineStyle(3, bossData.glowColor, 1);
                    g.strokeRoundedRect(spineLeft + 10, floorY - 60, TOWER_W - 20, 120, 8);
                    nameText.setStyle({ fill: '#' + bossData.glowColor.toString(16).padStart(6, '0') });
                });

                hitArea.on('pointerout', () => {
                    g.clear();
                    g.fillStyle(colorHex, floorAlpha);
                    g.fillRoundedRect(spineLeft + 10, floorY - 60, TOWER_W - 20, 120, 8);
                    g.lineStyle(isCurrent ? 3 : 2, bossData.glowColor, borderAlpha);
                    g.strokeRoundedRect(spineLeft + 10, floorY - 60, TOWER_W - 20, 120, 8);
                    nameText.setStyle({ fill: nameColor });
                });

                hitArea.on('pointerdown', () => {
                    // Flash effect
                    const flash = this.add.rectangle(w / 2, floorY, w, 120, bossData.glowColor, 0.3)
                        .setDepth(100);
                    this.tweens.add({
                        targets: flash,
                        alpha: 0,
                        duration: 300,
                        onComplete: () => flash.destroy()
                    });

                    this.cameras.main.fade(600, 0, 0, 0);
                    this.time.delayedCall(600, () => {
                        this.scene.start('GameScene', {
                            playerConfig: {
                                class: this.playerClass,
                                weapon: this.weapon
                            },
                            bossId: bossId
                        });
                    });
                });
            }

            this.floorContainers.push({ bossId, floorY, isCurrent });
        });

        // ── Tower crown at top ──
        const crownY = PADDING_TOP - 40;
        const crownG = this.add.graphics();
        crownG.fillStyle(0x00d4ff, 0.08);
        crownG.fillTriangle(towerX - 60, crownY, towerX + 60, crownY, towerX, crownY - 50);
        crownG.lineStyle(2, 0x00d4ff, 0.4);
        crownG.strokeTriangle(towerX - 60, crownY, towerX + 60, crownY, towerX, crownY - 50);

        // ── Tower base at bottom ──
        const baseY = PADDING_TOP + totalFloors * FLOOR_H + 20;
        const baseG = this.add.graphics();
        baseG.fillStyle(0x0c0c18, 0.9);
        baseG.fillRect(spineLeft - 20, baseY, TOWER_W + 40, 30);
        baseG.lineStyle(2, 0x1a1a2e, 0.8);
        baseG.strokeRect(spineLeft - 20, baseY, TOWER_W + 40, 30);
        baseG.fillStyle(0x0c0c18, 0.8);
        baseG.fillRect(spineLeft - 40, baseY + 30, TOWER_W + 80, 15);
        baseG.lineStyle(2, 0x1a1a2e, 0.6);
        baseG.strokeRect(spineLeft - 40, baseY + 30, TOWER_W + 80, 15);

        // ── Decorative side torches ──
        for (let i = 0; i < totalFloors; i++) {
            const ty = PADDING_TOP + (totalFloors - i - 1) * FLOOR_H + FLOOR_H / 2;
            const bossData = BOSSES[i + 1];
            const unlocked = (i + 1) <= GameData.unlockedBosses;

            // Left torch
            const torchLx = spineLeft - 15;
            this.add.rectangle(torchLx, ty + 10, 6, 16, 0x1a1a2e, 0.7);
            if (unlocked) {
                const flameL = this.add.circle(torchLx, ty, 6, bossData.glowColor, 0.5);
                this.tweens.add({
                    targets: flameL,
                    scale: Phaser.Math.FloatBetween(0.6, 1.4),
                    alpha: Phaser.Math.FloatBetween(0.15, 0.4),
                    duration: Phaser.Math.Between(300, 600),
                    yoyo: true,
                    repeat: -1
                });
            }

            // Right torch
            const torchRx = spineRight + 15;
            this.add.rectangle(torchRx, ty + 10, 6, 16, 0x1a1a2e, 0.7);
            if (unlocked) {
                const flameR = this.add.circle(torchRx, ty, 6, bossData.glowColor, 0.5);
                this.tweens.add({
                    targets: flameR,
                    scale: Phaser.Math.FloatBetween(0.6, 1.4),
                    alpha: Phaser.Math.FloatBetween(0.15, 0.4),
                    duration: Phaser.Math.Between(300, 600),
                    yoyo: true,
                    repeat: -1
                });
            }
        }

        // ── Fixed UI overlay (Back button + class/weapon info) ──
        const uiContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(200);

        // Top bar background
        const topBar = this.add.graphics().setScrollFactor(0).setDepth(199);
        topBar.fillStyle(0x040409, 0.85);
        topBar.fillRect(0, 0, w, 50);
        topBar.lineStyle(1, 0x1a1a2e, 0.6);
        topBar.lineBetween(0, 50, w, 50);

        // Class + weapon display
        const infoText = this.add.text(w / 2, 25, `${this.playerClass}  ·  ${this.weapon}`, {
            fontSize: '14px',
            fill: '#556677'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

        // Back button
        const backBtn = this.add.text(20, 25, '< BACK', {
            fontSize: '18px',
            fill: '#667788',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(200).setInteractive({ useHandCursor: true });

        backBtn.on('pointerover', () => backBtn.setStyle({ fill: '#00d4ff' }));
        backBtn.on('pointerout', () => backBtn.setStyle({ fill: '#667788' }));
        backBtn.on('pointerdown', () => {
            this.scene.start('WeaponSelectScene', { playerClass: this.playerClass });
        });

        // Bottom fade gradient (fixed)
        const botFade = this.add.graphics().setScrollFactor(0).setDepth(198);
        botFade.fillStyle(0x040409, 0.9);
        botFade.fillRect(0, h - 30, w, 30);
        for (let i = 0; i < 30; i++) {
            botFade.fillStyle(0x040409, (i / 30) * 0.9);
            botFade.fillRect(0, h - 60 + i, w, 1);
        }

        // ── Progress indicator (fixed bottom) ──
        const defeated = GameData.defeatedBosses.size;
        const progressText = this.add.text(w / 2, h - 45, `${defeated} / ${totalFloors} DEFEATED`, {
            fontSize: '14px',
            fill: '#445566'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

        // Progress bar
        const progBarW = 200;
        const progBarH = 4;
        const progBarX = w / 2 - progBarW / 2;
        const progBarY = h - 28;
        const progG = this.add.graphics().setScrollFactor(0).setDepth(200);
        progG.fillStyle(0x111122, 0.8);
        progG.fillRoundedRect(progBarX, progBarY, progBarW, progBarH, 2);
        progG.fillStyle(0x00d4ff, 0.7);
        progG.fillRoundedRect(progBarX, progBarY, progBarW * (defeated / totalFloors), progBarH, 2);

        // ── Auto-scroll to current floor ──
        const currentFloor = this.floorContainers.find(f => f.isCurrent);
        if (currentFloor) {
            const targetScrollY = Math.max(0, Math.min(currentFloor.floorY - h / 2, totalH - h));
            this.cameras.main.scrollY = targetScrollY;
        }

        // ── Mouse wheel scrolling ──
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
            const newY = Phaser.Math.Clamp(
                this.cameras.main.scrollY + deltaY * 0.5,
                0,
                Math.max(0, totalH - h)
            );
            this.cameras.main.scrollY = newY;
        });

        // ── Touch/drag scrolling ──
        this.isDragging = false;
        this.dragStartY = 0;
        this.scrollStartY = 0;
        this.totalHeight = totalH;

        this.input.on('pointerdown', (pointer) => {
            this.isDragging = true;
            this.dragStartY = pointer.y;
            this.scrollStartY = this.cameras.main.scrollY;
        });

        this.input.on('pointermove', (pointer) => {
            if (this.isDragging && pointer.isDown) {
                const dy = this.dragStartY - pointer.y;
                if (Math.abs(dy) > 5) {
                    const newY = Phaser.Math.Clamp(
                        this.scrollStartY + dy,
                        0,
                        Math.max(0, this.totalHeight - h)
                    );
                    this.cameras.main.scrollY = newY;
                }
            }
        });

        this.input.on('pointerup', () => {
            this.isDragging = false;
        });
    }
}
