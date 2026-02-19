// ShopData.js - Permanent upgrade definitions for the Shadow Crystal shop
// Upgrades are applied to the player at the start of each run.

export const SHOP_CATEGORIES = [
    { id: 'offense',  label: 'Offense',  icon: '⚔️',  color: '#f87171' },
    { id: 'defense',  label: 'Defense',  icon: '🛡️',  color: '#60a5fa' },
    { id: 'mobility', label: 'Mobility', icon: '💨',  color: '#34d399' },
    { id: 'stamina',  label: 'Stamina',  icon: '⚡',  color: '#fbbf24' },
];

// apply(player) is called once at run start for each purchased upgrade.
// Upgrades stack — e.g. buying blade1 + blade2 gives both bonuses.
export const SHOP_UPGRADES = {

    offense: [
        {
            id: 'blade1',
            name: 'Blade Edge I',
            desc: '+8% damage dealt',
            cost: 75,
            apply: (p) => { p.passiveDamageMultiplier = (p.passiveDamageMultiplier || 1) * 1.08; },
        },
        {
            id: 'blade2',
            name: 'Blade Edge II',
            desc: '+12% damage dealt',
            cost: 190,
            requires: 'blade1',
            apply: (p) => { p.passiveDamageMultiplier = (p.passiveDamageMultiplier || 1) * 1.12; },
        },
        {
            id: 'blade3',
            name: 'Blade Edge III',
            desc: '+18% damage dealt',
            cost: 400,
            requires: 'blade2',
            apply: (p) => { p.passiveDamageMultiplier = (p.passiveDamageMultiplier || 1) * 1.18; },
        },
        {
            id: 'precision1',
            name: 'Precision I',
            desc: '+5% critical hit chance',
            cost: 100,
            apply: (p) => { p.critChanceBonus = (p.critChanceBonus || 0) + 0.05; },
        },
        {
            id: 'precision2',
            name: 'Precision II',
            desc: '+8% critical hit chance',
            cost: 260,
            requires: 'precision1',
            apply: (p) => { p.critChanceBonus = (p.critChanceBonus || 0) + 0.08; },
        },
    ],

    defense: [
        {
            id: 'iron1',
            name: 'Iron Skin I',
            desc: '+20 max HP',
            cost: 60,
            apply: (p) => { p.maxHealth += 20; p.health = Math.min(p.health + 20, p.maxHealth); },
        },
        {
            id: 'iron2',
            name: 'Iron Skin II',
            desc: '+30 max HP',
            cost: 160,
            requires: 'iron1',
            apply: (p) => { p.maxHealth += 30; p.health = Math.min(p.health + 30, p.maxHealth); },
        },
        {
            id: 'iron3',
            name: 'Iron Skin III',
            desc: '+40 max HP',
            cost: 350,
            requires: 'iron2',
            apply: (p) => { p.maxHealth += 40; p.health = Math.min(p.health + 40, p.maxHealth); },
        },
        {
            id: 'thick',
            name: 'Thick Hide',
            desc: '-12% incoming damage',
            cost: 220,
            apply: (p) => { p.damageReduction = Math.min(0.5, (p.damageReduction || 0) + 0.12); },
        },
    ],

    mobility: [
        {
            id: 'swift1',
            name: 'Swift Boots I',
            desc: '+8% movement speed',
            cost: 80,
            apply: (p) => { p.speed *= 1.08; },
        },
        {
            id: 'swift2',
            name: 'Swift Boots II',
            desc: '+12% movement speed',
            cost: 210,
            requires: 'swift1',
            apply: (p) => { p.speed *= 1.12; },
        },
    ],

    stamina: [
        {
            id: 'end1',
            name: 'Endurance I',
            desc: '+20 max stamina',
            cost: 70,
            apply: (p) => { p.maxStamina += 20; p.stamina = Math.min(p.stamina + 20, p.maxStamina); },
        },
        {
            id: 'end2',
            name: 'Endurance II',
            desc: '+30 max stamina',
            cost: 180,
            requires: 'end1',
            apply: (p) => { p.maxStamina += 30; p.stamina = Math.min(p.stamina + 30, p.maxStamina); },
        },
        {
            id: 'regen',
            name: 'Quick Recovery',
            desc: '+25% stamina regeneration',
            cost: 160,
            apply: (p) => { p.staminaRegen *= 1.25; },
        },
    ],
};

/** Flat list of all upgrades, in order */
export const ALL_UPGRADES = Object.values(SHOP_UPGRADES).flat();

/**
 * Crystal reward for a completed run.
 * @param {object} opts - { victory, bossId, noHit, highestCombo, infiniteFloor }
 */
export function calcCrystalReward({ victory, bossId, noHit, highestCombo, infiniteFloor }) {
    let total = 0;

    if (victory) {
        if (infiniteFloor) {
            // Tower: 10 crystals per floor, capped at reasonable amount
            total += Math.min(infiniteFloor * 10, 400);
        } else {
            // Story: scales with boss difficulty
            const base = bossId <= 3 ? 50 : bossId <= 6 ? 90 : 130;
            total += base + bossId * 8;
        }

        // No-hit bonus
        if (noHit) total += 75;
    } else {
        // Consolation for dying after some progress
        total += 10;
    }

    // Combo bonus
    if (highestCombo >= 50) total += 80;
    else if (highestCombo >= 25) total += 40;
    else if (highestCombo >= 15) total += 20;
    else if (highestCombo >= 10) total += 10;
    else if (highestCombo >= 5)  total += 5;

    return total;
}
