// TowerScene.js — Shadow Knights Tower: Story + Endless modes
import { BOSSES } from '../data/BossData.js';
import { GameData } from '../data/GameData.js';
import { AFFIXES, getEndlessFloor, getFloorStars } from '../data/AffixData.js';

// ─── Lore subtitles for each of the 10 story bosses ───────────────────────
const LORE = {
    1:  { sub: 'The Iron Gate',       tier: 'I'   },
    2:  { sub: 'The Firing Range',    tier: 'II'  },
    3:  { sub: 'The Wind Corridor',   tier: 'III' },
    4:  { sub: 'The Echo Chamber',    tier: 'IV'  },
    5:  { sub: 'The Starfall Sanctum',tier: 'V'   },
    6:  { sub: 'The Clockwork Spire', tier: 'VI'  },
    7:  { sub: 'The Singularity Well',tier: 'VII' },
    8:  { sub: 'The Molten Throne',   tier: 'VIII'},
    9:  { sub: 'The Prismatic Court', tier: 'IX'  },
    10: { sub: 'The Eternal Summit',  tier: 'X'   },
};

// Colour helpers
const hexStr = n => '#' + n.toString(16).padStart(6, '0');

export class TowerScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TowerScene' });
    }

    init(data) {
        this.playerClass = data.playerClass || 'WARRIOR';
        this.weapon      = data.weapon      || 'SWORD';
        this.mode        = data.mode        || 'story'; // 'story' | 'endless'
    }

    create() {
        this.w = this.cameras.main.width;
        this.h = this.cameras.main.height;
        this._buildScene();
    }

    // ═══════════════════════════════════════════════════════════════════════
    _buildScene() {
        const { w, h } = this;

        // Destroy all existing objects (for tab-switching without scene restart)
        this.children.list.slice().forEach(c => c.destroy());
        this.tweens.killAll();

        // ── 1. Background ─────────────────────────────────────────────────
        this._drawBackground();

        // ── 2. Fixed header (tabs + back + info) ──────────────────────────
        this._drawHeader();

        // ── 3. Floor list (scrollable) ────────────────────────────────────
        if (this.mode === 'story') {
            this._buildStoryFloors();
        } else {
            this._buildEndlessFloors();
        }

        // ── 4. Fixed footer (progress / info) ─────────────────────────────
        this._drawFooter();
    }

    // ═══════════════════════════════════════════════════════════════════════
    _drawBackground() {
        const { w, h } = this;

        // Full-page gradient fill matching Dashboard theme
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x050915, 0x050915, 0x0d1628, 0x0d1628, 1);
        bg.fillRect(0, 0, w, h * 6); // oversized so it covers any scroll

        // Subtle radial atmosphere
        const atmo = this.add.circle(w / 2, h * 0.4, w * 0.6, 0x0a132a, 0.3);

        // Twinkling stars (behind everything, scrolls with world)
        for (let i = 0; i < 90; i++) {
            const sx = Phaser.Math.Between(0, w);
            const sy = Phaser.Math.Between(60, h * 5.5);
            const sz = Phaser.Math.FloatBetween(0.4, 1.8);
            const star = this.add.circle(sx, sy, sz, 0xffffff,
                Phaser.Math.FloatBetween(0.05, 0.22)).setDepth(0);
            this.tweens.add({
                targets: star,
                alpha: Phaser.Math.FloatBetween(0.01, 0.08),
                duration: Phaser.Math.Between(1200, 3500),
                yoyo: true, repeat: -1
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    _drawHeader() {
        const { w } = this;
        const HEADER_H = 64;

        // Header bar — matching Dashboard palette
        const hdr = this.add.graphics().setScrollFactor(0).setDepth(300);
        hdr.fillStyle(0x080f1e, 0.98);
        hdr.fillRect(0, 0, w, HEADER_H);
        hdr.lineStyle(1, 0x29446f, 0.85);
        hdr.lineBetween(0, HEADER_H, w, HEADER_H);

        // Scanline accent
        const scan = this.add.rectangle(w / 2, HEADER_H / 2, w, 2, 0x38bdf8, 0.06)
            .setScrollFactor(0).setDepth(300);
        this.tweens.add({ targets: scan, alpha: { from: 0.02, to: 0.13 },
            duration: 2600, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });

        // Back button
        const back = this.add.text(18, HEADER_H / 2, '‹  BACK', {
            fontSize: '15px', fill: '#8fa7cf', fontStyle: 'bold',
            backgroundColor: '#0d1a2e', padding: { x: 10, y: 5 }
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(301).setInteractive({ useHandCursor: true });
        back.on('pointerover', () => back.setStyle({ fill: '#67e8f9' }));
        back.on('pointerout',  () => back.setStyle({ fill: '#8fa7cf' }));
        back.on('pointerdown', () => {
            this.scene.start('WeaponSelectScene', { playerClass: this.playerClass });
        });

        // Title
        this.add.text(w / 2, HEADER_H / 2, 'THE TOWER', {
            fontSize: '20px', fill: '#ecf4ff', fontStyle: 'bold',
            stroke: '#22d3ee', strokeThickness: 1
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

        // ── Tabs ──
        const TAB_Y = HEADER_H / 2;
        const tabRx = w - 20;

        const makeTab = (label, modeKey, rx) => {
            const active = this.mode === modeKey;
            const txt = this.add.text(rx, TAB_Y, label, {
                fontSize: '14px',
                fill: active ? '#ecf4ff' : '#6e86ad',
                fontStyle: active ? 'bold' : 'normal'
            }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(301).setInteractive({ useHandCursor: true });

            if (active) {
                // Underline
                const ul = this.add.graphics().setScrollFactor(0).setDepth(301);
                ul.lineStyle(2, 0x67e8f9, 1);
                ul.lineBetween(txt.x - txt.width, TAB_Y + 12, txt.x, TAB_Y + 12);
            }

            txt.on('pointerover', () => { if (!active) txt.setStyle({ fill: '#8fa7cf' }); });
            txt.on('pointerout',  () => { if (!active) txt.setStyle({ fill: '#6e86ad' }); });
            txt.on('pointerdown', () => {
                if (!active) {
                    this.mode = modeKey;
                    this._buildScene();
                }
            });
            return txt;
        };

        const endlessTab = makeTab('ENDLESS', 'endless', tabRx);
        makeTab('STORY', 'story', tabRx - endlessTab.width - 22);

        // Separator between tabs
        const sepG = this.add.graphics().setScrollFactor(0).setDepth(301);
        sepG.lineStyle(1, 0x29446f, 0.6);
        sepG.lineBetween(tabRx - endlessTab.width - 14, TAB_Y - 10, tabRx - endlessTab.width - 14, TAB_Y + 10);
    }

    // ═══════════════════════════════════════════════════════════════════════
    _drawFooter() {
        const { w, h } = this;

        // Bottom gradient fade — matching Dashboard bgBottom
        const fade = this.add.graphics().setScrollFactor(0).setDepth(299);
        for (let i = 0; i < 50; i++) {
            fade.fillStyle(0x0d1628, i / 50);
            fade.fillRect(0, h - 50 + i - 50, w, 1);
        }
        fade.fillStyle(0x0d1628, 0.97);
        fade.fillRect(0, h - 50, w, 50);

        // Footer line
        fade.lineStyle(1, 0x29446f, 0.6);
        fade.lineBetween(0, h - 50, w, h - 50);

        if (this.mode === 'story') {
            const total    = Object.keys(BOSSES).length;
            const defeated = GameData.defeatedBosses.size;

            this.add.text(w / 2, h - 32, `${defeated} / ${total}  CLEARED`, {
                fontSize: '13px', fill: '#6e86ad'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(300);

            // Progress bar
            const bw = Math.min(w * 0.4, 320);
            const bx = w / 2 - bw / 2;
            const by = h - 14;
            const barG = this.add.graphics().setScrollFactor(0).setDepth(300);
            barG.fillStyle(0x111128, 1);
            barG.fillRoundedRect(bx, by, bw, 4, 2);
            if (defeated > 0) {
                barG.fillStyle(0x00d4ff, 0.8);
                barG.fillRoundedRect(bx, by, bw * (defeated / total), 4, 2);
            }
        } else {
            const floor = GameData.infiniteFloor || 1;
            const best  = GameData.infiniteBest  || 0;
            this.add.text(w / 2, h - 28, `CURRENT FLOOR  ${floor}   ·   BEST  ${best}`, {
                fontSize: '13px', fill: '#6e86ad'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(300);
        }

        // Class · weapon info
        this.add.text(w - 16, h - 28, `${this.playerClass} · ${this.weapon}`, {
            fontSize: '11px', fill: '#4a6080'
        }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(300);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STORY MODE
    // ═══════════════════════════════════════════════════════════════════════
    _buildStoryFloors() {
        const { w, h } = this;

        const CARD_H   = 112;
        const CARD_GAP = 8;
        const CARD_W   = Math.min(w - 80, 820);
        const CARD_X   = w / 2 - CARD_W / 2;
        const PAD_TOP  = 90;
        const PAD_BOT  = 70;

        const bossIds   = Object.keys(BOSSES).map(Number).sort((a, b) => b - a); // floor 10 → floor 1
        const totalH    = PAD_TOP + bossIds.length * (CARD_H + CARD_GAP) + PAD_BOT;

        this.cameras.main.setBounds(0, 0, w, Math.max(totalH, h));

        // ── Vertical spine line ──────────────────────────────────────────
        const spineX  = CARD_X + 50;
        const spineY0 = PAD_TOP + 10;
        const spineY1 = PAD_TOP + bossIds.length * (CARD_H + CARD_GAP) - CARD_GAP;
        const spineG  = this.add.graphics().setDepth(5);
        spineG.lineStyle(2, 0x1d2d4a, 1);
        spineG.lineBetween(spineX, spineY0, spineX, spineY1);

        // ── Build each card ──────────────────────────────────────────────
        let scrollTarget = null;

        bossIds.forEach((bossId, idx) => {
            const bossData = BOSSES[bossId];
            const cardY    = PAD_TOP + idx * (CARD_H + CARD_GAP);
            const defeated = GameData.isBossDefeated(bossId);
            const unlocked = bossId <= GameData.unlockedBosses;
            const isCurrent = unlocked && !defeated &&
                bossId === Math.min(GameData.currentBossId, GameData.unlockedBosses);

            if (isCurrent) scrollTarget = cardY;

            this._drawStoryCard({
                bossId, bossData, cardY, cardX: CARD_X, cardW: CARD_W, cardH: CARD_H,
                defeated, unlocked, isCurrent, spineX
            });
        });

        // ── Auto-scroll to current floor ──────────────────────────────────
        this.cameras.main.scrollY = 0;
        if (scrollTarget !== null) {
            const ideal = scrollTarget - h / 2 + CARD_H / 2;
            this.cameras.main.scrollY = Phaser.Math.Clamp(ideal, 0, Math.max(0, totalH - h));
        }

        this._setupScroll(totalH);
    }

    _drawStoryCard({ bossId, bossData, cardY, cardX, cardW, cardH,
                     defeated, unlocked, isCurrent, spineX }) {
        const w = this.w;
        const colorNum  = bossData.color;
        const glowNum   = bossData.glowColor;
        const colorS    = hexStr(colorNum);
        const glowS     = hexStr(glowNum);

        const alpha = defeated ? 0.38 : unlocked ? 1 : 0.25;

        // ── Card background ──────────────────────────────────────────────
        const cardBg = this.add.graphics().setDepth(10).setAlpha(alpha);
        // Main dark fill
        cardBg.fillStyle(0x0d1628, 1);
        cardBg.fillRoundedRect(cardX, cardY, cardW, cardH, 6);
        // Tinted right half
        cardBg.fillStyle(colorNum, 0.04);
        cardBg.fillRoundedRect(cardX + cardW * 0.5, cardY, cardW * 0.5, cardH, { br: 6, tr: 6, tl: 0, bl: 0 });
        // Border
        cardBg.lineStyle(1, glowNum, isCurrent ? 0.7 : unlocked ? 0.22 : 0.1);
        cardBg.strokeRoundedRect(cardX, cardY, cardW, cardH, 6);

        // ── Left colour stripe ───────────────────────────────────────────
        const stripe = this.add.graphics().setDepth(11).setAlpha(alpha);
        stripe.fillStyle(colorNum, unlocked ? 0.9 : 0.3);
        stripe.fillRoundedRect(cardX, cardY, 4, cardH, { tl: 6, bl: 6, tr: 0, br: 0 });

        // ── Animated glow for current floor ──────────────────────────────
        if (isCurrent) {
            const glowRect = this.add.graphics().setDepth(9);
            glowRect.lineStyle(3, glowNum, 0.55);
            glowRect.strokeRoundedRect(cardX - 2, cardY - 2, cardW + 4, cardH + 4, 7);
            this.tweens.add({
                targets: glowRect, alpha: 0.12,
                duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
            });
        }

        // ── Spine node (circle on the left spine line) ───────────────────
        const nodeY = cardY + cardH / 2;
        const nodeG = this.add.graphics().setDepth(12).setAlpha(alpha);
        nodeG.fillStyle(colorNum, unlocked ? 0.85 : 0.2);
        nodeG.fillCircle(spineX, nodeY, 5);
        nodeG.lineStyle(1, glowNum, unlocked ? 0.9 : 0.3);
        nodeG.strokeCircle(spineX, nodeY, 5);

        // ── Roman tier badge ─────────────────────────────────────────────
        const tierX  = cardX + 36;
        const tierY  = cardY + cardH / 2;
        const tierBg = this.add.graphics().setDepth(12).setAlpha(alpha);
        tierBg.fillStyle(0x060e1c, 0.95);
        tierBg.fillRoundedRect(tierX - 22, tierY - 14, 44, 28, 5);
        tierBg.lineStyle(1, glowNum, unlocked ? 0.5 : 0.15);
        tierBg.strokeRoundedRect(tierX - 22, tierY - 14, 44, 28, 5);

        this.add.text(tierX, tierY - 2, LORE[bossId]?.tier || String(bossId), {
            fontSize: '13px', fill: unlocked ? glowS : '#333344',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(13).setAlpha(alpha);

        this.add.text(tierX, tierY + 12, `F${bossId}`, {
            fontSize: '9px', fill: unlocked ? '#667788' : '#222233'
        }).setOrigin(0.5).setDepth(13).setAlpha(alpha);

        // ── Boss orb ─────────────────────────────────────────────────────
        const orbX = cardX + 98;
        const orbY = cardY + cardH / 2;

        if (unlocked) {
            const orbGlow = this.add.circle(orbX, orbY, 26, glowNum, 0.10)
                .setDepth(11).setAlpha(alpha);
            const orb = this.add.circle(orbX, orbY, 20, colorNum, defeated ? 0.35 : 0.75)
                .setDepth(12).setAlpha(alpha);
            orb.setStrokeStyle(2, glowNum, 0.85);
            this.add.circle(orbX, orbY, 6, 0xffffff, defeated ? 0.3 : 0.85)
                .setDepth(13).setAlpha(alpha);

            if (isCurrent) {
                this.tweens.add({
                    targets: orbGlow, scale: 1.5, alpha: 0.04,
                    duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                });
            }
        } else {
            // Locked orb silhouette
            this.add.circle(orbX, orbY, 20, 0x111122, 0.6)
                .setStrokeStyle(1, 0x222233, 0.5).setDepth(12);
            this._drawLock(orbX, orbY - 2, 0x222233, 0.7);
        }

        // ── Boss info text ───────────────────────────────────────────────
        const infoX = cardX + 138;
        const infoY = cardY + cardH / 2;

        if (unlocked) {
            // Boss name
            this.add.text(infoX, infoY - 22, bossData.name, {
                fontSize: '18px', fill: defeated ? '#667788' : '#eef0ff',
                fontStyle: 'bold',
                shadow: isCurrent
                    ? { offsetX: 0, offsetY: 0, color: glowS, blur: 10, fill: true }
                    : undefined
            }).setDepth(13).setAlpha(alpha);

            // Subtitle
            this.add.text(infoX, infoY - 1, LORE[bossId]?.sub || '', {
                fontSize: '12px', fill: defeated ? '#445566' : glowS,
                fontStyle: 'italic'
            }).setDepth(13).setAlpha(alpha);

            // Attack type chip
            const atkText = this.add.text(infoX, infoY + 17, bossData.attackType, {
                fontSize: '10px', fill: '#556677'
            }).setDepth(13).setAlpha(alpha);
        } else {
            // Mystery name
            this.add.text(infoX, infoY - 14, '? ? ? ? ?', {
                fontSize: '18px', fill: '#1e1e2e', fontStyle: 'bold'
            }).setDepth(13);
            this.add.text(infoX, infoY + 6, 'Defeat previous boss to unlock', {
                fontSize: '10px', fill: '#1e1e2e'
            }).setDepth(13);
        }

        // ── HP display ───────────────────────────────────────────────────
        const hpX = cardX + cardW - 210;
        const hpY = cardY + cardH / 2;
        if (unlocked) {
            this.add.text(hpX, hpY - 8, `${bossData.hp}`, {
                fontSize: '20px', fill: defeated ? '#445555' : '#cc9944',
                fontStyle: 'bold'
            }).setOrigin(0, 0.5).setDepth(13).setAlpha(alpha);
            this.add.text(hpX, hpY + 12, 'HP', {
                fontSize: '10px', fill: '#445566'
            }).setDepth(13).setAlpha(alpha);
        }

        // ── Status badge (right) ─────────────────────────────────────────
        const statX = cardX + cardW - 80;
        const statY = cardY + cardH / 2;

        if (defeated) {
            this._drawBadge(statX, statY, 'CLEARED', 0x00ff88, 0x003311, 11);
        } else if (isCurrent) {
            const badge = this._drawBadge(statX, statY, 'ENTER', 0x00d4ff, 0x001a22, 11);
            this.tweens.add({
                targets: badge, alpha: 0.5,
                duration: 700, yoyo: true, repeat: -1
            });
        } else if (!unlocked) {
            this._drawBadge(statX, statY, 'LOCKED', 0x334455, 0x0a0a14, 11);
        } else {
            this._drawBadge(statX, statY, 'READY', glowNum, bossData.secondaryColor, 11);
        }

        // ── Interactivity ────────────────────────────────────────────────
        if (!unlocked) return;

        const hit = this.add.rectangle(
            cardX + cardW / 2, cardY + cardH / 2, cardW, cardH, 0xffffff, 0
        ).setDepth(20).setInteractive({ useHandCursor: true });

        hit.on('pointerover', () => {
            cardBg.setAlpha(Math.min(alpha + 0.12, 1));
            stripe.setAlpha(1);
        });
        hit.on('pointerout', () => {
            cardBg.setAlpha(alpha);
            stripe.setAlpha(alpha);
        });
        hit.on('pointerdown', () => this._launchBoss(bossId));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ENDLESS MODE
    // ═══════════════════════════════════════════════════════════════════════
    _buildEndlessFloors() {
        const { w, h } = this;

        const CARD_H   = 120;
        const CARD_GAP = 8;
        const CARD_W   = Math.min(w - 80, 820);
        const CARD_X   = w / 2 - CARD_W / 2;
        const PAD_TOP  = 90;
        const PAD_BOT  = 70;
        const VISIBLE  = 15; // floors to show

        const currentFloor = GameData.infiniteFloor || 1;
        // Show currentFloor at top, going down from there
        const startFloor = currentFloor;

        const totalH = PAD_TOP + VISIBLE * (CARD_H + CARD_GAP) + PAD_BOT;
        this.cameras.main.setBounds(0, 0, w, Math.max(totalH, h));

        // Endless header notice
        this.add.text(w / 2, PAD_TOP - 28, `ASCENDING FROM FLOOR  ${currentFloor}`, {
            fontSize: '12px', fill: '#4a6080', fontStyle: 'italic'
        }).setOrigin(0.5).setDepth(5);

        const spineX = CARD_X + 50;
        const spineY0 = PAD_TOP + 10;
        const spineY1 = PAD_TOP + VISIBLE * (CARD_H + CARD_GAP);
        const spineG = this.add.graphics().setDepth(5);
        spineG.lineStyle(2, 0x1d2d4a, 1);
        spineG.lineBetween(spineX, spineY0, spineX, spineY1);

        for (let i = 0; i < VISIBLE; i++) {
            const floorNum = startFloor + i;
            const cardY    = PAD_TOP + i * (CARD_H + CARD_GAP);
            const isCurrent = i === 0;
            const isCleared = floorNum < currentFloor; // already beaten

            this._drawEndlessCard({
                floorNum, cardY, cardX: CARD_X, cardW: CARD_W, cardH: CARD_H,
                isCurrent, isCleared, spineX
            });
        }

        this._setupScroll(totalH);
    }

    _drawEndlessCard({ floorNum, cardY, cardX, cardW, cardH, isCurrent, isCleared, spineX }) {
        const { bossId, affixes, hpMult } = getEndlessFloor(floorNum);
        const bossData = BOSSES[bossId];
        const stars    = getFloorStars(floorNum);

        const colorNum = bossData.color;
        const glowNum  = bossData.glowColor;
        const glowS    = hexStr(glowNum);
        const alpha    = isCleared ? 0.38 : 1;

        // Card BG
        const cardBg = this.add.graphics().setDepth(10).setAlpha(alpha);
        cardBg.fillStyle(0x0d1628, 1);
        cardBg.fillRoundedRect(cardX, cardY, cardW, cardH, 6);
        cardBg.fillStyle(colorNum, 0.05);
        cardBg.fillRoundedRect(cardX + cardW * 0.5, cardY, cardW * 0.5, cardH,
            { br: 6, tr: 6, tl: 0, bl: 0 });
        cardBg.lineStyle(1, glowNum, isCurrent ? 0.8 : 0.20);
        cardBg.strokeRoundedRect(cardX, cardY, cardW, cardH, 6);

        // Left stripe
        const stripe = this.add.graphics().setDepth(11).setAlpha(alpha);
        stripe.fillStyle(colorNum, 0.9);
        stripe.fillRoundedRect(cardX, cardY, 4, cardH, { tl: 6, bl: 6, tr: 0, br: 0 });

        // Glow for current floor
        if (isCurrent) {
            const gr = this.add.graphics().setDepth(9);
            gr.lineStyle(3, glowNum, 0.6);
            gr.strokeRoundedRect(cardX - 2, cardY - 2, cardW + 4, cardH + 4, 7);
            this.tweens.add({ targets: gr, alpha: 0.1, duration: 1100, yoyo: true, repeat: -1 });
        }

        // Spine node
        const nodeY = cardY + cardH / 2;
        const nodeG = this.add.graphics().setDepth(12).setAlpha(alpha);
        nodeG.fillStyle(colorNum, 0.8);
        nodeG.fillCircle(spineX, nodeY, 5);

        // Floor number badge
        const badX = cardX + 36;
        const badY = cardY + cardH / 2;
        const badG = this.add.graphics().setDepth(12).setAlpha(alpha);
        badG.fillStyle(0x060e1c, 0.95);
        badG.fillRoundedRect(badX - 22, badY - 14, 44, 28, 5);
        badG.lineStyle(1, glowNum, 0.4);
        badG.strokeRoundedRect(badX - 22, badY - 14, 44, 28, 5);
        this.add.text(badX, badY - 2, String(floorNum), {
            fontSize: '14px', fill: glowS, fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(13).setAlpha(alpha);

        // Boss orb
        const orbX = cardX + 98;
        const orbY = cardY + cardH / 2;
        this.add.circle(orbX, orbY, 28, glowNum, 0.08).setDepth(11).setAlpha(alpha);
        const orb = this.add.circle(orbX, orbY, 20, colorNum, 0.75)
            .setDepth(12).setAlpha(alpha);
        orb.setStrokeStyle(2, glowNum, 0.85);
        this.add.circle(orbX, orbY, 6, 0xffffff, 0.85).setDepth(13).setAlpha(alpha);

        // Boss name + subtitle
        const infoX = cardX + 138;
        const infoY = cardY + cardH / 2;

        this.add.text(infoX, infoY - 28, bossData.name, {
            fontSize: '17px', fill: isCleared ? '#667788' : '#eef0ff', fontStyle: 'bold',
            shadow: isCurrent ? { offsetX: 0, offsetY: 0, color: glowS, blur: 10, fill: true } : undefined
        }).setDepth(13).setAlpha(alpha);

        // Stars
        const starStr = '★'.repeat(stars) + '☆'.repeat(Math.max(0, 5 - stars));
        this.add.text(infoX, infoY - 9, starStr, {
            fontSize: '11px', fill: isCurrent ? '#ffcc44' : '#445566'
        }).setDepth(13).setAlpha(alpha);

        // Affix badges (small coloured pills)
        let affixOffsetX = 0;
        affixes.forEach(key => {
            const aff = AFFIXES[key];
            if (!aff) return;
            const pillW = key.length * 6.5 + 14;
            const pillX = infoX + affixOffsetX;
            const pillY = infoY + 10;

            const pillG = this.add.graphics().setDepth(13).setAlpha(alpha);
            pillG.fillStyle(aff.color, 0.18);
            pillG.fillRoundedRect(pillX, pillY - 8, pillW, 16, 8);
            pillG.lineStyle(1, aff.color, 0.7);
            pillG.strokeRoundedRect(pillX, pillY - 8, pillW, 16, 8);

            this.add.text(pillX + pillW / 2, pillY, key, {
                fontSize: '9px', fill: aff.textColor, fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(14).setAlpha(alpha);

            affixOffsetX += pillW + 6;
        });

        // HP (scaled by tier)
        const scaledHp = Math.round(bossData.hp * hpMult);
        const hpX = cardX + cardW - 210;
        const hpY = cardY + cardH / 2;
        this.add.text(hpX, hpY - 8, `${scaledHp}`, {
            fontSize: '19px', fill: '#cc9944', fontStyle: 'bold'
        }).setOrigin(0, 0.5).setDepth(13).setAlpha(alpha);
        this.add.text(hpX, hpY + 12, 'HP', { fontSize: '10px', fill: '#445566' })
            .setDepth(13).setAlpha(alpha);

        // Status badge
        const statX = cardX + cardW - 80;
        const statY = cardY + cardH / 2;
        if (isCleared) {
            this._drawBadge(statX, statY, 'CLEARED', 0x00ff88, 0x003311, 11);
        } else if (isCurrent) {
            const b = this._drawBadge(statX, statY, 'FIGHT', 0x00d4ff, 0x001a22, 11);
            this.tweens.add({ targets: b, alpha: 0.5, duration: 700, yoyo: true, repeat: -1 });
        } else {
            this._drawBadge(statX, statY, 'NEXT', glowNum, bossData.secondaryColor, 11);
        }

        // Interactivity (only current floor is clickable)
        if (!isCurrent || isCleared) return;

        const hit = this.add.rectangle(
            cardX + cardW / 2, cardY + cardH / 2, cardW, cardH, 0xffffff, 0
        ).setDepth(20).setInteractive({ useHandCursor: true });

        hit.on('pointerover', () => cardBg.setAlpha(Math.min(alpha + 0.12, 1)));
        hit.on('pointerout',  () => cardBg.setAlpha(alpha));
        hit.on('pointerdown', () => {
            this._launchBoss(bossId, affixes, scaledHp, floorNum);
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Helpers
    // ═══════════════════════════════════════════════════════════════════════

    /** Draws a pill-shaped status badge, returns the container for tween targeting */
    _drawBadge(cx, cy, label, borderColor, fillColor, depth) {
        const pillW = label.length * 7 + 20;
        const g = this.add.graphics().setDepth(depth);
        g.fillStyle(fillColor, 0.7);
        g.fillRoundedRect(cx - pillW / 2, cy - 11, pillW, 22, 11);
        g.lineStyle(1, borderColor, 0.85);
        g.strokeRoundedRect(cx - pillW / 2, cy - 11, pillW, 22, 11);
        const t = this.add.text(cx, cy, label, {
            fontSize: '11px',
            fill: hexStr(borderColor),
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(depth + 1);
        // Return a container-like object for tweening (tween the graphics)
        return g;
    }

    /** Draws a small lock icon centred on (cx,cy) */
    _drawLock(cx, cy, color, alpha) {
        const g = this.add.graphics().setDepth(14).setAlpha(alpha);
        g.fillStyle(color, 0.6);
        g.fillRoundedRect(cx - 9, cy, 18, 14, 3);
        g.lineStyle(2.5, color, 0.8);
        g.beginPath();
        g.arc(cx, cy, 7, Math.PI, 0, false);
        g.strokePath();
    }

    /** Launch a boss fight */
    _launchBoss(bossId, affixes = [], scaledHp = null, infiniteFloor = null) {
        this.cameras.main.fade(500, 0, 0, 0);
        this.time.delayedCall(500, () => {
            if (infiniteFloor !== null) {
                GameData.infiniteFloor = infiniteFloor;
                if ((GameData.infiniteBest || 0) < infiniteFloor) {
                    GameData.infiniteBest = infiniteFloor;
                }
                GameData.saveProgress();
            }
            this.scene.start('GameScene', {
                playerConfig: { class: this.playerClass, weapon: this.weapon },
                bossId,
                affixes,
                scaledHp,
                infiniteFloor
            });
        });
    }

    /** Unified mouse-wheel + drag scroll setup */
    _setupScroll(totalH) {
        const h = this.h;
        const maxScroll = Math.max(0, totalH - h);

        this.input.on('wheel', (pointer, objects, dx, dy) => {
            this.cameras.main.scrollY = Phaser.Math.Clamp(
                this.cameras.main.scrollY + dy * 0.5, 0, maxScroll
            );
        });

        let dragging = false, startY = 0, startScroll = 0;
        this.input.on('pointerdown', p => { dragging = true; startY = p.y; startScroll = this.cameras.main.scrollY; });
        this.input.on('pointermove', p => {
            if (dragging && p.isDown) {
                this.cameras.main.scrollY = Phaser.Math.Clamp(
                    startScroll + (startY - p.y), 0, maxScroll
                );
            }
        });
        this.input.on('pointerup', () => { dragging = false; });
    }
}
