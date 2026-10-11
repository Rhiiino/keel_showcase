-- Public figures (celebrities, politicians, creators, etc.) tracked per user.
CREATE TABLE IF NOT EXISTS figures (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    gender TEXT,
    birth_date DATE,
    birth_date_year_known BOOLEAN NOT NULL DEFAULT TRUE,
    death_date DATE,
    notes TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT figures_status_valid CHECK (status IN ('active', 'archived')),
    CONSTRAINT figures_gender_valid CHECK (gender IS NULL OR gender IN ('male', 'female'))
);

CREATE INDEX IF NOT EXISTS idx_figures_user_id ON figures (user_id);

-- Many-to-many link between timeline events and figures.
CREATE TABLE IF NOT EXISTS timeline_event_figures (
    timeline_event_id INTEGER NOT NULL REFERENCES timeline_events (id) ON DELETE CASCADE,
    figure_id INTEGER NOT NULL REFERENCES figures (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (timeline_event_id, figure_id)
);

CREATE INDEX IF NOT EXISTS idx_timeline_event_figures_figure_id
    ON timeline_event_figures (figure_id);

-- Allow figure profile photos via media attachments.
ALTER TABLE media_attachments
    DROP CONSTRAINT IF EXISTS media_attachments_entity_type_valid;

ALTER TABLE media_attachments
    ADD CONSTRAINT media_attachments_entity_type_valid CHECK (
        entity_type IN (
            'project',
            'finance_transaction',
            'finance_obligation',
            'contact',
            'figure',
            'finance_vendor',
            'timeline_event',
            'journal_entry'
        )
    );

CREATE UNIQUE INDEX IF NOT EXISTS idx_media_attachments_one_photo_per_figure
    ON media_attachments (entity_id)
    WHERE entity_type = 'figure' AND role = 'photo';
