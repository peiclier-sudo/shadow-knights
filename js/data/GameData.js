// GameData.js - Game state management
import { BOSSES } from './BossData.js';

const TOTAL_BOSSES = Object.keys(BOSSES).length;

function loadDefeatedBosses() {
    try {
        const raw = localStorage.getItem('defeatedBosses');
        return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch { return new Set(); }
}

function loadStats() {
    try {
        const raw = localStorage.getItem('shadowKnightsStats');
        return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
}

function loadUnlockedAchievements() {
    try {
        const raw = localStorage.getItem('shadowKnightsAchievements');
        return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch { return new Set(); }
}

function loadPurchasedUpgrades() {
    try {
        const raw = localStorage.getItem('sk_upgrades');
        return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch { return new Set(); }
}

const _savedStats = loadStats();

export const GameData = {
    currentBossId:  parseInt(localStorage.getItem('currentBoss'))    || 1,
    unlockedBosses: TOTAL_BOSSES,
    defeatedBosses: loadDefeatedBosses(),
    infiniteFloor:  parseInt(localStorage.getItem('infiniteFloor'))  || 1,
    infiniteBest:   parseInt(localStorage.getItem('infiniteBest'))   || 0,

    // ── Shadow Crystals (meta-currency) ───────────────────────────────────
    coins: parseInt(localStorage.getItem('sk_coins')) || 0,
    purchasedUpgrades: loadPurchasedUpgrades(),

    // ── Lifetime stats (persist across sessions) ───────────────────────────
    stats: {
        totalDodges:   _savedStats.totalDodges   || 0,
        totalCrits:    _savedStats.totalCrits    || 0,
        totalKills:    _savedStats.totalKills    || 0,
        totalDamage:   _savedStats.totalDamage   || 0,
        totalRuns:     _savedStats.totalRuns     || 0,
        noHitBosses:   _savedStats.noHitBosses   || 0,
        totalPlayTime: _savedStats.totalPlayTime || 0,
        highestCombo:  _savedStats.highestCombo  || 0,
        bossesDefeated:_savedStats.bossesDefeated|| 0,
        totalCrystals: _savedStats.totalCrystals || 0,
    },

    // ── Per-run stats (reset each run) ────────────────────────────────────
    runStats: {
        dodges: 0, crits: 0, damage: 0, damageTaken: 0,
        startTime: Date.now(), noHit: true, highestCombo: 0,
    },

    // ── Achievements ──────────────────────────────────────────────────────
    unlockedAchievements: loadUnlockedAchievements(),

    // ── Persistence ───────────────────────────────────────────────────────
    saveProgress() {
        localStorage.setItem('currentBoss',    this.currentBossId);
        localStorage.setItem('unlockedBosses', this.unlockedBosses);
        localStorage.setItem('defeatedBosses', JSON.stringify([...this.defeatedBosses]));
        localStorage.setItem('infiniteFloor',  this.infiniteFloor);
        localStorage.setItem('infiniteBest',   this.infiniteBest);
    },
    saveStats() {
        localStorage.setItem('shadowKnightsStats', JSON.stringify(this.stats));
    },
    saveAchievements() {
        localStorage.setItem('shadowKnightsAchievements', JSON.stringify([...this.unlockedAchievements]));
    },
    saveCoins() {
        localStorage.setItem('sk_coins', this.coins);
    },
    saveUpgrades() {
        localStorage.setItem('sk_upgrades', JSON.stringify([...this.purchasedUpgrades]));
    },

    // ── Crystal economy ───────────────────────────────────────────────────
    addCoins(amount) {
        this.coins += amount;
        this.stats.totalCrystals = (this.stats.totalCrystals || 0) + amount;
        this.saveCoins();
        this.saveStats();
    },

    spendCoins(amount) {
        if (this.coins < amount) return false;
        this.coins -= amount;
        this.saveCoins();
        return true;
    },

    purchaseUpgrade(id) {
        this.purchasedUpgrades.add(id);
        this.saveUpgrades();
    },

    isUpgradePurchased(id) {
        return this.purchasedUpgrades.has(id);
    },

    // ── Run lifecycle ──────────────────────────────────────────────────────
    startRun() {
        this.runStats = {
            dodges: 0, crits: 0, damage: 0, damageTaken: 0,
            startTime: Date.now(), noHit: true, highestCombo: 0,
        };
        this.stats.totalRuns++;
        this.saveStats();
    },

    endRun(victory) {
        const elapsed = (Date.now() - this.runStats.startTime) / 1000;
        this.stats.totalPlayTime += elapsed;
        if (victory) {
            this.stats.bossesDefeated++;
            if (this.runStats.noHit) this.stats.noHitBosses++;
        }
        if (this.runStats.highestCombo > this.stats.highestCombo) {
            this.stats.highestCombo = this.runStats.highestCombo;
        }
        this.saveStats();
    },

    // ── Stat increments ───────────────────────────────────────────────────
    recordDodge() {
        this.runStats.dodges++;
        this.stats.totalDodges++;
    },
    recordCrit(damage) {
        this.runStats.crits++;
        this.stats.totalCrits++;
        this.recordDamage(damage);
    },
    recordDamage(amount) {
        this.runStats.damage += amount;
        this.stats.totalDamage += amount;
    },
    recordDamageTaken(amount) {
        this.runStats.damageTaken += amount;
        if (amount > 0) this.runStats.noHit = false;
    },
    recordCombo(count) {
        if (count > this.runStats.highestCombo) this.runStats.highestCombo = count;
        if (count > this.stats.highestCombo) {
            this.stats.highestCombo = count;
            this.saveStats();
        }
    },

    // ── Boss tracking ─────────────────────────────────────────────────────
    markBossDefeated(bossId) {
        this.defeatedBosses.add(bossId);
        this.saveProgress();
    },
    isBossDefeated(bossId) {
        return this.defeatedBosses.has(bossId);
    },
    unlockNextBoss() {
        if (this.currentBossId === this.unlockedBosses && this.currentBossId < TOTAL_BOSSES) {
            this.unlockedBosses++;
            this.saveProgress();
        }
    },

    // ── Achievement tracking ──────────────────────────────────────────────
    isAchievementUnlocked(id) {
        return this.unlockedAchievements.has(id);
    },
    unlockAchievement(id) {
        if (this.unlockedAchievements.has(id)) return false;
        this.unlockedAchievements.add(id);
        this.saveAchievements();
        // Award crystals for every achievement unlock
        this.addCoins(30);
        return true;
    },
};
