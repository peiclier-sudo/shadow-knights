// InputManager.js - Unified input handling
export class InputManager {
    constructor(scene) {
        this.scene = scene;
        this.keys = {};
        this.mouse = { x: 0, y: 0, left: false, right: false };
        this.touches = [];
        this.gamepad = null;
        
        this.setupKeyboard();
        this.setupMouse();
        this.setupTouch();
        this.setupGamepad();
    }
    
    setupKeyboard() {
        const keyCodes = Phaser.Input.Keyboard.KeyCodes;
        
        this.keys = {
            up: this.scene.input.keyboard.addKey(keyCodes.UP),
            down: this.scene.input.keyboard.addKey(keyCodes.DOWN),
            left: this.scene.input.keyboard.addKey(keyCodes.LEFT),
            right: this.scene.input.keyboard.addKey(keyCodes.RIGHT),
            space: this.scene.input.keyboard.addKey(keyCodes.SPACE),
            shift: this.scene.input.keyboard.addKey(keyCodes.SHIFT),
            ctrl: this.scene.input.keyboard.addKey(keyCodes.CTRL),
            a: this.scene.input.keyboard.addKey(keyCodes.A),
            d: this.scene.input.keyboard.addKey(keyCodes.D),
            w: this.scene.input.keyboard.addKey(keyCodes.W),
            s: this.scene.input.keyboard.addKey(keyCodes.S)
        };
    }
    
    setupMouse() {
        this.scene.input.on('pointermove', (pointer) => {
            this.mouse.x = pointer.x;
            this.mouse.y = pointer.y;
        });
        
        this.scene.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                this.mouse.left = true;
            }
            if (pointer.rightButtonDown()) {
                this.mouse.right = true;
            }
        });
        
        this.scene.input.on('pointerup', (pointer) => {
            if (pointer.button === 0) {
                this.mouse.left = false;
            }
            if (pointer.button === 2) {
                this.mouse.right = false;
            }
        });
        
        // Disable right-click context menu
        this.scene.input.mouse.disableContextMenu();
    }
    
    setupTouch() {
        this.scene.input.addPointer(3);
        
        this.scene.input.on('pointerdown', (pointer) => {
            this.touches.push({
                id: pointer.id,
                x: pointer.x,
                y: pointer.y
            });
        });
        
        this.scene.input.on('pointermove', (pointer) => {
            const touch = this.touches.find(t => t.id === pointer.id);
            if (touch) {
                touch.x = pointer.x;
                touch.y = pointer.y;
            }
        });
        
        this.scene.input.on('pointerup', (pointer) => {
            this.touches = this.touches.filter(t => t.id !== pointer.id);
        });
    }
    
    setupGamepad() {
        if (navigator.getGamepads) {
            this.scene.events.on('update', this.updateGamepad, this);
        }
    }
    
    updateGamepad() {
        const gamepads = navigator.getGamepads();
        this.gamepad = gamepads[0]; // Use first gamepad
    }
    
    getMovementDirection() {
        let dx = 0, dy = 0;
        
        // Keyboard
        if (this.keys.left.isDown || this.keys.a.isDown) dx -= 1;
        if (this.keys.right.isDown || this.keys.d.isDown) dx += 1;
        if (this.keys.up.isDown || this.keys.w.isDown) dy -= 1;
        if (this.keys.down.isDown || this.keys.s.isDown) dy += 1;
        
        // Mouse (if left click)
        if (this.mouse.left) {
            const sceneDx = this.mouse.x - this.scene.player.x;
            const sceneDy = this.mouse.y - this.scene.player.y;
            const dist = Math.sqrt(sceneDx * sceneDx + sceneDy * sceneDy);
            
            if (dist > 10) {
                dx = sceneDx / dist;
                dy = sceneDy / dist;
            }
        }
        
        // Gamepad
        if (this.gamepad) {
            const axisX = this.gamepad.axes[0];
            const axisY = this.gamepad.axes[1];
            
            if (Math.abs(axisX) > 0.2) dx = axisX;
            if (Math.abs(axisY) > 0.2) dy = axisY;
        }
        
        // Normalize
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length > 0) {
            dx /= length;
            dy /= length;
        }
        
        return { x: dx, y: dy };
    }
    
    getAimDirection() {
        // Mouse aim (priority)
        if (this.mouse.x !== 0 || this.mouse.y !== 0) {
            const dx = this.mouse.x - this.scene.player.x;
            const dy = this.mouse.y - this.scene.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 5) {
                return { x: dx / dist, y: dy / dist };
            }
        }
        
        // Gamepad right stick
        if (this.gamepad) {
            const axisX = this.gamepad.axes[2];
            const axisY = this.gamepad.axes[3];
            
            if (Math.abs(axisX) > 0.2 || Math.abs(axisY) > 0.2) {
                return { x: axisX, y: axisY };
            }
        }
        
        // Default to facing right
        return { x: 1, y: 0 };
    }
    
    isDashPressed() {
        return Phaser.Input.Keyboard.JustDown(this.keys.space) || 
               (this.gamepad?.buttons[0]?.pressed);
    }
    
    isSkillPressed(index) {
        const skillKeys = [this.keys.a, this.keys.s, this.keys.d];
        return index < skillKeys.length && Phaser.Input.Keyboard.JustDown(skillKeys[index]);
    }
    
    destroy() {
        // Cleanup
    }
}