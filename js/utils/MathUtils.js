// MathUtils.js - Mathematical helper functions
export const MathUtils = {
    // Clamp a value between min and max
    clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    },
    
    // Linear interpolation
    lerp(start, end, t) {
        return start * (1 - t) + end * t;
    },
    
    // Map a value from one range to another
    map(value, fromMin, fromMax, toMin, toMax) {
        const t = (value - fromMin) / (fromMax - fromMin);
        return this.lerp(toMin, toMax, t);
    },
    
    // Get distance between two points
    distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },
    
    // Get angle between two points (in radians)
    angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },
    
    // Convert degrees to radians
    degToRad(degrees) {
        return degrees * Math.PI / 180;
    },
    
    // Convert radians to degrees
    radToDeg(radians) {
        return radians * 180 / Math.PI;
    },
    
    // Random float between min and max
    randomFloat(min, max) {
        return min + Math.random() * (max - min);
    },
    
    // Random integer between min and max (inclusive)
    randomInt(min, max) {
        return Math.floor(min + Math.random() * (max - min + 1));
    },
    
    // Random point on circle
    randomPointOnCircle(radius) {
        const angle = Math.random() * Math.PI * 2;
        return {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius
        };
    },
    
    // Check if two circles collide
    circlesCollide(x1, y1, r1, x2, y2, r2) {
        const dist = this.distance(x1, y1, x2, y2);
        return dist < r1 + r2;
    },
    
    // Calculate knockback direction
    knockbackDirection(fromX, fromY, toX, toY, force) {
        const angle = this.angle(fromX, fromY, toX, toY);
        return {
            x: Math.cos(angle) * force,
            y: Math.sin(angle) * force
        };
    },
    
    // Easing functions
    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    },
    
    easeOutElastic(t) {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },
    
    easeInBounce(t) {
        return 1 - this.easeOutBounce(1 - t);
    },
    
    easeOutBounce(t) {
        const n1 = 7.5625;
        const d1 = 2.75;
        
        if (t < 1 / d1) {
            return n1 * t * t;
        } else if (t < 2 / d1) {
            return n1 * (t -= 1.5 / d1) * t + 0.75;
        } else if (t < 2.5 / d1) {
            return n1 * (t -= 2.25 / d1) * t + 0.9375;
        } else {
            return n1 * (t -= 2.625 / d1) * t + 0.984375;
        }
    }
};