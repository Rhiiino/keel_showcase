# Shared view templates

Reusable page layouts for Keel web modules. Import from [`index.ts`](./index.ts) — do not copy layout markup into modules.

## Templates

| Template | Use for |
|----------|---------|
| `ListPageLayout` | List page header (title, count, subtitle, actions) |
| `ListView` | Sortable paginated data tables |
| `TagsListView` | Tag manager tables (color, name, preview, count) |
| `FormPageLayout` | Create/edit form chrome (back link, save/discard) |
| `CardGalleryPageLayout` | Card grid galleries (Focus, Coak) |

## List views

Define columns and a sort accessor; render rows in the module:

```tsx
<ListView
  items={entries}
  columns={[
    { id: "date", label: "Date" },
    { id: "preview", label: "Preview" },
    { id: "actions", label: "", sortable: false },
  ]}
  defaultSort={{ column: "date", direction: "desc" }}
  getSortValue={(entry, column) => …}
  gridClassName={JOURNAL_LIST_GRID_CLASS}
  renderRow={(entry) => <JournalListRow entry={entry} />}
  getRowKey={(entry) => entry.id}
/>
```

All data columns are sortable by default. Click toggles asc/desc; active column shows ↑/↓.

**Extension slots:** `headerSlot` (breadcrumbs), `afterHeader` (draft row), `beforeRows`, `suppressEmptyState`, `pagination={false}`.

**Shop grouped lists:** use `ListViewSection` with `sectionTitle` per status group.

## Form views

```tsx
<FormPageLayout
  backHref="/journal"
  backLabel="Back to journal"
  isDirty={dirty}
  onDiscard={discard}
  onSave={save}
  persistHeaderAction  // services “Check now” stays visible while dirty
>
  <JournalEntryForm … />
</FormPageLayout>
```

Props: `title`, `subtitle`, `footer`, `maxWidth` (`3xl` | `5xl` | `7xl`), `padded` (job schedules).

## Card galleries

```tsx
<CardGalleryPageLayout
  title="C.O.A.K."
  recordCount={records.length}
  subtitle="…"
  searchId="coak-record-search"
  …
>
  <div className={CARD_GALLERY_GRID_CLASS}>…cards…</div>
</CardGalleryPageLayout>
```

Projects/Shop kanban boards stay module-specific.

## Adding a new template type

1. Add a folder under `views/` (e.g. `views/detail/`).
2. Export from `views/index.ts`.
3. Document in this README.
4. Update [`keel_web/src/modules/README.md`](../modules/README.md).

## Out of scope

Settings tabs, chat, intelligence catalogs, project workspace canvas, Focus constellation, Coak record workspace.
