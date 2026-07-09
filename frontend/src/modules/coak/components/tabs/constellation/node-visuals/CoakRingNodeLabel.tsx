// keel_web/src/modules/coak/components/tabs/constellation/node-visuals/CoakRingNodeLabel.tsx

import { Html } from "@react-three/drei";

type CoakRingNodeLabelProps = {
  label: string;
  radius: number;
  color?: string;
};

export function CoakRingNodeLabel({ label, radius, color }: CoakRingNodeLabelProps) {
  return (
    <Html
      center
      distanceFactor={radius * 48}
      zIndexRange={[100, 0]}
      occlude="blending"
      style={{
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      <div className="flex w-[4.6rem] items-center justify-center px-0.5">
        <span
          className="min-w-0 truncate text-center text-[10px] font-medium leading-tight"
          style={{
            color: color ?? "rgba(231, 229, 228, 0.92)",
            textShadow:
              "0 0 6px rgba(8, 8, 8, 0.95), 0 1px 2px rgba(0, 0, 0, 0.85)",
          }}
        >
          {label}
        </span>
      </div>
    </Html>
  );
}
