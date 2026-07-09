// keel_web/src/modules/finance/components/tags/FinanceObligationInlineTags.tsx

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  fetchFinanceObligationTags,
  financeQueryKeys,
  type FinanceObligationTag,
} from "../../api";
import { financeObligationTagPillStyle } from "../../lib/obligationTagDisplay";

type FinanceObligationInlineTagsProps = {
  tagIdsDraft: number[];
  onTagIdsDraftChange: (nextTagIds: number[]) => void;
  disabled?: boolean;
};

function RemovableTagPill({
  tag,
  onRemove,
  disabled,
}: {
  tag: FinanceObligationTag;
  onRemove: () => void;
  disabled: boolean;
}) {
  const style = financeObligationTagPillStyle(tag.color_hex);

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full py-1 pl-2.5 pr-1.5 text-xs font-medium leading-none ring-1"
      style={style}
    >
      <span className="leading-none">{tag.name}</span>
      <button
        type="button"
        disabled={disabled}
        onClick={onRemove}
        aria-label={`Remove tag ${tag.name}`}
        className={[
          "inline-flex shrink-0 items-center justify-center rounded-full border-0 bg-transparent p-0",
          "text-xs leading-none",
          disabled
            ? "cursor-not-allowed opacity-50"
            : "hover:bg-black/20 hover:text-red-200",
        ].join(" ")}
      >
        ×
      </button>
    </span>
  );
}

function TagAddButton({
  onClick,
  disabled,
  open,
}: {
  onClick: () => void;
  disabled: boolean;
  open: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label="Add tag"
      aria-expanded={open}
      className={[
        "inline-flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-stone-700/80 text-stone-400 transition",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "hover:border-sky-400/50 hover:bg-sky-500/5 hover:text-sky-200",
        open ? "border-sky-400/50 bg-sky-500/5 text-sky-200" : "",
      ].join(" ")}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        aria-hidden
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
    </button>
  );
}

export function FinanceObligationInlineTags({
  tagIdsDraft,
  onTagIdsDraftChange,
  disabled = false,
}: FinanceObligationInlineTagsProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const tagsQuery = useQuery({
    queryKey: financeQueryKeys.obligationTags(),
    queryFn: fetchFinanceObligationTags,
  });

  const allTags = tagsQuery.data ?? [];
  const tagsById = useMemo(
    () => new Map(allTags.map((tag) => [tag.id, tag])),
    [allTags],
  );

  const selectedTags = tagIdsDraft
    .map((tagId) => tagsById.get(tagId))
    .filter((tag): tag is FinanceObligationTag => tag !== undefined);

  const unselectedTags = allTags.filter((tag) => !tagIdsDraft.includes(tag.id));

  useEffect(() => {
    if (!pickerOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [pickerOpen]);

  const addTag = (tagId: number) => {
    if (tagIdsDraft.includes(tagId)) {
      return;
    }
    onTagIdsDraftChange([...tagIdsDraft, tagId]);
    setPickerOpen(false);
  };

  const removeTag = (tagId: number) => {
    onTagIdsDraftChange(tagIdsDraft.filter((id) => id !== tagId));
  };

  return (
    <div ref={containerRef} className="relative flex flex-wrap items-center gap-2">
      {selectedTags.map((tag) => (
        <RemovableTagPill
          key={tag.id}
          tag={tag}
          disabled={disabled}
          onRemove={() => removeTag(tag.id)}
        />
      ))}

      <div className="relative">
        <TagAddButton
          disabled={disabled || tagsQuery.isLoading}
          open={pickerOpen}
          onClick={() => setPickerOpen((open) => !open)}
        />

        {pickerOpen ? (
          <div className="absolute left-0 top-full z-30 mt-2 min-w-[12rem] overflow-hidden rounded-lg border border-stone-800 bg-stone-950 py-1 shadow-lg ring-1 ring-stone-800/80">
            {tagsQuery.isLoading ? (
              <p className="px-3 py-2 text-xs text-stone-500">Loading tags…</p>
            ) : null}

            {tagsQuery.isError ? (
              <p className="px-3 py-2 text-xs text-red-400">Failed to load tags.</p>
            ) : null}

            {!tagsQuery.isLoading && unselectedTags.length === 0 ? (
              <p className="px-3 py-2 text-xs text-stone-500">
                {allTags.length === 0
                  ? "No tags yet. Create tags on the Tags tab."
                  : "All tags are already on this subscription."}
              </p>
            ) : null}

            {unselectedTags.map((tag) => {
              const style = financeObligationTagPillStyle(tag.color_hex);
              return (
                <button
                  key={tag.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => addTag(tag.id)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-stone-200 transition hover:bg-stone-900/80 disabled:opacity-50"
                >
                  <span
                    className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1"
                    style={style}
                  >
                    {tag.name}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
