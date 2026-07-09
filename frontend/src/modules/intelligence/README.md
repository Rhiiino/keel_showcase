# Intelligence

Hub for browsing LLM providers, models, and registered tools from the shared catalog.

## Purpose

Intelligence is a read-only browser for Keel’s intelligence catalog. The hub summarizes model and tool counts; sub-pages show detailed tables for models and tools. All data comes from the **catalog** module API — there is no separate intelligence backend.

## Module type

**Feature** — routes and nav; no own `api.ts` (uses catalog).

## Routes and navigation

| Path | Page | Notes |
|------|------|-------|
| `/intelligence` | `IntelligencePage` | Hub with section cards |
| `/intelligence/models` | `ModelsPage` | Provider/model table |
| `/intelligence/tools` | `ToolsPage` | Tool category/table view |

**Nav:** registered — id `intelligence`, title Intelligence, href `/intelligence`, accent blue.

**Registered in:** `manifest.ts` → [`app/modules/registry.ts`](../../app/modules/registry.ts).

**Auth:** shell routes inside `RequireAuth` → `AppShell`.

## Backend integration

Uses **catalog** endpoints only:

- `GET /catalog/modalities`, `/catalog/models`, `/catalog/providers`, `/catalog/tool-categories`, `/catalog/tools`

**Backend counterpart:** `keel_api/src/modules/catalog/` (no dedicated intelligence module)

## Directory structure

```
intelligence/
├── navItem.tsx
├── routes.tsx
├── components/   # Header, section cards, tab panel, SectionIcon
├── lib/          # display helpers, sections config (hub card layout)
└── pages/        # IntelligencePage, ModelsPage, ToolsPage
```

## Key concepts

- **Sections config** — `lib/sections.ts` defines hub cards linking to models/tools sub-routes.
- **Tab bar** — `ModuleTabBar` from `src/components/` on models and tools sub-pages.
- **Catalog-only data** — never add intelligence-specific API; extend catalog if new catalog fields are needed.

## Dependencies

- **catalog** — all fetch functions and types
- **chat** — `ToolCategoryIcon`, tool category labels, context window formatting
- No outbound API beyond catalog

## Maintenance guidelines

- New catalog browse surfaces: add pages here, fetch via `catalog/api.ts`.
- Hub assets live in `src/assets/intelligence/` at app level.

## Related documentation

- [Modules umbrella README](../README.md)
- [catalog/README.md](../catalog/README.md)
- [PROJECT_TREE.md](../../PROJECT_TREE.md)
- Backend: `keel_api/src/modules/catalog/`

## Module changelog

- **2026-07-09** — `IntelligenceTabBar` moved to platform `ModuleTabBar` in `src/components/`.
- **2026-06-15** — Initial module manifest.
