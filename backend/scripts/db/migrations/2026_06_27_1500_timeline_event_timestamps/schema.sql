-- Timeline event start/end columns: DATE -> TIMESTAMPTZ (midnight UTC for existing rows).

ALTER TABLE timeline_events
    DROP CONSTRAINT timeline_events_end_on_or_after_start;

ALTER TABLE timeline_events
    ALTER COLUMN start_date TYPE TIMESTAMPTZ
        USING ((start_date::timestamp AT TIME ZONE 'UTC')),
    ALTER COLUMN end_date TYPE TIMESTAMPTZ
        USING (
            CASE
                WHEN end_date IS NULL THEN NULL
                ELSE (end_date::timestamp AT TIME ZONE 'UTC')
            END
        );

ALTER TABLE timeline_events
    ADD CONSTRAINT timeline_events_end_on_or_after_start
        CHECK (end_date IS NULL OR end_date >= start_date);
