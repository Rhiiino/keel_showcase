// src/modules/focus/components/constellation/canvas/FocusConstellationCanvasStatus.tsx

import { CANVAS_TONES } from "./FocusConstellationCanvas.constants";
import type { FocusConstellationCanvasProps } from "./FocusConstellationCanvas.types";

type FocusConstellationCanvasStatusProps = {
  canvasTone: FocusConstellationCanvasProps["canvasTone"];
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  hasOriginList: boolean;
};

export function FocusConstellationCanvasStatus({
  canvasTone,
  isLoading,
  isError,
  errorMessage,
  hasOriginList,
}: FocusConstellationCanvasStatusProps) {
  const tone = CANVAS_TONES[canvasTone];

  if (isLoading) {
    return (
      <div
        className="flex h-full min-h-0 flex-1 items-center justify-center"
        style={{ backgroundColor: tone.background }}
      >
        <p className="text-sm text-white/40">Loading constellation…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="flex h-full min-h-0 flex-1 items-center justify-center"
        style={{ backgroundColor: tone.background }}
      >
        <p className="text-sm text-rose-300">
          {errorMessage ?? "Failed to load constellation."}
        </p>
      </div>
    );
  }

  if (!hasOriginList) {
    return (
      <div
        className="flex h-full min-h-0 flex-1 items-center justify-center px-6 text-center"
        style={{ backgroundColor: tone.background }}
      >
        <p className="text-sm text-white/45">
          No origin list is set. Mark one list as the origin to use constellation view.
        </p>
      </div>
    );
  }

  return null;
}
