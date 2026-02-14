// KeyboardInput.js - Desktop keyboard controls
export class KeyboardInput {
    constructor(scene) {
        this.scene = scene;
        this.keys = scene.input.keyboard.addKeys({
            up: 'W',
            down: 'S',
            left: 'A',
            right: 'D',
            dash: 'SPACE',
            skill1: 'E',
            skill2: 'R',
            skill3: 'F',
            interact: 'F'
        });
    }
    
    getMovement() {
        let dx = 0, dy = 0;
        
        if (this.keys.left.isDown) dx -= 1;
        if (this.keys.right.isDown) dx += 1;
        if (this.keys.up.isDown) dy -= 1;
        if (this.keys.down.isDown) dy += 1;
        
        return { x: dx, y: dy };
    }
    
    isDashing() {
        return Phaser.Input.Keyboard.JustDown(this.keys.dash);
    }
    
    getSkillPress(index) {
        switch(index) {
            case 0: return Phaser.Input.Keyboard.JustDown(this.keys.skill1);
            case 1: return Phaser.Input.Keyboard.JustDown(this.keys.skill2);
            case 2: return Phaser.Input.Keyboard.JustDown(this.keys.skill3);
            default: return false;
        }
    }
    
    isMoving() {
        return this.keys.left.isDown || this.keys.right.isDown || 
               this.keys.up.isDown || this.keys.down.isDown;
    }
}