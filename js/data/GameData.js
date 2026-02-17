// GameData.js - Game state management
import { BOSSES } from './BossData.js';

const TOTAL_BOSSES = Object.keys(BOSSES).length;

export const GameData = {
    currentBossId: parseInt(localStorage.getItem('currentBoss')) || 1,
    currentTowerFloor: parseInt(localStorage.getItem('towerFloor')) || 1,
    unlockedBosses: TOTAL_BOSSES,
    
    saveProgress() {
        localStorage.setItem('currentBoss', this.currentBossId);
        localStorage.setItem('unlockedBosses', this.unlockedBosses);
        localStorage.setItem('towerFloor', this.currentTowerFloor);
    },
    
    unlockNextBoss() {
        if (this.currentBossId === this.unlockedBosses && this.currentBossId < TOTAL_BOSSES) {
            this.unlockedBosses++;
            this.saveProgress();
        }
    }
};
