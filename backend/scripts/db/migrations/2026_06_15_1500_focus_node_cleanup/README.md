# Focus node cleanup (2026-06-15)

Removes hub list stacks, `priority`, and `description` from `focus_nodes`; migrates non-empty descriptions into `notes`; renames `card_color_hex` to `node_color_hex`.

## Run

Apply `schema.sql` against production before or with the matching API deploy.

## Verify

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'focus_nodes'
  AND column_name IN ('description', 'priority', 'stack_id', 'stack_position', 'card_color_hex', 'node_color_hex');

-- Expect node_color_hex only from that set; focus_list_stacks should be absent.
```
