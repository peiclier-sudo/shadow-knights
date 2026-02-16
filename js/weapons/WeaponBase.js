// WeaponBase.js - Classe de base pour toutes les armes (FIXED - charge minimale requise)
export class WeaponBase {
    constructor(scene, player, weaponData) {
        this.scene = scene;
        this.player = player;
        this.data = weaponData;
        this.lastShotTime = 0;
        this.isCharging = false;
        this.chargeLevel = 0;
        this.chargeStartTime = 0;
    }
    
    // Méthode appelée pour tirer
    attack(angle) {
        if (!this.canAttack()) return false;
        
        this.lastShotTime = Date.now();
        this.player.stamina -= 7;
        this.player.canAttack = false;
        
        // Tir principal
        this.fire(angle);

        // Arcane Surge: next 3 shots fire 3 projectiles each (1 main + 2 side shots)
        if ((this.player.multishotCount || 0) > 0) {
            const spread = Phaser.Math.DegToRad(12);
            this.fire(angle - spread);
            this.fire(angle + spread);

            this.player.multishotCount--;
            if (this.player.multishotCount <= 0) {
                this.player.multishot = 0;
            }
        }
        
        // Reset cooldown
        this.scene.time.delayedCall(this.data.projectile.cooldown, () => {
            this.player.canAttack = true;
        });
        
        return true;
    }
    
    // Vérifie si on peut attaquer
    canAttack() {
        const now = Date.now();
        const cooldownOk = now - this.lastShotTime >= this.data.projectile.cooldown;
        return cooldownOk && this.player.stamina >= 7 && this.player.canAttack;
    }
    
    // À surcharger par chaque arme
    fire(angle) {
        console.warn('fire() must be implemented by weapon');
    }
    
    // Démarrer la charge
    startCharge() {
        this.isCharging = true;
        this.chargeStartTime = Date.now();
        this.chargeLevel = 0;
    }
    
    // Mettre à jour la charge
    updateCharge() {
        if (!this.isCharging) return;
        
        const elapsed = Date.now() - this.chargeStartTime;
        this.chargeLevel = Math.min(1, elapsed / this.data.charged.chargeTime);
    }
    
    // Libérer la charge
    releaseCharge(angle) {
        if (!this.isCharging) return false;
        
        this.isCharging = false;
        
        // ✅ FIX: Vérifier la charge minimale (30% par défaut, 100% si fullChargeRequired)
        const minCharge = this.data.charged.fullChargeRequired ? 1.0 : 0.3;
        
        if (this.chargeLevel < minCharge) {
            console.log(`⚠️ Charge insuffisante: ${Math.floor(this.chargeLevel * 100)}% (min: ${Math.floor(minCharge * 100)}%)`);
            return false;
        }
        
        if (this.player.stamina < this.data.charged.staminaCost) {
            console.log(`⚠️ Pas assez de stamina: ${Math.floor(this.player.stamina)}/${this.data.charged.staminaCost}`);
            return false;
        }
        
        this.player.stamina -= this.data.charged.staminaCost;
        this.createChargeReleaseBurst(angle);
        this.executeChargedAttack(angle);
        
        console.log(`✅ Charged attack! Level: ${Math.floor(this.chargeLevel * 100)}%`);
        
        return true;
    }
    
    // À surcharger par chaque arme
    executeChargedAttack(angle) {
        console.warn('executeChargedAttack() must be implemented by weapon');
    }
    
    // Créer un effet de flash (utilitaire)
    createMuzzleFlash(x, y, color) {
        const flash = this.scene.add.circle(x, y, 14, color, 0.62).setDepth(165);
        const ringA = this.scene.add.circle(x, y, 20, color, 0)
            .setStrokeStyle(2, color, 0.8)
            .setDepth(164);
        const ringB = this.scene.add.circle(x, y, 28, 0xffffff, 0)
            .setStrokeStyle(1, color, 0.45)
            .setDepth(163);

        const sigil = this.scene.add.graphics().setDepth(166);
        sigil.lineStyle(2, color, 0.65);
        sigil.strokeCircle(x, y, 16);
        sigil.beginPath();
        sigil.arc(x, y, 24, -0.4, 0.4);
        sigil.strokePath();
        sigil.beginPath();
        sigil.arc(x, y, 24, Math.PI - 0.4, Math.PI + 0.4);
        sigil.strokePath();

        this.scene.tweens.add({
            targets: flash,
            scale: 2,
            alpha: 0,
            duration: 140,
            ease: 'Cubic.easeOut',
            onComplete: () => flash.destroy()
        });

        this.scene.tweens.add({
            targets: [ringA, ringB],
            scale: 1.55,
            alpha: 0,
            duration: 220,
            ease: 'Sine.easeOut',
            onComplete: () => {
                ringA.destroy();
                ringB.destroy();
            }
        });

        this.scene.tweens.add({
            targets: sigil,
            alpha: 0,
            angle: 70,
            duration: 260,
            ease: 'Cubic.easeOut',
            onComplete: () => sigil.destroy()
        });
    }

