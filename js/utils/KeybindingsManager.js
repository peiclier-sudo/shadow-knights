// KeybindingsManager.js — Persistent keybindings with localStorage support

export const DEFAULT_BINDINGS = {
    dash:         'SPACE',
    ultimate:     'F',
    rangePreview: 'T',
    skillQ:       'Q',
    skillE:       'E',
    skillR:       'R',
    potion:       'ONE',
};

export const ACTION_LABELS = {
    dash:         'Dash',
    ultimate:     'Ultimate (hold)',
    rangePreview: 'Range Preview',
    skillQ:       'Skill Q',
    skillE:       'Skill E',
    skillR:       'Skill R',
    potion:       'Use Potion (1)',
};

// Human-readable display names for Phaser key codes
const KEY_DISPLAY = {
    SPACE: 'SPACE', TAB: 'TAB', ENTER: 'ENTER', BACKSPACE: 'BACKSPACE',
    SHIFT: 'SHIFT', ALT: 'ALT', CTRL: 'CTRL',
    UP: '↑', DOWN: '↓', LEFT: '←', RIGHT: '→',
    ONE: '1', TWO: '2', THREE: '3', FOUR: '4', FIVE: '5',
    SIX: '6', SEVEN: '7', EIGHT: '8', NINE: '9', ZERO: '0',
    A: 'A', B: 'B', C: 'C', D: 'D', E: 'E', F: 'F', G: 'G',
    H: 'H', I: 'I', J: 'J', K: 'K', L: 'L', M: 'M', N: 'N',
    O: 'O', P: 'P', Q: 'Q', R: 'R', S: 'S', T: 'T', U: 'U',
    V: 'V', W: 'W', X: 'X', Y: 'Y', Z: 'Z',
};

// Keys that cannot be rebound (reserved for system use)
const BLOCKED_KEYS = new Set(['ESC', 'ESCAPE']);

// Map from browser keyCode integers to Phaser key strings
const KEYCODE_MAP = {
    32: 'SPACE', 9: 'TAB', 13: 'ENTER', 8: 'BACKSPACE',
    16: 'SHIFT', 18: 'ALT', 17: 'CTRL',
    38: 'UP', 40: 'DOWN', 37: 'LEFT', 39: 'RIGHT',
    49: 'ONE', 50: 'TWO', 51: 'THREE', 52: 'FOUR', 53: 'FIVE',
    54: 'SIX', 55: 'SEVEN', 56: 'EIGHT', 57: 'NINE', 48: 'ZERO',
    65: 'A', 66: 'B', 67: 'C', 68: 'D', 69: 'E', 70: 'F', 71: 'G',
    72: 'H', 73: 'I', 74: 'J', 75: 'K', 76: 'L', 77: 'M', 78: 'N',
    79: 'O', 80: 'P', 81: 'Q', 82: 'R', 83: 'S', 84: 'T', 85: 'U',
    86: 'V', 87: 'W', 88: 'X', 89: 'Y', 90: 'Z',
};

export class KeybindingsManager {
    constructor() {
        this._bindings = { ...DEFAULT_BINDINGS };
        this._load();
    }

    /** Get the current key code for an action. */
    get(action) {
        return this._bindings[action] ?? DEFAULT_BINDINGS[action];
    }

    /** Assign a new key code to an action. Returns false if the key is blocked. */
    set(action, keyCode) {
        if (BLOCKED_KEYS.has(keyCode)) return false;
        this._bindings[action] = keyCode;
        this._save();
        return true;
    }

    /** Return a copy of all current bindings. */
    getAll() {
        return { ...this._bindings };
    }

    /** Reset all bindings to defaults. */
    reset() {
        this._bindings = { ...DEFAULT_BINDINGS };
        this._save();
    }

    /** Return a user-friendly display string for a key code. */
    displayName(keyCode) {
        return KEY_DISPLAY[keyCode] ?? keyCode;
    }

    /** Convert a browser keyCode integer to a Phaser key string (e.g. 65 → 'A'). */
    static keycodeToString(keyCode) {
        return KEYCODE_MAP[keyCode] ?? null;
    }

    _load() {
        try {
            const saved = JSON.parse(localStorage.getItem('sk_keybindings') ?? 'null');
            if (saved && typeof saved === 'object') {
                this._bindings = { ...DEFAULT_BINDINGS, ...saved };
            }
        } catch (_) {
            this._bindings = { ...DEFAULT_BINDINGS };
        }
    }

    _save() {
        localStorage.setItem('sk_keybindings', JSON.stringify(this._bindings));
    }
}

export const keybindingsManager = new KeybindingsManager();
