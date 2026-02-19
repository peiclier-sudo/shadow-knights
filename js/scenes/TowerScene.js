// TowerScene.js — Shadow Knights Tower
// Structure mirrors DashboardScene exactly (same C palette, same layout coords)
import { BOSSES } from '../data/BossData.js';
import { GameData } from '../data/GameData.js';
import { AFFIXES, getEndlessFloor, getFloorStars } from '../data/AffixData.js';
import { soundManager } from '../utils/SoundManager.js';

// ── Exact same palette as DashboardScene ─────────────────────────────────────
const C = {
    bgTop: 0x060b18, bgBottom: 0x131f38,
    panel: 0x101d35, panelBorder: 0x2f4a74,
    accent: '#67e8f9', text: '#ecf4ff', muted: '#8ea6cc'
};

const hexStr = n => '#' + n.toString(16).padStart(6, '0');

const LORE = {
    1:  { sub: 'The Iron Gate',        tier: 'I'    },
    2:  { sub: 'The Firing Range',     tier: 'II'   },
    3:  { sub: 'The Wind Corridor',    tier: 'III'  },
    4:  { sub: 'The Echo Chamber',     tier: 'IV'   },
    5:  { sub: 'The Starfall Sanctum', tier: 'V'    },
    6:  { sub: 'The Clockwork Spire',  tier: 'VI'   },
    7:  { sub: 'The Singularity Well', tier: 'VII'  },
    8:  { sub: 'The Molten Throne',    tier: 'VIII' },
    9:  { sub: 'The Prismatic Court',  tier: 'IX'   },
    10: { sub: 'The Eternal Summit',   tier: 'X'    },
};

