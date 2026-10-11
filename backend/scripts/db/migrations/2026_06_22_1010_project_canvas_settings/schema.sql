-- Per-project workspace canvas UI settings (canvas color, snap, config panel).

ALTER TABLE project_canvas
    ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'project_canvas_settings_object'
    ) THEN
        ALTER TABLE project_canvas
            ADD CONSTRAINT project_canvas_settings_object
            CHECK (jsonb_typeof(settings) = 'object');
    END IF;
END $$;
