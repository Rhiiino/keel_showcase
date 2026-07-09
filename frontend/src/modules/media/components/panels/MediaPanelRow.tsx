// keel_web/src/modules/media/components/panels/MediaPanelRow.tsx

// One panel row in the panels list table.

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import type { MediaPanel, MediaPanelItem } from "../../api";
import { formatTimestampParts } from "../../lib/media";
import { ConfirmTrashButton } from "../shared/actions";
import { MediaPanelMiniPreview } from "./MediaPanelMiniPreview";

export const MEDIA_PANEL_LIST_GRID_CLASS =
  "grid-cols-[8.5rem_minmax(0,1.5fr)_7rem_11rem_5.5rem] gap-x-4";

type MediaPanelRowProps = {
  panel: MediaPanel;
  items?: MediaPanelItem[];
  previewLoading?: boolean;
  onRename?: (panelId: string, name: string) => void;
  renameDisabled?: boolean;
  onDelete?: (panelId: string) => void;
  deleteDisabled?: boolean;
};

export function MediaPanelRow({
  panel,
  items = [],
  previewLoading = false,
  onRename,
  renameDisabled = false,
  onDelete,
  deleteDisabled = false,
}: MediaPanelRowProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState(panel.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditingName) {
      setDraftName(panel.name);
    }
  }, [isEditingName, panel.name]);

  useEffect(() => {
    if (isEditingName) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditingName]);

  const commitNameEdit = () => {
    const trimmed = draftName.trim();
    setIsEditingName(false);
    if (!trimmed || trimmed === panel.name) {
      setDraftName(panel.name);
      return;
    }
    onRename?.(panel.id, trimmed);
  };

  const discardNameEdit = () => {
    setDraftName(panel.name);
    setIsEditingName(false);
  };

  const startEditingName = () => {
    if (!onRename || renameDisabled) {
      return;
    }
    setDraftName(panel.name);
    setIsEditingName(true);
  };

  const updatedParts = formatTimestampParts(panel.updated_at);
  const itemLabel = panel.item_count === 1 ? "tile" : "tiles";

  return (
    <div
      className={[
        "relative grid min-w-[36rem] items-center border-b border-stone-800/80 transition last:border-b-0 hover:bg-stone-900/40",
        MEDIA_PANEL_LIST_GRID_CLASS,
      ].join(" ")}
    >
      <Link
        to={`/media/panels/${panel.id}`}
        className="absolute inset-0 z-0"
        aria-label={`Open panel ${panel.name}`}
      />

      <div className="relative z-10 py-3 pl-4 pr-1 pointer-events-none">
        {previewLoading ? (
          <div
            className="animate-pulse rounded-xl bg-stone-900/70 ring-1 ring-white/[0.08]"
            style={{ width: 120, height: 56 }}
          />
        ) : (
          <MediaPanelMiniPreview
            columnCount={panel.column_count}
            rowUnitPx={panel.row_unit_px}
            items={items}
            variant="list"
          />
        )}
      </div>

      <div className="relative z-20 py-3 pl-2 pr-4">
        {isEditingName ? (
          <input
            ref={inputRef}
            value={draftName}
            disabled={renameDisabled}
            onChange={(event) => setDraftName(event.target.value)}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitNameEdit();
              }
              if (event.key === "Escape") {
                event.preventDefault();
                discardNameEdit();
              }
            }}
            onBlur={commitNameEdit}
            className="w-full rounded-md bg-stone-950/90 px-2 py-1 text-sm font-medium text-stone-100 outline-none ring-1 ring-sky-500/60"
          />
        ) : (
          <button
            type="button"
            disabled={!onRename || renameDisabled}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              startEditingName();
            }}
            className={[
              "max-w-full truncate rounded px-0 py-0.5 text-left text-sm font-medium text-stone-100",
              onRename && !renameDisabled ? "hover:text-sky-200" : "cursor-default",
            ].join(" ")}
            title={panel.name}
          >
            {panel.name}
          </button>
        )}
      </div>

      <div className="relative z-10 px-4 py-3 pointer-events-none">
        <span className="inline-flex items-baseline gap-1 rounded-md bg-stone-900/70 px-2.5 py-1 text-xs font-medium tabular-nums ring-1 ring-inset ring-stone-700/60">
          <span className="text-sm text-stone-100">{panel.item_count}</span>
          <span className="text-stone-500">{itemLabel}</span>
        </span>
      </div>

      <div className="relative z-10 px-4 py-3 pointer-events-none">
        {updatedParts ? (
          <div className="flex flex-col gap-0.5">
            <span className="whitespace-nowrap text-sm font-medium text-stone-200">
              {updatedParts.date}
            </span>
            <span className="whitespace-nowrap text-xs tabular-nums text-stone-500">
              {updatedParts.time}
            </span>
          </div>
        ) : (
          <p className="whitespace-nowrap text-sm text-stone-400">{panel.updated_at}</p>
        )}
      </div>

      <div
        className="relative z-20 flex justify-center px-2 py-3"
        onClick={(event) => event.stopPropagation()}
      >
        {onDelete ? (
          <ConfirmTrashButton
            resetKey={panel.id}
            disabled={deleteDisabled}
            ariaLabel={`Delete panel ${panel.name}`}
            onConfirm={() => onDelete(panel.id)}
          />
        ) : null}
      </div>
    </div>
  );
}
