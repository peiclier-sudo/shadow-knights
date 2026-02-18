// AchievementData.js - Achievement definitions
export const ACHIEVEMENTS = [
    // ── Combat milestones ────────────────────────────────────────────────
    {
        id: 'firstBlood',
        name: 'First Blood',
        description: 'Defeat your first boss',
        icon: '🏆',
        rarity: 'common',
        condition: (data) => data.stats.bossesDefeated >= 1
    },
    {
        id: 'bossHunter',
        name: 'Boss Hunter',
        description: 'Defeat 5 bosses',
        icon: '👑',
        rarity: 'rare',
        condition: (data) => data.stats.bossesDefeated >= 5
    },
    {
        id: 'shadowLord',
        name: 'Shadow Lord',
        description: 'Defeat all 10 bosses',
        icon: '🌑',
        rarity: 'legendary',
        condition: (data) => data.defeatedBosses.size >= 10
    },

    // ── Dodge / survival ─────────────────────────────────────────────────
    {
        id: 'perfectDodge',
        name: 'Shadow Dancer',
        description: 'Dodge 100 attacks',
        icon: '💃',
        rarity: 'common',
        condition: (data) => data.stats.totalDodges >= 100
    },
    {
        id: 'phantomStride',
        name: 'Phantom Stride',
        description: 'Dodge 500 attacks total',
        icon: '👻',
        rarity: 'rare',
        condition: (data) => data.stats.totalDodges >= 500
    },
    {
        id: 'noHit',
        name: 'Untouchable',
        description: 'Defeat a boss without taking damage',
        icon: '✨',
        rarity: 'epic',
        condition: (data) => data.stats.noHitBosses >= 1
    },
    {
        id: 'perfectionist',
        name: 'Perfectionist',
        description: 'Defeat 3 different bosses without taking damage',
        icon: '💎',
        rarity: 'legendary',
        condition: (data) => data.stats.noHitBosses >= 3
    },

    // ── Crits / damage ───────────────────────────────────────────────────
    {
        id: 'critMaster',
        name: 'Critical Master',
        description: 'Land 50 critical hits',
        icon: '⚡',
        rarity: 'common',
        condition: (data) => data.stats.totalCrits >= 50
    },
    {
        id: 'critGod',
        name: 'Crit God',
        description: 'Land 250 critical hits total',
        icon: '🌩️',
        rarity: 'rare',
        condition: (data) => data.stats.totalCrits >= 250
    },
    {
        id: 'devastator',
        name: 'Devastator',
        description: 'Deal 50,000 total damage across all runs',
        icon: '💥',
        rarity: 'epic',
        condition: (data) => data.stats.totalDamage >= 50000
    },

    // ── Combo system ─────────────────────────────────────────────────────
    {
        id: 'comboStarter',
        name: 'Combo Starter',
        description: 'Reach a 10-hit combo',
        icon: '🔥',
        rarity: 'common',
        condition: (data) => data.stats.highestCombo >= 10
    },
    {
        id: 'comboMaster',
        name: 'Combo Master',
        description: 'Reach a 25-hit combo',
        icon: '🌪️',
        rarity: 'epic',
        condition: (data) => data.stats.highestCombo >= 25
    },

    // ── Progression ──────────────────────────────────────────────────────
    {
        id: 'firstFloor',
        name: 'Ascendant',
        description: 'Reach floor 10 in Infinite Tower',
        icon: '🗼',
        rarity: 'rare',
        condition: (data) => (data.infiniteBest || 0) >= 10
    },
    {
        id: 'towerMaster',
        name: 'Tower Master',
        description: 'Reach floor 25 in Infinite Tower',
        icon: '⚔️',
        rarity: 'legendary',
        condition: (data) => (data.infiniteBest || 0) >= 25
    },

    // ── Dedication ───────────────────────────────────────────────────────
    {
        id: 'veteran',
        name: 'Veteran',
        description: 'Complete 25 runs',
        icon: '🎖️',
        rarity: 'epic',
        condition: (data) => data.stats.totalRuns >= 25
    },
];

export const RARITY_COLORS = {
    common:    '#9ca3af',
    rare:      '#60a5fa',
    epic:      '#c084fc',
    legendary: '#fbbf24',
};
