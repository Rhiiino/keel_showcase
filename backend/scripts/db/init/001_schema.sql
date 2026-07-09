-- stack_sandbox/backend/scripts/db/init/001_schema.sql
-- Runs once when the Postgres data volume is first created.

CREATE EXTENSION IF NOT EXISTS vector;

-- Authenticated accounts (OAuth identity, display profile, default chat LLM prefs).
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    provider TEXT NOT NULL,
    provider_user_id TEXT NOT NULL,
    email TEXT NOT NULL,
    display_name TEXT NOT NULL,
    picture_url TEXT,
    chat_llm_provider TEXT,
    chat_llm_model TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT users_provider_user_id_unique UNIQUE (provider, provider_user_id)
);

CREATE UNIQUE INDEX idx_users_email ON users (email);

-- Browser session tokens for cookie-based auth (hashed, expiring, revocable).
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    session_token_hash TEXT NOT NULL UNIQUE,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_seen_at TIMESTAMPTZ,
    invalidated_at TIMESTAMPTZ
);

CREATE INDEX idx_sessions_user_id ON sessions (user_id);

CREATE INDEX idx_sessions_token_active_idx ON sessions (session_token_hash)
    WHERE invalidated_at IS NULL;

-- Chat threads owned by a user, optionally scoped to a project workspace.
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title TEXT,
    driver_agent_id TEXT NOT NULL DEFAULT 'keel',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversations_user_id ON conversations (user_id);

CREATE INDEX idx_conversations_user_updated_at ON conversations (user_id, updated_at DESC);

-- Individual turns in a conversation (user, assistant, system, or tool role).
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
    content TEXT NOT NULL DEFAULT '',
    agent_id TEXT,
    agents_used TEXT[] NOT NULL DEFAULT '{}',
    provider TEXT,
    model TEXT,
    input_tokens INTEGER,
    output_tokens INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON messages (conversation_id);

CREATE INDEX idx_messages_conversation_created_at ON messages (conversation_id, created_at);

