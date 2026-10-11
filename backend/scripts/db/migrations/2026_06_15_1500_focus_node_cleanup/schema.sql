-- Focus node cleanup: drop stacks, priority, description; rename card_color_hex.

UPDATE focus_nodes
SET notes = description
WHERE trim(notes) = ''
  AND trim(description) <> '';

ALTER TABLE focus_nodes
DROP CONSTRAINT IF EXISTS focus_nodes_stack_position_valid;

ALTER TABLE focus_nodes
DROP CONSTRAINT IF EXISTS focus_nodes_stack_membership_consistent;

ALTER TABLE focus_nodes
DROP CONSTRAINT IF EXISTS focus_nodes_priority_valid;

DROP INDEX IF EXISTS idx_focus_nodes_stack_position;

ALTER TABLE focus_nodes
DROP COLUMN IF EXISTS description,
DROP COLUMN IF EXISTS priority,
DROP COLUMN IF EXISTS stack_id,
DROP COLUMN IF EXISTS stack_position;

ALTER TABLE focus_nodes
RENAME COLUMN card_color_hex TO node_color_hex;

ALTER TABLE focus_nodes
DROP CONSTRAINT IF EXISTS focus_nodes_card_color_hex_valid;

ALTER TABLE focus_nodes
ADD CONSTRAINT focus_nodes_node_color_hex_valid CHECK (
    node_color_hex IS NULL OR node_color_hex ~ '^#[0-9A-Fa-f]{6}$'
);

DROP TABLE IF EXISTS focus_list_stacks;
