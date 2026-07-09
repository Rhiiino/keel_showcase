# Media

Garage-backed file storage browser for the signed-in user.

## Purpose

Media surfaces every non-deleted `media_objects` row owned by the current user — list and carousel views of uploaded files in object storage (ready and pending).

## Module type

**Feature** — routes, nav, and API.

## Routes and navigation

| Path | Page | Notes |
|------|------|-------|
| `/media` | `MediaPage` | Root folder — list or carousel |
| `/media/folders/:folderId` | `MediaPage` | Nested folder contents |
| `/media/panels` | `MediaPanelsListPage` | Display panel list or carousel |
| `/media/panels/:panelId` | `MediaPanelPage` | Curated grid panel view |
| `/media/new` | `MediaCreatePage` | Upload form with auto-filled metadata |
| `/media/:mediaId` | `MediaDetailPage` | Detail form for one stored file |

**Nav:** registered — id `media`, title Media, href `/media`, accent blue, icon `assets/nav_icons/media.png`.

**Module sub-nav:** `MediaModuleLayout` renders secondary tabs (Media, Panels) on all media routes via `subNav.tsx` + shared `ModuleSubNavLayout`. The Panels tab restores only `/media/panels` (not last-opened panel detail) so deleted panels do not break tab navigation. Add future sections by extending `mediaModuleSubNavItems` and nesting routes under `mediaShellRoutes`.

**Registered in:** `manifest.ts` → [`app/modules/registry.ts`](../../app/modules/registry.ts).

**Auth:** shell routes inside `RequireAuth` → `AppShell`.

## Backend integration

| Area | Endpoints |
|------|-----------|
| Contents | `GET /media?folder_id=` → folders + files at one scope with breadcrumbs |
| Flat list | `GET /media/all` → all user media (image picker) |
| Folders | `POST /media/folders`, `PATCH /media/folders/{id}`, `DELETE /media/folders/{id}` |
| Upload | `POST /media` multipart file upload (optional `folder_id`) |
| Rename / move | `PATCH /media/{media_id}` with `original_filename` and/or `folder_id` |
| Replace content | `PUT /media/{media_id}/content` multipart file (+ optional `original_filename`) |
| Delete | `DELETE /media/{media_id}` when unattached |
| Attachments | `GET /media/{media_id}/attachments` list entity links for one file |
| Panels | `GET/POST /media/panels`, `GET/PATCH/DELETE /media/panels/{id}`, `POST /media/panels/{id}/items`, `POST /media/panels/{id}/items/swap`, `PATCH /media/panels/{id}/items/{item_id}`, `PUT /media/panels/{id}/layout`, `DELETE /media/panels/{id}/items/{item_id}` |

**Backend counterpart:** `keel_api/src/modules/media/`

## Directory structure

```
media/
├── api.ts
├── MediaModuleLayout.tsx
├── navItem.tsx
├── routes.tsx
├── subNav.tsx
├── components/
│   ├── browse/        # List/carousel browser: MediaListView, MediaCarouselView, MediaCarouselCard, MediaListRow, MediaFolderRow, MediaBreadcrumbs, MediaViewToggle, MediaPasteUploadDialog
│   ├── forms/         # Create/detail form chrome: MediaForm, MediaFormVideoPreview, MediaFormPageLayout, MediaInlineTitle, MediaMetadataPanel
│   ├── attachments/   # Entity attachment listing: MediaAttachmentListView, MediaAttachmentListRow
│   ├── pickers/       # Cross-module dialogs: MediaObjectPickerDialog (folder browse), MediaFolderDestinationPicker (paste upload folder target), MediaImagePickerDialog, MediaPickerBreadcrumbs, MediaPickerFolderRow, MediaPickerPagination, MediaSourceChoiceDialog
│   ├── panels/        # Display panel list/grid, tile context menu, split inline picker
│   └── shared/        # MediaPreview + actions/ (Confirm*/MediaDownloadButton/MediaPreviewCopyButton) + icons/ (MediaFolderIcon, MediaKindIcon)
├── hooks/             # useMediaBlobObjectUrl, useMediaFileFolderDrag, useMediaPasteUpload, useMediaPanelGridResize, useMediaPanelViewportHeight
├── lib/               # Status labels, byte size, browse items, view preference, panel grid/reflow/edge-append/view helpers
└── pages/             # MediaPage, MediaCreatePage, MediaDetailPage, MediaPanelsListPage, MediaPanelPage
```