export class TowerScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TowerScene' });
        this._mode = 'story';
    }

    init(data) {
        this.playerClass = data.playerClass || 'WARRIOR';
        this.weapon      = data.weapon      || 'SWORD';
        this._mode       = data.mode        || 'story';
        this._scrollOff  = 0;
    }

    create() {
        const { width, height } = this.cameras.main;
        this.createBackground(width, height);
        this.createHeader(width);
        this.createTopStats(width);
        this.createTabBar(width);
        this.createFloorPanel(width, height);
        this.createActionButtons(width, height);
    }

    // ── Background — identical to DashboardScene.createBackground ─────────
    createBackground(width, height) {
        const bg = this.add.graphics();
        bg.fillGradientStyle(C.bgTop, C.bgTop, C.bgBottom, C.bgBottom, 1);
        bg.fillRect(0, 0, width, height);
        for (let i = 0; i < 90; i++) {
            const dot = this.add.circle(
                Phaser.Math.Between(0, width), Phaser.Math.Between(0, height),
                Phaser.Math.Between(1, 2), 0x7dd3fc, Phaser.Math.FloatBetween(0.08, 0.35));
            this.tweens.add({ targets: dot, alpha: Phaser.Math.FloatBetween(0.1, 0.55),
                duration: Phaser.Math.Between(1500, 3600), yoyo: true, repeat: -1 });
        }
    }

    // ── Header — same coords/style as DashboardScene.createHeader ─────────
    createHeader(width) {
        const title = this.add.text(70, 48, 'THE TOWER', {
            fontSize: '38px', fill: C.text, fontStyle: 'bold' });
        const modeLabel = this._mode === 'story' ? 'Story Progression' : 'Endless Ascent';
        this.add.text(72, 95, `${this.playerClass}  ·  ${this.weapon}  —  ${modeLabel}`, {
            fontSize: '18px', fill: C.muted });
        const total    = Object.keys(BOSSES).length;
        const defeated = GameData.defeatedBosses.size;
        this.add.text(width - 300, 58, `⚔  ${defeated} / ${total} Bosses Cleared`, {
            fontSize: '14px', fill: '#d9f99d', backgroundColor: '#365314', padding: { x: 10, y: 5 } });
        this.tweens.add({ targets: title, x: { from: 70, to: 77 }, duration: 2600,
            ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });
    }

    // ── Top stat cards — same layout as DashboardScene.createTopStats ─────
    createTopStats(width) {
        const total    = Object.keys(BOSSES).length;
        const defeated = GameData.defeatedBosses.size;
        const cards = [
            { label: 'Bosses Cleared',  value: `${defeated}/${total}`,                    color: 0x34d399 },
            { label: 'Best Floor',      value: `Floor ${GameData.infiniteBest || 0}`,     color: 0xfbbf24 },
            { label: 'Current Floor',   value: `Floor ${GameData.infiniteFloor || 1}`,    color: 0x22d3ee },
            { label: 'Shadow Crystals', value: `${GameData.coins} 💎`,                    color: 0xa78bfa },
        ];
        const margin = 70, gap = 16;
        const cardW = Math.floor((width - margin * 2 - gap * 3) / 4);
        cards.forEach((card, i) => {
            const x = margin + i * (cardW + gap), y = 140;
            const panel = this.add.rectangle(x, y, cardW, 120, C.panel, 0.92)
                .setOrigin(0).setStrokeStyle(1, card.color, 0.8);
            this.tweens.add({ targets: panel, y: { from: y, to: y - 4 },
                duration: 1700 + i * 220, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });
            this.add.text(x + 16, y + 14, card.label, { fontSize: '15px', fill: C.muted });
            const vt = this.add.text(x + 16, y + 50, card.value, {
                fontSize: card.value.length > 10 ? '18px' : '26px',
                fill: C.text, fontStyle: 'bold', wordWrap: { width: cardW - 30 } });
            this.tweens.add({ targets: vt, alpha: { from: 0.85, to: 1 }, duration: 1300, yoyo: true, repeat: -1 });
        });
    }

    // ── Tab bar — same style as DashboardScene.createTabs ─────────────────
    createTabBar(width) {
        const tabs = [
            { id: 'story',   label: 'STORY' },
            { id: 'endless', label: '∞ ENDLESS' },
        ];
        const tabY = 282, tabW = 148, startX = 70;
        tabs.forEach((tab, i) => {
            const x = startX + i * (tabW + 8);
            const isActive = tab.id === this._mode;
            const bg = this.add.rectangle(x, tabY, tabW, 34, isActive ? 0x1e4a72 : C.panel, 1)
                .setOrigin(0, 0.5)
                .setStrokeStyle(1, isActive ? 0x38bdf8 : 0x2f4a74, 1);
            const txt = this.add.text(x + tabW / 2, tabY, tab.label, {
                fontSize: '13px', fill: isActive ? '#67e8f9' : C.muted,
                fontStyle: isActive ? 'bold' : 'normal'
            }).setOrigin(0.5);
            if (!isActive) {
                bg.setInteractive({ useHandCursor: true });
                txt.setInteractive({ useHandCursor: true });
                const activate = () => {
                    soundManager.playClick();
                    this.scene.restart({ playerClass: this.playerClass, weapon: this.weapon, mode: tab.id });
                };
                bg.on('pointerdown', activate);
                txt.on('pointerdown', activate);
                bg.on('pointerover',  () => { bg.setFillStyle(0x162a45); txt.setStyle({ fill: C.text }); });
                bg.on('pointerout',   () => { bg.setFillStyle(C.panel);  txt.setStyle({ fill: C.muted }); });
            }
        });
    }

    // ── Floor list panel — same container as Dashboard content area ────────
    createFloorPanel(width, height) {
        const panX = 70, panY = 306;
        const panW = width - 140;
        const panH = height - 406;

        // Panel background + border (same as Dashboard)
        this.add.rectangle(panX, panY, panW, panH, C.panel, 0.92)
            .setOrigin(0)
            .setStrokeStyle(1, 0x2f4a74, 0.95);

        // Scrollable container
        const container = this.add.container(0, 0);

        // Geometry mask clips cards to panel area
        const maskGfx = this.add.graphics();
        maskGfx.fillRect(panX + 1, panY + 1, panW - 2, panH - 2);
        container.setMask(maskGfx.createGeometryMask());

        if (this._mode === 'story') {
            this._buildStoryCards(container, panX, panY, panW, panH);
        } else {
            this._buildEndlessCards(container, panX, panY, panW, panH);
        }

        this._setupScroll(container, panY, panH);
    }

    // ── Story floor cards ─────────────────────────────────────────────────
    _buildStoryCards(container, panX, panY, panW, panH) {
        const CARD_H  = 88;
        const CARD_GAP = 6;
        const bossIds  = Object.keys(BOSSES).map(Number).sort((a, b) => b - a);
        const spineX   = panX + 42;
        const PAD      = 12;

        const totalH = bossIds.length * (CARD_H + CARD_GAP) + PAD * 2;
        this._maxScrollY = Math.max(0, totalH - panH);

        // Spine
        const spineG = this.add.graphics();
        spineG.lineStyle(2, 0x1d2d4a, 1);
        spineG.lineBetween(spineX, panY + PAD + 8, spineX, panY + PAD + totalH - CARD_GAP - 8);
        container.add(spineG);

        bossIds.forEach((bossId, idx) => {
            const boss     = BOSSES[bossId];
            const cardY    = panY + PAD + idx * (CARD_H + CARD_GAP);
            const defeated = GameData.isBossDefeated(bossId);
            const unlocked = bossId <= GameData.unlockedBosses;
            const isCurrent = unlocked && !defeated &&
                bossId === Math.min(GameData.currentBossId, GameData.unlockedBosses);

            const objs = this._makeStoryCard(bossId, boss, cardY, panX, panW, CARD_H,
                defeated, unlocked, isCurrent, spineX);
            objs.forEach(o => container.add(o));
        });
    }

    _makeStoryCard(bossId, boss, cardY, panX, panW, CARD_H,
                   defeated, unlocked, isCurrent, spineX) {
        const objs   = [];
        const alpha  = defeated ? 0.42 : unlocked ? 1 : 0.22;
        const colorN = boss.color;
        const glowN  = boss.glowColor;
        const colorS = hexStr(colorN);
        const glowS  = hexStr(glowN);

        // Card bg
        const cardBg = this.add.graphics().setAlpha(alpha);
        cardBg.fillStyle(0x0b1525, 1);
        cardBg.fillRoundedRect(panX + 8, cardY, panW - 16, CARD_H, 5);
        cardBg.fillStyle(colorN, 0.035);
        cardBg.fillRoundedRect(panX + panW * 0.5, cardY, panW * 0.5 - 8, CARD_H,
            { br: 5, tr: 5, tl: 0, bl: 0 });
        cardBg.lineStyle(1, glowN, isCurrent ? 0.65 : unlocked ? 0.18 : 0.07);
        cardBg.strokeRoundedRect(panX + 8, cardY, panW - 16, CARD_H, 5);
        objs.push(cardBg);

        // Left colour stripe
        const stripe = this.add.graphics().setAlpha(alpha);
        stripe.fillStyle(colorN, unlocked ? 0.9 : 0.25);
        stripe.fillRoundedRect(panX + 8, cardY, 4, CARD_H, { tl: 5, bl: 5, tr: 0, br: 0 });
        objs.push(stripe);

        // Glow outline for current floor
        if (isCurrent) {
            const glowRect = this.add.graphics();
            glowRect.lineStyle(2, glowN, 0.5);
            glowRect.strokeRoundedRect(panX + 6, cardY - 2, panW - 12, CARD_H + 4, 6);
            this.tweens.add({ targets: glowRect, alpha: 0.1, duration: 1100, yoyo: true, repeat: -1 });
            objs.push(glowRect);
        }

        // Spine node
        const nodeG = this.add.graphics().setAlpha(alpha);
        nodeG.fillStyle(colorN, unlocked ? 0.85 : 0.2);
        nodeG.fillCircle(spineX, cardY + CARD_H / 2, 5);
        nodeG.lineStyle(1, glowN, unlocked ? 0.9 : 0.3);
        nodeG.strokeCircle(spineX, cardY + CARD_H / 2, 5);
        objs.push(nodeG);

        // Tier badge
        const tierX = panX + 38;
        const tierY = cardY + CARD_H / 2;
        const tierBg = this.add.graphics().setAlpha(alpha);
        tierBg.fillStyle(0x060e1c, 0.95);
        tierBg.fillRoundedRect(tierX - 20, tierY - 13, 40, 26, 4);
        tierBg.lineStyle(1, glowN, unlocked ? 0.45 : 0.1);
        tierBg.strokeRoundedRect(tierX - 20, tierY - 13, 40, 26, 4);
        objs.push(tierBg);

        const tierLabel = this.add.text(tierX, tierY - 3, LORE[bossId]?.tier || String(bossId), {
            fontSize: '12px', fill: unlocked ? glowS : '#2a2a3a', fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(alpha);
        objs.push(tierLabel);
        const floorLabel = this.add.text(tierX, tierY + 10, `F${bossId}`, {
            fontSize: '9px', fill: unlocked ? '#556677' : '#1a1a2a'
        }).setOrigin(0.5).setAlpha(alpha);
        objs.push(floorLabel);

        // Boss orb
        const orbX = panX + 88;
        const orbY = cardY + CARD_H / 2;
        if (unlocked) {
            const orbGlow = this.add.circle(orbX, orbY, 22, glowN, 0.09).setAlpha(alpha);
            const orb = this.add.circle(orbX, orbY, 16, colorN, defeated ? 0.3 : 0.72).setAlpha(alpha);
            orb.setStrokeStyle(2, glowN, 0.8);
            const highlight = this.add.circle(orbX, orbY, 5, 0xffffff, defeated ? 0.25 : 0.8).setAlpha(alpha);
            objs.push(orbGlow, orb, highlight);
            if (isCurrent) {
                this.tweens.add({ targets: orbGlow, scale: 1.5, alpha: 0.03,
                    duration: 900, yoyo: true, repeat: -1 });
            }
        } else {
            const silhouette = this.add.circle(orbX, orbY, 16, 0x0d1020, 0.6)
                .setStrokeStyle(1, 0x1e1e30, 0.5);
            objs.push(silhouette);
        }

        // Boss info
        const infoX = panX + 120;
        const infoY = cardY + CARD_H / 2;
        if (unlocked) {
            const nameT = this.add.text(infoX, infoY - 18, boss.name, {
                fontSize: '16px',
                fill: defeated ? '#5a7070' : '#eef0ff',
                fontStyle: 'bold',
                shadow: isCurrent
                    ? { offsetX: 0, offsetY: 0, color: glowS, blur: 8, fill: true }
                    : undefined
            }).setAlpha(alpha);
            objs.push(nameT);
            const subT = this.add.text(infoX, infoY + 1, LORE[bossId]?.sub || '', {
                fontSize: '11px', fill: defeated ? '#3a5050' : glowS, fontStyle: 'italic'
            }).setAlpha(alpha);
            objs.push(subT);
            const atkT = this.add.text(infoX, infoY + 16, boss.attackType || '—', {
                fontSize: '10px', fill: '#4a6070'
            }).setAlpha(alpha);
            objs.push(atkT);
        } else {
            objs.push(
                this.add.text(infoX, infoY - 12, '? ? ? ? ?', {
                    fontSize: '16px', fill: '#18182a', fontStyle: 'bold' }),
                this.add.text(infoX, infoY + 7, 'Defeat previous boss to unlock', {
                    fontSize: '10px', fill: '#18182a' })
            );
        }

        // HP
        const hpX = panX + panW - 195;
        if (unlocked) {
            const hpVal = this.add.text(hpX, cardY + CARD_H / 2 - 10, `${boss.hp}`, {
                fontSize: '18px', fill: defeated ? '#3a5050' : '#c89030', fontStyle: 'bold'
            }).setOrigin(0, 0.5).setAlpha(alpha);
            const hpLab = this.add.text(hpX, cardY + CARD_H / 2 + 10, 'HP', {
                fontSize: '10px', fill: '#3a5060'
            }).setAlpha(alpha);
            objs.push(hpVal, hpLab);
        }

        // Status badge
        const statX = panX + panW - 70;
        const statY = cardY + CARD_H / 2;
        if (defeated) {
            objs.push(...this._badge(statX, statY, 'CLEARED', 0x34d399, 0x003311));
        } else if (isCurrent) {
            const badge = this._badge(statX, statY, 'ENTER', glowN, 0x001a22);
            this.tweens.add({ targets: badge[0], alpha: { from: 1, to: 0.4 }, duration: 700, yoyo: true, repeat: -1 });
            objs.push(...badge);
        } else if (!unlocked) {
            objs.push(...this._badge(statX, statY, 'LOCKED', 0x334455, 0x080810));
        } else {
            objs.push(...this._badge(statX, statY, 'READY', glowN, boss.secondaryColor || 0x001020));
        }

        // Interactive hit zone
        if (unlocked) {
            const hit = this.add.rectangle(
                panX + 8 + (panW - 16) / 2, cardY + CARD_H / 2, panW - 16, CARD_H, 0xffffff, 0
            ).setInteractive({ useHandCursor: true });
            hit.on('pointerover', () => { cardBg.setAlpha(Math.min(alpha + 0.14, 1)); stripe.setAlpha(1); });
            hit.on('pointerout',  () => { cardBg.setAlpha(alpha); stripe.setAlpha(alpha); });
            hit.on('pointerdown', () => {
                soundManager.playClick();
                this.cameras.main.fade(260, 6, 11, 24);
                this.time.delayedCall(260, () => {
                    this.scene.start('GameScene', {
                        playerConfig: { class: this.playerClass, weapon: this.weapon },
                        bossId
                    });
                });
            });
            objs.push(hit);
        }

        return objs;
    }

    // ── Endless floor cards ───────────────────────────────────────────────
    _buildEndlessCards(container, panX, panY, panW, panH) {
        const CARD_H   = 96;
        const CARD_GAP = 6;
        const VISIBLE  = 12;
        const PAD      = 12;
        const spineX   = panX + 42;

        const currentFloor = GameData.infiniteFloor || 1;
        const totalH = VISIBLE * (CARD_H + CARD_GAP) + PAD * 2;
        this._maxScrollY = Math.max(0, totalH - panH);

        const spineG = this.add.graphics();
        spineG.lineStyle(2, 0x1d2d4a, 1);
        spineG.lineBetween(spineX, panY + PAD + 8, spineX, panY + PAD + totalH - CARD_GAP - 8);
        container.add(spineG);

        // Label above first card
        const lbl = this.add.text(panX + panW / 2, panY + PAD - 4,
            `ASCENDING FROM FLOOR  ${currentFloor}`, {
            fontSize: '11px', fill: '#4a6080', fontStyle: 'italic' }).setOrigin(0.5);
        container.add(lbl);

        for (let i = 0; i < VISIBLE; i++) {
            const floorNum  = currentFloor + i;
            const cardY     = panY + PAD + i * (CARD_H + CARD_GAP);
            const isCurrent = i === 0;
            const objs = this._makeEndlessCard(floorNum, cardY, panX, panW, CARD_H,
                isCurrent, spineX);
            objs.forEach(o => container.add(o));
        }
    }

    _makeEndlessCard(floorNum, cardY, panX, panW, CARD_H, isCurrent, spineX) {
        const objs = [];
        const { bossId, affixes, hpMult } = getEndlessFloor(floorNum);
        const boss    = BOSSES[bossId];
        const colorN  = boss.color;
        const glowN   = boss.glowColor;
        const glowS   = hexStr(glowN);
        const stars   = getFloorStars(floorNum);
        const scaledHp = Math.round(boss.hp * hpMult);

        // Card bg
        const cardBg = this.add.graphics();
        cardBg.fillStyle(0x0b1525, 1);
        cardBg.fillRoundedRect(panX + 8, cardY, panW - 16, CARD_H, 5);
        cardBg.fillStyle(colorN, 0.035);
        cardBg.fillRoundedRect(panX + panW * 0.5, cardY, panW * 0.5 - 8, CARD_H,
            { br: 5, tr: 5, tl: 0, bl: 0 });
        cardBg.lineStyle(1, glowN, isCurrent ? 0.7 : 0.16);
        cardBg.strokeRoundedRect(panX + 8, cardY, panW - 16, CARD_H, 5);
        objs.push(cardBg);

        const stripe = this.add.graphics();
        stripe.fillStyle(colorN, 0.9);
        stripe.fillRoundedRect(panX + 8, cardY, 4, CARD_H, { tl: 5, bl: 5, tr: 0, br: 0 });
        objs.push(stripe);

        if (isCurrent) {
            const gr = this.add.graphics();
            gr.lineStyle(2, glowN, 0.55);
            gr.strokeRoundedRect(panX + 6, cardY - 2, panW - 12, CARD_H + 4, 6);
            this.tweens.add({ targets: gr, alpha: 0.1, duration: 1100, yoyo: true, repeat: -1 });
            objs.push(gr);
        }

        // Spine node
        const nodeG = this.add.graphics();
        nodeG.fillStyle(colorN, 0.85);
        nodeG.fillCircle(spineX, cardY + CARD_H / 2, 5);
        objs.push(nodeG);

        // Floor badge
        const badX = panX + 38;
        const badY = cardY + CARD_H / 2;
        const badG = this.add.graphics();
        badG.fillStyle(0x060e1c, 0.95);
        badG.fillRoundedRect(badX - 20, badY - 14, 40, 28, 4);
        badG.lineStyle(1, glowN, 0.45);
        badG.strokeRoundedRect(badX - 20, badY - 14, 40, 28, 4);
        objs.push(badG);
        objs.push(this.add.text(badX, badY - 3, String(floorNum), {
            fontSize: '13px', fill: glowS, fontStyle: 'bold' }).setOrigin(0.5));

        // Boss orb
        const orbX = panX + 88;
        const orbY = cardY + CARD_H / 2;
        const orbGlow = this.add.circle(orbX, orbY, 24, glowN, 0.08);
        const orb     = this.add.circle(orbX, orbY, 17, colorN, 0.75);
        orb.setStrokeStyle(2, glowN, 0.85);
        objs.push(orbGlow, orb, this.add.circle(orbX, orbY, 5, 0xffffff, 0.85));
        if (isCurrent) {
            this.tweens.add({ targets: orbGlow, scale: 1.5, alpha: 0.03,
                duration: 900, yoyo: true, repeat: -1 });
        }

        // Info
        const infoX = panX + 120;
        const infoY = cardY + CARD_H / 2;
        objs.push(this.add.text(infoX, infoY - 24, boss.name, {
            fontSize: '15px', fill: '#eef0ff', fontStyle: 'bold',
            shadow: isCurrent ? { offsetX: 0, offsetY: 0, color: glowS, blur: 8, fill: true } : undefined
        }));
        const starStr = '★'.repeat(stars) + '☆'.repeat(Math.max(0, 5 - stars));
        objs.push(this.add.text(infoX, infoY - 7, starStr, {
            fontSize: '11px', fill: isCurrent ? '#ffcc44' : '#3a5060' }));

        // Affix pills
        let affX = 0;
        affixes.forEach(key => {
            const aff = AFFIXES[key];
            if (!aff) return;
            const pillW = key.length * 6 + 14;
            const pillX = infoX + affX;
            const pillY = infoY + 9;
            const pillG = this.add.graphics();
            pillG.fillStyle(aff.color, 0.16);
            pillG.fillRoundedRect(pillX, pillY - 8, pillW, 16, 8);
            pillG.lineStyle(1, aff.color, 0.65);
            pillG.strokeRoundedRect(pillX, pillY - 8, pillW, 16, 8);
            objs.push(pillG, this.add.text(pillX + pillW / 2, pillY, key, {
                fontSize: '9px', fill: aff.textColor, fontStyle: 'bold'
            }).setOrigin(0.5));
            affX += pillW + 5;
        });

        // HP
        const hpX = panX + panW - 195;
        objs.push(
            this.add.text(hpX, cardY + CARD_H / 2 - 9, `${scaledHp}`, {
                fontSize: '17px', fill: '#c89030', fontStyle: 'bold' }).setOrigin(0, 0.5),
            this.add.text(hpX, cardY + CARD_H / 2 + 11, 'HP', {
                fontSize: '10px', fill: '#3a5060' })
        );

        // Status badge
        const statX = panX + panW - 70;
        const statY = cardY + CARD_H / 2;
        if (!isCurrent) {
            objs.push(...this._badge(statX, statY, 'NEXT', glowN, boss.secondaryColor || 0x001020));
        } else {
            const badge = this._badge(statX, statY, 'FIGHT', glowN, 0x001a22);
            this.tweens.add({ targets: badge[0], alpha: { from: 1, to: 0.4 }, duration: 700, yoyo: true, repeat: -1 });
            objs.push(...badge);
        }

        // Only current floor is clickable
        if (isCurrent) {
            const hit = this.add.rectangle(
                panX + 8 + (panW - 16) / 2, cardY + CARD_H / 2, panW - 16, CARD_H, 0xffffff, 0
            ).setInteractive({ useHandCursor: true });
            hit.on('pointerover', () => cardBg.setAlpha(1.14));
            hit.on('pointerout',  () => cardBg.setAlpha(1));
            hit.on('pointerdown', () => {
                soundManager.playClick();
                this.cameras.main.fade(500, 0, 0, 0);
                this.time.delayedCall(500, () => {
                    GameData.infiniteFloor = floorNum;
                    if ((GameData.infiniteBest || 0) < floorNum) GameData.infiniteBest = floorNum;
                    GameData.saveProgress();
                    this.scene.start('GameScene', {
                        playerConfig: { class: this.playerClass, weapon: this.weapon },
                        bossId, affixes, scaledHp, infiniteFloor: floorNum
                    });
                });
            });
            objs.push(hit);
        }

        return objs;
    }

    // ── Pill-shaped status badge ───────────────────────────────────────────
    _badge(cx, cy, label, borderColor, fillColor) {
        const pillW = label.length * 7 + 20;
        const g = this.add.graphics();
        g.fillStyle(fillColor, 0.7);
        g.fillRoundedRect(cx - pillW / 2, cy - 11, pillW, 22, 11);
        g.lineStyle(1, borderColor, 0.85);
        g.strokeRoundedRect(cx - pillW / 2, cy - 11, pillW, 22, 11);
        const t = this.add.text(cx, cy, label, {
            fontSize: '11px', fill: hexStr(borderColor), fontStyle: 'bold'
        }).setOrigin(0.5);
        return [g, t];
    }

    // ── Wheel + drag scroll for the container ─────────────────────────────
    _setupScroll(container, panY, panH) {
        this._scrollY = 0;
        this._maxScrollY = this._maxScrollY || 0;
        const clamp = v => Phaser.Math.Clamp(v, 0, this._maxScrollY);
        const apply = () => { container.y = -this._scrollY; };

        this.input.on('wheel', (pointer, _obj, _dx, dy) => {
            this._scrollY = clamp(this._scrollY + dy * 0.55);
            apply();
        });

        let dragging = false, startY = 0, startScroll = 0;
        this.input.on('pointerdown', p => {
            if (p.y >= panY && p.y <= panY + panH) {
                dragging = true; startY = p.y; startScroll = this._scrollY;
            }
        });
        this.input.on('pointermove', p => {
            if (dragging && p.isDown) {
                this._scrollY = clamp(startScroll + (startY - p.y));
                apply();
            }
        });
        this.input.on('pointerup', () => { dragging = false; });
    }

    // ── Action buttons — identical style to DashboardScene ────────────────
    createActionButtons(width, height) {
        const backBtn = this.createButton(180, height - 50, '← BACK', () => {
            soundManager.playClick();
            this.scene.start('WeaponSelectScene', { playerClass: this.playerClass });
        });
        this.add.text(width / 2, height - 50,
            `${this.playerClass}  ·  ${this.weapon}`, {
            fontSize: '16px', fill: C.muted
        }).setOrigin(0.5);

        backBtn.on('pointerover', () => {
            soundManager.playHover();
            backBtn.setScale(1.03);
            backBtn.setStyle({ backgroundColor: '#0ea5e9', fill: '#041322' });
        });
        backBtn.on('pointerout', () => {
            backBtn.setScale(1);
            backBtn.setStyle({ backgroundColor: '#1a2b4f', fill: '#f8fbff' });
        });
    }

    createButton(x, y, label, onClick) {
        const btn = this.add.text(x, y, label, {
            fontSize: '20px', fill: '#f8fbff', backgroundColor: '#1a2b4f',
            padding: { x: 18, y: 10 }, stroke: '#38bdf8', strokeThickness: 1
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        btn.on('pointerdown', onClick);
        this.tweens.add({ targets: btn, alpha: { from: 0.85, to: 1 }, duration: 1200, yoyo: true, repeat: -1 });
        return btn;
    }
}
