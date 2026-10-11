-- Per-event notification offsets for timeline events.

CREATE TABLE timeline_event_reminders (
    id SERIAL PRIMARY KEY,
    timeline_event_id INTEGER NOT NULL REFERENCES timeline_events (id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    unit TEXT NOT NULL,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT timeline_event_reminders_amount_positive CHECK (amount > 0),
    CONSTRAINT timeline_event_reminders_unit_valid CHECK (
        unit IN ('minutes', 'hours', 'days')
    ),
    CONSTRAINT timeline_event_reminders_unique_offset UNIQUE (timeline_event_id, amount, unit)
);

CREATE INDEX idx_timeline_event_reminders_unsent
    ON timeline_event_reminders (timeline_event_id)
    WHERE sent_at IS NULL;
