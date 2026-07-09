// keel_web/src/modules/coak/components/tabs/constellation/node-visuals/CoakWireSphereVisual.tsx

import type { Ref } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import type { Mesh } from "three";

type CoakWireSphereVisualProps = {
  radius: number;
  color: string;
  meshRef?: Ref<Mesh>;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
  onContextMenu?: (event: ThreeEvent<MouseEvent>) => void;
};

export function CoakWireSphereVisual({
  radius,
  color,
  meshRef,
  onPointerDown,
  onContextMenu,
}: CoakWireSphereVisualProps) {
  return (
    <mesh ref={meshRef} onPointerDown={onPointerDown} onContextMenu={onContextMenu}>
      <sphereGeometry args={[radius, 20, 20]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.28}
        wireframe
        transparent
        opacity={0.92}
        roughness={0.4}
        metalness={0.12}
      />
    </mesh>
  );
}
