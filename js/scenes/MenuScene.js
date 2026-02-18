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

        this.createBackground(width, height);

        this.add.text(120, 88, 'SHADOW KNIGHTS', {
            fontSize: '72px',
            fill: '#e8f4ff',
            fontStyle: 'bold',
            stroke: '#0ea5e9',
            strokeThickness: 2
        });

        this.add.text(122, 168, 'Boss Rush Action RPG', {
            fontSize: '24px',
            fill: '#8aa4cf'
        });

        const navPanel = this.add.rectangle(90, 230, 510, 430, 0x0e162b, 0.9).setOrigin(0);
        navPanel.setStrokeStyle(1, 0x2d4672, 0.9);

        this.statusText = this.add.text(120, 610, 'Joue en invité ou connecte-toi en haut à droite', {
            fontSize: '18px',
            fill: '#93a6cc',
            wordWrap: { width: 450 }
        });

        const menuButtons = [
            {
                label: '▶  NOUVELLE PARTIE',
                y: 280,
                action: () => this.scene.start('ClassSelectScene')
            },
            {
                label: '📊  DASHBOARD JOUEUR',
                y: 355,
                action: () => this.scene.start('DashboardScene')
            },
            {
                label: '⚙  PARAMÈTRES (bientôt)',
                y: 430,
                action: () => this.showToast('Le menu paramètres arrive bientôt.')
            },
            {
                label: '❓  AIDE & CONTRÔLES',
                y: 505,
                action: () => this.showToast('Déplacement: ZQSD/Flèches • Attaque: ESPACE • Dodge: SHIFT')
            }
        ];

        menuButtons.forEach((item) => this.createMenuButton(120, item.y, item.label, item.action));

        this.createRightPanels(width, height);

        await authManager.init();
        this.createAuthOverlay();
        this.updateAuthStatus();

        this.events.once('shutdown', () => this.destroyAuthOverlay());
        this.events.once('destroy', () => this.destroyAuthOverlay());
    }

    createBackground(width, height) {
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x05070f, 0x05070f, 0x111b34, 0x111b34, 1);
        bg.fillRect(0, 0, width, height);

        for (let i = 0; i < 55; i++) {
            const line = this.add.rectangle(
                Phaser.Math.Between(0, width),
                Phaser.Math.Between(0, height),
                Phaser.Math.Between(40, 120),
                1,
                0x1e3a8a,
                Phaser.Math.FloatBetween(0.12, 0.3)
            ).setAngle(Phaser.Math.Between(-35, -15));

            this.tweens.add({
                targets: line,
                x: line.x + Phaser.Math.Between(-50, 50),
                alpha: Phaser.Math.FloatBetween(0.05, 0.35),
                duration: Phaser.Math.Between(2200, 4200),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    createRightPanels(width, height) {
        const panelX = width - 530;

        const missionPanel = this.add.rectangle(panelX, 230, 420, 250, 0x0e162b, 0.9).setOrigin(0);
        missionPanel.setStrokeStyle(1, 0x2d4672, 0.9);

        this.add.text(panelX + 22, 255, 'MISSION DU JOUR', {
            fontSize: '22px',
            fill: '#7dd3fc',
            fontStyle: 'bold'
        });

        this.add.text(panelX + 22, 297, '• Vaincre un boss sans mourir\n• Atteindre l\'étage 5 en mode Tour\n• Tester une nouvelle classe', {
            fontSize: '18px',
            fill: '#d8e8ff',
            lineSpacing: 10
        });

        const patchPanel = this.add.rectangle(panelX, 500, 420, 170, 0x0e162b, 0.9).setOrigin(0);
        patchPanel.setStrokeStyle(1, 0x2d4672, 0.9);

        this.add.text(panelX + 22, 525, 'NEWS', {
            fontSize: '22px',
            fill: '#c4b5fd',
            fontStyle: 'bold'
        });

        this.add.text(panelX + 22, 565, '• Nouveau dashboard intégré\n• Auth Supabase prête (email/password)\n• Interface retravaillée style studio', {
            fontSize: '16px',
            fill: '#cad8f4',
            lineSpacing: 8
        });

        this.add.text(width / 2, height - 30, 'SHADOW KNIGHTS © 2026 • Build Arena', {
            fontSize: '14px',
            fill: '#5f7399'
        }).setOrigin(0.5);
    }

    createMenuButton(x, y, label, onClick) {
        const button = this.add.text(x, y, label, {
            fontSize: '26px',
            fill: '#f8fbff',
            backgroundColor: '#16233f',
            padding: { x: 20, y: 12 },
            stroke: '#38bdf8',
            strokeThickness: 1
        }).setInteractive({ useHandCursor: true });

        button.on('pointerover', () => {
            button.setScale(1.03);
            button.setStyle({ backgroundColor: '#0ea5e9', fill: '#031224' });
        });

        button.on('pointerout', () => {
            button.setScale(1);
            button.setStyle({ backgroundColor: '#16233f', fill: '#f8fbff' });
        });

        button.on('pointerdown', onClick);
    }

    showToast(message) {
        if (this.toastLabel) {
            this.toastLabel.destroy();
        }

        this.toastLabel = this.add.text(this.cameras.main.width / 2, this.cameras.main.height - 70, message, {
            fontSize: '18px',
            fill: '#081221',
            backgroundColor: '#7dd3fc',
            padding: { x: 16, y: 10 }
        }).setOrigin(0.5);

        this.tweens.add({
            targets: this.toastLabel,
            alpha: 0,
            duration: 2200,
            ease: 'Quad.easeIn',
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
            borderRadius: '10px',
            background: 'rgba(5, 10, 21, 0.94)',
            boxShadow: '0 0 24px rgba(14, 165, 233, 0.35)',
            zIndex: '99999',
            color: '#fff',
            fontFamily: 'Inter, Arial, sans-serif'
        });

        panel.innerHTML = `
            <h3 style="margin:0 0 8px 0; color:#7dd3fc; font-size:18px;">Compte joueur</h3>
            <p id="auth-msg" style="margin:0 0 8px 0; min-height:18px; font-size:13px; color:#b8c2e0;"></p>
            <input id="auth-email" type="email" placeholder="Email" style="width:100%;margin-bottom:8px;padding:9px;border-radius:6px;border:1px solid #3a4b77;background:#111b2f;color:#fff;" />
            <input id="auth-password" type="password" placeholder="Mot de passe (6+ caractères)" style="width:100%;margin-bottom:10px;padding:9px;border-radius:6px;border:1px solid #3a4b77;background:#111b2f;color:#fff;" />
            <div style="display:flex;gap:8px;">
                <button id="auth-login" style="flex:1;padding:9px;border:none;border-radius:6px;background:#0ea5e9;color:#031224;cursor:pointer;font-weight:bold;">Login</button>
                <button id="auth-register" style="flex:1;padding:9px;border:1px solid #0ea5e9;border-radius:6px;background:transparent;color:#7dd3fc;cursor:pointer;">Register</button>
            </div>
            <button id="auth-logout" style="display:none;width:100%;margin-top:10px;padding:9px;border:none;border-radius:6px;background:#ef4444;color:#fff;cursor:pointer;">Logout</button>
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
