// weaponData.js - All weapon definitions
export const WEAPONS = {
    SWORD: {
        name: 'SWORD',
        icon: '⚔️',
        color: 0xffaa00,
        projectile: {
            type: 'slash',
            size: 14,
            speed: 800,
            damage: 22,
            color: 0xffaa00,
            count: 1
        },
        charged: {
            name: 'WHIRLWIND',
            chargeTime: 1200,
            staminaCost: 30,
            damage: 45,
            radius: 100,
            hits: 3
        }
    },
    
    BOW: {
        name: 'BOW',
        icon: '🏹',
        color: 0x88dd88,
        projectile: {
            type: 'arrow',
            size: 8,
            speed: 1100,
            damage: 18,
            color: 0x88dd88,
            count: 1
        },
        charged: {
            name: 'RAIN OF ARROWS',
            chargeTime: 1500,
            staminaCost: 35,
            damage: 15,
            arrows: 8,
            radius: 150
        }
    },
    
    STAFF: {
        name: 'STAFF',
        icon: '🔮',
        color: 0x8888ff,
        projectile: {
            type: 'orb',
            size: 12,
            speed: 900,
            damage: 16,
            color: 0x8888ff,
            count: 1,
            homing: true
        },
        charged: {
            name: 'FIREBALL',
            chargeTime: 1400,
            staminaCost: 40,
            damage: 40,
            radius: 120,
            explosion: true
        }
    },
    
    DAGGERS: {
        name: 'DAGGERS',
        icon: '🗡️',
        color: 0xcc88cc,
        projectile: {
            type: 'spread',
            size: 6,
            speed: 1000,
            damage: 12,
            color: 0xcc88cc,
            count: 3,
            spread: 0.3
        },
        charged: {
            name: 'POISON CLOUD',
            chargeTime: 1000,
            staminaCost: 25,
            damage: 8,
            radius: 80,
            ticks: 5
        }
    },
    
    GREATSWORD: {
        name: 'GREATSWORD',
        icon: '⚔️',
        color: 0xcc6600,
        projectile: {
            type: 'shockwave',
            size: 24,
            speed: 600,
            damage: 32,
            color: 0xcc6600,
            count: 1,
            knockback: true
        },
        charged: {
            name: 'GROUND SLAM',
            chargeTime: 1600,
            staminaCost: 45,
            damage: 55,
            radius: 130,
            stun: true
        }
    }
};