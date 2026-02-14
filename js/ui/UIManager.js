// UIManager.js - Manages all UI elements
import { HealthBar } from './HealthBar.js';
import { StaminaBar } from './StaminaBar.js';
import { SkillButton } from './SkillButton.js';

export class UIManager {
    constructor(scene) {
        this.scene = scene;
        
        // Create UI elements
        this.createHealthBar();
        this.createStaminaBar();
        this.createSkillButtons();
        this.createBossHealthBar();
    }
    
    createHealthBar() {
        const x = 20;
        const y = 20;
        
        // Background
        this.healthBarBg = this.scene.add.rectangle(x, y, 300, 25, 0x333333);
        this.healthBarBg.setOrigin(0, 0.5);
        this.healthBarBg.setStrokeStyle(2, 0x666666);
        
        // Health fill
        this.healthBar = this.scene.add.rectangle(x, y, 300, 25, 0x00ff88);
        this.healthBar.setOrigin(0, 0.5);
        
        // Health text
        this.healthText = this.scene.add.text(x + 310, y, '100/100', {
            fontSize: '16px',
            fill: '#fff'
        }).setOrigin(0, 0.5);
    }
    
    createStaminaBar() {
        const x = 20;
        const y = 55;
        
        // Background
        this.staminaBarBg = this.scene.add.rectangle(x, y, 250, 15, 0x333333);
        this.staminaBarBg.setOrigin(0, 0.5);
        this.staminaBarBg.setStrokeStyle(2, 0x666666);
        
        // Stamina fill
        this.staminaBar = this.scene.add.rectangle(x, y, 250, 15, 0xffaa00);
        this.staminaBar.setOrigin(0, 0.5);
        
        // Stamina text
        this.staminaText = this.scene.add.text(x + 260, y, '100', {
            fontSize: '14px',
            fill: '#ffaa00'
        }).setOrigin(0, 0.5);
    }
    
    createBossHealthBar() {
        const width = this.scene.cameras.main.width;
        const x = width - 350;
        const y = 40;
        
        // Boss name
        this.bossName = this.scene.add.text(width - 200, 20, this.scene.boss?.bossData?.name || 'BOSS', {
            fontSize: '20px',
            fill: '#ff5555',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Background
        this.bossHealthBarBg = this.scene.add.rectangle(x, y, 300, 25, 0x333333);
        this.bossHealthBarBg.setOrigin(0, 0.5);
        this.bossHealthBarBg.setStrokeStyle(2, 0x666666);
        
        // Boss health fill
        this.bossHealthBar = this.scene.add.rectangle(x, y, 300, 25, 0xff5555);
        this.bossHealthBar.setOrigin(0, 0.5);
        
        // Boss health text
        this.bossHealthText = this.scene.add.text(x + 310, y, '400/400', {
            fontSize: '16px',
            fill: '#fff'
        }).setOrigin(0, 0.5);
    }
    
    createSkillButtons() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        const playerClass = this.scene.player?.classData;
        
        if (!playerClass) return;
        
        this.skillButtons = [];
        
        playerClass.skills.forEach((skillData, index) => {
            const x = width - 300 + index * 90;
            const y = height - 100;
            
            const button = new SkillButton(this.scene, x, y, skillData, index);
            this.skillButtons.push(button);
        });
    }
    
    update(player, boss) {
        // Update health bar
        const healthPercent = player.health / player.maxHealth;
        this.healthBar.width = 300 * healthPercent;
        this.healthText.setText(`${Math.floor(player.health)}/${player.maxHealth}`);
        
        // Change color based on health
        if (healthPercent < 0.3) {
            this.healthBar.fillColor = 0xff0000;
        } else if (healthPercent < 0.6) {
            this.healthBar.fillColor = 0xffaa00;
        } else {
            this.healthBar.fillColor = 0x00ff88;
        }
        
        // Update stamina bar
        const staminaPercent = player.stamina / player.maxStamina;
        this.staminaBar.width = 250 * staminaPercent;
        this.staminaText.setText(`${Math.floor(player.stamina)}`);
        
        // Update boss health bar
        if (boss) {
            const bossHealthPercent = boss.health / boss.maxHealth;
            this.bossHealthBar.width = 300 * bossHealthPercent;
            this.bossHealthText.setText(`${Math.floor(boss.health)}/${boss.maxHealth}`);
            
            // Update boss name color based on health
            if (bossHealthPercent < 0.3) {
                this.bossName.setFill('#ff0000');
            } else {
                this.bossName.setFill('#ff5555');
            }
        }
        
        // Update skill buttons
        this.skillButtons?.forEach(button => button.update());
    }
}