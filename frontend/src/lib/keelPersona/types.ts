// keel_web/src/lib/keelPersona/types.ts

import type { CanvasPoint } from "./geometry/canvasPointer";

export type { CanvasPoint };

export type KeelPersonaElementTag =
  | "base"
  | "gaze"
  | "accessory"
  | "overlay"
  | "pivot"
  | "line"
  | "caption"
  | "effect"
  | "anchor";

export type KeelPersonaElementSlot = "head" | "eyes" | "mouth" | "body" | "pivot";

export type KeelPersonaElementMeta = {
  tags?: KeelPersonaElementTag[];
  groupId?: string;
  locked?: boolean;
  slot?: KeelPersonaElementSlot;
};

/** Element kinds used by promoted production playback designs. */
export type KeelPersonaElementKind =
  | "dot"
  | "polygon-overlay"
  | "line"
  | "media-image"
  | "glass-overlay";

type KeelPersonaElementBase = KeelPersonaElementMeta & {
  id: string;
  name: string;
  visible: boolean;
  zIndex: number;
};

export type KeelPersonaDotElement = KeelPersonaElementBase & {
  kind: "dot";
  x: number;
  y: number;
  sizePx: number;
  color: string;
};

export type KeelPersonaPolygonOverlayElement = KeelPersonaElementBase & {
  kind: "polygon-overlay";
  corners: CanvasPoint[];
};

export type KeelPersonaLineElement = KeelPersonaElementBase & {
  kind: "line";
  x: number;
  y: number;
  length: number;
  thickness: number;
  angle: number;
  color: string;
};

export type KeelPersonaMediaImageElement = KeelPersonaElementBase & {
  kind: "media-image";
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  mediaId: string;
  mediaFilename: string;
};

export type KeelPersonaGlassOverlayElement = KeelPersonaElementBase & {
  kind: "glass-overlay";
  corners: CanvasPoint[];
  color: string;
};

export type KeelPersonaElement =
  | KeelPersonaDotElement
  | KeelPersonaPolygonOverlayElement
  | KeelPersonaLineElement
  | KeelPersonaMediaImageElement
  | KeelPersonaGlassOverlayElement;

export const DEFAULT_KEEL_PERSONA_MEDIA_WIDTH_PX = 120;

export const DEFAULT_KEEL_PERSONA_PLAYBACK_SIZE_PX = 120;

export const DEFAULT_KEEL_PERSONA_BASE_OFFSET: CanvasPoint = { x: 0, y: 0 };

export type KeelBodyShiftDirection = "left" | "right";

export type KeelSquintEyeSide = "left" | "right";

/** Animation layers used by registered production clips. */
export type KeelAnimationLayers = {
  wobble?: boolean;
  happyEyes?: boolean;
  wobbleExcludedGroupIds?: string[];
  orangeEyeGlow?: boolean;
  eyeScale?: number;
  eyeScaleLeft?: number;
  eyeScaleRight?: number;
  dropGroupIds?: string[];
  groupWiggleIds?: string[];
  groupSpinIds?: string[];
  elementSpinIds?: string[];
  rainOverlay?: boolean;
  bodyShiftDirection?: KeelBodyShiftDirection;
  gazeTransition?: boolean;
  spawnScaleGroupIds?: string[];
  despawnScaleGroupIds?: string[];
  squintEyeSide?: KeelSquintEyeSide;
  straightEyeBlink?: boolean;
  branchPoke?: boolean;
  branchPokeGroupIds?: string[];
  /** The Tesla: sequenced mouth/outer/inner white line glow + eye charge cycle. */
  teslaLineGlow?: boolean;
};

export type KeelPersonaLook = {
  id: string;
  name: string;
  visibleGroupIds: string[];
  hiddenElementIds?: string[];
  visibleElementIds?: string[];
};

export type KeelLayerScheduleEvent = {
  atMs: number;
  layers: KeelAnimationLayers;
};

export type KeelAnimationStep = {
  durationMs: number;
  look?: Partial<KeelPersonaLook>;
  layers?: KeelAnimationLayers;
  layerSchedule?: readonly KeelLayerScheduleEvent[];
  captionId?: string;
  captionText?: string;
};

export type KeelAnimationClip = {
  id: string;
  name: string;
  tags: string[];
  contextTags: string[];
  steps: KeelAnimationStep[];
  loop?: boolean;
  defaultCaptionId?: string;
};

export type KeelCaption = {
  id: string;
  text: string;
  tags?: string[];
  contextTags?: string[];
  loadingDots?: boolean;
};

export type KeelPersonaSettings = {
  enabled: boolean;
  ambientEnabled: boolean;
  loadingClipTags: string[];
};

export const DEFAULT_KEEL_PERSONA_SETTINGS: KeelPersonaSettings = {
  enabled: false,
  ambientEnabled: false,
  loadingClipTags: ["loading"],
};
