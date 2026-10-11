-- Idempotent migration: rename tool categories agenda->focus, contacts->people
-- and seed new People-module CRUD tools for existing deployments.

UPDATE tool_categories
SET key = 'focus',
    display_name = 'Focus',
    description = 'Focus list and item management tools.',
    updated_at = NOW()
WHERE key = 'agenda';

UPDATE tool_categories
SET key = 'people',
    display_name = 'People',
    description = 'People registry, relationships, and figures.',
    updated_at = NOW()
WHERE key = 'contacts';

UPDATE catalog_media
SET storage_key = replace(storage_key, 'tool_categories/agenda/', 'tool_categories/focus/'),
    updated_at = NOW()
WHERE storage_key LIKE 'tool_categories/agenda/%';

UPDATE catalog_media
SET storage_key = replace(storage_key, 'tool_categories/contacts/', 'tool_categories/people/'),
    updated_at = NOW()
WHERE storage_key LIKE 'tool_categories/contacts/%';

UPDATE catalog_media
SET storage_key = 'tool_categories/coak/image.png',
    updated_at = NOW()
WHERE storage_key = 'tool_categories/coak/node.png';

UPDATE system_prompts
SET domain_reference = replace(domain_reference, 'focus, contacts,', 'focus, people,'),
    tool_guidance = replace(
        tool_guidance,
        E'Agenda (Focus):\n- Use `list_focus_lists` / `get_focus_list` / `create_focus_entry` for tasks and lists.\n\nContacts:\n- Use contact list/search/get tools for people lookups.',
        E'Focus:\n- Use `list_focus_lists` / `get_focus_list` / `create_focus_entry` for tasks and lists.\n\nPeople:\n- Use contact tools for personal CRM: list/search/get, create/update/delete contacts.\n- Use contact tag and relationship tools to organize and link contacts.\n- Use family group tools to inspect computed genealogical groups and trees.\n- Use figure tools for notable/public people records (separate from personal contacts).'
    ),
    updated_at = NOW()
WHERE key = 'keel';

