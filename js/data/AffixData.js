// AffixData.js - Infinite tower affix definitions
// Each affix modifies boss behaviour when applied

export const AFFIXES = {
    BERSERKER: {
        name: 'BERSERKER',
        color: 0xff3333,
        textColor: '#ff6666',
        desc: 'Phase 2 triggers at 75% HP',
        apply(boss) {
            boss._berserkerThreshold = 0.75;
        }
    },
    ARMORED: {
        name: 'ARMORED',
        color: 0x778899,
        textColor: '#aabbcc',
        desc: 'Takes 40% less damage',
        apply(boss) {
            boss.damageTakenMultiplier *= 0.6;
        }
    },
    RAMPAGE: {
        name: 'RAMPAGE',
        color: 0xff8800,
        textColor: '#ffaa44',
        desc: '35% faster attacks',
        apply(boss) {
            boss._rampageMult = 0.65;
        }
    },
    VOLATILE: {
        name: 'VOLATILE',
        color: 0xffdd00,
        textColor: '#ffe666',
        desc: 'Fires extra stray projectiles',
        apply(boss) {
            boss._volatile = true;
        }
    },
    WARDEN: {
        name: 'WARDEN',
        color: 0x44ff88,
        textColor: '#88ffaa',
        desc: 'Heals 30 HP every 4 seconds',
        apply(boss) {
            boss._wardenHeal = true;
            boss._wardenTimer = 0;
        }
    },
    SHIELDED: {
        name: 'SHIELDED',
        color: 0x4488ff,
        textColor: '#88aaff',
        desc: 'Starts with a 200 HP absorb shield',
        apply(boss) {
            boss.shield = 200;
            boss.maxShield = 200;
        }
    },
    FRENZIED: {
        name: 'FRENZIED',
        color: 0xcc44ff,
        textColor: '#dd88ff',
        desc: 'Double attack speed in phase 2',
        apply(boss) {
            boss._frenzied = true;
        }
    },
    MIRRORED: {
        name: 'MIRRORED',
        color: 0x00ffee,
        textColor: '#66ffee',
        desc: 'Projectiles also fire from opposite side',
        apply(boss) {
            boss._mirrored = true;
        }
    }
};

// Generate a deterministic floor config from a floor number
export function getEndlessFloor(floorNum) {
    const bossId = ((floorNum - 1) % 10) + 1;
    // One new affix unlocks every 3 floors, up to 3 total
    const affixCount = Math.min(Math.floor((floorNum - 1) / 3) + 1, 3);

    const affixKeys = Object.keys(AFFIXES);
    const selected = [];
    const used = new Set();

    // Simple seeded LCG from floor number
    let s = floorNum * 7919 + 1;
    const rand = () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 0xffffffff;
    };

    for (let i = 0; i < affixCount && selected.length < affixKeys.length; i++) {
        let attempts = 0;
        let key;
        do {
            key = affixKeys[Math.floor(rand() * affixKeys.length)];
            attempts++;
        } while (used.has(key) && attempts < 30);
        if (!used.has(key)) {
            used.add(key);
            selected.push(key);
        }
    }

    // HP scales +8% per floor
    const hpMult = 1 + (floorNum - 1) * 0.08;

    return { bossId, affixes: selected, hpMult };
}

// Difficulty star count for a floor
export function getFloorStars(floorNum) {
    if (floorNum <= 3) return 1;
    if (floorNum <= 6) return 2;
    if (floorNum <= 10) return 3;
    if (floorNum <= 20) return 4;
    return 5;
}
