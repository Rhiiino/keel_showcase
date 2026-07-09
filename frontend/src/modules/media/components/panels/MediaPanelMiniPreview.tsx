// keel_web/src/modules/media/components/panels/MediaPanelMiniPreview.tsx

// Scaled-down read-only preview of a full display panel grid.

import { buildMediaContentUrl, type MediaPanelItem } from "../../api";
import { rectEndY, type PanelPlacement } from "../../lib/panelGrid";
import {
  panelGridViewportContentHeightPx,
  PANEL_GRID_GAP_PX,
  PANEL_GRID_SHELL_PADDING_PX,
} from "../../lib/panelGridMetrics";
import { mediaPanelTileBorderStyle } from "../../lib/panelTileBorderColors";
import {
  panelTilePreviewFromItem,
} from "../../lib/panelTilePreview";
import { MediaPreview } from "../shared/MediaPreview";

type MediaPanelMiniPreviewProps = {
  columnCount: number;
  rowUnitPx: number;
  items: MediaPanelItem[];
  variant: "list" | "carousel";
};

const VARIANT_BOX = {
  list: { width: 120, height: 56 },
  carousel: { width: 192, height: 240 },
} as const;

function MiniPanelTile({ item }: { item: MediaPanelItem }) {
  const previewUrl =
    item.media.status === "ready"
      ? buildMediaContentUrl(item.media.id, item.media.updated_at)
      : null;
  const panelPreview = panelTilePreviewFromItem(item);
  const border = mediaPanelTileBorderStyle(item.border_color);

  return (
    <div
      className={[
        "relative h-full w-full overflow-hidden rounded-md bg-stone-950",
        border.className,
      ].join(" ")}
      style={{
        gridColumn: `${item.grid_x + 1} / span ${item.col_span}`,
        gridRow: `${item.grid_y + 1} / span ${item.row_span}`,
        ...border.style,
      }}
    >
      <div
        className="h-full w-full overflow-hidden"
      >
        <MediaPreview
          srcUrl={previewUrl}
          mimeType={item.media.mime_type}
          mediaKind={item.media.media_kind}
          alt={item.media.original_filename}
          size="panel"
          panelPreview={panelPreview}
        />
      </div>
    </div>
  );
}

export function MediaPanelMiniPreview({
  columnCount,
  rowUnitPx,
  items,
  variant,
}: MediaPanelMiniPreviewProps) {
  const box = VARIANT_BOX[variant];
  const maxRow =
    items.length === 0
      ? 1
      : Math.max(...items.map((item) => rectEndY(item as PanelPlacement)));
  const innerHeight = panelGridViewportContentHeightPx(maxRow, rowUnitPx);
  const scale = box.height / innerHeight;
  const innerWidth = box.width / scale;

  if (items.length === 0) {
    return (
      <div
        className="flex items-center justify-center overflow-hidden rounded-xl bg-stone-950/20 ring-1 ring-white/[0.08]"
        style={{ width: box.width, height: box.height }}
      >
        <span className="text-[0.65rem] text-stone-500">Empty</span>
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-xl bg-stone-950/20 ring-1 ring-white/[0.08]"
      style={{ width: box.width, height: box.height }}
      aria-hidden
    >
      <div
        className="origin-top-left"
        style={{
          transform: `scale(${scale})`,
          width: innerWidth,
          height: innerHeight,
        }}
      >
        <div
          className="h-full w-full rounded-xl bg-stone-950/20"
          style={{ padding: PANEL_GRID_SHELL_PADDING_PX }}
        >
          <div
            className="grid h-full w-full"
            style={{
              gap: PANEL_GRID_GAP_PX,
              gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${maxRow}, ${rowUnitPx}px)`,
            }}
          >
            {items.map((item) => (
              <MiniPanelTile key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
