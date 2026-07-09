// keel_web/src/modules/coak/components/CoakNoteSphereVisual.tsx

import { useEffect, useMemo, type Ref } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import type { Mesh } from "three";

import { createNoteSphereTexture } from "../../../../lib/tabs/constellation/coakNoteSphereTexture";

type CoakNoteSphereVisualProps = {
  seed: string;
  radius: number;
  color: string;
  meshRef?: Ref<Mesh>;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
  onContextMenu?: (event: ThreeEvent<MouseEvent>) => void;
};

export function CoakNoteSphereVisual({
  seed,
  radius,
  color,
  meshRef,
  onPointerDown,
  onContextMenu,
}: CoakNoteSphereVisualProps) {
  const texture = useMemo(() => createNoteSphereTexture(seed), [seed]);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh ref={meshRef} onPointerDown={onPointerDown} onContextMenu={onContextMenu}>
      <sphereGeometry args={[radius, 36, 36]} />
      <meshStandardMaterial
        map={texture}
        color={color}
        emissive={color}
        emissiveIntensity={0.38}
        transparent
        alphaTest={0.04}
        roughness={0.3}
        metalness={0.08}
      />
    </mesh>
  );
}
