// keel_web/src/modules/timeline/components/tags/TimelineTagListRow.tsx

import { useEffect, useRef, useState, type Ref } from "react";

import { CardMenu } from "../../../../components/CardMenu";
import { useConfirmDeleteAction } from "../../../../hooks/useConfirmDeleteAction";
import type { TimelineTag } from "../../api";
import { normalizeHexColor } from "../../lib/timelineTagDisplay";
import { TimelineTagPill } from "./TimelineTagPill";

export const TIMELINE_TAG_LIST_TABLE_WIDTH_CLASS = "w-full min-w-[61rem]";

export const TIMELINE_TAG_LIST_GRID_CLASS =
  "grid w-full grid-cols-[4.5rem_minmax(0,1fr)_minmax(0,1.25fr)_minmax(0,14rem)_5rem_5rem_3.5rem] items-center";

type TimelineTagListRowProps = {
  tag: TimelineTag;
  disabled?: boolean;
  onRename: (tagId: number, name: string) => void;
  onDescriptionChange: (tagId: number, description: string | null) => void;
  onColorChange: (tagId: number, colorHex: string) => void;
  onDelete?: (tagId: number) => void;
  deleteDisabled?: boolean;
};

function TagColorPicker({
  value,
  disabled,
  label,
  onChange,
}: {
  value: string;
  disabled?: boolean;
  label: string;
  onChange: (colorHex: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-stone-400 ring-1 ring-stone-700 transition hover:text-stone-200 hover:ring-stone-500 disabled:opacity-50"
        aria-label={label}
        title={label}
      >
        <span
          className="h-7 w-7 rounded-full ring-1 ring-inset ring-white/10"
          style={{ backgroundColor: value }}
        />
      </button>
      <input
        ref={inputRef as Ref<HTMLInputElement> | undefined}
        type="color"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(normalizeHexColor(event.target.value))}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
      />
    </>
  );
}

export function TimelineTagListRow({
  tag,
  disabled = false,
  onRename,
  onDescriptionChange,
  onColorChange,
  onDelete,
  deleteDisabled = false,
}: TimelineTagListRowProps) {
  const [draftName, setDraftName] = useState(tag.name);
  const [draftDescription, setDraftDescription] = useState(tag.description ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLInputElement>(null);
  const { confirmPending, containerRef, handleClick } = useConfirmDeleteAction(tag.id);

  useEffect(() => {
    setDraftName(tag.name);
  }, [tag.name]);

  useEffect(() => {
    setDraftDescription(tag.description ?? "");
  }, [tag.description]);

  const previewTag: TimelineTag = {
    ...tag,
    name: draftName.trim() || tag.name,
  };

  const commitName = () => {
    const trimmed = draftName.trim();
    if (!trimmed || trimmed === tag.name) {
      setDraftName(tag.name);
      return;
    }
    onRename(tag.id, trimmed);
  };

  const commitDescription = () => {
    const trimmed = draftDescription.trim();
    const current = tag.description?.trim() || null;
    const next = trimmed || null;
    if (next === current) {
      setDraftDescription(tag.description ?? "");
      return;
    }
    onDescriptionChange(tag.id, next);
  };

  const handleColorChange = (colorHex: string) => {
    if (colorHex.toUpperCase() === tag.color_hex.toUpperCase()) {
      return;
    }
    onColorChange(tag.id, colorHex);
  };

  return (
    <div
      className={[
        "relative grid w-full border-b border-stone-800/80 transition last:border-b-0 hover:bg-stone-900/40",
        TIMELINE_TAG_LIST_GRID_CLASS,
      ].join(" ")}
    >
      <div className="flex items-center px-4 py-3.5">
        <TagColorPicker
          value={tag.color_hex}
          disabled={disabled}
          label={`Change color for ${tag.name}`}
          onChange={handleColorChange}
        />
      </div>

      <div className="flex min-w-0 items-center px-4 py-3.5">
        <input
          ref={inputRef as Ref<HTMLInputElement> | undefined}
          type="text"
          value={draftName}
          maxLength={80}
          disabled={disabled}
          onChange={(event) => setDraftName(event.target.value)}
          onBlur={commitName}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitName();
              inputRef.current?.blur();
            }
            if (event.key === "Escape") {
              event.preventDefault();
              setDraftName(tag.name);
              inputRef.current?.blur();
            }
          }}
          className="w-full rounded-lg bg-transparent px-2 py-1.5 text-sm text-stone-100 ring-1 ring-transparent transition focus:bg-stone-900/50 focus:outline-none focus:ring-stone-700 disabled:opacity-50"
          aria-label={`Tag name for ${tag.name}`}
        />
      </div>

      <div className="flex min-w-0 items-center px-4 py-3.5">
        <input
          ref={descriptionInputRef}
          type="text"
          value={draftDescription}
          maxLength={512}
          disabled={disabled}
          placeholder="-"
          onChange={(event) => setDraftDescription(event.target.value)}
          onBlur={commitDescription}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitDescription();
              descriptionInputRef.current?.blur();
            }
            if (event.key === "Escape") {
              event.preventDefault();
              setDraftDescription(tag.description ?? "");
              descriptionInputRef.current?.blur();
            }
          }}
          className="w-full rounded-lg bg-transparent px-2 py-1.5 text-sm text-stone-100 placeholder:text-stone-600 ring-1 ring-transparent transition focus:bg-stone-900/50 focus:outline-none focus:ring-stone-700 disabled:opacity-50"
          aria-label={`Tag description for ${tag.name}`}
        />
      </div>

      <div className="flex min-w-0 items-center px-4 py-3.5">
        <TimelineTagPill tag={previewTag} />
      </div>

      <div className="flex items-center justify-center px-4 py-3.5">
        <span className="text-sm tabular-nums text-stone-300">{tag.event_count}</span>
      </div>

      <div className="flex items-center justify-center px-4 py-3.5">
        <span className="text-sm tabular-nums text-stone-300">{tag.plan_item_count}</span>
      </div>

      <div
        ref={containerRef}
        className="relative z-20 flex items-center justify-center px-2 py-3.5"
      >
        {onDelete ? (
          <CardMenu
            ariaLabel={`Tag options for ${tag.name}`}
            disabled={deleteDisabled}
            items={[
              {
                id: "delete",
                label: confirmPending ? "Confirm delete" : "Delete",
                tone: "danger",
                onSelect: () => {
                  handleClick(() => onDelete(tag.id));
                },
              },
            ]}
          />
        ) : null}
      </div>
    </div>
  );
}

