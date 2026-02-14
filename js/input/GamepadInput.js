// GamepadInput.js - Controller support
export class GamepadInput {
    constructor(scene) {
        this.scene = scene;
        this.gamepad = null;
        this.previousButtons = {};
        
        this.setupGamepadEvents();
    }
    
    setupGamepadEvents() {
        window.addEventListener('gamepadconnected', (e) => {
            this.gamepad = e.gamepad;
            console.log('Gamepad connected:', this.gamepad.id);
        });
        
        window.addEventListener('gamepaddisconnected', (e) => {
            console.log('Gamepad disconnected');
            this.gamepad = null;
        });
    }
    
    update() {
        if (!this.gamepad) {
            const gamepads = navigator.getGamepads();
            this.gamepad = gamepads[0];
        }
        
        if (this.gamepad) {
            // Store previous button states
            for (let i = 0; i < this.gamepad.buttons.length; i++) {
                this.previousButtons[i] = this.gamepad.buttons[i].pressed;
            }
        }
    }
    
    getMovement() {
        if (!this.gamepad) return { x: 0, y: 0 };
        
        let x = this.gamepad.axes[0];
        let y = this.gamepad.axes[1];
        
        // Deadzone
        if (Math.abs(x) < 0.2) x = 0;
        if (Math.abs(y) < 0.2) y = 0;
        
        return { x, y };
    }
    
    getAim() {
        if (!this.gamepad) return { x: 0, y: 0 };
        
        let x = this.gamepad.axes[2];
        let y = this.gamepad.axes[3];
        
        // Deadzone
        if (Math.abs(x) < 0.2) x = 0;
        if (Math.abs(y) < 0.2) y = 0;
        
        return { x, y };
    }
    
    isButtonPressed(buttonIndex) {
        return this.gamepad?.buttons[buttonIndex]?.pressed || false;
    }
    
    isButtonJustPressed(buttonIndex) {
        if (!this.gamepad) return false;
        return this.gamepad.buttons[buttonIndex].pressed && !this.previousButtons[buttonIndex];
    }
    
    isDashPressed() {
        return this.isButtonJustPressed(0); // A button
    }
    
    isSkillPressed(index) {
        // X, Y, B buttons
        const buttons = [2, 3, 1];
        return this.isButtonJustPressed(buttons[index]);
    }
    
    isPaused() {
        return this.isButtonJustPressed(9); // Start button
    }
}