// keel_web/src/modules/coak/components/tags/CoakItemInlineTags.tsx

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

import { coakQueryKeys, fetchCoakTags, type CoakTag } from "../../api";
import { useCoakRecordWorkspace } from "../../context/CoakRecordWorkspaceContext";
import { coakTagPillStyle } from "../../lib/coakTagDisplay";

type CoakItemInlineTagsProps = {
  tagIds: number[];
  onTagIdsChange: (nextTagIds: number[]) => void;
  disabled?: boolean;
  compact?: boolean;
};

function RemovableTagPill({
  tag,
  onRemove,
  disabled,
  compact,
}: {
  tag: CoakTag;
  onRemove: () => void;
  disabled: boolean;
  compact?: boolean;
}) {
  const style = coakTagPillStyle(tag.color_hex);

  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full font-medium leading-none ring-1",
        compact ? "py-0.5 pl-1.5 pr-1 text-[10px]" : "py-1 pl-2.5 pr-1.5 text-xs",
      ].join(" ")}
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
          compact ? "text-[10px]" : "text-xs leading-none",
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
  compact,
}: {
  onClick: () => void;
  disabled: boolean;
  open: boolean;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label="Add tag"
      aria-expanded={open}
      className={[
        "inline-flex items-center justify-center rounded-full border border-dashed border-stone-700/80 text-stone-400 transition",
        compact ? "h-5 w-5" : "h-7 w-7",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "hover:border-sky-400/50 hover:bg-sky-500/5 hover:text-sky-200",
        open ? "border-sky-400/50 bg-sky-500/5 text-sky-200" : "",
      ].join(" ")}
    >
      <svg
        viewBox="0 0 24 24"
        className={compact ? "h-3 w-3" : "h-4 w-4"}
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

export function CoakItemInlineTags({
  tagIds,
  onTagIdsChange,
  disabled = false,
  compact = false,
}: CoakItemInlineTagsProps) {
  const { recordId } = useCoakRecordWorkspace();
  const [pickerOpen, setPickerOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const tagsQuery = useQuery({
    queryKey: coakQueryKeys.tags(recordId),
    queryFn: () => fetchCoakTags(recordId),
  });

  const allTags = tagsQuery.data ?? [];
  const tagsById = useMemo(
    () => new Map(allTags.map((tag) => [tag.id, tag])),
    [allTags],
  );

  const selectedTags = tagIds
    .map((tagId) => tagsById.get(tagId))
    .filter((tag): tag is CoakTag => tag !== undefined);

  const unselectedTags = allTags.filter((tag) => !tagIds.includes(tag.id));

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
    if (tagIds.includes(tagId)) {
      return;
    }
    onTagIdsChange([...tagIds, tagId]);
    setPickerOpen(false);
  };

  const removeTag = (tagId: number) => {
    onTagIdsChange(tagIds.filter((id) => id !== tagId));
  };

  return (
    <div
      ref={containerRef}
      className={["relative flex flex-wrap items-center", compact ? "gap-1" : "gap-2"].join(" ")}
    >
      {selectedTags.map((tag) => (
        <RemovableTagPill
          key={tag.id}
          tag={tag}
          disabled={disabled}
          compact={compact}
          onRemove={() => removeTag(tag.id)}
        />
      ))}

      <div className="relative">
        <TagAddButton
          disabled={disabled || tagsQuery.isLoading}
          open={pickerOpen}
          compact={compact}
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
                  : "All tags are already on this item."}
              </p>
            ) : null}

            {unselectedTags.map((tag) => {
              const style = coakTagPillStyle(tag.color_hex);
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
