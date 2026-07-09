// src/modules/focus/components/cards/card/FocusListCard.tsx

// Card linking to a focus list detail page.

import { Link, useNavigate } from "react-router-dom";

import { projectTitleFontStyle } from "../../../../projects/lib/project/appearance";
import { CardMenu } from "../../../../../components/CardMenu";
import type { FocusEntry, FocusList } from "../../../api";
import {
  FOCUS_LIST_CARD_GLASS_CLASS,
  FOCUS_LIST_CARD_GLASS_HOVER_CLASS,
} from "../../../lib/appearance";
import { FocusListCardColorPicker } from "./FocusListCardColorPicker";
import { FocusListCardDepth } from "./FocusListCardDepth";
import { FocusListCardItemsPanel } from "./FocusListCardItemsPanel";
import { FocusListCardItemsToggle } from "./FocusListCardItemsToggle";
import { FocusScopedConstellationIcon } from "../../shared/icons";
import { FocusTagPill } from "../../shared/tags";

type FocusListCardProps = {
  list: FocusList;
  onDelete: (listId: number) => void;
  onColorChange: (listId: number, nodeColorHex: string | null) => void;
  deleteDisabled?: boolean;
  colorDisabled?: boolean;
  itemsExpanded?: boolean;
  onToggleItemsExpanded?: () => void;
  peekEntries?: FocusEntry[];
  peekLoading?: boolean;
  compactTitleOnly?: boolean;
  shouldSuppressClick?: () => boolean;
  onOpenScopedConstellation?: () => void;
  constellationActionLabel?: string;
  /** Hub grid cards use a div + navigate so native <a> drag does not steal pointer drags. */
  hubInteraction?: boolean;
};

export function FocusListCard({
  list,
  onDelete,
  onColorChange,
  deleteDisabled = false,
  colorDisabled = false,
  itemsExpanded = false,
  onToggleItemsExpanded,
  peekEntries = [],
  peekLoading = false,
  compactTitleOnly = false,
  shouldSuppressClick,
  onOpenScopedConstellation,
  constellationActionLabel,
  hubInteraction = false,
}: FocusListCardProps) {
  const navigate = useNavigate();
  const resolvedConstellationActionLabel =
    constellationActionLabel ?? `Open scoped constellation for ${list.title}`;

  const openList = () => {
    if (shouldSuppressClick?.()) {
      return;
    }
    navigate(`/focus/lists/${list.id}`);
  };

  const cardBodyClassName = [
    "relative z-10 flex min-h-[7.5rem] flex-col p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25",
    itemsExpanded ? "pr-4" : "pr-16",
    hubInteraction ? "cursor-pointer" : "",
  ].join(" ");

  const cardBodyContent = (
    <>
      <h2
        className="pr-8 text-base font-semibold text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)] group-hover:text-white"
        style={projectTitleFontStyle(list.title_font_key)}
      >
        {list.title}
      </h2>

      {list.notes ? (
        <p className="mt-2 line-clamp-2 text-sm text-white/45">{list.notes}</p>
      ) : null}

      {list.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {list.tags.map((tag) => (
            <FocusTagPill key={tag.id} tag={tag} />
          ))}
        </div>
      ) : null}

      <div className="mt-auto flex items-center justify-between gap-2 pt-3 pr-10">
        <p className="text-xs text-white/35">
          {list.item_count} {list.item_count === 1 ? "item" : "items"}
        </p>
      </div>
    </>
  );

  return (
    <div className="relative select-none">
      <article
        className={[
          "group relative z-20 overflow-visible transition-[box-shadow,ring-color] duration-150",
          FOCUS_LIST_CARD_GLASS_CLASS,
          compactTitleOnly ? "" : FOCUS_LIST_CARD_GLASS_HOVER_CLASS,
          itemsExpanded ? "rounded-b-none" : "",
        ].join(" ")}
      >
        <div
          className={[
            "pointer-events-none absolute inset-0 overflow-hidden",
            itemsExpanded ? "rounded-t-2xl" : "rounded-2xl",
          ].join(" ")}
        >
          <FocusListCardDepth colorHex={list.node_color_hex} />
        </div>

        {compactTitleOnly ? (
          <div className="relative z-10 min-h-[3.5rem] p-2">
            <h2
              className="line-clamp-3 text-[11px] font-semibold text-white/90"
              style={projectTitleFontStyle(list.title_font_key)}
            >
              {list.title}
            </h2>
          </div>
        ) : (
          <>
            {hubInteraction ? (
              <div
                role="link"
                tabIndex={0}
                data-focus-card-body
                onClick={openList}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openList();
                  }
                }}
                className={cardBodyClassName}
              >
                {cardBodyContent}
              </div>
            ) : (
              <Link
                to={`/focus/lists/${list.id}`}
                draggable={false}
                onDragStart={(event) => event.preventDefault()}
                onClick={(event) => {
                  if (shouldSuppressClick?.()) {
                    event.preventDefault();
                  }
                }}
                className={cardBodyClassName}
              >
                {cardBodyContent}
              </Link>
            )}

            <div
              data-focus-card-control
              className="pointer-events-auto absolute right-3 top-3 z-50 flex items-center gap-1.5 overflow-visible"
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
            >
              {onOpenScopedConstellation ? (
                <button
                  type="button"
                  aria-label={resolvedConstellationActionLabel}
                  title={resolvedConstellationActionLabel}
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenScopedConstellation();
                  }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/20 text-white/70 transition hover:bg-white/[0.08] hover:text-white/90"
                >
                  <FocusScopedConstellationIcon />
                </button>
              ) : null}
              <FocusListCardColorPicker
                colorHex={list.node_color_hex}
                disabled={colorDisabled}
                onChange={(hex) => onColorChange(list.id, hex)}
              />
              <CardMenu
                ariaLabel={`Actions for ${list.title}`}
                disabled={deleteDisabled}
                items={[
                  {
                    id: "delete",
                    label: "Delete",
                    tone: "danger",
                    onSelect: () => onDelete(list.id),
                  },
                ]}
              />
            </div>

            {onToggleItemsExpanded ? (
              <div
                data-focus-card-control
                className="pointer-events-auto absolute bottom-3 right-3 z-50"
                onPointerDown={(event) => event.stopPropagation()}
              >
                <FocusListCardItemsToggle
                  expanded={itemsExpanded}
                  listTitle={list.title}
                  onClick={onToggleItemsExpanded}
                />
              </div>
            ) : null}
          </>
        )}
      </article>

      {!compactTitleOnly && onToggleItemsExpanded ? (
        <FocusListCardItemsPanel
          expanded={itemsExpanded}
          entries={peekEntries}
          loading={peekLoading}
        />
      ) : null}
    </div>
  );
}
