# Timeline

Life events list, calendar views, and forms — track milestones with contacts, figures, and colored label tags.

## Purpose

Timeline lets users record life events (single day or date range), tag contacts and figures, assign colored label tags, and add free-text subject names for people not in the CRM. Calendar and Events tabs share the same `/timeline/events` API.

## Module type

**Feature** — routes, nav, and API.

## Routes and navigation

| Path | Page | Notes |
|------|------|-------|
| `/timeline` | `TimelinePage` | Events tab — list with collapsible filters (tags, contacts, figures, event text), plus button |
| `/timeline/calendar` | `TimelineCalendarPage` | Calendar tab — FullCalendar + collapsible filters; merges events and plan items |
| `/timeline/plan` | `TimelinePlansPage` | Plan tab — list of bounded-period plans |
| `/timeline/plan/new` | `TimelinePlanCreatePage` | New plan form |
| `/timeline/plan/:planId` | `TimelinePlanDetailPage` | Plan detail form + embedded plan items list + item modal |
| `/timeline/tags` | `TimelineTagsPage` | Tags tab — searchable list with inline rename, description, color picker, and pagination |
| `/timeline/new` | `TimelineCreatePage` | Empty form → POST |
| `/timeline/:eventId` | `TimelineEventPage` | Detail form → PATCH; delete at bottom |

**Nav:** registered — id `timeline`, title Timeline, href `/timeline`, icon `assets/nav_icons/timeline.png`, accent blue.

**Sub-nav:** Calendar (`/timeline/calendar`) · Events (`/timeline`) · Plan (`/timeline/plan`) · Tags (`/timeline/tags`) — see `subNav.tsx`, `TimelineModuleLayout.tsx`.

**Registered in:** `manifest.ts` → [`app/modules/registry.ts`](../../app/modules/registry.ts).

**Auth:** shell routes inside `RequireAuth` → `AppShell`.

## Backend integration

| Area | Endpoints |
|------|-----------|
| Tags | `GET/POST /timeline/tags`, `PATCH/DELETE /timeline/tags/{id}` |
| Events | `GET/POST /timeline/events`, `GET/PATCH/DELETE /timeline/events/{id}` |
| Plans | `GET/POST /timeline/plans`, `GET/PATCH/DELETE /timeline/plans/{id}`, `GET/POST /timeline/plans/{id}/items` |
| Plan items | `GET/PATCH/DELETE /timeline/plan-items/{id}`, `POST .../reorder`, `POST .../promote`, `POST .../link-event` |
| Calendar feed | `GET /timeline/calendar?start=&end=` |
| Media (via media module) | `GET /media/by-entity/timeline_event/{id}`; attach with `POST /media/{id}/attachments` (`entity_type: timeline_event`, `role: gallery`) |

**List filters:** `contact_id`, repeatable `contact_ids` (OR), `figure_id`, repeatable `figure_ids` (OR), `subject_name`, `query`, optional `start_date_from` / `start_date_to` for calendar visible-range loading, optional repeatable `tag_ids` (OR — match any selected tag).

**Backend counterpart:** `keel_api/src/modules/timeline/`

## Directory structure

```
timeline/
├── TimelineModuleLayout.tsx  # ModuleSubNavLayout wrapper
├── subNav.tsx                # Calendar · Events · Plan · Tags tabs
├── api.ts
├── homeCards.ts              # dashboard card manifest contributions
├── homeCards/                # Today's Timeline home dashboard card
│   ├── HomeTodayTimelineCard.tsx
│   ├── HomeTodayEvents.tsx
│   └── lib/                  # homeTodayEvents
├── navItem.tsx
├── routes.tsx
├── components/
│   ├── browse/       # TimelineListView, TimelineListRow, TimelineEventsFilters
│   ├── calendar/     # TimelineFullCalendar, modals, filters, plan-item styling
│   ├── filters/      # TimelineFiltersPanel, TimelineEventFilterFields
│   ├── forms/        # TimelineEventForm, TimelineEventEditorPanel, ...
│   ├── plans/        # Plan list/detail forms, plan items list, item modal
│   ├── tags/         # TimelineTagsListView, TimelineTagListRow, ...
│   ├── ContactMultiSelect.tsx
│   ├── FigureMultiSelect.tsx
│   ├── TimelineMediaCarousel.tsx
│   ├── TimelinePeopleAvatars.tsx
│   └── TimelinePersonCircle.tsx
├── hooks/            # useTimelineCalendarRange, useTimelineEventEditor, useTimelinePlanEditor, useTimelinePlanItemEditor, useTimelinePlanItemListReorder
├── lib/              # timelineDisplay, timelinePlanDisplay, timelinePlanItemSortOrder, timelineCalendarEvents, ...
└── pages/            # TimelinePage, TimelineCalendarPage, TimelinePlansPage, TimelinePlanDetailPage, ...
```

