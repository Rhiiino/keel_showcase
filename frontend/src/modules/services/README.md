# Services module

Monitor external application URLs with health status (up / caution / down), list view, and per-service configuration.

## Routes and navigation

| Path | Page |
|------|------|
| `/services` | Service list |
| `/services/new` | Create service |
| `/services/:serviceId` | Edit service |

Nav item: [`navItem.tsx`](./navItem.tsx) — icon `services`.

Layout: [`ServicesModuleLayout.tsx`](./ServicesModuleLayout.tsx) — `AppShellContent` + `max-w-6xl` (same width as timeline/journal module pages).

List sorting: Status, Service, Type, Last check, and Code columns use shared `ListSortableHeaderCell` + `useListColumnSort` (default: last check descending). **Last check** shows the timestamp, response time, and a live elapsed clock on the second row.

## Backend integration

REST prefix `/services` — see [`api.ts`](./api.ts).

Manual probe: `POST /services/{id}/check`.

Scheduled batch checks: Jobs task **Check service health** (`jobs.tasks.services.check_all`).

## Directory structure

```
services/
├── api.ts
├── navItem.tsx
├── routes.tsx
├── components/
│   ├── ServiceElapsedClockCell.tsx
│   ├── ServiceForm.tsx
│   ├── ServiceFormPageLayout.tsx
│   ├── ServicesListRow.tsx
│   ├── ServicesListView.tsx
│   └── ServiceStatusDot.tsx
├── hooks/
│   └── useServiceEditor.ts
├── lib/
│   └── serviceDisplay.ts
├── pages/
│   ├── ServiceCreatePage.tsx
│   ├── ServiceDetailPage.tsx
│   └── ServicesPage.tsx
└── README.md
```

## Module changelog

- **2026-07-06** — Services list column order: Type between Status and Service; Last check and Code use balanced spacing with Service.
- **2026-07-04** — Elapsed clock column in list (live time since last check); type pills in list (Frontend sky, Backend violet); form Type + Description fields.
- **2026-07-03** — Initial services module: list with status dot, row menu (check now / delete), create/edit form with save/discard.
