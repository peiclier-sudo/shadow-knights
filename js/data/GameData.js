// GameData.js - Game state management
import { BOSSES } from './BossData.js';

const TOTAL_BOSSES = Object.keys(BOSSES).length;

function loadDefeatedBosses() {
    try {
        const raw = localStorage.getItem('defeatedBosses');
        return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
        return new Set();
    }
}

export const GameData = {
    currentBossId: parseInt(localStorage.getItem('currentBoss')) || 1,
    unlockedBosses: TOTAL_BOSSES,
    defeatedBosses: loadDefeatedBosses(),
    infiniteFloor: parseInt(localStorage.getItem('infiniteFloor')) || 1,
    infiniteBest:  parseInt(localStorage.getItem('infiniteBest'))  || 0,

    saveProgress() {
        localStorage.setItem('currentBoss', this.currentBossId);
        localStorage.setItem('unlockedBosses', this.unlockedBosses);
        localStorage.setItem('defeatedBosses', JSON.stringify([...this.defeatedBosses]));
        localStorage.setItem('infiniteFloor', this.infiniteFloor);
        localStorage.setItem('infiniteBest',  this.infiniteBest);
    },

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
    }
};
