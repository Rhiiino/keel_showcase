// src/modules/focus/components/forms/entry/FocusEntryAddForm.tsx

// Add a task, new linked list, or link to an existing list on the current list.

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

import { fetchFocusLists, focusQueryKeys, type FocusList, type FocusEntryCreatePayload, type FocusListCreatePayload, type FocusReferenceSearchResult } from "../../../api";
import {
  FOCUS_ENTRY_ADD_MODE_LABELS,
  FOCUS_ENTRY_ADD_MODES,
  FOCUS_STANDALONE_LIST_ADD_MODES,
  type FocusEntryAddMode,
} from "../../../lib/focus";
import { FocusListCardColorPicker } from "../../cards/card";
import { FocusListTagSelect } from "../fields";
import { FocusRecordPickerModal } from "../modals";

type FocusEntryAddFormBaseProps = {
  excludedLinkedListIds?: number[];
  disabled?: boolean;
  keepInputFocusedAfterSubmit?: boolean;
  submitLabel?: string;
  emptyLinkMessage?: string;
  formIdSuffix?: string;
};

type FocusEntryAddFormEntryProps = FocusEntryAddFormBaseProps & {
  variant?: "entry";
  listId: number;
  onSubmit: (payload: FocusEntryCreatePayload) => Promise<unknown>;
  onAddRecord?: (result: FocusReferenceSearchResult) => Promise<unknown>;
};

type FocusEntryAddFormStandaloneProps = FocusEntryAddFormBaseProps & {
  variant: "standalone";
  onSubmitCreateList: (payload: FocusListCreatePayload) => Promise<unknown>;
  onSubmitLinkExistingList: (listId: number) => Promise<unknown>;
};

type FocusEntryAddFormProps = FocusEntryAddFormEntryProps | FocusEntryAddFormStandaloneProps;

function listMatchesQuery(list: FocusList, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }
  return (
    list.title.toLowerCase().includes(normalized) ||
    list.notes.toLowerCase().includes(normalized) ||
    list.tags.some((tag) => tag.name.toLowerCase().includes(normalized))
  );
}

