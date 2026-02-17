// BossFactory.js - Creates boss instances
import { Boss } from './Boss.js';
import { SentinelBoss } from './bosses/SentinelBoss.js';
import { GunnerBoss } from './bosses/GunnerBoss.js';
import { DasherBoss } from './bosses/DasherBoss.js';
import { OverlordBoss } from './bosses/OverlordBoss.js';

export class BossFactory {
    static createBoss(scene, bossId) {
        switch(bossId) {
            case 1:
                return new SentinelBoss(scene);
            case 2:
                return new GunnerBoss(scene);
            case 3:
                return new DasherBoss(scene);
            case 4:
                return new OverlordBoss(scene);
            default:
                return new Boss(scene, bossId);
        }
    }
}