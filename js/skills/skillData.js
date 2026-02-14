// skillData.js - Skill definitions and metadata
export const SKILL_DATA = {
    battleCry: {
        id: 'battleCry',
        name: 'BATTLE CRY',
        class: 'WARRIOR',
        icon: '📢',
        description: '+50% damage for 5 seconds',
        staminaCost: 30,
        cooldown: 8000,
        color: 0xff5500
    },
    ironWill: {
        id: 'ironWill',
        name: 'IRON WILL',
        class: 'WARRIOR',
        icon: '🛡️',
        description: '50% damage reduction for 4 seconds',
        staminaCost: 25,
        cooldown: 6000,
        color: 0xffaa00
    },
    execution: {
        id: 'execution',
        name: 'EXECUTION',
        class: 'WARRIOR',
        icon: '⚔️',
        description: 'Instantly kill enemies below 20% health',
        staminaCost: 40,
        cooldown: 10000,
        color: 0xff0000
    },
    frostNova: {
        id: 'frostNova',
        name: 'FROST NOVA',
        class: 'MAGE',
        icon: '❄️',
        description: 'Freeze all enemies for 2 seconds',
        staminaCost: 35,
        cooldown: 5000,
        color: 0x88ccff
    },
    manaShield: {
        id: 'manaShield',
        name: 'MANA SHIELD',
        class: 'MAGE',
        icon: '🔮',
        description: 'Damage taken reduces stamina instead of health',
        staminaCost: 20,
        cooldown: 4000,
        color: 0x8866ff
    },
    arcaneSurge: {
        id: 'arcaneSurge',
        name: 'ARCANE SURGE',
        class: 'MAGE',
        icon: '✨',
        description: 'Next 3 shots fire 3 projectiles each',
        staminaCost: 45,
        cooldown: 7000,
        color: 0xaa88ff
    },
    backstab: {
        id: 'backstab',
        name: 'BACKSTAB',
        class: 'ROGUE',
        icon: '🗡️',
        description: '300% damage when attacking from behind',
        staminaCost: 30,
        cooldown: 3000,
        color: 0xaa44cc
    },
    smokeBomb: {
        id: 'smokeBomb',
        name: 'SMOKE BOMB',
        class: 'ROGUE',
        icon: '💨',
        description: 'Create smoke screen, enemies can\'t target you',
        staminaCost: 40,
        cooldown: 6000,
        color: 0x888888
    },
    eviscerate: {
        id: 'eviscerate',
        name: 'EVISCERATE',
        class: 'ROGUE',
        icon: '💀',
        description: 'Massive damage to single target',
        staminaCost: 50,
        cooldown: 8000,
        color: 0xcc44aa
    }
};

// Helper function to get skills by class
export function getSkillsByClass(className) {
    return Object.values(SKILL_DATA).filter(skill => skill.class === className);
}