// MenuScene.js - Main menu
import { authManager } from '../data/AuthManager.js';

const COLORS = {
    bgTop: 0x050915,
    bgBottom: 0x101a30,
    panel: 0x111d35,
    panelBorder: 0x29446f,
    accent: '#67e8f9',
    primaryText: '#ecf4ff',
    secondaryText: '#93a8ca',
    mutedText: '#6e86ad'
};

export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
        this.authElements = null;
        this.statusText = null;
        this.toastLabel = null;
    }

    async create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.createBackground(width, height);
        this.createHeader(width);
        this.createNavigation(width, height);
        this.createInfoPanels(width, height);
        this.createFooter(width, height);

        await authManager.init();
        this.createAuthOverlay();
        this.updateAuthStatus();

        this.events.once('shutdown', () => this.destroyAuthOverlay());
        this.events.once('destroy', () => this.destroyAuthOverlay());
    }

    createBackground(width, height) {
        const bg = this.add.graphics();
        bg.fillGradientStyle(COLORS.bgTop, COLORS.bgTop, COLORS.bgBottom, COLORS.bgBottom, 1);
        bg.fillRect(0, 0, width, height);

        for (let i = 0; i < 70; i++) {
            const glow = this.add.circle(
                Phaser.Math.Between(0, width),
                Phaser.Math.Between(0, height),
                Phaser.Math.Between(1, 2),
                0x60a5fa,
                Phaser.Math.FloatBetween(0.08, 0.28)
            );

            this.tweens.add({
                targets: glow,
                alpha: Phaser.Math.FloatBetween(0.03, 0.35),
                y: glow.y + Phaser.Math.Between(-25, 25),
                duration: Phaser.Math.Between(2200, 4800),
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
            });
        }
    }

    createHeader(width) {
        this.add.text(88, 60, 'SHADOW KNIGHTS', {
            fontSize: width < 1200 ? '56px' : '68px',
            fill: COLORS.primaryText,
            fontStyle: 'bold',
            stroke: '#22d3ee',
            strokeThickness: 2
        });

        this.add.text(92, 132, 'Ultimate Boss Rush Experience', {
            fontSize: '24px',
            fill: COLORS.secondaryText
        });

        this.add.text(width - 330, 80, 'VERSION 1.1 • LIVE', {
            fontSize: '14px',
            fill: '#a5b4fc',
            backgroundColor: '#1e1b4b',
            padding: { x: 10, y: 6 }
        });
    }

    createNavigation(width, height) {
        const panel = this.createPanel(80, 190, 530, height - 300);

        this.add.text(panel.x + 28, panel.y + 22, 'NAVIGATION', {
            fontSize: '18px',
            fill: COLORS.accent,
            fontStyle: 'bold'
        });

        const buttons = [
            { label: 'NOUVELLE PARTIE', icon: '▶', action: () => this.scene.start('ClassSelectScene') },
            { label: 'DASHBOARD JOUEUR', icon: '📊', action: () => this.scene.start('DashboardScene') },
            { label: 'AIDE & CONTRÔLES', icon: '❓', action: () => this.showToast('ZQSD/Flèches = déplacement • ESPACE = attaque • SHIFT = dodge') },
            { label: 'PARAMÈTRES', icon: '⚙', action: () => this.showToast('Menu paramètres disponible dans la prochaine mise à jour.') }
        ];

        buttons.forEach((item, index) => {
            this.createMenuButton(panel.x + 28, panel.y + 76 + index * 84, `${item.icon}  ${item.label}`, item.action);
        });

        this.statusText = this.add.text(panel.x + 28, panel.y + panel.height - 74, 'Mode invité actif. Connecte-toi en haut à droite.', {
            fontSize: '16px',
            fill: COLORS.secondaryText,
            wordWrap: { width: panel.width - 56 }
        });
    }

    createInfoPanels(width, height) {
        const x = width - 520;
        const firstPanel = this.createPanel(x, 190, 440, 250);
        const secondPanel = this.createPanel(x, 470, 440, height - 580);

        this.add.text(firstPanel.x + 24, firstPanel.y + 20, 'MISSION BOARD', {
            fontSize: '18px',
            fill: '#7dd3fc',
            fontStyle: 'bold'
        });

        this.add.text(firstPanel.x + 24, firstPanel.y + 56, '• Battre un boss sans mourir\n• Finir 3 runs en moins de 10 min\n• Tester une classe non utilisée', {
            fontSize: '17px',
            fill: '#d6e4ff',
            lineSpacing: 10
        });

        this.add.text(secondPanel.x + 24, secondPanel.y + 20, 'PATCH NOTES', {
            fontSize: '18px',
            fill: '#c4b5fd',
            fontStyle: 'bold'
        });

        this.add.text(secondPanel.x + 24, secondPanel.y + 56, '• Interface premium refondue\n• Dashboard progression intégré\n• Auth Supabase prête à l\'emploi', {
            fontSize: '16px',
            fill: '#dbe5ff',
            lineSpacing: 9
        });
    }

    createFooter(width, height) {
        this.add.text(width / 2, height - 28, 'SHADOW KNIGHTS © 2026 • Designed for competitive boss runners', {
            fontSize: '14px',
            fill: COLORS.mutedText
        }).setOrigin(0.5);
    }

    createPanel(x, y, width, height) {
        const panel = this.add.rectangle(x, y, width, height, COLORS.panel, 0.9).setOrigin(0);
        panel.setStrokeStyle(1, COLORS.panelBorder, 0.95);
        return panel;
    }

    createMenuButton(x, y, label, onClick) {
        const button = this.add.text(x, y, label, {
            fontSize: '24px',
            fill: '#f8fbff',
            backgroundColor: '#182748',
            padding: { x: 18, y: 11 },
            stroke: '#4cc9f0',
            strokeThickness: 1
        }).setInteractive({ useHandCursor: true });

        button.on('pointerover', () => {
            button.setScale(1.02);
            button.setStyle({ backgroundColor: '#0ea5e9', fill: '#041323' });
        });

        button.on('pointerout', () => {
            button.setScale(1);
            button.setStyle({ backgroundColor: '#182748', fill: '#f8fbff' });
        });

        button.on('pointerdown', onClick);
    }

    showToast(message) {
        this.toastLabel?.destroy();
        this.toastLabel = this.add.text(this.cameras.main.width / 2, this.cameras.main.height - 70, message, {
            fontSize: '17px',
            fill: '#071322',
            backgroundColor: '#7dd3fc',
            padding: { x: 16, y: 10 }
        }).setOrigin(0.5);

        this.tweens.add({
            targets: this.toastLabel,
            alpha: 0,
            duration: 2200,
            onComplete: () => {
                this.toastLabel?.destroy();
                this.toastLabel = null;
            }
        });
    }

    createAuthOverlay() {
        const panel = document.createElement('div');
        panel.id = 'auth-panel';
        Object.assign(panel.style, {
            position: 'fixed',
            top: '16px',
            right: '16px',
            width: '320px',
            padding: '14px',
            border: '1px solid #38bdf8',
            borderRadius: '12px',
            background: 'rgba(6, 14, 30, 0.95)',
            boxShadow: '0 8px 30px rgba(14,165,233,0.30)',
            zIndex: '99999',
            color: '#fff',
            fontFamily: 'Inter, Arial, sans-serif',
            backdropFilter: 'blur(8px)'
        });

        panel.innerHTML = `
            <h3 style="margin:0 0 10px 0; color:#7dd3fc; font-size:18px;">Compte joueur</h3>
            <p id="auth-msg" style="margin:0 0 8px 0; min-height:18px; font-size:13px; color:#b8c2e0;"></p>
            <input id="auth-email" type="email" placeholder="Email" style="width:100%;margin-bottom:8px;padding:10px;border-radius:8px;border:1px solid #35517b;background:#111d34;color:#fff;" />
            <input id="auth-password" type="password" placeholder="Mot de passe (6+ caractères)" style="width:100%;margin-bottom:10px;padding:10px;border-radius:8px;border:1px solid #35517b;background:#111d34;color:#fff;" />
            <div style="display:flex;gap:8px;">
                <button id="auth-login" style="flex:1;padding:10px;border:none;border-radius:8px;background:#0ea5e9;color:#031224;cursor:pointer;font-weight:bold;">Login</button>
                <button id="auth-register" style="flex:1;padding:10px;border:1px solid #0ea5e9;border-radius:8px;background:transparent;color:#7dd3fc;cursor:pointer;">Register</button>
            </div>
            <button id="auth-logout" style="display:none;width:100%;margin-top:10px;padding:10px;border:none;border-radius:8px;background:#ef4444;color:#fff;cursor:pointer;">Logout</button>
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
            message.style.color = isError ? '#fca5a5' : '#b8c2e0';
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
            this.statusText.setText(`Session active: ${user.email}`);
        } else {
            this.authElements.emailInput.disabled = false;
            this.authElements.passwordInput.disabled = false;
            this.authElements.loginBtn.style.display = 'block';
            this.authElements.registerBtn.style.display = 'block';
            this.authElements.logoutBtn.style.display = 'none';
            this.statusText.setText('Mode invité actif. Connecte-toi en haut à droite.');
        }
    }

    destroyAuthOverlay() {
        this.toastLabel?.destroy();
        this.toastLabel = null;

        if (!this.authElements?.panel) {
            return;
        }

        this.authElements.panel.remove();
        this.authElements = null;
    }
}
