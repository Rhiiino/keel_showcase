// keel_web/src/modules/coak/components/tabs/constellation/node-visuals/CoakNodePinBadge.tsx

import { Html } from "@react-three/drei";

import { CoakNodePinIcon } from "./CoakNodePinIcon";

type CoakNodePinBadgeProps = {
  radius: number;
};

export function CoakNodePinBadge({ radius }: CoakNodePinBadgeProps) {
  return (
    <Html
      position={[0, radius * 1.35, 0]}
      zIndexRange={[100, 0]}
      occlude="blending"
      style={{
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      <span
        className="inline-flex items-center justify-center rounded-full bg-stone-950/80 p-0.5 text-amber-300/90"
        style={{
          boxShadow: "0 0 6px rgba(8, 8, 8, 0.95), 0 1px 2px rgba(0, 0, 0, 0.85)",
        }}
        aria-hidden
      >
        <CoakNodePinIcon />
      </span>
    </Html>
  );
}
