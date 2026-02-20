// GameOverScene.js - Rich victory / defeat summary screen
import { GameData } from '../data/GameData.js';
import { BOSSES } from '../data/BossData.js';
import { soundManager } from '../utils/SoundManager.js';

const TOTAL_BOSSES = Object.keys(BOSSES).length;

// Palette
const C = {
    bg:      0x06090f,
    panel:   0x0d1828,
    border:  0x1e3a5f,
    accent:  '#67e8f9',
    text:    '#ecf4ff',
    muted:   '#7a9ac0',
    gold:    '#ffe066',
    green:   '#34d399',
    purple:  '#c084fc',
    red:     '#f87171',
};

export class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.victory        = data.victory        ?? false;
        this.bossId         = data.bossId         || 1;
        this.playerConfig   = data.playerConfig   || { class: 'WARRIOR', weapon: 'SWORD' };
        this.infiniteFloor  = data.infiniteFloor  || null;
        this.affixes        = data.affixes         || [];
        this.scaledHp       = data.scaledHp        || null;
        this.crystalsEarned = data.crystalsEarned  || 0;

        // Snapshot run stats before they're reset by a new run
        const rs = GameData.runStats;
        this.rs = {
            damage:       rs.damage       || 0,
            damageTaken:  rs.damageTaken  || 0,
            crits:        rs.crits        || 0,
            dodges:       rs.dodges       || 0,
            highestCombo: rs.highestCombo || 0,
            noHit:        rs.noHit        ?? true,
            elapsed:      Math.floor((Date.now() - (rs.startTime || Date.now())) / 1000),
        };

        // Detect personal bests (endRun already called, stats already updated)
        this.isNewComboRecord  = this.rs.highestCombo > 0 &&
            this.rs.highestCombo === GameData.stats.highestCombo &&
            GameData.stats.totalRuns > 1;
        this.isNewDamageRecord = false; // placeholder for future per-run tracking
    }

    create() {
        const W = this.cameras.main.width;
        const H = this.cameras.main.height;

        this._drawBackground(W, H);
        this._drawTitle(W, H);
        this._drawCards(W, H);
        this._drawButtons(W, H);
        this._animateIn();

        // Advance tower / story state
        if (this.victory) this._applyVictoryProgress();
    }

    // ── Background ────────────────────────────────────────────────────────
    _drawBackground(W, H) {
        const g = this.add.graphics();
        g.fillGradientStyle(C.bg, C.bg, 0x080e1c, 0x080e1c, 1);
        g.fillRect(0, 0, W, H);

        // Subtle radial glow behind title
        const glowColor = this.victory ? 0x00ff88 : 0xff3355;
        const glow = this.add.graphics();
        glow.fillStyle(glowColor, 0.04);
        glow.fillCircle(W / 2, H * 0.28, 280);
    }

    // ── Title block ───────────────────────────────────────────────────────
    _drawTitle(W, H) {
        const titleY  = H * 0.18;
        const subY    = titleY + 54;
        const badgeY  = subY + 30;

        const msg   = this.victory ? 'VICTORY' : 'DEFEAT';
        const color = this.victory ? '#00ff88' : '#ff3355';

        this._elements = [];

        const title = this.add.text(W / 2, titleY, msg, {
            fontSize: '68px', fill: color, fontStyle: 'bold',
            stroke: '#ffffff', strokeThickness: 3,
            shadow: { offsetX: 0, offsetY: 0, color, blur: 28, fill: true }
        }).setOrigin(0.5).setAlpha(0);
        this._elements.push(title);

        this.tweens.add({
            targets: title, scale: 1.06, duration: 1100,
            yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        // Sub-line: boss name / floor info
        const bossName  = BOSSES[this.bossId]?.name || 'BOSS';
        const sublabel  = this.infiniteFloor
            ? `Tower — Floor ${this.infiniteFloor}`
            : bossName + (this.victory ? ' DEFEATED' : ' — Not this time');
        const sub = this.add.text(W / 2, subY, sublabel, {
            fontSize: '22px', fill: '#d0e8ff',
            stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5).setAlpha(0);
        this._elements.push(sub);

        // No-hit badge
        if (this.victory && this.rs.noHit) {
            const badge = this.add.text(W / 2, badgeY, '✦ NO HIT CLEAR ✦', {
                fontSize: '15px', fill: '#00ffaa', fontStyle: 'bold',
                backgroundColor: '#003322', padding: { x: 14, y: 5 },
                stroke: '#00cc77', strokeThickness: 1
            }).setOrigin(0.5).setAlpha(0);
            this._elements.push(badge);
            this.tweens.add({
                targets: badge, alpha: { from: 0.6, to: 1 },
                duration: 700, yoyo: true, repeat: -1
            });
        }
    }

    // ── Stat + Crystal cards ──────────────────────────────────────────────
    _drawCards(W, H) {
        const cardTop  = H * 0.38;
        const cardH    = H * 0.31;
        const gap      = 16;
        const cardW    = (W - 100 - gap) / 2;
        const leftX    = 50;
        const rightX   = leftX + cardW + gap;

        this._drawStatsCard(leftX, cardTop, cardW, cardH);
        this._drawCrystalsCard(rightX, cardTop, cardW, cardH);
    }

    _panel(x, y, w, h, strokeColor = C.border) {
        const r = this.add.rectangle(x, y, w, h, C.panel, 0.92)
            .setOrigin(0, 0)
            .setStrokeStyle(1, strokeColor, 1);
        this._elements.push(r);
        return r;
    }

    _label(x, y, str, style = {}) {
        const t = this.add.text(x, y, str, {
            fontSize: '13px', fill: C.muted, ...style
        }).setAlpha(0);
        this._elements.push(t);
        return t;
    }
    _value(x, y, str, style = {}) {
        const t = this.add.text(x, y, str, {
            fontSize: '16px', fill: C.text, fontStyle: 'bold', ...style
        }).setAlpha(0);
        this._elements.push(t);
        return t;
    }

    _drawStatsCard(x, y, w, h) {
        this._panel(x, y, w, h, this.victory ? 0x1a5c3a : 0x5c1a1a);

        const rs = this.rs;
        const mins = Math.floor(rs.elapsed / 60);
        const secs = String(rs.elapsed % 60).padStart(2, '0');
        const timeStr = `${mins}:${secs}`;

        const title = this._label(x + 16, y + 14, '📊 RUN STATS', {
            fontSize: '14px', fill: C.accent, fontStyle: 'bold'
        });

        const rows = [
            ['Damage Dealt',  Math.floor(rs.damage).toLocaleString(), '#f9a8d4'],
            ['Damage Taken',  Math.floor(rs.damageTaken).toLocaleString(), rs.damageTaken === 0 ? C.green : C.red],
            ['Critical Hits', rs.crits, '#fbbf24'],
            ['Dodges',        rs.dodges, '#67e8f9'],
            ['Best Combo',    rs.highestCombo + 'x', this.isNewComboRecord ? C.gold : C.text],
            ['Fight Time',    timeStr, C.muted],
        ];

        const rowH = (h - 52) / rows.length;
        rows.forEach(([lbl, val, valColor], i) => {
            const ry = y + 46 + i * rowH;
            // Alternating row bg
            if (i % 2 === 0) {
                const bg = this.add.rectangle(x + 8, ry - 2, w - 16, rowH, 0xffffff, 0.03).setOrigin(0, 0);
                this._elements.push(bg);
            }
            this._label(x + 18, ry + rowH / 2, lbl).setOrigin(0, 0.5);
            const vt = this._value(x + w - 18, ry + rowH / 2, String(val), { fill: valColor || C.text });
            vt.setOrigin(1, 0.5);
            // Personal best star
            if (lbl === 'Best Combo' && this.isNewComboRecord) {
                this._label(x + w - 18, ry + rowH / 2 - 10, '★ NEW BEST', {
                    fontSize: '10px', fill: C.gold
                }).setOrigin(1, 0.5);
            }
        });
    }

    _drawCrystalsCard(x, y, w, h) {
        this._panel(x, y, w, h, 0x3b1d7a);

        this._label(x + 16, y + 14, '💎 CRYSTAL BREAKDOWN', {
            fontSize: '14px', fill: C.purple, fontStyle: 'bold'
        });

        const breakdown = this._calcBreakdown();
        const rowH = 36;
        let ry = y + 46;

        breakdown.parts.forEach(({ label, amount, color }) => {
            this._label(x + 18, ry + rowH / 2, label).setOrigin(0, 0.5);
            this._value(x + w - 18, ry + rowH / 2, `+${amount} 💎`, { fill: color || C.gold });
            const vt = this._elements[this._elements.length - 1];
            vt.setOrigin(1, 0.5);
            ry += rowH;
        });

        // Divider
        const div = this.add.rectangle(x + 14, ry + 4, w - 28, 1, 0x3b4a6a, 1).setOrigin(0, 0);
        this._elements.push(div);
        ry += 14;

        // Total
        this._label(x + 18, ry + 14, 'TOTAL EARNED', {
            fontSize: '13px', fill: C.muted
        }).setOrigin(0, 0.5);
        this._value(x + w - 18, ry + 14, `+${breakdown.total} 💎`, {
            fontSize: '22px', fill: C.gold
        }).setOrigin(1, 0.5);

        // Running balance
        this._label(x + w - 18, ry + 34, `Balance: ${GameData.coins} 💎`, {
            fontSize: '12px', fill: '#9f7aea'
        }).setOrigin(1, 0.5);
    }

    _calcBreakdown() {
        const parts = [];
        let total = 0;

        if (this.victory) {
            let base = 0;
            if (this.infiniteFloor) {
                base = Math.min(this.infiniteFloor * 10, 400);
                parts.push({ label: `Floor ${this.infiniteFloor} reward`, amount: base, color: C.accent });
            } else {
                base = (this.bossId <= 3 ? 50 : this.bossId <= 6 ? 90 : 130) + this.bossId * 8;
                parts.push({ label: 'Victory reward', amount: base, color: C.accent });
            }
            total += base;
            if (this.rs.noHit) {
                parts.push({ label: 'No-Hit bonus', amount: 75, color: C.green });
                total += 75;
            }
        } else {
            parts.push({ label: 'Consolation prize', amount: 10, color: C.muted });
            total += 10;
        }

        const combo   = this.rs.highestCombo;
        const cBonus  = combo >= 50 ? 80 : combo >= 25 ? 40 : combo >= 15 ? 20 : combo >= 10 ? 10 : combo >= 5 ? 5 : 0;
        if (cBonus > 0) {
            parts.push({ label: `Combo bonus (${combo}x peak)`, amount: cBonus, color: '#fbbf24' });
            total += cBonus;
        }

        return { parts, total };
    }

    // ── Buttons ───────────────────────────────────────────────────────────
    _drawButtons(W, H) {
        const btnY     = H * 0.82;
        const btns     = [];

        const mk = (label, x, onClick, col = '#fff') => {
            const b = this.add.text(x, btnY, label, {
                fontSize: '22px', fill: col,
                backgroundColor: '#0d1a2e',
                padding: { x: 22, y: 11 },
                stroke: col === '#fff' ? '#1e3a5f' : col,
                strokeThickness: 1
            }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true });

            b.on('pointerover', () => { soundManager.playHover(); b.setStyle({ fill: col === '#fff' ? C.accent : col, backgroundColor: '#162840' }); });
            b.on('pointerout',  () => b.setStyle({ fill: col, backgroundColor: '#0d1a2e' }));
            b.on('pointerdown', () => { soundManager.playClick(); onClick(); });
            this._elements.push(b);
            btns.push(b);
            return b;
        };

        const isEndless = this.infiniteFloor !== null;

        if (isEndless && this.victory) {
            const next = this.infiniteFloor + 1;
            mk(`FLOOR ${next}  ›`, W / 2 - 230, () => {
                this.scene.start('TowerScene', {
                    playerClass: this.playerConfig.class,
                    weapon: this.playerConfig.weapon,
                    mode: 'endless'
                });
            }, C.green);
        } else if (!isEndless && this.victory) {
            mk('RETURN TO TOWER', W / 2 - 230, () => {
                this.scene.start('TowerScene', {
                    playerClass: this.playerConfig.class,
                    weapon: this.playerConfig.weapon,
                    mode: 'story'
                });
            }, C.accent);
        } else {
            mk('RETRY', W / 2 - 230, () => {
                this.scene.start('GameScene', {
                    playerConfig: this.playerConfig,
                    bossId: this.bossId,
                    affixes: this.affixes,
                    scaledHp: this.scaledHp,
                    infiniteFloor: this.infiniteFloor,
                });
            });
        }

        mk('💎 UPGRADE', W / 2, () => {
            this.registry.set('dashboardTab', 'shop');
            this.scene.start('DashboardScene');
        }, C.purple);

        mk('MENU', W / 2 + 230, () => this.scene.start('MenuScene'));
    }

    // ── Victory state changes ─────────────────────────────────────────────
    _applyVictoryProgress() {
        if (this.infiniteFloor) {
            const next = this.infiniteFloor + 1;
            GameData.infiniteFloor = next;
            if (next > (GameData.infiniteBest || 0)) GameData.infiniteBest = next;
            GameData.saveProgress();
        } else {
            GameData.markBossDefeated(this.bossId);
            GameData.unlockNextBoss();
            if (this.bossId < TOTAL_BOSSES) {
                GameData.currentBossId = this.bossId + 1;
                GameData.saveProgress();
            }
        }
    }

    // ── Staggered fade-in ─────────────────────────────────────────────────
    _animateIn() {
        this._elements.forEach((el, i) => {
            this.tweens.add({
                targets: el, alpha: 1,
                duration: 350,
                delay: 120 + i * 28,
                ease: 'Power2'
            });
        });
    }
}
