-- Services: add service_type (frontend/backend) and optional description.

ALTER TABLE services
    ADD COLUMN service_type TEXT NOT NULL DEFAULT 'frontend',
    ADD COLUMN description TEXT;

ALTER TABLE services
    ADD CONSTRAINT services_service_type_valid CHECK (
        service_type IN ('frontend', 'backend')
    );
