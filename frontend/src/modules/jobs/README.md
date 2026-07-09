# Jobs

Frontend module for background job runs and recurring schedules.

## Purpose

Browse Celery **job run history**, manage **recurring schedules** (daily, weekly, monthly, yearly at a wall-clock time in ET, or every N minutes), and browse **registered background tasks** (read-only catalog). Backed by `keel_api` `/jobs` routes.

## Module type

**Feature** — session-required UI; pairs with backend jobs infrastructure module.

## Routes and navigation

| Path | Page | Sub-nav |
|------|------|---------|
| `/jobs` | Runs list | Runs |
| `/jobs/schedules` | Schedules list | Schedules |
| `/jobs/schedules/new` | Create schedule form | Schedules |
| `/jobs/schedules/:scheduleId` | Edit schedule form | Schedules |
| `/jobs/tasks` | Tasks catalog (read-only) | Tasks |

- **Nav id:** `jobs`
- **Nav href:** `/jobs`
- **Icon:** `assets/nav_icons/jobs.png`
- **Registered in:** [`manifest.ts`](manifest.ts) → [`app/modules/registry.ts`](../../app/modules/registry.ts)

## Backend integration

| Endpoint | Use |
|----------|-----|
| `GET /jobs/runs` | Runs list |
| `GET /jobs/runs/{id}` | Single run (API client; list row opens modal from list data) |
| `DELETE /jobs/runs/{id}` | Delete a run history row |
| `GET /jobs/schedules` | Schedules list (`next_run_at`, `run_count` on each row) |
| `GET /jobs/schedules/{id}` | Schedule form (edit) |
| `GET /jobs/schedules/task-options` | Task dropdown for schedule form |
| `GET /jobs/tasks` | Registered tasks catalog (read-only) |
| `POST /jobs/schedules` | Create schedule |
| `PATCH /jobs/schedules/{id}` | Update / enable / disable |
| `POST /jobs/schedules/{id}/run` | Run schedule task immediately |
| `DELETE /jobs/schedules/{id}` | Delete schedule |

Query keys: `jobsQueryKeys` in [`api.ts`](./api.ts).

## Directory structure

```
jobs/
├── README.md
├── api.ts
├── navItem.tsx
├── subNav.tsx
├── JobsModuleLayout.tsx
├── routes.tsx
├── lib/
│   ├── jobRunDisplay.ts
│   ├── jobScheduleDisplay.ts
│   ├── jobTaskDisplay.ts
│   └── jobTimeDisplay.ts
├── components/
│   ├── runs/
│   │   ├── JobRunDetailModal.tsx
│   │   ├── JobRunsListView.tsx
│   │   └── JobRunsListRow.tsx
│   ├── schedules/
│   │   ├── JobSchedulesListView.tsx
│   │   ├── JobSchedulesListRow.tsx
│   │   ├── ScheduleNextRunCell.tsx
│   │   ├── ScheduleRunCountCell.tsx
│   │   └── JobScheduleForm.tsx
│   └── tasks/
│       ├── JobTaskDetailModal.tsx
│       ├── JobTasksListView.tsx
│       └── JobTasksListRow.tsx
├── hooks/
│   └── useTickingNow.ts
└── pages/
    ├── JobRunsPage.tsx
    ├── JobSchedulesPage.tsx
    ├── JobScheduleFormPage.tsx
    └── JobTasksPage.tsx
```

## Dependencies

- **app/shell** — `ModuleSubNavLayout`
- **components/list** — `ListPageTitle`
- **media** — `MediaPickerPagination`, `useConfirmDeleteAction`
- **shop** — `CardMenu`
- **timeline/lib** — client-side pagination helpers

## Module changelog

- **2026-07-01** — Tasks tab — read-only catalog of registered background tasks with detail modal.
- **2026-07-01** — Schedules list — Runs column shows linked execution count per schedule.
- **2026-07-01** — Schedule form supports **Every N minutes** interval recurrence with `interval_minutes` input.
- **2026-07-01** — Schedules list next-run column shows a live countdown pill before the timestamp.
- **2026-07-01** — Schedule form uses header Save/Discard pattern; edit page shows filtered task runs list below form.
- **2026-07-01** — Schedules list status column uses toggle switch; runs and schedules lists have sortable column headers.
- **2026-07-01** — Runs list: row click opens read-only detail modal; removed status/trigger filters and Error column.
- **2026-07-01** — Schedules: route-based create/edit form; combined Task column; Next run column; inline status select; row click navigates to form.
- **2026-07-01** — Weekly schedule form uses multi-select day chips (`days_of_week`) instead of a single day dropdown.
- **2026-07-01** — Schedules row menu "Run now" enqueues the task via `POST /jobs/schedules/{id}/run`.
- **2026-07-01** — Initial jobs UI: Runs and Schedules sub-nav list views with schedule create/edit form.
