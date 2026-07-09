# Deleted module (Recently Deleted)

Global trash UI and API client for restorable deletes.

## Routes and navigation

No standalone route in v1. The list lives in **Settings → Recently Deleted** (`/settings` tab).

**Registered in:** `manifest.ts` → [`app/modules/registry.ts`](../../app/modules/registry.ts) (manifest-only — contributes `settingsTabs`, no routes or nav).

## Backend integration

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/deleted` | List active trash rows for current user |
| GET | `/deleted/config` | Read-only retention metadata |
| POST | `/deleted/{id}/restore` | Restore one row |
| DELETE | `/deleted/{id}` | Permanently purge one row |

Retention is configured server-side via `RECENTLY_DELETED_RETENTION_DAYS` (default 30).

## Directory structure

```
deleted/
├── api.ts
├── manifest.ts
├── settingsTabs.ts
├── lib/
│   ├── deletedDaysLeft.ts
│   ├── deletedListLayout.ts
│   └── deletedListSort.ts
├── components/
│   ├── RecentlyDeletedSettingsTab.tsx
│   ├── RecentlyDeletedListView.tsx
│   └── RecentlyDeletedListRow.tsx
└── README.md
```

## Module changelog

- **2026-07-11** — Phase 3: `manifest.ts` + `settingsTabs.ts` register the Recently Deleted settings tab upward (no longer hardcoded in settings module).
- **2026-07-04** — Recently Deleted list adds a sortable **Days left** column between Expires and Permanently deleted.
- **2026-07-03** — Initial Recently Deleted settings tab and `/deleted` API client.
