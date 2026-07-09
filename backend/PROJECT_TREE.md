# Keel API — project tree

Living map of every file under `keel_api/src/modules/` and `keel_api/src/llm/tools/native/`. Update when files are added, removed, renamed, or materially change role.

Production FastAPI backend under `keel_api/`. Module architecture manifests live in [`src/modules/README.md`](src/modules/README.md) and per-module READMEs.

```
keel_api/
├── PROJECT_TREE.md  # This file — module + native tool inventory
├── README.md  # Overview, DB schema, env vars, deployment
├── docs/
│   └── connectors/
│       └── focus-ai-connector.md  # Canonical LLM guide with connection placeholders
├── src/
│   ├── main.py  # FastAPI entrypoint; loops app_modules registry for router registration
│   ├── app_modules/
│   │   ├── __init__.py  # Package marker
│   │   ├── registry.py  # Ordered ModuleRegistration list + enabled_modules()
│   │   └── types.py  # ModuleRegistration dataclass
│   ├── core/
│   │   ├── config.py  # App settings (pydantic-settings, env vars)
│   │   ├── database.py  # asyncpg pool init/get/close
│   │   ├── errors.py  # AppError + FastAPI exception handlers
│   │   ├── logging.py  # Logging setup
│   │   └── tables.py  # Shared PostgreSQL table name constants
│   ├── modules/
│   │   ├── README.md  # Umbrella module conventions + README template
│   │   ├── __init__.py  # Package placeholder
│   │   ├── agents/
│   │   │   ├── README.md  # Module architecture manifest
│   │   │   ├── __init__.py
│   │   │   ├── config.py  # ROUTE_PREFIX, path constants
│   │   │   ├── router.py  # HTTP routes — agent editor, prompts, LLM prefs
│   │   │   ├── service.py  # Agent metadata, prompt preview, context usage
│   │   │   ├── repository.py  # agent_llm_preferences SQL
│   │   │   └── schemas.py  # Agent DTOs
│   │   ├── auth/
│   │   │   ├── README.md
│   │   │   ├── __init__.py
│   │   │   ├── config.py  # OAuth paths, cookie names, TTL
│   │   │   ├── router.py  # Google OAuth, session, /me, logout
│   │   │   ├── service.py  # OAuth flow, session create/validate
│   │   │   ├── repository.py  # users + sessions SQL
│   │   │   └── schemas.py  # CurrentUserResponse, profile update
│   │   ├── catalog/
│   │   │   ├── README.md
│   │   │   ├── __init__.py
│   │   │   ├── config.py  # ROUTE_PREFIX, catalog path constants
│   │   │   ├── router.py  # Read-only catalog lists + reload + media
│   │   │   ├── service.py  # Serves in-memory llm.catalog cache
│   │   │   ├── repository.py  # Optional DB reload helpers
│   │   │   └── schemas.py  # Catalog DTOs
│   │   ├── chat/
│   │   │   ├── README.md
│   │   │   ├── __init__.py
│   │   │   ├── config.py  # Conversation path constants
│   │   │   ├── router.py  # Conversations, messages, SSE stream, rules
│   │   │   ├── service.py  # Turn orchestration via llm.orchestrator
│   │   │   ├── repository.py  # conversations, messages, tool_calls SQL
│   │   │   └── schemas.py  # Chat DTOs
│   │   ├── contacts/
│   │   │   ├── README.md
│   │   │   ├── __init__.py
│   │   │   ├── config.py  # Photo limits, relationship validation sets
│   │   │   ├── router.py  # Contacts, relationships, families, tags
│   │   │   ├── service.py  # Contact CRUD orchestration
│   │   │   ├── families_service.py  # Nuclear family group computation
│   │   │   ├── tree_service.py  # Family tree graph building
│   │   │   ├── repository.py  # contacts SQL
│   │   │   ├── tags_repository.py  # contact_tags and assignments SQL
│   │   │   ├── relationships_repository.py  # contact_relationships SQL
│   │   │   ├── schemas.py  # Contact and family DTOs
│   │   │   ├── test_families_service.py  # Unit tests for families_service
│   │   │   └── test_tree_service.py  # Unit tests for tree_service
│   │   ├── figures/
│   │   │   ├── README.md
│   │   │   ├── __init__.py
│   │   │   ├── config.py  # Gender/status validation sets
│   │   │   ├── router.py  # Figure CRUD routes
│   │   │   ├── service.py  # Figure CRUD orchestration
│   │   │   ├── repository.py  # figures SQL
│   │   │   └── schemas.py  # Figure DTOs
│   │   ├── deleted/
│   │   │   ├── README.md
│   │   │   ├── config.py  # Route constants
│   │   │   ├── entity_types.py  # entity_type string constants
│   │   │   ├── repository.py  # deleted_records SQL
│   │   │   ├── router.py  # GET/POST/DELETE /deleted
│   │   │   ├── schemas.py  # Trash DTOs
│   │   │   ├── service.py  # trash_entity, restore, purge orchestration
│   │   │   ├── test_trash_handlers.py  # Registry smoke tests
│   │   │   └── handlers/  # Per-entity capture/restore/purge
│   │   ├── connectors/
│   │   │   ├── README.md
│   │   │   ├── __init__.py
│   │   │   ├── config.py  # Connector scopes and route prefix
│   │   │   ├── router.py  # Includes /connectors/focus subrouter
│   │   │   ├── auth.py  # Ephemeral in-memory bearer-token sessions
│   │   │   ├── realtime.py  # SSE automation event broadcaster
│   │   │   ├── schemas.py  # Shared connector DTOs
│   │   │   ├── service.py  # Shared connector helpers
│   │   │   ├── test_connectors_auth.py  # Unit tests for connector auth
│   │   │   └── focus/
│   │   │       ├── __init__.py
│   │   │       ├── config.py  # Focus connector path constants
│   │   │       ├── router.py  # Manifest, guide, sessions, events, tool invoke
│   │   │       ├── service.py  # Tool adapters over modules.focus.service
│   │   │       ├── manifest.py  # Tool definitions and runtime manifest
│   │   │       ├── events.py  # Focus automation event builders
│   │   │       ├── prompt.py  # LLM domain instructions
│   │   │       └── test_focus_manifest.py  # Manifest/tool registry tests
│   │   ├── jobs/
│   │   │   ├── README.md
│   │   │   ├── TASKS.md  # Guide: add/update Celery tasks
│   │   │   ├── __init__.py
│   │   │   ├── config.py  # Queue names, task constants, validation sets
│   │   │   ├── celery_app.py  # Shim → worker.app (Docker entrypoint)
│   │   │   ├── dispatch.py  # Shim → worker.dispatch.enqueue
│   │   │   ├── runtime.py  # Shim → worker.runtime.run_async
│   │   │   ├── router.py  # HTTP routes for runs and schedules
│   │   │   ├── schemas.py  # Job run/schedule DTOs
│   │   │   ├── repository/
│   │   │   │   ├── __init__.py  # Barrel re-export
│   │   │   │   ├── runs.py  # job_runs SQL
│   │   │   │   └── schedules.py  # job_schedules SQL
│   │   │   ├── service/
│   │   │   │   ├── __init__.py  # Barrel re-export
│   │   │   │   ├── _helpers.py  # Record mappers, validation helpers
│   │   │   │   ├── runs.py  # Run list/get/delete
│   │   │   │   ├── schedules.py  # Schedule CRUD, run now
│   │   │   │   ├── tasks.py  # Registered task catalog (read-only)
│   │   │   │   └── schedule_cron.py  # Recurrence → crontab + summary
│   │   │   ├── worker/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── app.py  # Celery instance, broker config, autodiscover
│   │   │   │   ├── dispatch.py  # enqueue() implementation
│   │   │   │   ├── runtime.py  # asyncio bridge + worker DB pool lifecycle
│   │   │   │   ├── signals.py  # Celery lifecycle hooks → job_runs
│   │   │   │   ├── beat_loader.py  # Beat startup → load enabled job_schedules
│   │   │   │   └── registry.py  # Celery task lookup by registered name
│   │   │   └── tasks/
│   │   │       ├── __init__.py
│   │   │       ├── backup_lib.py  # Postgres pg_dump + Garage sync helpers
│   │   │       ├── ping.py  # Smoke task
│   │   │       ├── maintenance.py  # Session purge
│   │   │       ├── timeline.py  # Timeline reminder polling (dry run)
│   │   │       ├── services.py  # Service health batch probe
│   │   │       └── backup.py  # On-demand Postgres + Garage backup
│   │   ├── coak/
│   │   │   ├── README.md
│   │   │   ├── config.py  # Routes, kinds, color defaults, preference keys
│   │   │   ├── router.py  # HTTP routes for records, items, workspace prefs
│   │   │   ├── schemas.py  # Coak DTOs
│   │   │   ├── repository/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── records.py  # coak_records SQL
│   │   │   │   ├── items.py  # coak_items SQL
│   │   │   │   └── tags.py  # coak_tags and item-tag assignment SQL
│   │   │   └── service/
│   │   │       ├── __init__.py
│   │   │       ├── helpers.py  # Validation and preference helpers
│   │   │       ├── records.py  # Record CRUD
│   │   │       ├── items.py  # Directory item CRUD and moves
│   │   │       ├── tags.py  # Record tag CRUD
│   │   │       ├── workspace_state.py  # Per-record layout in user_preferences
│   │   │       └── workspace_settings.py  # Per-record panel layout in user_preferences
│   │   ├── focus/
│   │   │   ├── README.md
│   │   │   ├── __init__.py
│   │   │   ├── config.py  # Node kinds, constellation enums, path constants
│   │   │   ├── router.py  # Nodes, timers, tags, references, constellation state/settings
│   │   │   ├── service/  # Business logic package (nodes, timers, tags, references, constellation)
│   │   │   │   ├── __init__.py  # Barrel re-export of public service API
│   │   │   │   ├── helpers.py  # Validation, mapping, preference decode
│   │   │   │   ├── nodes.py  # Node tree CRUD and reorder
│   │   │   │   ├── tags.py  # Tag CRUD
│   │   │   │   ├── time_entries.py  # Node timer lifecycle actions
│   │   │   │   ├── references.py  # Reference search, detail, settings
│   │   │   │   ├── constellation_state.py  # Layout state in user prefs
│   │   │   │   ├── constellation_layout.py # Layout snapshot + semantic placement for connector tools
│   │   │   │   ├── constellation_settings.py  # Visual settings in user prefs
│   │   │   │   └── legacy.py  # LLM list/entry vocabulary adapters
│   │   │   ├── repository/  # Focus SQL repositories
│   │   │   │   ├── __init__.py
│   │   │   │   ├── nodes.py  # focus_nodes SQL
│   │   │   │   ├── tags.py  # focus_tags + focus_node_tags SQL
│   │   │   │   └── time_entries.py  # focus_node_time_entries SQL
│   │   │   ├── reference_registry/  # Cross-module reference type search/detail, including media object refs
│   │   │   │   ├── __init__.py  # Barrel re-export of public registry API
│   │   │   │   ├── types.py  # Type metadata and property manifests
│   │   │   │   ├── formatting.py  # Property value formatting
│   │   │   │   ├── search.py  # Picker search queries
│   │   │   │   ├── hydrate.py  # Load target summaries
│   │   │   │   └── detail.py  # Inspector property detail
│   │   │   ├── schemas.py  # Focus node, timer, and constellation DTOs
│   │   │   └── test_time_entries.py  # Unit tests for focus node timer helpers
│   │   ├── home/
│   │   │   ├── README.md
│   │   │   ├── __init__.py
│   │   │   ├── config.py  # QUOTES_PATH
│   │   │   ├── router.py  # GET /home/quotes
│   │   │   ├── service.py  # Quote list passthrough
│   │   │   ├── repository.py  # quotes SQL
│   │   │   └── schemas.py  # QuotePublic
│   │   ├── media/
│   │   │   ├── README.md
│   │   │   ├── __init__.py
│   │   │   ├── config.py  # Upload limits, entity types, route paths
│   │   │   ├── router.py  # Upload, download, list, attachments, panels
│   │   │   ├── service.py  # Garage upload/download, attachment orchestration
│   │   │   ├── panel_service.py  # Display panel CRUD and layout saves
│   │   │   ├── panel_grid.py  # Packed-grid validation and elastic reflow helpers
│   │   │   ├── repository.py  # media_objects + media_attachments + panels SQL
│   │   │   ├── access.py  # Entity ownership and media readability checks
│   │   │   ├── validation.py  # MIME/size validation
│   │   │   └── schemas.py  # MediaPublic, MediaAttachmentPublic
│   │   ├── projects/
│   │   │   ├── README.md
│   │   │   ├── __init__.py
│   │   │   ├── config.py  # Media/cover limits, status enums, font keys
│   │   │   ├── router.py  # Projects, tags, workspace, folders
│   │   │   ├── service/  # Business logic
│   │   │   │   ├── __init__.py  # Barrel re-exports
│   │   │   │   ├── projects.py  # Project CRUD, tags, workspace
│   │   │   │   ├── canvases.py  # Multi-canvas CRUD
│   │   │   │   ├── folders.py  # Project folder CRUD
│   │   │   │   └── workspace_settings.py  # Workspace canvas UI settings
│   │   │   ├── repository/  # SQL access by table group
│   │   │   │   ├── __init__.py  # Barrel re-exports
│   │   │   │   ├── projects.py  # projects SQL
│   │   │   │   ├── folders.py  # project_folders SQL
│   │   │   │   ├── canvas.py  # project_canvas SQL
│   │   │   │   └── tags.py  # project_tags + assignments SQL
│   │   │   ├── workspace_state.py  # Canvas JSON normalization helpers
│   │   │   └── schemas.py  # Project DTOs
│   │   ├── settings/
│   │   │   ├── README.md
│   │   │   ├── __init__.py
│   │   │   ├── config.py  # Greeting font keys, quote interval bounds, shell background defaults, home card visibility defaults
│   │   │   ├── router.py  # GET/PATCH /settings
│   │   │   ├── service.py  # Merge user_preferences JSON; validate shell_background media; seed new-user defaults
│   │   │   ├── repository.py  # user_preferences SQL
│   │   │   ├── schemas.py  # SettingsPublic, SettingsUpdate, ShellBackgroundSettings
│   │   │   └── test_home_card_defaults.py  # Unit tests for new-user home card visibility defaults
│   │   ├── shop/
│   │   │   ├── README.md
│   │   │   ├── __init__.py
│   │   │   ├── config.py  # Item statuses, upload limits, path constants
│   │   │   ├── router.py  # Merchants, items, proposals
│   │   │   ├── service.py  # Shop CRUD, listing proposal flow; media via modules.media
│   │   │   ├── repository.py  # shop_items SQL
│   │   │   ├── merchant_repository.py  # shop_merchants SQL
│   │   │   ├── proposal_repository.py  # shop_listing_proposals SQL
│   │   │   ├── schemas.py  # Shop DTOs
│   │   │   └── listing/  # URL fetch + extract pipeline (not a separate router)
│   │   │       ├── __init__.py
│   │   │       ├── config.py  # Listing fetch timeouts, user-agent
│   │   │       ├── detect.py  # Detect merchant/site from URL
│   │   │       ├── extract.py  # Route URL to site-specific extractor
│   │   │       ├── service.py  # Orchestrate fetch → extract → proposal shape
│   │   │       ├── fetchers/
│   │   │       │   ├── __init__.py
│   │   │       │   ├── base.py  # Fetcher protocol
│   │   │       │   ├── httpx_fetcher.py  # Plain HTTP fetch
│   │   │       │   └── playwright_fetcher.py  # JS-rendered fetch (HAUL_PLAYWRIGHT_ENABLED)
│   │   │       └── extractors/
│   │   │           ├── __init__.py
│   │   │           └── amazon.py  # Amazon listing field extraction
│   │   └── timeline/
│   │       ├── README.md
│   │       ├── __init__.py
│   │       ├── config.py  # EVENTS_PATH, PLANS_PATH, TAG_LIST_PATH, DEFAULT_TAG_COLOR_HEX
│   │       ├── router.py  # Tag, event, plan, plan-item, calendar routes
│   │       ├── service.py  # Event ownership, contact/tag validation, junction sync
│   │       ├── plans_service.py  # Plan/plan-item CRUD, promote, link-event
│   │       ├── repository/
│   │       │   ├── __init__.py  # Re-exports events, tags, plans SQL
│   │       │   ├── events.py  # timeline_events + timeline_event_contacts/figures SQL
│   │       │   ├── plans.py  # timeline_plans + timeline_plan_items SQL
│   │       │   ├── reminders.py  # timeline_event_reminders SQL + due queries
│   │       │   └── tags.py  # timeline_tags + timeline_tag_assignments SQL
│   │       └── schemas.py  # TimelineTagPublic, TimelineEventPublic, plan DTOs
│   │   └── journal/
│   │       ├── README.md
│   │       ├── config.py  # ENTRIES_PATH, TAG_LIST_PATH, DEFAULT_TAG_COLOR_HEX
│   │       ├── router.py  # Tag + entry CRUD routes
│   │       ├── service.py  # Ownership, tag validation, junction sync
│   │       ├── repository/
│   │       │   ├── __init__.py  # Re-exports entries + tags SQL
│   │       │   ├── entries.py  # journal_entries SQL + list filters
│   │       │   └── tags.py  # journal_tags + journal_entry_tag_assignments SQL
│   │       └── schemas.py  # JournalTagPublic, JournalEntryPublic, Create, Update
│   │   └── services/
│   │       ├── README.md
│   │       ├── check.py  # HTTP probe + up/caution/down transitions
│   │       ├── config.py  # ROUTE_PREFIX, VALID_STATUSES, probe timeout
│   │       ├── helpers.py  # record_to_public mapper
│   │       ├── repository.py  # services table SQL
│   │       ├── router.py  # CRUD + POST /{id}/check
│   │       ├── schemas.py  # ServicePublic, ServiceCreate, ServiceUpdate
│   │       └── service.py  # Ownership validation, CRUD, check now
│   │   └── email/
│   │       ├── README.md
│   │       ├── config.py  # ROUTE_PREFIX, Gmail constants, mailbox labels
│   │       ├── gmail_client.py  # Gmail API client, query builder, message parsing
│   │       ├── oauth.py  # Gmail OAuth + token encryption/refresh
│   │       ├── repository.py  # email_accounts table SQL
│   │       ├── router.py  # CRUD + message fetch routes
│   │       ├── schemas.py  # Account + message fetch schemas
│   │       └── service.py  # Ownership validation, CRUD, Gmail fetch
│       └── tools/
│           └── native/  # Agent tool executors (call modules.*.service)
│               ├── __init__.py
│               ├── contacts/  # Category CONTACTS → modules.contacts
│               │   ├── __init__.py
│               │   ├── _contacts.py  # Shared contact tool helpers
│               │   ├── get_contact.py
│               │   ├── list_contacts.py
│               │   └── search_contacts.py
│               ├── core/  # Category CORE — no HTTP module
│               │   ├── __init__.py
│               │   └── get_current_time.py
│               ├── focus/  # Category AGENDA → modules.focus
│               │   ├── __init__.py
│               │   ├── _focus.py  # Shared focus tool helpers
│               │   ├── create_focus_entry.py
│               │   ├── create_focus_list.py
│               │   ├── create_focus_tag.py
│               │   ├── delete_focus_entry.py
│               │   ├── delete_focus_list.py
│               │   ├── delete_focus_tag.py
│               │   ├── get_focus_list.py
│               │   ├── list_focus_entries.py
│               │   ├── list_focus_lists.py
│               │   ├── list_focus_tags.py
│               │   ├── update_focus_entry.py
│               │   ├── update_focus_list.py
│               │   └── update_focus_tag.py
│               ├── haul/  # Category HAUL → modules.finance
│               │   ├── __init__.py
│               │   ├── _haul.py  # Shared finance tool helpers
│               │   ├── clear_finance_transaction_cover.py
│               │   ├── create_finance_transaction.py
│               │   ├── create_finance_vendor.py
│               │   ├── delete_finance_transaction.py
│               │   ├── delete_finance_transaction_media.py  # Detach transaction media (media_service)
│               │   ├── delete_finance_vendor.py
│               │   ├── fetch_listing.py
│               │   ├── get_finance_transaction.py
│               │   ├── list_finance_transaction_media.py  # List transaction attachments (media_service)
│               │   ├── list_finance_transactions.py
│               │   ├── list_finance_vendors.py
│               │   ├── mark_finance_transaction_ordered.py
│               │   ├── mark_finance_transaction_received.py
│               │   ├── propose_finance_listing.py
│               │   ├── set_finance_transaction_cover.py
│               │   ├── set_finance_transaction_cover_from_url.py
│               │   ├── update_finance_transaction.py
│               │   └── update_finance_vendor.py
│               ├── obsidian/  # Category OBSIDIAN — vault filesystem, no HTTP module
│               │   ├── __init__.py
│               │   ├── _vault.py  # Vault path safety helpers
│               │   ├── vault_append_file.py
│               │   ├── vault_create_directory.py
│               │   ├── vault_delete_file.py
│               │   ├── vault_list_entries.py
│               │   ├── vault_move_file.py
│               │   ├── vault_patch_file.py
│               │   ├── vault_read_file.py
│               │   ├── vault_search_notes.py
│               │   └── vault_write_file.py
│               ├── projects/  # Category PROJECTS → modules.projects
│               │   ├── __init__.py
│               │   ├── _projects.py  # Shared project tool helpers
│               │   ├── create_project.py
│               │   ├── create_project_tag.py
│               │   ├── delete_project.py
│               │   ├── delete_project_tag.py
│               │   ├── get_project.py
│               │   ├── get_project_canvas.py
│               │   ├── list_project_canvases.py
│               │   ├── list_project_media.py  # List project attachments (media_service)
│               │   ├── list_project_tags.py
│               │   ├── list_projects.py
│               │   ├── set_project_appearance.py
│               │   ├── set_project_cover.py
│               │   ├── update_project.py
│               │   ├── update_project_canvas.py
│               │   └── update_project_tag.py
│               └── web/  # Category WEB — Tavily, no HTTP module
│                   ├── __init__.py
│                   ├── _tavily.py  # Tavily client helpers
│                   ├── web_crawl.py
│                   ├── web_extract.py
│                   ├── web_map.py
│                   ├── web_research.py
│                   └── web_search.py
```

## Native tool ↔ module map

| Native folder | Catalog category | Backend module |
|---------------|------------------|----------------|
| `focus/` | AGENDA | `modules/focus/` |
| `haul/` | HAUL | `modules/finance/` |
| `projects/` | PROJECTS | `modules/projects/` |
| `contacts/` | CONTACTS | `modules/contacts/` |
| `obsidian/` | OBSIDIAN | *(vault only)* |
| `web/` | WEB | *(external API)* |
| `core/` | CORE | *(utility)* |

## Maintenance

Update this file in the **same PR** as any new, renamed, or moved file under `src/modules/` or `src/llm/tools/native/`. Pair with the affected module README per [`.cursor/rules/module-readme.mdc`](../.cursor/rules/module-readme.mdc).
