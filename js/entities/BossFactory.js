// BossFactory.js - Creates boss instances
import { Boss } from './Boss.js';
import { SentinelBoss } from './bosses/SentinelBoss.js';
import { GunnerBoss } from './bosses/GunnerBoss.js';
import { DasherBoss } from './bosses/DasherBoss.js';
import { PhantomBoss } from './bosses/PhantomBoss.js';
import { NebulaBoss } from './bosses/NebulaBoss.js';
import { OverclockBoss } from './bosses/OverclockBoss.js';

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
                return new PhantomBoss(scene);
            case 5:
                return new NebulaBoss(scene);
            case 6:
                return new OverclockBoss(scene);
            default:
                return new Boss(scene, bossId);
        }
    }
}
