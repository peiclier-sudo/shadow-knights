// FrostNovaSkill.js - Mage skill: Freeze enemies
import { SkillBase } from '../SkillBase.js';
import { SKILL_DATA } from '../skillData.js';

export class FrostNovaSkill extends SkillBase {
    constructor(scene, player) {
        super(scene, player, SKILL_DATA.frostNova);
    }
    
    use() {
        if (!super.use()) return false;
        
        const boss = this.scene.boss;
        if (!boss) return false;

        const freezeDuration = 2000;
        
        // Ice explosion effect
        for (let i = 0; i < 24; i++) {
            const angle = (i / 24) * Math.PI * 2;
            const ice = this.scene.add.circle(
                this.player.x,
                this.player.y,
                8,
                0x88ccff,
                0.7
            );
            
            this.scene.tweens.add({
                targets: ice,
                x: this.player.x + Math.cos(angle) * 200,
                y: this.player.y + Math.sin(angle) * 200,
                alpha: 0,
                scale: 0.5,
                duration: 500,
                ease: 'Power2',
                onComplete: () => ice.destroy()
            });
        }

        // Freeze boss and cancel active attack flow
        boss.frozen = true;
        boss.isAttacking = false;
        boss.setTint(0x88ccff);

        // If a previous freeze timer exists, replace it so recasts extend freeze cleanly.
        if (boss.freezeTimer) {
            boss.freezeTimer.remove(false);
            boss.freezeTimer = null;
        }

        // Ice crystals around boss
        for (let i = 0; i < 8; i++) {
            const crystal = this.scene.add.rectangle(
                boss.x + (Math.random() - 0.5) * 80,
                boss.y + (Math.random() - 0.5) * 80,
                5,
                15,
                0xaaddff,
                0.6
            );
            crystal.setRotation(Math.random() * Math.PI);
            
            this.scene.tweens.add({
                targets: crystal,
                alpha: 0,
                duration: freezeDuration,
                onComplete: () => crystal.destroy()
            });
        }

        // Unfreeze after duration
        boss.freezeTimer = this.scene.time.delayedCall(freezeDuration, () => {
            if (!boss.scene) return;
            boss.frozen = false;
            boss.clearTint();
            boss.freezeTimer = null;
        });
        
        return true;
    }
}