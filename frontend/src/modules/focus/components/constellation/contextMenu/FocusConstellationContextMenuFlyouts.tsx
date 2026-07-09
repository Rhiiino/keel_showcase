// src/modules/focus/components/constellation/contextMenu/FocusConstellationContextMenuFlyouts.tsx

// Shared flyout panels for constellation context menus.

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";

import { fetchFocusLists, focusQueryKeys, type FocusList } from "../../../api";

export const FLYOUT_PANEL_CLASS =
  "rounded-lg border border-white/[0.08] bg-stone-900/85 shadow-[0_10px_36px_rgba(0,0,0,0.42)] backdrop-blur-xl";

export const FLYOUT_ITEM_CLASS =
  "flex w-full px-3 py-2 text-left text-xs font-medium text-white/72 transition hover:bg-white/[0.06] hover:text-white/92";

export const FLYOUT_ITEM_ACTIVE_CLASS =
  "flex w-full px-3 py-2 text-left text-xs font-medium bg-white/[0.08] text-white transition";

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

function mergeDraftWithPaste(
  draft: string,
  pasted: string,
  selectionStart: number | null,
  selectionEnd: number | null,
): string {
  const start = selectionStart ?? draft.length;
  const end = selectionEnd ?? draft.length;
  return draft.slice(0, start) + pasted + draft.slice(end);
}

export function AddTitlePanel({
  mode,
  pending,
  disabled,
  inputRef,
  onSubmit,
  className = "",
}: {
  mode: "task" | "create_list";
  pending: boolean;
  disabled?: boolean;
  inputRef?: RefObject<HTMLInputElement>;
  onSubmit: (title: string) => void;
  className?: string;
}) {
  const [draft, setDraft] = useState("");
  const localInputRef = useRef<HTMLInputElement>(null);
  const resolvedInputRef = inputRef ?? localInputRef;

  useEffect(() => {
    setDraft("");
    resolvedInputRef.current?.focus();
  }, [mode, resolvedInputRef]);

  const handleSubmit = () => {
    const trimmed = draft.trim();
    if (!trimmed || pending || disabled) {
      return;
    }
    onSubmit(trimmed);
  };

  return (
    <div
      className={`${FLYOUT_PANEL_CLASS} w-56 shrink-0 p-2 ${className}`}
      onKeyDown={(event) => event.stopPropagation()}
      onPaste={(event) => event.stopPropagation()}
    >
      <form
        className="flex items-center gap-1.5"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <input
          ref={resolvedInputRef}
          type="text"
          autoFocus
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => event.stopPropagation()}
          onPaste={(event) => {
            event.stopPropagation();
            const pasted = event.clipboardData.getData("text");
            if (!pasted) {
              return;
            }
            event.preventDefault();
            const input = event.currentTarget;
            setDraft(
              mergeDraftWithPaste(
                draft,
                pasted,
                input.selectionStart,
                input.selectionEnd,
              ),
            );
          }}
          disabled={pending || disabled}
          placeholder={mode === "task" ? "Task title…" : "New list title…"}
          className="min-w-0 flex-1 rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs text-white/90 outline-none placeholder:text-white/30 focus:border-white/22"
        />
        <button
          type="submit"
          disabled={pending || disabled || draft.trim().length === 0}
          className="shrink-0 rounded-md bg-white/12 px-2.5 py-1.5 text-xs font-medium text-white/90 transition hover:bg-white/18 disabled:opacity-40"
        >
          {pending ? "…" : "Add"}
        </button>
      </form>
    </div>
  );
}

export function LinkExistingListPanel({
  parentListId,
  excludedLinkedListIds,
  candidateLists,
  pending,
  disabled,
  onSelect,
  emptyMessage = "No available lists to link.",
  className = "",
}: {
  parentListId?: number | null;
  excludedLinkedListIds?: number[];
  candidateLists?: FocusList[];
  pending: boolean;
  disabled?: boolean;
  onSelect: (listId: number, title: string) => void;
  emptyMessage?: string;
  className?: string;
}) {
  const [listSearch, setListSearch] = useState("");

  const excludedIds = useMemo(() => {
    const ids = new Set(excludedLinkedListIds ?? []);
    if (parentListId !== null && parentListId !== undefined) {
      ids.add(parentListId);
    }
    return ids;
  }, [excludedLinkedListIds, parentListId]);

  const listsQuery = useQuery({
    queryKey: focusQueryKeys.listsList({ status: "active" }),
    queryFn: () => fetchFocusLists({ status: "active" }),
    enabled: candidateLists === undefined,
  });

  const linkableLists = useMemo(() => {
    const rows = candidateLists ?? listsQuery.data ?? [];
    return rows
      .filter((row) => !excludedIds.has(row.id))
      .filter((row) => listMatchesQuery(row, listSearch))
      .sort((a, b) => a.title.localeCompare(b.title) || a.id - b.id);
  }, [candidateLists, excludedIds, listSearch, listsQuery.data]);

  const isLoading = candidateLists === undefined && listsQuery.isLoading;
  const isError = candidateLists === undefined && listsQuery.isError;

  return (
    <div className={`${FLYOUT_PANEL_CLASS} flex w-64 shrink-0 flex-col p-2 ${className}`}>
      <input
        type="search"
        value={listSearch}
        onChange={(event) => setListSearch(event.target.value)}
        disabled={pending || disabled || isLoading}
        placeholder="Search lists…"
        className="w-full rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs text-white/90 outline-none placeholder:text-white/30 focus:border-white/22"
      />
      <div className="mt-2 max-h-48 overflow-y-auto scrollbar-subtle">
        {isLoading ? (
          <p className="px-1 py-2 text-xs text-white/40">Loading lists…</p>
        ) : isError ? (
          <p className="px-1 py-2 text-xs text-rose-300">Could not load lists.</p>
        ) : linkableLists.length === 0 ? (
          <p className="px-1 py-2 text-xs text-white/40">
            {listSearch.trim() ? "No matching lists." : emptyMessage}
          </p>
        ) : (
          <ul className="space-y-0.5">
            {linkableLists.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  disabled={pending || disabled}
                  onClick={() => onSelect(row.id, row.title)}
                  className="w-full rounded-md px-2 py-1.5 text-left transition hover:bg-white/[0.06]"
                >
                  <span className="block truncate text-xs font-medium text-white/88">
                    {row.title}
                  </span>
                  {row.notes ? (
                    <span className="mt-0.5 block truncate text-[11px] text-white/42">
                      {row.notes}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
