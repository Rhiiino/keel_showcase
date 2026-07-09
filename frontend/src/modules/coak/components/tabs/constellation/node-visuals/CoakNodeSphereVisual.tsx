// keel_web/src/modules/coak/components/CoakNodeSphereVisual.tsx

import type { Ref } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import type { Mesh } from "three";

import type { CoakNodeVisualStyle } from "../../../../lib/tabs/settings/coakNodeVisualSettings";
import { CoakFacetSphereVisual } from "./CoakFacetSphereVisual";
import { CoakFolderSphereVisual } from "./CoakFolderSphereVisual";
import { CoakNoteSphereVisual } from "./CoakNoteSphereVisual";
import { CoakRingSphereVisual } from "./CoakRingSphereVisual";
import { CoakStripeSphereVisual } from "./CoakStripeSphereVisual";
import { CoakWireSphereVisual } from "./CoakWireSphereVisual";

type CoakNodeSphereVisualProps = {
  visualStyle: CoakNodeVisualStyle;
  seed: string;
  radius: number;
  color: string;
  meshRef?: Ref<Mesh>;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
  onContextMenu?: (event: ThreeEvent<MouseEvent>) => void;
};

export function CoakNodeSphereVisual({
  visualStyle,
  seed,
  radius,
  color,
  meshRef,
  onPointerDown,
  onContextMenu,
}: CoakNodeSphereVisualProps) {
  switch (visualStyle) {
    case "folder":
      return (
        <CoakFolderSphereVisual
          radius={radius}
          color={color}
          meshRef={meshRef}
          onPointerDown={onPointerDown}
          onContextMenu={onContextMenu}
        />
      );
    case "note":
      return (
        <CoakNoteSphereVisual
          seed={seed}
          radius={radius}
          color={color}
          meshRef={meshRef}
          onPointerDown={onPointerDown}
          onContextMenu={onContextMenu}
        />
      );
    case "wire":
      return (
        <CoakWireSphereVisual
          radius={radius}
          color={color}
          meshRef={meshRef}
          onPointerDown={onPointerDown}
          onContextMenu={onContextMenu}
        />
      );
    case "stripe":
      return (
        <CoakStripeSphereVisual
          radius={radius}
          color={color}
          meshRef={meshRef}
          onPointerDown={onPointerDown}
          onContextMenu={onContextMenu}
        />
      );
    case "facet":
      return (
        <CoakFacetSphereVisual
          radius={radius}
          color={color}
          meshRef={meshRef}
          onPointerDown={onPointerDown}
          onContextMenu={onContextMenu}
        />
      );
    case "ring":
      return (
        <CoakRingSphereVisual
          radius={radius}
          color={color}
          meshRef={meshRef}
          onPointerDown={onPointerDown}
          onContextMenu={onContextMenu}
        />
      );
    default: {
      const exhaustiveCheck: never = visualStyle;
      return exhaustiveCheck;
    }
  }
}
