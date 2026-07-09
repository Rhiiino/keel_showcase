# Journal

Personal journal entries list, forms, and tag catalog.

## Purpose

Journal lets users write dated entries, assign colored tags, filter the list by tags/text/date, and manage tags on a dedicated sub-nav tab.

## Module type

**Feature** — routes, nav, and API.

## Routes and navigation

| Path | Page | Notes |
|------|------|-------|
| `/journal` | `JournalPage` | Entries tab — list with collapsible filters, plus button |
| `/journal/tags` | `JournalTagsPage` | Tags tab — searchable list with inline rename, color picker, pagination |
| `/journal/new` | `JournalCreatePage` | Empty form → POST |
| `/journal/:entryId` | `JournalEntryPage` | Detail form → PATCH; delete at bottom |

**Nav:** registered — id `journal`, title Journal, href `/journal`, icon `assets/nav_icons/journal.png`, accent blue.

**Sub-nav:** Entries (`/journal`) · Tags (`/journal/tags`) — see `subNav.tsx`, `JournalModuleLayout.tsx`.

**Registered in:** `manifest.ts` → [`app/modules/registry.ts`](../../app/modules/registry.ts).

**Auth:** shell routes inside `RequireAuth` → `AppShell`.

## Backend integration

| Area | Endpoints |
|------|-----------|
| Tags | `GET/POST /journal/tags`, `PATCH/DELETE /journal/tags/{id}` |
| Entries | `GET/POST /journal/entries`, `GET/PATCH/DELETE /journal/entries/{id}` |

**List filters:** `query`, `entry_date_from`, `entry_date_to`, repeatable `tag_ids` (OR).

**Media (entry forms):** `fetchJournalEntryMedia`, `uploadJournalEntryMedia`, `attachJournalEntryMediaFromMedia`, `deleteJournalEntryMedia` — uses shared `/media` attachment API with `entity_type: journal_entry`, `role: gallery`. Query key: `journalQueryKeys.entryMedia(id)`.

**Backend counterpart:** `keel_api/src/modules/journal/`

## Directory structure

```
journal/
├── JournalModuleLayout.tsx  # ModuleSubNavLayout wrapper
├── subNav.tsx               # Entries · Tags tabs
├── api.ts
├── homeCards.ts             # dashboard card manifest contributions
├── homeCards/               # Journal Status home dashboard card
│   ├── HomeJournalStatusCard.tsx
│   ├── HomeJournalStatus.tsx
│   └── lib/                 # homeJournalStreak, homeJournalToday
├── navItem.tsx
├── routes.tsx
├── components/
│   ├── browse/       # JournalListView, JournalListRow, JournalFilters
│   ├── filters/      # JournalFiltersPanel, JournalFilterFields
│   ├── forms/        # JournalEntryForm, JournalFormPageLayout
│   └── tags/         # JournalTagsListView, JournalTagListRow, JournalTagPill, JournalInlineTags
├── hooks/            # useJournalEntryEditor
├── lib/              # journalDisplay, journalFilters, journalTagDisplay, journalTagSearch
└── pages/            # JournalPage, JournalTagsPage, JournalCreatePage, JournalEntryPage
```

## Key concepts

- **Label tags** — user-defined colored tags via `/journal/tags`; assign on entry forms with `tag_ids`; manage catalog on Tags sub-nav list.
- **Entries tab** — collapsible filter panel (tags, content search, date range); list columns: date, tags, content preview (~40 words), row delete menu; client-side pagination.
- **Forms** — left-aligned `max-w-3xl` layout; date picker, auto-growing content textarea, inline tags, horizontal media carousel (upload, library pick, drag/paste, delete — parity with timeline); save/discard when dirty.

- **Home card** — `homeCards/` exports the Journal Status dashboard card (`journal-status` id) via `manifest.ts` → `homeCards`.

## Dependencies

- **home/cards/layout/constants** — shared content width class for home dashboard card chrome
- **media** — `EntityMediaCarousel`, `MediaPickerPagination`, `useConfirmDeleteAction`, `ConfirmTrashButton`
- **shop** — `CardMenu`, `ShopListSearch`
- **projects** — `AutoSizeTextarea`, `usePageFileDrop`, `usePagePaste`

## Module changelog

- **2026-07-11** — Home dashboard Journal Status card moved from `home/cards/journal/` to `journal/homeCards/`; registers via manifest `homeCards`.
- **2026-06-30** — Entry form gallery files (upload, library pick, drag/paste, delete) via shared `EntityMediaCarousel`.
- **2026-06-27** — Initial journal module with entries list, forms, and tags catalog.
