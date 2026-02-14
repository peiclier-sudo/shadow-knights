// UnlockData.js - Unlockable content definitions
export const UnlockData = {
    bosses: [
        { id: 1, name: 'SENTINEL', unlocked: true },
        { id: 2, name: 'GUNNER', unlocked: false, requirement: 'Defeat Sentinel' },
        { id: 3, name: 'DASHER', unlocked: false, requirement: 'Defeat Gunner' }
    ],
    
    weapons: [
        { id: 'SWORD', name: 'Sword', unlocked: true },
        { id: 'BOW', name: 'Bow', unlocked: true },
        { id: 'STAFF', name: 'Staff', unlocked: true },
        { id: 'DAGGERS', name: 'Daggers', unlocked: false, requirement: '5 critical hits' },
        { id: 'GREATSWORD', name: 'Greatsword', unlocked: false, requirement: 'Defeat 2 bosses' }
    ],
    
    classes: [
        { id: 'WARRIOR', name: 'Warrior', unlocked: true },
        { id: 'MAGE', name: 'Mage', unlocked: true },
        { id: 'ROGUE', name: 'Rogue', unlocked: true }
    ],
    
    achievements: [
        { id: 'firstBlood', name: 'First Blood', unlocked: false },
        { id: 'bossHunter', name: 'Boss Hunter', unlocked: false },
        { id: 'perfectDodge', name: 'Shadow Dancer', unlocked: false },
        { id: 'critMaster', name: 'Critical Master', unlocked: false },
        { id: 'noHit', name: 'Untouchable', unlocked: false }
    ],
    
    // Check if content is unlocked
    isUnlocked(contentType, id, progress) {
        const content = this[contentType]?.find(c => c.id === id);
        if (!content) return false;
        if (content.unlocked) return true;
        
        // Check requirements based on progress
        switch(content.requirement) {
            case 'Defeat Sentinel':
                return progress.bossesDefeated >= 1;
            case 'Defeat Gunner':
                return progress.bossesDefeated >= 2;
            case '5 critical hits':
                return (progress.crits || 0) >= 5;
            case 'Defeat 2 bosses':
                return progress.bossesDefeated >= 2;
            default:
                return false;
        }
    },
    
    // Unlock content permanently
    unlock(contentType, id) {
        const content = this[contentType]?.find(c => c.id === id);
        if (content) {
            content.unlocked = true;
            return true;
        }
        return false;
    }
};