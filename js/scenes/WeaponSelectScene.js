// WeaponSelectScene.js - legacy scene redirects to unified loadout page
export class WeaponSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WeaponSelectScene' });
    }

    init(data) {
        this.playerClass = data.playerClass || 'WARRIOR';
    }

    create() {
        this.scene.start('ClassSelectScene', {
            playerClass: this.playerClass
        });
    }
}
