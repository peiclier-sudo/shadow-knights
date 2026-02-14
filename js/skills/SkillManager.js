// SkillManager.js - Manages skill usage and cooldowns
import { BattleCrySkill } from './skills/BattleCrySkill.js';
import { IronWillSkill } from './skills/IronWillSkill.js';
import { ExecutionSkill } from './skills/ExecutionSkill.js';
import { FrostNovaSkill } from './skills/FrostNovaSkill.js';
import { ManaShieldSkill } from './skills/ManaShieldSkill.js';
import { ArcaneSurgeSkill } from './skills/ArcaneSurgeSkill.js';
import { BackstabSkill } from './skills/BackstabSkill.js';
import { SmokeBombSkill } from './skills/SmokeBombSkill.js';
import { EviscerateSkill } from './skills/EviscerateSkill.js';

export class SkillManager {
    constructor(scene, player, classData) {
        this.scene = scene;
        this.player = player;
        this.skills = [];
        
        // Create skills based on class
        classData.skills.forEach(skillData => {
            switch(skillData.id) {
                case 'battleCry':
                    this.skills.push(new BattleCrySkill(scene, player));
                    break;
                case 'ironWill':
                    this.skills.push(new IronWillSkill(scene, player));
                    break;
                case 'execution':
                    this.skills.push(new ExecutionSkill(scene, player));
                    break;
                case 'frostNova':
                    this.skills.push(new FrostNovaSkill(scene, player));
                    break;
                case 'manaShield':
                    this.skills.push(new ManaShieldSkill(scene, player));
                    break;
                case 'arcaneSurge':
                    this.skills.push(new ArcaneSurgeSkill(scene, player));
                    break;
                case 'backstab':
                    this.skills.push(new BackstabSkill(scene, player));
                    break;
                case 'smokeBomb':
                    this.skills.push(new SmokeBombSkill(scene, player));
                    break;
                case 'eviscerate':
                    this.skills.push(new EviscerateSkill(scene, player));
                    break;
            }
        });
    }
    
    useSkill(index) {
        if (index >= 0 && index < this.skills.length) {
            return this.skills[index].use();
        }
        return false;
    }
    
    getSkill(index) {
        return this.skills[index];
    }
    
    getAllSkills() {
        return this.skills;
    }
    
    update() {
        this.skills.forEach(skill => skill.update());
    }
    
    destroy() {
        this.skills = [];
    }
}