INSERT INTO tools (name, category_id, description, parameters, returns, examples, is_enabled)
SELECT 'create_contact', c.id, 'Create a new contact in the personal CRM.', '{"type": "object", "properties": {"first_name": {"type": "string"}, "last_name": {"type": "string"}, "gender": {"type": "string", "enum": ["male", "female"]}, "birth_date": {"type": "string", "description": "ISO date YYYY-MM-DD."}, "birth_date_year_known": {"type": "boolean"}, "death_date": {"type": "string", "description": "ISO date YYYY-MM-DD."}, "notes": {"type": "string"}, "status": {"type": "string", "enum": ["active", "archived"]}, "tag_ids": {"type": "array", "items": {"type": "integer"}, "description": "Optional tag ids to assign."}}, "additionalProperties": false}'::jsonb, '{ contact: object }', '[]'::jsonb, TRUE FROM tool_categories c WHERE c.key = 'people'
UNION ALL
SELECT 'update_contact', c.id, 'Update a contact profile or tag assignments.', '{"type": "object", "properties": {"contact_id": {"type": "integer"}, "first_name": {"type": "string"}, "last_name": {"type": "string"}, "gender": {"type": "string", "enum": ["male", "female"]}, "birth_date": {"type": "string"}, "birth_date_year_known": {"type": "boolean"}, "death_date": {"type": "string"}, "notes": {"type": "string"}, "status": {"type": "string", "enum": ["active", "archived"]}, "tag_ids": {"type": "array", "items": {"type": "integer"}, "description": "Replace all tag assignments when provided."}}, "required": ["contact_id"], "additionalProperties": false}'::jsonb, '{ contact: object }', '[]'::jsonb, TRUE FROM tool_categories c WHERE c.key = 'people'
UNION ALL
SELECT 'delete_contact', c.id, 'Delete a contact and move it to trash. Cannot delete the self contact.', '{"type": "object", "properties": {"contact_id": {"type": "integer"}}, "required": ["contact_id"], "additionalProperties": false}'::jsonb, '{ deleted: boolean, contact_id: integer }', '[]'::jsonb, TRUE FROM tool_categories c WHERE c.key = 'people'
UNION ALL
SELECT 'list_contact_tags', c.id, 'List the user''s contact tags.', '{"type": "object", "properties": {}, "additionalProperties": false}'::jsonb, '{ tags: array, count: integer }', '[]'::jsonb, TRUE FROM tool_categories c WHERE c.key = 'people'
UNION ALL
SELECT 'create_contact_tag', c.id, 'Create a tag for categorizing contacts.', '{"type": "object", "properties": {"name": {"type": "string"}, "color_hex": {"type": "string", "description": "Hex color like #06B6D4."}}, "required": ["name"], "additionalProperties": false}'::jsonb, '{ tag: object }', '[]'::jsonb, TRUE FROM tool_categories c WHERE c.key = 'people'
UNION ALL
SELECT 'update_contact_tag', c.id, 'Update a contact tag name or color.', '{"type": "object", "properties": {"tag_id": {"type": "integer"}, "name": {"type": "string"}, "color_hex": {"type": "string"}}, "required": ["tag_id"], "additionalProperties": false}'::jsonb, '{ tag: object }', '[]'::jsonb, TRUE FROM tool_categories c WHERE c.key = 'people'
UNION ALL
SELECT 'delete_contact_tag', c.id, 'Delete a contact tag.', '{"type": "object", "properties": {"tag_id": {"type": "integer"}}, "required": ["tag_id"], "additionalProperties": false}'::jsonb, '{ deleted: boolean, tag_id: integer }', '[]'::jsonb, TRUE FROM tool_categories c WHERE c.key = 'people'
UNION ALL
SELECT 'list_relationships', c.id, 'List all contact relationships for the user.', '{"type": "object", "properties": {}, "additionalProperties": false}'::jsonb, '{ relationships: array, count: integer }', '[]'::jsonb, TRUE FROM tool_categories c WHERE c.key = 'people'
UNION ALL
SELECT 'create_contact_relationship', c.id, 'Create a directed relationship between two contacts.', '{"type": "object", "properties": {"from_contact_id": {"type": "integer"}, "to_contact_id": {"type": "integer"}, "relationship_type": {"type": "string", "enum": ["spouse", "parent", "sibling", "friend"]}}, "required": ["from_contact_id", "to_contact_id", "relationship_type"], "additionalProperties": false}'::jsonb, '{ relationship: object }', '[]'::jsonb, TRUE FROM tool_categories c WHERE c.key = 'people'
UNION ALL
SELECT 'update_contact_relationship', c.id, 'Update a contact relationship endpoints or type.', '{"type": "object", "properties": {"relationship_id": {"type": "integer"}, "from_contact_id": {"type": "integer"}, "to_contact_id": {"type": "integer"}, "relationship_type": {"type": "string", "enum": ["spouse", "parent", "sibling", "friend"]}}, "required": ["relationship_id", "from_contact_id", "to_contact_id", "relationship_type"], "additionalProperties": false}'::jsonb, '{ relationship: object }', '[]'::jsonb, TRUE FROM tool_categories c WHERE c.key = 'people'
UNION ALL
SELECT 'delete_contact_relationship', c.id, 'Delete a contact relationship.', '{"type": "object", "properties": {"relationship_id": {"type": "integer"}}, "required": ["relationship_id"], "additionalProperties": false}'::jsonb, '{ deleted: boolean, relationship_id: integer }', '[]'::jsonb, TRUE FROM tool_categories c WHERE c.key = 'people'
UNION ALL
SELECT 'list_family_groups', c.id, 'List computed nuclear family groups derived from contact relationships.', '{"type": "object", "properties": {}, "additionalProperties": false}'::jsonb, '{ family_groups: array, count: integer }', '[]'::jsonb, TRUE FROM tool_categories c WHERE c.key = 'people'
UNION ALL
SELECT 'get_family_group', c.id, 'Get one computed family group by family_key.', '{"type": "object", "properties": {"family_key": {"type": "string", "description": "Stable family group identifier."}}, "required": ["family_key"], "additionalProperties": false}'::jsonb, '{ family_group: object }', '[]'::jsonb, TRUE FROM tool_categories c WHERE c.key = 'people'
UNION ALL
SELECT 'get_family_group_tree', c.id, 'Get the family tree subgraph for one family group.', '{"type": "object", "properties": {"family_key": {"type": "string", "description": "Stable family group identifier."}}, "required": ["family_key"], "additionalProperties": false}'::jsonb, '{ family_tree: object }', '[]'::jsonb, TRUE FROM tool_categories c WHERE c.key = 'people'
UNION ALL
SELECT 'list_figures', c.id, 'List all notable/public figures.', '{"type": "object", "properties": {}, "additionalProperties": false}'::jsonb, '{ figures: array, count: integer }', '[]'::jsonb, TRUE FROM tool_categories c WHERE c.key = 'people'
UNION ALL
SELECT 'get_figure', c.id, 'Get one figure by id.', '{"type": "object", "properties": {"figure_id": {"type": "integer", "description": "Figure id."}}, "required": ["figure_id"], "additionalProperties": false}'::jsonb, '{ figure: object }', '[]'::jsonb, TRUE FROM tool_categories c WHERE c.key = 'people'
UNION ALL
SELECT 'create_figure', c.id, 'Create a new notable/public figure record.', '{"type": "object", "properties": {"first_name": {"type": "string"}, "last_name": {"type": "string"}, "gender": {"type": "string", "enum": ["male", "female"]}, "birth_date": {"type": "string", "description": "ISO date YYYY-MM-DD."}, "birth_date_year_known": {"type": "boolean"}, "death_date": {"type": "string", "description": "ISO date YYYY-MM-DD."}, "notes": {"type": "string"}, "status": {"type": "string", "enum": ["active", "archived"]}}, "additionalProperties": false}'::jsonb, '{ figure: object }', '[]'::jsonb, TRUE FROM tool_categories c WHERE c.key = 'people'
UNION ALL
SELECT 'update_figure', c.id, 'Update a figure profile fields.', '{"type": "object", "properties": {"figure_id": {"type": "integer"}, "first_name": {"type": "string"}, "last_name": {"type": "string"}, "gender": {"type": "string", "enum": ["male", "female"]}, "birth_date": {"type": "string"}, "birth_date_year_known": {"type": "boolean"}, "death_date": {"type": "string"}, "notes": {"type": "string"}, "status": {"type": "string", "enum": ["active", "archived"]}}, "required": ["figure_id"], "additionalProperties": false}'::jsonb, '{ figure: object }', '[]'::jsonb, TRUE FROM tool_categories c WHERE c.key = 'people'
UNION ALL
SELECT 'delete_figure', c.id, 'Delete a figure and move it to trash.', '{"type": "object", "properties": {"figure_id": {"type": "integer"}}, "required": ["figure_id"], "additionalProperties": false}'::jsonb, '{ deleted: boolean, figure_id: integer }', '[]'::jsonb, TRUE FROM tool_categories c WHERE c.key = 'people'
ON CONFLICT (name) DO NOTHING;
