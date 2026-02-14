// weaponData.js - All weapon definitions
export const WEAPONS = {
    SWORD: {
        name: 'SWORD',
        icon: '⚔️',
        color: 0xffaa00,
        description: 'Épée équilibrée - Slash en croissant',
        projectile: {
            type: 'slash',
            size: 14,
            speed: 800,
            damage: 22,
            color: 0xffaa00,
            count: 1,
            range: 200,
            cooldown: 250,
            piercing: true
        },
        charged: {
            name: 'WHIRLWIND',
            chargeTime: 1200,
            staminaCost: 30,
            damage: 45,
            radius: 100,
            hits: 3,
            knockback: true
        }
    },
    
    BOW: {
        name: 'BOW',
        icon: '🏹',
        color: 0x88dd88,
        description: 'Arc long - Tir précis à longue portée',
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
            chargeTime: 1500,
            staminaCost: 35,
            damage: 120,
            arrows: 8,
            radius: 150,
            aoe: true
        }
    },
    
    STAFF: {
        name: 'STAFF',
        icon: '🔮',
        color: 0x8888ff,
        description: 'Bâton magique - Orbes téléguidés',
        projectile: {
            type: 'orb',
            size: 12,
            speed: 900,
            damage: 16,
            color: 0x8888ff,
            count: 1,
            range: 400,
            cooldown: 200,
            homing: true,
            homingStrength: 0.03
        },
        charged: {
            name: 'FIREBALL',
            chargeTime: 1400,
            staminaCost: 40,
            damage: 40,
            radius: 120,
            explosion: true,
            dotDamage: 5,
            dotTicks: 4,
            dotInterval: 500
        }
    },
    
    DAGGERS: {
        name: 'DAGGERS',
        icon: '🗡️',
        color: 0xcc88cc,
        description: 'Dagues - Tir en éventail rapide',
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
        description: 'Espadon lent - Onde de choc repoussante',
        projectile: {
            type: 'shockwave',
            size: 24,
            speed: 600,
            damage: 32,
            color: 0xcc6600,
            count: 1,
            range: 300,
            cooldown: 500,
            knockback: true,
            knockbackForce: 200
        },
        charged: {
            name: 'GROUND SLAM',
            chargeTime: 1600,
            staminaCost: 45,
            damage: 55,
            radius: 130,
            stun: true,
            stunDuration: 1000
        }
    }
};