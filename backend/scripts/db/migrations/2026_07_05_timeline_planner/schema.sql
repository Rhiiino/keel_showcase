-- Timeline planner: plans, plan items, shared tag assignments.

-- ----- timeline_plans
CREATE TABLE timeline_plans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT timeline_plans_title_nonempty CHECK (char_length(trim(title)) > 0),
    CONSTRAINT timeline_plans_end_on_or_after_start CHECK (end_date >= start_date)
);

CREATE UNIQUE INDEX idx_timeline_plans_id_user ON timeline_plans (id, user_id);

CREATE INDEX idx_timeline_plans_user_start_date
    ON timeline_plans (user_id, start_date DESC);

-- ----- timeline_plan_items
CREATE TABLE timeline_plan_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    plan_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ,
    all_day BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'planned',
    timeline_event_id INTEGER REFERENCES timeline_events (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT timeline_plan_items_plan_user_fkey
        FOREIGN KEY (plan_id, user_id)
        REFERENCES timeline_plans (id, user_id)
        ON DELETE CASCADE,
    CONSTRAINT timeline_plan_items_title_nonempty CHECK (char_length(trim(title)) > 0),
    CONSTRAINT timeline_plan_items_status_valid CHECK (status IN ('planned', 'done', 'skipped')),
    CONSTRAINT timeline_plan_items_end_on_or_after_start
        CHECK (end_at IS NULL OR end_at >= start_at)
);

CREATE INDEX idx_timeline_plan_items_user_plan_start
    ON timeline_plan_items (user_id, plan_id, start_at, sort_order);

CREATE INDEX idx_timeline_plan_items_timeline_event
    ON timeline_plan_items (timeline_event_id)
    WHERE timeline_event_id IS NOT NULL;

-- ----- Repurpose event-only tag assignments → shared timeline tag assignments
ALTER TABLE timeline_event_tag_assignments
    RENAME TO timeline_tag_assignments;

ALTER TABLE timeline_tag_assignments
    ADD COLUMN timeline_plan_item_id INTEGER
    REFERENCES timeline_plan_items (id) ON DELETE CASCADE;

ALTER TABLE timeline_tag_assignments
    DROP CONSTRAINT timeline_event_tag_assignments_pkey;

ALTER TABLE timeline_tag_assignments
    ALTER COLUMN timeline_event_id DROP NOT NULL;

ALTER TABLE timeline_tag_assignments
    ADD CONSTRAINT timeline_tag_assignments_one_entity CHECK (
        (timeline_event_id IS NOT NULL AND timeline_plan_item_id IS NULL)
        OR (timeline_event_id IS NULL AND timeline_plan_item_id IS NOT NULL)
    );

CREATE UNIQUE INDEX idx_timeline_tag_assignments_event_tag
    ON timeline_tag_assignments (timeline_event_id, tag_id)
    WHERE timeline_event_id IS NOT NULL;

CREATE UNIQUE INDEX idx_timeline_tag_assignments_plan_item_tag
    ON timeline_tag_assignments (timeline_plan_item_id, tag_id)
    WHERE timeline_plan_item_id IS NOT NULL;

ALTER INDEX idx_timeline_event_tag_assignments_tag_id
    RENAME TO idx_timeline_tag_assignments_tag_id;
