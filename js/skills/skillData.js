// skillData.js - Skill definitions
export const SKILL_DATA = {
    battleCry: {
        id: 'battleCry',
        name: 'BATTLE CRY',
        class: 'WARRIOR',
        icon: '📢',
        description: '+50% damage for 8 seconds',
        staminaCost: 0,
        cooldown: 20000,
        color: 0xff5500
    },
    ironWill: {
        id: 'ironWill',
        name: 'INVULNERABILITY',
        class: 'WARRIOR',
        icon: '🛡️',
        description: 'Invulnerable for 1.5 seconds',
        staminaCost: 0,
        cooldown: 20000,
        color: 0xffaa00
    },
    grapplingHook: {
        id: 'grapplingHook',
        name: 'GRAPPLING HOOK',
        class: 'WARRIOR',
        icon: '🪝',
        description: 'Launch hook and pull yourself to target (700px range)',
        staminaCost: 0,
        cooldown: 12000,
        color: 0xffaa00
    },
    frostNova: {
        id: 'frostNova',
        name: 'FROST NOVA',
        class: 'MAGE',
        icon: '❄️',
        description: 'Freeze all enemies for 2 seconds',
        staminaCost: 0,
        cooldown: 8000,
        color: 0x88ccff
    },
    manaShield: {
        id: 'manaShield',
        name: 'MANA SHIELD',
        class: 'MAGE',
        icon: '🔮',
        description: 'Damage taken reduces stamina instead of health',
        staminaCost: 0,
        cooldown: 8000,
        color: 0x8866ff
    },
    arcaneSurge: {
        id: 'arcaneSurge',
        name: 'ARCANE SURGE',
        class: 'MAGE',
        icon: '✨',
        description: 'Next 3 shots fire 3 projectiles each',
        staminaCost: 0,
        cooldown: 8000,
        color: 0xaa88ff
    },
    backstab: {
        id: 'backstab',
        name: 'SPRINT',
        class: 'ROGUE',
        icon: '💨',
        description: '+30% move speed for 4 seconds',
        staminaCost: 0,
        cooldown: 10000,
        color: 0xaa44cc
    },
    smokeBomb: {
        id: 'smokeBomb',
        name: 'SMOKE BOMB',
        class: 'ROGUE',
        icon: '💨',
        description: 'Create smoke screen, enemies can\'t target you',
        staminaCost: 0,
        cooldown: 6000,
        color: 0x888888
    },
    eviscerate: {
        id: 'eviscerate',
        name: 'SHADOW STEP',
        class: 'ROGUE',
        icon: '🕶️',
        description: 'Teleport behind the boss and apply +30% damage taken for 5 seconds',
        staminaCost: 0,
        cooldown: 8000,
        color: 0xcc44aa
    }
};

export function getSkillsByClass(className) {
    return Object.values(SKILL_DATA).filter(skill => skill.class === className);
}
