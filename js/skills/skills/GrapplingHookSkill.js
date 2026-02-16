// GrapplingHookSkill.js - Warrior skill: Grappling hook to dash to enemies
import { SkillBase } from '../SkillBase.js';
import { SKILL_DATA } from '../skillData.js';

export class GrapplingHookSkill extends SkillBase {
    constructor(scene, player) {
        super(scene, player, SKILL_DATA.grapplingHook);
        this.maxRange = 500;
        this.isTargeting = false;
        this.targetingGraphics = null;
        this.directionMarker = null;
        this.waitingForConfirmKeyRelease = false;
    }
    
    use() {
        if (!this.isTargeting) {
            if (!this.canUse()) return false;
            this.startTargeting();
            return true;
        }

        if (this.waitingForConfirmKeyRelease) {
            return false;
        }

        this.confirmFromCursor();
        return true;
    }

    startTargeting() {
        this.isTargeting = true;
        this.waitingForConfirmKeyRelease = true;
        this.targetingGraphics = this.scene.add.graphics();
        this.targetingGraphics.setDepth(95);
        this.directionMarker = this.scene.add.circle(this.player.x, this.player.y, 8, 0xffaa00, 0.25)
            .setStrokeStyle(2, 0xffaa00, 0.9)
            .setDepth(96);
    }

    cancelTargeting() {
        this.isTargeting = false;
        this.waitingForConfirmKeyRelease = false;
        if (this.targetingGraphics) {
            this.targetingGraphics.destroy();
            this.targetingGraphics = null;
        }
        if (this.directionMarker) {
            this.directionMarker.destroy();
            this.directionMarker = null;
        }
    }


    confirmFromCursor() {
        const pointer = this.scene.input.activePointer;
        const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.confirmTarget(worldPoint.x, worldPoint.y);
    }

    handleConfirmKeyUp() {
        this.waitingForConfirmKeyRelease = false;
    }

    confirmTarget(targetX, targetY) {
        const boss = this.scene.boss;
        if (!boss) {
            this.cancelTargeting();
            return;
        }

        const dirX = targetX - this.player.x;
        const dirY = targetY - this.player.y;
        const dirLength = Math.sqrt(dirX * dirX + dirY * dirY);
        if (dirLength <= 1) {
            this.cancelTargeting();
            return;
        }

        const normalizedDirX = dirX / dirLength;
        const normalizedDirY = dirY / dirLength;

        const toBossX = boss.x - this.player.x;
        const toBossY = boss.y - this.player.y;
        const distance = Math.sqrt(toBossX * toBossX + toBossY * toBossY);
        const normalizedBossX = toBossX / Math.max(distance, 1);
        const normalizedBossY = toBossY / Math.max(distance, 1);

        const alignment = normalizedDirX * normalizedBossX + normalizedDirY * normalizedBossY;
        const minAlignment = 0.92; // ~23° cone around cursor direction

        if (distance > this.maxRange || alignment < minAlignment) {
            this.showFailText(distance > this.maxRange ? 'TOO FAR!' : 'BAD DIRECTION!');
            this.cancelTargeting();
            return;
        }

        if (!super.use()) {
            this.cancelTargeting();
            return;
        }

        console.log(`🪝 GRAPPLING! Distance: ${Math.floor(distance)}px`);
        this.cancelTargeting();
        // ✅ Créer la corde du grappin
        const rope = this.scene.add.graphics();
        rope.setDepth(100);
        
        const startX = this.player.x;
        const startY = this.player.y;
        
        // ✅ Animation du lancer du grappin
        let ropeProgress = 0;
        const ropeTween = this.scene.tweens.add({
            targets: { progress: 0 },
            progress: 1,
            duration: 200,
            onUpdate: (tween) => {
                ropeProgress = tween.getValue();
                rope.clear();
                
                // Dessiner la corde
                rope.lineStyle(3, 0xffaa00, 0.8);
                if (!boss.scene) {
                    rope.clear();
                    return;
                }

                const currentX = startX + (boss.x - startX) * ropeProgress;
                const currentY = startY + (boss.y - startY) * ropeProgress;
                rope.lineBetween(startX, startY, currentX, currentY);
                
                // Grappin au bout de la corde
                const hook = this.scene.add.circle(currentX, currentY, 6, 0xffaa00);
                hook.setDepth(101);
                
                this.scene.time.delayedCall(50, () => {
                    if (hook.scene) hook.destroy();
                });
            },
            onComplete: () => {
                // ✅ Le grappin a atteint le boss, maintenant tirer le joueur
                if (!boss.scene) {
                    if (rope.scene) rope.destroy();
                    this.player.isInvulnerable = false;
                    this.player.isDashing = false;
                    return;
                }

                this.pullPlayerToBoss(startX, startY, boss, rope);
            }
        });
        
        // ✅ Effet de lancer du grappin
        const launchFlash = this.scene.add.circle(this.player.x, this.player.y, 20, 0xffaa00, 0.6);
        this.scene.tweens.add({
            targets: launchFlash,
            scale: 2,
            alpha: 0,
            duration: 200,
            onComplete: () => launchFlash.destroy()
        });
        
        return true;
    }

