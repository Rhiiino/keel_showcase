// keel_web/src/modules/coak/components/tabs/constellation/node-visuals/CoakRingSphereVisual.tsx

import { Billboard } from "@react-three/drei";
import type { Ref } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { DoubleSide, type Mesh } from "three";

import { COAK_RING_NODE_BORDER_WIDTH_RATIO } from "../../../../lib/tabs/constellation/coakGraphConstants";

type CoakRingSphereVisualProps = {
  radius: number;
  color: string;
  meshRef?: Ref<Mesh>;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
  onContextMenu?: (event: ThreeEvent<MouseEvent>) => void;
};

export function CoakRingSphereVisual({
  radius,
  color,
  meshRef,
  onPointerDown,
  onContextMenu,
}: CoakRingSphereVisualProps) {
  const borderWidth = radius * COAK_RING_NODE_BORDER_WIDTH_RATIO;
  const innerRadius = Math.max(radius - borderWidth, radius * 0.72);

  return (
    <group>
      <Billboard>
        <mesh raycast={() => null}>
          <ringGeometry args={[innerRadius, radius, 64]} />
          <meshBasicMaterial
            color={color}
            side={DoubleSide}
            transparent
            opacity={0.96}
            depthWrite
          />
        </mesh>
      </Billboard>
      <mesh ref={meshRef} onPointerDown={onPointerDown} onContextMenu={onContextMenu}>
        <sphereGeometry args={[radius, 24, 24]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}
