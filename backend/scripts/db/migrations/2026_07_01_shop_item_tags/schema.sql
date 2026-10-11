-- Shop item tags and item ↔ tag assignments.

CREATE TABLE shop_item_tags (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color_hex TEXT NOT NULL DEFAULT '#06B6D4',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT shop_item_tags_name_nonempty CHECK (char_length(trim(name)) > 0),
    CONSTRAINT shop_item_tags_color_hex_valid CHECK (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT shop_item_tags_user_name_unique UNIQUE (user_id, name)
);

CREATE INDEX idx_shop_item_tags_user_id ON shop_item_tags (user_id);

CREATE TABLE shop_item_tag_assignments (
    shop_item_id INTEGER NOT NULL REFERENCES shop_items (id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES shop_item_tags (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (shop_item_id, tag_id)
);

CREATE INDEX idx_shop_item_tag_assignments_tag_id
    ON shop_item_tag_assignments (tag_id);
