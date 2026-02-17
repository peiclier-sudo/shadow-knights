// BossFactory.js - Creates boss instances
import { Boss } from './Boss.js';
import { SentinelBoss } from './bosses/SentinelBoss.js';
import { GunnerBoss } from './bosses/GunnerBoss.js';
import { DasherBoss } from './bosses/DasherBoss.js';
import { PhantomBoss } from './bosses/PhantomBoss.js';
import { NebulaBoss } from './bosses/NebulaBoss.js';
import { OverclockBoss } from './bosses/OverclockBoss.js';
import { VortexBoss } from './bosses/VortexBoss.js';
import { EmberCrownBoss } from './bosses/EmberCrownBoss.js';
import { AuroraJudgeBoss } from './bosses/AuroraJudgeBoss.js';
import { NullKingBoss } from './bosses/NullKingBoss.js';

export class BossFactory {
    static createBoss(scene, bossId, towerFloor = 1) {
        switch(bossId) {
            case 1:
                return new SentinelBoss(scene, towerFloor);
            case 2:
                return new GunnerBoss(scene, towerFloor);
            case 3:
                return new DasherBoss(scene, towerFloor);
            case 4:
                return new PhantomBoss(scene, towerFloor);
            case 5:
                return new NebulaBoss(scene, towerFloor);
            case 6:
                return new OverclockBoss(scene, towerFloor);
            case 7:
                return new VortexBoss(scene, towerFloor);
            case 8:
                return new EmberCrownBoss(scene, towerFloor);
            case 9:
                return new AuroraJudgeBoss(scene, towerFloor);
            case 10:
                return new NullKingBoss(scene, towerFloor);
            default:
                return new Boss(scene, bossId, towerFloor);
        }
    }
}