## Key concepts

- **Contact tagging** — `contact_ids` on create/update; junction table on backend.
- **Label tags** — user-defined colored tags via `/timeline/tags`; optional description on the tag catalog; assign on event forms with `tag_ids`; manage catalog on Tags sub-nav list (inline rename, description, color picker, search, pagination).
- **People column** — profile circles (photo or compact name) per linked contact and optional subject name; hover for full name.
- **Events tab** — collapsible filter panel (tags, people, event text search); new-event plus in page header; list rows show compact tag pills under the event description.
- **Tags tab** — searchable paginated list; inline name and description edit and color wheel per row; Events column with assignment count; plus button adds a draft row for new tags.
- **Calendar tab** — FullCalendar v6; collapsible filter panel (tags, people); hover an event for date, tag pills, full text, and contact avatars; click event → edit modal; plan items shown with dashed styling; click plan item → plan detail page; day view shows a page-header plus button → create modal with start date pre-filled.
- **Plan tab** — list of plans (title, date range, notes); detail page with save/discard for plan fields and embedded plan items list; bottom add row creates items inline (today, all-day defaults); drag grip column reorders items with insert-line preview; cells edit in place (schedule popover for dates, all-day, tags, status); row background or **View** menu opens item modal; promote to timeline event when not yet linked.
- **Event media** — multiple files per event via unified attachments (`timeline_event` / `gallery`); shop-style carousel on create/edit forms only.
- **Reminders** — optional notification offsets (minutes, hours, or days before start) on create/edit forms; calendar hover preview lists configured reminders.
- **Home card** — `homeCards/` exports the Today's Timeline dashboard card (`today-timeline` id) via `manifest.ts` → `homeCards`.

## Dependencies

- **home/cards/layout/constants** — shared content width class for home dashboard card chrome
- **contacts/api** — `fetchContacts`, `formatContactName` (API only, not components)
- **media** — `MediaPickerPagination`, `useConfirmDeleteAction`, `ConfirmTrashButton`, `fetchEntityAttachments`, upload/attach helpers
- **shop** — `CardMenu` for row overflow menu; `ShopMediaCardMenu`, `ShopMediaLightbox` for event media carousel
- **projects/hooks** — `usePageFileDrop`, `usePagePaste` for form drag-and-drop upload
- **@fullcalendar/** — calendar grid (react, core, daygrid, timegrid, list, interaction)

## Related documentation

- [Modules umbrella README](../README.md)
- [PROJECT_TREE.md](../../../PROJECT_TREE.md)
- Backend: [keel_api/src/modules/timeline/README.md](../../../../keel_api/src/modules/timeline/README.md)

## Module changelog

- **2026-07-11** — Home dashboard Today's Timeline card moved from `home/cards/timeline/` to `timeline/homeCards/`; registers via manifest `homeCards`.
- **2026-07-05** — Timeline planner: Plan sub-nav at `/timeline/plan` (list, detail, item modal, promote); calendar merges plan items with dashed styling; plan detail item list drag reorder with insert-line preview; bottom add row and inline cell editing on plan items list; plan detail uses side-by-side form and scrollable items panel.
- **2026-07-01** — Event reminder offsets on shared create/edit form (`TimelineEventRemindersField`); hover preview shows reminder summary.
- **2026-06-24** — Initial timeline module (list, create, detail, nav icon).
- **2026-06-24** — Add `TimelineModuleLayout` for AppShell content padding and centering.
- **2026-06-24** — People column and contact picker use profile circles with tooltips.
- **2026-06-25** — Event form media carousel (gallery attachments via unified media API).
- **2026-06-27** — Calendar and Events sub-nav; FullCalendar page at `/timeline/calendar`; range-filtered list API for calendar loading; calendar event edit modal; contact avatars on calendar events.
- **2026-06-27** — Colored label tags: tag manager on Events list, inline assignment on forms, list row pills, calendar header filter.
- **2026-06-27** — Events list collapsible filter panel (tags, people, event text); shared filter fields with calendar.
- **2026-06-27** — Filter people picker uses profile circles with plus add and removable selected contacts (same style as event form).
- **2026-06-27** — Event form start/end fields use `datetime-local` inputs; list and calendar show times when set.
- **2026-06-27** — Tags sub-nav at `/timeline/tags`; searchable paginated list with inline rename, color picker, and row delete; removed Events header tag manager modal.
