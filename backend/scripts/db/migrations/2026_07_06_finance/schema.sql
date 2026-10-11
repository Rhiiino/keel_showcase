-- Finance module: rename shop_* tables to finance_*; add obligations, payment methods, obligation tags.
-- Idempotent guard: skips when shop_merchants is absent (fresh init or re-run).

BEGIN;

DO $migration$
BEGIN
    IF to_regclass('public.shop_merchants') IS NULL THEN
        RAISE NOTICE '2026_07_06_finance: shop_merchants not found — skipping migration.';
        RETURN;
    END IF;

    -- -------------------------------------------------------------------------
    -- 1. Rename tables (preserve row IDs)
    -- -------------------------------------------------------------------------
    ALTER TABLE shop_merchants RENAME TO finance_vendors;
    ALTER TABLE shop_items RENAME TO finance_purchases;
    ALTER TABLE shop_item_tags RENAME TO finance_purchase_tags;
    ALTER TABLE shop_item_tag_assignments RENAME TO finance_purchase_tag_assignments;
    ALTER TABLE shop_listing_proposals RENAME TO finance_listing_proposals;

    -- -------------------------------------------------------------------------
    -- 2. New vendor column
    -- -------------------------------------------------------------------------
    ALTER TABLE finance_vendors
        ADD COLUMN billing_portal_url TEXT;

    -- -------------------------------------------------------------------------
    -- 3. Rename columns
    -- -------------------------------------------------------------------------
    ALTER TABLE finance_purchases RENAME COLUMN merchant_id TO vendor_id;
    ALTER TABLE finance_purchase_tag_assignments RENAME COLUMN shop_item_id TO purchase_id;
    ALTER TABLE finance_listing_proposals RENAME COLUMN created_item_id TO created_purchase_id;
    ALTER TABLE finance_listing_proposals RENAME COLUMN created_merchant_id TO created_vendor_id;

    -- -------------------------------------------------------------------------
    -- 4. Rename indexes
    -- -------------------------------------------------------------------------
    ALTER INDEX idx_shop_merchants_user_id RENAME TO idx_finance_vendors_user_id;
    ALTER INDEX idx_shop_items_user_id RENAME TO idx_finance_purchases_user_id;
    ALTER INDEX idx_shop_items_user_updated_at RENAME TO idx_finance_purchases_user_updated_at;
    ALTER INDEX idx_shop_items_user_status_sort RENAME TO idx_finance_purchases_user_status_sort;
    ALTER INDEX idx_shop_items_merchant_id RENAME TO idx_finance_purchases_vendor_id;
    ALTER INDEX idx_shop_item_tags_user_id RENAME TO idx_finance_purchase_tags_user_id;
    ALTER INDEX idx_shop_item_tag_assignments_tag_id
        RENAME TO idx_finance_purchase_tag_assignments_tag_id;
    ALTER INDEX idx_shop_listing_proposals_user_id RENAME TO idx_finance_listing_proposals_user_id;
    ALTER INDEX idx_shop_listing_proposals_user_status
        RENAME TO idx_finance_listing_proposals_user_status;

    -- -------------------------------------------------------------------------
    -- 5. Rename constraints (shop_* → finance_*)
    -- -------------------------------------------------------------------------
    ALTER TABLE finance_vendors RENAME CONSTRAINT shop_merchants_pkey TO finance_vendors_pkey;
    ALTER TABLE finance_vendors
        RENAME CONSTRAINT shop_merchants_user_id_fkey TO finance_vendors_user_id_fkey;
    ALTER TABLE finance_vendors
        RENAME CONSTRAINT shop_merchants_name_nonempty TO finance_vendors_name_nonempty;
    ALTER TABLE finance_vendors
        RENAME CONSTRAINT shop_merchants_user_name_unique TO finance_vendors_user_name_unique;

    ALTER TABLE finance_purchases RENAME CONSTRAINT shop_items_pkey TO finance_purchases_pkey;
    ALTER TABLE finance_purchases
        RENAME CONSTRAINT shop_items_user_id_fkey TO finance_purchases_user_id_fkey;
    ALTER TABLE finance_purchases
        RENAME CONSTRAINT shop_items_merchant_id_fkey TO finance_purchases_vendor_id_fkey;
    ALTER TABLE finance_purchases
        RENAME CONSTRAINT shop_items_title_nonempty TO finance_purchases_title_nonempty;
    ALTER TABLE finance_purchases
        RENAME CONSTRAINT shop_items_status_valid TO finance_purchases_status_valid;
    ALTER TABLE finance_purchases
        RENAME CONSTRAINT shop_items_quantity_positive TO finance_purchases_quantity_positive;

    ALTER TABLE finance_purchase_tags RENAME CONSTRAINT shop_item_tags_pkey TO finance_purchase_tags_pkey;
    ALTER TABLE finance_purchase_tags
        RENAME CONSTRAINT shop_item_tags_user_id_fkey TO finance_purchase_tags_user_id_fkey;
    ALTER TABLE finance_purchase_tags
        RENAME CONSTRAINT shop_item_tags_name_nonempty TO finance_purchase_tags_name_nonempty;
    ALTER TABLE finance_purchase_tags
        RENAME CONSTRAINT shop_item_tags_color_hex_valid TO finance_purchase_tags_color_hex_valid;
    ALTER TABLE finance_purchase_tags
        RENAME CONSTRAINT shop_item_tags_user_name_unique TO finance_purchase_tags_user_name_unique;

    ALTER TABLE finance_purchase_tag_assignments
        RENAME CONSTRAINT shop_item_tag_assignments_pkey TO finance_purchase_tag_assignments_pkey;
    ALTER TABLE finance_purchase_tag_assignments
        RENAME CONSTRAINT shop_item_tag_assignments_shop_item_id_fkey
        TO finance_purchase_tag_assignments_purchase_id_fkey;
    ALTER TABLE finance_purchase_tag_assignments
        RENAME CONSTRAINT shop_item_tag_assignments_tag_id_fkey
        TO finance_purchase_tag_assignments_tag_id_fkey;

    ALTER TABLE finance_listing_proposals
        RENAME CONSTRAINT shop_listing_proposals_pkey TO finance_listing_proposals_pkey;
    ALTER TABLE finance_listing_proposals
        RENAME CONSTRAINT shop_listing_proposals_user_id_fkey TO finance_listing_proposals_user_id_fkey;
    ALTER TABLE finance_listing_proposals
        RENAME CONSTRAINT shop_listing_proposals_conversation_id_fkey
        TO finance_listing_proposals_conversation_id_fkey;
    ALTER TABLE finance_listing_proposals
        RENAME CONSTRAINT shop_listing_proposals_created_item_id_fkey
        TO finance_listing_proposals_created_purchase_id_fkey;
    ALTER TABLE finance_listing_proposals
        RENAME CONSTRAINT shop_listing_proposals_created_merchant_id_fkey
        TO finance_listing_proposals_created_vendor_id_fkey;
    ALTER TABLE finance_listing_proposals
        RENAME CONSTRAINT shop_listing_proposals_status_valid TO finance_listing_proposals_status_valid;

    -- -------------------------------------------------------------------------
    -- 6. Cross-table data migrations
    -- -------------------------------------------------------------------------
    ALTER TABLE media_attachments
        DROP CONSTRAINT media_attachments_entity_type_valid;

    UPDATE media_attachments
    SET entity_type = 'finance_purchase'
    WHERE entity_type = 'shop_item';

    UPDATE media_attachments
    SET entity_type = 'finance_vendor'
    WHERE entity_type = 'shop_merchant';

    UPDATE focus_nodes
    SET reference_target_type = 'finance_purchase'
    WHERE reference_target_type = 'shop_item';

    UPDATE deleted_records
    SET entity_type = 'finance_purchase'
    WHERE entity_type = 'shop_item';

    UPDATE deleted_records
    SET entity_type = 'finance_vendor'
    WHERE entity_type = 'shop_merchant';

    UPDATE deleted_records
    SET entity_type = 'finance_purchase_tag'
    WHERE entity_type = 'shop_item_tag';

    ALTER TABLE media_attachments
        ADD CONSTRAINT media_attachments_entity_type_valid CHECK (
            entity_type IN (
                'project',
                'finance_purchase',
                'contact',
                'finance_vendor',
                'timeline_event',
                'journal_entry'
            )
        );

    DROP INDEX IF EXISTS idx_media_attachments_one_logo_per_merchant;

    CREATE UNIQUE INDEX idx_media_attachments_one_logo_per_vendor
        ON media_attachments (entity_id)
        WHERE entity_type = 'finance_vendor' AND role = 'logo';

    -- -------------------------------------------------------------------------
    -- 7. New finance tables
    -- -------------------------------------------------------------------------
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

    -- -------------------------------------------------------------------------
    -- 8. Rename HAUL catalog tools (17 shop_* → finance_*)
    -- -------------------------------------------------------------------------
    UPDATE tools
    SET
        name = 'clear_finance_purchase_cover',
        description = 'Remove a purchase''s cover image.',
        parameters = '{"type": "object", "properties": {"purchase_id": {"type": "integer"}}, "required": ["purchase_id"], "additionalProperties": false}'::jsonb,
        returns = '{ purchase: object }',
        updated_at = NOW()
    WHERE name = 'clear_shop_item_cover';

    UPDATE tools
    SET
        name = 'create_finance_purchase',
        description = 'Create a finance purchase (wishlist entry or order).',
        parameters = '{"type": "object", "properties": {"title": {"type": "string", "description": "Purchase name."}, "status": {"type": "string", "enum": ["considering", "ordered", "in_transit", "received", "cancelled", "returned"]}, "vendor_id": {"type": "integer"}, "vendor_name": {"type": "string", "description": "Find-or-create vendor by name."}, "listing_url": {"type": "string"}, "notes": {"type": "string"}, "price_amount": {"type": "number"}, "currency": {"type": "string"}, "quantity": {"type": "integer"}, "ordered_at": {"type": "string", "description": "ISO-8601 timestamp."}, "received_at": {"type": "string", "description": "ISO-8601 timestamp."}}, "required": ["title"], "additionalProperties": false}'::jsonb,
        returns = '{ purchase: object }',
        updated_at = NOW()
    WHERE name = 'create_shop_item';

    UPDATE tools
    SET
        name = 'create_finance_vendor',
        description = 'Create a finance vendor.',
        parameters = '{"type": "object", "properties": {"name": {"type": "string", "description": "Vendor name."}, "website_url": {"type": "string", "description": "Optional website URL."}, "notes": {"type": "string", "description": "Optional notes."}, "default_currency": {"type": "string", "description": "Optional default currency code."}}, "required": ["name"], "additionalProperties": false}'::jsonb,
        returns = '{ vendor: object }',
        updated_at = NOW()
    WHERE name = 'create_shop_merchant';

    UPDATE tools
    SET
        name = 'delete_finance_purchase',
        description = 'Delete a purchase and its media.',
        parameters = '{"type": "object", "properties": {"purchase_id": {"type": "integer"}}, "required": ["purchase_id"], "additionalProperties": false}'::jsonb,
        returns = '{ deleted: boolean, purchase_id: number }',
        updated_at = NOW()
    WHERE name = 'delete_shop_item';

    UPDATE tools
    SET
        name = 'delete_finance_purchase_media',
        description = 'Delete one media file from a purchase.',
        parameters = '{"type": "object", "properties": {"purchase_id": {"type": "integer"}, "media_id": {"type": "string", "description": "UUID of the media object."}}, "required": ["purchase_id", "media_id"], "additionalProperties": false}'::jsonb,
        returns = '{ deleted: boolean, purchase_id: number, media_id: string, attachment_id: number }',
        updated_at = NOW()
    WHERE name = 'delete_shop_item_media';

    UPDATE tools
    SET
        name = 'delete_finance_vendor',
        description = 'Delete a vendor (purchases keep but lose vendor link).',
        parameters = '{"type": "object", "properties": {"vendor_id": {"type": "integer", "description": "Vendor id."}}, "required": ["vendor_id"], "additionalProperties": false}'::jsonb,
        returns = '{ deleted: boolean, vendor_id: number }',
        updated_at = NOW()
    WHERE name = 'delete_shop_merchant';

    UPDATE tools
    SET
        name = 'get_finance_purchase',
        description = 'Fetch one purchase with its media list.',
        parameters = '{"type": "object", "properties": {"purchase_id": {"type": "integer", "description": "Purchase id."}}, "required": ["purchase_id"], "additionalProperties": false}'::jsonb,
        returns = '{ purchase: object, media: object[] }',
        updated_at = NOW()
    WHERE name = 'get_shop_item';

    UPDATE tools
    SET
        name = 'list_finance_purchase_media',
        description = 'List media files attached to a purchase.',
        parameters = '{"type": "object", "properties": {"purchase_id": {"type": "integer"}}, "required": ["purchase_id"], "additionalProperties": false}'::jsonb,
        returns = '{ media: object[] }',
        updated_at = NOW()
    WHERE name = 'list_shop_item_media';

    UPDATE tools
    SET
        name = 'list_finance_purchases',
        description = 'List the user''s finance purchases (wishlist and orders).',
        parameters = '{"type": "object", "properties": {"status": {"type": "string", "enum": ["considering", "ordered", "in_transit", "received", "cancelled", "returned"]}, "vendor_id": {"type": "integer"}, "query": {"type": "string", "description": "Search title, notes, or vendor name."}}, "additionalProperties": false}'::jsonb,
        returns = '{ purchases: object[] }',
        updated_at = NOW()
    WHERE name = 'list_shop_items';

    UPDATE tools
    SET
        name = 'list_finance_vendors',
        description = 'List the user''s finance vendors.',
        parameters = '{"type": "object", "properties": {"query": {"type": "string", "description": "Optional filter by vendor name (case-insensitive)."}}, "additionalProperties": false}'::jsonb,
        returns = '{ vendors: object[] }',
        updated_at = NOW()
    WHERE name = 'list_shop_merchants';

    UPDATE tools
    SET
        name = 'mark_finance_purchase_ordered',
        description = 'Mark a purchase as ordered and set ordered_at.',
        parameters = '{"type": "object", "properties": {"purchase_id": {"type": "integer"}, "ordered_at": {"type": "string", "description": "ISO-8601; defaults to now."}}, "required": ["purchase_id"], "additionalProperties": false}'::jsonb,
        returns = '{ purchase: object }',
        updated_at = NOW()
    WHERE name = 'mark_shop_item_ordered';

    UPDATE tools
    SET
        name = 'mark_finance_purchase_received',
        description = 'Mark a purchase as received and set received_at.',
        parameters = '{"type": "object", "properties": {"purchase_id": {"type": "integer"}, "received_at": {"type": "string", "description": "ISO-8601; defaults to now."}}, "required": ["purchase_id"], "additionalProperties": false}'::jsonb,
        returns = '{ purchase: object }',
        updated_at = NOW()
    WHERE name = 'mark_shop_item_received';

    UPDATE tools
    SET
        name = 'propose_finance_listing',
        description = 'Propose a new purchase from listing data WITHOUT writing to the database. Use after fetch_listing when the user wants to add a product — merge user-provided fields (user values win). Include the returned proposal_card_markdown in your reply. Wait for the user to Confirm or Decline in the chat UI before calling create_finance_purchase.',
        parameters = '{"type": "object", "properties": {"title": {"type": "string"}, "status": {"type": "string", "description": "considering, ordered, in_transit, received, cancelled, returned"}, "vendor_id": {"type": "integer"}, "vendor_name": {"type": "string"}, "listing_url": {"type": "string"}, "notes": {"type": "string"}, "price_amount": {"type": "number"}, "currency": {"type": "string"}, "quantity": {"type": "integer"}, "image_url": {"type": "string", "description": "Product image URL from the listing."}}, "required": ["title"], "additionalProperties": false}'::jsonb,
        returns = '{ proposal_id, status, proposal_card, proposal_card_markdown } — user must confirm in chat before the purchase exists.',
        updated_at = NOW()
    WHERE name = 'propose_shop_listing';

    UPDATE tools
    SET
        name = 'set_finance_purchase_cover',
        description = 'Set a purchase cover from an existing image media file.',
        parameters = '{"type": "object", "properties": {"purchase_id": {"type": "integer"}, "media_id": {"type": "string", "description": "UUID of the media object."}}, "required": ["purchase_id", "media_id"], "additionalProperties": false}'::jsonb,
        returns = '{ purchase: object }',
        updated_at = NOW()
    WHERE name = 'set_shop_item_cover';

    UPDATE tools
    SET
        name = 'set_finance_purchase_cover_from_url',
        description = 'Download an image from a URL and set it as the purchase''s cover image.',
        parameters = '{"type": "object", "properties": {"purchase_id": {"type": "integer"}, "image_url": {"type": "string", "description": "Absolute http(s) URL of the product image."}}, "required": ["purchase_id", "image_url"], "additionalProperties": false}'::jsonb,
        returns = '{ purchase: object }',
        updated_at = NOW()
    WHERE name = 'set_shop_item_cover_from_url';

    UPDATE tools
    SET
        name = 'update_finance_purchase',
        description = 'Update a purchase (partial fields).',
        parameters = '{"type": "object", "properties": {"purchase_id": {"type": "integer"}, "title": {"type": "string"}, "status": {"type": "string", "enum": ["considering", "ordered", "in_transit", "received", "cancelled", "returned"]}, "vendor_id": {"type": "integer"}, "vendor_name": {"type": "string"}, "listing_url": {"type": "string"}, "notes": {"type": "string"}, "price_amount": {"type": "number"}, "currency": {"type": "string"}, "quantity": {"type": "integer"}, "ordered_at": {"type": "string"}, "received_at": {"type": "string"}}, "required": ["purchase_id"], "additionalProperties": false}'::jsonb,
        returns = '{ purchase: object }',
        updated_at = NOW()
    WHERE name = 'update_shop_item';

    UPDATE tools
    SET
        name = 'update_finance_vendor',
        description = 'Update a finance vendor.',
        parameters = '{"type": "object", "properties": {"vendor_id": {"type": "integer", "description": "Vendor id."}, "name": {"type": "string"}, "website_url": {"type": "string"}, "notes": {"type": "string"}, "default_currency": {"type": "string"}}, "required": ["vendor_id"], "additionalProperties": false}'::jsonb,
        returns = '{ vendor: object }',
        updated_at = NOW()
    WHERE name = 'update_shop_merchant';

    -- -------------------------------------------------------------------------
    -- 9. Update Haul system prompt (shop → finance/purchase/vendor terminology)
    -- -------------------------------------------------------------------------
    UPDATE system_prompts
    SET
        identity = 'You are Haul, Keel''s finance specialist.',
        purpose = 'You own the user''s Finance module: vendors, purchase/wishlist/order records, and purchase media (photos, receipts). Use your finance tools to fulfill any purchase-tracking request — list or search vendors and purchases, create/update/delete records, mark purchases ordered or received, manage covers and media, and import new purchases from product listing URLs.',
        guidelines = 'General workflow:
