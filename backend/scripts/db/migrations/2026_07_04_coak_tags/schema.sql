-- Coak record-scoped tags and item ↔ tag assignments.

CREATE TABLE coak_tags (
    id SERIAL PRIMARY KEY,
    coak_record_id INTEGER NOT NULL REFERENCES coak_records (id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color_hex TEXT NOT NULL DEFAULT '#06B6D4',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT coak_tags_name_nonempty CHECK (char_length(trim(name)) > 0),
    CONSTRAINT coak_tags_color_hex_valid CHECK (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT coak_tags_record_name_unique UNIQUE (coak_record_id, name),
    CONSTRAINT coak_tags_id_record_unique UNIQUE (id, coak_record_id)
);

CREATE INDEX idx_coak_tags_coak_record_id ON coak_tags (coak_record_id);
CREATE INDEX idx_coak_tags_user_id ON coak_tags (user_id);

CREATE TABLE coak_item_tag_assignments (
    coak_item_id INTEGER NOT NULL,
    coak_record_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (coak_item_id, tag_id),
    CONSTRAINT coak_item_tag_assignments_item_fk
        FOREIGN KEY (coak_item_id, coak_record_id)
        REFERENCES coak_items (id, coak_record_id) ON DELETE CASCADE,
    CONSTRAINT coak_item_tag_assignments_tag_fk
        FOREIGN KEY (tag_id, coak_record_id)
        REFERENCES coak_tags (id, coak_record_id) ON DELETE CASCADE
);

CREATE INDEX idx_coak_item_tag_assignments_tag_id
    ON coak_item_tag_assignments (tag_id);
