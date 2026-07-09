# C.O.A.K.

**C**ulmination **o**f **a**ll **K**nowledge — learning workspaces with a directory tree and 3D constellation graph.

## Purpose

Each **Coak record** is a topic to learn. Inside a record, users manage a hierarchical directory of folders, notes, and flash cards — any item may optionally attach a file via `media_id`. The Constellation panel renders directory-visible items as nodes; the origin sphere represents the record. Directory structure and folder expansion drive which nodes and edges appear in the graph.

## Module type

**Feature** — session-required UI with API client.

## Routes and navigation

| Path | Page |
|------|------|
| `/coak` | Record list and create |
| `/coak/:recordId` | Constellation + Directory workspace |

- **Nav id:** `coak`
- **Nav href:** `/coak`
- **Icon:** `assets/nav_icons/coak.png`
- **Registered in:** [`manifest.ts`](manifest.ts) → [`app/modules/registry.ts`](../../app/modules/registry.ts)

## Backend integration

API client: [`api/`](./api/)

| Concern | Endpoints |
|---------|-----------|
| Records | `GET/POST /coak/records`, `GET/PATCH/DELETE /coak/records/{id}` |
| Items | `GET/POST /coak/records/{id}/items`, `PATCH/DELETE .../items/{item_id}` (optional `tag_ids`) |
| Tags | `GET/POST /coak/records/{id}/tags`, `PATCH/DELETE .../tags/{tag_id}` |
| Layout state | `GET/PATCH /coak/records/{id}/workspace-state` |
| Panel settings | `GET/PATCH /coak/records/{id}/workspace-settings` |
| Configuration | `GET/PATCH /coak/records/{id}/configuration-settings` |
| File attachment | `POST /media` then `PATCH` item `media_id`; replace via `PUT /media/{id}/content`; detach via `PATCH` with `media_id: null` |

Query keys: `coakQueryKeys` in [`api/queryKeys.ts`](./api/queryKeys.ts)

## Directory structure

```
coak/
├── api/
│   ├── types.ts
│   ├── queryKeys.ts
│   ├── records.ts
│   ├── items.ts
│   ├── tags.ts
│   ├── workspace.ts
│   └── index.ts
├── components/
│   ├── cards/
│   │   └── CoakRecordCard.tsx
│   ├── panels/                    # Shared workspace window chrome (not tab-specific)
│   │   ├── CoakDraggablePanel.tsx
│   │   ├── CoakPanelResizeHandles.tsx
│   │   ├── CoakWorkspaceWindow.tsx
│   │   ├── CoakWorkspaceWindows.tsx
│   │   ├── CoakWorkspaceTabBar.tsx
│   │   ├── CoakWorkspaceTabContent.tsx
│   │   ├── CoakWorkspaceTabDragPreview.tsx
│   │   └── CoakWorkspaceTabIcons.tsx
│   ├── panels/                    # Shared window drag/resize
│   ├── search/
│   │   └── CoakNodeSearchInput.tsx
│   ├── tags/
│   │   ├── CoakTagPill.tsx
│   │   ├── CoakItemInlineTags.tsx
│   │   ├── CoakTagListRow.tsx
│   │   └── CoakTagsListView.tsx
│   └── tabs/                      # One folder per workspace tab
│       ├── constellation/
│       │   ├── index.ts           # Tab entry barrel
│       │   ├── CoakConstellationTab.tsx
│       │   ├── CoakConstellationLoadingOverlay.tsx
│       │   ├── CoakConstellationGraphReadyContext.tsx
│       │   ├── CoakConstellationSearchBar.tsx
│       │   ├── CoakConstellationBreadcrumb.tsx
│       │   ├── graph/             # Includes CoakGraphNodeContextMenuIcons, OptimizeSubmenu
│       │   ├── node-visuals/
│       │   └── modals/
│       ├── general/
│       │   ├── index.ts
│       │   ├── CoakGeneralTab.tsx
│       │   └── CoakRecordInlineTitle.tsx
│       ├── directory/
│       │   ├── index.ts
│       │   ├── CoakDirectoryTab.tsx
│       │   ├── CoakDirectoryRow.tsx
│       │   ├── CoakDirectoryRowMenu.tsx
│       │   ├── CoakDirectorySearchBar.tsx
│       │   └── (file controls via row menu File submenu)
│       ├── tags/
│       │   ├── index.ts
│       │   └── CoakTagsTab.tsx
│       ├── shared/
│       │   └── CoakItemFileMenu.tsx
│       └── settings/
│           ├── index.ts
│           ├── CoakSettingsTab.tsx
│           ├── CoakSettingsSectionCard.tsx
│           ├── CoakAutoOptimizeSettingsSection.tsx
│           ├── CoakAutoOptimizeToggle.tsx
│           ├── CoakAutoOptimizeConnectionDistanceSlider.tsx
│           ├── CoakBackgroundPresetPicker.tsx
│           ├── CoakConnectionColorToggle.tsx
│           ├── CoakConnectionWidthSlider.tsx
│           ├── CoakOriginPulseToggle.tsx
│           ├── CoakTitleColorToggle.tsx
│           ├── CoakNodeVisualPreviewRowCanvas.tsx
│           ├── CoakNodeVisualSettingsSection.tsx
│           └── CoakNodeVisualStylePicker.tsx
├── context/
│   ├── index.ts                   # Barrel: provider, hook, public types
│   ├── coakWorkspaceTypes.ts      # Context value and session types
│   ├── CoakRecordWorkspaceContext.tsx  # Thin provider composition
│   └── state/                     # Internal workspace state hooks
│       ├── useCoakWorkspaceData.ts
│       ├── useCoakItemMutations.ts
│       ├── useCoakItemEditorState.ts
│       ├── useCoakWorkspaceSearchState.ts
│       ├── useCoakGraphSessions.ts
│       ├── useCoakNodePositioning.ts
│       └── useCoakItemActions.ts
├── hooks/
│   ├── useCoakTagCatalog.ts
│   ├── panels/                    # index.ts barrel
│   ├── workspace/                 # index.ts barrel
│   └── tabs/                      # Tab-specific hooks (mirrors components/tabs/)
│       ├── constellation/         # index.ts barrel
│       └── directory/             # index.ts barrel
├── lib/
│   ├── coakItemKindRegistry.ts    # Single source for item kinds (labels, flags, preview/search)
│   ├── panels/                    # index.ts barrel; coakWorkspaceLayoutModel + Ops split
│   ├── workspace/                 # index.ts barrel
│   ├── coakMultiSelect.ts
│   ├── coakRecordSearch.ts
│   ├── coakTagDisplay.ts
│   ├── coakTagSearch.ts
│   └── tabs/                      # Tab-specific helpers (index.ts per tab)
│       ├── constellation/         # coakVec3, coakSiblingPositions, coakOptimizeLayout, coakColorUtils
│       ├── directory/
│       └── settings/
├── pages/
│   ├── CoakRecordsPage.tsx
│   └── CoakRecordPage.tsx
├── navItem.tsx
├── routes.tsx
└── README.md
```

