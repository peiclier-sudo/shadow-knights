// BalanceConfig.js - All game balance numbers
export const BalanceConfig = {
    // Player base stats
    player: {
        baseHealth: 100,
        baseStamina: 100,
        baseSpeed: 360,
        staminaRegen: 0.18,
        projectileCost: 7,
        projectileCooldown: 250
    },
    
    // Dash settings
    dash: {
        baseSpeed: 1000,
        baseDuration: 180,
        baseCooldown: 800,
        staminaCost: 40
    },
    
    // Charge settings
    charge: {
        time: 1200,
        minCharge: 0.3,
        maxDamage: 50
    },
    
    // Damage multipliers
    damage: {
        normalProjectile: 18,
        chargedMultiplier: 1.5,
        critMultiplier: 2.0,
        critChance: 0.2
    },
    
    // Boss settings
    boss: {
        attackCooldownMin: 1400,
        attackCooldownMax: 2500,
        projectileSpeed: 350
    }
};