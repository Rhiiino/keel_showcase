// src/modules/focus/components/forms/fields/FocusListTagSelect.tsx

// Multi-select tag picker for focus lists.

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { fetchFocusTags, focusQueryKeys } from "../../../api";
import { FocusTagManager } from "../../shared/tags";

type FocusListTagSelectProps = {
  selectedTagIds: number[];
  onChange: (tagIds: number[]) => void;
  disabled?: boolean;
  hideManageButton?: boolean;
  hideLabel?: boolean;
};

export function FocusListTagSelect({
  selectedTagIds,
  onChange,
  disabled = false,
  hideManageButton = false,
  hideLabel = false,
}: FocusListTagSelectProps) {
  const [managerOpen, setManagerOpen] = useState(false);

  const tagsQuery = useQuery({
    queryKey: focusQueryKeys.tags(),
    queryFn: fetchFocusTags,
  });

  const tags = tagsQuery.data ?? [];
  const selectedSet = new Set(selectedTagIds);

  const toggleTag = (tagId: number) => {
    if (selectedSet.has(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId));
      return;
    }
    onChange([...selectedTagIds, tagId]);
  };

  return (
    <>
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          {!hideLabel ? (
            <span className="text-xs font-medium uppercase tracking-wide text-white/40">
              Tags
            </span>
          ) : null}
          {!hideManageButton ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => setManagerOpen(true)}
              className="text-xs text-sky-300 transition hover:text-sky-200 disabled:opacity-50"
            >
              Manage tags…
            </button>
          ) : null}
        </div>

        {tagsQuery.isLoading && (
          <p className="mt-2 text-sm text-white/40">Loading tags…</p>
        )}

        {tagsQuery.isError && (
          <p className="mt-2 text-sm text-rose-300">Failed to load tags.</p>
        )}

        {!tagsQuery.isLoading && tags.length === 0 && (
          <p className="mt-2 text-sm text-white/40">
            No tags yet. Create one to organize this list.
          </p>
        )}

        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((tag) => {
              const selected = selectedSet.has(tag.id);

              return (
                <button
                  key={tag.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleTag(tag.id)}
                  className={[
                    "rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition",
                    selected
                      ? "text-white/95 ring-sky-400/60"
                      : "text-white/70 opacity-70 hover:opacity-100",
                    disabled ? "cursor-not-allowed" : "",
                  ].join(" ")}
                  style={{
                    backgroundColor: `${tag.color_hex}${selected ? "66" : "33"}`,
                    border: `1px solid ${tag.color_hex}88`,
                  }}
                  aria-pressed={selected}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {!hideManageButton ? (
        <FocusTagManager open={managerOpen} onClose={() => setManagerOpen(false)} />
      ) : null}
    </>
  );
}