Add new workspace tabs under `components/tabs/{tabId}/` with matching `hooks/tabs/` and `lib/tabs/` folders when needed. Add an `index.ts` barrel per tab folder. Shared window infrastructure stays in `components/panels/`, `hooks/panels/`, and `hooks/workspace/`. Extend workspace behavior via `context/state/` hooks rather than growing the provider file.

## Dependencies

- `@react-three/fiber`, `@react-three/drei`, `three`
- `media` module — file upload, media source/picker dialogs, delete confirmation pattern
- Platform [`KeelPersonaPlayer`](../../components/keelPersona/) — constellation loading overlay ([`INTEGRATION.md`](../../components/keelPersona/INTEGRATION.md))

## Key concepts

### Auto-optimize layout

Settings key `auto_optimize_layout` (boolean, default off) in per-record configuration settings. When enabled:

- Constellation node drag, editor drag, Optimize, and Rotate are disabled; pan, click-to-open, and Reveal remain available.
- The full item tree is re-laid out automatically when the toggle is turned on or when hierarchy changes (add, delete, reparent).
- Origin direct children use even 3D sphere-shell spacing when there are two or more; a single root child extends straight from the origin.
- All other parents place an only child inline at 180° (continuing the incoming link); two or more children use configurable branch angles (default 120°) with even spacing.
- Connection distance is configurable via `auto_optimize_connection_distance` (default matches `COAK_CHILD_ORBIT_RADIUS`).
- Sibling branch angle is configurable via `auto_optimize_connection_angle` (0–180°, default 120°; applies only when a parent has two or more children).

### Adding a new item kind

1. Add the kind to `COAK_ITEM_KINDS` in [`lib/coakItemKindRegistry.ts`](./lib/coakItemKindRegistry.ts) with metadata (label, flags, preview/search helpers).
2. Add a modal body component under `components/tabs/constellation/modals/` and wire it in `CoakItemEditorModal`.
3. Update backend `COAK_ITEM_KINDS`, migration CHECK constraint, and kind-defaults map in `service/items.py`.
4. Extend directory/graph **Add** menus if the kind can be created as a child.

