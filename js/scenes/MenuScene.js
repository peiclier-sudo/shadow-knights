// MenuScene.js - Main menu
import { authManager } from '../data/AuthManager.js';

export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
        this.authElements = null;
        this.statusText = null;
    }
    
    async create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Background
        this.add.graphics()
            .fillStyle(0x0a0a14, 1)
            .fillRect(0, 0, width, height);
        
        // Title with glow
        const title = this.add.text(width/2, height/3, 'SHADOW KNIGHTS', {
            fontSize: '64px',
            fill: '#00d4ff',
            fontStyle: 'bold',
            stroke: '#fff',
            strokeThickness: 2,
            shadow: {
                offsetX: 0,
                offsetY: 0,
                color: '#00d4ff',
                blur: 20,
                fill: true
            }
        }).setOrigin(0.5);
        
        // Animate title
        this.tweens.add({
            targets: title,
            scale: 1.05,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Start button
        const startBtn = this.add.text(width/2, height/2, 'START GAME', {
            fontSize: '32px',
            fill: '#fff',
            backgroundColor: '#333',
            padding: { x: 30, y: 15 },
            stroke: '#00d4ff',
            strokeThickness: 1
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        startBtn.on('pointerover', () => {
            startBtn.setStyle({ fill: '#00d4ff' });
            this.tweens.add({ targets: startBtn, scale: 1.1, duration: 200 });
        });
        
        startBtn.on('pointerout', () => {
            startBtn.setStyle({ fill: '#fff' });
            this.tweens.add({ targets: startBtn, scale: 1, duration: 200 });
        });
        
        startBtn.on('pointerdown', () => {
            this.scene.start('ClassSelectScene');
        });

        this.statusText = this.add.text(width / 2, height / 2 + 75, 'Joue en invité ou connecte-toi en haut à droite', {
            fontSize: '18px',
            fill: '#9aa4bf'
        }).setOrigin(0.5);

        await authManager.init();
        this.createAuthOverlay();
        this.updateAuthStatus();
        
        // Credits
        this.add.text(width/2, height - 100, 'CREATED WITH PHASER 3', {
            fontSize: '16px',
            fill: '#666'
        }).setOrigin(0.5);
        
        // Floating particles for ambiance
        for (let i = 0; i < 30; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const particle = this.add.circle(x, y, 2, 0x00d4ff, 0.3);
            
            this.tweens.add({
                targets: particle,
                y: y + Phaser.Math.Between(-30, 30),
                alpha: 0.1,
                duration: Phaser.Math.Between(2000, 4000),
                yoyo: true,
                repeat: -1
            });
        }

        this.events.once('shutdown', () => this.destroyAuthOverlay());
        this.events.once('destroy', () => this.destroyAuthOverlay());
    }

    createAuthOverlay() {
        const panel = document.createElement('div');
        panel.id = 'auth-panel';
        Object.assign(panel.style, {
            position: 'fixed',
            top: '16px',
            right: '16px',
            width: '280px',
            padding: '14px',
            border: '1px solid #00d4ff',
            borderRadius: '10px',
            background: 'rgba(10, 10, 20, 0.92)',
            boxShadow: '0 0 18px rgba(0, 212, 255, 0.35)',
            zIndex: '99999',
            color: '#fff',
            fontFamily: 'Arial, sans-serif'
        });

        panel.innerHTML = `
            <h3 style="margin:0 0 8px 0; color:#00d4ff; font-size:18px;">Compte joueur</h3>
            <p id="auth-msg" style="margin:0 0 8px 0; min-height:18px; font-size:13px; color:#b8c2e0;"></p>
            <input id="auth-email" type="email" placeholder="Email" style="width:100%;margin-bottom:8px;padding:8px;border-radius:6px;border:1px solid #3a4b77;background:#10182c;color:#fff;" />
            <input id="auth-password" type="password" placeholder="Mot de passe (6+ caractères)" style="width:100%;margin-bottom:10px;padding:8px;border-radius:6px;border:1px solid #3a4b77;background:#10182c;color:#fff;" />
            <div style="display:flex;gap:8px;">
                <button id="auth-login" style="flex:1;padding:8px;border:none;border-radius:6px;background:#00d4ff;color:#001326;cursor:pointer;font-weight:bold;">Login</button>
                <button id="auth-register" style="flex:1;padding:8px;border:1px solid #00d4ff;border-radius:6px;background:transparent;color:#00d4ff;cursor:pointer;">Register</button>
            </div>
            <button id="auth-logout" style="display:none;width:100%;margin-top:10px;padding:8px;border:none;border-radius:6px;background:#ff4f7a;color:#fff;cursor:pointer;">Logout</button>
        `;

        document.body.appendChild(panel);

        const emailInput = panel.querySelector('#auth-email');
        const passwordInput = panel.querySelector('#auth-password');
        const loginBtn = panel.querySelector('#auth-login');
        const registerBtn = panel.querySelector('#auth-register');
        const logoutBtn = panel.querySelector('#auth-logout');
        const message = panel.querySelector('#auth-msg');

        const setMessage = (text, isError = false) => {
            message.textContent = text;
            message.style.color = isError ? '#ff97b3' : '#b8c2e0';
        };

        loginBtn.addEventListener('click', async () => {
            try {
                await authManager.signIn(emailInput.value.trim(), passwordInput.value.trim());
                setMessage('Connexion réussie.');
                this.updateAuthStatus();
            } catch (error) {
                setMessage(error.message || 'Impossible de se connecter.', true);
            }
        });

        registerBtn.addEventListener('click', async () => {
            try {
                await authManager.signUp(emailInput.value.trim(), passwordInput.value.trim());
                setMessage('Compte créé. Vérifie ton email si confirmation activée.');
                this.updateAuthStatus();
            } catch (error) {
                setMessage(error.message || 'Impossible de créer le compte.', true);
            }
        });

        logoutBtn.addEventListener('click', async () => {
            try {
                await authManager.signOut();
                setMessage('Déconnecté.');
                this.updateAuthStatus();
            } catch (error) {
                setMessage(error.message || 'Erreur de déconnexion.', true);
            }
        });

        this.authElements = { panel, emailInput, passwordInput, loginBtn, registerBtn, logoutBtn, setMessage };
    }

    updateAuthStatus() {
        if (!this.authElements) {
            return;
        }

        if (!authManager.isConfigured()) {
            this.authElements.setMessage('Supabase non configuré. Ajoute SUPABASE_URL et SUPABASE_ANON_KEY.');
            this.authElements.loginBtn.disabled = true;
            this.authElements.registerBtn.disabled = true;
            this.authElements.logoutBtn.style.display = 'none';
            return;
        }

        this.authElements.loginBtn.disabled = false;
        this.authElements.registerBtn.disabled = false;

        const user = authManager.getCurrentUser();

        if (user) {
            this.authElements.emailInput.value = user.email || '';
            this.authElements.passwordInput.value = '';
            this.authElements.emailInput.disabled = true;
            this.authElements.passwordInput.disabled = true;
            this.authElements.loginBtn.style.display = 'none';
            this.authElements.registerBtn.style.display = 'none';
            this.authElements.logoutBtn.style.display = 'block';
            this.authElements.setMessage(`Connecté: ${user.email}`);
            this.statusText.setText(`Connecté en tant que ${user.email}`);
        } else {
            this.authElements.emailInput.disabled = false;
            this.authElements.passwordInput.disabled = false;
            this.authElements.loginBtn.style.display = 'block';
            this.authElements.registerBtn.style.display = 'block';
            this.authElements.logoutBtn.style.display = 'none';
            this.statusText.setText('Joue en invité ou connecte-toi en haut à droite');
        }
    }

    destroyAuthOverlay() {
        if (!this.authElements?.panel) {
            return;
        }

        this.authElements.panel.remove();
        this.authElements = null;
    }
}
