// keel_web/src/modules/media/components/panels/MediaPanelsCarouselView.tsx

// Horizontally scrolling carousel of display panel previews.

import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import type { MediaPanel, MediaPanelDetail } from "../../api";
import { formatCreatedAt } from "../../lib/media";
import { ConfirmTrashButton } from "../shared/actions";
import { InlineEditableTitle } from "../shared/InlineEditableTitle";
import { MediaPanelMiniPreview } from "./MediaPanelMiniPreview";

const CAROUSEL_CARD_CLASS = "h-64 w-52";
const CAROUSEL_SCROLL_PADDING = "px-[calc(50%_-_6.5rem)]";

type MediaPanelsCarouselViewProps = {
  panels: MediaPanel[];
  panelDetailsById: Map<string, MediaPanelDetail>;
  onDelete?: (panelId: string) => void;
  deleteDisabled?: boolean;
  onRename?: (panelId: string, name: string) => void;
  renameDisabled?: boolean;
};

export function MediaPanelsCarouselView({
  panels,
  panelDetailsById,
  onDelete,
  deleteDisabled = false,
  onRename,
  renameDisabled = false,
}: MediaPanelsCarouselViewProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const frameRef = useRef<number | null>(null);

  const updateActiveFromScroll = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller || panels.length === 0) {
      return;
    }

    const scrollerRect = scroller.getBoundingClientRect();
    const scrollerCenter = scrollerRect.left + scrollerRect.width / 2;
    let nextIndex = 0;
    let smallestDistance = Number.POSITIVE_INFINITY;

    cardRefs.current.forEach((card, index) => {
      if (!card) {
        return;
      }
      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      const distance = Math.abs(cardCenter - scrollerCenter);
      if (distance < smallestDistance) {
        smallestDistance = distance;
        nextIndex = index;
      }
    });

    setActiveIndex((current) => (current === nextIndex ? current : nextIndex));
  }, [panels.length]);

  useEffect(() => {
    if (activeIndex >= panels.length) {
      setActiveIndex(Math.max(0, panels.length - 1));
    }
  }, [activeIndex, panels.length]);

  useEffect(() => {
    updateActiveFromScroll();
  }, [panels, updateActiveFromScroll]);

  useEffect(
    () => () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    },
    [],
  );

  const handleScroll = () => {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
    }
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      updateActiveFromScroll();
    });
  };

  const activePanel = panels[activeIndex] ?? panels[0];
  const activeDetail = activePanel ? panelDetailsById.get(activePanel.id) : undefined;

  if (!activePanel) {
    return (
      <p className="rounded-2xl border border-dashed border-white/[0.08] px-6 py-10 text-center text-sm text-stone-500">
        No panels yet. Create one to start curating a display board.
      </p>
    );
  }

  return (
    <section aria-label="Panels carousel" className="space-y-8">
      <div className="w-full">
        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          className={[
            "overflow-x-auto overflow-y-visible scroll-smooth py-12 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            CAROUSEL_SCROLL_PADDING,
          ].join(" ")}
        >
          <div className="flex w-max snap-x snap-mandatory items-center gap-8">
            {panels.map((panel, index) => (
              <PanelCarouselCard
                key={panel.id}
                panel={panel}
                items={panelDetailsById.get(panel.id)?.items ?? []}
                index={index}
                activeIndex={activeIndex}
                cardRef={(node) => {
                  cardRefs.current[index] = node;
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <ActivePanelSummary
        panel={activePanel}
        itemCount={activeDetail?.items.length ?? activePanel.item_count}
        onDelete={onDelete}
        deleteDisabled={deleteDisabled}
        onRename={onRename}
        renameDisabled={renameDisabled}
      />
    </section>
  );
}

type PanelCarouselCardProps = {
  panel: MediaPanel;
  items: MediaPanelDetail["items"];
  index: number;
  activeIndex: number;
  cardRef: (node: HTMLAnchorElement | null) => void;
};

function PanelCarouselCard({
  panel,
  items,
  index,
  activeIndex,
  cardRef,
}: PanelCarouselCardProps) {
  const distance = Math.abs(index - activeIndex);
  const isActive = index === activeIndex;
  const scaleClass =
    distance === 0
      ? "scale-125 opacity-100"
      : distance === 1
        ? "scale-100 opacity-85"
        : "scale-90 opacity-60";

  return (
    <Link
      ref={cardRef}
      to={`/media/panels/${panel.id}`}
      aria-label={`Open panel ${panel.name}`}
      aria-current={isActive ? "true" : undefined}
      className={[
        "group relative flex shrink-0 snap-center items-center justify-center overflow-hidden rounded-2xl bg-stone-950/40 p-2 shadow-2xl shadow-black/30 ring-1 ring-white/[0.08]",
        CAROUSEL_CARD_CLASS,
        "transition-[transform,opacity,box-shadow,ring-color] duration-300 ease-out hover:opacity-100 hover:ring-stone-500/80",
        scaleClass,
        isActive ? "z-20 shadow-sky-950/30 ring-sky-400/60" : "z-10",
      ].join(" ")}
    >
      <MediaPanelMiniPreview
        columnCount={panel.column_count}
        rowUnitPx={panel.row_unit_px}
        items={items}
        variant="carousel"
      />
    </Link>
  );
}

type ActivePanelSummaryProps = {
  panel: MediaPanel;
  itemCount: number;
  onDelete?: (panelId: string) => void;
  deleteDisabled?: boolean;
  onRename?: (panelId: string, name: string) => void;
  renameDisabled?: boolean;
};

function ActivePanelSummary({
  panel,
  itemCount,
  onDelete,
  deleteDisabled = false,
  onRename,
  renameDisabled = false,
}: ActivePanelSummaryProps) {
  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-stone-800 bg-stone-950/60 p-5 shadow-xl shadow-black/20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Current panel
          </p>
          <InlineEditableTitle
            value={panel.name}
            disabled={!onRename || renameDisabled}
            onSave={(name) => onRename?.(panel.id, name)}
          />
          <p className="mt-2 text-sm text-stone-400">
            {itemCount} {itemCount === 1 ? "tile" : "tiles"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
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

      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-stone-500">Updated</dt>
          <dd className="mt-1 text-sm text-stone-200">
            {formatCreatedAt(panel.updated_at)}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-stone-500">Created</dt>
          <dd className="mt-1 text-sm text-stone-200">
            {formatCreatedAt(panel.created_at)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
