// ElectroGauntletWeapon.js - Electric gauntlet with arc punch and zap-in/zap-out execution
import { WeaponBase } from './WeaponBase.js';
import { WEAPONS } from './weaponData.js';

export class ElectroGauntletWeapon extends WeaponBase {
    constructor(scene, player) {
        super(scene, player, WEAPONS.ELECTRO_GAUNTLET);

        this.maxRange = this.data?.charged?.maxRange || 460;
        this.isTargeting = false;
        this.targetingGraphics = null;
        this.directionMarker = null;
        this.waitingForConfirmRelease = false;
        this.pendingCharged = false;

        this.scene.events.on('update', this.update, this);
        this.scene.events.once('shutdown', () => {
            this.cancelTargeting();
            this.scene.events.off('update', this.update, this);
        });
    }

    startCharge() {
        if (this.isTargeting) return;
        super.startCharge();
    }

    updateCharge() {
        if (this.isTargeting) return;
        super.updateCharge();
    }

    releaseCharge(angle) {
        if (this.isTargeting) {
            if (this.waitingForConfirmRelease) return true;
            this.confirmFromCursor();
            return true;
        }

        if (!this.isCharging) return false;
        this.isCharging = false;

        const minCharge = this.data.charged.fullChargeRequired ? 1.0 : 0.3;
        if (this.chargeLevel < minCharge) {
            return false;
        }

        if (this.player.stamina < this.data.charged.staminaCost) {
            return false;
        }

        this.pendingCharged = true;
        this.createChargeReleaseBurst(angle);
        this.startTargeting();
        return true;
    }

    fire(angle) {
        const data = this.data.projectile;
        const startX = this.player.x + Math.cos(angle) * 26;
        const startY = this.player.y + Math.sin(angle) * 26;

        this.createMuzzleFlash(startX, startY, 0x74e7ff);

        const bolt = this.scene.add.container(startX, startY).setDepth(155);
        const arc = this.scene.add.graphics();
        const glow = this.scene.add.circle(0, 0, 13, 0x66ddff, 0.28);
        const tip = this.scene.add.circle(0, 0, 4, 0xe5ffff, 0.9);
        bolt.add([glow, arc, tip]);

        bolt.vx = Math.cos(angle) * data.speed;
        bolt.vy = Math.sin(angle) * data.speed;
        bolt.damage = data.damage;
        bolt.range = data.range;
        bolt.startX = startX;
        bolt.startY = startY;
        bolt.knockback = false;
        bolt.knockbackForce = 0;
        bolt.heavyKnockback = false;
        bolt.phase = Math.random() * Math.PI * 2;

        bolt.update = () => {
            bolt.phase += 0.46;
            const dir = Math.atan2(bolt.vy, bolt.vx);

            arc.clear();
            arc.lineStyle(2.5, 0x7be9ff, 0.9);

            const len = 30;
            const segments = 6;
            let px = -Math.cos(dir) * len * 0.5;
            let py = -Math.sin(dir) * len * 0.5;
            for (let i = 1; i <= segments; i++) {
                const t = i / segments;
                const nx = -Math.cos(dir) * len * (0.5 - t);
                const ny = -Math.sin(dir) * len * (0.5 - t);
                const offset = Math.sin(bolt.phase + i * 1.4) * (1.5 + i * 0.35);
                const ox = Math.cos(dir + Math.PI / 2) * offset;
                const oy = Math.sin(dir + Math.PI / 2) * offset;
                arc.lineBetween(px, py, nx + ox, ny + oy);
                px = nx + ox;
                py = ny + oy;
            }

            glow.alpha = 0.18 + Math.sin(bolt.phase) * 0.09;
            tip.alpha = 0.72 + Math.cos(bolt.phase * 1.7) * 0.2;

            if (Math.random() > 0.65) {
                const spark = this.scene.add.circle(bolt.x, bolt.y, Phaser.Math.FloatBetween(1.6, 2.8), 0x9ff7ff, 0.7).setDepth(154);
                this.scene.tweens.add({
                    targets: spark,
                    alpha: 0,
                    x: spark.x + Phaser.Math.Between(-12, 12),
                    y: spark.y + Phaser.Math.Between(-12, 12),
                    duration: 120,
                    onComplete: () => spark.destroy()
                });
            }
        };

        this.scene.projectiles.push(bolt);
        this.addTrail(bolt, 0x74e7ff, 8);
    }

    executeChargedAttack(angle) {
        // Kept for API compatibility: charged logic now runs in executeZapDash from confirmTarget.
        const boss = this.scene.boss;
        if (boss) {
            this.executeZapDash(boss);
        }
    }

    startTargeting() {
        this.isTargeting = true;
        this.waitingForConfirmRelease = true;

        this.targetingGraphics = this.scene.add.graphics().setDepth(120);
        this.directionMarker = this.scene.add.circle(this.player.x, this.player.y, 9, 0x66ddff, 0.22)
            .setStrokeStyle(2, 0xb7f6ff, 0.86)
            .setDepth(121);
    }