export function FocusEntryAddForm(props: FocusEntryAddFormProps) {
  const {
    excludedLinkedListIds = [],
    disabled = false,
    keepInputFocusedAfterSubmit = false,
    submitLabel = "Add entry",
    emptyLinkMessage = "No available lists to link. Lists already linked here are hidden.",
    formIdSuffix = "",
  } = props;
  const isStandalone = props.variant === "standalone";
  const listId = props.variant === "standalone" ? null : props.listId;
  const modeOptions = isStandalone ? FOCUS_STANDALONE_LIST_ADD_MODES : FOCUS_ENTRY_ADD_MODES;

  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState<FocusEntryAddMode>(
    isStandalone ? "create_list" : "task",
  );
  const [notes, setNotes] = useState("");
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [nodeColor, setNodeColor] = useState<string | null>(null);
  const [listSearch, setListSearch] = useState("");
  const [selectedLinkedListId, setSelectedLinkedListId] = useState<number | null>(
    null,
  );
  const [recordPickerOpen, setRecordPickerOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldRefocusInput, setShouldRefocusInput] = useState(false);

  const excludedIds = useMemo(() => {
    const ids = new Set(excludedLinkedListIds);
    if (listId !== null) {
      ids.add(listId);
    }
    return ids;
  }, [excludedLinkedListIds, listId]);

  const listsQuery = useQuery({
    queryKey: focusQueryKeys.listsList({ status: "active" }),
    queryFn: () => fetchFocusLists({ status: "active" }),
    enabled: mode === "link_existing",
  });

  const linkableLists = useMemo(() => {
    const rows = listsQuery.data ?? [];
    return rows
      .filter((row) => !excludedIds.has(row.id))
      .filter((row) => listMatchesQuery(row, listSearch))
      .sort((a, b) => a.title.localeCompare(b.title) || a.id - b.id);
  }, [excludedIds, listSearch, listsQuery.data]);

  const selectedLinkedList = useMemo(
    () => linkableLists.find((row) => row.id === selectedLinkedListId) ?? null,
    [linkableLists, selectedLinkedListId],
  );

  useEffect(() => {
    if (!shouldRefocusInput || pending || disabled || mode === "link_existing" || mode === "add_record") {
      return;
    }

    inputRef.current?.focus();
    setShouldRefocusInput(false);
  }, [disabled, mode, pending, shouldRefocusInput]);

  useEffect(() => {
    if (
      selectedLinkedListId !== null &&
      !linkableLists.some((row) => row.id === selectedLinkedListId)
    ) {
      setSelectedLinkedListId(null);
    }
  }, [linkableLists, selectedLinkedListId]);

  const canSubmit = (() => {
    if (pending || disabled) {
      return false;
    }
    if (mode === "link_existing") {
      return selectedLinkedListId !== null;
    }
    if (mode === "add_record") {
      return false;
    }
    return title.trim().length > 0;
  })();

  const resetAfterSubmit = () => {
    setTitle("");
    setNotes("");
    setTagIds([]);
    setNodeColor(null);
    setListSearch("");
    setSelectedLinkedListId(null);
    setShouldRefocusInput(keepInputFocusedAfterSubmit);
  };

  const handleModeChange = (nextMode: FocusEntryAddMode) => {
    setMode(nextMode);
    setError(null);
    setListSearch("");
    setSelectedLinkedListId(null);
    if (nextMode === "add_record") {
      setRecordPickerOpen(true);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      if (isStandalone) {
        if (mode === "create_list") {
          await props.onSubmitCreateList({
            title: title.trim(),
            notes: notes.trim(),
            tag_ids: tagIds,
            node_color_hex: nodeColor,
          });
        } else {
          const linked = selectedLinkedList;
          if (!linked) {
            return;
          }
          await props.onSubmitLinkExistingList(linked.id);
        }
      } else if (listId === null) {
        return;
      } else if (mode === "task") {
        await props.onSubmit({
          title: title.trim(),
          list_id: listId,
          kind: "task",
          status: "limbo",
        });
      } else if (mode === "create_list") {
        await props.onSubmit({
          title: title.trim(),
          list_id: listId,
          kind: "list_link",
          status: "limbo",
          linked_list: {
            notes: notes.trim(),
            tag_ids: tagIds,
            node_color_hex: nodeColor,
          },
        });
      } else {
        const linked = selectedLinkedList;
        if (!linked) {
          return;
        }
        await props.onSubmit({
          title: linked.title,
          list_id: listId,
          kind: "list_link",
          status: "limbo",
          linked_list_id: linked.id,
        });
      }
      resetAfterSubmit();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Failed to add entry.",
      );
    } finally {
      setPending(false);
    }
  };

  const handleRecordSelect = async (result: FocusReferenceSearchResult) => {
    if (isStandalone || listId === null || !("onAddRecord" in props) || !props.onAddRecord) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      await props.onAddRecord(result);
      resetAfterSubmit();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Failed to add record.",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          {mode !== "link_existing" && mode !== "add_record" ? (
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={
              mode === "create_list"
                ? "New list title…"
                : isStandalone
                  ? "New list title…"
                  : "Add task to this list…"
            }
            disabled={pending || disabled}
            className="min-w-0 flex-1 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm text-white/90 outline-none placeholder:text-white/30 focus:border-white/25"
          />
        ) : null}
        {mode === "add_record" ? (
          <button
            type="button"
            disabled={pending || disabled}
            onClick={() => setRecordPickerOpen(true)}
            className="min-w-0 flex-1 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-left text-sm text-white/70 transition hover:border-white/20 hover:text-white/90 disabled:opacity-40"
          >
            Choose a record…
          </button>
        ) : null}
        <div
          className={[
            "relative",
            mode === "link_existing" ? "min-w-0 flex-1" : "",
          ].join(" ")}
        >
          <select
            value={mode}
            disabled={pending || disabled}
            onChange={(event) =>
              handleModeChange(event.target.value as FocusEntryAddMode)
            }
            aria-label="Entry type"
            className="h-full w-full appearance-none rounded-xl border border-white/12 bg-white/[0.04] py-2.5 pl-3.5 pr-10 text-sm text-white/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition hover:border-white/20 hover:bg-white/[0.06] focus:border-sky-300/35 focus:bg-white/[0.07] disabled:opacity-40"
          >
            {modeOptions.map((option) => (
              <option key={option} value={option} className="bg-[#141210] text-white">
                {FOCUS_ENTRY_ADD_MODE_LABELS[option]}
              </option>
            ))}
          </select>
          <span
            className="pointer-events-none absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-white/[0.06] text-white/45"
            aria-hidden
          >
            <svg
              viewBox="0 0 20 20"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M6 8L10 12L14 8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-xl bg-white/12 px-4 py-2.5 text-sm font-medium text-white/90 transition hover:bg-white/18 disabled:opacity-40"
        >
          {pending ? "Adding…" : submitLabel}
        </button>
      </div>

      {mode === "create_list" ? (
        <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div>
            <label
              htmlFor={`focus-linked-list-notes${formIdSuffix}`}
              className="text-xs font-medium uppercase tracking-wide text-white/40"
            >
              Notes
            </label>
            <textarea
              id={`focus-linked-list-notes${formIdSuffix}`}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              disabled={pending || disabled}
              rows={2}
              placeholder="Optional notes for the new list…"
              className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/85 focus:border-white/20 focus:outline-none"
            />
          </div>
          <FocusListTagSelect
            selectedTagIds={tagIds}
            onChange={setTagIds}
            disabled={pending || disabled}
            hideManageButton
          />
          <FocusListCardColorPicker
            variant="inline"
            colorHex={nodeColor}
            disabled={pending || disabled}
            onChange={setNodeColor}
          />
        </div>
      ) : null}

      {mode === "link_existing" ? (
        <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div>
            <label
              htmlFor={`focus-link-existing-list-search${formIdSuffix}`}
              className="text-xs font-medium uppercase tracking-wide text-white/40"
            >
              Search lists
            </label>
            <div className="relative mt-2">
              <span
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35"
                aria-hidden
              >
                <svg
                  viewBox="0 0 20 20"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                >
                  <circle cx="8.5" cy="8.5" r="5.25" />
                  <path d="M12.5 12.5L16.5 16.5" strokeLinecap="round" />
                </svg>
              </span>
              <input
                id={`focus-link-existing-list-search${formIdSuffix}`}
                type="search"
                value={listSearch}
                onChange={(event) => setListSearch(event.target.value)}
                disabled={pending || disabled || listsQuery.isLoading}
                placeholder="Search by title, notes, or tag…"
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-10 pr-10 text-sm text-white/85 outline-none placeholder:text-white/30 focus:border-white/20"
              />
              {listSearch ? (
                <button
                  type="button"
                  onClick={() => setListSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs text-white/45 transition hover:text-white/75"
                  aria-label="Clear search"
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>

          {listsQuery.isLoading ? (
            <p className="text-sm text-white/40">Loading lists…</p>
          ) : listsQuery.isError ? (
            <p className="text-sm text-rose-300">Could not load lists.</p>
          ) : linkableLists.length === 0 ? (
            <p className="text-sm text-white/40">
              {listSearch.trim() ? "No matching lists to link." : emptyLinkMessage}
            </p>
          ) : (
            <ul className="max-h-56 space-y-1 overflow-y-auto scrollbar-subtle">
              {linkableLists.map((row) => {
                const selected = row.id === selectedLinkedListId;
                return (
                  <li key={row.id}>
                    <button
                      type="button"
                      disabled={pending || disabled}
                      onClick={() => setSelectedLinkedListId(row.id)}
                      className={[
                        "w-full rounded-lg px-3 py-2.5 text-left transition",
                        selected
                          ? "bg-sky-500/15 ring-1 ring-sky-400/35"
                          : "bg-white/[0.03] ring-1 ring-white/[0.06] hover:bg-white/[0.05] hover:ring-white/10",
                      ].join(" ")}
                    >
                      <span className="block text-sm font-medium text-white/90">
                        {row.title}
                      </span>
                      {row.notes ? (
                        <span className="mt-1 block truncate text-xs text-white/45">
                          {row.notes}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {selectedLinkedList ? (
            <p className="text-xs text-sky-200/70">
              Selected: <span className="text-sky-100">{selectedLinkedList.title}</span>
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
      </form>

      {!isStandalone && "onAddRecord" in props && props.onAddRecord ? (
        <FocusRecordPickerModal
          open={recordPickerOpen}
          onClose={() => setRecordPickerOpen(false)}
          disabled={pending || disabled}
          onSelect={handleRecordSelect}
        />
      ) : null}
    </>
  );
}