Each `components/` subfolder exposes a barrel `index.ts`; import from the folder (e.g. `../components/browse`) rather than individual files.

## Key concepts

- **List scope** — `status <> 'deleted'` (ready + pending); hard-deleted rows are absent. List shows only the current user's objects.
- **Folders** — nested `media_folders` with breadcrumb navigation at `/media/folders/:folderId`; list and carousel views support dragging files and folders onto folder cards/rows or ancestor breadcrumbs to move, hover-opening folders during drag, inline folder rename/delete, cumulative folder sizes, and bottom-row folder creation (list only).
- **List actions** — list view ends with a split `Add folder` / `Upload file` row; the upload picker accepts multiple files and uploads them in one batch, and file/folder names save inline on Enter. List view paginates folders and files together with picker-style controls in the table section header row (`MediaListView`).
- **Display panels** — curated grid boards at `/media/panels` (list or carousel) and `/media/panels/:panelId`; list/carousel previews render the full panel grid; list view supports inline panel rename; right-click tile menu with color swatches and a Focus-style icon row (two-step delete, details, view, swap); scroll-to-zoom persists per tile; bottom-edge grip resizes panel height with grid rows scaling to fill the viewport (persisted per panel in localStorage); edit mode supports inline split-add picker, add/remove, eight-direction elastic resize with neighbor reflow, batch layout saves, hover add zones on all four edges (top/left/right compress existing tiles; bottom extends the grid), and a centered empty-state add affordance.
- **View modes** — `/media` and `/media/panels` persist a List/Carousel preference locally; media browse shows folders and files at the current scope, while the panels list carousel centers the active panel preview with horizontal scroll. App-wide paste/drop opens `MediaPasteUploadDialog` with preview, editable filename, and `MediaFolderDestinationPicker` (defaults to the browse folder on `/media` and `/media/folders/:id`; new folders are drafted locally and created only on confirm).
- **Cross-navigation** — shop, projects, merchant logo, and contact photo UIs expose **View media** actions that open `/media/:mediaId` on this detail form.
- **Shared selection** — entity forms can offer a compact source menu: select an existing ready image from Media with live search, or upload a local file. The object picker (`MediaObjectPickerDialog`) browses media folders with breadcrumb navigation, searchable folder and file rows (folders are navigation-only), and sticky multi-select across folder levels.
- **Detail replace** — click or drag on the preview to stage a replacement file; Save commits via `PUT /media/:id/content`, Discard reverts.
- **Copy file** — detail and create form previews show a top-right copy button that copies the stored or staged file to the system clipboard (checkmark feedback on success).

## Dependencies

- Shared app shell and `lib/api.ts`

## Related documentation

- [Modules umbrella README](../README.md)
- [PROJECT_TREE.md](../../PROJECT_TREE.md)
- Backend: `keel_api/src/modules/media/`

## Module changelog