    createChargeReleaseBurst(angle) {
        const x = this.player.x + Math.cos(angle) * 24;
        const y = this.player.y + Math.sin(angle) * 24;
        const color = this.data?.color || 0xffffff;

        const cone = this.scene.add.graphics().setDepth(168);
        cone.fillStyle(color, 0.28);
        cone.slice(x, y, 68, angle - 0.45, angle + 0.45, false);
        cone.fillPath();

        const ring = this.scene.add.circle(x, y, 24, color, 0).setStrokeStyle(3, color, 0.8).setDepth(169);

        this.scene.tweens.add({
            targets: cone,
            alpha: 0,
            scaleX: 1.3,
            scaleY: 0.9,
            duration: 180,
            onComplete: () => cone.destroy()
        });

        this.scene.tweens.add({
            targets: ring,
            alpha: 0,
            scale: 2.2,
            duration: 260,
            ease: 'Expo.easeOut',
            onComplete: () => ring.destroy()
        });
    }

    // Ajouter un trail (utilitaire)
    addTrail(proj, color, size) {
        const trailEvent = this.scene.time.addEvent({
            delay: 34,
            repeat: 10,
            callback: () => {
                if (!proj || !proj.scene) {
                    trailEvent.remove(false);
                    return;
                }

                const trail = this.scene.add.circle(proj.x, proj.y, size * 0.62, color, 0.2).setDepth(140);
                const halo = this.scene.add.circle(proj.x, proj.y, size * 0.95, color, 0).setStrokeStyle(1, color, 0.25).setDepth(139);

                this.scene.tweens.add({
                    targets: [trail, halo],
                    alpha: 0,
                    scale: 0.3,
                    duration: 230,
                    ease: 'Sine.easeOut',
                    onComplete: () => {
                        trail.destroy();
                        halo.destroy();
                    }
                });

                if (Math.random() > 0.5) {
                    const ember = this.scene.add.circle(
                        proj.x + Phaser.Math.Between(-4, 4),
                        proj.y + Phaser.Math.Between(-4, 4),
                        Phaser.Math.FloatBetween(1.2, 2.4),
                        color,
                        0.75
                    ).setDepth(141);

                    this.scene.tweens.add({
                        targets: ember,
                        alpha: 0,
                        y: ember.y - Phaser.Math.Between(4, 10),
                        duration: Phaser.Math.Between(90, 160),
                        onComplete: () => ember.destroy()
                    });
                }
            }
        });
    }

    // Réinitialiser la charge (quand annulée)
    resetCharge() {
        this.isCharging = false;
        this.chargeLevel = 0;
    }

    getNormalRange() {
        return this.data?.projectile?.range || 0;
    }

    getChargedPreviewConfig() {
        const charged = this.data?.charged || {};
        return {
            targeting: charged.targeting || 'line',
            maxRange: charged.maxRange || charged.length || 0,
            aoeRadius: charged.radius || 0
        };
    }

    getClampedChargedTarget(targetX, targetY) {
        const config = this.getChargedPreviewConfig();
        const maxRange = config.maxRange;

        if (!maxRange || config.targeting === 'self') {
            return { x: targetX, y: targetY };
        }

        const dx = targetX - this.player.x;
        const dy = targetY - this.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= maxRange || dist === 0) {
            return { x: targetX, y: targetY };
        }

        const ratio = maxRange / dist;
        return {
            x: this.player.x + dx * ratio,
            y: this.player.y + dy * ratio
        };
    }
}
