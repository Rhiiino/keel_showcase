# Changelog

All notable changes to Keel Showcase are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [2026-07-09] - 2026-07-09

### Added

- (backend) Extended showcase demo seed script — populates chat, focus, projects, finance (vendors, accounts, subscriptions, transactions), contacts/family tree, figures, timeline, journal, services, and C.O.A.K. with idempotent fictional data for `showcase@keel.demo`.

### Fixed

- (backend) Demo focus record seeding — `reference_target_id` is stored as text to match the schema.

### Changed

- (backend) Refactored `backend/scripts/db/demo/` into a modular seed package (`context.py`, `seeds/*.py`) while keeping the same CLI entrypoint.
- (docs) `docs/STARTUP.md` — documented dry-run and full seed commands for hetzone deployment.
