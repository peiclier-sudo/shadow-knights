// classData.js - Class definitions
export const CLASSES = {
    WARRIOR: {
        name: 'WARRIOR',
        color: 0xff5500,
        glowColor: 0xff8833,
        baseHealth: 120,
        baseStamina: 80,
        baseSpeed: 370,
        staminaRegen: 0.15,
        dash: {
            name: 'SHIELD CHARGE',
            speed: 1000,
            duration: 220,
            cooldown: 900,
            staminaCost: 40,
            damage: 25
        },
        skills: [
            { id: 'battleCry', name: 'BATTLE CRY', icon: '📢', staminaCost: 0, cooldown: 20000 },
            { id: 'grapplingHook', name: 'GRAPPLING HOOK', icon: '🪝', staminaCost: 0, cooldown: 12000 },
            { id: 'ironWill', name: 'INVULNERABILITY', icon: '🛡️', staminaCost: 0, cooldown: 20000 }
        ]
    },
    MAGE: {
        name: 'MAGE',
        color: 0x3366ff,
        glowColor: 0x5588ff,
        baseHealth: 80,
        baseStamina: 120,
        baseSpeed: 350,
        staminaRegen: 0.25,
        dash: {
            name: 'BLINK',
            speed: 1500,
            duration: 100,
            cooldown: 600,
            staminaCost: 30
        },
        skills: [
            { id: 'frostNova', name: 'FROST NOVA', icon: '❄️', staminaCost: 0, cooldown: 8000 },
            { id: 'manaShield', name: 'MANA SHIELD', icon: '🔮', staminaCost: 0, cooldown: 8000 },
            { id: 'arcaneSurge', name: 'ARCANE SURGE', icon: '✨', staminaCost: 0, cooldown: 8000 }
        ]
    },
    ROGUE: {
        name: 'ROGUE',
        color: 0xaa44cc,
        glowColor: 0xcc66ee,
        baseHealth: 90,
        baseStamina: 100,
        baseSpeed: 546,
        staminaRegen: 0.2,
        dash: {
            name: 'SHADOW STEP',
            speed: 1300,
            duration: 180,
            cooldown: 700,
            staminaCost: 35
        },
        skills: [
            { id: 'backstab', name: 'SPRINT', icon: '💨', staminaCost: 0, cooldown: 10000 },
            { id: 'smokeBomb', name: 'SMOKE BOMB', icon: '🌫️', staminaCost: 0, cooldown: 6000 },
            { id: 'eviscerate', name: 'SHADOW STEP', icon: '🕶️', staminaCost: 0, cooldown: 8000 }
        ]
    }
};
