-- Coak learning workspaces: records and hierarchical directory items.

CREATE TABLE coak_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color_hex TEXT NOT NULL DEFAULT '#FBBF24',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT coak_records_name_nonempty CHECK (char_length(trim(name)) > 0),
    CONSTRAINT coak_records_color_hex_valid CHECK (color_hex ~ '^#[0-9A-Fa-f]{6}$')
);

CREATE INDEX idx_coak_records_user_updated
    ON coak_records (user_id, updated_at DESC);

CREATE TABLE coak_items (
    id SERIAL PRIMARY KEY,
    coak_record_id INTEGER NOT NULL REFERENCES coak_records (id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    parent_id INTEGER,
    kind TEXT NOT NULL,
    name TEXT NOT NULL,
    color_hex TEXT NOT NULL DEFAULT '#06B6D4',
    sort_order INTEGER NOT NULL DEFAULT 0,
    media_id UUID REFERENCES media_objects (id) ON DELETE SET NULL,
    note_body TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT coak_items_name_nonempty CHECK (char_length(trim(name)) > 0),
    CONSTRAINT coak_items_color_hex_valid CHECK (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT coak_items_kind_valid CHECK (kind IN ('file', 'folder', 'note')),
    CONSTRAINT coak_items_id_record_unique UNIQUE (id, coak_record_id),
    CONSTRAINT coak_items_parent_fkey
        FOREIGN KEY (parent_id, coak_record_id)
        REFERENCES coak_items (id, coak_record_id)
        ON DELETE CASCADE,
    CONSTRAINT coak_items_kind_fields_valid CHECK (
        (kind = 'file' AND media_id IS NOT NULL)
        OR (kind = 'folder' AND media_id IS NULL)
        OR (kind = 'note' AND media_id IS NULL)
    )
);

CREATE INDEX idx_coak_items_record_parent_sort
    ON coak_items (coak_record_id, parent_id, sort_order, id);

CREATE INDEX idx_coak_items_user_record
    ON coak_items (user_id, coak_record_id);

CREATE UNIQUE INDEX idx_coak_items_unique_sibling_name
    ON coak_items (coak_record_id, COALESCE(parent_id, -1), lower(name));
