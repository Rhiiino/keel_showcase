-- Finance purchases → transactions rename; add kind + obligation_id.

BEGIN;

DO $migration$
BEGIN
    -- -------------------------------------------------------------------------
    -- 1. Rename tables
    -- -------------------------------------------------------------------------
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'finance_purchases'
    ) THEN
        ALTER TABLE finance_purchases RENAME TO finance_transactions;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'finance_purchase_tags'
    ) THEN
        ALTER TABLE finance_purchase_tags RENAME TO finance_transaction_tags;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'finance_purchase_tag_assignments'
    ) THEN
        ALTER TABLE finance_purchase_tag_assignments RENAME TO finance_transaction_tag_assignments;
    END IF;

    -- -------------------------------------------------------------------------
    -- 2. Rename columns
    -- -------------------------------------------------------------------------
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'finance_transaction_tag_assignments'
          AND column_name = 'purchase_id'
    ) THEN
        ALTER TABLE finance_transaction_tag_assignments
            RENAME COLUMN purchase_id TO transaction_id;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'finance_listing_proposals'
          AND column_name = 'created_purchase_id'
    ) THEN
        ALTER TABLE finance_listing_proposals
            RENAME COLUMN created_purchase_id TO created_transaction_id;
    END IF;

    -- -------------------------------------------------------------------------
    -- 3. Rename indexes
    -- -------------------------------------------------------------------------
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_finance_purchases_user_id') THEN
        ALTER INDEX idx_finance_purchases_user_id RENAME TO idx_finance_transactions_user_id;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_finance_purchases_user_updated_at') THEN
        ALTER INDEX idx_finance_purchases_user_updated_at RENAME TO idx_finance_transactions_user_updated_at;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_finance_purchases_user_status_sort') THEN
        ALTER INDEX idx_finance_purchases_user_status_sort RENAME TO idx_finance_transactions_user_status_sort;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_finance_purchases_vendor_id') THEN
        ALTER INDEX idx_finance_purchases_vendor_id RENAME TO idx_finance_transactions_vendor_id;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_finance_purchase_tags_user_id') THEN
        ALTER INDEX idx_finance_purchase_tags_user_id RENAME TO idx_finance_transaction_tags_user_id;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_finance_purchase_tag_assignments_tag_id') THEN
        ALTER INDEX idx_finance_purchase_tag_assignments_tag_id
            RENAME TO idx_finance_transaction_tag_assignments_tag_id;
    END IF;

    -- -------------------------------------------------------------------------
    -- 4. Rename constraints on finance_transactions
    -- -------------------------------------------------------------------------
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'finance_purchases_pkey'
    ) THEN
        ALTER TABLE finance_transactions
            RENAME CONSTRAINT finance_purchases_pkey TO finance_transactions_pkey;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'finance_purchases_user_id_fkey') THEN
        ALTER TABLE finance_transactions
            RENAME CONSTRAINT finance_purchases_user_id_fkey TO finance_transactions_user_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'finance_purchases_vendor_id_fkey') THEN
        ALTER TABLE finance_transactions
            RENAME CONSTRAINT finance_purchases_vendor_id_fkey TO finance_transactions_vendor_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'finance_purchases_title_nonempty') THEN
        ALTER TABLE finance_transactions
            RENAME CONSTRAINT finance_purchases_title_nonempty TO finance_transactions_title_nonempty;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'finance_purchases_status_valid') THEN
        ALTER TABLE finance_transactions
            RENAME CONSTRAINT finance_purchases_status_valid TO finance_transactions_status_valid;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'finance_purchases_quantity_positive') THEN
        ALTER TABLE finance_transactions
            RENAME CONSTRAINT finance_purchases_quantity_positive TO finance_transactions_quantity_positive;
    END IF;

    -- Tag table constraints
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'finance_purchase_tags_pkey') THEN
        ALTER TABLE finance_transaction_tags
            RENAME CONSTRAINT finance_purchase_tags_pkey TO finance_transaction_tags_pkey;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'finance_purchase_tags_user_id_fkey') THEN
        ALTER TABLE finance_transaction_tags
            RENAME CONSTRAINT finance_purchase_tags_user_id_fkey TO finance_transaction_tags_user_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'finance_purchase_tags_name_nonempty') THEN
        ALTER TABLE finance_transaction_tags
            RENAME CONSTRAINT finance_purchase_tags_name_nonempty TO finance_transaction_tags_name_nonempty;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'finance_purchase_tags_color_hex_valid') THEN
        ALTER TABLE finance_transaction_tags
            RENAME CONSTRAINT finance_purchase_tags_color_hex_valid TO finance_transaction_tags_color_hex_valid;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'finance_purchase_tags_user_name_unique') THEN
        ALTER TABLE finance_transaction_tags
            RENAME CONSTRAINT finance_purchase_tags_user_name_unique TO finance_transaction_tags_user_name_unique;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'finance_purchase_tag_assignments_pkey') THEN
        ALTER TABLE finance_transaction_tag_assignments
            RENAME CONSTRAINT finance_purchase_tag_assignments_pkey TO finance_transaction_tag_assignments_pkey;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'finance_purchase_tag_assignments_purchase_id_fkey') THEN
        ALTER TABLE finance_transaction_tag_assignments
            RENAME CONSTRAINT finance_purchase_tag_assignments_purchase_id_fkey
            TO finance_transaction_tag_assignments_transaction_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'finance_purchase_tag_assignments_tag_id_fkey') THEN
        ALTER TABLE finance_transaction_tag_assignments
            RENAME CONSTRAINT finance_purchase_tag_assignments_tag_id_fkey
            TO finance_transaction_tag_assignments_tag_id_fkey;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'finance_listing_proposals_created_purchase_id_fkey') THEN
        ALTER TABLE finance_listing_proposals
            RENAME CONSTRAINT finance_listing_proposals_created_purchase_id_fkey
            TO finance_listing_proposals_created_transaction_id_fkey;
    END IF;

    -- -------------------------------------------------------------------------
    -- 5. Add kind + obligation_id columns
    -- -------------------------------------------------------------------------
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'finance_transactions'
          AND column_name = 'kind'
    ) THEN
        ALTER TABLE finance_transactions
            ADD COLUMN kind TEXT NOT NULL DEFAULT 'physical';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'finance_transactions'
          AND column_name = 'obligation_id'
    ) THEN
        ALTER TABLE finance_transactions
            ADD COLUMN obligation_id INTEGER REFERENCES finance_obligations (id) ON DELETE SET NULL;
    END IF;

    ALTER TABLE finance_transactions DROP CONSTRAINT IF EXISTS finance_transactions_kind_valid;
    ALTER TABLE finance_transactions
        ADD CONSTRAINT finance_transactions_kind_valid CHECK (
            kind IN ('physical', 'expense', 'subscription', 'service')
        );

    CREATE INDEX IF NOT EXISTS idx_finance_transactions_user_kind
        ON finance_transactions (user_id, kind);

    CREATE INDEX IF NOT EXISTS idx_finance_transactions_obligation_id
        ON finance_transactions (obligation_id)
        WHERE obligation_id IS NOT NULL;

    -- -------------------------------------------------------------------------
    -- 6. Entity-type string migrations
    -- -------------------------------------------------------------------------
    ALTER TABLE media_attachments
        DROP CONSTRAINT IF EXISTS media_attachments_entity_type_valid;

    UPDATE media_attachments
    SET entity_type = 'finance_transaction'
    WHERE entity_type = 'finance_purchase';

    UPDATE deleted_records
    SET entity_type = 'finance_transaction'
    WHERE entity_type = 'finance_purchase';

    UPDATE deleted_records
    SET entity_type = 'finance_transaction_tag'
    WHERE entity_type = 'finance_purchase_tag';

    UPDATE focus_nodes
    SET reference_target_type = 'finance_transaction'
    WHERE reference_target_type = 'finance_purchase';

    ALTER TABLE media_attachments
        ADD CONSTRAINT media_attachments_entity_type_valid CHECK (
            entity_type IN (
                'project',
                'finance_transaction',
                'finance_obligation',
                'contact',
                'finance_vendor',
                'timeline_event',
                'journal_entry'
            )
        );

    -- -------------------------------------------------------------------------
    -- 7. HAUL tool catalog renames (purchase → transaction)
    -- -------------------------------------------------------------------------
    UPDATE tools SET name = 'clear_finance_transaction_cover', updated_at = NOW()
    WHERE name = 'clear_finance_purchase_cover';

    UPDATE tools SET name = 'create_finance_transaction', updated_at = NOW()
    WHERE name = 'create_finance_purchase';

    UPDATE tools SET name = 'delete_finance_transaction', updated_at = NOW()
    WHERE name = 'delete_finance_purchase';

    UPDATE tools SET name = 'delete_finance_transaction_media', updated_at = NOW()
    WHERE name = 'delete_finance_purchase_media';

    UPDATE tools SET name = 'get_finance_transaction', updated_at = NOW()
    WHERE name = 'get_finance_purchase';

    UPDATE tools SET name = 'list_finance_transaction_media', updated_at = NOW()
    WHERE name = 'list_finance_purchase_media';

    UPDATE tools SET name = 'list_finance_transactions', updated_at = NOW()
    WHERE name = 'list_finance_purchases';

    UPDATE tools SET name = 'mark_finance_transaction_ordered', updated_at = NOW()
    WHERE name = 'mark_finance_purchase_ordered';

    UPDATE tools SET name = 'mark_finance_transaction_received', updated_at = NOW()
    WHERE name = 'mark_finance_purchase_received';

    UPDATE tools SET name = 'set_finance_transaction_cover', updated_at = NOW()
    WHERE name = 'set_finance_purchase_cover';

    UPDATE tools SET name = 'set_finance_transaction_cover_from_url', updated_at = NOW()
    WHERE name = 'set_finance_purchase_cover_from_url';

    UPDATE tools SET name = 'update_finance_transaction', updated_at = NOW()
    WHERE name = 'update_finance_purchase';

END;
$migration$;

COMMIT;
