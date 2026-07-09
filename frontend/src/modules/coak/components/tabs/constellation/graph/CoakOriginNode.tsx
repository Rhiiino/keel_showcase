// keel_web/src/modules/coak/components/graph/CoakOriginNode.tsx

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { AdditiveBlending, BackSide, type Mesh, type PointLight } from "three";

import { CoakNodeMoveTargetHighlight } from "../node-visuals/CoakNodeMoveTargetHighlight";
import {
  COAK_ORIGIN_PULSE_SHELL_COUNT,
  COAK_ORIGIN_VISUAL_SCALE,
  getCoakOriginCoreBreathe,
  getCoakOriginShellPulseState,
} from "../../../../lib/tabs/constellation/coakOriginPulse";

type CoakOriginNodeProps = {
  radius: number;
  color: string;
  pulseEnabled?: boolean;
  isMoveTarget?: boolean;
  onContextMenu?: (event: ThreeEvent<MouseEvent>) => void;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
};

const PULSE_SHELL_COUNT = COAK_ORIGIN_PULSE_SHELL_COUNT;
const ORIGIN_VISUAL_SCALE = COAK_ORIGIN_VISUAL_SCALE;

export function CoakOriginNode({
  radius,
  color,
  pulseEnabled = true,
  isMoveTarget = false,
  onContextMenu,
  onPointerDown,
}: CoakOriginNodeProps) {
  const pulseShellRefs = useRef<(Mesh | null)[]>([]);
  const coreRef = useRef<Mesh>(null);
  const coronaRef = useRef<Mesh>(null);
  const lightRef = useRef<PointLight>(null);
  const visualRadius = radius * ORIGIN_VISUAL_SCALE;

  useFrame(({ clock }) => {
    if (!pulseEnabled) {
      for (let index = 0; index < PULSE_SHELL_COUNT; index += 1) {
        const shell = pulseShellRefs.current[index];
        if (!shell) {
          continue;
        }

        shell.scale.setScalar(1);
        const material = shell.material;
        if (material && "opacity" in material && typeof material.opacity === "number") {
          material.opacity = 0;
        }
      }

      const core = coreRef.current;
      if (core) {
        core.scale.setScalar(1);
        const material = core.material;
        if (material && "emissiveIntensity" in material && typeof material.emissiveIntensity === "number") {
          material.emissiveIntensity = 0.72;
        }
      }

      const corona = coronaRef.current;
      if (corona) {
        corona.scale.setScalar(1.08);
        const material = corona.material;
        if (material && "opacity" in material && typeof material.opacity === "number") {
          material.opacity = 0.14;
        }
      }

      const light = lightRef.current;
      if (light) {
        light.intensity = 0.65;
      }

      return;
    }

    const elapsed = clock.elapsedTime;
    const breathe = getCoakOriginCoreBreathe(elapsed);

    for (let index = 0; index < PULSE_SHELL_COUNT; index += 1) {
      const shell = pulseShellRefs.current[index];
      if (!shell) {
        continue;
      }

      const { scale, opacity } = getCoakOriginShellPulseState(elapsed, index);
      shell.scale.setScalar(scale);

      const material = shell.material;
      if (material && "opacity" in material && typeof material.opacity === "number") {
        material.opacity = opacity;
      }
    }

    const core = coreRef.current;
    if (core) {
      core.scale.setScalar(1);
      const material = core.material;
      if (material && "emissiveIntensity" in material && typeof material.emissiveIntensity === "number") {
        material.emissiveIntensity = 0.62 + breathe * 0.18;
      }
    }

    const corona = coronaRef.current;
    if (corona) {
      corona.scale.setScalar(1.08 + breathe * 0.06);
      const material = corona.material;
      if (material && "opacity" in material && typeof material.opacity === "number") {
        material.opacity = 0.13 + breathe * 0.06;
      }
    }

    const light = lightRef.current;
    if (light) {
      light.intensity = 0.6 + breathe * 0.18;
    }
  });

  return (
    <group>
      <pointLight ref={lightRef} color={color} intensity={0.65} distance={visualRadius * 7} decay={2} />

      <mesh raycast={() => null}>
        <sphereGeometry args={[visualRadius, 36, 36]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.16}
          transparent
          opacity={0.16}
          roughness={0.42}
          metalness={0.08}
          depthWrite={false}
        />
      </mesh>

      <mesh ref={coronaRef} raycast={() => null}>
        <sphereGeometry args={[visualRadius, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.14}
          blending={AdditiveBlending}
          depthWrite={false}
          side={BackSide}
        />
      </mesh>

      {Array.from({ length: PULSE_SHELL_COUNT }, (_, index) => (
        <mesh
          key={index}
          ref={(node) => {
            pulseShellRefs.current[index] = node;
          }}
          raycast={() => null}
        >
          <sphereGeometry args={[visualRadius, 28, 28]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}

      <mesh ref={coreRef} raycast={() => null}>
        <sphereGeometry args={[visualRadius, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.72}
          roughness={0.22}
          metalness={0.14}
        />
      </mesh>

      {isMoveTarget ? <CoakNodeMoveTargetHighlight radius={visualRadius} /> : null}

      <mesh onContextMenu={onContextMenu} onPointerDown={onPointerDown}>
        <sphereGeometry args={[visualRadius * 1.08, 24, 24]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}