- **2026-07-09** — `useConfirmDeleteAction` moved to `src/hooks/`; `MediaCardMenu` and `MediaLightbox` imported from `src/components/` (no finance cross-imports).
- **2026-06-23** — Media detail/create form preview adds a persistent top-right copy button that copies the file to the clipboard with copied feedback.
- **2026-06-22** — Media module accepts drag-and-drop file uploads anywhere in the module with the same confirmation dialog as paste (title reads "Add dropped file").
- **2026-06-20** — Module secondary nav (Media / Panels tabs) on all routes via `MediaModuleLayout`; removed header panels shortcut button; sub-nav remembers last page per section in localStorage.
- **2026-06-20** — Remove panel page full-screen mode and its overlay shell; panel pages stay in the standard scrollable route view.
- **2026-06-20** — Media browse carousel supports drag-to-folder moves for files and folders with list-style drag previews, breadcrumb drop targets, hover-open folders, and horizontal auto-scroll while dragging.
- **2026-06-20** — Panels list adds carousel view with full-grid previews, header view toggle, scaled list previews, and inline panel rename.
- **2026-06-20** — Panel edit mode adds hover plus zones on top, left, and right; those edges compress tiles in-place while bottom append still grows the grid.
- **2026-06-20** — Panel tile context menu action row matches Focus constellation icon layout (delete confirm, details, view, swap).
- **2026-06-20** — Panel elastic vertical resize moves entire row bands together so side-by-side tiles extend or shrink in sync and tiles below yield height.
- **2026-06-20** — Restore panel bottom-edge viewport height drag; grid rows scale to fill the resized viewport (localStorage per panel).
- **2026-06-20** — Panel grid drops bottom-edge viewport drag; edit mode uses a fixed bottom add zone plus centered empty-state add button.
- **2026-06-20** — Panel viewport open area shows a plus button in edit mode; added files fill the visible gap below existing tiles.
- **2026-06-20** — Panel tiles: right-click context menu, border colors, swap animation, inline split-add picker; view metadata via menu instead of left-click flip.
- **2026-06-20** — Panel grid viewport supports bottom-edge height drag with a first-row minimum, persisted per panel, without resizing tile images.
- **2026-06-20** — Media browse page accepts pasted files in list and carousel views with a confirmation dialog, preview, and editable filename before upload.
- **2026-06-20** — Add media display panels: list page, grid panel view, flip-card tiles, elastic resize, and Media page header entry button.
- **2026-06-20** — Panel page polish: continuous resize drag, icon toolbar, floating add button, rounded tiles, styled flip metadata.
- **2026-06-20** — Panel edit split-add hover zones and gap-aware resize metrics; backend add-item `layout_updates`.
- **2026-06-20** — Panel tile scroll-to-zoom with persisted preview scale/focal point per item.
- **2026-06-20** — Reorganized `components/` into `browse/`, `forms/`, `attachments/`, `pickers/`, and `shared/` (with `actions/` and `icons/`) subfolders, each with a barrel `index.ts`.
- **2026-06-20** — Nested media folders with breadcrumbs, folder rows in list/carousel, list drag-to-folder move, and scoped uploads.
- **2026-06-20** — List drag now turns media breadcrumbs into animated drop targets for moving files to ancestor folders or root.
- **2026-06-20** — Media list rows add inline rename, folder delete, thumbnail drag previews, and a bottom-row Add folder / Upload file workflow.
- **2026-06-20** — Folder rows display cumulative subtree size, and list download icons render without a surrounding container.
- **2026-06-20** — Dragging a file over a folder row for one second opens that folder while keeping the drag active; Escape cancels active media drags.
- **2026-06-20** — Folder rows can be dragged onto folder rows or breadcrumbs, with the same hover-open behavior as files.
- **2026-06-20** — Media list shows a top drop target during drags so opened empty folders can accept dragged files or folders directly.
- **2026-06-21** — Media library list view paginates folders and files with picker-style controls in the list table section header row.
- **2026-06-21** — Media pickers support multi-select with sticky selected rows; `MediaSourceChoiceDialog` optional **Create folder** for project files.
- **2026-06-21** — Media picker modals add header pagination (page size, prev/next, page count) for project, shop, and contact pickers.
- **2026-07-03** — `MediaFolderDestinationPicker` in paste/drop upload dialog; browse folder target and draft new folder before confirm.
- **2026-07-02** — `MediaObjectPickerDialog` browses media folders with breadcrumb navigation, searchable folder rows, and sticky multi-select across levels; `MediaImagePickerDialog` delegates to the same folder-aware picker (images only).
- **2026-06-20** — Add `/media` carousel view with a persisted list/carousel toggle and centered file metadata.
- **2026-06-20** — Entity modules (shop, projects, contacts) link here via **View media** from attachment UIs.
- **2026-06-20** — Detail form attachments list, delete under metadata panel, `GET /media/:id/attachments` integration.
- **2026-06-20** — List row delete trash with two-step confirm; detail inline title edit, save/discard header actions, and footer delete.
- **2026-06-20** — List preview column, clickable rows to `/media/:mediaId`, shared styled form layout for create and detail.
- **2026-06-20** — Upload form at `/media/new` with file metadata auto-fill and list page plus button.
- **2026-06-20** — Initial Media module with list page and nav entry.
