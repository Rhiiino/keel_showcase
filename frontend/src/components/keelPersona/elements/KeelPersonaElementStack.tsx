// keel_web/src/components/keelPersona/elements/KeelPersonaElementStack.tsx

import type { CSSProperties, PointerEvent, ReactNode } from "react";

import type { KeelAnimationLayers, KeelPersonaDotElement, KeelPersonaElement } from "../../../lib/keelPersona";
import type { KeelPersonaPlaybackElement } from "../../../lib/keelPersona/playbackElements";
import { KEEL_PERSONA_DESIGN_CANVAS_PX } from "../../../lib/keelPersona/designCanvas";
import { resolveKeelEyeScaleMultiplier } from "../../../lib/keelPersona/eyeScale";
import { KEEL_GAZE_GROUP_POSITIONS } from "../../../lib/keelPersona/gazeTransition";
import { percentToPixel } from "../../../lib/keelPersona/geometry/loadingIconGeometry";
import {
  isGazeEyeDot,
  isLeftGazeEyeDot,
  isStraightGazeEyeDot,
} from "../../../lib/keelPersona/happyEyeMorph";
import type { KeelGazeBlendState } from "../../../lib/keelPersona/motionPlayback";
import type { KeelSquintEyeSide } from "../../../lib/keelPersona/types";
import {
  getTeslaEyeGlowIntensity,
  getTeslaEyeScaleMultiplier,
  getTeslaLineGlowClip,
} from "../../../lib/keelPersona/teslaLineGlow";
import { KeelPersonaDotElementView, type KeelGazeBlendOffset } from "./KeelPersonaDotElement";
import { KeelPersonaGlassOverlayElementView } from "./KeelPersonaGlassOverlayElement";
import { KeelPersonaLineElementView } from "./KeelPersonaLineElement";
import { KeelPersonaMediaElementView, type KeelMediaSpawnState } from "./KeelPersonaMediaElement";
import { KeelPersonaPolygonOverlayElementView } from "./KeelPersonaPolygonOverlayElement";

type KeelPersonaElementStackProps = {
  elements: readonly KeelPersonaElement[];
  focusedElementId: string | null;
  className?: string;
  designCanvasPx?: number;
  happyEyesActive?: boolean;
  orangeEyeGlow?: boolean;
  motionLayers?: KeelAnimationLayers;
  gazeBlend?: KeelGazeBlendState | null;
  squintEyeSide?: KeelSquintEyeSide;
  /** Elapsed ms for Tesla line glow; omit when inactive. */
  teslaLineGlowElapsedMs?: number;
  /**
   * Loading compositor mode: mount the union of clip elements once and tag each
   * node so a Web Animations API timeline can drive its transform/opacity on the
   * compositor. Per-step transient classes are disabled; continuous layers
   * (happy eyes, orange glow, wobble) still render as CSS.
   */
  compositorLoading?: boolean;
  onDotPointerDown: (elementId: string, event: PointerEvent<HTMLElement>) => void;
  onPolygonBodyPointerDown: (elementId: string, event: PointerEvent<HTMLElement>) => void;
  onPolygonCornerPointerDown: (
    elementId: string,
    cornerIndex: number,
    event: PointerEvent<HTMLElement>,
  ) => void;
  onGlassBodyPointerDown: (elementId: string, event: PointerEvent<HTMLElement>) => void;
  onGlassCornerPointerDown: (
    elementId: string,
    cornerIndex: number,
    event: PointerEvent<HTMLElement>,
  ) => void;
  onLineBodyPointerDown: (elementId: string, event: PointerEvent<HTMLElement>) => void;
  onLineRotatePointerDown: (elementId: string, event: PointerEvent<HTMLElement>) => void;
  onMediaBodyPointerDown: (elementId: string, event: PointerEvent<HTMLElement>) => void;
  onMediaRotatePointerDown: (elementId: string, event: PointerEvent<HTMLElement>) => void;
  onMediaScalePointerDown: (elementId: string, event: PointerEvent<HTMLElement>) => void;
  onMediaNaturalDimensions: (elementId: string, width: number, height: number) => void;
  onPointerMove: (elementId: string, event: PointerEvent<HTMLElement>) => void;
  onPointerUp: (elementId: string, event: PointerEvent<HTMLElement>) => void;
  onContextMenu: (elementId: string, event: React.MouseEvent<HTMLElement>) => void;
};

