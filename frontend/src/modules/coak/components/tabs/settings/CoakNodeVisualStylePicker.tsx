// keel_web/src/modules/coak/components/tabs/settings/CoakNodeVisualStylePicker.tsx

import { useLayoutEffect, useRef, useState } from "react";

import type { CoakItemKind } from "../../../api";
import {
  COAK_ITEM_KIND_LABELS,
  COAK_NODE_VISUAL_PREVIEW_COLOR,
  COAK_NODE_VISUAL_STYLES,
  type CoakNodeVisualStyle,
} from "../../../lib/tabs/settings/coakNodeVisualSettings";
import { coakNodeVisualSettingInfo } from "../../../lib/tabs/settings/coakSettingsInfoCopy";
import { CoakNodeVisualPreviewRowCanvas } from "./CoakNodeVisualPreviewRowCanvas";
import { CoakSettingsLabel } from "./CoakSettingsLabel";

type CoakNodeVisualStylePickerProps = {
  kind: CoakItemKind;
  value: CoakNodeVisualStyle;
  previewColor?: string;
  onChange: (style: CoakNodeVisualStyle) => void;
};

function measureColumnCenters(grid: HTMLDivElement): number[] {
  const gridRect = grid.getBoundingClientRect();
  if (gridRect.width <= 0) {
    return [];
  }

  const buttons = grid.querySelectorAll<HTMLButtonElement>("button[data-preview-slot]");
  return Array.from(buttons).map((button) => {
    const rect = button.getBoundingClientRect();
    return (rect.left + rect.width / 2 - gridRect.left) / gridRect.width;
  });
}

export function CoakNodeVisualStylePicker({
  kind,
  value,
  previewColor = COAK_NODE_VISUAL_PREVIEW_COLOR,
  onChange,
}: CoakNodeVisualStylePickerProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [columnCenters, setColumnCenters] = useState<number[]>([]);
  const previewSeed = `coak-node-visual-preview-${kind}`;

  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) {
      return;
    }

    const updateCenters = () => {
      setColumnCenters(measureColumnCenters(grid));
    };

    updateCenters();

    const observer = new ResizeObserver(updateCenters);
    observer.observe(grid);
    window.addEventListener("resize", updateCenters);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateCenters);
    };
  }, []);

  return (
    <div className="flex flex-col items-start gap-2">
      <CoakSettingsLabel info={coakNodeVisualSettingInfo(kind)} className="text-xs font-medium text-stone-300">
        {COAK_ITEM_KIND_LABELS[kind]}
      </CoakSettingsLabel>
      <div
        ref={gridRef}
        className="relative grid grid-cols-6 gap-2 rounded-lg bg-stone-950/80 p-1"
        role="group"
        aria-label={`${COAK_ITEM_KIND_LABELS[kind]} node visual`}
      >
        {COAK_NODE_VISUAL_STYLES.map((style) => {
          const selected = value === style;
          return (
            <button
              key={style}
              type="button"
              data-preview-slot
              aria-pressed={selected}
              aria-label={`${COAK_ITEM_KIND_LABELS[kind]} ${style} visual`}
              onClick={() => onChange(style)}
              className={[
                "relative z-10 h-14 w-14 rounded-md transition",
                selected
                  ? "ring-2 ring-stone-200/80 ring-offset-1 ring-offset-stone-900"
                  : "hover:bg-stone-800/50",
              ].join(" ")}
            />
          );
        })}
        <CoakNodeVisualPreviewRowCanvas
          seed={previewSeed}
          color={previewColor}
          styles={COAK_NODE_VISUAL_STYLES}
          columnCenters={columnCenters}
        />
      </div>
    </div>
  );
}
