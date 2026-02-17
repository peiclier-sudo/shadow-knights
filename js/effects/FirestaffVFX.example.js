// FirestaffVFX.example.js
// Example integration snippet for a Phaser.Scene using FirestaffVFX (no asset preload required)

import { FirestaffVFX } from './FirestaffVFX.js';

export class FirestaffDemoScene extends Phaser.Scene {
    constructor() {
        super({ key: 'FirestaffDemoScene' });
    }

    preload() {
        // No external assets needed.
    }

    create() {
        // Simple dark background to showcase additive flame glow.
        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x07090f)
            .setOrigin(0, 0);

        // Placeholder owner/player (procedural body)
        this.player = this.add.container(this.scale.width * 0.35, this.scale.height * 0.58);
        const body = this.add.circle(0, 0, 18, 0x6db8ff, 0.9).setStrokeStyle(2, 0xffffff, 0.7);
        this.player.add(body);

        this.facing = 1;

        this.firestaff = new FirestaffVFX(this, {
            intensity: 1,
            glowSize: 44,
            emberRate: 26,
            trailLength: 12,
            debug: false
        });

        this.firestaff.setOwner(this.player);
        this.firestaff.setFacing(this.facing);
        this.firestaff.playIdle();

        this.input.keyboard.on('keydown-SPACE', () => {
            this.firestaff.playAttack();
        });

        this.input.keyboard.on('keydown-H', () => {
            this.firestaff.playHitFlash();
        });

        this.input.keyboard.on('keydown-D', () => {
            this.firestaff.settings.debug = !this.firestaff.settings.debug;
            this.firestaff.debugTip.setVisible(this.firestaff.settings.debug);
        });

        this.input.keyboard.on('keydown-F', () => {
            this.facing *= -1;
            this.firestaff.setFacing(this.facing);
        });

        // Simulated horizontal movement
        this.cursors = this.input.keyboard.createCursorKeys();
    }

    update(_time, delta) {
        const speed = 0.25 * delta;
        if (this.cursors.left.isDown) this.player.x -= speed;
        if (this.cursors.right.isDown) this.player.x += speed;

        this.firestaff.update(delta);
    }
}
