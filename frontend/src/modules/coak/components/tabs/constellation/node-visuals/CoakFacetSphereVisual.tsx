// keel_web/src/modules/coak/components/tabs/constellation/node-visuals/CoakFacetSphereVisual.tsx

import type { Ref } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import type { Mesh } from "three";

type CoakFacetSphereVisualProps = {
  radius: number;
  color: string;
  meshRef?: Ref<Mesh>;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
  onContextMenu?: (event: ThreeEvent<MouseEvent>) => void;
};

export function CoakFacetSphereVisual({
  radius,
  color,
  meshRef,
  onPointerDown,
  onContextMenu,
}: CoakFacetSphereVisualProps) {
  return (
    <mesh ref={meshRef} onPointerDown={onPointerDown} onContextMenu={onContextMenu}>
      <icosahedronGeometry args={[radius, 1]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.4}
        flatShading
        roughness={0.32}
        metalness={0.14}
        transparent
        opacity={0.94}
      />
    </mesh>
  );
}
