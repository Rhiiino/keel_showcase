# Home

Authenticated landing page with a modular card-based dashboard layout.

## Purpose

Home is the default route after login (`/`). It renders a free-form **card canvas** (greeting, rotating quotes, curated media slideshow, today's timeline events, alive timer). Each card owns its data fetching and presentation. Card positions persist in `home_card_layout` user settings; visibility toggles persist in `home_card_visibility`.

## Module type

**Shell-only feature** — index route only; nav icon exported from `auth/navItem.tsx`.

## Routes and navigation

| Path | Page | Notes |
|------|------|-------|
| `/` (index) | `HomePage` | Resolves card layout → `HomeCardCanvas` |

**Nav:** no navItem in this module — `homeNavItem` lives in `auth/navItem.tsx`.

**Registered in:** `manifest.ts` → [`app/modules/registry.ts`](../../app/modules/registry.ts).

**Auth:** shell route inside `RequireAuth` → `AppShell`.

## Backend integration

| Endpoints | Purpose |
|-----------|---------|
| `GET /home/quotes` | Quote bank for rotation |
| `GET /timeline/events` | Today's events (`start_date_from` / `start_date_to` = local today) |
| `GET /auth/me` | Current user (`contact_id` for linked profile contact) |
| `GET /contacts/{id}` | Linked contact birth date for alive timer |

Greeting font, greeting font size, quote interval, slideshow image list, card positions, and card visibility are stored via `GET/PATCH /settings` (settings module).

**`home_card_layout`** on `user_preferences.data` — `{ id, x, y }[]` pixel positions per card (validated on PATCH).

**`home_card_visibility`** — `{ [cardId]: false }` for hidden cards; omitted keys are visible. Hidden cards keep layout and per-card settings. **New OAuth users** are seeded with all cards hidden on first registration.

**Backend counterpart:** `keel_api/src/modules/home/` (quotes); prefs in `keel_api/src/modules/settings/`

## Directory structure

```
home/
├── api.ts
├── homeCards.ts        # home-owned dashboard card manifest contributions
├── routes.tsx
├── pages/              # HomePage (thin layout shell)
├── lib/
│   ├── quoteInterval.ts      # shared with settings General tab
│   └── slideshowInterval.ts  # slideshow rotation defaults
└── cards/
    ├── registry.ts        # merged card pool from enabled module manifests
    ├── lib/               # homeCardVisibility
    ├── layout/            # resolveHomeCardLayout, HomeCardCanvas, useHomeCardLayout
    ├── greeting/          # HomeGreetingCard
    ├── quotes/            # HomeQuoteCard, HomeQuoteDisplay, HomeQuoteIntervalEditor, lib/
    ├── slideshow/         # HomeSlideshowCard, HomeSlideshowDisplay, HomeSlideshowEditor, lib/
    └── alive/             # HomeAliveTimerCard, HomeAliveTimer, HomeAliveTimerCountdown, HomeAliveTimerTargetEditor, lib/
```

Journal and timeline dashboard cards live in their respective modules (`journal/homeCards/`, `timeline/homeCards/`) and register via `manifest.ts` → `homeCards`.

## Key concepts

- **Card registry** — `cards/registry.ts` merges `homeCards` from enabled module manifests (stable IDs: `greeting`, `quote`, `slideshow`, `journal-status`, `today-timeline`, `alive-timer`). Types live in `app/modules/homeCardTypes.ts`.
- **Card layout** — `cards/layout/homeCardLayout.ts` resolves registry cards with stored `{ x, y }` positions (and optional `width`/`height` for slideshow and alive timer); `HomeCardCanvas` supports drag-to-position from anywhere on a card, eight-handle resize on resizable cards, and persistence.
- **Card chrome** — Time alive and Slideshow cards hide titles and action buttons until hover (overlay pattern shared with slideshow controls). Time alive adds a bottom-left **Edit** control for targets. Timeline shows a Journal-style header row when empty (`Timeline` + plus); when events exist, an **Add an event** row sits below the list.
- **Quote interval** — `lib/quoteInterval.ts` shared bounds/defaults; edited inline on the home quote card (Settings **General** no longer exposes it).
- **Slideshow** — `home_slideshow.media_ids` in settings; inline editor on the card; auto-rotate with manual prev/next; paused state stores `paused_media_id` so refresh restores the paused slide.
- **Greeting font** — uses project appearance font keys for consistent typography with projects module.
- **Greeting font size** — hover-only stepper to the left of the font picker (− / px / +); font picker icon scales proportionally; persisted in `home_greeting_font_size_px`.
- **Alive timer** — cyclable calendar / total seconds / total days display; optional per-format targets with countdown and reach date/time (localStorage); inline editor via hover **Edit**.

## Dependencies

- **auth/api** — user display name (greeting card), `contact_id` (alive timer card)
- **settings/api** — greeting font, slideshow prefs, card positions, card visibility
- **media/api** — slideshow image metadata and content URLs
- **contacts/api** — linked contact birth date for alive timer
- **projects** — title font picker types and styling helpers
- Consumed by **settings** (greeting font configuration, home card visibility toggles)

## Maintenance guidelines

- New home-owned dashboard cards: add under `cards/{category}/`, export from `homeCards.ts` in `manifest.ts`. Feature-module cards: add under `{module}/homeCards/` and export `homeCards` from that module's manifest.
- Keep home lightweight — dashboard widgets belong here only if they are landing-specific.
- Shared quote interval logic stays in `lib/quoteInterval.ts`; do not duplicate bounds/defaults elsewhere.

## Related documentation

- [Modules umbrella README](../README.md)
- [PROJECT_TREE.md](../../PROJECT_TREE.md)
- Backend: `keel_api/src/modules/home/`

## Module changelog

- **2026-07-11** — Phase 3 registry decentralization: home-owned cards export via `homeCards.ts` + manifest; `cards/registry.ts` merges enabled manifest contributions; journal/timeline cards moved to their modules.
- **2026-07-04** — Card visibility toggles in Settings **Home Cards** tab (`home_card_visibility`); hidden cards retain layout position and per-card settings.
- **2026-07-04** — Timeline card empty state uses a Journal-style **Timeline** row with plus; populated state adds an **Add an event** row below today's events.
- **2026-07-03** — Time alive card adds per-format targets with countdown, reach date/time, and hover **Edit** editor; targets stored in localStorage and clear when reached.
- **2026-07-03** — Greeting card adds hover-only font size stepper; size and font picker scale together; persisted in `home_greeting_font_size_px`.
- **2026-07-03** — Timeline card times use styled badges; alive timer calendar and total-days modes use larger type that still scales on resize.
- **2026-07-03** — Slideshow while paused syncs `paused_media_id` to the currently viewed slide on manual navigation (debounced save of the most recent slide).
- **2026-07-03** — Quote display time edited inline on the quote card; removed from Settings General tab.
- **2026-07-03** — Time alive and Slideshow cards use hover-only headers/controls; slideshow manual navigation no longer resets when metadata refreshes.
- **2026-07-03** — Slideshow and Time alive cards resize from all edges/corners; slideshow navigation pauses while the card is dragged.
- **2026-07-03** — Home cards drag from anywhere on the card surface (no separate handle); short click/tap still activates in-card controls.
- **2026-07-03** — Draggable home card canvas with `home_card_layout` positions persisted in settings.
- **2026-07-03** — Home slideshow card: curated media images from settings, auto-rotate with manual controls, inline editor.
- **2026-07-02** — Alive timer card (digital-clock UI, three cyclable display modes) below timeline; birth date from user's linked contact via `auth/me.contact_id`.
- **2026-06-27** — Journal status card shows consecutive-day streak between title and completion checkmark.
- **2026-06-27** — Journal status card on home (checkmark when today's entry has content); timeline card title is "Timeline".
- **2026-06-27** — Modular card architecture: registry, layout resolver, categorized card folders; HomePage is a thin shell.
- **2026-06-27** — Home page lists today's timeline events below quotes; row click opens event form at `/timeline/:eventId`.
- **2026-06-15** — Initial module manifest.
