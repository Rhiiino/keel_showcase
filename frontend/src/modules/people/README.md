# People

Personal CRM (contacts) and public figures — relationships, family groups, family tree, and notable people tracking under one nav module.

## Purpose

The People module combines **Contacts** (personal CRM with relationships, tags, and family trees) and **Figures** (public or notable people without CRM features). Users browse directories, edit detail forms, and manage contact-specific sub-areas (groups, tree, tags) from shared secondary navigation.

## Module type

**Feature** — routes, nav, and API.

## Routes and navigation

| Path | Page | Notes |
|------|------|-------|
| `/people/contacts` | `ContactsPage` | Contact directory with tag/name filters |
| `/people/contacts/new` | `ContactCreatePage` | Create contact |
| `/people/contacts/:contactId` | `ContactDetailPage` | Contact detail edit |
| `/people/contacts/tags` | `ContactTagsPage` | Contact tag catalog |
| `/people/contacts/family-groups` | `FamilyGroupsPage` | Family group list |
| `/people/contacts/family-groups/:familyKey` | `FamilyGroupDetailPage` | Group detail |
| `/people/contacts/family-tree` | `FamilyTreePage` | Tree explorer; `?contactId=` opens lineage view |
| `/people/figures` | `FiguresPage` | Figures directory (name search) |
| `/people/figures/new` | `FigureCreatePage` | Create figure |
| `/people/figures/:figureId` | `FigureDetailPage` | Figure detail edit |

**Legacy redirects:** `/contacts/*` → `/people/contacts/*` (preserves bookmarks and old Focus links).

**Nav:** registered — id `people`, title People, href `/people/contacts`, accent blue.

**Module sub-nav:** `PeopleModuleLayout` renders secondary tabs (Contacts, Figures, Groups, Tree, Tags) via `subNav.tsx` + shared `ModuleSubNavLayout`.

**Registered in:** `manifest.ts` → [`app/modules/registry.ts`](../../app/modules/registry.ts).

**Auth:** shell routes inside `RequireAuth` → `AppShell`.

## Backend integration

| Area | Endpoints |
|------|-----------|
| Contacts | `GET/POST /contacts`, `GET/PATCH/DELETE /contacts/:id` (unchanged REST paths) |
| Contact tags, relationships, family | `/contacts/tags`, `/contacts/relationships`, `/contacts/family-groups`, … |
| Contact photo | `entity_type: "contact"`, `role: "photo"` via `/media` |
| Figures | `GET/POST /figures`, `GET/PATCH/DELETE /figures/:id` |
| Figure photo | `entity_type: "figure"`, `role: "photo"` via `/media` |

**Backend counterparts:** `keel_api/src/modules/contacts/`, `keel_api/src/modules/figures/`

## Directory structure

```
people/
├── manifest.ts, navItem.tsx, routes.tsx, PeopleModuleLayout.tsx, subNav.tsx
├── shared/
│   ├── lib/birthDate.ts, personDisplay.ts
│   └── components/          # PersonBirthDateField, PersonPhotoField, PersonInlineName, …
├── contacts/
│   ├── api.ts               # Contacts API client (REST /contacts)
│   ├── pages/               # ContactsPage, ContactDetailPage, family tree, tags, …
│   ├── components/          # ContactAvatar, family tree, relationships, tags, browse, …
│   └── lib/                 # contactFilters, familyTree*, relationshipDisplay, …
└── figures/
    ├── api.ts               # Figures API client (REST /figures)
    ├── pages/               # FiguresPage, FigureCreatePage, FigureDetailPage
    ├── components/          # FigureAvatar, FiguresListView, …
    └── lib/                 # figuresListSort
```

## Public exports

| Export | Consumers |
|--------|-----------|
| `people/contacts/api.ts` | timeline (contact picker, avatars, nav labels), home |
| `people/contacts/lib/contactFilters.ts` | timeline `ContactMultiSelect` search |
| `people/figures/api.ts` | timeline (figure picker, avatars, nav labels) |

Internal only: `people/shared/` — used by contacts and figures forms; not imported cross-module.

## Key concepts

- **Contacts** — personal CRM with relationships, tags, family groups, and self-contact.
- **Figures** — simplified person records for public/notable people; no tags or relationships in v1.
- **Shared person UI** — birth date, photo, and inline name fields in `shared/` for both subsections.
- **Photo attachments** — unified Garage media for both entity types.

## Related documentation

- [Modules umbrella README](../README.md)
- [PROJECT_TREE.md](../../PROJECT_TREE.md)
- Backend contacts: `keel_api/src/modules/contacts/`
- Backend figures: `keel_api/src/modules/figures/`

## Module changelog

- **2026-07-07** — Restructured frontend into `contacts/`, `figures/`, and `shared/` subfolders under the People shell; shared person form components renamed to `Person*`.
- **2026-07-07** — Renamed module from `contacts` to `people`; routes migrated to `/people/contacts/*`; added Figures sub-tab and CRUD at `/people/figures/*`; legacy `/contacts/*` redirects.
- **2026-07-04** — Contact detail inline editable name field.
- **2026-06-27** — Contact tags catalog and list filters.
- **2026-06-20** — Secondary nav and unified photo upload via `/media`.