## Module changelog

- **2026-07-08** — Constellation loading overlay — WebGL graph unmounts until overlay fade begins so persona clips are not competing with scene setup; overlay dismisses on data load (not graph first paint).
- **2026-07-08** — Constellation loading overlay — random Keel Persona clip via `useRandomKeelClip()` while the graph loads (remounts per record via overlay `key`).
- **2026-07-05** — Tags tab — Description column with inline edit between Name and Nodes; wider Color column spacing.
- **2026-07-04** — Settings — node visual picker adds a ring style (hollow circle with in-node title; node color tints the border; connections meet at the ring edge).
- **2026-07-04** — Tags workspace tab — record-scoped tag catalog (color, name, node count, delete confirm); inline tag assignment on item modals and directory rows; colored tag pills under constellation node labels.
- **2026-07-04** — Constellation — hovered or focused item editor modals stack above other modals (floating and pinned).
- **2026-07-04** — Constellation — right-click on floating or pinned item editor modals opens the graph node context menu (inputs and buttons keep native behavior).
- **2026-07-04** — Constellation — window header lineage breadcrumb from origin when exactly one node is selected; click any ancestor to navigate; hidden during multi-select.
- **2026-07-03** — Settings — constellation background adds **Rainy night** preset with layered falling rain over a black gradient.
- **2026-07-03** — Settings — constellation background adds **Stormy sky** preset with intermittent lightning flashes over a dark storm gradient.
- **2026-07-03** — Removed `file` item kind; optional `media_id` attachment on folder/note/flash; unified item modals (title → preview → body); File submenu on directory rows, graph context menu, and modal headers; `coakItemKindRegistry` for scalable kind metadata.
- **2026-07-03** — Constellation — right-click empty canvas (when pins exist) opens a context menu with **Unpin all nodes**; per-node **Pin** submenu unchanged (Pin self, Pin/Unpin children for immediate children only); pinned nodes show in a scrollable left-side dock panel (newest at top) with corner unpin badges on each modal and a pin badge on the graph sphere; pin state persists in workspace state (`pinned_item_ids`).
- **2026-07-03** — Constellation — pill-shaped title search overlay on the canvas; live search focuses matches with a result navigator (current/total, prev/next) that orbits the constellation to each match.
- **2026-07-03** — Settings — **Origin pulse** toggle in Connection appearance; stored in configuration settings (`origin_pulse`, default on).
- **2026-07-02** — Constellation — graph node context menu adds **Delete** (two-step confirm, trash icon) for all nodes except the origin.
- **2026-07-02** — Settings — **Always show node editors** toggle keeps every constellation item editor modal visible at all times.
- **2026-07-02** — Constellation — graph node context menu adds **Swap** to exchange visual positions with a highlighted sibling (subtrees move together; hierarchy unchanged); auto-optimize uses sibling order swap.
- **2026-07-02** — Constellation — graph node context menu adds **Move** to reparent a node by clicking a highlighted folder or origin; click elsewhere to cancel; auto-optimize re-layouts after the move when enabled.
- **2026-07-02** — Settings — auto-optimize layout adds a connection angle slider (0–180°, default 120°) for sibling branch placement; only-child inline 180° unchanged.
- **2026-07-02** — Settings — section cards group connection appearance, auto-optimize layout, and node visuals; auto-optimize adds a connection distance slider.
- **2026-07-02** — Settings — **Auto-optimize layout** toggle locks constellation node movement and re-layouts the tree on structure changes (sphere at origin, 120° branches elsewhere).
- **2026-07-07** — Constellation loading overlay — centered **Baking a 3-tier cake** Keel Persona animation + quip on scrim while items load or graph paints; fades out when the graph is ready; see [`INTEGRATION.md`](../../components/keelPersona/INTEGRATION.md).
- **2026-07-02** — Settings — node visual previews use one shared Canvas per item kind so WebGL context limits no longer blank the File row.
- **2026-07-02** — Settings — node visual picker adds a striped sphere style alongside folder, note, and wire spheres.
- **2026-07-02** — Settings — info icon beside each setting title with hover tooltip explanations (`CoakSettingsInfoIcon`, `coakSettingsInfoCopy`).
- **2026-07-02** — Settings — **Enlarge editors on hover** toggle in Constellation editors section; stored in configuration settings (`item_editor_enlarge`, default on).
- **2026-07-02** — Settings — constellation background preset picker (black, gray, or dark green gradient); stored in configuration settings.
- **2026-07-02** — Settings — node visual picker adds a wireframe sphere style alongside folder and note spheres.
- **2026-07-02** — Settings — per item kind, pick constellation node visual (folder sphere or note sphere) with 3D previews; stored in configuration settings.
- **2026-07-04** — Constellation — note node right-click menu adds **Promote to folder** (same as Directory tab).
- **2026-07-04** — Constellation — folder editor **Contents** rows support inline rename, two-step delete (trash then confirm), and an add row for folder/note/flash; new children appear on the graph and focus their title for editing (floating and pinned modals).
- **2026-07-04** — Folder editor **Contents** and Directory tab — drag rows to reorder among siblings; lime insert-line preview while dragging (nav-bar style); title edit and delete still work on inputs and action buttons.
- **2026-07-03** — Constellation — folder item editor **Contents** rows select the child (same as Directory tab): replaces the parent editor, expands ancestor folders when needed, and orbits the canvas.
- **2026-07-02** — Directory — note row overflow menu adds **Promote to folder**; promoted notes become folder rows with Add/upload actions.
- **2026-07-02** — Reorganized workspace tabs into `components/tabs/`, `hooks/tabs/`, and `lib/tabs/` (`constellation`, `general`, `directory`, `settings`); shared window chrome stays in `panels/` and `workspace/`.
- **2026-07-02** — Workspace windows — Constellation, General, Directory, and Settings are tabs in draggable/resizable windows; tear out, reorder, and dock tabs or window headers; first open uses one combined window; layout persists in workspace settings.
- **2026-07-02** — Constellation Optimize — repositions only a node's direct children; each moved child carries its descendants along (same as manual drag).
- **2026-07-02** — Directory — row checkbox beside the options menu toggles multi-select without Command/Ctrl.
- **2026-07-02** — Constellation — note, file, and flash nodes share the same sphere visual; origin and folder nodes keep their distinct looks.
- **2026-07-03** — Constellation Reveal submenu — Immediate expands one folder level (collapsing stale expanded child folders so only direct children appear) and opens their editors; Lineage expands every nested folder and opens all descendant editors. Minimize collapses a folder (or root folders on origin) and closes hidden descendant editors.
- **2026-07-02** — Constellation Reveal — expands a collapsed folder (one level) so immediate children appear on the graph, then opens their item editors.
- **2026-07-02** — Directory tab — pill-shaped live search between create buttons and tree; matches highlight rows, open the item editor, and orbit the constellation for a single match; multiple matches highlight all rows without camera pan; canvas dismiss is blocked until search is cleared.
- **2026-07-02** — Directory — folder row menu adds nested **Add** submenu; tree child rows indent by depth.
- **2026-07-01** — Flash card items — pulsing constellation sphere, directory create button and note-like rows, flip-card editor modal (front prompt / back answer).
- **2026-07-01** — Constellation node drag — press X/Y/Z while dragging to lock movement to a world axis (Blender-style grab); scroll wheel moves along the locked axis; colored rail guide while constrained.
- **2026-07-01** — Directory note rows — truncated note-body preview replaces the type label under the title.
- **2026-07-01** — Origin constellation node — larger luminous core with smooth pulsing corona.
- **2026-07-01** — Folder constellation nodes — translucent colored spheres (replacing wireframe).
- **2026-07-01** — Settings tab — constellation connection color picker (Focus palette); stronger parent→child connection gradient.
- **2026-07-01** — Workspace panel General tab — edit record name and origin color before Directory and Settings tabs.
- **2026-07-01** — Constellation panel renamed from Focus; free aspect resize from edges and corners; panel id `constellation` (legacy `focus` settings migrate on read).
- **2026-07-01** — Record hub uses standard shell layout (`AppShellContent`, `max-w-6xl`), Focus-style card grid, search, and plus-button create flow.
- **2026-07-01** — Reorganized `components/`, `hooks/`, and `lib/` into domain subfolders (`directory`, `graph`, `node-visuals`, `panels`, `modals`, `workspace`); removed deprecated `CoakViewContext`.
- **2026-07-01** — Full backend integration: record hub, workspace at `/coak/:recordId`, directory CRUD, 3D graph from hierarchy, workspace preferences.
- **2026-07-01** — Focus panel uses a soft black gradient backdrop instead of the dot-grid canvas.
- **2026-07-01** — Resizable Focus and Directory panels with click-to-front stacking.
- **2026-07-01** — Focus graph filters to directory-visible items; auto-layout with optional drag/reel repositioning and persistence.
- **2026-07-01** — CRT-styled item editor modal anchored at the selected Focus node (notes, folders, image files); removed workspace background note editor.
