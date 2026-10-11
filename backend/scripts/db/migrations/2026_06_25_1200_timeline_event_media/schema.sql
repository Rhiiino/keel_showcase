-- Allow timeline events in unified media_attachments.

ALTER TABLE media_attachments DROP CONSTRAINT media_attachments_entity_type_valid;

ALTER TABLE media_attachments ADD CONSTRAINT media_attachments_entity_type_valid
    CHECK (entity_type IN (
        'project',
        'shop_item',
        'contact',
        'shop_merchant',
        'timeline_event'
    ));
