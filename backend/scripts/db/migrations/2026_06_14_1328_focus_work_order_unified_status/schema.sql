-- Add cross-kind work order and consolidate list_status into status.

ALTER TABLE focus_nodes
ADD COLUMN IF NOT EXISTS work_order INTEGER NULL;

UPDATE focus_nodes
SET status = list_status
WHERE kind IN ('list', 'record')
  AND status IS NULL;

UPDATE focus_nodes
SET status = 'active'
WHERE status IS NULL;

ALTER TABLE focus_nodes
DROP CONSTRAINT IF EXISTS focus_nodes_list_status_valid;

ALTER TABLE focus_nodes
DROP CONSTRAINT IF EXISTS focus_nodes_item_status_valid;

ALTER TABLE focus_nodes
DROP COLUMN IF EXISTS list_status;

ALTER TABLE focus_nodes
ALTER COLUMN status SET DEFAULT 'active';

ALTER TABLE focus_nodes
ALTER COLUMN status SET NOT NULL;

ALTER TABLE focus_nodes
ADD CONSTRAINT focus_nodes_status_valid CHECK (
    status IN ('active', 'paused', 'completed', 'archived', 'limbo')
);

UPDATE focus_nodes
SET status = 'limbo'
WHERE status IS DISTINCT FROM 'limbo';

ALTER TABLE focus_nodes
ADD CONSTRAINT focus_nodes_work_order_valid CHECK (
    work_order IS NULL OR work_order >= 0
);

DROP INDEX IF EXISTS idx_focus_nodes_user_list_status;

CREATE INDEX IF NOT EXISTS idx_focus_nodes_user_status
    ON focus_nodes (user_id, status, updated_at DESC);
