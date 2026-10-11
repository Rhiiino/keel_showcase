-- Multiple workspace canvases per project (drop 1:1 project_id constraint).

ALTER TABLE project_canvas
    ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'Main';

ALTER TABLE project_canvas
    ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

ALTER TABLE project_canvas
    ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT false;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'project_canvas_name_nonempty'
    ) THEN
        ALTER TABLE project_canvas
            ADD CONSTRAINT project_canvas_name_nonempty
            CHECK (char_length(trim(name)) > 0);
    END IF;
END $$;

-- Backfill existing rows before adding default uniqueness.
UPDATE project_canvas
SET
    name = 'Main',
    sort_order = 0,
    is_default = true
WHERE is_default = false
  AND NOT EXISTS (
      SELECT 1
      FROM project_canvas AS other
      WHERE other.project_id = project_canvas.project_id
        AND other.id <> project_canvas.id
  );

-- Drop the 1:1 project constraint (constraint name from init schema).
ALTER TABLE project_canvas
    DROP CONSTRAINT IF EXISTS project_canvas_project_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_project_canvas_one_default_per_project
    ON project_canvas (project_id)
    WHERE is_default = true;
