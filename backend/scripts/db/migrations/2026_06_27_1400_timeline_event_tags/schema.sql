-- Timeline event label tags and junction assignments.

CREATE TABLE timeline_tags (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color_hex TEXT NOT NULL DEFAULT '#06B6D4',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT timeline_tags_name_nonempty CHECK (char_length(trim(name)) > 0),
    CONSTRAINT timeline_tags_color_hex_valid CHECK (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT timeline_tags_user_name_unique UNIQUE (user_id, name)
);

CREATE INDEX idx_timeline_tags_user_id ON timeline_tags (user_id);

CREATE TABLE timeline_event_tag_assignments (
    timeline_event_id INTEGER NOT NULL REFERENCES timeline_events (id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES timeline_tags (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (timeline_event_id, tag_id)
);

CREATE INDEX idx_timeline_event_tag_assignments_tag_id
    ON timeline_event_tag_assignments (tag_id);
