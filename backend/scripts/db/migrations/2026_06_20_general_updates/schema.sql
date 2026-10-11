-- keel_api/scripts/db/migrations/2026_06_20_general_updates/schema.sql
-- Combined 2026-06-20 production schema upgrade:
-- unified media storage, folders, panels, panel tile options, and Focus reference fields.

BEGIN;

-- ---------------------------------------------------------------------------
-- Unified media storage (media_objects + media_attachments)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS media_objects (
    id UUID PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    storage_key TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    byte_size BIGINT NOT NULL,
    media_kind TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    sha256 TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT media_objects_original_filename_nonempty CHECK (
        char_length(trim(original_filename)) > 0
    ),
    CONSTRAINT media_objects_byte_size_positive CHECK (byte_size > 0),
    CONSTRAINT media_objects_kind_valid CHECK (
        media_kind IN ('image', 'video', 'audio', 'document', 'model_3d', 'other')
    ),
    CONSTRAINT media_objects_status_valid CHECK (
        status IN ('pending', 'ready', 'deleted')
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_media_objects_storage_key
    ON media_objects (storage_key);

CREATE INDEX IF NOT EXISTS idx_media_objects_user_created_at
    ON media_objects (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS media_attachments (
    id SERIAL PRIMARY KEY,
    media_id UUID NOT NULL REFERENCES media_objects (id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    display_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT media_attachments_entity_type_valid CHECK (
        entity_type IN ('project', 'shop_item', 'contact', 'shop_merchant')
    ),
    CONSTRAINT media_attachments_role_valid CHECK (
        role IN ('gallery', 'cover', 'photo', 'logo')
    )
);

CREATE INDEX IF NOT EXISTS idx_media_attachments_entity
    ON media_attachments (entity_type, entity_id, role, sort_order, id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_media_attachments_one_cover_per_entity
    ON media_attachments (entity_type, entity_id)
    WHERE role = 'cover';

CREATE UNIQUE INDEX IF NOT EXISTS idx_media_attachments_one_photo_per_contact
    ON media_attachments (entity_id)
    WHERE entity_type = 'contact' AND role = 'photo';

CREATE UNIQUE INDEX IF NOT EXISTS idx_media_attachments_one_logo_per_merchant
    ON media_attachments (entity_id)
    WHERE entity_type = 'shop_merchant' AND role = 'logo';

-- ---------------------------------------------------------------------------
-- Media folders
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS media_folders (
    id UUID PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    parent_folder_id UUID,
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT media_folders_name_nonempty CHECK (char_length(trim(name)) > 0),
    CONSTRAINT media_folders_id_user_unique UNIQUE (id, user_id),
    CONSTRAINT media_folders_parent_fk FOREIGN KEY (parent_folder_id, user_id)
        REFERENCES media_folders (id, user_id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_media_folders_unique_sibling_name
    ON media_folders (user_id, parent_folder_id, lower(name))
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_media_folders_parent
    ON media_folders (user_id, parent_folder_id, sort_order, name)
    WHERE deleted_at IS NULL;

ALTER TABLE media_objects
    ADD COLUMN IF NOT EXISTS folder_id UUID;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'media_objects_folder_fk'
    ) THEN
        ALTER TABLE media_objects
            ADD CONSTRAINT media_objects_folder_fk FOREIGN KEY (folder_id, user_id)
                REFERENCES media_folders (id, user_id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_media_objects_user_folder_created_at
    ON media_objects (user_id, folder_id, created_at DESC)
    WHERE status <> 'deleted';

-- ---------------------------------------------------------------------------
-- Media display panels
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS media_panels (
    id UUID PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    column_count INTEGER NOT NULL DEFAULT 12,
    row_unit_px INTEGER NOT NULL DEFAULT 64,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT media_panels_name_nonempty CHECK (char_length(trim(name)) > 0),
    CONSTRAINT media_panels_column_count_valid CHECK (column_count >= 1),
    CONSTRAINT media_panels_row_unit_px_valid CHECK (row_unit_px >= 16)
);

CREATE INDEX IF NOT EXISTS idx_media_panels_user_updated
    ON media_panels (user_id, updated_at DESC)
    WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS media_panel_items (
    id UUID PRIMARY KEY,
    panel_id UUID NOT NULL REFERENCES media_panels (id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES media_objects (id) ON DELETE CASCADE,
    grid_x INTEGER NOT NULL DEFAULT 0,
    grid_y INTEGER NOT NULL DEFAULT 0,
    col_span INTEGER NOT NULL DEFAULT 1,
    row_span INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT media_panel_items_grid_x_valid CHECK (grid_x >= 0),
    CONSTRAINT media_panel_items_grid_y_valid CHECK (grid_y >= 0),
    CONSTRAINT media_panel_items_col_span_valid CHECK (col_span >= 1),
    CONSTRAINT media_panel_items_row_span_valid CHECK (row_span >= 1),
    CONSTRAINT media_panel_items_unique_media UNIQUE (panel_id, media_id)
);

CREATE INDEX IF NOT EXISTS idx_media_panel_items_panel
    ON media_panel_items (panel_id, grid_y, grid_x);

CREATE INDEX IF NOT EXISTS idx_media_panel_items_media
    ON media_panel_items (media_id);

-- ---------------------------------------------------------------------------
-- Media panel tile border color
-- ---------------------------------------------------------------------------

ALTER TABLE media_panel_items
    ADD COLUMN IF NOT EXISTS border_color TEXT;

ALTER TABLE media_panel_items
    DROP CONSTRAINT IF EXISTS media_panel_items_border_color_valid;

ALTER TABLE media_panel_items
    ADD CONSTRAINT media_panel_items_border_color_valid CHECK (
        border_color IS NULL
        OR (
            char_length(border_color) = 7
            AND border_color ~ '^#[0-9A-Fa-f]{6}$'
        )
    );

-- ---------------------------------------------------------------------------
-- Media panel tile preview zoom / focal point
-- ---------------------------------------------------------------------------

ALTER TABLE media_panel_items
    ADD COLUMN IF NOT EXISTS preview_scale REAL NOT NULL DEFAULT 1.0,
    ADD COLUMN IF NOT EXISTS preview_focal_x REAL NOT NULL DEFAULT 0.5,
    ADD COLUMN IF NOT EXISTS preview_focal_y REAL NOT NULL DEFAULT 0.5;

ALTER TABLE media_panel_items
    DROP CONSTRAINT IF EXISTS media_panel_items_preview_scale_valid;

ALTER TABLE media_panel_items
    ADD CONSTRAINT media_panel_items_preview_scale_valid
    CHECK (preview_scale >= 1.0 AND preview_scale <= 8.0);

ALTER TABLE media_panel_items
    DROP CONSTRAINT IF EXISTS media_panel_items_preview_focal_x_valid;

ALTER TABLE media_panel_items
    ADD CONSTRAINT media_panel_items_preview_focal_x_valid
    CHECK (preview_focal_x >= 0.0 AND preview_focal_x <= 1.0);

ALTER TABLE media_panel_items
    DROP CONSTRAINT IF EXISTS media_panel_items_preview_focal_y_valid;

ALTER TABLE media_panel_items
    ADD CONSTRAINT media_panel_items_preview_focal_y_valid
    CHECK (preview_focal_y >= 0.0 AND preview_focal_y <= 1.0);

-- ---------------------------------------------------------------------------
-- Focus record references (UUID-backed targets + media preview toggle)
-- ---------------------------------------------------------------------------

ALTER TABLE focus_nodes
    ALTER COLUMN reference_target_id TYPE TEXT
    USING reference_target_id::text;

ALTER TABLE focus_nodes
    ADD COLUMN IF NOT EXISTS show_reference_content BOOLEAN NOT NULL DEFAULT FALSE;

COMMIT;
