-- Games module: game_sessions + game_stats for solo mini-games.

CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    game_key TEXT NOT NULL,
    level INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'in_progress'
        CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    state JSONB NOT NULL DEFAULT '{}'::jsonb,
    move_count INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT game_sessions_state_object CHECK (jsonb_typeof(state) = 'object'),
    CONSTRAINT game_sessions_level_positive CHECK (level >= 1)
);

CREATE INDEX IF NOT EXISTS idx_game_sessions_user_game
    ON game_sessions (user_id, game_key, updated_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS game_sessions_active_level_uq
    ON game_sessions (user_id, game_key, level)
    WHERE status = 'in_progress';

CREATE TABLE IF NOT EXISTS game_stats (
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    game_key TEXT NOT NULL,
    stats JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, game_key),
    CONSTRAINT game_stats_stats_object CHECK (jsonb_typeof(stats) = 'object')
);
