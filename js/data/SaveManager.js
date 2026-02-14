// AchievementData.js - Achievement definitions
export const ACHIEVEMENTS = [
    {
        id: 'firstBlood',
        name: 'First Blood',
        description: 'Defeat your first boss',
        icon: '🏆',
        condition: (data) => data.bossesDefeated >= 1
    },
    {
        id: 'bossHunter',
        name: 'Boss Hunter',
        description: 'Defeat all 3 bosses',
        icon: '👑',
        condition: (data) => data.bossesDefeated >= 3
    },
    {
        id: 'perfectDodge',
        name: 'Shadow Dancer',
        description: 'Dodge 100 attacks',
        icon: '💃',
        condition: (data) => data.dodges >= 100
    },
    {
        id: 'critMaster',
        name: 'Critical Master',
        description: 'Land 50 critical hits',
        icon: '⚡',
        condition: (data) => data.crits >= 50
    },
    {
        id: 'noHit',
        name: 'Untouchable',
        description: 'Defeat a boss without taking damage',
        icon: '✨',
        condition: (data) => data.noHitBoss === true
    }
];