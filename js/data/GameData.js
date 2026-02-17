// GameData.js - Game state management
export const GameData = {
    currentBossId: parseInt(localStorage.getItem('currentBoss')) || 1,
    unlockedBosses: parseInt(localStorage.getItem('unlockedBosses')) || 1,
    
    saveProgress() {
        localStorage.setItem('currentBoss', this.currentBossId);
        localStorage.setItem('unlockedBosses', this.unlockedBosses);
    },
    
    unlockNextBoss() {
        if (this.currentBossId === this.unlockedBosses && this.currentBossId < 5) {
            this.unlockedBosses++;
            this.saveProgress();
        }
    }
};