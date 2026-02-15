// RogueClass.js - Rogue
import { ClassBase } from './ClassBase.js';
import { CLASSES } from './classData.js';
import { BackstabSkill } from '../skills/skills/BackstabSkill.js';
import { SmokeBombSkill } from '../skills/skills/SmokeBombSkill.js';
import { EviscerateSkill } from '../skills/skills/EviscerateSkill.js';

export class RogueClass extends ClassBase {
    constructor(scene, player) {
        super(scene, player, CLASSES.ROGUE);
        this.isStealthed = false;
        this.critChance = 0.2;
    }
    
    createSkills() {
        this.skills = [
            new BackstabSkill(this.scene, this.player),
            new SmokeBombSkill(this.scene, this.player),
            new EviscerateSkill(this.scene, this.player)
        ];
    }
    
    // DASH spécifique au rogue (invisibilité)
    dash(directionX, directionY) {
        const result = super.dash(directionX, directionY);
        
        if (result) {
            this.enterStealth();
        }
        
        return result;
    }
    
    enterStealth() {
        this.isStealthed = true;
        this.player.alpha = 0.3;
        
        // Effet de fumée
        for (let i = 0; i < 10; i++) {
            const smoke = this.scene.add.circle(
                this.player.x, this.player.y,
                8 + Math.random() * 10,
                0x6600aa,
                0.2
            );
            
            this.scene.tweens.add({
                targets: smoke,
                x: smoke.x + (Math.random() - 0.5) * 100,
                y: smoke.y + (Math.random() - 0.5) * 100,
                alpha: 0,
                scale: 2,
                duration: 500,
                onComplete: () => smoke.destroy()
            });
        }
        
        // Sortir de l'invisibilité après 1.5s
        this.scene.time.delayedCall(1500, () => {
            this.isStealthed = false;
            this.player.alpha = 1;
        });
    }
    
    createDashEffect() {
        // Trail spécifique au rogue (plus sombre)
        const color = 0x6600aa;
        let count = 0;
        const interval = setInterval(() => {
            if (!this.player.isDashing || count > 5) {
                clearInterval(interval);
                return;
            }
            
            const afterimage = this.scene.add.circle(
                this.player.x, this.player.y,
                16, color, 0.15
            );
            
            this.scene.tweens.add({
                targets: afterimage,
                alpha: 0,
                scale: 1.2,
                duration: 200,
                onComplete: () => afterimage.destroy()
            });
            
            count++;
        }, 40);
    }
    
    update(time, delta) {
        super.update(time, delta);
        
        // Pulsation quand stealth
        if (this.isStealthed) {
            this.player.alpha = 0.3 + Math.sin(time * 0.01) * 0.1;
        }
    }
}