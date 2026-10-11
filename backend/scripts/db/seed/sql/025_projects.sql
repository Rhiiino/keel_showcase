-- keel_api/scripts/db/seed/sql/025_projects.sql
-- Production key-data seed (__TARGET_USER_ID__ replaced at runtime).
-- Baysic projects, tags, and tag assignments for the target user.
-- Media bytes are uploaded via prod_seed_key_data.py into Garage.

INSERT INTO project_tags (id, user_id, name, color_hex)
VALUES
    (1, __TARGET_USER_ID__, 'Software', '#06B6D4'),
    (2, __TARGET_USER_ID__, 'Hardware', '#44B607'),
    (3, __TARGET_USER_ID__, 'Business', '#B26034');

INSERT INTO projects (
    id,
    user_id,
    title,
    description,
    status,
    cover_model_brightness,
    cover_image_scale,
    cover_image_position_x,
    cover_image_position_y,
    kanban_card_color_hex,
    title_font_key
)
VALUES
    (
        2,
        __TARGET_USER_ID__,
        'Rhino Solutions',
        '',
        'active',
        1.0,
        0.9,
        50.067387,
        50.10108,
        '#A3A3A3',
        'handwritten'
    ),
    (
        3,
        __TARGET_USER_ID__,
        'Keel',
        '',
        'active',
        1.0,
        0.7,
        50.0,
        50.0,
        '#558C4A',
        'condensed'
    );

INSERT INTO project_tag_assignments (project_id, tag_id)
VALUES
    (2, 3),
    (3, 1);

SELECT pg_catalog.setval('public.project_tags_id_seq', 3, true);
SELECT pg_catalog.setval('public.projects_id_seq', 3, true);
