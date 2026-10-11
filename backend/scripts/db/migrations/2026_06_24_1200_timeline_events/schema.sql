-- Timeline life events and contact tagging junction table.

CREATE TABLE timeline_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    subject_name TEXT,
    description TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT timeline_events_description_nonempty CHECK (char_length(trim(description)) > 0),
    CONSTRAINT timeline_events_end_on_or_after_start
        CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX idx_timeline_events_user_start_date
    ON timeline_events (user_id, start_date DESC);

CREATE TABLE timeline_event_contacts (
    timeline_event_id INTEGER NOT NULL REFERENCES timeline_events (id) ON DELETE CASCADE,
    contact_id INTEGER NOT NULL REFERENCES contacts (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (timeline_event_id, contact_id)
);

CREATE INDEX idx_timeline_event_contacts_contact_id
    ON timeline_event_contacts (contact_id);
