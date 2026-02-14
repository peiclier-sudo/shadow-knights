// TouchInput.js - Mobile touch controls
export class TouchInput {
    constructor(scene) {
        this.scene = scene;
        this.moveJoystick = null;
        this.aimJoystick = null;
        this.dashButton = null;
        this.skillButtons = [];
        
        this.setupJoysticks();
        this.setupButtons();
    }
    
    setupJoysticks() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // Left joystick (movement)
        this.moveJoystick = {
            active: false,
            startX: 150,
            startY: height - 150,
            currentX: 150,
            currentY: height - 150,
            deltaX: 0,
            deltaY: 0,
            base: null,
            thumb: null
        };
        
        // Right joystick (aim)
        this.aimJoystick = {
            active: false,
            startX: width - 150,
            startY: height - 150,
            currentX: width - 150,
            currentY: height - 150,
            deltaX: 0,
            deltaY: 0,
            base: null,
            thumb: null
        };
        
        this.createJoystickVisuals();
    }
    
    createJoystickVisuals() {
        // Move joystick visuals
        this.moveJoystick.base = this.scene.add.circle(
            this.moveJoystick.startX,
            this.moveJoystick.startY,
            55,
            0x0066ff,
            0.3
        );
        this.moveJoystick.base.setStrokeStyle(2, 0x88ddff);
        this.moveJoystick.base.setDepth(300);
        
        this.moveJoystick.thumb = this.scene.add.circle(
            this.moveJoystick.startX,
            this.moveJoystick.startY,
            28,
            0x88ddff,
            0.8
        );
        this.moveJoystick.thumb.setDepth(301);
        
        // Aim joystick visuals
        this.aimJoystick.base = this.scene.add.circle(
            this.aimJoystick.startX,
            this.aimJoystick.startY,
            55,
            0xff6600,
            0.3
        );
        this.aimJoystick.base.setStrokeStyle(2, 0xffaa88);
        this.aimJoystick.base.setDepth(300);
        
        this.aimJoystick.thumb = this.scene.add.circle(
            this.aimJoystick.startX,
            this.aimJoystick.startY,
            28,
            0xffaa88,
            0.8
        );
        this.aimJoystick.thumb.setDepth(301);
        
        // Setup touch events
        this.setupTouchEvents();
    }
    
    setupTouchEvents() {
        this.scene.input.on('pointerdown', (pointer) => {
            this.handleTouchStart(pointer);
        });
        
        this.scene.input.on('pointermove', (pointer) => {
            this.handleTouchMove(pointer);
        });
        
        this.scene.input.on('pointerup', (pointer) => {
            this.handleTouchEnd(pointer);
        });
    }
    
    handleTouchStart(pointer) {
        // Check if touching left side (move joystick)
        if (pointer.x < this.scene.cameras.main.width / 2) {
            if (!this.moveJoystick.active) {
                this.moveJoystick.active = true;
                this.moveJoystick.startX = pointer.x;
                this.moveJoystick.startY = pointer.y;
                this.moveJoystick.currentX = pointer.x;
                this.moveJoystick.currentY = pointer.y;
                
                this.moveJoystick.base.setPosition(pointer.x, pointer.y);
                this.moveJoystick.thumb.setPosition(pointer.x, pointer.y);
            }
        } 
        // Check if touching right side (aim joystick)
        else {
            if (!this.aimJoystick.active) {
                this.aimJoystick.active = true;
                this.aimJoystick.startX = pointer.x;
                this.aimJoystick.startY = pointer.y;
                this.aimJoystick.currentX = pointer.x;
                this.aimJoystick.currentY = pointer.y;
                
                this.aimJoystick.base.setPosition(pointer.x, pointer.y);
                this.aimJoystick.thumb.setPosition(pointer.x, pointer.y);
            }
        }
    }
    
    handleTouchMove(pointer) {
        const maxDist = 55;
        
        // Update move joystick
        if (this.moveJoystick.active && pointer.id === this.moveJoystick.id) {
            const dx = pointer.x - this.moveJoystick.startX;
            const dy = pointer.y - this.moveJoystick.startY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < maxDist) {
                this.moveJoystick.thumb.x = this.moveJoystick.startX + dx;
                this.moveJoystick.thumb.y = this.moveJoystick.startY + dy;
                this.moveJoystick.deltaX = dx / maxDist;
                this.moveJoystick.deltaY = dy / maxDist;
            } else {
                const angle = Math.atan2(dy, dx);
                this.moveJoystick.thumb.x = this.moveJoystick.startX + Math.cos(angle) * maxDist;
                this.moveJoystick.thumb.y = this.moveJoystick.startY + Math.sin(angle) * maxDist;
                this.moveJoystick.deltaX = Math.cos(angle);
                this.moveJoystick.deltaY = Math.sin(angle);
            }
        }
        
        // Update aim joystick
        if (this.aimJoystick.active && pointer.id === this.aimJoystick.id) {
            const dx = pointer.x - this.aimJoystick.startX;
            const dy = pointer.y - this.aimJoystick.startY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < maxDist) {
                this.aimJoystick.thumb.x = this.aimJoystick.startX + dx;
                this.aimJoystick.thumb.y = this.aimJoystick.startY + dy;
                this.aimJoystick.deltaX = dx / maxDist;
                this.aimJoystick.deltaY = dy / maxDist;
            } else {
                const angle = Math.atan2(dy, dx);
                this.aimJoystick.thumb.x = this.aimJoystick.startX + Math.cos(angle) * maxDist;
                this.aimJoystick.thumb.y = this.aimJoystick.startY + Math.sin(angle) * maxDist;
                this.aimJoystick.deltaX = Math.cos(angle);
                this.aimJoystick.deltaY = Math.sin(angle);
            }
        }
    }
    
    handleTouchEnd(pointer) {
        if (this.moveJoystick.active && pointer.id === this.moveJoystick.id) {
            this.moveJoystick.active = false;
            this.moveJoystick.deltaX = 0;
            this.moveJoystick.deltaY = 0;
            this.moveJoystick.base.setPosition(150, this.scene.cameras.main.height - 150);
            this.moveJoystick.thumb.setPosition(150, this.scene.cameras.main.height - 150);
        }
        
        if (this.aimJoystick.active && pointer.id === this.aimJoystick.id) {
            this.aimJoystick.active = false;
            this.aimJoystick.deltaX = 0;
            this.aimJoystick.deltaY = 0;
            this.aimJoystick.base.setPosition(this.scene.cameras.main.width - 150, this.scene.cameras.main.height - 150);
            this.aimJoystick.thumb.setPosition(this.scene.cameras.main.width - 150, this.scene.cameras.main.height - 150);
        }
    }
    
    getMovement() {
        return {
            x: this.moveJoystick.deltaX,
            y: this.moveJoystick.deltaY
        };
    }
    
    getAim() {
        return {
            x: this.aimJoystick.deltaX,
            y: this.aimJoystick.deltaY
        };
    }
    
    setupButtons() {
        // Dash button
        this.dashButton = this.scene.add.text(
            this.scene.cameras.main.width - 100,
            100,
            '⚡',
            { fontSize: '40px', fill: '#00d4ff' }
        ).setInteractive();
    }
}