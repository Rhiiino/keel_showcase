-- Move per-record Coak workspace data from user_preferences onto coak_records.

ALTER TABLE coak_records
    ADD COLUMN workspace_state JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN workspace_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN configuration_settings JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE coak_records
    ADD CONSTRAINT coak_records_workspace_state_object
        CHECK (jsonb_typeof(workspace_state) = 'object'),
    ADD CONSTRAINT coak_records_workspace_settings_object
        CHECK (jsonb_typeof(workspace_settings) = 'object'),
    ADD CONSTRAINT coak_records_configuration_settings_object
        CHECK (jsonb_typeof(configuration_settings) = 'object');

UPDATE coak_records cr
SET
    workspace_state = COALESCE(
        up.data #> ARRAY['coak', 'workspaces', cr.id::text],
        '{}'::jsonb
    ),
    workspace_settings = COALESCE(
        up.data #> ARRAY['coak', 'workspace_settings', cr.id::text],
        '{}'::jsonb
    ),
    configuration_settings = COALESCE(
        up.data #> ARRAY['coak', 'configuration_settings', cr.id::text, 'settings'],
        '{}'::jsonb
    )
FROM user_preferences up
WHERE up.user_id = cr.user_id
  AND up.data ? 'coak';

UPDATE user_preferences
SET
    data = data - 'coak',
    updated_at = NOW()
WHERE data ? 'coak';
