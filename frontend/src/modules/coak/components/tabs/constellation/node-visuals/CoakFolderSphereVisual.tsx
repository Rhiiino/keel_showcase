// keel_web/src/modules/coak/components/CoakFolderSphereVisual.tsx

import type { Ref } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import type { Mesh } from "three";

type CoakFolderSphereVisualProps = {
  radius: number;
  color: string;
  meshRef?: Ref<Mesh>;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
  onContextMenu?: (event: ThreeEvent<MouseEvent>) => void;
};

export function CoakFolderSphereVisual({
  radius,
  color,
  meshRef,
  onPointerDown,
  onContextMenu,
}: CoakFolderSphereVisualProps) {
  return (
    <mesh ref={meshRef} onPointerDown={onPointerDown} onContextMenu={onContextMenu}>
      <sphereGeometry args={[radius, 36, 36]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.38}
        transparent
        opacity={0.72}
        roughness={0.3}
        metalness={0.08}
        depthWrite={false}
      />
    </mesh>
  );
}
