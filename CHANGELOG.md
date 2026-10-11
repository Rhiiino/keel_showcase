# Changelog

All notable changes to Keel Showcase are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- (backend) People tool category — full CRUD native tools for contacts (including tags, relationships, family groups) and figures under the renamed `people` catalog category.
- (backend) Catalog migration — `catalog_category_rename.sql` renames `agenda`→`focus` and `contacts`→`people` on existing deployments.

### Changed

- (backend) Tool catalog categories — `agenda` renamed to `focus`; `contacts` renamed to `people` (display labels and Keel system prompt updated).
- (frontend) Tool category display — `focus` and `people` labels in chat tools UI.

- (backend) People demo figures — seed Richard Feynman, Albert Einstein, Andrej Karpathy, Yann LeCun, Donald Trump, and Socrates with gender and life dates for `showcase@keel.demo`.
- (backend) Catalog agent assets — restore Recall, Baysic, Haul, and Forage sub-agent `image.png` / `model.glb` files; add `catalog_media` rows for Recall, Baysic, and Haul (and Keel if missing).

## [2026-07-09] - 2026-07-09

### Added

- (backend) Extended showcase demo seed script — populates chat, focus, projects, finance (vendors, accounts, subscriptions, transactions), contacts/family tree, figures, timeline, journal, services, and C.O.A.K. with idempotent fictional data for `showcase@keel.demo`.
- (backend) Restored `backend/scripts/db/demo/` after DB bootstrap consolidation — keeps the showcase demo seed runnable on hetzone without reintroducing removed migrations or dev scripts.

### Fixed

- (backend) Demo focus record seeding — `reference_target_id` is stored as text to match the schema.

### Changed

- (backend) Refactored `backend/scripts/db/demo/` into a modular seed package (`context.py`, `seeds/*.py`) while keeping the same CLI entrypoint.
- (docs) `docs/STARTUP.md` — documented dry-run and full seed commands for hetzone deployment.
