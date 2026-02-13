-- Schema pour Shadow Knights Boss Rush
-- À exécuter dans l'éditeur SQL de Supabase

-- Table des joueurs
CREATE TABLE IF NOT EXISTS players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_games INTEGER DEFAULT 0,
    total_victories INTEGER DEFAULT 0,
    best_time INTERVAL,
    last_played TIMESTAMP WITH TIME ZONE
);

-- Table des runs (parties)
CREATE TABLE IF NOT EXISTS game_runs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    boss_name TEXT NOT NULL,
    victory BOOLEAN NOT NULL,
    duration INTERVAL,
    damage_taken INTEGER,
    damage_dealt INTEGER,
    dodges_performed INTEGER,
    attacks_performed INTEGER,
    played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table du leaderboard global
CREATE TABLE IF NOT EXISTS leaderboard (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    boss_name TEXT NOT NULL,
    completion_time INTERVAL NOT NULL,
    score INTEGER NOT NULL, -- Basé sur temps + dégâts pris + esquives
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id, boss_name)
);

-- Index pour performance
CREATE INDEX idx_leaderboard_boss ON leaderboard(boss_name, score DESC);
CREATE INDEX idx_leaderboard_player ON leaderboard(player_id);
CREATE INDEX idx_game_runs_player ON game_runs(player_id, played_at DESC);

-- Vue pour le top 100 global
CREATE OR REPLACE VIEW top_players AS
SELECT 
    p.username,
    p.total_games,
    p.total_victories,
    ROUND((p.total_victories::DECIMAL / NULLIF(p.total_games, 0)) * 100, 1) as win_rate,
    p.best_time
FROM players p
WHERE p.total_games > 0
ORDER BY p.total_victories DESC, p.best_time ASC
LIMIT 100;

-- Vue pour le leaderboard par boss
CREATE OR REPLACE VIEW boss_leaderboard AS
SELECT 
    l.boss_name,
    p.username,
    l.completion_time,
    l.score,
    l.achieved_at,
    ROW_NUMBER() OVER (PARTITION BY l.boss_name ORDER BY l.score DESC) as rank
FROM leaderboard l
JOIN players p ON p.id = l.player_id
ORDER BY l.boss_name, l.score DESC;

-- RLS (Row Level Security) - Optionnel pour plus tard
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Policies pour lecture publique (tout le monde peut voir le leaderboard)
CREATE POLICY "Public read access for players" ON players
    FOR SELECT USING (true);

CREATE POLICY "Public read access for leaderboard" ON leaderboard
    FOR SELECT USING (true);

-- Policies pour écriture (à configurer selon auth)
-- Pour l'instant, tout le monde peut écrire (à sécuriser plus tard)
CREATE POLICY "Anyone can insert players" ON players
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update own player" ON players
    FOR UPDATE USING (true);

CREATE POLICY "Anyone can insert runs" ON game_runs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can insert leaderboard" ON leaderboard
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update leaderboard" ON leaderboard
    FOR UPDATE USING (true);

-- Fonction pour mettre à jour les stats du joueur après une partie
CREATE OR REPLACE FUNCTION update_player_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE players
    SET 
        total_games = total_games + 1,
        total_victories = total_victories + (CASE WHEN NEW.victory THEN 1 ELSE 0 END),
        best_time = CASE 
            WHEN NEW.victory AND (best_time IS NULL OR NEW.duration < best_time) 
            THEN NEW.duration 
            ELSE best_time 
        END,
        last_played = NOW()
    WHERE id = NEW.player_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour auto-update des stats
CREATE TRIGGER update_player_stats_trigger
    AFTER INSERT ON game_runs
    FOR EACH ROW
    EXECUTE FUNCTION update_player_stats();

-- Fonction pour calculer le score (temps + performance)
CREATE OR REPLACE FUNCTION calculate_score(
    completion_time INTERVAL,
    damage_taken INTEGER,
    dodges INTEGER
) RETURNS INTEGER AS $$
BEGIN
    -- Score = temps inversé + bonus esquives - malus dégâts
    -- Plus le temps est court, plus le score est haut
    RETURN 
        (3600 - EXTRACT(EPOCH FROM completion_time)::INTEGER) + 
        (dodges * 10) - 
        (damage_taken * 2);
END;
$$ LANGUAGE plpgsql;
