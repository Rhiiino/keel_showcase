// keel_web/src/modules/coak/components/tabs/constellation/node-visuals/CoakNodeMoveTargetHighlight.tsx

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { AdditiveBlending, BackSide, type Mesh } from "three";

type CoakNodeMoveTargetHighlightProps = {
  radius: number;
  color?: string;
};

const HIGHLIGHT_COLOR = "#38bdf8";
const HIGHLIGHT_SCALE = 1.28;

function smoothPulse(elapsed: number): number {
  return 0.5 + 0.5 * Math.sin(elapsed * 2.2);
}

export function CoakNodeMoveTargetHighlight({
  radius,
  color = HIGHLIGHT_COLOR,
}: CoakNodeMoveTargetHighlightProps) {
  const coronaRef = useRef<Mesh>(null);
  const ringRef = useRef<Mesh>(null);
  const shellRef = useRef<Mesh>(null);
  const highlightRadius = radius * HIGHLIGHT_SCALE;

  useFrame(({ clock }) => {
    const pulse = smoothPulse(clock.elapsedTime);

    const shell = shellRef.current;
    if (shell) {
      shell.scale.setScalar(1 + pulse * 0.06);
      const material = shell.material;
      if (material && "emissiveIntensity" in material && typeof material.emissiveIntensity === "number") {
        material.emissiveIntensity = 0.55 + pulse * 0.35;
      }
      if (material && "opacity" in material && typeof material.opacity === "number") {
        material.opacity = 0.34 + pulse * 0.16;
      }
    }

    const corona = coronaRef.current;
    if (corona) {
      corona.scale.setScalar(1 + pulse * 0.1);
      const material = corona.material;
      if (material && "opacity" in material && typeof material.opacity === "number") {
        material.opacity = 0.32 + pulse * 0.2;
      }
    }

    const ring = ringRef.current;
    if (ring) {
      ring.scale.setScalar(1 + pulse * 0.04);
      const material = ring.material;
      if (material && "opacity" in material && typeof material.opacity === "number") {
        material.opacity = 0.72 + pulse * 0.2;
      }
    }
  });

  return (
    <group renderOrder={10}>
      <mesh ref={shellRef} raycast={() => null}>
        <sphereGeometry args={[highlightRadius, 28, 28]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.72}
          transparent
          opacity={0.42}
          roughness={0.35}
          metalness={0.08}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={coronaRef} raycast={() => null}>
        <sphereGeometry args={[highlightRadius * 1.06, 28, 28]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.42}
          blending={AdditiveBlending}
          depthWrite={false}
          side={BackSide}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={ringRef} raycast={() => null}>
        <sphereGeometry args={[highlightRadius * 1.1, 24, 24]} />
        <meshBasicMaterial
          color={color}
          wireframe
          transparent
          opacity={0.82}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