1. Clarify what the user wants if the request is ambiguous.
2. Use list/get tools when you need existing vendors, purchases, or media.
3. Confirm destructive actions (delete) only when the user clearly asked.
4. After mutations, summarize what changed (ids, titles, status) briefly.',
        domain_reference = 'Finance records include vendors, purchases (wishlist/order), and purchase media. User-provided field values always win over scraped data when merging listing imports.',
        tool_guidance = 'Direct creates (no listing URL):
- Use `create_finance_vendor` / `create_finance_purchase` only when the user explicitly asks to
  add a record without going through the listing import flow.

Importing from a listing URL (confirm before save):
1. Note any fields the user already provided (title, price, vendor, status, notes).
2. Call `fetch_listing` with the URL.
3. Merge scraped data with user-provided fields — **user-provided values always win**.
4. Call `propose_finance_listing` with the merged fields (include image_url when known).
   Do **not** call `create_finance_vendor` or `create_finance_purchase` for a new listing import.
5. Paste the tool''s `proposal_card_markdown` into your reply so the user sees a
   ```keel:proposal``` card with Confirm / Decline buttons.
6. Wait for the user to confirm in chat. Only after they confirm is the purchase (and
   any new vendor) written to the database.
7. If the listing is blocked or missing critical fields, still propose a best-effort
   preview with whatever you have and explain what the user may need to edit after confirm.
8. For read-only lookups (list/get), use ```keel:record``` cards to display rows.',
        updated_at = NOW()
    WHERE key = 'haul';

END;
$migration$;

-- -------------------------------------------------------------------------
-- 9. Allow subscription (obligation) media attachments (runs on re-apply too)
-- -------------------------------------------------------------------------
ALTER TABLE media_attachments
    DROP CONSTRAINT IF EXISTS media_attachments_entity_type_valid;

ALTER TABLE media_attachments
    ADD CONSTRAINT media_attachments_entity_type_valid CHECK (
        entity_type IN (
            'project',
            'finance_purchase',
            'finance_obligation',
            'contact',
            'finance_vendor',
            'timeline_event',
            'journal_entry'
        )
    );

COMMIT;
