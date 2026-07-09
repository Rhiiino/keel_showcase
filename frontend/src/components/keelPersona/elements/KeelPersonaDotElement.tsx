// keel_web/src/components/keelPersona/elements/KeelPersonaDotElement.tsx

import type { CSSProperties, PointerEvent } from "react";

import type { KeelPersonaDotElement } from "../../../lib/keelPersona";
import {
  TESLA_PEAK_WHITE_CORE,
  TESLA_PEAK_WHITE_GLOW_BOX_SHADOW,
} from "../../../lib/keelPersona/teslaPeakGlow";

/** Gaze travel: slide-in offset from the previous gaze position (px). */
export type KeelGazeBlendOffset = {
  fromDxPx: number;
  fromDyPx: number;
  durationMs: number;
};

type KeelPersonaDotElementProps = {
  element: KeelPersonaDotElement;
  isFocused: boolean;
  happyEyeCycleActive?: boolean;
  squintLineActive?: boolean;
  straightEyeBlinkActive?: boolean;
  gazeBlendOffset?: KeelGazeBlendOffset | null;
  faintBlueGlow?: boolean;
  orangeEyeGlow?: boolean;
  /** Solid white fill with no bloom (e.g. The Tesla idle eyes). */
  whiteEyeFill?: boolean;
  /**
   * White glow bloom intensity (0–1). Fades in/out independently of fill so
   * Tesla eyes can stay white while only the glow charges and powers down.
   */
  whiteEyeGlowIntensity?: number;
  /** Drive scale from a timeline each frame — skip CSS transform easing. */
  fluidEyeScale?: boolean;
  eyeScaleMultiplier?: number;
  /** When set, the loading compositor timeline drives this node's transform/opacity. */
  compositorAttrId?: string;
  onPointerDown: (elementId: string, event: PointerEvent<HTMLElement>) => void;
  onPointerMove: (elementId: string, event: PointerEvent<HTMLElement>) => void;
  onPointerUp: (elementId: string, event: PointerEvent<HTMLElement>) => void;
  onContextMenu: (elementId: string, event: React.MouseEvent<HTMLElement>) => void;
};

export function KeelPersonaDotElementView({
  element,
  isFocused,
  happyEyeCycleActive = false,
  squintLineActive = false,
  straightEyeBlinkActive = false,
  gazeBlendOffset = null,
  faintBlueGlow = false,
  orangeEyeGlow = false,
  whiteEyeFill = false,
  whiteEyeGlowIntensity = 0,
  fluidEyeScale = false,
  eyeScaleMultiplier = 1,
  compositorAttrId,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onContextMenu,
}: KeelPersonaDotElementProps) {
  const baseSize = element.sizePx;
  const cssMorphActive = squintLineActive || happyEyeCycleActive || straightEyeBlinkActive;
  const sizeMorphActive = happyEyeCycleActive;
  const whiteIntensity = Math.max(0, Math.min(1, whiteEyeGlowIntensity));
  const showFaintBlueGlow =
    faintBlueGlow && !orangeEyeGlow && !whiteEyeFill && whiteIntensity < 0.001;

  const morphClass = straightEyeBlinkActive
    ? "keel-straight-eye-blink"
    : squintLineActive
      ? "keel-squint-eye"
      : happyEyeCycleActive
        ? "keel-happy-eye-morph"
        : "";

  const style: CSSProperties = {
    left: element.x,
    top: element.y,
    zIndex: element.zIndex,
    width: sizeMorphActive ? baseSize * eyeScaleMultiplier : baseSize,
    height: sizeMorphActive ? baseSize * eyeScaleMultiplier : baseSize,
    ["--keel-eye-w" as string]: `${baseSize * eyeScaleMultiplier}px`,
    ["--keel-eye-h" as string]: `${baseSize * eyeScaleMultiplier}px`,
    transition: sizeMorphActive
      ? "width 400ms ease, height 400ms ease"
      : fluidEyeScale
        ? undefined
        : "transform 400ms ease",
    transform:
      cssMorphActive || gazeBlendOffset
        ? undefined
        : `translate(-50%, -50%) scale(${eyeScaleMultiplier})`,
    backgroundColor: whiteEyeFill
      ? TESLA_PEAK_WHITE_CORE
      : orangeEyeGlow
        ? "hsl(28, 100%, 55%)"
        : element.color,
    boxShadow: orangeEyeGlow
      ? "0 0 8px 2px hsla(28, 100%, 55%, 0.75)"
      : showFaintBlueGlow
        ? "0 0 6px 2px hsla(210, 85%, 62%, 0.35), 0 0 14px 4px hsla(210, 80%, 55%, 0.2)"
        : undefined,
  };

  if (gazeBlendOffset) {
    style["--keel-gaze-from-dx" as keyof CSSProperties] = `${gazeBlendOffset.fromDxPx}px` as never;
    style["--keel-gaze-from-dy" as keyof CSSProperties] = `${gazeBlendOffset.fromDyPx}px` as never;
    style["--keel-gaze-blend-duration" as keyof CSSProperties] =
      `${gazeBlendOffset.durationMs}ms` as never;
  }

  return (
    <div
      className={`pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 touch-none rounded-full ${morphClass} ${
        gazeBlendOffset ? "keel-gaze-blend" : ""
      } ${isFocused ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"} ${
        isFocused ? "ring-2 ring-amber-300/80 ring-offset-1 ring-offset-transparent" : ""
      }`}
      style={style}
      {...(compositorAttrId ? { "data-keel-lp": compositorAttrId } : {})}
      onPointerDown={(event) => onPointerDown(element.id, event)}
      onPointerMove={(event) => onPointerMove(element.id, event)}
      onPointerUp={(event) => onPointerUp(element.id, event)}
      onPointerCancel={(event) => onPointerUp(element.id, event)}
      onContextMenu={(event) => onContextMenu(element.id, event)}
    >
      {whiteIntensity > 0.001 ? (
        <div
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            backgroundColor: TESLA_PEAK_WHITE_CORE,
            boxShadow: TESLA_PEAK_WHITE_GLOW_BOX_SHADOW,
            opacity: whiteIntensity,
          }}
        />
      ) : null}
    </div>
  );
}
