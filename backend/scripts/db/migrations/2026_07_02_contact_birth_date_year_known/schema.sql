-- Contacts: allow birth dates with unknown year (month + day only).

ALTER TABLE contacts
    ADD COLUMN birth_date_year_known BOOLEAN NOT NULL DEFAULT TRUE;
