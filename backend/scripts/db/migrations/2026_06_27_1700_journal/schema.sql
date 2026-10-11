-- Journal entries, tags, and tag assignments.

CREATE TABLE journal_entries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT journal_entries_content_nonempty CHECK (char_length(trim(content)) > 0)
);

CREATE INDEX idx_journal_entries_user_id ON journal_entries (user_id);
CREATE INDEX idx_journal_entries_user_entry_date ON journal_entries (user_id, entry_date DESC);

CREATE TABLE journal_tags (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color_hex TEXT NOT NULL DEFAULT '#06B6D4',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT journal_tags_name_nonempty CHECK (char_length(trim(name)) > 0),
    CONSTRAINT journal_tags_color_hex_valid CHECK (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT journal_tags_user_name_unique UNIQUE (user_id, name)
);

CREATE INDEX idx_journal_tags_user_id ON journal_tags (user_id);

CREATE TABLE journal_entry_tag_assignments (
    journal_entry_id INTEGER NOT NULL REFERENCES journal_entries (id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES journal_tags (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (journal_entry_id, tag_id)
);

CREATE INDEX idx_journal_entry_tag_assignments_tag_id
    ON journal_entry_tag_assignments (tag_id);
