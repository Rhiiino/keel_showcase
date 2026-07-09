// keel_web/src/modules/timeline/components/plans/TimelinePlanItemListRow.tsx

import { useEffect, useRef, useState, type DragEvent, type MouseEvent as ReactMouseEvent } from "react";

import { ListDragHandle } from "../../../../views/list/primitives/ListDragHandle";
import { ListInsertIndicator } from "../../../../views/list/primitives/ListInsertIndicator";
import { CardMenu } from "../../../../components/CardMenu";
import { useConfirmDeleteAction } from "../../../../hooks/useConfirmDeleteAction";
import type { TimelinePlanItem, TimelinePlanItemUpdatePayload } from "../../api";
import { formatPlanItemStatusLabel } from "../../lib/timelinePlanDisplay";
import {
  formatTimelineDateOnlyLabel,
  formatTimelineInstantLabel,
} from "../../lib/timelineDateTime";
import {
  TIMELINE_INLINE_TAG_PICKER_SELECTOR,
  TimelineEventInlineTags,
} from "../tags/TimelineEventInlineTags";
import { TimelineTagPill } from "../tags/TimelineTagPill";
import { TimelinePlanItemScheduleCellPopover } from "./TimelinePlanItemScheduleCellPopover";

export const TIMELINE_PLAN_ITEM_LIST_GRID_CLASS =
  "grid w-full grid-cols-[1.75rem_8rem_minmax(0,1fr)_minmax(0,8rem)_5.5rem_2.5rem_2.5rem] items-center gap-x-2";

export const TIMELINE_PLAN_ITEM_CELL_SCHEDULE = "min-w-0 py-3 pl-2 pr-1 text-left";
export const TIMELINE_PLAN_ITEM_CELL_TITLE = "min-w-0 py-3 pl-2 pr-2 text-left";
export const TIMELINE_PLAN_ITEM_CELL_TAGS = "min-w-0 py-3 pl-2 pr-2 text-left";
export const TIMELINE_PLAN_ITEM_CELL_STATUS = "whitespace-nowrap px-2 py-3 text-left";
export const TIMELINE_PLAN_ITEM_CELL_HEADER =
  "py-3 text-xs font-medium uppercase tracking-wide text-stone-500";

const STATUS_OPTIONS = ["planned", "done", "skipped"] as const;

