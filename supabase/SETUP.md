# Setup Supabase pour Shadow Knights

## 1. Créer un projet Supabase (GRATUIT)

1. Va sur https://supabase.com
2. Sign up (gratuit, 500MB)
3. Clique "New Project"
4. Remplis:
   - **Name**: shadow-knights
   - **Database Password**: Choisis un mot de passe fort (GARDE-LE!)
   - **Region**: Europe West (proche de la France)
5. Attends 2-3 minutes que le projet se créé

## 2. Créer la base de données

1. Dans ton projet Supabase, va dans **SQL Editor** (icône </>)
2. Clique "New Query"
3. Copie-colle TOUT le contenu de `schema.sql`
4. Clique "Run" (▶️)
5. ✅ Tu devrais voir "Success. No rows returned"

## 3. Récupérer les clés API

1. Va dans **Settings** (⚙️) → **API**
2. Note ces informations (tu en auras besoin):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (clé publique, safe pour le front)

## 4. Connecter le jeu à Supabase

### Option A: Variables d'environnement Vercel (Recommandé)

1. Dans Vercel, va dans ton projet
2. **Settings** → **Environment Variables**
3. Ajoute:
   - `VITE_SUPABASE_URL` = ton Project URL
   - `VITE_SUPABASE_ANON_KEY` = ta anon key
4. Redéploie le projet

### Option B: Hardcoder (pour tester vite, pas sécurisé)

Dans `index.html`, ajoute avant le script du jeu:

```javascript
const SUPABASE_URL = 'https://ton-projet.supabase.co';
const SUPABASE_ANON_KEY = 'ta-cle-publique';
```

## 5. Tester la connexion

Une fois connecté, tu pourras:
- Sauvegarder les scores en base
- Afficher un leaderboard global
- Tracker les stats des joueurs

## 6. Vérifier que ça marche

1. Va dans **Table Editor** de Supabase
2. Tu devrais voir les tables:
   - `players`
   - `game_runs`
   - `leaderboard`
3. Elles sont vides pour l'instant (normal!)

## 7. Intégration dans le code (Prochaine étape)

Pour utiliser Supabase dans ton jeu:

```javascript
// Importer Supabase
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

// Initialiser
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Sauvegarder un score
async function saveScore(username, victory, time) {
    // 1. Créer/récupérer le joueur
    const { data: player } = await supabase
        .from('players')
        .upsert({ username })
        .select()
        .single();
    
    // 2. Sauvegarder la run
    await supabase.from('game_runs').insert({
        player_id: player.id,
        boss_name: 'Chevalier des Ombres',
        victory: victory,
        duration: time
    });
}

// Récupérer le leaderboard
async function getLeaderboard() {
    const { data } = await supabase
        .from('top_players')
        .select('*')
        .limit(10);
    return data;
}
```

## 📊 Dashboard Supabase

Tu peux voir en temps réel:
- Nombre de joueurs
- Taux de victoire global
- Temps moyens
- Activité quotidienne

## 🔒 Sécurité (Plus tard)

Pour l'instant, tout le monde peut écrire dans la DB (pour faciliter le dev).
Plus tard, tu pourras:
- Activer l'authentification
- Ajouter des règles RLS (Row Level Security)
- Limiter les insertions par IP

## 💰 Limites du plan gratuit

- 500 MB de stockage
- 2 GB de bande passante/mois
- 500,000 requêtes/mois

**Largement suffisant pour commencer !** Si tu dépasses, upgrade à 25$/mois.

## ⚡ Performance

Supabase est super rapide car c'est du PostgreSQL + cache CDN.
Les requêtes prennent ~50-100ms en Europe.

## 🎯 Next: Intégrer Supabase dans le jeu

Tu veux que je te code l'intégration maintenant?
Je peux ajouter:
- Saisie du username au début
- Sauvegarde auto des scores
- Affichage du leaderboard top 10
- Stats personnelles du joueur

## 8. Ajouter la config auth côté front

Le menu du jeu affiche maintenant un panneau **Login / Register** (email + mot de passe) relié à Supabase Auth.

Ajoute ces variables globales avant le script `js/main.js` dans `index.html`:

```html
<script>
  window.SUPABASE_URL = 'https://ton-projet.supabase.co';
  window.SUPABASE_ANON_KEY = 'ta-cle-anon-publique';
</script>
```

Ensuite:
1. Ouvre le jeu
2. En haut à droite, crée un compte avec **Register**
3. Connecte-toi avec **Login**
4. Le bouton **Logout** apparaît quand la session est active

> Si l'email confirmation est activé dans Supabase, l'utilisateur devra confirmer son email avant de pouvoir se reconnecter.
