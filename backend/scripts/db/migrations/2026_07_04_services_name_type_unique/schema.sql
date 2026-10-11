-- Services: uniqueness is per user, name, and type (not name alone).

ALTER TABLE services
    DROP CONSTRAINT IF EXISTS services_user_name_unique;

ALTER TABLE services
    ADD CONSTRAINT services_user_name_type_unique UNIQUE (user_id, service_name, service_type);