    cancelTargeting() {
        this.isTargeting = false;
        this.waitingForConfirmRelease = false;

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

    confirmTarget(targetX, targetY) {
        const boss = this.scene.boss;
        if (!boss || !boss.scene || !this.pendingCharged) {
            this.pendingCharged = false;
            this.cancelTargeting();
            return;
        }

        const dirX = targetX - this.player.x;
        const dirY = targetY - this.player.y;
        const dirLength = Math.sqrt(dirX * dirX + dirY * dirY);
        if (dirLength <= 1) {
            this.pendingCharged = false;
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
        const minAlignment = 0.9;

        if (distance > this.maxRange || alignment < minAlignment) {
            this.showFailText(distance > this.maxRange ? 'TOO FAR!' : 'BAD DIRECTION!');
            this.pendingCharged = false;
            this.cancelTargeting();
            return;
        }

        if (this.player.stamina < this.data.charged.staminaCost) {
            this.showFailText('NO STAMINA!');
            this.pendingCharged = false;
            this.cancelTargeting();
            return;
        }

        this.player.stamina -= this.data.charged.staminaCost;
        this.pendingCharged = false;
        this.cancelTargeting();
        this.executeZapDash(boss);
    }

    executeZapDash(boss) {
        if (!boss?.scene) return;

        const charged = this.data.charged;
        const originalX = this.player.x;
        const originalY = this.player.y;

        const angleToBoss = Math.atan2(boss.y - originalY, boss.x - originalX);
        const stopDistance = 76;
        const dashX = boss.x - Math.cos(angleToBoss) * stopDistance;
        const dashY = boss.y - Math.sin(angleToBoss) * stopDistance;

        this.createZapPathFX(originalX, originalY, dashX, dashY, 0x75e8ff);
        this.scene.cameras.main.shake(110, 0.0032);
        this.player.isInvulnerable = true;

        this.scene.tweens.add({
            targets: this.player,
            x: dashX,
            y: dashY,
            duration: 120,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                if (boss?.scene) {
                    const finalDamage = charged.damage * (this.player.damageMultiplier || 1.0);
                    boss.takeDamage(finalDamage);
                    boss.damageTakenMultiplier = 1.2;
                    boss.setTint(0x9beeff);

                    if (boss.vulnerabilityTimer) {
                        boss.vulnerabilityTimer.remove(false);
                        boss.vulnerabilityTimer = null;
                    }

                    boss.vulnerabilityTimer = this.scene.time.delayedCall(8000, () => {
                        if (!boss.scene) return;
                        boss.damageTakenMultiplier = 1.0;
                        boss.clearTint();
                    });
                }

                const impact = this.scene.add.circle(this.player.x, this.player.y, 24, 0x9beeff, 0.52).setDepth(171);
                this.scene.tweens.add({
                    targets: impact,
                    alpha: 0,
                    scale: 1.9,
                    duration: 220,
                    onComplete: () => impact.destroy()
                });

                this.scene.time.delayedCall(100, () => {
                    this.createZapPathFX(this.player.x, this.player.y, originalX, originalY, 0xb9f8ff);
                    this.scene.tweens.add({
                        targets: this.player,
                        x: originalX,
                        y: originalY,
                        duration: 130,
                        ease: 'Cubic.easeIn',
                        onComplete: () => {
                            this.player.isInvulnerable = false;
                        }
                    });
                });
            }
        });
    }

    createZapPathFX(fromX, fromY, toX, toY, color) {
        const line = this.scene.add.graphics().setDepth(170);
        line.lineStyle(2.3, color, 0.72);

        let px = fromX;
        let py = fromY;
        const segments = 9;

        for (let i = 1; i <= segments; i++) {
            const t = i / segments;
            const nx = Phaser.Math.Linear(fromX, toX, t) + Phaser.Math.Between(-11, 11) * (1 - t);
            const ny = Phaser.Math.Linear(fromY, toY, t) + Phaser.Math.Between(-11, 11) * (1 - t);
            line.lineBetween(px, py, nx, ny);
            px = nx;
            py = ny;
        }

        const ring = this.scene.add.circle(fromX, fromY, 14, color, 0.3).setDepth(171);
        const endRing = this.scene.add.circle(toX, toY, 11, color, 0.24).setDepth(171);

        this.scene.tweens.add({
            targets: [line, ring, endRing],
            alpha: 0,
            duration: 150,
            onComplete: () => {
                line.destroy();
                ring.destroy();
                endRing.destroy();
            }
        });

        for (let i = 0; i < 12; i++) {
            const t = i / 11;
            const sx = Phaser.Math.Linear(fromX, toX, t);
            const sy = Phaser.Math.Linear(fromY, toY, t);
            const spark = this.scene.add.circle(sx, sy, Phaser.Math.FloatBetween(1.2, 2.3), 0xe9ffff, 0.85).setDepth(172);
            this.scene.tweens.add({
                targets: spark,
                x: sx + Phaser.Math.Between(-8, 8),
                y: sy + Phaser.Math.Between(-8, 8),
                alpha: 0,
                duration: Phaser.Math.Between(100, 180),
                onComplete: () => spark.destroy()
            });
        }
    }

    showFailText(text) {
        const failText = this.scene.add.text(this.player.x, this.player.y - 50, text, {
            fontSize: '24px',
            fill: '#66ddff',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(200);

        this.scene.tweens.add({
            targets: failText,
            y: this.player.y - 100,
            alpha: 0,
            duration: 700,
            onComplete: () => failText.destroy()
        });
    }

    handleConfirmKeyUp() {
        this.waitingForConfirmRelease = false;
    }

    update() {
        if (!this.waitingForConfirmRelease) return;
        if (!this.scene.input.activePointer.rightButtonDown()) {
            this.waitingForConfirmRelease = false;
        }

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
        this.targetingGraphics.lineStyle(2, 0x66ddff, 0.3);
        this.targetingGraphics.strokeCircle(this.player.x, this.player.y, this.maxRange);

        this.targetingGraphics.lineStyle(2, 0x9ff3ff, 0.7);
        this.targetingGraphics.lineBetween(this.player.x, this.player.y, endX, endY);

        this.targetingGraphics.fillStyle(0x9ff3ff, 0.16);
        this.targetingGraphics.fillCircle(endX, endY, 13);

        if (this.directionMarker) {
            this.directionMarker.setPosition(endX, endY);
        }
    }
}