-- Native tool invocations recorded on an assistant message.
CREATE TABLE tool_calls (
    id SERIAL PRIMARY KEY,
    message_id INTEGER NOT NULL REFERENCES messages (id) ON DELETE CASCADE,
    tool_name TEXT NOT NULL,
    category TEXT,
    tool_call_json JSONB NOT NULL,
    tool_response_json JSONB,
    duration_seconds DOUBLE PRECISION,
    call_order INTEGER NOT NULL CHECK (call_order >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tool_calls_message_id ON tool_calls (message_id);

-- Per-user instructions appended to agent system prompts.
CREATE TABLE chat_rules (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    agent_ids TEXT[] NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chat_rules_title_nonempty CHECK (char_length(trim(title)) > 0),
    CONSTRAINT chat_rules_content_nonempty CHECK (char_length(trim(content)) > 0),
    CONSTRAINT chat_rules_agent_ids_nonempty CHECK (cardinality(agent_ids) > 0)
);

CREATE INDEX idx_chat_rules_user_sort ON chat_rules (user_id, sort_order, id);

-- Per-user LLM provider/model overrides for individual sub-agents.
CREATE TABLE agent_llm_preferences (
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL,
    llm_provider TEXT NOT NULL,
    llm_model TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, agent_id)
);

-- Per-user cross-frontend UI preferences (nav layout, theme, etc.) as a JSON document.
CREATE TABLE user_preferences (
    user_id INTEGER PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT user_preferences_data_object CHECK (jsonb_typeof(data) = 'object')
);

-- User-uploaded files stored in Garage (metadata only; bytes in object storage).
CREATE TABLE media_folders (
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

CREATE UNIQUE INDEX idx_media_folders_unique_sibling_name
    ON media_folders (user_id, parent_folder_id, lower(name))
    WHERE deleted_at IS NULL;

CREATE INDEX idx_media_folders_parent
    ON media_folders (user_id, parent_folder_id, sort_order, name)
    WHERE deleted_at IS NULL;

CREATE TABLE media_objects (
    id UUID PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    folder_id UUID,
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
    ),
    CONSTRAINT media_objects_folder_fk FOREIGN KEY (folder_id, user_id)
        REFERENCES media_folders (id, user_id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX idx_media_objects_storage_key ON media_objects (storage_key);

CREATE INDEX idx_media_objects_user_created_at ON media_objects (user_id, created_at DESC);

CREATE INDEX idx_media_objects_user_folder_created_at
    ON media_objects (user_id, folder_id, created_at DESC)
    WHERE status <> 'deleted';

-- Links media objects to projects, finance purchases, contacts, or vendors.
CREATE TABLE media_attachments (
    id SERIAL PRIMARY KEY,
    media_id UUID NOT NULL REFERENCES media_objects (id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    display_name TEXT,
    project_folder_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT media_attachments_entity_type_valid CHECK (
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
    ),
    CONSTRAINT media_attachments_role_valid CHECK (
        role IN ('gallery', 'cover', 'photo', 'logo')
    )
);

CREATE INDEX idx_media_attachments_entity ON media_attachments (
    entity_type,
    entity_id,
    role,
    sort_order,
    id
);

CREATE UNIQUE INDEX idx_media_attachments_one_cover_per_entity
    ON media_attachments (entity_type, entity_id)
    WHERE role = 'cover';

CREATE UNIQUE INDEX idx_media_attachments_one_photo_per_contact
    ON media_attachments (entity_id)
    WHERE entity_type = 'contact' AND role = 'photo';

CREATE UNIQUE INDEX idx_media_attachments_one_photo_per_figure
    ON media_attachments (entity_id)
    WHERE entity_type = 'figure' AND role = 'photo';

CREATE UNIQUE INDEX idx_media_attachments_one_logo_per_vendor
    ON media_attachments (entity_id)
    WHERE entity_type = 'finance_vendor' AND role = 'logo';

-- Curated display panels with grid-placed media tiles.
CREATE TABLE media_panels (
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

CREATE INDEX idx_media_panels_user_updated
    ON media_panels (user_id, updated_at DESC)
    WHERE deleted_at IS NULL;

CREATE TABLE media_panel_items (
    id UUID PRIMARY KEY,
    panel_id UUID NOT NULL REFERENCES media_panels (id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES media_objects (id) ON DELETE CASCADE,
    grid_x INTEGER NOT NULL DEFAULT 0,
    grid_y INTEGER NOT NULL DEFAULT 0,
    col_span INTEGER NOT NULL DEFAULT 1,
    row_span INTEGER NOT NULL DEFAULT 1,
    preview_scale REAL NOT NULL DEFAULT 1.0,
    preview_focal_x REAL NOT NULL DEFAULT 0.5,
    preview_focal_y REAL NOT NULL DEFAULT 0.5,
    border_color TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT media_panel_items_grid_x_valid CHECK (grid_x >= 0),
    CONSTRAINT media_panel_items_grid_y_valid CHECK (grid_y >= 0),
    CONSTRAINT media_panel_items_col_span_valid CHECK (col_span >= 1),
    CONSTRAINT media_panel_items_row_span_valid CHECK (row_span >= 1),
    CONSTRAINT media_panel_items_preview_scale_valid CHECK (preview_scale >= 1.0 AND preview_scale <= 8.0),
    CONSTRAINT media_panel_items_preview_focal_x_valid CHECK (preview_focal_x >= 0.0 AND preview_focal_x <= 1.0),
    CONSTRAINT media_panel_items_preview_focal_y_valid CHECK (preview_focal_y >= 0.0 AND preview_focal_y <= 1.0),
    CONSTRAINT media_panel_items_border_color_valid CHECK (
        border_color IS NULL
        OR (
            char_length(border_color) = 7
            AND border_color ~ '^#[0-9A-Fa-f]{6}$'
        )
    ),
    CONSTRAINT media_panel_items_unique_media UNIQUE (panel_id, media_id)
);

CREATE INDEX idx_media_panel_items_panel
    ON media_panel_items (panel_id, grid_y, grid_x);

CREATE INDEX idx_media_panel_items_media
    ON media_panel_items (media_id);

-- Personal projects (Baysic): title, status, cover appearance settings.
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'planning',
    kind TEXT,
    cover_glow_color_hex TEXT,
    cover_model_color_hex TEXT,
    cover_model_brightness REAL NOT NULL DEFAULT 1.0,
    cover_image_scale REAL NOT NULL DEFAULT 1.0,
    cover_image_position_x REAL NOT NULL DEFAULT 50.0,
    cover_image_position_y REAL NOT NULL DEFAULT 50.0,
    kanban_card_color_hex TEXT,
    title_font_key TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT projects_title_nonempty CHECK (char_length(trim(title)) > 0),
    CONSTRAINT projects_status_valid CHECK (
        status IN ('planning', 'active', 'paused', 'completed', 'archived')
    ),
    CONSTRAINT projects_cover_glow_color_hex_valid CHECK (
        cover_glow_color_hex IS NULL
        OR cover_glow_color_hex ~ '^#[0-9A-Fa-f]{6}$'
    ),
    CONSTRAINT projects_cover_model_color_hex_valid CHECK (
        cover_model_color_hex IS NULL
        OR cover_model_color_hex ~ '^#[0-9A-Fa-f]{6}$'
    ),
    CONSTRAINT projects_cover_model_brightness_valid CHECK (
        cover_model_brightness >= 0.5
        AND cover_model_brightness <= 2.0
    ),
    CONSTRAINT projects_cover_image_scale_valid CHECK (
        cover_image_scale >= 0.25
        AND cover_image_scale <= 3.0
    ),
    CONSTRAINT projects_cover_image_position_x_valid CHECK (
        cover_image_position_x >= 0.0
        AND cover_image_position_x <= 100.0
    ),
    CONSTRAINT projects_cover_image_position_y_valid CHECK (
        cover_image_position_y >= 0.0
        AND cover_image_position_y <= 100.0
    ),
    CONSTRAINT projects_kanban_card_color_hex_valid CHECK (
        kanban_card_color_hex IS NULL
        OR kanban_card_color_hex ~ '^#[0-9A-Fa-f]{6}$'
    ),
    CONSTRAINT projects_title_font_key_valid CHECK (
        title_font_key IS NULL
        OR title_font_key IN (
            'default',
            'serif',
            'mono',
            'rounded',
            'condensed',
            'handwritten',
            'display',
            'elegant',
            'slab',
            'bold',
            'retro',
            'tech',
            'classic',
            'wide'
        )
    )
);

CREATE INDEX idx_projects_user_id ON projects (user_id);

CREATE INDEX idx_projects_user_updated_at ON projects (user_id, updated_at DESC);

-- User-defined labels for grouping and filtering projects.
CREATE TABLE project_tags (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color_hex TEXT NOT NULL DEFAULT '#06B6D4',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT project_tags_name_nonempty CHECK (char_length(trim(name)) > 0),
    CONSTRAINT project_tags_color_hex_valid CHECK (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT project_tags_user_name_unique UNIQUE (user_id, name)
);

CREATE INDEX idx_project_tags_user_id ON project_tags (user_id);

-- Many-to-many link between projects and project tags.
CREATE TABLE project_tag_assignments (
    project_id INTEGER NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES project_tags (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (project_id, tag_id)
);

CREATE INDEX idx_project_tag_assignments_tag_id ON project_tag_assignments (tag_id);

-- Baysic workspace canvas state (nodes, edges, viewport); many canvases per project.
CREATE TABLE project_canvas (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Main',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_default BOOLEAN NOT NULL DEFAULT false,
    state JSONB NOT NULL DEFAULT '{}'::jsonb,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT project_canvas_name_nonempty CHECK (char_length(trim(name)) > 0),
    CONSTRAINT project_canvas_state_object CHECK (jsonb_typeof(state) = 'object'),
    CONSTRAINT project_canvas_settings_object CHECK (jsonb_typeof(settings) = 'object')
);

CREATE INDEX idx_project_canvas_project_id ON project_canvas (project_id);

CREATE UNIQUE INDEX idx_project_canvas_one_default_per_project
    ON project_canvas (project_id)
    WHERE is_default = true;

-- Nested folders for organizing project gallery files (project module only).
CREATE TABLE project_folders (
    id UUID PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    parent_folder_id UUID,
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT project_folders_name_nonempty CHECK (char_length(trim(name)) > 0),
    CONSTRAINT project_folders_id_project_unique UNIQUE (id, project_id),
    CONSTRAINT project_folders_parent_fk FOREIGN KEY (parent_folder_id, project_id)
        REFERENCES project_folders (id, project_id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX idx_project_folders_unique_sibling_name
    ON project_folders (project_id, parent_folder_id, lower(name))
    WHERE deleted_at IS NULL;

CREATE INDEX idx_project_folders_parent
    ON project_folders (project_id, parent_folder_id, sort_order, name)
    WHERE deleted_at IS NULL;

ALTER TABLE media_attachments
    ADD CONSTRAINT media_attachments_project_folder_fk
    FOREIGN KEY (project_folder_id)
    REFERENCES project_folders (id)
    ON DELETE SET NULL;

CREATE INDEX idx_media_attachments_project_folder
    ON media_attachments (entity_type, entity_id, project_folder_id, sort_order, id)
    WHERE entity_type = 'project' AND role = 'gallery';

ALTER TABLE conversations
    ADD COLUMN project_id INTEGER REFERENCES projects (id) ON DELETE CASCADE;

CREATE INDEX idx_conversations_user_project
    ON conversations (user_id, project_id);

CREATE INDEX idx_conversations_user_sort
    ON conversations (user_id, project_id, sort_order, id);

-- Finance vendors the user tracks (name, logo, default currency, billing portal).
CREATE TABLE finance_vendors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    website_url TEXT,
    billing_portal_url TEXT,
    notes TEXT NOT NULL DEFAULT '',
    default_currency TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT finance_vendors_name_nonempty CHECK (char_length(trim(name)) > 0),
    CONSTRAINT finance_vendors_user_name_unique UNIQUE (user_id, name)
);

CREATE INDEX idx_finance_vendors_user_id ON finance_vendors (user_id);

-- Finance transactions (spending, wishlist, orders; kind + optional subscription link).
CREATE TABLE finance_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    vendor_id INTEGER REFERENCES finance_vendors (id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'physical',
    status TEXT NOT NULL DEFAULT 'considering',
    sort_order INTEGER NOT NULL DEFAULT 0,
    listing_url TEXT,
    notes TEXT NOT NULL DEFAULT '',
    price_amount NUMERIC(12, 2),
    currency TEXT NOT NULL DEFAULT 'USD',
    quantity INTEGER NOT NULL DEFAULT 1,
    ordered_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT finance_transactions_title_nonempty CHECK (char_length(trim(title)) > 0),
    CONSTRAINT finance_transactions_kind_valid CHECK (
        kind IN ('physical', 'expense', 'subscription', 'service')
    ),
    CONSTRAINT finance_transactions_status_valid CHECK (
        status IN (
            'considering',
            'ordered',
            'in_transit',
            'received',
            'cancelled',
            'returned'
        )
    ),
    CONSTRAINT finance_transactions_quantity_positive CHECK (quantity > 0)
);

CREATE INDEX idx_finance_transactions_user_id ON finance_transactions (user_id);

CREATE INDEX idx_finance_transactions_user_updated_at ON finance_transactions (user_id, updated_at DESC);

CREATE INDEX idx_finance_transactions_user_status_sort ON finance_transactions (user_id, status, sort_order, id);

CREATE INDEX idx_finance_transactions_vendor_id ON finance_transactions (vendor_id);

CREATE INDEX idx_finance_transactions_user_kind ON finance_transactions (user_id, kind);

-- User-defined labels for grouping and filtering finance transactions.
CREATE TABLE finance_transaction_tags (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color_hex TEXT NOT NULL DEFAULT '#06B6D4',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT finance_transaction_tags_name_nonempty CHECK (char_length(trim(name)) > 0),
    CONSTRAINT finance_transaction_tags_color_hex_valid CHECK (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT finance_transaction_tags_user_name_unique UNIQUE (user_id, name)
);

CREATE INDEX idx_finance_transaction_tags_user_id ON finance_transaction_tags (user_id);

-- Many-to-many link between finance transactions and transaction tags.
CREATE TABLE finance_transaction_tag_assignments (
    transaction_id INTEGER NOT NULL REFERENCES finance_transactions (id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES finance_transaction_tags (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (transaction_id, tag_id)
);

CREATE INDEX idx_finance_transaction_tag_assignments_tag_id
    ON finance_transaction_tag_assignments (tag_id);

-- Listing-import previews awaiting user confirm or decline in chat.
CREATE TABLE finance_listing_proposals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    conversation_id INTEGER REFERENCES conversations (id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    payload JSONB NOT NULL,
    created_transaction_id INTEGER REFERENCES finance_transactions (id) ON DELETE SET NULL,
    created_vendor_id INTEGER REFERENCES finance_vendors (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT finance_listing_proposals_status_valid CHECK (
        status IN ('pending', 'confirmed', 'declined')
    )
);

CREATE INDEX idx_finance_listing_proposals_user_id ON finance_listing_proposals (user_id);

CREATE INDEX idx_finance_listing_proposals_user_status ON finance_listing_proposals (user_id, status);

CREATE TABLE finance_payment_methods (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    kind TEXT NOT NULL DEFAULT 'credit_card',
    label TEXT NOT NULL,
    institution_name TEXT,
    last_four TEXT,
    notes TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT finance_payment_methods_kind_valid CHECK (
        kind IN (
            'credit_card',
            'debit_card',
            'checking',
            'savings',
            'prepaid',
            'other'
        )
    ),
    CONSTRAINT finance_payment_methods_label_nonempty CHECK (char_length(trim(label)) > 0),
    CONSTRAINT finance_payment_methods_last_four_valid CHECK (
        last_four IS NULL OR last_four ~ '^\d{4}$'
    ),
    CONSTRAINT finance_payment_methods_user_label_unique UNIQUE (user_id, label)
);

CREATE INDEX idx_finance_payment_methods_user_id
    ON finance_payment_methods (user_id);

CREATE INDEX idx_finance_payment_methods_user_sort
    ON finance_payment_methods (user_id, sort_order, id);

CREATE TABLE finance_obligations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    vendor_id INTEGER REFERENCES finance_vendors (id) ON DELETE SET NULL,
    payment_method_id INTEGER REFERENCES finance_payment_methods (id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'subscription',
    status TEXT NOT NULL DEFAULT 'active',
    amount NUMERIC(12, 2),
    currency TEXT NOT NULL DEFAULT 'USD',
    billing_interval TEXT NOT NULL DEFAULT 'monthly',
    billing_day INTEGER,
    started_at TIMESTAMPTZ,
    next_billing_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    account_url TEXT,
    notes TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT finance_obligations_name_nonempty CHECK (char_length(trim(name)) > 0),
    CONSTRAINT finance_obligations_kind_valid CHECK (
        kind IN ('subscription', 'membership', 'bill')
    ),
    CONSTRAINT finance_obligations_status_valid CHECK (
        status IN ('active', 'trial', 'paused', 'cancelled')
    ),
    CONSTRAINT finance_obligations_billing_interval_valid CHECK (
        billing_interval IN ('monthly', 'annual', 'weekly', 'quarterly')
    ),
    CONSTRAINT finance_obligations_billing_day_valid CHECK (
        billing_day IS NULL OR (billing_day >= 1 AND billing_day <= 31)
    )
);

CREATE INDEX idx_finance_obligations_user_status
    ON finance_obligations (user_id, status);

CREATE INDEX idx_finance_obligations_user_next_billing
    ON finance_obligations (user_id, next_billing_at);

ALTER TABLE finance_transactions
    ADD COLUMN obligation_id INTEGER REFERENCES finance_obligations (id) ON DELETE SET NULL;

CREATE INDEX idx_finance_transactions_obligation_id
    ON finance_transactions (obligation_id)
    WHERE obligation_id IS NOT NULL;

CREATE TABLE finance_obligation_tags (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color_hex TEXT NOT NULL DEFAULT '#06B6D4',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT finance_obligation_tags_name_nonempty CHECK (char_length(trim(name)) > 0),
    CONSTRAINT finance_obligation_tags_color_hex_valid CHECK (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT finance_obligation_tags_user_name_unique UNIQUE (user_id, name)
);

CREATE INDEX idx_finance_obligation_tags_user_id
    ON finance_obligation_tags (user_id);

CREATE TABLE finance_obligation_tag_assignments (
    obligation_id INTEGER NOT NULL REFERENCES finance_obligations (id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES finance_obligation_tags (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (obligation_id, tag_id)
);

CREATE INDEX idx_finance_obligation_tag_assignments_tag_id
    ON finance_obligation_tag_assignments (tag_id);

-- Focus nodes (unified tree: item | list | record).
CREATE TABLE focus_nodes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    parent_id INTEGER,
    kind TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    title TEXT NOT NULL,

    notes TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active',
    completed_at TIMESTAMPTZ,
    work_order INTEGER,

    -- list/record container presentation (hub + constellation)
    node_color_hex TEXT,
    title_font_key TEXT,
    is_origin BOOLEAN NOT NULL DEFAULT FALSE,

    -- record-only (one external target per node in v1)
    reference_target_type TEXT,
    reference_target_id TEXT,
    show_reference_content BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT focus_nodes_title_nonempty CHECK (char_length(trim(title)) > 0),
    CONSTRAINT focus_nodes_kind_valid CHECK (kind IN ('item', 'list', 'record')),
    CONSTRAINT focus_nodes_id_user_unique UNIQUE (id, user_id),
    CONSTRAINT focus_nodes_parent_fkey
        FOREIGN KEY (parent_id, user_id)
        REFERENCES focus_nodes (id, user_id)
        ON DELETE CASCADE,
    CONSTRAINT focus_nodes_status_valid CHECK (
        status IN ('active', 'paused', 'completed', 'archived', 'limbo')
    ),
    CONSTRAINT focus_nodes_work_order_valid CHECK (
        work_order IS NULL OR work_order >= 0
    ),
    CONSTRAINT focus_nodes_node_color_hex_valid CHECK (
        node_color_hex IS NULL OR node_color_hex ~ '^#[0-9A-Fa-f]{6}$'
    ),
    CONSTRAINT focus_nodes_title_font_key_valid CHECK (
        title_font_key IS NULL
        OR title_font_key IN (
            'default',
            'serif',
            'mono',
            'rounded',
            'condensed',
            'handwritten',
            'display',
            'elegant',
            'slab',
            'bold',
            'retro',
            'tech',
            'classic',
            'wide'
        )
    ),
    CONSTRAINT focus_nodes_kind_shape CHECK (
        (
            kind = 'item'
            AND reference_target_type IS NULL
            AND reference_target_id IS NULL
        )
        OR (
            kind = 'list'
            AND reference_target_type IS NULL
            AND reference_target_id IS NULL
        )
        OR (
            kind = 'record'
            AND reference_target_type IS NOT NULL
            AND reference_target_id IS NOT NULL
        )
    )
);

CREATE INDEX idx_focus_nodes_user_kind_updated
    ON focus_nodes (user_id, kind, updated_at DESC);

CREATE INDEX idx_focus_nodes_user_parent_sort
    ON focus_nodes (user_id, parent_id, sort_order);

CREATE INDEX idx_focus_nodes_user_status
    ON focus_nodes (user_id, status, updated_at DESC);

CREATE UNIQUE INDEX idx_focus_nodes_one_origin_per_user
    ON focus_nodes (user_id)
    WHERE is_origin = TRUE;

CREATE INDEX idx_focus_nodes_reference_target
    ON focus_nodes (user_id, reference_target_type, reference_target_id)
    WHERE kind = 'record';

-- Time tracking sessions for focus nodes.
CREATE TABLE focus_node_time_entries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    node_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'running',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_paused_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    accumulated_paused_seconds INTEGER NOT NULL DEFAULT 0,
    duration_seconds INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT focus_node_time_entries_node_user_fkey
        FOREIGN KEY (node_id, user_id)
        REFERENCES focus_nodes (id, user_id)
        ON DELETE CASCADE,
    CONSTRAINT focus_node_time_entries_status_valid CHECK (
        status IN ('running', 'paused', 'ended')
    ),
    CONSTRAINT focus_node_time_entries_pause_valid CHECK (
        (status = 'paused' AND last_paused_at IS NOT NULL AND ended_at IS NULL)
        OR status <> 'paused'
    ),
    CONSTRAINT focus_node_time_entries_end_valid CHECK (
        (
            status = 'ended'
            AND ended_at IS NOT NULL
            AND duration_seconds IS NOT NULL
        )
        OR status <> 'ended'
    ),
    CONSTRAINT focus_node_time_entries_open_valid CHECK (
        status <> 'running'
        OR (last_paused_at IS NULL AND ended_at IS NULL AND duration_seconds IS NULL)
    ),
    CONSTRAINT focus_node_time_entries_seconds_valid CHECK (
        accumulated_paused_seconds >= 0
        AND (duration_seconds IS NULL OR duration_seconds >= 0)
    )
);

CREATE INDEX idx_focus_node_time_entries_user_node_started
    ON focus_node_time_entries (user_id, node_id, started_at DESC);

CREATE UNIQUE INDEX idx_focus_node_time_entries_one_open_per_node
    ON focus_node_time_entries (user_id, node_id)
    WHERE status IN ('running', 'paused');

-- User-defined labels for grouping and filtering focus lists.
CREATE TABLE focus_tags (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color_hex TEXT NOT NULL DEFAULT '#06B6D4',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT focus_tags_name_nonempty CHECK (char_length(trim(name)) > 0),
    CONSTRAINT focus_tags_color_hex_valid CHECK (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT focus_tags_user_name_unique UNIQUE (user_id, name)
);

CREATE INDEX idx_focus_tags_user_id ON focus_tags (user_id);

-- Many-to-many link between list nodes and focus tags.
CREATE TABLE focus_node_tags (
    node_id INTEGER NOT NULL REFERENCES focus_nodes (id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES focus_tags (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (node_id, tag_id)
);

CREATE INDEX idx_focus_node_tags_tag_id ON focus_node_tags (tag_id);


-- ----- Home (global inspirational quotes for the home screen rotator)

CREATE TABLE quotes (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    author TEXT NOT NULL,
    CONSTRAINT quotes_text_nonempty CHECK (char_length(trim(text)) > 0),
    CONSTRAINT quotes_author_nonempty CHECK (char_length(trim(author)) > 0)
);


-- ----- Intelligence catalog (global system metadata; not tied to a given user)

-- Intelligence model kinds (llm, vlm, stt, etc.) for multi-modality catalog.
CREATE TABLE model_modalities (
    key TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- LLM/VLM API vendors (OpenAI, Anthropic, Moonshot, …) and non-secret config.
CREATE TABLE model_providers (
    id SERIAL PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    base_url TEXT,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT model_providers_key_nonempty CHECK (char_length(trim(key)) > 0)
);

CREATE INDEX idx_model_providers_sort ON model_providers (sort_order, id);

-- Registered models per provider and modality (pricing, context, capabilities).
CREATE TABLE models (
    id SERIAL PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    provider_id INTEGER NOT NULL REFERENCES model_providers (id) ON DELETE RESTRICT,
    modality_key TEXT NOT NULL DEFAULT 'llm' REFERENCES model_modalities (key),
    display_name TEXT NOT NULL,
    max_context_window INTEGER,
    input_price_per_1m NUMERIC(12, 4),
    output_price_per_1m NUMERIC(12, 4),
    capabilities JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    is_provider_default BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT models_key_nonempty CHECK (char_length(trim(key)) > 0)
);

CREATE INDEX idx_models_provider_id ON models (provider_id, sort_order, id);

CREATE INDEX idx_models_modality_key ON models (modality_key, sort_order, id);

CREATE UNIQUE INDEX idx_models_one_default_per_provider
    ON models (provider_id)
    WHERE is_provider_default = TRUE;

-- Named tool groupings granted to agents (core, obsidian, haul, …).
CREATE TABLE tool_categories (
    id SERIAL PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT tool_categories_key_nonempty CHECK (char_length(trim(key)) > 0)
);

CREATE INDEX idx_tool_categories_sort ON tool_categories (sort_order, id);

-- Native tool definitions (schema + description); executors (functions) stay in code.
CREATE TABLE tools (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    category_id INTEGER NOT NULL REFERENCES tool_categories (id) ON DELETE RESTRICT,
    description TEXT NOT NULL,
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    returns TEXT NOT NULL DEFAULT '',
    examples JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT tools_name_nonempty CHECK (char_length(trim(name)) > 0)
);

CREATE INDEX idx_tools_category_id ON tools (category_id, name);

-- Sectioned system prompt templates linked to agents.
CREATE TABLE system_prompts (
    id SERIAL PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    identity TEXT NOT NULL,
    purpose TEXT NOT NULL,
    guidelines TEXT NOT NULL,
    domain_reference TEXT NOT NULL,
    tool_guidance TEXT,
    safety TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT system_prompts_key_nonempty CHECK (char_length(trim(key)) > 0),
    CONSTRAINT system_prompts_identity_nonempty CHECK (char_length(trim(identity)) > 0),
    CONSTRAINT system_prompts_purpose_nonempty CHECK (char_length(trim(purpose)) > 0),
    CONSTRAINT system_prompts_guidelines_nonempty CHECK (char_length(trim(guidelines)) > 0),
    CONSTRAINT system_prompts_domain_reference_nonempty CHECK (char_length(trim(domain_reference)) > 0),
    CONSTRAINT system_prompts_safety_nonempty CHECK (char_length(trim(safety)) > 0)
);

CREATE INDEX idx_system_prompts_sort ON system_prompts (sort_order, id);

-- Keel orchestrator and sub-agents (routing metadata, prompt link, delegation).
CREATE TABLE agents (
    id SERIAL PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT NOT NULL,
    system_prompt_id INTEGER REFERENCES system_prompts (id) ON DELETE SET NULL,
    is_orchestrator BOOLEAN NOT NULL DEFAULT FALSE,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT agents_key_nonempty CHECK (char_length(trim(key)) > 0)
);

CREATE UNIQUE INDEX idx_agents_one_orchestrator
    ON agents (is_orchestrator)
    WHERE is_orchestrator = TRUE;

CREATE INDEX idx_agents_sort ON agents (sort_order, id);

-- Which tool categories each agent is allowed to invoke.
CREATE TABLE agent_tool_categories (
    agent_id INTEGER NOT NULL REFERENCES agents (id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES tool_categories (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (agent_id, category_id)
);

CREATE INDEX idx_agent_tool_categories_category_id ON agent_tool_categories (category_id);

-- Orchestrator-to-sub-agent delegation edges (e.g. Keel → recall).
CREATE TABLE agent_delegations (
    parent_agent_id INTEGER NOT NULL REFERENCES agents (id) ON DELETE CASCADE,
    child_agent_id INTEGER NOT NULL REFERENCES agents (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (parent_agent_id, child_agent_id),
    CONSTRAINT agent_delegations_not_self CHECK (parent_agent_id <> child_agent_id)
);

CREATE INDEX idx_agent_delegations_child ON agent_delegations (child_agent_id);

-- Catalog images and 3D assets for agents, categories, providers, or models.
CREATE TABLE catalog_media (
    id SERIAL PRIMARY KEY,
    agent_id INTEGER REFERENCES agents (id) ON DELETE CASCADE,
    tool_category_id INTEGER REFERENCES tool_categories (id) ON DELETE CASCADE,
    provider_id INTEGER REFERENCES model_providers (id) ON DELETE CASCADE,
    model_id INTEGER REFERENCES models (id) ON DELETE CASCADE,
    media_kind TEXT NOT NULL,
    role TEXT,
    storage_key TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    byte_size INTEGER,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT catalog_media_kind_valid CHECK (media_kind IN ('image', 'model_3d')),
    CONSTRAINT catalog_media_storage_key_nonempty CHECK (char_length(trim(storage_key)) > 0),
    CONSTRAINT catalog_media_exactly_one_owner CHECK (
        (
            (agent_id IS NOT NULL)::int
            + (tool_category_id IS NOT NULL)::int
            + (provider_id IS NOT NULL)::int
            + (model_id IS NOT NULL)::int
        ) = 1
    )
);

CREATE INDEX idx_catalog_media_agent_id ON catalog_media (agent_id);

CREATE INDEX idx_catalog_media_tool_category_id ON catalog_media (tool_category_id);

CREATE INDEX idx_catalog_media_provider_id ON catalog_media (provider_id);

CREATE INDEX idx_catalog_media_model_id ON catalog_media (model_id);

-- Contacts: people in the user's life (not Keel login accounts).
CREATE TABLE contacts (
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
    is_self BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT contacts_status_valid CHECK (status IN ('active', 'archived')),
    CONSTRAINT contacts_gender_valid CHECK (gender IS NULL OR gender IN ('male', 'female'))
);

CREATE INDEX idx_contacts_user_id ON contacts (user_id);

CREATE UNIQUE INDEX idx_contacts_one_self_per_user
    ON contacts (user_id)
    WHERE is_self = TRUE;

-- Link each user to their profile contact (birth date, etc.).
ALTER TABLE users
    ADD COLUMN contact_id INTEGER REFERENCES contacts (id) ON DELETE SET NULL;

-- Typed edges between contacts (spouse, parent, etc.).
CREATE TABLE contact_relationships (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    from_contact_id INTEGER NOT NULL REFERENCES contacts (id) ON DELETE CASCADE,
    to_contact_id INTEGER NOT NULL REFERENCES contacts (id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT contact_relationships_no_self_link
        CHECK (from_contact_id != to_contact_id),
    CONSTRAINT contact_relationships_type_valid
        CHECK (relationship_type IN ('spouse', 'parent', 'sibling', 'friend')),
    CONSTRAINT contact_relationships_unique_edge
        UNIQUE (from_contact_id, to_contact_id, relationship_type)
);

CREATE INDEX idx_contact_relationships_user_id
    ON contact_relationships (user_id);

CREATE INDEX idx_contact_relationships_from
    ON contact_relationships (from_contact_id);

CREATE INDEX idx_contact_relationships_to
    ON contact_relationships (to_contact_id);

-- User-owned life events with optional contact tagging.
CREATE TABLE timeline_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    subject_name TEXT,
    description TEXT NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    all_day BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT timeline_events_description_nonempty CHECK (char_length(trim(description)) > 0),
    CONSTRAINT timeline_events_end_on_or_after_start
        CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX idx_timeline_events_user_start_date
    ON timeline_events (user_id, start_date DESC);

-- Many-to-many link between timeline events and contacts.
CREATE TABLE timeline_event_contacts (
    timeline_event_id INTEGER NOT NULL REFERENCES timeline_events (id) ON DELETE CASCADE,
    contact_id INTEGER NOT NULL REFERENCES contacts (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (timeline_event_id, contact_id)
);

CREATE INDEX idx_timeline_event_contacts_contact_id
    ON timeline_event_contacts (contact_id);

-- Public figures tracked by the user (celebrities, politicians, creators, etc.).
CREATE TABLE figures (
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

CREATE INDEX idx_figures_user_id ON figures (user_id);

-- Many-to-many link between timeline events and figures.
CREATE TABLE timeline_event_figures (
    timeline_event_id INTEGER NOT NULL REFERENCES timeline_events (id) ON DELETE CASCADE,
    figure_id INTEGER NOT NULL REFERENCES figures (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (timeline_event_id, figure_id)
);

CREATE INDEX idx_timeline_event_figures_figure_id
    ON timeline_event_figures (figure_id);

-- User-defined labels for grouping and filtering timeline events.
CREATE TABLE timeline_tags (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color_hex TEXT NOT NULL DEFAULT '#06B6D4',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT timeline_tags_name_nonempty CHECK (char_length(trim(name)) > 0),
    CONSTRAINT timeline_tags_color_hex_valid CHECK (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT timeline_tags_user_name_unique UNIQUE (user_id, name)
);

CREATE INDEX idx_timeline_tags_user_id ON timeline_tags (user_id);

-- Forward-looking period plans inside Timeline.
CREATE TABLE timeline_plans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT timeline_plans_title_nonempty CHECK (char_length(trim(title)) > 0),
    CONSTRAINT timeline_plans_end_on_or_after_start CHECK (end_date >= start_date)
);

CREATE UNIQUE INDEX idx_timeline_plans_id_user ON timeline_plans (id, user_id);

CREATE INDEX idx_timeline_plans_user_start_date
    ON timeline_plans (user_id, start_date DESC);

CREATE TABLE timeline_plan_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    plan_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ,
    all_day BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'planned',
    timeline_event_id INTEGER REFERENCES timeline_events (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT timeline_plan_items_plan_user_fkey
        FOREIGN KEY (plan_id, user_id)
        REFERENCES timeline_plans (id, user_id)
        ON DELETE CASCADE,
    CONSTRAINT timeline_plan_items_title_nonempty CHECK (char_length(trim(title)) > 0),
    CONSTRAINT timeline_plan_items_status_valid CHECK (status IN ('planned', 'done', 'skipped')),
    CONSTRAINT timeline_plan_items_end_on_or_after_start
        CHECK (end_at IS NULL OR end_at >= start_at)
);

CREATE INDEX idx_timeline_plan_items_user_plan_start
    ON timeline_plan_items (user_id, plan_id, start_at, sort_order);

CREATE INDEX idx_timeline_plan_items_timeline_event
    ON timeline_plan_items (timeline_event_id)
    WHERE timeline_event_id IS NOT NULL;

-- Many-to-many link between timeline tags and tagged entities (events or plan items).
CREATE TABLE timeline_tag_assignments (
    tag_id INTEGER NOT NULL REFERENCES timeline_tags (id) ON DELETE CASCADE,
    timeline_event_id INTEGER REFERENCES timeline_events (id) ON DELETE CASCADE,
    timeline_plan_item_id INTEGER REFERENCES timeline_plan_items (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT timeline_tag_assignments_one_entity CHECK (
        (timeline_event_id IS NOT NULL AND timeline_plan_item_id IS NULL)
        OR (timeline_event_id IS NULL AND timeline_plan_item_id IS NOT NULL)
    )
);

CREATE UNIQUE INDEX idx_timeline_tag_assignments_event_tag
    ON timeline_tag_assignments (timeline_event_id, tag_id)
    WHERE timeline_event_id IS NOT NULL;

CREATE UNIQUE INDEX idx_timeline_tag_assignments_plan_item_tag
    ON timeline_tag_assignments (timeline_plan_item_id, tag_id)
    WHERE timeline_plan_item_id IS NOT NULL;

CREATE INDEX idx_timeline_tag_assignments_tag_id
    ON timeline_tag_assignments (tag_id);

-- Notification offsets before timeline event start times.
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

-- User-defined labels for grouping and filtering contacts.
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

-- Many-to-many link between contacts and contact tags.
CREATE TABLE contact_tag_assignments (
    contact_id INTEGER NOT NULL REFERENCES contacts (id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES contact_tags (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (contact_id, tag_id)
);

CREATE INDEX idx_contact_tag_assignments_tag_id
    ON contact_tag_assignments (tag_id);

-- Personal journal entries (user-owned, day-level dates).
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

-- User-defined labels for grouping and filtering journal entries.
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

-- Many-to-many link between journal entries and journal tags.
CREATE TABLE journal_entry_tag_assignments (
    journal_entry_id INTEGER NOT NULL REFERENCES journal_entries (id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES journal_tags (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (journal_entry_id, tag_id)
);

CREATE INDEX idx_journal_entry_tag_assignments_tag_id
    ON journal_entry_tag_assignments (tag_id);

-- Background job run history (Celery task tracking).
CREATE TABLE job_runs (
    id UUID PRIMARY KEY,
    celery_task_id TEXT NOT NULL UNIQUE,
    task_name TEXT NOT NULL,
    queue TEXT NOT NULL DEFAULT 'default',
    status TEXT NOT NULL DEFAULT 'pending',
    triggered_by TEXT NOT NULL,
    user_id INTEGER REFERENCES users (id) ON DELETE SET NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    result JSONB,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    CONSTRAINT job_runs_status_valid CHECK (
        status IN ('pending', 'running', 'success', 'failure', 'retry')
    ),
    CONSTRAINT job_runs_triggered_by_valid CHECK (
        triggered_by IN ('api', 'beat', 'manual')
    ),
    CONSTRAINT job_runs_queue_valid CHECK (queue IN ('default', 'heavy'))
);

CREATE INDEX idx_job_runs_status ON job_runs (status);

CREATE INDEX idx_job_runs_task_name_created_at ON job_runs (task_name, created_at DESC);

CREATE INDEX idx_job_runs_user_id ON job_runs (user_id)
    WHERE user_id IS NOT NULL;

-- Configurable recurring job schedules.
CREATE TABLE job_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    task_name TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    queue TEXT NOT NULL DEFAULT 'default',
    recurrence TEXT NOT NULL,
    minute SMALLINT NOT NULL DEFAULT 0,
    hour SMALLINT NOT NULL DEFAULT 0,
    days_of_week SMALLINT[],
    day_of_month SMALLINT,
    month_of_year SMALLINT,
    interval_minutes INTEGER,
    timezone TEXT NOT NULL DEFAULT 'America/New_York',
    task_kwargs JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT job_schedules_recurrence_valid CHECK (
        recurrence IN ('daily', 'weekly', 'monthly', 'yearly', 'interval')
    ),
    CONSTRAINT job_schedules_interval_minutes_valid CHECK (
        interval_minutes IS NULL
        OR (interval_minutes >= 1 AND interval_minutes <= 1440)
    ),
    CONSTRAINT job_schedules_interval_recurrence_fields CHECK (
        (recurrence = 'interval' AND interval_minutes IS NOT NULL)
        OR (recurrence <> 'interval' AND interval_minutes IS NULL)
    ),
    CONSTRAINT job_schedules_queue_valid CHECK (queue IN ('default', 'heavy')),
    CONSTRAINT job_schedules_minute_valid CHECK (minute >= 0 AND minute <= 59),
    CONSTRAINT job_schedules_hour_valid CHECK (hour >= 0 AND hour <= 23),
    CONSTRAINT job_schedules_days_of_week_valid CHECK (
        days_of_week IS NULL OR (
            cardinality(days_of_week) >= 1
            AND cardinality(days_of_week) <= 7
            AND days_of_week <@ ARRAY[0, 1, 2, 3, 4, 5, 6]::SMALLINT[]
        )
    ),
    CONSTRAINT job_schedules_day_of_month_valid CHECK (
        day_of_month IS NULL OR (day_of_month >= 1 AND day_of_month <= 31)
    ),
    CONSTRAINT job_schedules_month_of_year_valid CHECK (
        month_of_year IS NULL OR (month_of_year >= 1 AND month_of_year <= 12)
    )
);

CREATE INDEX idx_job_schedules_enabled ON job_schedules (enabled)
    WHERE enabled = TRUE;

ALTER TABLE job_runs
    ADD COLUMN schedule_id UUID REFERENCES job_schedules (id) ON DELETE SET NULL;

CREATE INDEX idx_job_runs_schedule_id ON job_runs (schedule_id)
    WHERE schedule_id IS NOT NULL;

-- Coak learning workspaces: records and hierarchical directory items.
CREATE TABLE coak_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color_hex TEXT NOT NULL DEFAULT '#FBBF24',
    workspace_state JSONB NOT NULL DEFAULT '{}'::jsonb,
    workspace_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    configuration_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT coak_records_name_nonempty CHECK (char_length(trim(name)) > 0),
    CONSTRAINT coak_records_color_hex_valid CHECK (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT coak_records_workspace_state_object CHECK (jsonb_typeof(workspace_state) = 'object'),
    CONSTRAINT coak_records_workspace_settings_object CHECK (jsonb_typeof(workspace_settings) = 'object'),
    CONSTRAINT coak_records_configuration_settings_object CHECK (jsonb_typeof(configuration_settings) = 'object')
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
    flash_front TEXT NOT NULL DEFAULT '',
    flash_back TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT coak_items_name_nonempty CHECK (char_length(trim(name)) > 0),
    CONSTRAINT coak_items_color_hex_valid CHECK (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT coak_items_kind_valid CHECK (kind IN ('folder', 'note', 'flash')),
    CONSTRAINT coak_items_id_record_unique UNIQUE (id, coak_record_id),
    CONSTRAINT coak_items_parent_fkey
        FOREIGN KEY (parent_id, coak_record_id)
        REFERENCES coak_items (id, coak_record_id)
        ON DELETE CASCADE
);

CREATE INDEX idx_coak_items_record_parent_sort
    ON coak_items (coak_record_id, parent_id, sort_order, id);

CREATE INDEX idx_coak_items_user_record
    ON coak_items (user_id, coak_record_id);

CREATE UNIQUE INDEX idx_coak_items_unique_sibling_name
    ON coak_items (coak_record_id, COALESCE(parent_id, -1), lower(name));

CREATE TABLE coak_tags (
    id SERIAL PRIMARY KEY,
    coak_record_id INTEGER NOT NULL REFERENCES coak_records (id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
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

-- Global recently-deleted (trash) snapshots for restorable deletes.
CREATE TABLE deleted_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    display_label TEXT NOT NULL,
    payload JSONB NOT NULL,
    purge_group_id UUID,
    deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    permanently_deleted_at TIMESTAMPTZ,
    CONSTRAINT deleted_records_payload_object CHECK (jsonb_typeof(payload) = 'object')
);

CREATE INDEX idx_deleted_records_user_active
    ON deleted_records (user_id, deleted_at DESC)
    WHERE permanently_deleted_at IS NULL;

CREATE INDEX idx_deleted_records_expires_active
    ON deleted_records (expires_at)
    WHERE permanently_deleted_at IS NULL;

INSERT INTO job_schedules (
    name,
    task_name,
    enabled,
    queue,
    recurrence,
    minute,
    hour,
    timezone
)
VALUES (
    'purge-expired-deleted-records-daily',
    'jobs.tasks.maintenance.purge_expired_deleted_records',
    TRUE,
    'default',
    'daily',
    30,
    3,
    'America/New_York'
);

-- HTTP service health monitors (URL probes, status tracking).
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    url TEXT NOT NULL,
    service_type TEXT NOT NULL DEFAULT 'frontend',
    description TEXT,
    check_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    expected_status_code INTEGER NOT NULL DEFAULT 200,
    failure_threshold INTEGER NOT NULL DEFAULT 3,
    last_status TEXT,
    last_checked_at TIMESTAMPTZ,
    response_time_ms INTEGER,
    status_code INTEGER,
    error_message TEXT,
    consecutive_failures INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT services_name_nonempty CHECK (char_length(trim(service_name)) > 0),
    CONSTRAINT services_url_nonempty CHECK (char_length(trim(url)) > 0),
    CONSTRAINT services_url_http CHECK (url ~* '^https?://'),
    CONSTRAINT services_service_type_valid CHECK (
        service_type IN ('frontend', 'backend')
    ),
    CONSTRAINT services_last_status_valid CHECK (
        last_status IS NULL OR last_status IN ('up', 'down', 'caution')
    ),
    CONSTRAINT services_expected_status_valid CHECK (
        expected_status_code BETWEEN 100 AND 599
    ),
    CONSTRAINT services_failure_threshold_positive CHECK (failure_threshold >= 1),
    CONSTRAINT services_consecutive_failures_nonnegative CHECK (consecutive_failures >= 0),
    CONSTRAINT services_user_name_type_unique UNIQUE (user_id, service_name, service_type)
);

CREATE INDEX idx_services_user_id ON services (user_id);

CREATE INDEX idx_services_check_enabled ON services (check_enabled) WHERE check_enabled = TRUE;

-- Solo mini-games: resumable sessions and per-user stats (catalog lives in code).
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    game_key TEXT NOT NULL,
    level INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'in_progress'
        CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    state JSONB NOT NULL DEFAULT '{}'::jsonb,
    move_count INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT game_sessions_state_object CHECK (jsonb_typeof(state) = 'object'),
    CONSTRAINT game_sessions_level_positive CHECK (level >= 1)
);

CREATE INDEX idx_game_sessions_user_game ON game_sessions (user_id, game_key, updated_at DESC);

CREATE UNIQUE INDEX game_sessions_active_level_uq
    ON game_sessions (user_id, game_key, level)
    WHERE status = 'in_progress';

CREATE TABLE game_stats (
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    game_key TEXT NOT NULL,
    stats JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, game_key),
    CONSTRAINT game_stats_stats_object CHECK (jsonb_typeof(stats) = 'object')
);

