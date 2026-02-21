CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER NOT NULL UNIQUE,
    bookmaker TEXT NOT NULL,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    status TEXT NOT NULL,
    start_time DATETIME NOT NULL,
    odds TEXT NOT NULL,
    set1_odds TEXT NOT NULL,
    handicap TEXT NOT NULL,
    total_rounds TEXT NOT NULL,
    set1_game_count TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_match_id ON matches(match_id);