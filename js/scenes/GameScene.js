// GameScene.js - Main gameplay scene
import { Player } from '../entities/Player.js';
import { BossFactory } from '../entities/BossFactory.js';
import { GameData } from '../data/GameData.js';
import { AFFIXES } from '../data/AffixData.js';
import { SwordWeapon } from '../weapons/SwordWeapon.js';
import { BowWeapon } from '../weapons/BowWeapon.js';
import { StaffWeapon } from '../weapons/StaffWeapon.js';
import { DaggerWeapon } from '../weapons/DaggerWeapon.js';
import { GreatswordWeapon } from '../weapons/GreatswordWeapon.js';
import { ThunderGauntletWeapon } from '../weapons/ThunderGauntletWeapon.js';
import { SkillUI } from '../ui/SkillUI.js';
import { AchievementNotifier } from '../ui/AchievementNotifier.js';
import { ComboDisplay } from '../ui/ComboDisplay.js';
import { soundManager } from '../utils/SoundManager.js';
import { ALL_UPGRADES, calcCrystalReward } from '../data/ShopData.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }
    
    init(data) {
        this.playerConfig  = data.playerConfig || { class: 'WARRIOR', weapon: 'SWORD' };
        this.bossId        = data.bossId || GameData.currentBossId;
        this.affixes       = data.affixes       || [];
        this.scaledHp      = data.scaledHp      || null;
        this.infiniteFloor = data.infiniteFloor || null;
        GameData.currentBossId = this.bossId;
    }
    
    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Background
        this.createBackground(width, height);
        
        // Player
        this.player = new Player(this, this.playerConfig);
        
        // Boss
        this.boss = BossFactory.createBoss(this, this.bossId);

        // Apply scaled HP (infinite tower) and affixes
        if (this.scaledHp !== null) {
            this.boss.health    = this.scaledHp;
            this.boss.maxHealth = this.scaledHp;
        }
        this._applyAffixes();

        // Projectiles arrays
        this.projectiles = [];
        this.bossProjectiles = [];
        
        // Créer l'arme
        this.createWeapon();
        
        // Initialize class skills (Q/E/R)
        const classSkills = this.player.classData?.skills || [];
        this.skills = {
            q: classSkills[0] || null,
            e: classSkills[1] || null,
            r: classSkills[2] || null
        };
        
        // ✅ Initialize player combat modifiers
        this.player.damageMultiplier = 1.0;
        this.player.damageReduction = 0;

        // Smoothed HUD values for crisper, less jittery UI updates
        this.displayHealthRatio = 1;
        this.displayStaminaRatio = 1;
        this.displayBossHealthRatio = 1;
        
        // Input state
        this.moveTarget = null;
        this.leftMouseDown = false;
        this.worldMouseX = 0;
        this.worldMouseY = 0;
        this.aimCurrentX = 0;
        this.aimCurrentY = 0;
        this.showAttackRangePreview = true;

        // Aim line
        this.aimLine = this.add.graphics();
        this.rangePreviewGraphics = this.add.graphics();
        this.chargeGraphics = null;
        
        // Tooltip
        this.tooltip = null;
        
        // UI
        this.createUI(width, height);
        
        // ✅ Create skill UI
        this.skillUI = new SkillUI(this);

        // Apply purchased shop upgrades to player stats
        this._applyUpgrades();

        // Achievement notifier (checks + shows popups)
        this.achievementNotifier = new AchievementNotifier(this);

        // Combo display (consecutive hits tracker)
        this.comboDisplay = new ComboDisplay(this, this.player);

        // Start run tracking
        GameData.startRun();

        // Input
        this.setupInput();
        
        // Camera
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setDeadzone(90, 60);
        this.cameras.main.setBounds(0, 0, width, height);
    }
    
    _applyUpgrades() {
        for (const upg of ALL_UPGRADES) {
            if (GameData.isUpgradePurchased(upg.id)) {
                upg.apply(this.player);
            }
        }
    }

    _applyAffixes() {
        for (const key of this.affixes) {
            const affix = AFFIXES[key];
            if (affix?.apply) affix.apply(this.boss);
        }
        // Show affix banners in-game if any
        if (this.affixes.length > 0) {
            const { AFFIXES: A } = { AFFIXES };
            let bannerY = 80;
            this.affixes.forEach(key => {
                const aff = AFFIXES[key];
                if (!aff) return;
                const banner = this.add.text(
                    this.cameras.main.width / 2, bannerY,
                    `★ ${key}: ${aff.desc}`, {
                        fontSize: '11px',
                        fill: '#' + aff.color.toString(16).padStart(6, '0'),
                        backgroundColor: '#00000066',
                        padding: { x: 8, y: 3 }
                    }
                ).setOrigin(0.5).setScrollFactor(0).setDepth(250).setAlpha(0.85);
                bannerY += 20;
            });
        }
    }

    _updateAffixes(time, delta) {
        const boss = this.boss;
        if (!boss || !boss.active) return;

        // WARDEN: heal 30 HP every 4 seconds
        if (boss._wardenHeal) {
            boss._wardenTimer = (boss._wardenTimer || 0) + delta;
            if (boss._wardenTimer >= 4000) {
                boss._wardenTimer = 0;
                boss.health = Math.min(boss.health + 30, boss.maxHealth);
                // Small heal flash
                const flash = this.add.circle(boss.x, boss.y, 40, 0x44ff88, 0.3);
                this.tweens.add({ targets: flash, scale: 1.6, alpha: 0, duration: 400,
                    onComplete: () => flash.destroy() });
            }
        }

        // VOLATILE: stray projectile every 2.5 seconds
        if (boss._volatile && this.bossProjectiles) {
            boss._volatileTimer = (boss._volatileTimer || 0) + delta;
            if (boss._volatileTimer >= 2500 && !boss.frozen) {
                boss._volatileTimer = 0;
                const a = Math.random() * Math.PI * 2;
                const proj = this.add.circle(boss.x, boss.y, 6, boss.bossData.glowColor, 0.9);
                proj.vx = Math.cos(a) * 220;
                proj.vy = Math.sin(a) * 220;
                proj.setDepth(150);
                const glow = this.add.circle(boss.x, boss.y, 11, boss.bossData.color, 0.2);
                glow.setDepth(149);
                proj.glow = glow;
                this.bossProjectiles.push(proj);
            }
        }

        // BERSERKER: override phase transition threshold
        if (boss._berserkerThreshold && !boss._berserkerApplied) {
            if (boss.health <= boss.maxHealth * boss._berserkerThreshold && !boss.phaseTransitioned) {
                boss._berserkerApplied = true;
                // trigger phase if it hasn't happened yet
                if (boss.triggerPhaseTransition) boss.triggerPhaseTransition();
                boss.phaseTransitioned = true;
            }
        }

        // SHIELDED: absorb damage before HP is reduced
        // (applied by redirecting damage – handled via damageTakenMultiplier = 0 while shield > 0)
        if (boss.maxShield !== undefined && boss.shield > 0) {
            boss.damageTakenMultiplier = 0;
        } else if (boss.maxShield !== undefined && boss.shield <= 0 && boss.damageTakenMultiplier === 0) {
            boss.damageTakenMultiplier = 1;
        }

        // FRENZIED: double attack speed in phase 2
        if (boss._frenzied && boss.health <= boss.maxHealth * 0.5 && !boss._frenziedActive) {
            boss._frenziedActive = true;
            boss._rampageMult = (boss._rampageMult || 1) * 0.5;
        }

        // RAMPAGE: apply cooldown reduction to next attack timing
        if (boss._rampageMult && !this._rampagePatched) {
            this._rampagePatched = true;
            const orig = boss.update.bind(boss);
            const mult = boss._rampageMult;
            boss.update = (t, p) => {
                const prevNext = boss.nextAttackTime;
                orig(t, p);
                if (boss.nextAttackTime !== prevNext) {
                    const reduction = (boss.nextAttackTime - t) * mult;
                    boss.nextAttackTime = t + reduction;
                }
            };
        }

        // MIRRORED: for each new boss projectile, spawn a mirror copy from opposite side
        // (handled by a flag checked in projectile update)
    }

    createBackground(width, height) {
        // Deep gradient backdrop
        const gradient = this.add.graphics();
        gradient.fillGradientStyle(0x040409, 0x0d1222, 0x050810, 0x111a2f, 1);
        gradient.fillRect(0, 0, width, height);

        // Subtle radial glow to focus center combat area
        const centerGlow = this.add.circle(width * 0.52, height * 0.5, Math.max(width, height) * 0.45, 0x21406f, 0.06)
            .setBlendMode(Phaser.BlendModes.SCREEN);

        // Faint grid lines for a cleaner arena feel
        const grid = this.add.graphics();
        grid.lineStyle(1, 0x9ecbff, 0.03);
        const spacing = 64;
        for (let x = 0; x <= width; x += spacing) {
            grid.lineBetween(x, 0, x, height);
        }
        for (let y = 0; y <= height; y += spacing) {
            grid.lineBetween(0, y, width, y);
        }

        // Layered star particles with gentle parallax drift
        const makeStarLayer = (count, alphaMin, alphaMax, speedMin, speedMax, sizeMin, sizeMax) => {
            for (let i = 0; i < count; i++) {
                const x = Phaser.Math.Between(0, width);
                const y = Phaser.Math.Between(0, height);
                const size = Phaser.Math.FloatBetween(sizeMin, sizeMax);
                const alpha = Phaser.Math.FloatBetween(alphaMin, alphaMax);

                const star = this.add.circle(x, y, size, 0xffffff, alpha);

                this.tweens.add({
                    targets: star,
                    alpha: alpha * 0.35,
                    duration: Phaser.Math.Between(1600, 3200),
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });

                this.tweens.add({
                    targets: star,
                    x: x + Phaser.Math.Between(-18, 18),
                    y: y + Phaser.Math.Between(-12, 12),
                    duration: Phaser.Math.Between(speedMin, speedMax),
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        };

        makeStarLayer(80, 0.05, 0.22, 5000, 9000, 0.8, 1.6);
        makeStarLayer(30, 0.08, 0.28, 3500, 6500, 1.2, 2.3);

        const vignette = this.add.circle(width * 0.5, height * 0.5, Math.max(width, height) * 0.78, 0x000000, 0.22)
            .setBlendMode(Phaser.BlendModes.MULTIPLY);

        // Keep references if we want to tune/destroy later
        this.backgroundDecor = { gradient, centerGlow, grid, vignette };
    }

    createWeapon() {
        switch(this.playerConfig.weapon) {
            case 'SWORD':
                this.weapon = new SwordWeapon(this, this.player);
                break;
            case 'BOW':
                this.weapon = new BowWeapon(this, this.player);
                break;
            case 'STAFF':
                this.weapon = new StaffWeapon(this, this.player);
                break;
            case 'DAGGERS':
                this.weapon = new DaggerWeapon(this, this.player);
                break;
            case 'GREATSWORD':
                this.weapon = new GreatswordWeapon(this, this.player);
                break;
            case 'THUNDER_GAUNTLET':
                this.weapon = new ThunderGauntletWeapon(this, this.player);
                break;
            default:
                this.weapon = new SwordWeapon(this, this.player);
        }
    }
    
    createUI(width, height) {
        // Health bar
        this.healthBarBg = this.add.rectangle(20, 20, 300, 25, 0x333333)
            .setScrollFactor(0).setOrigin(0, 0.5);
        this.healthBar = this.add.rectangle(20, 20, 300, 25, 0x00ff88)
            .setScrollFactor(0).setOrigin(0, 0.5);
        this.healthText = this.add.text(330, 20, '100/100', {
            fontSize: '18px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 2
        }).setScrollFactor(0).setOrigin(0, 0.5);
        
        // Stamina bar
        this.staminaBarBg = this.add.rectangle(20, 55, 250, 15, 0x333333)
            .setScrollFactor(0).setOrigin(0, 0.5);
        this.staminaBar = this.add.rectangle(20, 55, 250, 15, 0xffaa00)
            .setScrollFactor(0).setOrigin(0, 0.5);
        this.staminaText = this.add.text(280, 55, '100', {
            fontSize: '16px',
            fill: '#ffaa00',
            stroke: '#000',
            strokeThickness: 2
        }).setScrollFactor(0).setOrigin(0, 0.5);

        // Ultimate gauge (future weapon ultimate trigger)
        this.ultimateBarBg = this.add.rectangle(20, 80, 250, 10, 0x333333)
            .setScrollFactor(0).setOrigin(0, 0.5);
        this.ultimateBar = this.add.rectangle(20, 80, 250, 10, 0xa64dff)
            .setScrollFactor(0).setOrigin(0, 0.5);
        this.ultimateText = this.add.text(280, 80, 'ULT 0%', {
            fontSize: '14px',
            fill: '#d9aaff',
            stroke: '#000',
            strokeThickness: 2
        }).setScrollFactor(0).setOrigin(0, 0.5);
        
        // Boss health
        this.bossName = this.add.text(width - 200, 15, this.boss?.bossData?.name || 'BOSS', {
            fontSize: '20px',
            fill: '#ff5555',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 2
        }).setScrollFactor(0).setOrigin(0.5);
        
        this.bossHealthBarBg = this.add.rectangle(width - 370, 44, 300, 25, 0x333333)
            .setScrollFactor(0).setOrigin(0, 0.5);
        this.bossHealthBar = this.add.rectangle(width - 370, 44, 300, 25, 0xff5555)
            .setScrollFactor(0).setOrigin(0, 0.5);
        this.bossHealthText = this.add.text(width - 60, 44, '400/400', {
            fontSize: '18px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 2
        }).setScrollFactor(0).setOrigin(1, 0.5);
        
        // Weapon info
        this.weaponName = this.add.text(20, 90, this.weapon?.data?.name || 'WEAPON', {
            fontSize: '16px',
            fill: '#fff',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 1
        }).setScrollFactor(0);
        
        this.weaponDesc = this.add.text(20, 110, this.weapon?.data?.description || '', {
            fontSize: '12px',
            fill: '#aaa',
            stroke: '#000',
            strokeThickness: 1
        }).setScrollFactor(0);

        this.createWeaponHelpButtons(width, height);

        this.rangePreviewToggleText = this.add.text(width - 28, 80, '', {
            fontSize: '14px',
            fill: '#9ecbff',
            backgroundColor: '#00000099',
            padding: { x: 8, y: 4 }
        }).setOrigin(1, 0.5).setScrollFactor(0).setInteractive({ useHandCursor: true });
        this.rangePreviewToggleText.on('pointerdown', () => this.toggleAttackRangePreview());
        this.refreshRangePreviewToggleText();
        
        // Instructions
        this.add.text(width/2, height - 46, 
            'LEFT CLICK: MOVE | RIGHT CLICK: FIRE/CHARGE | T: RANGE PREVIEW | SPACE: DASH | Q/E/R: SKILLS (HOOK: R then R)', {
            fontSize: '14px',
            fill: '#aaa',
            backgroundColor: '#00000099',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setScrollFactor(0);
    }
    
    createWeaponHelpButtons(width, height) {
        const x = 72;
        const y = height - 92;

        const weaponIcon = this.weapon?.data?.icon || '⚔️';

        const ring = this.add.circle(x, y, 34, 0x000000, 0.68)
            .setScrollFactor(0)
            .setDepth(210)
            .setStrokeStyle(2, 0x55aaff, 0.95)
            .setInteractive({ useHandCursor: true });

        const icon = this.add.text(x, y - 2, weaponIcon, {
            fontSize: '28px'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(211).setInteractive({ useHandCursor: true });

        const label = this.add.text(x + 50, y - 8, 'WEAPON HELP', {
            fontSize: '12px',
            fill: '#ffffff',
            backgroundColor: '#00000099',
            padding: { x: 8, y: 4 }
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(211).setInteractive({ useHandCursor: true });

        const showHelp = () => this.showWeaponHelpTooltip(x + 170, y - 92);
        const hideHelp = () => this.hideWeaponHelpTooltip();

        [ring, icon, label].forEach((obj) => {
            obj.on('pointerover', showHelp);
            obj.on('pointerout', hideHelp);
        });

        this.weaponHelpButtons = [
            { shape: 'circle', x, y, radius: 34 },
            { shape: 'rect', x: x + 50, y: y - 8, w: 120, h: 26 }
        ];
    }

    showWeaponHelpTooltip(x, y) {
        this.hideWeaponHelpTooltip();

        const camera = this.cameras.main;
        const margin = 14;

        const projectile = this.weapon?.data?.projectile || {};
        const charged = this.weapon?.data?.charged || {};
        const chargedExtras = [];

        if (charged.dotDamage) chargedExtras.push(`DoT: ${charged.dotDamage} x${charged.dotTicks || '?'}`);
        if (charged.radius) chargedExtras.push(`Radius: ${charged.radius}`);
        if (charged.arrows) chargedExtras.push(`Arrows: ${charged.arrows}`);
        if (charged.slow) chargedExtras.push('Slow effect');
        if (charged.stun) chargedExtras.push('Stun effect');
        if (charged.vulnerabilityMultiplier) chargedExtras.push(`Vulnerability: +${Math.round((charged.vulnerabilityMultiplier - 1) * 100)}% damage taken`);

        const line1 = `${this.weapon?.data?.name || 'WEAPON'} ${this.weapon?.data?.icon || ''}`;
        const line2 = `Basic: ${projectile.type || 'shot'} | dmg ${projectile.damage ?? '?'} | cd ${projectile.cooldown ?? '?'}ms`;
        const line3 = `Charged: ${charged.name || 'CHARGED'} | dmg ${charged.damage ?? '?'} | stamina ${charged.staminaCost ?? '?'}`;
        const line4 = chargedExtras.length ? chargedExtras.join(' • ') : 'No extra charged effects';

        const lines = [line1, line2, line3, line4];
        const width = 460;
        const height = 102;

        const clampedX = Phaser.Math.Clamp(x, margin + width / 2, camera.width - margin - width / 2);
        const clampedY = Phaser.Math.Clamp(y, margin + height / 2, camera.height - margin - height / 2);

        const bg = this.add.rectangle(clampedX, clampedY, width, height, 0x000000, 0.92)
            .setScrollFactor(0)
            .setDepth(320)
            .setStrokeStyle(2, 0xffffff, 0.85);

        const title = this.add.text(clampedX, clampedY - 34, line1, {
            fontSize: '14px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(321);

        const basic = this.add.text(clampedX, clampedY - 10, line2, {
            fontSize: '12px',
            fill: '#9fd7ff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(321);

        const chargedText = this.add.text(clampedX, clampedY + 14, line3, {
            fontSize: '12px',
            fill: '#ffc98f'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(321);

        const extra = this.add.text(clampedX, clampedY + 36, line4, {
            fontSize: '11px',
            fill: '#d9ecff',
            align: 'center',
            wordWrap: { width: width - 16 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(321);

        this.weaponHelpTooltip = { bg, title, basic, chargedText, extra };
    }

    hideWeaponHelpTooltip() {
        if (!this.weaponHelpTooltip) return;
        Object.values(this.weaponHelpTooltip).forEach((obj) => obj?.destroy());
        this.weaponHelpTooltip = null;
    }

    isPointerOnWeaponHelpButton(pointerX, pointerY) {
        if (!this.weaponHelpButtons) return false;
        return this.weaponHelpButtons.some((btn) => {
            if (btn.shape === 'circle') {
                const dist = Phaser.Math.Distance.Between(pointerX, pointerY, btn.x, btn.y);
                return dist <= btn.radius;
            }

            return pointerX >= btn.x && pointerX <= (btn.x + btn.w) &&
                pointerY >= btn.y && pointerY <= (btn.y + btn.h);
        });
    }

    setupInput() {
        this.input.mouse.disableContextMenu();
        
        // CLIC GAUCHE - Déplacement
        this.input.on('pointerdown', (pointer) => {
            if (this.skillUI?.isPointerOnSkillButton(pointer.x, pointer.y) ||
                this.isPointerOnWeaponHelpButton(pointer.x, pointer.y)) {
                return;
            }

            const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

            if (pointer.leftButtonDown()) {
                this.leftMouseDown = true;
                this.setMoveTarget(worldPoint.x, worldPoint.y);
            }
            
            // CLIC DROIT - Tirer ou charger
            if (pointer.rightButtonDown()) {
                this.aimCurrentX = worldPoint.x;
                this.aimCurrentY = worldPoint.y;
                
                this.weapon.startCharge();
                this.chargeGraphics = this.add.graphics();
                this.chargeFlashShown = false;
            }
        });
        
        // Maintien du clic gauche pour déplacement continu
        this.input.on('pointermove', (pointer) => {
            const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
            this.worldMouseX = worldPoint.x;
            this.worldMouseY = worldPoint.y;
            
            // Mettre à jour la position actuelle pour la visée
            if (this.input.activePointer.rightButtonDown()) {
                this.aimCurrentX = worldPoint.x;
                this.aimCurrentY = worldPoint.y;
            }
            
            if (this.leftMouseDown) {
                this.setMoveTarget(worldPoint.x, worldPoint.y);
            }
        });
        
        // Relâchement des clics
        this.input.on('pointerup', (pointer) => {

            if (pointer.button === 0) {
                this.leftMouseDown = false;
            }
            
            if (pointer.button === 2) {
                const angle = Math.atan2(
                    this.aimCurrentY - this.player.y,
                    this.aimCurrentX - this.player.x
                );

                const weaponType = this.playerConfig?.weapon || 'SWORD';
                if (!this.weapon.releaseCharge(angle)) {
                    this.weapon.attack(angle);
                    soundManager.playWeaponFire(weaponType, false);
                } else {
                    soundManager.playWeaponFire(weaponType, true);
                }

                if (this.chargeGraphics) {
                    this.chargeGraphics.destroy();
                    this.chargeGraphics = null;
                }
            }
        });
        
        // DASH avec ESPACE
        this.input.keyboard.on('keydown-SPACE', () => {
            this.performDash();
        });

        this.ultimateKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);

        // ULTIMATE (F): hold to charge, release to launch
        this.input.keyboard.on('keydown-F', () => {
            this.weapon?.startUltimateCharge(this.worldMouseX, this.worldMouseY);
        });

        this.input.keyboard.on('keyup-F', () => {
            this.weapon?.releaseUltimate(this.worldMouseX, this.worldMouseY);
        });
        
        this.input.keyboard.on('keydown-T', () => {
            this.toggleAttackRangePreview();
        });

        // ✅ COMPÉTENCES avec Q, E, R
        this.input.keyboard.on('keydown-Q', () => {
            if (this.skills?.q) {
                this.skills.q.use();
            }
        });
        
        this.input.keyboard.on('keydown-E', () => {
            if (this.skills?.e) {
                this.skills.e.use();
            }
        });
        
        this.input.keyboard.on('keydown-R', () => {
            if (this.skills?.r) {
                this.skills.r.use();
            }
        });

        this.input.keyboard.on('keyup-R', () => {
            if (this.skills?.r?.handleConfirmKeyUp) {
                this.skills.r.handleConfirmKeyUp();
            }
        });

        this.input.keyboard.on('keyup-E', () => {
            if (this.skills?.e?.handleConfirmKeyUp) {
                this.skills.e.handleConfirmKeyUp();
            }
        });
    }
    
    setMoveTarget(x, y) {
        this.moveTarget = { x, y };
        const color = this.player.classData?.data?.color || 0x00d4ff;
        const indicator = this.add.circle(x, y, 10, color, 0.08);
        indicator.setStrokeStyle(1, color, 0.15);
        
        this.tweens.add({
            targets: indicator,
            scale: 1.2,
            alpha: 0,
            duration: 300,
            onComplete: () => indicator.destroy()
        });
    }
    
    performDash() {
        if (!this.player) return;

        const angle = Math.atan2(
            this.worldMouseY - this.player.y,
            this.worldMouseX - this.player.x
        );

        const dashed = this.player.dash(Math.cos(angle), Math.sin(angle));
        if (dashed) {
            soundManager.playDash();
            GameData.recordDodge();
            this.achievementNotifier?.check();
        }
    }
    


    toggleAttackRangePreview() {
        this.showAttackRangePreview = !this.showAttackRangePreview;
        this.refreshRangePreviewToggleText();

        if (!this.showAttackRangePreview && this.rangePreviewGraphics) {
            this.rangePreviewGraphics.clear();
        }
    }

    refreshRangePreviewToggleText() {
        if (!this.rangePreviewToggleText) return;

        const status = this.showAttackRangePreview ? 'ON' : 'OFF';
        this.rangePreviewToggleText.setText(`RANGE PREVIEW [T]: ${status}`);
        this.rangePreviewToggleText.setStyle({
            fill: this.showAttackRangePreview ? '#b9f1ff' : '#888888',
            backgroundColor: this.showAttackRangePreview ? '#0b1d3099' : '#1a1a1a99'
        });
    }

    drawDashedCircle(graphics, centerX, centerY, radius, options = {}) {
        const {
            segments = 72,
            dashRatio = 0.55,
            offset = 0,
            lineWidth = 1,
            color = 0xffffff,
            alpha = 0.5
        } = options;

        graphics.lineStyle(lineWidth, color, alpha);

        for (let i = 0; i < segments; i++) {
            const start = (i / segments) * Math.PI * 2 + offset;
            const end = ((i + dashRatio) / segments) * Math.PI * 2 + offset;
            graphics.beginPath();
            graphics.arc(centerX, centerY, radius, start, end, false);
            graphics.strokePath();
        }
    }

    drawUltimateRangePreview() {
        if (!this.rangePreviewGraphics || !this.weapon || !this.player) return false;

        const ultimate = this.weapon.getUltimatePreviewConfig?.();
        if (!ultimate) return false;

        const graphics = this.rangePreviewGraphics;
        const pulse = 0.78 + Math.sin(this.time.now * 0.012) * 0.22;
        const spin = this.time.now * 0.0018;

        if (ultimate.targeting === 'self') {
            if ((ultimate.aoeRadius || 0) > 0) {
                graphics.fillStyle(0xb883ff, 0.06 * pulse);
                graphics.fillCircle(this.player.x, this.player.y, ultimate.aoeRadius);
                this.drawDashedCircle(graphics, this.player.x, this.player.y, ultimate.aoeRadius, {
                    segments: 66,
                    dashRatio: 0.5,
                    offset: -spin,
                    lineWidth: 2,
                    color: 0xd2aaff,
                    alpha: 0.84
                });
            }
            return true;
        }

        const targetPoint = this.weapon.getClampedUltimateTarget
            ? this.weapon.getClampedUltimateTarget(this.worldMouseX, this.worldMouseY)
            : { x: this.worldMouseX, y: this.worldMouseY };

        if ((ultimate.maxRange || 0) > 0) {
            this.drawDashedCircle(graphics, this.player.x, this.player.y, ultimate.maxRange, {
                segments: 78,
                dashRatio: 0.5,
                offset: -spin,
                lineWidth: 1.8,
                color: 0xcf9aff,
                alpha: 0.7
            });
        }

        graphics.lineStyle(5, 0xaa66ff, 0.12 * pulse);
        graphics.lineBetween(this.player.x, this.player.y, targetPoint.x, targetPoint.y);
        graphics.lineStyle(2, 0xe2c4ff, 0.82);
        graphics.lineBetween(this.player.x, this.player.y, targetPoint.x, targetPoint.y);

        const marker = 11 + pulse * 3;
        graphics.lineStyle(2, 0xe9d1ff, 0.88);
        graphics.strokeCircle(targetPoint.x, targetPoint.y, marker);

        const width = ultimate.width || ultimate.aoeRadius || 0;
        if (width > 0) {
            const angle = Math.atan2(targetPoint.y - this.player.y, targetPoint.x - this.player.x);
            graphics.fillStyle(0xc17dff, 0.07 * pulse);
            graphics.fillTriangle(
                this.player.x + Math.cos(angle + Math.PI / 2) * (width * 0.28),
                this.player.y + Math.sin(angle + Math.PI / 2) * (width * 0.28),
                this.player.x + Math.cos(angle - Math.PI / 2) * (width * 0.28),
                this.player.y + Math.sin(angle - Math.PI / 2) * (width * 0.28),
                targetPoint.x,
                targetPoint.y
            );
        }

        return true;
    }

    drawAttackRangePreview() {
        if (!this.rangePreviewGraphics || !this.weapon || !this.player) return;

        const graphics = this.rangePreviewGraphics;
        graphics.clear();

        const pulse = 0.75 + Math.sin(this.time.now * 0.01) * 0.25;
        const spin = this.time.now * 0.002;

        const normalRange = this.weapon.getNormalRange();
        if (normalRange > 0) {
            graphics.lineStyle(2, 0x55d8ff, 0.08 * pulse);
            graphics.fillStyle(0x55d8ff, 0.03 * pulse);
            graphics.fillCircle(this.player.x, this.player.y, normalRange);

            this.drawDashedCircle(graphics, this.player.x, this.player.y, normalRange, {
                segments: 84,
                dashRatio: 0.45,
                offset: spin,
                lineWidth: 1.5,
                color: 0x66ddff,
                alpha: 0.55
            });
        }

        const charged = this.weapon.getChargedPreviewConfig();
        const targetPoint = this.weapon.getClampedChargedTarget(this.aimCurrentX, this.aimCurrentY);

        if (charged.targeting === 'self') {
            if (charged.aoeRadius > 0) {
                graphics.fillStyle(0xffaa00, 0.06 * pulse);
                graphics.fillCircle(this.player.x, this.player.y, charged.aoeRadius);
                this.drawDashedCircle(graphics, this.player.x, this.player.y, charged.aoeRadius, {
                    segments: 64,
                    dashRatio: 0.52,
                    offset: -spin,
                    lineWidth: 2,
                    color: 0xffb347,
                    alpha: 0.8
                });
            }
            return;
        }

        if (charged.maxRange > 0) {
            this.drawDashedCircle(graphics, this.player.x, this.player.y, charged.maxRange, {
                segments: 76,
                dashRatio: 0.48,
                offset: -spin,
                lineWidth: 1.5,
                color: 0xffc266,
                alpha: 0.58
            });
        }

        const glowColor = charged.targeting === 'ground' ? 0xff9b4d : 0xffb347;
        graphics.lineStyle(4, glowColor, 0.12 * pulse);
        graphics.lineBetween(this.player.x, this.player.y, targetPoint.x, targetPoint.y);
        graphics.lineStyle(1.5, glowColor, 0.7);
        graphics.lineBetween(this.player.x, this.player.y, targetPoint.x, targetPoint.y);

        if (charged.targeting === 'ground' && charged.aoeRadius > 0) {
            graphics.fillStyle(0xff8844, 0.09 * pulse);
            graphics.fillCircle(targetPoint.x, targetPoint.y, charged.aoeRadius);

            this.drawDashedCircle(graphics, targetPoint.x, targetPoint.y, charged.aoeRadius, {
                segments: 48,
                dashRatio: 0.55,
                offset: spin * 1.2,
                lineWidth: 2,
                color: 0xff8844,
                alpha: 0.85
            });
        } else {
            const markerRadius = 8 + pulse * 3;
            graphics.lineStyle(2, 0xff9f5a, 0.85);
            graphics.strokeCircle(targetPoint.x, targetPoint.y, markerRadius);
            graphics.lineStyle(1, 0xffd1a4, 0.85);
            graphics.strokeCircle(targetPoint.x, targetPoint.y, markerRadius + 6);
        }
    }

    update(time, delta) {
        // Mouvement
        if (this.moveTarget) {
            const dx = this.moveTarget.x - this.player.x;
            const dy = this.moveTarget.y - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 5) {
                this.player.move(
                    (dx / dist) * this.player.speed,
                    (dy / dist) * this.player.speed
                );
            } else {
                this.player.move(0, 0);
                this.moveTarget = null;
            }
        } else {
            this.player.move(0, 0);
        }
        
        // Update player
        this.player.update();
        this.player.regenerateStamina();
        
        // Update boss
        if (this.boss) {
            this.boss.update(time, this.player);
            this._updateAffixes(time, delta);
        }

        // Gestion de la charge
        this.weapon.updateCharge();
        if (this.weapon.isCharging) {
            const isMovingConstant = this.leftMouseDown;
            
            if (isMovingConstant) {
                this.weapon.resetCharge();
                if (this.chargeGraphics) {
                    this.chargeGraphics.destroy();
                    this.chargeGraphics = null;
                }
            } else if (this.chargeGraphics) {
                this.chargeGraphics.clear();
                const radius = 30 + this.weapon.chargeLevel * 50;
                const alpha = 0.3 + this.weapon.chargeLevel * 0.5;
                
                const isFullyCharged = this.weapon.chargeLevel >= 1.0;
                const color = isFullyCharged ? 0x00ff88 : 0xffaa00;
                
                this.chargeGraphics.lineStyle(2, color, alpha * 0.5);
                this.chargeGraphics.strokeCircle(this.player.x, this.player.y, radius);
                
                this.chargeGraphics.fillStyle(color, alpha * 0.2);
                this.chargeGraphics.slice(
                    this.player.x, this.player.y,
                    radius - 5,
                    0, Math.PI * 2 * this.weapon.chargeLevel,
                    false
                );
                this.chargeGraphics.fillPath();
                
                if (isFullyCharged && !this.chargeFlashShown) {
                    this.chargeFlashShown = true;
                    soundManager.playChargeFull();
                    const flash = this.add.circle(this.player.x, this.player.y, 60, 0x00ff88, 0.3);
                    this.tweens.add({
                        targets: flash,
                        scale: 1.5,
                        alpha: 0,
                        duration: 200,
                        onComplete: () => flash.destroy()
                    });
                }
            }
        }

        // Ultimate charging/launch update (weapon specific)
        this.weapon?.updateUltimate(time, delta, this.worldMouseX, this.worldMouseY);
        
        // Ligne de visée
        this.aimLine.clear();
        const isChargingInput = this.input.activePointer.rightButtonDown();
        if (isChargingInput) {
            const dx = this.aimCurrentX - this.player.x;
            const dy = this.aimCurrentY - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxDist = 300;
            
            let aimX = this.aimCurrentX;
            let aimY = this.aimCurrentY;
            
            if (dist > maxDist) {
                const ratio = maxDist / dist;
                aimX = this.player.x + dx * ratio;
                aimY = this.player.y + dy * ratio;
            }
            
            this.aimLine.lineStyle(1, 0xff6666, 0.2);
            this.aimLine.lineBetween(this.player.x, this.player.y, aimX, aimY);
            
            for (let i = 20; i < Math.min(dist, maxDist); i += 30) {
                const t = i / Math.min(dist, maxDist);
                const x1 = this.player.x + (aimX - this.player.x) * t;
                const y1 = this.player.y + (aimY - this.player.y) * t;
                const x2 = this.player.x + (aimX - this.player.x) * (t + 0.05);
                const y2 = this.player.y + (aimY - this.player.y) * (t + 0.05);
                this.aimLine.lineBetween(x1, y1, x2, y2);
            }
            
            this.aimLine.lineStyle(1, 0xff3333, 0.3);
            this.aimLine.strokeCircle(aimX, aimY, 8);
        }

        const isUltimateInput = !!this.ultimateKey?.isDown;

        if (this.showAttackRangePreview && (isChargingInput || isUltimateInput)) {
            this.rangePreviewGraphics?.clear();

            if (isUltimateInput) {
                const drewUltimate = this.drawUltimateRangePreview();
                if (!drewUltimate && isChargingInput) {
                    this.drawAttackRangePreview();
                }
            } else {
                this.drawAttackRangePreview();
            }
        } else if (this.rangePreviewGraphics) {
            this.rangePreviewGraphics.clear();
        }
        
        // ✅ PROJECTILES JOUEUR
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            if (proj.update) proj.update();
            
            proj.x += proj.vx * (delta / 1000);
            proj.y += proj.vy * (delta / 1000);
            
            // Check range
            if (proj.range) {
                const distTraveled = Phaser.Math.Distance.Between(proj.startX, proj.startY, proj.x, proj.y);
                if (distTraveled > proj.range) {
                    proj.destroy();
                    this.projectiles.splice(i, 1);
                    continue;
                }
            }
            
            // Boss collision
            if (this.boss) {
                const dist = Phaser.Math.Distance.Between(proj.x, proj.y, this.boss.x, this.boss.y);
                if (dist < 50) {
                    if (proj.hasHit !== undefined && proj.hasHit) {
                        continue;
                    }
                    
                    if (proj.hasHit !== undefined) {
                        proj.hasHit = true;
                    }
                    
                    const damageMultiplier = (this.player.damageMultiplier || 1.0) * (this.player.passiveDamageMultiplier || 1.0);
                    const critChance = Phaser.Math.Clamp((this.player.critChanceBonus || 0), 0, 0.6);
                    const isCrit = Math.random() < critChance;
                    const critMultiplier = isCrit ? 2 : 1;

                    const finalDamage = proj.damage * damageMultiplier * critMultiplier;
                    this.boss.takeDamage(finalDamage);

                    // Track damage & combo
                    if (isCrit) {
                        GameData.recordCrit(finalDamage);
                    } else {
                        GameData.recordDamage(finalDamage);
                    }
                    this.comboDisplay?.registerHit(isCrit);
                    this.achievementNotifier?.check();

                    // Play weapon hit sound
                    if (isCrit) {
                        soundManager.playCrit();
                    } else {
                        soundManager.playHit();
                    }

                    if (isCrit) {
                        const critText = this.add.text(this.boss.x, this.boss.y - 92, 'CRIT!', {
                            fontSize: '22px',
                            fill: '#facc15',
                            stroke: '#000',
                            strokeThickness: 4,
                            fontStyle: 'bold'
                        }).setOrigin(0.5);

                        this.tweens.add({
                            targets: critText,
                            y: this.boss.y - 126,
                            alpha: 0,
                            duration: 420,
                            onComplete: () => critText.destroy()
                        });
                    }

                    if (typeof this.player.classData?.onBossHit === 'function') {
                        this.player.classData.onBossHit();
                    }
                    this.weapon?.gainUltimateGaugeFromDamage(finalDamage, {
                        charged: !!proj.isCharged,
                        dot: !!proj.isDot
                    });
                    
                    if (proj.knockback) {
                        const angle = Math.atan2(proj.vy, proj.vx);
                        const force = proj.heavyKnockback ? (proj.knockbackForce * 1.2) : proj.knockbackForce;
                        const duration = proj.heavyKnockback ? 220 : 150;
                        this.tweens.add({
                            targets: this.boss,
                            x: this.boss.x + Math.cos(angle) * force,
                            y: this.boss.y + Math.sin(angle) * force,
                            duration,
                            ease: 'Power2'
                        });
                    }
                    
                    const impact = this.add.circle(proj.x, proj.y, 12, 0xffaa00, 0.4);
                    this.tweens.add({
                        targets: impact,
                        alpha: 0,
                        scale: 1.3,
                        duration: 150,
                        onComplete: () => impact.destroy()
                    });
                    
                    if (!proj.piercing) {
                        proj.destroy();
                        this.projectiles.splice(i, 1);
                        continue;
                    }
                    continue;
                }
            }
            
            // Out of bounds
            if (proj.x < -50 || proj.x > this.cameras.main.width + 50 || 
                proj.y < -50 || proj.y > this.cameras.main.height + 50) {
                proj.destroy();
                this.projectiles.splice(i, 1);
                continue;
            }
        }
        
        // Boss projectiles
        for (let i = this.bossProjectiles.length - 1; i >= 0; i--) {
            const proj = this.bossProjectiles[i];

            // Frost Nova effect: enemy projectiles are suspended while boss is frozen.
            if (this.boss?.frozen) {
                if (proj.glow) {
                    proj.glow.x = proj.x;
                    proj.glow.y = proj.y;
                }
                continue;
            }

            proj.x += proj.vx * (delta / 1000);
            proj.y += proj.vy * (delta / 1000);
            
            if (proj.glow) {
                proj.glow.x = proj.x;
                proj.glow.y = proj.y;
            }
            
            const dist = Phaser.Math.Distance.Between(proj.x, proj.y, this.player.x, this.player.y);
            if (dist < 25 && !this.player.isInvulnerable && !this.player.untargetable) {
                this.player.takeDamage(10);
                GameData.recordDamageTaken(10);
                this.comboDisplay?.reset();
                soundManager.playPlayerHit();

                const hit = this.add.circle(this.player.x, this.player.y, 15, 0xff0000, 0.4);
                this.tweens.add({
                    targets: hit,
                    alpha: 0,
                    scale: 1.3,
                    duration: 150,
                    onComplete: () => hit.destroy()
                });
                
                if (proj.glow) proj.glow.destroy();
                proj.destroy();
                this.bossProjectiles.splice(i, 1);
                continue;
            }
            
            if (proj.x < -50 || proj.x > this.cameras.main.width + 50 || 
                proj.y < -50 || proj.y > this.cameras.main.height + 50) {
                if (proj.glow) proj.glow.destroy();
                proj.destroy();
                this.bossProjectiles.splice(i, 1);
            }
        }
        
        // Update UI (smoothed ratios for better visual polish)
        if (this.player) {
            const healthRatio = this.player.health / this.player.maxHealth;
            const staminaRatio = this.player.stamina / this.player.maxStamina;

            this.displayHealthRatio = Phaser.Math.Linear(this.displayHealthRatio, healthRatio, 0.22);
            this.displayStaminaRatio = Phaser.Math.Linear(this.displayStaminaRatio, staminaRatio, 0.25);

            this.healthBar.width = 300 * this.displayHealthRatio;
            this.healthText.setText(`${Math.floor(this.player.health)}/${this.player.maxHealth}`);

            this.staminaBar.width = 250 * this.displayStaminaRatio;
            this.staminaText.setText(`${Math.floor(this.player.stamina)}`);

            const ultimateRatio = (this.player.ultimateGauge || 0) / (this.player.ultimateGaugeMax || 100);
            this.ultimateBar.width = 250 * ultimateRatio;
            this.ultimateText.setText(`ULT ${Math.floor(ultimateRatio * 100)}%`);
        }

        if (this.boss) {
            const bossHealthRatio = this.boss.health / this.boss.maxHealth;
            this.displayBossHealthRatio = Phaser.Math.Linear(this.displayBossHealthRatio, bossHealthRatio, 0.18);

            this.bossHealthBar.width = 300 * this.displayBossHealthRatio;
            this.bossHealthText.setText(`${Math.floor(this.boss.health)}/${this.boss.maxHealth}`);
        }
        
        // ✅ Update skills UI
        if (this.skillUI && this.skills) {
            this.skillUI.update(this.skills);
        }
        
        // ✅ Update active skills
        if (this.skills) {
            if (this.skills.q) this.skills.q.update();
            if (this.skills.e) this.skills.e.update();
            if (this.skills.r) this.skills.r.update();
        }
        
        // Game over
        if (this.player.health <= 0 && !this._gameEndTriggered) {
            this._gameEndTriggered = true;
            soundManager.playDefeat();
            GameData.endRun(false);
            this.achievementNotifier?.check();

            const crystals = calcCrystalReward({
                victory: false,
                bossId: this.bossId,
                noHit: false,
                highestCombo: GameData.runStats.highestCombo,
                infiniteFloor: this.infiniteFloor
            });
            GameData.addCoins(crystals);

            this.scene.start('GameOverScene', {
                victory: false,
                bossId: this.bossId,
                playerConfig: this.playerConfig,
                affixes: this.affixes,
                scaledHp: this.scaledHp,
                infiniteFloor: this.infiniteFloor,
                crystalsEarned: crystals
            });
        } else if (this.boss?.health <= 0 && !this._gameEndTriggered) {
            this._gameEndTriggered = true;
            soundManager.playVictory();
            GameData.endRun(true);
            if (!this.infiniteFloor) GameData.unlockNextBoss();
            this.achievementNotifier?.check();

            // Calculate and award crystals
            const crystals = calcCrystalReward({
                victory: true,
                bossId: this.bossId,
                noHit: GameData.runStats.noHit,
                highestCombo: GameData.runStats.highestCombo,
                infiniteFloor: this.infiniteFloor
            });
            GameData.addCoins(crystals);

            this.scene.start('GameOverScene', {
                victory: true,
                bossId: this.bossId,
                playerConfig: this.playerConfig,
                affixes: this.affixes,
                scaledHp: this.scaledHp,
                infiniteFloor: this.infiniteFloor,
                crystalsEarned: crystals
            });
        }
    }
}
