// src/modules/focus/components/forms/modals/FocusRecordPickerModal.tsx

// Modal for searching and selecting an external record reference.

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import {
  fetchFocusReferenceTypes,
  focusQueryKeys,
  searchFocusReferences,
  type FocusReferenceSearchResult,
} from "../../../api";
import type { FocusConstellationModalOrigin } from "../../../lib/constellation/modalOrigin";
import { FocusConstellationNodeOriginModal } from "../../constellation/modals";

type FocusRecordPickerModalProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (result: FocusReferenceSearchResult) => void;
  disabled?: boolean;
  origin?: FocusConstellationModalOrigin | null;
};

export function FocusRecordPickerModal({
  open,
  onClose,
  onSelect,
  disabled = false,
  origin = null,
}: FocusRecordPickerModalProps) {
  const [selectedType, setSelectedType] = useState<string>("");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const typesQuery = useQuery({
    queryKey: focusQueryKeys.referenceTypes(),
    queryFn: fetchFocusReferenceTypes,
    enabled: open,
  });

  const enabledTypes = useMemo(
    () => (typesQuery.data ?? []).filter((type) => type.enabled),
    [typesQuery.data],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    const handle = window.setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => window.clearTimeout(handle);
  }, [open, query]);

  useEffect(() => {
    if (!open || selectedType || enabledTypes.length === 0) {
      return;
    }
    setSelectedType(enabledTypes[0]?.target_type ?? "");
  }, [enabledTypes, open, selectedType]);

  const searchQuery = useQuery({
    queryKey: focusQueryKeys.referenceSearch(selectedType, debouncedQuery),
    queryFn: () => searchFocusReferences(selectedType, debouncedQuery),
    enabled: open && selectedType.length > 0,
  });

  return (
    <FocusConstellationNodeOriginModal
      open={open}
      origin={origin}
      ariaLabel="Add record"
      backdropClassName="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white/90">Add record</h2>
            <p className="mt-1 text-sm text-white/45">
              Search enabled reference types and pick a record to link.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={disabled}
            className="shrink-0 rounded-lg px-2 py-1 text-sm text-white/50 hover:bg-white/8 hover:text-white/80 disabled:opacity-40"
          >
            Close
          </button>
        </div>

        {typesQuery.isLoading ? (
          <p className="text-sm text-white/40">Loading reference types…</p>
        ) : enabledTypes.length === 0 ? (
          <p className="text-sm text-white/45">
            No reference types are enabled. Turn some on in Focus reference settings.
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="focus-record-type"
                className="text-xs font-medium uppercase tracking-wide text-white/40"
              >
                Reference type
              </label>
              <select
                id="focus-record-type"
                value={selectedType}
                disabled={disabled}
                onChange={(event) => setSelectedType(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white/85"
              >
                {enabledTypes.map((type) => (
                  <option key={type.target_type} value={type.target_type}>
                    {type.display_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="focus-record-search"
                className="text-xs font-medium uppercase tracking-wide text-white/40"
              >
                Search
              </label>
              <input
                id="focus-record-search"
                type="search"
                value={query}
                disabled={disabled}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search records…"
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white/85 outline-none placeholder:text-white/30 focus:border-white/20"
              />
            </div>

            {searchQuery.isLoading ? (
              <p className="text-sm text-white/40">Searching…</p>
            ) : searchQuery.isError ? (
              <p className="text-sm text-rose-300">Could not search records.</p>
            ) : (searchQuery.data ?? []).length === 0 ? (
              <p className="text-sm text-white/40">
                {debouncedQuery ? "No matching records." : "Type to search records."}
              </p>
            ) : (
              <ul className="max-h-56 space-y-1 overflow-y-auto scrollbar-subtle">
                {(searchQuery.data ?? []).map((result) => (
                  <li key={`${result.target_type}:${result.target_id}`}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        onSelect(result);
                        onClose();
                      }}
                      className="w-full rounded-lg bg-white/[0.03] px-3 py-2.5 text-left ring-1 ring-white/[0.06] transition hover:bg-white/[0.05] hover:ring-white/10"
                    >
                      <span className="block text-sm font-medium text-white/90">
                        {result.title}
                      </span>
                      {result.subtitle ? (
                        <span className="mt-1 block truncate text-xs text-white/45">
                          {result.subtitle}
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
    </FocusConstellationNodeOriginModal>
  );
}
