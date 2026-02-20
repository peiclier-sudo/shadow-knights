// TalentData.js - Class-specific talent trees
// 3 classes × 3 branches × 3 tiers = 27 talents
// Talents are purchased with Shadow Crystals and applied at the start of each run.
// Each tier requires the previous tier in the same branch to be purchased first.

export const TALENTS = [

    // ══════════════════════════════════════════════════════════════
    //  WARRIOR  — branches: Fury · Fortitude · Momentum
    // ══════════════════════════════════════════════════════════════

    // ── Branch 1: Fury (damage) ───────────────────────────────────
    {
        id: 'warrior_fury_1', class: 'WARRIOR', branch: 'Fury', tier: 1,
        icon: '🔥', name: 'Bloodthirst',
        description: '+10% damage dealt',
        cost: 80,
        apply: (p) => { p.damageMultiplier += 0.10; },
    },
    {
        id: 'warrior_fury_2', class: 'WARRIOR', branch: 'Fury', tier: 2,
        icon: '🔥', name: 'Berserker',
        description: '+20% damage dealt',
        cost: 160,
        apply: (p) => { p.damageMultiplier += 0.20; },
    },
    {
        id: 'warrior_fury_3', class: 'WARRIOR', branch: 'Fury', tier: 3,
        icon: '⚔️', name: 'War God',
        description: '+30% damage dealt',
        cost: 300,
        apply: (p) => { p.damageMultiplier += 0.30; },
    },

    // ── Branch 2: Fortitude (HP & defence) ───────────────────────
    {
        id: 'warrior_fort_1', class: 'WARRIOR', branch: 'Fortitude', tier: 1,
        icon: '🛡️', name: 'Iron Skin',
        description: '+25 max HP',
        cost: 80,
        apply: (p) => { p.maxHealth += 25; p.health = Math.min(p.health + 25, p.maxHealth); },
    },
    {
        id: 'warrior_fort_2', class: 'WARRIOR', branch: 'Fortitude', tier: 2,
        icon: '🛡️', name: 'Bulwark',
        description: '10% less damage taken',
        cost: 160,
        apply: (p) => { p.damageReduction = Math.min(0.75, p.damageReduction + 0.10); },
    },
    {
        id: 'warrior_fort_3', class: 'WARRIOR', branch: 'Fortitude', tier: 3,
        icon: '🏰', name: 'Fortress',
        description: '+50 max HP',
        cost: 300,
        apply: (p) => { p.maxHealth += 50; p.health = Math.min(p.health + 50, p.maxHealth); },
    },

    // ── Branch 3: Momentum (speed & stamina) ─────────────────────
    {
        id: 'warrior_mom_1', class: 'WARRIOR', branch: 'Momentum', tier: 1,
        icon: '💨', name: 'War March',
        description: '+20 movement speed',
        cost: 80,
        apply: (p) => { p.speed += 20; },
    },
    {
        id: 'warrior_mom_2', class: 'WARRIOR', branch: 'Momentum', tier: 2,
        icon: '💨', name: 'Adrenaline',
        description: '+15 max stamina',
        cost: 160,
        apply: (p) => { p.maxStamina += 15; p.stamina = Math.min(p.stamina + 15, p.maxStamina); },
    },
    {
        id: 'warrior_mom_3', class: 'WARRIOR', branch: 'Momentum', tier: 3,
        icon: '🌪️', name: 'Unstoppable',
        description: '+30 movement speed & +20 max stamina',
        cost: 300,
        apply: (p) => { p.speed += 30; p.maxStamina += 20; p.stamina = Math.min(p.stamina + 20, p.maxStamina); },
    },

    // ══════════════════════════════════════════════════════════════
    //  MAGE  — branches: Arcane · Frost · Resilience
    // ══════════════════════════════════════════════════════════════

    // ── Branch 1: Arcane (spell damage) ──────────────────────────
    {
        id: 'mage_arc_1', class: 'MAGE', branch: 'Arcane', tier: 1,
        icon: '✨', name: 'Spell Amp',
        description: '+12% spell damage',
        cost: 80,
        apply: (p) => { p.damageMultiplier += 0.12; },
    },
    {
        id: 'mage_arc_2', class: 'MAGE', branch: 'Arcane', tier: 2,
        icon: '✨', name: 'Arcane Mastery',
        description: '+22% spell damage',
        cost: 160,
        apply: (p) => { p.damageMultiplier += 0.22; },
    },
    {
        id: 'mage_arc_3', class: 'MAGE', branch: 'Arcane', tier: 3,
        icon: '🌟', name: 'Overcharge',
        description: '+35% spell damage',
        cost: 300,
        apply: (p) => { p.damageMultiplier += 0.35; },
    },

    // ── Branch 2: Frost (crit & control) ─────────────────────────
    {
        id: 'mage_frost_1', class: 'MAGE', branch: 'Frost', tier: 1,
        icon: '❄️', name: 'Cold Blood',
        description: '+8% critical hit chance',
        cost: 80,
        apply: (p) => { p.critChanceBonus = (p.critChanceBonus || 0) + 0.08; },
    },
    {
        id: 'mage_frost_2', class: 'MAGE', branch: 'Frost', tier: 2,
        icon: '❄️', name: 'Glacial Heart',
        description: '+15% critical hit chance',
        cost: 160,
        apply: (p) => { p.critChanceBonus = (p.critChanceBonus || 0) + 0.15; },
    },
    {
        id: 'mage_frost_3', class: 'MAGE', branch: 'Frost', tier: 3,
        icon: '🧊', name: 'Absolute Zero',
        description: '+10% damage reduction while attacking',
        cost: 300,
        apply: (p) => { p.damageReduction = Math.min(0.75, p.damageReduction + 0.10); },
    },

    // ── Branch 3: Resilience (stamina & survival) ─────────────────
    {
        id: 'mage_res_1', class: 'MAGE', branch: 'Resilience', tier: 1,
        icon: '🔮', name: 'Mana Reserve',
        description: '+30 max stamina',
        cost: 80,
        apply: (p) => { p.maxStamina += 30; p.stamina = Math.min(p.stamina + 30, p.maxStamina); },
    },
    {
        id: 'mage_res_2', class: 'MAGE', branch: 'Resilience', tier: 2,
        icon: '🔮', name: 'Arcane Flow',
        description: 'Faster stamina regeneration',
        cost: 160,
        apply: (p) => { p.staminaRegen += 0.05; },
    },
    {
        id: 'mage_res_3', class: 'MAGE', branch: 'Resilience', tier: 3,
        icon: '💜', name: "Sorcerer's Aegis",
        description: '+30 max HP & +20 max stamina',
        cost: 300,
        apply: (p) => {
            p.maxHealth  += 30; p.health  = Math.min(p.health  + 30, p.maxHealth);
            p.maxStamina += 20; p.stamina = Math.min(p.stamina + 20, p.maxStamina);
        },
    },

    // ══════════════════════════════════════════════════════════════
    //  ROGUE  — branches: Lethality · Shadow · Endurance
    // ══════════════════════════════════════════════════════════════

    // ── Branch 1: Lethality (crit) ───────────────────────────────
    {
        id: 'rogue_leth_1', class: 'ROGUE', branch: 'Lethality', tier: 1,
        icon: '🗡️', name: 'Keen Edge',
        description: '+10% critical hit chance',
        cost: 80,
        apply: (p) => { p.critChanceBonus = (p.critChanceBonus || 0) + 0.10; },
    },
    {
        id: 'rogue_leth_2', class: 'ROGUE', branch: 'Lethality', tier: 2,
        icon: '🗡️', name: "Assassin's Focus",
        description: '+20% critical hit chance',
        cost: 160,
        apply: (p) => { p.critChanceBonus = (p.critChanceBonus || 0) + 0.20; },
    },
    {
        id: 'rogue_leth_3', class: 'ROGUE', branch: 'Lethality', tier: 3,
        icon: '💀', name: 'Death Mark',
        description: '+30% crit chance & +15% damage',
        cost: 300,
        apply: (p) => { p.critChanceBonus = (p.critChanceBonus || 0) + 0.30; p.damageMultiplier += 0.15; },
    },

    // ── Branch 2: Shadow (speed & evasion) ───────────────────────
    {
        id: 'rogue_shad_1', class: 'ROGUE', branch: 'Shadow', tier: 1,
        icon: '👻', name: 'Ghost Step',
        description: '+40 movement speed',
        cost: 80,
        apply: (p) => { p.speed += 40; },
    },
    {
        id: 'rogue_shad_2', class: 'ROGUE', branch: 'Shadow', tier: 2,
        icon: '👻', name: 'Phantom',
        description: '+60 movement speed',
        cost: 160,
        apply: (p) => { p.speed += 60; },
    },
    {
        id: 'rogue_shad_3', class: 'ROGUE', branch: 'Shadow', tier: 3,
        icon: '🌑', name: 'Shadow Form',
        description: '+80 speed & 8% damage reduction',
        cost: 300,
        apply: (p) => { p.speed += 80; p.damageReduction = Math.min(0.75, p.damageReduction + 0.08); },
    },

    // ── Branch 3: Endurance (stamina & HP) ───────────────────────
    {
        id: 'rogue_end_1', class: 'ROGUE', branch: 'Endurance', tier: 1,
        icon: '💪', name: 'Survivalist',
        description: '+20 max HP',
        cost: 80,
        apply: (p) => { p.maxHealth += 20; p.health = Math.min(p.health + 20, p.maxHealth); },
    },
    {
        id: 'rogue_end_2', class: 'ROGUE', branch: 'Endurance', tier: 2,
        icon: '💪', name: 'Iron Resolve',
        description: '+20 max stamina',
        cost: 160,
        apply: (p) => { p.maxStamina += 20; p.stamina = Math.min(p.stamina + 20, p.maxStamina); },
    },
    {
        id: 'rogue_end_3', class: 'ROGUE', branch: 'Endurance', tier: 3,
        icon: '⚡', name: 'Second Wind',
        description: '+30 max HP & faster stamina regen',
        cost: 300,
        apply: (p) => { p.maxHealth += 30; p.health = Math.min(p.health + 30, p.maxHealth); p.staminaRegen += 0.04; },
    },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Returns all talents for a given class key ('WARRIOR' | 'MAGE' | 'ROGUE'). */
export function getTalentsByClass(className) {
    return TALENTS.filter(t => t.class === className);
}

/** Groups talents by branch, ordered by tier. */
export function getBranchesByClass(className) {
    const classTalents = getTalentsByClass(className);
    const branches = {};
    for (const t of classTalents) {
        if (!branches[t.branch]) branches[t.branch] = [];
        branches[t.branch].push(t);
    }
    // Sort each branch by tier
    for (const b of Object.values(branches)) b.sort((a, z) => a.tier - z.tier);
    return branches;   // { BranchName: [tier1, tier2, tier3] }
}

/** Returns the prerequisite talent id for a given talent (tier N requires tier N-1 in same branch). */
export function getPrerequisite(talent) {
    if (talent.tier === 1) return null;
    return TALENTS.find(t =>
        t.class === talent.class &&
        t.branch === talent.branch &&
        t.tier === talent.tier - 1
    )?.id || null;
}

/** Class display metadata (colour, icon). */
export const CLASS_META = {
    WARRIOR: { label: 'WARRIOR', icon: '⚔️', color: '#ff7733', hex: 0xff5500 },
    MAGE:    { label: 'MAGE',    icon: '🔮', color: '#5599ff', hex: 0x3366ff },
    ROGUE:   { label: 'ROGUE',   icon: '🗡️', color: '#cc66ff', hex: 0xaa44cc },
};
