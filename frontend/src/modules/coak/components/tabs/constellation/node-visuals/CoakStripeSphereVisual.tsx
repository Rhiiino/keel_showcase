// keel_web/src/modules/coak/components/tabs/constellation/node-visuals/CoakStripeSphereVisual.tsx

import type { Ref } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import type { Mesh } from "three";

import { createStripeSphereTexture } from "../../../../lib/tabs/constellation/coakStripeSphereTexture";

type CoakStripeSphereVisualProps = {
  radius: number;
  color: string;
  meshRef?: Ref<Mesh>;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
  onContextMenu?: (event: ThreeEvent<MouseEvent>) => void;
};

let stripeSphereTexture: ReturnType<typeof createStripeSphereTexture> | null = null;

function getStripeSphereTexture() {
  stripeSphereTexture ??= createStripeSphereTexture();
  return stripeSphereTexture;
}

export function CoakStripeSphereVisual({
  radius,
  color,
  meshRef,
  onPointerDown,
  onContextMenu,
}: CoakStripeSphereVisualProps) {
  const texture = getStripeSphereTexture();

  return (
    <mesh ref={meshRef} onPointerDown={onPointerDown} onContextMenu={onContextMenu}>
      <sphereGeometry args={[radius, 36, 36]} />
      <meshStandardMaterial
        map={texture}
        color={color}
        emissive={color}
        emissiveIntensity={0.34}
        transparent
        alphaTest={0.04}
        roughness={0.28}
        metalness={0.1}
      />
    </mesh>
  );
}
