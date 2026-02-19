// DashboardScene.js - Player hub: Bosses, Stats, Achievements, Shop, Save Code
import { GameData } from '../data/GameData.js';
import { BOSSES } from '../data/BossData.js';
import { ACHIEVEMENTS, RARITY_COLORS } from '../data/AchievementData.js';
import { SHOP_CATEGORIES, SHOP_UPGRADES, ALL_UPGRADES } from '../data/ShopData.js';
import { exportSaveCode, importSaveCode } from '../data/SaveCodeManager.js';
import { soundManager } from '../utils/SoundManager.js';

const C = {
    bgTop: 0x060b18, bgBottom: 0x131f38,
    panel: 0x101d35, panelBorder: 0x2f4a74,
    accent: '#67e8f9', text: '#ecf4ff', muted: '#8ea6cc'
};

export class DashboardScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DashboardScene' });
        this._activeTab = 'bosses';
    }

    create() {
        const { width, height } = this.cameras.main;
        this.createBackground(width, height);
        this.createHeader(width);
        this.createTopStats(width);
        this.createTabs(width);
        this._contentGroup = [];
        this._domElements = [];
        this._renderTab(width, height);
        this.createActionButtons(width, height);

        this.events.once('shutdown', () => this._destroyDom());
        this.events.once('destroy',  () => this._destroyDom());
    }

    // ── Background ────────────────────────────────────────────────────────
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

    // ── Header ────────────────────────────────────────────────────────────
    createHeader(width) {
        const title = this.add.text(70, 48, 'PLAYER DASHBOARD', {
            fontSize: '38px', fill: C.text, fontStyle: 'bold' });
        this.add.text(72, 95, 'Progression & statistics', { fontSize: '18px', fill: C.muted });
        this.add.text(width - 300, 58, '💾 Local Save', {
            fontSize: '14px', fill: '#d9f99d', backgroundColor: '#365314', padding: { x: 10, y: 5 } });
        this.tweens.add({ targets: title, x: { from: 70, to: 77 }, duration: 2600,
            ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });
    }

    // ── Top stat cards ────────────────────────────────────────────────────
    createTopStats(width) {
        const totalBosses = Object.keys(BOSSES).length;
        const defeated = GameData.defeatedBosses.size;
        const cards = [
            { label: 'Bosses Defeated', value: `${defeated}/${totalBosses}`, color: 0x34d399 },
            { label: 'Shadow Crystals', value: `${GameData.coins} 💎`,       color: 0xa78bfa },
            { label: 'Tower Record',    value: `Floor ${GameData.infiniteBest || 0}`, color: 0x22d3ee },
            { label: 'Achievements',    value: `${GameData.unlockedAchievements.size}/${ACHIEVEMENTS.length}`, color: 0xfbbf24 },
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
                fontSize: '26px', fill: C.text, fontStyle: 'bold', wordWrap: { width: cardW - 30 } });
            this.tweens.add({ targets: vt, alpha: { from: 0.85, to: 1 }, duration: 1300, yoyo: true, repeat: -1 });
        });
    }

    // ── Tabs ──────────────────────────────────────────────────────────────
    createTabs(width) {
        const tabs = [
            { id: 'bosses',       label: 'BOSSES' },
            { id: 'stats',        label: 'STATS' },
            { id: 'achievements', label: 'ACHIEVEMENTS' },
            { id: 'shop',         label: '💎 SHOP' },
        ];
        const tabY = 282, tabW = 148, startX = 70;
        this._tabButtons = {};
        tabs.forEach((tab, i) => {
            const x = startX + i * (tabW + 8);
            const isActive = tab.id === this._activeTab;
            const bg = this.add.rectangle(x, tabY, tabW, 34, isActive ? 0x1e4a72 : C.panel, 1)
                .setOrigin(0, 0.5)
                .setStrokeStyle(1, isActive ? 0x38bdf8 : 0x2f4a74, 1)
                .setInteractive({ useHandCursor: true });
            const label = this.add.text(x + tabW / 2, tabY, tab.label, {
                fontSize: '13px', fill: isActive ? '#67e8f9' : C.muted, fontStyle: isActive ? 'bold' : 'normal'
            }).setOrigin(0.5);
            this._tabButtons[tab.id] = { bg, label };
            bg.on('pointerdown', () => {
                soundManager.playClick();
                this._switchTab(tab.id, width, this.cameras.main.height);
            });
            bg.on('pointerover', () => { if (tab.id !== this._activeTab) bg.setFillStyle(0x162e4a, 1); });
            bg.on('pointerout',  () => { if (tab.id !== this._activeTab) bg.setFillStyle(C.panel, 1); });
        });
    }

    _switchTab(tabId, width, height) {
        if (tabId === this._activeTab) return;
        Object.entries(this._tabButtons).forEach(([id, { bg, label }]) => {
            const active = id === tabId;
            bg.setFillStyle(active ? 0x1e4a72 : C.panel, 1);
            bg.setStrokeStyle(1, active ? 0x38bdf8 : 0x2f4a74, 1);
            label.setStyle({ fill: active ? '#67e8f9' : C.muted, fontStyle: active ? 'bold' : 'normal' });
        });
        this._destroyDom();
        this._contentGroup.forEach(o => o?.destroy());
        this._contentGroup = [];
        this._activeTab = tabId;
        this._renderTab(width, height);
    }

    _renderTab(width, height) {
        switch (this._activeTab) {
            case 'bosses':       this._renderBossesTab(width, height); break;
            case 'stats':        this._renderStatsTab(width, height); break;
            case 'achievements': this._renderAchievementsTab(width, height); break;
            case 'shop':         this._renderShopTab(width, height); break;
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────
    _panel(x, y, w, h) {
        const p = this.add.rectangle(x, y, w, h, C.panel, 0.9).setOrigin(0).setStrokeStyle(1, 0x2f4a74, 0.95);
        this._contentGroup.push(p); return p;
    }
    _t(x, y, str, style) {
        const t = this.add.text(x, y, str, style);
        this._contentGroup.push(t); return t;
    }

    // ── TAB: Bosses ───────────────────────────────────────────────────────
    _renderBossesTab(width, height) {
        const x = 70, y = 306, w = width - 140, h = height - 406;
        this._panel(x, y, w, h);
        this._t(x + 20, y + 18, 'BOSS STATUS', { fontSize: '20px', fill: C.accent, fontStyle: 'bold' });
        const colX = [x + 28, x + w * 0.62, x + w * 0.78];
        ['Boss', 'ID', 'Status'].forEach((l, i) =>
            this._t(colX[i], y + 54, l, { fontSize: '16px', fill: '#9fb5d8', fontStyle: 'bold' }));
        Object.entries(BOSSES).forEach(([id, boss], idx) => {
            const rowY = y + 88 + idx * 30;
            const defeated = GameData.isBossDefeated(Number(id));
            if (idx % 2 === 0) {
                const r = this.add.rectangle(x + 12, rowY - 4, w - 24, 24, 0x152545, 0.35).setOrigin(0);
                this._contentGroup.push(r);
            }
            this._t(colX[0], rowY, boss.name || `Boss ${id}`, { fontSize: '15px', fill: C.text });
            this._t(colX[1], rowY, `${id}`, { fontSize: '15px', fill: '#9fb5d8' });
            this._t(colX[2], rowY, defeated ? 'Defeated' : 'Pending', {
                fontSize: '15px', fill: defeated ? '#34d399' : '#fbbf24', fontStyle: 'bold' });
        });
    }

    // ── TAB: Stats ────────────────────────────────────────────────────────
    _renderStatsTab(width, height) {
        const x = 70, y = 306, w = width - 140, h = height - 406;
        this._panel(x, y, w, h);
        this._t(x + 20, y + 18, 'LIFETIME STATS', { fontSize: '20px', fill: C.accent, fontStyle: 'bold' });
        const s = GameData.stats;
        const rows = [
            ['Total Runs',       s.totalRuns || 0],
            ['Bosses Defeated',  s.bossesDefeated || 0],
            ['Total Kills',      s.totalKills || 0],
            ['Total Dodges',     s.totalDodges || 0],
            ['Total Crits',      s.totalCrits || 0],
            ['Total Damage',     Math.floor(s.totalDamage || 0).toLocaleString()],
            ['No-Hit Clears',    s.noHitBosses || 0],
            ['Highest Combo',    s.highestCombo || 0],
            ['Crystals Earned',  s.totalCrystals || 0],
            ['Time Played',      `${Math.floor((s.totalPlayTime || 0) / 60)} min`],
        ];
        const mid = x + w / 2;
        rows.forEach(([label, value], i) => {
            const col = i % 2, row = Math.floor(i / 2);
            const cx = col === 0 ? x + 32 : mid + 32, cy = y + 64 + row * 42;
            if (i % 2 === 0) {
                const d = this.add.rectangle(x + 12, cy - 8, w - 24, 34, 0x152545, 0.3).setOrigin(0);
                this._contentGroup.push(d);
            }
            this._t(cx, cy, label, { fontSize: '14px', fill: C.muted });
            this._t(cx, cy + 16, `${value}`, { fontSize: '17px', fill: C.text, fontStyle: 'bold' });
        });

        // Save Code section at bottom of stats panel
        this._renderSaveCodeSection(x, y + h - 90, w);
    }

    _renderSaveCodeSection(x, y, w) {
        const bg = this.add.rectangle(x, y, w, 80, 0x0a1a30, 0.95)
            .setOrigin(0).setStrokeStyle(1, 0x38bdf8, 0.4);
        this._contentGroup.push(bg);
        this._t(x + 16, y + 10, 'SAVE CODE  •  copy/paste to transfer progress to another device', {
            fontSize: '12px', fill: '#67e8f9' });

        this._makeBtn(x + 16, y + 36, 'EXPORT', 0x0e5024, 0x34d399, () => {
            soundManager.playClick();
            this._showCodeOverlay(exportSaveCode(), false);
        });
        this._makeBtn(x + 140, y + 36, 'IMPORT', 0x1a1a50, 0x818cf8, () => {
            soundManager.playClick();
            this._showCodeOverlay('', true);
        });
    }

    _makeBtn(x, y, label, bgHex, strokeHex, onClick) {
        const bg6 = bgHex.toString(16).padStart(6, '0');
        const st6 = strokeHex.toString(16).padStart(6, '0');
        const btn = this.add.text(x, y, label, {
            fontSize: '13px', fill: '#ecf4ff', backgroundColor: `#${bg6}`,
            padding: { x: 14, y: 7 }, stroke: `#${st6}`, strokeThickness: 1
        }).setInteractive({ useHandCursor: true }).setOrigin(0);
        btn.on('pointerdown', onClick);
        btn.on('pointerover', () => { soundManager.playHover(); btn.setScale(1.04); });
        btn.on('pointerout',  () => btn.setScale(1));
        this._contentGroup.push(btn);
        return btn;
    }

    _showCodeOverlay(initialCode, isImport) {
        this._destroyDom();
        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'fixed', inset: '0', background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: '99999'
        });
        const box = document.createElement('div');
        Object.assign(box.style, {
            background: '#0a1525', border: '1px solid #38bdf8', borderRadius: '12px',
            padding: '24px', width: '560px', fontFamily: 'Inter, monospace', color: '#ecf4ff'
        });
        const title = isImport ? 'IMPORT SAVE CODE' : 'EXPORT SAVE CODE';
        const hint  = isImport ? 'Paste your save code below, then click Import:' : 'Copy the code below and paste it on another device:';
        box.innerHTML = `
            <h3 style="margin:0 0 10px;color:#67e8f9;font-size:18px;">${title}</h3>
            <p style="margin:0 0 10px;font-size:13px;color:#8ea6cc;">${hint}</p>
            <textarea id="sk-save-code" rows="5" style="width:100%;padding:10px;border-radius:8px;border:1px solid #2f4a74;background:#060b18;color:#ecf4ff;font-family:monospace;font-size:12px;resize:none;box-sizing:border-box;">${isImport ? '' : initialCode}</textarea>
            <p id="sk-save-msg" style="min-height:18px;margin:6px 0 0;font-size:13px;color:#34d399;"></p>
            <div style="display:flex;gap:10px;margin-top:12px;">
                ${!isImport ? `<button id="sk-copy-btn" style="flex:1;padding:10px;border:none;border-radius:8px;background:#0e5024;color:#ecf4ff;cursor:pointer;font-weight:bold;">COPY</button>` : ''}
                ${isImport  ? `<button id="sk-import-btn" style="flex:1;padding:10px;border:none;border-radius:8px;background:#1a1a70;color:#ecf4ff;cursor:pointer;font-weight:bold;">IMPORT</button>` : ''}
                <button id="sk-close-btn" style="flex:1;padding:10px;border:1px solid #2f4a74;border-radius:8px;background:transparent;color:#8ea6cc;cursor:pointer;">CLOSE</button>
            </div>
        `;
        overlay.appendChild(box);
        document.body.appendChild(overlay);
        this._domElements.push(overlay);

        const msg = box.querySelector('#sk-save-msg');
        box.querySelector('#sk-close-btn').addEventListener('click', () => this._destroyDom());

        const copyBtn = box.querySelector('#sk-copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const ta = box.querySelector('#sk-save-code');
                ta.select();
                document.execCommand('copy');
                msg.textContent = 'Copied to clipboard!';
                msg.style.color = '#34d399';
            });
        }

        const importBtn = box.querySelector('#sk-import-btn');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                const code = box.querySelector('#sk-save-code').value.trim();
                const result = importSaveCode(code);
                msg.textContent = result.message;
                msg.style.color = result.success ? '#34d399' : '#f87171';
                if (result.success) {
                    soundManager.playAchievement();
                    this.time.delayedCall(1200, () => { this._destroyDom(); this.scene.restart(); });
                }
            });
        }
    }

    // ── TAB: Achievements ─────────────────────────────────────────────────
    _renderAchievementsTab(width, height) {
        const x = 70, y = 306, w = width - 140, h = height - 406;
        this._panel(x, y, w, h);
        const unlocked = GameData.unlockedAchievements.size;
        this._t(x + 20, y + 18, `ACHIEVEMENTS  ${unlocked}/${ACHIEVEMENTS.length}  (+30 💎 each)`, {
            fontSize: '18px', fill: C.accent, fontStyle: 'bold' });
        const cols = 2, itemW = Math.floor((w - 48) / cols), itemH = 54, gap = 8;
        ACHIEVEMENTS.forEach((ach, i) => {
            const col = i % cols, row = Math.floor(i / cols);
            const ix = x + 20 + col * (itemW + gap), iy = y + 56 + row * (itemH + gap);
            const isUnlocked = GameData.isAchievementUnlocked(ach.id);
            const rc = RARITY_COLORS[ach.rarity] || '#9ca3af';
            const rh = parseInt(rc.replace('#', ''), 16);
            const card = this.add.rectangle(ix, iy, itemW, itemH, isUnlocked ? 0x0e2840 : 0x0a1520, 0.95)
                .setOrigin(0).setStrokeStyle(1, isUnlocked ? rh : 0x2f4a74, isUnlocked ? 0.9 : 0.4);
            this._contentGroup.push(card);
            this._t(ix + 10, iy + itemH / 2, ach.icon, { fontSize: '22px', alpha: isUnlocked ? 1 : 0.3 }).setOrigin(0, 0.5);
            this._t(ix + 42, iy + 10, ach.name, { fontSize: '14px', fill: isUnlocked ? C.text : '#4a5568', fontStyle: 'bold' });
            this._t(ix + 42, iy + 28, ach.description, { fontSize: '11px', fill: isUnlocked ? C.muted : '#374151', wordWrap: { width: itemW - 50 } });
            if (isUnlocked) {
                this._t(ix + itemW - 8, iy + 8, ach.rarity.toUpperCase(), { fontSize: '9px', fill: rc, fontStyle: 'bold' }).setOrigin(1, 0);
            } else {
                this._t(ix + itemW / 2, iy + itemH / 2, '?', { fontSize: '20px', fill: '#374151', fontStyle: 'bold' }).setOrigin(0.5);
            }
        });
    }

    // ── TAB: Shop ─────────────────────────────────────────────────────────
    _renderShopTab(width, height) {
        const x = 70, y = 306, w = width - 140, h = height - 406;
        this._panel(x, y, w, h);

        this._t(x + 20, y + 18, '💎 SHADOW CRYSTAL SHOP', { fontSize: '20px', fill: C.accent, fontStyle: 'bold' });
        this._t(x + w - 20, y + 18, `Balance: ${GameData.coins} 💎`, {
            fontSize: '16px', fill: '#a78bfa', fontStyle: 'bold' }).setOrigin(1, 0);
        this._t(x + 20, y + 44, 'Permanent upgrades active every run. Bought with Shadow Crystals earned from boss victories.', {
            fontSize: '12px', fill: C.muted });

        const catW = Math.floor((w - 40) / 2) - 8;
        let maxRowsPerCol = [0, 0];

        SHOP_CATEGORIES.forEach((cat, catIdx) => {
            const col = catIdx % 2;
            const upgList = SHOP_UPGRADES[cat.id];
            const colX = x + 20 + col * (catW + 16);

            // Calculate vertical offset from previous category in same column
            const prevCatInCol = catIdx >= 2 ? SHOP_UPGRADES[SHOP_CATEGORIES[catIdx - 2].id].length : 0;
            const baseY = y + 72 + (catIdx >= 2 ? prevCatInCol * 46 + 36 : 0);

            this._t(colX, baseY, `${cat.icon} ${cat.label}`, { fontSize: '14px', fill: cat.color, fontStyle: 'bold' });

            upgList.forEach((upg, upgIdx) => {
                this._renderUpgradeRow(colX, baseY + 24 + upgIdx * 46, catW, upg);
            });
        });
    }

    _renderUpgradeRow(x, y, w, upg) {
        const purchased    = GameData.isUpgradePurchased(upg.id);
        const requiresMet  = !upg.requires || GameData.isUpgradePurchased(upg.requires);
        const canAfford    = GameData.coins >= upg.cost;
        const available    = !purchased && requiresMet;

        const bgColor     = purchased ? 0x0e2e1a : requiresMet ? 0x0c1828 : 0x0a0f1a;
        const strokeColor = purchased ? 0x34d399 : requiresMet ? 0x2f4a74 : 0x1a2a3a;

        const card = this.add.rectangle(x, y, w, 38, bgColor, 0.95)
            .setOrigin(0).setStrokeStyle(1, strokeColor, purchased ? 0.9 : 0.5);
        this._contentGroup.push(card);

        const icon = purchased ? '✓' : requiresMet ? '' : '🔒';
        this._t(x + 8, y + 19, icon, { fontSize: '14px', fill: purchased ? '#34d399' : '#888' }).setOrigin(0, 0.5);
        this._t(x + 26, y + 8, upg.name, {
            fontSize: '13px', fill: purchased ? '#34d399' : requiresMet ? C.text : '#4a5568', fontStyle: 'bold' });
        this._t(x + 26, y + 24, purchased ? 'PURCHASED' : requiresMet ? upg.desc : `Requires: ${upg.requires}`, {
            fontSize: '11px', fill: purchased ? '#22c55e' : requiresMet ? C.muted : '#4a5568' });

        if (!purchased) {
            const costColor = canAfford && requiresMet ? '#a78bfa' : '#4a5568';
            this._t(x + w - 74, y + 19, `${upg.cost} 💎`, {
                fontSize: '13px', fill: costColor, fontStyle: 'bold' }).setOrigin(0, 0.5);

            if (available) {
                const btn = this.add.text(x + w - 14, y + 19, canAfford ? 'BUY' : 'NEED', {
                    fontSize: '12px',
                    fill: canAfford ? '#818cf8' : '#6b7280',
                    backgroundColor: canAfford ? '#1a1a70' : '#1a1214',
                    padding: { x: 10, y: 4 },
                    stroke: canAfford ? '#4f46e5' : '#374151',
                    strokeThickness: 1
                }).setOrigin(1, 0.5);
                this._contentGroup.push(btn);

                if (canAfford) {
                    btn.setInteractive({ useHandCursor: true });
                    btn.on('pointerover', () => { soundManager.playHover(); btn.setScale(1.05); });
                    btn.on('pointerout',  () => btn.setScale(1));
                    btn.on('pointerdown', () => this._buyUpgrade(upg));
                }
            }
        }
    }

    _buyUpgrade(upg) {
        if (!GameData.spendCoins(upg.cost)) return;
        GameData.purchaseUpgrade(upg.id);
        soundManager.playAchievement();

        // Refresh shop
        this._contentGroup.forEach(o => o?.destroy());
        this._contentGroup = [];
        this._renderShopTab(this.cameras.main.width, this.cameras.main.height);

        // Purchase flash
        const flash = this.add.text(this.cameras.main.width / 2, 140, `${upg.name} purchased!  -${upg.cost} 💎`, {
            fontSize: '17px', fill: '#a78bfa', backgroundColor: '#0a0f2a',
            padding: { x: 16, y: 8 }, stroke: '#4f46e5', strokeThickness: 1
        }).setOrigin(0.5).setScrollFactor(0).setDepth(500);
        this.tweens.add({ targets: flash, y: flash.y - 40, alpha: 0, duration: 1600, onComplete: () => flash.destroy() });
    }

    // ── Action Buttons ────────────────────────────────────────────────────
    createActionButtons(width, height) {
        const startBtn = this.createButton(180, height - 50, 'START RUN', () => {
            soundManager.playClick(); this.scene.start('ClassSelectScene');
        });
        const backBtn = this.createButton(width - 180, height - 50, 'MAIN MENU', () => {
            soundManager.playClick(); this.scene.start('MenuScene');
        });
        [startBtn, backBtn].forEach(btn => {
            btn.on('pointerover', () => { soundManager.playHover(); btn.setScale(1.03); btn.setStyle({ backgroundColor: '#0ea5e9', fill: '#041322' }); });
            btn.on('pointerout',  () => { btn.setScale(1); btn.setStyle({ backgroundColor: '#1a2b4f', fill: '#f8fbff' }); });
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

    // ── DOM cleanup ───────────────────────────────────────────────────────
    _destroyDom() {
        this._domElements?.forEach(el => el?.remove());
        this._domElements = [];
    }
}