type TimelineTagDraftRowProps = {
  name: string;
  colorHex: string;
  disabled?: boolean;
  inputRef?: Ref<HTMLInputElement | null>;
  onNameChange: (name: string) => void;
  onColorChange: (colorHex: string) => void;
  onCommit: () => void;
  onCancel: () => void;
};

export function TimelineTagDraftRow({
  name,
  colorHex,
  disabled = false,
  inputRef,
  onNameChange,
  onColorChange,
  onCommit,
  onCancel,
}: TimelineTagDraftRowProps) {
  const previewTag: TimelineTag = {
    id: 0,
    name: name.trim() || "New tag",
    description: null,
    color_hex: colorHex,
    event_count: 0,
    plan_item_count: 0,
  };

  return (
    <div
      className={[
        "relative grid w-full border-b border-stone-800/80 bg-sky-950/20 transition last:border-b-0",
        TIMELINE_TAG_LIST_GRID_CLASS,
      ].join(" ")}
    >
      <div className="flex items-center px-4 py-3.5">
        <TagColorPicker
          value={colorHex}
          disabled={disabled}
          label="New tag color"
          onChange={onColorChange}
        />
      </div>

      <div className="flex min-w-0 items-center px-4 py-3.5">
        <input
          ref={inputRef as Ref<HTMLInputElement> | undefined}
          type="text"
          value={name}
          maxLength={80}
          disabled={disabled}
          placeholder="Tag name"
          onChange={(event) => onNameChange(event.target.value)}
          onBlur={onCommit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onCommit();
            }
            if (event.key === "Escape") {
              event.preventDefault();
              onCancel();
            }
          }}
          className="w-full rounded-lg bg-transparent px-2 py-1.5 text-sm text-stone-100 ring-1 ring-sky-500/40 transition focus:bg-stone-900/50 focus:outline-none focus:ring-sky-500/60 disabled:opacity-50"
          aria-label="New tag name"
        />
      </div>

      <div className="flex min-w-0 items-center px-4 py-3.5">
        <span className="px-2 text-sm text-stone-600">—</span>
      </div>

      <div className="flex min-w-0 items-center px-4 py-3.5">
        <TimelineTagPill tag={previewTag} />
      </div>

      <div className="flex items-center justify-center px-4 py-3.5">
        <span className="text-sm text-stone-600">—</span>
      </div>

      <div className="flex items-center justify-center px-4 py-3.5">
        <span className="text-sm text-stone-600">—</span>
      </div>

      <div className="flex items-center justify-center px-2 py-3.5">
        <button
          type="button"
          disabled={disabled}
          onClick={onCancel}
          className="rounded-md px-2 py-1 text-xs text-stone-400 transition hover:bg-stone-900 hover:text-stone-200 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