function isSquintingEye(
  element: KeelPersonaDotElement,
  squintEyeSide: KeelSquintEyeSide | undefined,
): boolean {
  if (!squintEyeSide || !isGazeEyeDot(element)) {
    return false;
  }

  const isLeft = isLeftGazeEyeDot(element);
  return squintEyeSide === "left" ? isLeft : !isLeft;
}

function isPlaybackHidden(element: KeelPersonaElement): boolean {
  return (element as KeelPersonaPlaybackElement).playbackHidden === true;
}

const PLAYBACK_HIDDEN_STYLE: CSSProperties = {
  opacity: 0,
  visibility: "hidden",
  pointerEvents: "none",
  contentVisibility: "hidden",
};

function wrapPlaybackElement(elementId: string, hidden: boolean, node: ReactNode): ReactNode {
  if (!hidden) {
    return node;
  }

  return (
    <div key={elementId} className="pointer-events-none" style={PLAYBACK_HIDDEN_STYLE}>
      {node}
    </div>
  );
}

function resolveGazeBlendOffset(
  element: KeelPersonaDotElement,
  gazeBlend: KeelGazeBlendState | null,
  designCanvasPx: number,
): KeelGazeBlendOffset | null {
  if (!gazeBlend || !isGazeEyeDot(element)) {
    return null;
  }

  const fromPositions = KEEL_GAZE_GROUP_POSITIONS[gazeBlend.fromGroupId];
  if (!fromPositions) {
    return null;
  }

  const fromPosition = isLeftGazeEyeDot(element) ? fromPositions.left : fromPositions.right;

  return {
    fromDxPx: percentToPixel(fromPosition.xPct, designCanvasPx) - element.x,
    fromDyPx: percentToPixel(fromPosition.yPct, designCanvasPx) - element.y,
    durationMs: gazeBlend.durationMs,
  };
}

