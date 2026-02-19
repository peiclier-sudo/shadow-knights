// SaveCodeManager.js - Portable base64 save codes for cross-device progress
// Encodes: defeated bosses, achievements, upgrades, stats, coins, tower record

import { GameData } from './GameData.js';

const SAVE_VERSION = 2;

/**
 * Export current save state as a shareable base64 string.
 * @returns {string} The save code
 */
export function exportSaveCode() {
    const payload = {
        v:  SAVE_VERSION,
        db: [...GameData.defeatedBosses],
        ua: [...GameData.unlockedAchievements],
        pu: [...GameData.purchasedUpgrades],
        st: GameData.stats,
        ib: GameData.infiniteBest,
        co: GameData.coins,
        cb: GameData.currentBossId,
    };
    try {
        return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    } catch {
        return '';
    }
}

/**
 * Import a save code. Merges progress (never loses data — takes the maximum).
 * @param {string} code
 * @returns {{ success: boolean, message: string }}
 */
export function importSaveCode(code) {
    if (!code || typeof code !== 'string') {
        return { success: false, message: 'Empty or invalid code.' };
    }

    let payload;
    try {
        payload = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
    } catch {
        return { success: false, message: 'Could not decode save code.' };
    }

    if (!payload || typeof payload !== 'object' || payload.v !== SAVE_VERSION) {
        return { success: false, message: `Invalid save version (expected ${SAVE_VERSION}).` };
    }

    // Merge defeated bosses
    if (Array.isArray(payload.db)) {
        payload.db.forEach(id => GameData.defeatedBosses.add(id));
    }

    // Merge unlocked achievements
    if (Array.isArray(payload.ua)) {
        payload.ua.forEach(id => GameData.unlockedAchievements.add(id));
        GameData.saveAchievements();
    }

    // Merge purchased upgrades
    if (Array.isArray(payload.pu)) {
        payload.pu.forEach(id => GameData.purchasedUpgrades.add(id));
        GameData.saveUpgrades();
    }

    // Merge stats (take the maximum of each field)
    if (payload.st && typeof payload.st === 'object') {
        const s = GameData.stats;
        for (const key of Object.keys(payload.st)) {
            if (typeof payload.st[key] === 'number') {
                s[key] = Math.max(s[key] || 0, payload.st[key]);
            }
        }
        GameData.saveStats();
    }

    // Tower record
    if (typeof payload.ib === 'number' && payload.ib > (GameData.infiniteBest || 0)) {
        GameData.infiniteBest = payload.ib;
    }

    // Coins (take the max to be generous, or just add difference)
    if (typeof payload.co === 'number') {
        GameData.coins = Math.max(GameData.coins, payload.co);
        GameData.saveCoins();
    }

    // Advance current boss if further along
    if (typeof payload.cb === 'number' && payload.cb > GameData.currentBossId) {
        GameData.currentBossId = payload.cb;
    }

    GameData.saveProgress();

    return { success: true, message: 'Save code imported successfully!' };
}
