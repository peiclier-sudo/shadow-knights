// weaponData.js - All weapon definitions (FIXED)
export const WEAPONS = {
    SWORD: {
        name: 'SWORD',
        icon: '⚔️',
        color: 0xffaa00,
        description: 'Sword - Fast slash / Piercing laser',
        projectile: {
            type: 'slash',
            size: 14,
            speed: 800,
            damage: 22,
            color: 0xffaa00,
            count: 1,
            range: 200,
            cooldown: 250,
            piercing: false  // ✅ FIXED - était true, maintenant false
        },
        charged: {
            name: 'PIERCING LASER',
            chargeTime: 1200,
            staminaCost: 35,
            damage: 60,
            width: 8,
            length: 2000,
            targeting: 'line',
            maxRange: 2000,
            speed: 2000,
            piercing: true,
            knockback: true,
            fullChargeRequired: true  // ✅ NOUVEAU - Nécessite charge complète (100%)
        }
    },
    
    BOW: {
        name: 'BOW',
        icon: '🏹',
        color: 0x88dd88,
        description: 'Bow - Precise shot / Cataclysm rain',
        projectile: {
            type: 'arrow',
            size: 8,
            speed: 1100,
            damage: 18,
            color: 0x88dd88,
            count: 1,
            range: 600,
            cooldown: 400,
            piercing: false
        },
        charged: {
            name: 'RAIN OF ARROWS',
            chargeTime: 2200,
            staminaCost: 35,
            damage: 240,
            arrows: 12,
            radius: 170,
            targeting: 'ground',
            maxRange: 550,
            aoe: true,
            fullChargeRequired: true
        }
    },
    
    STAFF: {
        name: 'STAFF',
        icon: '🔮',
        color: 0x8888ff,
        description: 'Staff - Piercing arcane orbs / Inferno lance',
        projectile: {
            type: 'orb',
            size: 12,
            speed: 900,
            damage: 24,
            color: 0x8888ff,
            count: 1,
            range: 400,
            cooldown: 200,
            homing: true,
            homingStrength: 0.03,
            piercing: true
        },
        charged: {
            name: 'FIREBALL',
            chargeTime: 1400,
            staminaCost: 40,
            damage: 90,
            targeting: 'line',
            maxRange: 500,
            fullChargeRequired: true,
            radius: 130,
            explosion: true,
            dotDamage: 9,
            dotTicks: 4,
            dotInterval: 500
        }
    },
    
    DAGGERS: {
        name: 'DAGGERS',
        icon: '🗡️',
        color: 0xcc88cc,
        description: 'Daggers - Spread throw / Poison cloud',
        projectile: {
            type: 'spread',
            size: 6,
            speed: 1000,
            damage: 12,
            color: 0xcc88cc,
            count: 3,
            spread: 0.3,
            range: 250,
            cooldown: 150,
            piercing: false
        },
        charged: {
            name: 'POISON CLOUD',
            chargeTime: 1000,
            staminaCost: 25,
            damage: 40,
            targeting: 'ground',
            maxRange: 350,
            fullChargeRequired: true,
            radius: 80,
            ticks: 5,
            tickRate: 500,
            slow: true
        }
    },
    
    GREATSWORD: {
        name: 'GREATSWORD',
        icon: '⚔️',
        color: 0xcc6600,
        description: 'Greatsword - Crushing wave / Colossus breaker',
        projectile: {
            type: 'shockwave',
            size: 24,
            speed: 600,
            damage: 38,
            color: 0xcc6600,
            count: 1,
            range: 300,
            cooldown: 500,
            knockback: false,
            knockbackForce: 0,
            piercing: false  // ✅ Aussi fixé ici
        },
        charged: {
            name: 'COLOSSUS BREAKER',
            chargeTime: 1350,
            staminaCost: 45,
            damage: 150,
            targeting: 'line',
            maxRange: 360,
            fullChargeRequired: true,
            radius: 95,
            stun: true,
            stunDuration: 1400
        }
    },

    THUNDER_GAUNTLET: {
        name: 'THUNDER GAUNTLET',
        icon: '⚡',
        color: 0x63c5ff,
        description: 'Thunder Gauntlet - Arc jabs / Blinkstrike recoil',
        projectile: {
            type: 'arcbolt',
            size: 7,
            speed: 1150,
            damage: 20,
            color: 0x63c5ff,
            count: 1,
            range: 240,
            cooldown: 170,
            piercing: false
        },
        charged: {
            name: 'THUNDER SNAPBACK',
            chargeTime: 1200,
            staminaCost: 38,
            damage: 85,
            targeting: 'line',
            maxRange: 460,
            fullChargeRequired: true,
            dashDuration: 160,
            returnDuration: 180,
            hitRadius: 90,
            vulnerabilityMultiplier: 1.2,
            vulnerabilityDuration: 2400
        }
    }
};