    showFailText(text) {
        const failText = this.scene.add.text(this.player.x, this.player.y - 50, text, {
            fontSize: '24px',
            fill: '#ff0000',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.scene.tweens.add({
            targets: failText,
            y: this.player.y - 100,
            alpha: 0,
            duration: 800,
            onComplete: () => failText.destroy()
        });
    }

    update() {
        if (!this.isTargeting || !this.targetingGraphics) return;

        const pointer = this.scene.input.activePointer;
        const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);

        const dx = worldPoint.x - this.player.x;
        const dy = worldPoint.y - this.player.y;
        const length = Math.sqrt(dx * dx + dy * dy) || 1;
        const clampedLength = Math.min(length, this.maxRange);
        const endX = this.player.x + (dx / length) * clampedLength;
        const endY = this.player.y + (dy / length) * clampedLength;

        this.targetingGraphics.clear();
        this.targetingGraphics.lineStyle(2, 0xffaa00, 0.35);
        this.targetingGraphics.strokeCircle(this.player.x, this.player.y, this.maxRange);
        this.targetingGraphics.lineStyle(3, 0xffaa00, 0.7);
        this.targetingGraphics.lineBetween(this.player.x, this.player.y, endX, endY);

        this.directionMarker.setPosition(endX, endY);
    }
    
    pullPlayerToBoss(startX, startY, boss, rope) {
        // ✅ Calculer la position d'arrivée (un peu avant le boss pour ne pas le traverser)
        const angle = Math.atan2(boss.y - startY, boss.x - startX);
        const stopDistance = 80;  // Distance d'arrêt devant le boss
        const targetX = boss.x - Math.cos(angle) * stopDistance;
        const targetY = boss.y - Math.sin(angle) * stopDistance;
        
        // ✅ Rendre le joueur invulnérable pendant le grappling
        this.player.isInvulnerable = true;
        this.player.isDashing = true;
        
        // ✅ Effet de trail pendant le mouvement
        // Utilise un timer Phaser (au lieu de setInterval natif) pour éviter les crashs
        // lors des transitions de scène / destruction d'objets.

        // ✅ Tirer le joueur vers le boss
        const trailEvent = this.scene.time.addEvent({
            delay: 30,
            repeat: 10,
            callback: () => {
                const trail = this.scene.add.circle(
                    this.player.x, this.player.y,
                    15,
                    0xffaa00,
                    0.3
                );

                this.scene.tweens.add({
                    targets: trail,
                    alpha: 0,
                    scale: 0.5,
                    duration: 300,
                    onComplete: () => trail.destroy()
                });
            }
        });

        this.scene.tweens.add({
            targets: this.player,
            x: targetX,
            y: targetY,
            duration: 250,
            ease: 'Power2',
            onUpdate: () => {
                // Mettre à jour la corde pendant le mouvement
                if (!boss.scene) {
                    if (rope.scene) rope.destroy();
                    if (trailEvent && !trailEvent.hasDispatched) trailEvent.remove(false);
                    return;
                }

                rope.clear();
                rope.lineStyle(3, 0xffaa00, 0.8);
                rope.lineBetween(this.player.x, this.player.y, boss.x, boss.y);
            },
            onComplete: () => {
                // ✅ Arrivée sur le boss
                this.player.isInvulnerable = false;
                this.player.isDashing = false;
                
                // Détruire la corde
                if (rope.scene) rope.destroy();
                if (trailEvent && !trailEvent.hasDispatched) trailEvent.remove(false);

                if (!boss.scene) {
                    console.log('🎯 GRAPPLE finished but boss no longer exists.');
                    return;
                }
                
                // ✅ Effet d'impact
                const impact = this.scene.add.circle(this.player.x, this.player.y, 30, 0xffaa00, 0.5);
                this.scene.tweens.add({
                    targets: impact,
                    scale: 2,
                    alpha: 0,
                    duration: 300,
                    onComplete: () => impact.destroy()
                });
                
                // ✅ Particules d'impact
                for (let i = 0; i < 12; i++) {
                    const particleAngle = (i / 12) * Math.PI * 2;
                    const particle = this.scene.add.circle(
                        this.player.x,
                        this.player.y,
                        4,
                        0xffaa00,
                        0.7
                    );
                    
                    this.scene.tweens.add({
                        targets: particle,
                        x: this.player.x + Math.cos(particleAngle) * 50,
                        y: this.player.y + Math.sin(particleAngle) * 50,
                        alpha: 0,
                        scale: 0.5,
                        duration: 300,
                        onComplete: () => particle.destroy()
                    });
                }
                
                // ✅ Petit screen shake
                this.scene.cameras.main.shake(100, 0.005);

                // Apply vulnerability debuff: +30% damage taken for 6s
                boss.damageTakenMultiplier = 1.3;
                boss.setTint(0xffc266);

                if (boss.vulnerabilityTimer) {
                    boss.vulnerabilityTimer.remove(false);
                    boss.vulnerabilityTimer = null;
                }

                boss.vulnerabilityTimer = this.scene.time.delayedCall(6000, () => {
                    if (!boss.scene) return;
                    boss.damageTakenMultiplier = 1.0;
                    if (!boss.frozen && !boss.stunned) {
                        boss.clearTint();
                    }
                    boss.vulnerabilityTimer = null;
                });

                const debuffText = this.scene.add.text(boss.x, boss.y - 80, 'VULNERABLE!', {
                    fontSize: '22px',
                    fill: '#ffc266',
                    stroke: '#000',
                    strokeThickness: 4,
                    fontStyle: 'bold'
                }).setOrigin(0.5);

                this.scene.tweens.add({
                    targets: debuffText,
                    y: boss.y - 120,
                    alpha: 0,
                    duration: 700,
                    onComplete: () => debuffText.destroy()
                });
                
                console.log(`🎯 GRAPPLED to boss!`);
            }
        });
    }
}
