// keel_web/src/components/keelPersona/KeelPersonaRenderer.tsx

import type { CanvasPoint } from "../../lib/keelPersona/geometry/canvasPointer";
import type { KeelAnimationLayers, KeelPersonaElement, KeelSquintEyeSide } from "../../lib/keelPersona";
import type { KeelGazeBlendState } from "../../lib/keelPersona/motionPlayback";
import { DEFAULT_KEEL_PERSONA_PLAYBACK_SIZE_PX } from "../../lib/keelPersona/types";
import { KeelLoadingIcon } from "./loadingIcon/KeelLoadingIcon";
import { KeelPersonaElementStack } from "./elements/KeelPersonaElementStack";
import { KEEL_PERSONA_PLAYBACK_HANDLERS } from "./playbackHandlers";

type KeelPersonaRendererProps = {
  elements: readonly KeelPersonaElement[];
  focusedElementId?: string | null;
  baseOffset?: CanvasPoint;
  size?: number;
  designCanvasPx?: number;
  happyEyesActive?: boolean;
  orangeEyeGlow?: boolean;
  motionLayers?: KeelAnimationLayers;
  gazeBlend?: KeelGazeBlendState | null;
  squintEyeSide?: KeelSquintEyeSide;
  teslaLineGlowElapsedMs?: number;
  showBase?: boolean;
  compositorLoading?: boolean;
};

export function KeelPersonaRenderer({
  elements,
  focusedElementId = null,
  baseOffset = { x: 0, y: 0 },
  size = DEFAULT_KEEL_PERSONA_PLAYBACK_SIZE_PX,
  designCanvasPx,
  happyEyesActive = false,
  orangeEyeGlow = false,
  motionLayers = {},
  gazeBlend = null,
  squintEyeSide,
  teslaLineGlowElapsedMs,
  showBase = true,
  compositorLoading = false,
}: KeelPersonaRendererProps) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${baseOffset.x}px, ${baseOffset.y}px)`,
        }}
      >
        <div className="pointer-events-none absolute inset-0 z-0">
          {showBase ? <KeelLoadingIcon size={size} /> : null}
        </div>
        <KeelPersonaElementStack
          className="z-10"
          elements={elements}
          focusedElementId={focusedElementId}
          designCanvasPx={designCanvasPx}
          happyEyesActive={happyEyesActive}
          orangeEyeGlow={orangeEyeGlow}
          motionLayers={motionLayers}
          gazeBlend={gazeBlend}
          squintEyeSide={squintEyeSide}
          teslaLineGlowElapsedMs={teslaLineGlowElapsedMs}
          compositorLoading={compositorLoading}
          {...KEEL_PERSONA_PLAYBACK_HANDLERS}
        />
      </div>
    </div>
  );
}
