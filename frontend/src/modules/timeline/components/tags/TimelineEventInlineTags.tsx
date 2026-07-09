// keel_web/src/modules/timeline/components/tags/TimelineEventInlineTags.tsx

import { useQuery } from "@tanstack/react-query";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";

import { fetchTimelineTags, timelineQueryKeys, type TimelineTag } from "../../api";
import { timelineTagPillStyle } from "../../lib/timelineTagDisplay";

type TimelineEventInlineTagsProps = {
  tagIdsDraft: number[];
  onTagIdsDraftChange: (nextTagIds: number[]) => void;
  disabled?: boolean;
};

const MENU_MIN_WIDTH_PX = 192;
const MENU_MAX_HEIGHT_PX = 288;
const MENU_GAP_PX = 8;
const VIEWPORT_PADDING_PX = 8;
const MENU_Z_INDEX = 110;
export const TIMELINE_INLINE_TAG_PICKER_SELECTOR = "[data-timeline-inline-tag-picker]";

type MenuPosition = {
  top: number;
  left: number;
  maxHeight: number;
  width: number;
};

function RemovableTagPill({
  tag,
  onRemove,
  disabled,
}: {
  tag: TimelineTag;
  onRemove: () => void;
  disabled: boolean;
}) {
  const style = timelineTagPillStyle(tag.color_hex);

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
  buttonRef,
  onClick,
  disabled,
  open,
}: {
  buttonRef: RefObject<HTMLButtonElement>;
  onClick: () => void;
  disabled: boolean;
  open: boolean;
}) {
  return (
    <button
      ref={buttonRef}
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

export function TimelineEventInlineTags({
  tagIdsDraft,
  onTagIdsDraftChange,
  disabled = false,
}: TimelineEventInlineTagsProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const tagsQuery = useQuery({
    queryKey: timelineQueryKeys.tags(),
    queryFn: fetchTimelineTags,
  });

  const allTags = tagsQuery.data ?? [];
  const tagsById = useMemo(
    () => new Map(allTags.map((tag) => [tag.id, tag])),
    [allTags],
  );

  const selectedTags = tagIdsDraft
    .map((tagId) => tagsById.get(tagId))
    .filter((tag): tag is TimelineTag => tag !== undefined);

  const unselectedTags = allTags.filter((tag) => !tagIdsDraft.includes(tag.id));

  const updateMenuPosition = () => {
    const button = buttonRef.current;
    if (!button) {
      return;
    }

    const rect = button.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - MENU_GAP_PX - VIEWPORT_PADDING_PX;
    const spaceAbove = rect.top - MENU_GAP_PX - VIEWPORT_PADDING_PX;
    const openBelow = spaceBelow >= Math.min(MENU_MAX_HEIGHT_PX, spaceAbove);

    let top: number;
    let maxHeight: number;

    if (openBelow) {
      top = rect.bottom + MENU_GAP_PX;
      maxHeight = Math.min(MENU_MAX_HEIGHT_PX, spaceBelow);
    } else {
      maxHeight = Math.min(MENU_MAX_HEIGHT_PX, spaceAbove);
      top = rect.top - MENU_GAP_PX - maxHeight;
    }

    let left = rect.left;
    left = Math.max(
      VIEWPORT_PADDING_PX,
      Math.min(left, window.innerWidth - MENU_MIN_WIDTH_PX - VIEWPORT_PADDING_PX),
    );

    setMenuPosition({
      top,
      left,
      maxHeight,
      width: MENU_MIN_WIDTH_PX,
    });
  };

  useLayoutEffect(() => {
    if (!pickerOpen) {
      setMenuPosition(null);
      return;
    }

    updateMenuPosition();

    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [pickerOpen]);

  useEffect(() => {
    if (!pickerOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setPickerOpen(false);
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

  const pickerMenu =
    pickerOpen && menuPosition
      ? createPortal(
          <div
            ref={menuRef}
            data-timeline-inline-tag-picker
            role="listbox"
            aria-label="Add tag"
            style={{
              position: "fixed",
              top: menuPosition.top,
              left: menuPosition.left,
              width: menuPosition.width,
              maxHeight: menuPosition.maxHeight,
              zIndex: MENU_Z_INDEX,
            }}
            className="scrollbar-subtle overflow-y-auto rounded-lg border border-stone-800 bg-stone-950 py-1 shadow-lg ring-1 ring-stone-800/80"
          >
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
                  : "All tags are already on this event."}
              </p>
            ) : null}

            {unselectedTags.map((tag) => {
              const style = timelineTagPillStyle(tag.color_hex);
              return (
                <button
                  key={tag.id}
                  type="button"
                  role="option"
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
          </div>,
          document.body,
        )
      : null;

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
          buttonRef={buttonRef}
          disabled={disabled || tagsQuery.isLoading}
          open={pickerOpen}
          onClick={() => setPickerOpen((open) => !open)}
        />
      </div>

      {pickerMenu}
    </div>
  );
}