export function KeelPersonaElementStack({
  elements,
  focusedElementId,
  className,
  designCanvasPx = KEEL_PERSONA_DESIGN_CANVAS_PX,
  happyEyesActive = false,
  orangeEyeGlow = false,
  motionLayers = {},
  gazeBlend = null,
  squintEyeSide,
  teslaLineGlowElapsedMs,
  compositorLoading = false,
  onDotPointerDown,
  onPolygonBodyPointerDown,
  onPolygonCornerPointerDown,
  onGlassBodyPointerDown,
  onGlassCornerPointerDown,
  onLineBodyPointerDown,
  onLineRotatePointerDown,
  onMediaBodyPointerDown,
  onMediaRotatePointerDown,
  onMediaScalePointerDown,
  onMediaNaturalDimensions,
  onPointerMove,
  onPointerUp,
  onContextMenu,
}: KeelPersonaElementStackProps) {
  const sortedElements = [...elements].sort((left, right) => left.zIndex - right.zIndex);
  const dropGroupIds = motionLayers.dropGroupIds ?? [];
  const groupWiggleIds = motionLayers.groupWiggleIds ?? [];
  const groupSpinIds = motionLayers.groupSpinIds ?? [];
  const elementSpinIds = motionLayers.elementSpinIds ?? [];
  const spawnGroupIds = motionLayers.spawnScaleGroupIds ?? [];
  const despawnGroupIds = motionLayers.despawnScaleGroupIds ?? [];
  const branchPokeGroupIds = motionLayers.branchPokeGroupIds ?? ["prop-branch"];
  const branchPokeActive = !!motionLayers.branchPoke;
  const straightEyeBlinkActive = motionLayers.straightEyeBlink ?? false;

  return (
    <div className={`pointer-events-none absolute inset-0 ${className ?? ""}`}>
      {sortedElements.map((element) => {
        const playbackHidden = isPlaybackHidden(element);
        if (!compositorLoading && !element.visible && !playbackHidden) {
          return null;
        }
        if (compositorLoading && element.tags?.includes("pivot")) {
          return null;
        }

        const isFocused = element.id === focusedElementId;
        const compositorAttrId = compositorLoading ? element.id : undefined;
        // In compositor mode the WAAPI timeline owns all transient motion, so the
        // per-step classes below stay off; continuous layers still render as CSS.
        const motionActive = !compositorLoading && !playbackHidden;
        const dropActive =
          motionActive &&
          element.groupId !== undefined &&
          dropGroupIds.includes(element.groupId);
        const wiggleActive =
          motionActive &&
          element.groupId !== undefined &&
          groupWiggleIds.includes(element.groupId);
        const spinActive =
          motionActive &&
          (groupSpinIds.includes(element.groupId ?? "") ||
            elementSpinIds.includes(element.id));
        const spawnState: KeelMediaSpawnState = !motionActive
          ? null
          : element.groupId !== undefined && spawnGroupIds.includes(element.groupId)
            ? "spawn"
            : element.groupId !== undefined && despawnGroupIds.includes(element.groupId)
              ? "despawn"
              : null;
        const branchPokeOnElement =
          branchPokeActive &&
          element.groupId !== undefined &&
          branchPokeGroupIds.includes(element.groupId);

        let rendered: ReactNode = null;

        switch (element.kind) {
          case "dot": {
            const isStraightGaze = isStraightGazeEyeDot(element);
            const teslaActive = teslaLineGlowElapsedMs !== undefined && isStraightGaze;
            const whiteEyeGlowIntensity = teslaActive
              ? getTeslaEyeGlowIntensity(teslaLineGlowElapsedMs)
              : 0;
            const baseEyeScale =
              !compositorLoading && isStraightGaze
                ? resolveKeelEyeScaleMultiplier(element.id, motionLayers)
                : 1;
            const teslaEyeScale = teslaActive
              ? getTeslaEyeScaleMultiplier(teslaLineGlowElapsedMs)
              : 1;

            rendered = (
              <KeelPersonaDotElementView
                key={element.id}
                element={element}
                isFocused={isFocused}
                happyEyeCycleActive={happyEyesActive && isStraightGaze}
                squintLineActive={motionActive && isSquintingEye(element, squintEyeSide)}
                straightEyeBlinkActive={
                  motionActive && straightEyeBlinkActive && isStraightGaze
                }
                gazeBlendOffset={
                  motionActive
                    ? resolveGazeBlendOffset(element, gazeBlend, designCanvasPx)
                    : null
                }
                orangeEyeGlow={orangeEyeGlow && isStraightGaze && !teslaActive}
                whiteEyeFill={teslaActive}
                whiteEyeGlowIntensity={whiteEyeGlowIntensity}
                fluidEyeScale={teslaActive}
                eyeScaleMultiplier={baseEyeScale * teslaEyeScale}
                compositorAttrId={compositorAttrId}
                onPointerDown={onDotPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onContextMenu={onContextMenu}
              />
            );
            break;
          }

          case "polygon-overlay":
            rendered = (
              <KeelPersonaPolygonOverlayElementView
                key={element.id}
                element={element}
                isFocused={isFocused}
                onBodyPointerDown={onPolygonBodyPointerDown}
                onCornerPointerDown={onPolygonCornerPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onContextMenu={onContextMenu}
              />
            );
            break;

          case "glass-overlay":
            rendered = (
              <KeelPersonaGlassOverlayElementView
                key={element.id}
                element={element}
                isFocused={isFocused}
                onBodyPointerDown={onGlassBodyPointerDown}
                onCornerPointerDown={onGlassCornerPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onContextMenu={onContextMenu}
              />
            );
            break;

          case "line":
            rendered = (
              <KeelPersonaLineElementView
                key={element.id}
                element={element}
                teslaGlowClip={
                  teslaLineGlowElapsedMs !== undefined
                    ? getTeslaLineGlowClip(element.id, element.name, teslaLineGlowElapsedMs)
                    : undefined
                }
                isFocused={isFocused}
                onBodyPointerDown={onLineBodyPointerDown}
                onRotatePointerDown={onLineRotatePointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onContextMenu={onContextMenu}
              />
            );
            break;

          case "media-image":
            rendered = (
              <KeelPersonaMediaElementView
                key={element.id}
                element={element}
                isFocused={isFocused}
                dropActive={dropActive}
                wiggleActive={wiggleActive}
                spinActive={spinActive}
                branchPokeActive={motionActive && branchPokeOnElement}
                spawnState={spawnState}
                compositorAttrId={compositorAttrId}
                onBodyPointerDown={onMediaBodyPointerDown}
                onRotatePointerDown={onMediaRotatePointerDown}
                onScalePointerDown={onMediaScalePointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onContextMenu={onContextMenu}
                onNaturalDimensions={onMediaNaturalDimensions}
              />
            );
            break;

          default:
            rendered = null;
        }

        return wrapPlaybackElement(element.id, playbackHidden, rendered);
      })}
    </div>
  );
}
