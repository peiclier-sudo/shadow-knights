// ColorUtils.js - Color manipulation utilities
export const ColorUtils = {
    // Convert hex color to RGB object
    hexToRgb(hex) {
        const r = (hex >> 16) & 0xFF;
        const g = (hex >> 8) & 0xFF;
        const b = hex & 0xFF;
        return { r, g, b };
    },
    
    // Convert RGB to hex color
    rgbToHex(r, g, b) {
        return (r << 16) | (g << 8) | b;
    },
    
    // Lighten a color by percentage (0-1)
    lighten(color, percent) {
        const rgb = this.hexToRgb(color);
        rgb.r = Math.min(255, Math.floor(rgb.r * (1 + percent)));
        rgb.g = Math.min(255, Math.floor(rgb.g * (1 + percent)));
        rgb.b = Math.min(255, Math.floor(rgb.b * (1 + percent)));
        return this.rgbToHex(rgb.r, rgb.g, rgb.b);
    },
    
    // Darken a color by percentage (0-1)
    darken(color, percent) {
        const rgb = this.hexToRgb(color);
        rgb.r = Math.max(0, Math.floor(rgb.r * (1 - percent)));
        rgb.g = Math.max(0, Math.floor(rgb.g * (1 - percent)));
        rgb.b = Math.max(0, Math.floor(rgb.b * (1 - percent)));
        return this.rgbToHex(rgb.r, rgb.g, rgb.b);
    },
    
    // Blend two colors
    blend(color1, color2, ratio = 0.5) {
        const rgb1 = this.hexToRgb(color1);
        const rgb2 = this.hexToRgb(color2);
        
        const r = Math.floor(rgb1.r * (1 - ratio) + rgb2.r * ratio);
        const g = Math.floor(rgb1.g * (1 - ratio) + rgb2.g * ratio);
        const b = Math.floor(rgb1.b * (1 - ratio) + rgb2.b * ratio);
        
        return this.rgbToHex(r, g, b);
    },
    
    // Get complementary color
    complementary(color) {
        const rgb = this.hexToRgb(color);
        return this.rgbToHex(255 - rgb.r, 255 - rgb.g, 255 - rgb.b);
    },
    
    // Get color for health percentage
    healthColor(percent) {
        if (percent < 0.3) return 0xff0000; // Red
        if (percent < 0.6) return 0xffaa00; // Orange
        return 0x00ff88; // Green
    },
    
    // Get color for stamina percentage
    staminaColor(percent) {
        if (percent < 0.2) return 0xff0000; // Red (low)
        if (percent < 0.5) return 0xffaa00; // Orange
        return 0xffaa00; // Yellow/orange
    },
    
    // Random color
    random() {
        return Math.floor(Math.random() * 0xFFFFFF);
    },
    
    // Color for each boss
    bossColor(bossId) {
        const colors = {
            1: 0xff0051, // Sentinel
            2: 0xff6600, // Gunner
            3: 0xcc00ff, // Dasher
            4: 0x1f88d6  // Overlord
        };
        return colors[bossId] || 0xffffff;
    },
    
    // Color for each class
    classColor(className) {
        const colors = {
            WARRIOR: 0xff5500,
            MAGE: 0x3366ff,
            ROGUE: 0xaa44cc
        };
        return colors[className] || 0xffffff;
    },
    
    // Glow effect color (slightly brighter)
    glowColor(color) {
        return this.lighten(color, 0.3);
    },
    
    // Damage color (based on element)
    damageColor(type = 'physical') {
        const colors = {
            physical: 0xffaa00,
            fire: 0xff5500,
            ice: 0x88ccff,
            poison: 0x88aa88,
            arcane: 0xaa88ff
        };
        return colors[type] || 0xffffff;
    }
};