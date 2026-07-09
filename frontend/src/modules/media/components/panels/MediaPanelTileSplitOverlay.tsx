// keel_web/src/modules/media/components/panels/MediaPanelTileSplitOverlay.tsx

// Inline split-zone highlight with embedded media picker.

import type { MediaObject } from "../../api";
import type { SplitZone } from "../../lib/panelGridSplit";
import { MediaObjectPickerList } from "../pickers/MediaObjectPickerList";

const SPLIT_ZONE_CLASS: Record<SplitZone, string> = {
  top: "inset-x-0 top-0 h-1/2",
  bottom: "inset-x-0 bottom-0 h-1/2",
  left: "inset-y-0 left-0 w-1/2",
  right: "inset-y-0 right-0 w-1/2",
};

type MediaPanelTileSplitOverlayProps = {
  zone: SplitZone;
  pickerOpen: boolean;
  excludeMediaIds: string[];
  onZoneClick: (zone: SplitZone) => void;
  onPickSelect: (media: MediaObject) => void;
  onPickCancel: () => void;
};

export function MediaPanelTileSplitOverlay({
  zone,
  pickerOpen,
  excludeMediaIds,
  onZoneClick,
  onPickSelect,
  onPickCancel,
}: MediaPanelTileSplitOverlayProps) {
  if (pickerOpen) {
    return (
      <div
        data-panel-split-picker
        className={[
          "absolute z-10 flex flex-col overflow-hidden rounded-2xl border-2 border-sky-300/80 bg-stone-950 shadow-[inset_0_0_24px_rgba(56,189,248,0.12)]",
          SPLIT_ZONE_CLASS[zone],
        ].join(" ")}
      >
        <MediaObjectPickerList
          compact
          excludeMediaIds={excludeMediaIds}
          onSelect={onPickSelect}
          onCancel={onPickCancel}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      aria-label={`Add file to ${zone} of tile`}
      onClick={(event) => {
        event.stopPropagation();
        onZoneClick(zone);
      }}
      className={[
        "absolute z-10 cursor-pointer rounded-2xl border-2 border-sky-300/80 bg-sky-400/20 shadow-[inset_0_0_24px_rgba(56,189,248,0.15)] transition",
        SPLIT_ZONE_CLASS[zone],
      ].join(" ")}
    />
  );
}
