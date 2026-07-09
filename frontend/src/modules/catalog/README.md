# Catalog

Shared read-only API client for the intelligence catalog — models, providers, tools, and modalities.

## Purpose

Catalog is not a user-facing page. It is a **shared library module** that fetches LLM providers, models, modalities, tool categories, and tools from the backend. Other modules (agents, chat, intelligence) import `catalog/api.ts` and `catalog/lib/providerDisplay.ts` instead of duplicating catalog HTTP calls.

## Module type

**Shared library** — no routes, pages, or nav.

## Routes and navigation

None. Shared library — not in the module manifest registry.

## Backend integration

| Endpoints | Purpose |
|-----------|---------|
| `GET /catalog/modalities` | Modality list |
| `GET /catalog/models` | Models (optional `modality_key` filter) |
| `GET /catalog/providers` | Provider list |
| `GET /catalog/tool-categories` | Tool category list |
| `GET /catalog/tools` | Tool list |

**Backend counterpart:** `keel_api/src/modules/catalog/`

## Directory structure

```
catalog/
├── api.ts              # All catalog fetch functions and types
└── lib/
    └── providerDisplay.ts   # Provider labels and logo URLs
```

## Key concepts

- **Read-only** — no mutations; admin of catalog data is backend/seed concern.
- **Provider display** — `providerDisplay.ts` maps provider keys to human labels and media URLs.

## Dependencies

- **Shared:** `lib/api.ts`
- **Consumed by:** agents, chat, intelligence
- No imports from other feature modules

## Maintenance guidelines

- Keep this module small — if catalog UI grows, it belongs in **intelligence**, not here.
- Adding new catalog endpoints requires updating `api.ts` and consumer module READMEs (agents, chat, intelligence).

## Related documentation

- [Modules umbrella README](../README.md)
- [PROJECT_TREE.md](../../PROJECT_TREE.md)
- Backend: `keel_api/src/modules/catalog/`

## Module changelog

- **2026-06-15** — Initial module manifest.
