<!-- keel_api/scripts/db/seed/README.md -->

# Seed data

This folder contains database seed content used to populate baseline rows after the schema exists. Some files are global app defaults, and others were one-off production bootstrap data for the initial Ryon setup.

## Contents

- `sql/010_catalog.sql` seeds global intelligence catalog data, including model providers, models, tool categories, tools, agents, prompts, and related defaults.
- `sql/011_home_quotes.sql` seeds shared home-screen quote data used by the app.
- `sql/023_focus.sql` seeds the production key-data Focus hub tree for one target user. The `__TARGET_USER_ID__` placeholder is replaced by the seed runner before execution.
- `sql/024_contacts.sql` seeds production key-data contacts, family relationships, and contact photo metadata.
- `sql/025_projects.sql` seeds production key-data Baysic projects, tags, project media metadata, and tag assignments for one target user. The `__TARGET_USER_ID__` placeholder is replaced by the seed runner before execution.
- `prod_seed_key_data.py` is the one-off production seed runner. It resolves the target user by email, loads the contacts, projects, and Focus SQL in order, replaces target-user placeholders, syncs binary media from local seed assets into the configured media storage paths, and aborts when sentinel rows already exist to avoid duplicate inserts.
- `assets/` held the binary files used by the initial production seed, including contact photos and project media under `assets/contacts/` and `assets/projects/`. This folder is gitignored and is not committed to the repository.

## Usage notes

The numbered SQL files are ordered so lower numbers run first. Global files can be loaded into a fresh database during local Docker initialization, while targeted production key-data files are intended to be run through `prod_seed_key_data.py` so the correct user ID and media paths are applied.

Important: These seed files were created as bootstrap content for the initial production setup. They are not expected to be maintained in lockstep with future codebase or database changes; use migrations and current application workflows for ongoing schema and data evolution.
