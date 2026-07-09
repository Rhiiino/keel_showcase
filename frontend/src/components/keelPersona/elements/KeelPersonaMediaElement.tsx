// keel_web/src/components/keelPersona/elements/KeelPersonaMediaElement.tsx

import type { PointerEvent } from "react";

import { resolveKeelPersonaMediaSrc } from "../../../lib/keelPersona/mediaAssets";
import { LOADING_ICON_GROUP_SPIN_CLASS, LOADING_ICON_GROUP_WIGGLE_CLASS } from "../../../lib/keelPersona/geometry/loadingIconWobble";
import type { KeelPersonaMediaImageElement } from "../../../lib/keelPersona";

export type KeelMediaSpawnState = "spawn" | "despawn" | null;

type KeelPersonaMediaElementProps = {
  element: KeelPersonaMediaImageElement;
  isFocused: boolean;
  dropActive?: boolean;
  wiggleActive?: boolean;
  spinActive?: boolean;
  branchPokeActive?: boolean;
  spawnState?: KeelMediaSpawnState;
  /** When set, the loading compositor timeline drives this node's transform/opacity. */
  compositorAttrId?: string;
  onBodyPointerDown: (elementId: string, event: PointerEvent<HTMLElement>) => void;
  onRotatePointerDown: (elementId: string, event: PointerEvent<HTMLElement>) => void;
  onScalePointerDown: (elementId: string, event: PointerEvent<HTMLElement>) => void;
  onPointerMove: (elementId: string, event: PointerEvent<HTMLElement>) => void;
  onPointerUp: (elementId: string, event: PointerEvent<HTMLElement>) => void;
  onContextMenu: (elementId: string, event: React.MouseEvent<HTMLElement>) => void;
  onNaturalDimensions: (elementId: string, width: number, height: number) => void;
};

function getMediaHandlePositions(element: KeelPersonaMediaImageElement) {
  const radians = (element.angle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const halfWidth = element.width / 2;
  const halfHeight = element.height / 2;
  const rotateOffset = 18;

  return {
    rotate: {
      x: element.x + sin * (halfHeight + rotateOffset),
      y: element.y - cos * (halfHeight + rotateOffset),
    },
    scale: {
      x: element.x + cos * halfWidth - sin * halfHeight,
      y: element.y + sin * halfWidth + cos * halfHeight,
    },
  };
}

/**
 * Motion layers (drop, spawn/despawn, wiggle) run as CSS animations on nested
 * zero-size wrappers anchored at the element center, so each effect composes
 * independently and plays without per-frame JS.
 */
export function KeelPersonaMediaElementView({
  element,
  isFocused,
  dropActive = false,
  wiggleActive = false,
  spinActive = false,
  branchPokeActive = false,
  spawnState = null,
  compositorAttrId,
  onBodyPointerDown,
  onRotatePointerDown,
  onScalePointerDown,
  onPointerMove,
  onPointerUp,
  onContextMenu,
  onNaturalDimensions,
}: KeelPersonaMediaElementProps) {
  const handles = getMediaHandlePositions(element);
  const spawnClass =
    spawnState === "spawn"
      ? "keel-media-spawn"
      : spawnState === "despawn"
        ? "keel-media-despawn"
        : "";

  return (
    <div
      className="pointer-events-none absolute"
      style={{ left: element.x, top: element.y, zIndex: element.zIndex }}
      {...(compositorAttrId ? { "data-keel-lp": compositorAttrId } : {})}
    >
      <div
        className={branchPokeActive ? "keel-branch-poke" : ""}
        style={
          branchPokeActive
            ? {
                ["--keel-branch-poke-x" as string]: "52px",
                ["--keel-branch-poke-y" as string]: "52px",
              }
            : undefined
        }
      >
      <div className={dropActive ? "keel-media-drop" : ""}>
          <div className={spawnClass}>
            <div className={wiggleActive ? LOADING_ICON_GROUP_WIGGLE_CLASS : ""}>
            <div
              className={`pointer-events-auto absolute touch-none ${
                spinActive ? LOADING_ICON_GROUP_SPIN_CLASS : ""
              } ${isFocused ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}`}
              style={{
                left: 0,
                top: 0,
                ...(spinActive
                  ? { ["--keel-spin-base-angle" as string]: `${element.angle}deg` }
                  : { transform: `translate(-50%, -50%) rotate(${element.angle}deg)` }),
              }}
              onPointerDown={(event) => onBodyPointerDown(element.id, event)}
              onPointerMove={(event) => onPointerMove(element.id, event)}
              onPointerUp={(event) => onPointerUp(element.id, event)}
              onPointerCancel={(event) => onPointerUp(element.id, event)}
              onContextMenu={(event) => onContextMenu(element.id, event)}
            >
              <div className={isFocused ? "ring-2 ring-amber-300/80" : ""}>
                <img
                  src={resolveKeelPersonaMediaSrc(element.mediaId)}
                  alt=""
                  draggable={false}
                  className="pointer-events-none max-w-none select-none"
                  style={{ width: element.width, height: element.height }}
                  onLoad={(event) => {
                    const image = event.currentTarget;
                    if (image.naturalWidth > 0 && image.naturalHeight > 0) {
                      onNaturalDimensions(element.id, image.naturalWidth, image.naturalHeight);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      {isFocused ? (
        <>
          <div
            className="pointer-events-auto absolute z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border border-white/80 bg-sky-300/90 shadow-sm touch-none active:cursor-grabbing"
            style={{ left: handles.rotate.x - element.x, top: handles.rotate.y - element.y }}
            onPointerDown={(event) => onRotatePointerDown(element.id, event)}
            onPointerMove={(event) => onPointerMove(element.id, event)}
            onPointerUp={(event) => onPointerUp(element.id, event)}
            onPointerCancel={(event) => onPointerUp(element.id, event)}
            onContextMenu={(event) => onContextMenu(element.id, event)}
          />
          <div
            className="pointer-events-auto absolute z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize rounded-full border border-white/80 bg-lime-300/90 shadow-sm touch-none"
            style={{ left: handles.scale.x - element.x, top: handles.scale.y - element.y }}
            onPointerDown={(event) => onScalePointerDown(element.id, event)}
            onPointerMove={(event) => onPointerMove(element.id, event)}
            onPointerUp={(event) => onPointerUp(element.id, event)}
            onPointerCancel={(event) => onPointerUp(element.id, event)}
            onContextMenu={(event) => onContextMenu(element.id, event)}
          />
        </>
      ) : null}
    </div>
  );
}
