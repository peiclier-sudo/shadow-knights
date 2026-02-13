# Shadow Knights - Boss Rush

Boss Rush Soulslike en 2D avec contrôles mobiles et desktop.

## 🎮 Features

- ✅ Combat fluide avec système de stamina
- ✅ Dodge roll avec i-frames
- ✅ Boss avec 3 patterns d'attaque
- ✅ Contrôles tactiles pour mobile
- ✅ Progression sauvegardée (localStorage)
- ✅ Statistiques de victoires

## 🚀 Déploiement Vercel (GRATUIT)

### Option 1: Via GitHub (Recommandé)

1. **Créer un repo GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/TON-USERNAME/shadow-knights.git
   git push -u origin main
   ```

2. **Déployer sur Vercel:**
   - Va sur https://vercel.com
   - Clique "Add New Project"
   - Import ton repo GitHub
   - Vercel détecte automatiquement la config
   - Clique "Deploy"
   - ✨ Ton jeu est en ligne !

### Option 2: Via Vercel CLI

```bash
npm install -g vercel
cd soulslike-game
vercel
# Suivre les instructions
```

### Option 3: Drag & Drop

1. Va sur https://vercel.com/new
2. Drag & drop le dossier `soulslike-game`
3. Deploy !

## 📱 PWA (Installation sur mobile)

Le jeu peut être installé comme app sur mobile:
- Safari iOS: Partager → Sur l'écran d'accueil
- Chrome Android: Menu → Installer l'application

## 🔧 Développement local

```bash
cd soulslike-game
npx serve public
# Ouvre http://localhost:3000
```

## 📊 Next Steps

- [ ] Setup Supabase pour leaderboard
- [ ] Ajouter un 2ème boss
- [ ] Système de combos
- [ ] Effets sonores
- [ ] Particules avancées
- [ ] Boss phases (rage mode à 50% HP)

## 🎯 Contrôles

**Desktop:**
- ZQSD ou Flèches: Déplacement
- ESPACE: Attaque
- SHIFT: Esquive

**Mobile:**
- Joystick virtuel: Déplacement
- Bouton ATK: Attaque
- Bouton ROLL: Esquive

## 📈 Roadmap

### Phase 1: MVP (Actuel) ✅
- Combat basique fonctionnel
- 1 boss avec patterns
- Progression locale

### Phase 2: Backend (Prochain)
- Setup Supabase
- Leaderboard global
- Authentication simple

### Phase 3: Content
- 3 bosses différents
- Unlock progressif
- Difficulté croissante

### Phase 4: Polish
- Pixel art custom
- Sound design
- Particules avancées
- Animations fluides

## 💰 Coûts

- Vercel: **0€** (plan gratuit)
- Supabase: **0€** (500MB gratuit)
- Domaine custom: **~10€/an** (optionnel)

**Total: 0€ pour commencer !**
