-- keel_api/scripts/db/migrations/2026_06_19_1037_focus_node_time_entries/schema.sql

-- Add time tracking sessions for focus nodes.

CREATE TABLE IF NOT EXISTS focus_node_time_entries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    node_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'running',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_paused_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    accumulated_paused_seconds INTEGER NOT NULL DEFAULT 0,
    duration_seconds INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT focus_node_time_entries_node_user_fkey
        FOREIGN KEY (node_id, user_id)
        REFERENCES focus_nodes (id, user_id)
        ON DELETE CASCADE,
    CONSTRAINT focus_node_time_entries_status_valid CHECK (
        status IN ('running', 'paused', 'ended')
    ),
    CONSTRAINT focus_node_time_entries_pause_valid CHECK (
        (status = 'paused' AND last_paused_at IS NOT NULL AND ended_at IS NULL)
        OR status <> 'paused'
    ),
    CONSTRAINT focus_node_time_entries_end_valid CHECK (
        (
            status = 'ended'
            AND ended_at IS NOT NULL
            AND duration_seconds IS NOT NULL
        )
        OR status <> 'ended'
    ),
    CONSTRAINT focus_node_time_entries_open_valid CHECK (
        status <> 'running'
        OR (last_paused_at IS NULL AND ended_at IS NULL AND duration_seconds IS NULL)
    ),
    CONSTRAINT focus_node_time_entries_seconds_valid CHECK (
        accumulated_paused_seconds >= 0
        AND (duration_seconds IS NULL OR duration_seconds >= 0)
    )
);

CREATE INDEX IF NOT EXISTS idx_focus_node_time_entries_user_node_started
    ON focus_node_time_entries (user_id, node_id, started_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_focus_node_time_entries_one_open_per_node
    ON focus_node_time_entries (user_id, node_id)
    WHERE status IN ('running', 'paused');
