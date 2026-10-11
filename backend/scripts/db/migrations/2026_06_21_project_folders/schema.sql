-- Project-scoped folders for organizing gallery attachments within a project.

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
    ADD COLUMN project_folder_id UUID;

ALTER TABLE media_attachments
    ADD CONSTRAINT media_attachments_project_folder_fk
    FOREIGN KEY (project_folder_id)
    REFERENCES project_folders (id)
    ON DELETE SET NULL;

CREATE INDEX idx_media_attachments_project_folder
    ON media_attachments (entity_type, entity_id, project_folder_id, sort_order, id)
    WHERE entity_type = 'project' AND role = 'gallery';
