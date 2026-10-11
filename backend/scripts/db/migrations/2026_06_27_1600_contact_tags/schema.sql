-- Contact label tags and junction assignments.

CREATE TABLE contact_tags (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color_hex TEXT NOT NULL DEFAULT '#06B6D4',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT contact_tags_name_nonempty CHECK (char_length(trim(name)) > 0),
    CONSTRAINT contact_tags_color_hex_valid CHECK (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT contact_tags_user_name_unique UNIQUE (user_id, name)
);

CREATE INDEX idx_contact_tags_user_id ON contact_tags (user_id);

CREATE TABLE contact_tag_assignments (
    contact_id INTEGER NOT NULL REFERENCES contacts (id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES contact_tags (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (contact_id, tag_id)
);

CREATE INDEX idx_contact_tag_assignments_tag_id
    ON contact_tag_assignments (tag_id);