function formatPlanItemSchedule(item: TimelinePlanItem): string {
  if (item.all_day) {
    return `${formatTimelineDateOnlyLabel(item.start_at)} (All day)`;
  }

  return formatTimelineInstantLabel(item.start_at, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function PlanItemEventLinkedIndicator({ linked }: { linked: boolean }) {
  if (!linked) {
    return null;
  }

  return (
    <span
      className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
      title="Linked to timeline event"
      aria-hidden
    >
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
        <path
          d="M3.5 8.5L6.5 11.5L12.5 4.5"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

type TimelinePlanItemListRowProps = {
  item: TimelinePlanItem;
  planStartDate: string;
  planEndDate: string;
  onRowClick?: (item: TimelinePlanItem) => void;
  onUpdateItem?: (itemId: number, payload: TimelinePlanItemUpdatePayload) => void;
  onDelete?: (itemId: number) => void;
  deleteDisabled?: boolean;
  updateDisabled?: boolean;
  reorderable?: boolean;
  isDragging?: boolean;
  showInsertTop?: boolean;
  showInsertBottom?: boolean;
  autoEditTitle?: boolean;
  onAutoEditTitleHandled?: () => void;
  rowRef?: (node: HTMLDivElement | null) => void;
  onDragStart?: (event: DragEvent<HTMLButtonElement>) => void;
  onDragEnd?: () => void;
};

export function TimelinePlanItemListRow({
  item,
  planStartDate,
  planEndDate,
  onRowClick,
  onUpdateItem,
  onDelete,
  deleteDisabled = false,
  updateDisabled = false,
  reorderable = false,
  isDragging = false,
  showInsertTop = false,
  showInsertBottom = false,
  autoEditTitle = false,
  onAutoEditTitleHandled,
  rowRef,
  onDragStart,
  onDragEnd,
}: TimelinePlanItemListRowProps) {
  const { confirmPending, containerRef, handleClick } = useConfirmDeleteAction(item.id);
  const [editingTitle, setEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(item.title);
  const [editingTags, setEditingTags] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const tagsCellRef = useRef<HTMLDivElement>(null);
  const inlineEditDisabled = updateDisabled || !onUpdateItem;

  useEffect(() => {
    setDraftTitle(item.title);
  }, [item.title]);

  useEffect(() => {
    if (editingTitle) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [editingTitle]);

  useEffect(() => {
    if (!autoEditTitle || inlineEditDisabled) {
      return;
    }
    setEditingTitle(true);
    onAutoEditTitleHandled?.();
    // Only react when autoEditTitle is requested for this row.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoEditTitle]);

  useEffect(() => {
    if (!editingTags || item.tags.length === 0) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (tagsCellRef.current?.contains(target)) {
        return;
      }
      if (target instanceof Element && target.closest(TIMELINE_INLINE_TAG_PICKER_SELECTOR)) {
        return;
      }
      setEditingTags(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [editingTags, item.tags.length]);

  const handleRowClick = (clickEvent: ReactMouseEvent<HTMLDivElement>) => {
    if ((clickEvent.target as HTMLElement).closest("[data-no-row-nav]")) {
      return;
    }
    onRowClick?.(item);
  };

  const commitTitle = () => {
    const trimmed = draftTitle.trim();
    setEditingTitle(false);
    if (!trimmed || trimmed === item.title) {
      setDraftTitle(item.title);
      return;
    }
    onUpdateItem?.(item.id, { title: trimmed });
  };

  const handleTagsChange = (tagIds: number[]) => {
    const currentTagIds = item.tags.map((tag) => tag.id);
    if (tagIds.join(",") === currentTagIds.join(",")) {
      return;
    }
    setEditingTags(true);
    onUpdateItem?.(item.id, { tag_ids: tagIds });
  };

  const handleStatusChange = (status: TimelinePlanItem["status"]) => {
    setEditingStatus(false);
    if (status === item.status) {
      return;
    }
    onUpdateItem?.(item.id, { status });
  };

  const hasTags = item.tags.length > 0;
  const showInlineTagsEditor = !hasTags || editingTags;

  return (
    <div ref={rowRef} className="relative">
      {showInsertTop ? <ListInsertIndicator position="top" tone="lime" /> : null}
      {showInsertBottom ? <ListInsertIndicator position="bottom" tone="lime" /> : null}
      <div
        onClick={handleRowClick}
        className={[
          TIMELINE_PLAN_ITEM_LIST_GRID_CLASS,
          "cursor-pointer border-b border-stone-800/80 transition hover:bg-stone-900/40",
          isDragging ? "opacity-40" : "",
        ].join(" ")}
      >
        <div
          data-no-row-nav
          className="flex items-center justify-center px-0.5 py-3"
          onClick={(clickEvent) => clickEvent.stopPropagation()}
        >
          {reorderable && onDragStart && onDragEnd ? (
            <ListDragHandle
              isDragging={isDragging}
              disabled={deleteDisabled}
              tone="lime"
              ariaLabel={`Drag to reorder ${item.title}`}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ) : null}
        </div>

        <div className={TIMELINE_PLAN_ITEM_CELL_SCHEDULE}>
          {onUpdateItem ? (
            <TimelinePlanItemScheduleCellPopover
              item={item}
              planStartDate={planStartDate}
              planEndDate={planEndDate}
              disabled={inlineEditDisabled}
              onUpdate={(payload) => onUpdateItem(item.id, payload)}
            />
          ) : (
            <p className="text-sm text-stone-300">{formatPlanItemSchedule(item)}</p>
          )}
        </div>

        <div className={TIMELINE_PLAN_ITEM_CELL_TITLE}>
          {editingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={draftTitle}
              data-no-row-nav
              disabled={inlineEditDisabled}
              onChange={(event) => setDraftTitle(event.target.value)}
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitTitle();
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  setDraftTitle(item.title);
                  setEditingTitle(false);
                }
              }}
              onBlur={commitTitle}
              className="w-full rounded-md bg-stone-950/90 px-2 py-1 text-sm text-stone-100 outline-none ring-1 ring-sky-500/60"
            />
          ) : (
            <button
              type="button"
              data-no-row-nav
              disabled={inlineEditDisabled}
              onClick={(event) => {
                event.stopPropagation();
                if (inlineEditDisabled) {
                  return;
                }
                setEditingTitle(true);
              }}
              className={[
                "max-w-full truncate rounded px-1 py-0.5 text-left text-sm text-stone-100",
                inlineEditDisabled ? "cursor-default" : "hover:bg-stone-900/60",
              ].join(" ")}
              title={item.title}
            >
              {item.title}
            </button>
          )}
        </div>

        <div ref={tagsCellRef} className={TIMELINE_PLAN_ITEM_CELL_TAGS}>
          {showInlineTagsEditor ? (
            <div data-no-row-nav onClick={(event) => event.stopPropagation()}>
              <TimelineEventInlineTags
                tagIdsDraft={item.tags.map((tag) => tag.id)}
                onTagIdsDraftChange={handleTagsChange}
                disabled={inlineEditDisabled}
              />
            </div>
          ) : (
            <button
              type="button"
              data-no-row-nav
              disabled={inlineEditDisabled}
              onClick={(event) => {
                event.stopPropagation();
                if (inlineEditDisabled) {
                  return;
                }
                setEditingTags(true);
              }}
              className={[
                "min-h-[1.75rem] w-full rounded px-1 py-0.5 text-left",
                inlineEditDisabled ? "cursor-default" : "hover:bg-stone-900/60",
              ].join(" ")}
            >
              <div className="flex flex-wrap gap-1">
                {item.tags.map((tag) => (
                  <TimelineTagPill key={tag.id} tag={tag} compact />
                ))}
              </div>
            </button>
          )}
        </div>

        <div className={TIMELINE_PLAN_ITEM_CELL_STATUS}>
          {editingStatus ? (
            <select
              value={item.status}
              data-no-row-nav
              disabled={inlineEditDisabled}
              autoFocus
              onClick={(event) => event.stopPropagation()}
              onChange={(event) =>
                handleStatusChange(event.target.value as TimelinePlanItem["status"])
              }
              onBlur={() => setEditingStatus(false)}
              className="w-full rounded-md bg-stone-950/90 px-2 py-1 text-sm text-stone-100 outline-none ring-1 ring-sky-500/60"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {formatPlanItemStatusLabel(status)}
                </option>
              ))}
            </select>
          ) : (
            <button
              type="button"
              data-no-row-nav
              disabled={inlineEditDisabled}
              onClick={(event) => {
                event.stopPropagation();
                if (inlineEditDisabled) {
                  return;
                }
                setEditingStatus(true);
              }}
              className={[
                "rounded px-1 py-0.5 text-left text-sm text-stone-300",
                inlineEditDisabled ? "cursor-default" : "hover:bg-stone-900/60 hover:text-stone-100",
              ].join(" ")}
            >
              {formatPlanItemStatusLabel(item.status)}
            </button>
          )}
        </div>

        <div
          className="flex items-center justify-center px-0.5 py-3"
          aria-label={item.timeline_event_id != null ? "Event created" : "No event"}
        >
          <PlanItemEventLinkedIndicator linked={item.timeline_event_id != null} />
        </div>

        <div
          ref={containerRef}
          data-no-row-nav
          className="relative z-20 flex items-center justify-center px-0.5 py-3"
          onClick={(clickEvent) => clickEvent.stopPropagation()}
        >
          {onDelete || onRowClick ? (
            <CardMenu
              ariaLabel={`Plan item options for ${item.title}`}
              disabled={deleteDisabled}
              items={[
                ...(onRowClick
                  ? [
                      {
                        id: "view",
                        label: "View",
                        onSelect: () => onRowClick(item),
                      },
                    ]
                  : []),
                ...(onDelete
                  ? [
                      {
                        id: "delete",
                        label: confirmPending ? "Confirm delete" : "Delete",
                        tone: "danger" as const,
                        onSelect: () => handleClick(() => onDelete(item.id)),
                      },
                    ]
                  : []),
              ]}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
