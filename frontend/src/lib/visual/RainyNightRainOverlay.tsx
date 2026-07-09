// keel_web/src/lib/visual/RainyNightRainOverlay.tsx

// Randomized vertical rain droplets for the rainy-night theme and backgrounds.

import { useMemo, type CSSProperties } from "react";

import { createRainDropletField, type RainDroplet } from "./rainDroplets";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

type RainyNightRainOverlayProps = {
  className?: string;
};

function dropletStyle(droplet: RainDroplet): CSSProperties {
  return {
    left: `${droplet.leftPercent}%`,
    width: `${droplet.widthPx}px`,
    height: `${droplet.lengthPx}px`,
    opacity: droplet.opacity,
    "--drop-duration": `${droplet.durationSec}s`,
    "--drop-delay": `${droplet.delaySec}s`,
  } as CSSProperties;
}

const DEFAULT_OVERLAY_CLASS = "pointer-events-none absolute inset-0 z-0";

export function RainyNightRainOverlay({ className }: RainyNightRainOverlayProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const droplets = useMemo(() => createRainDropletField(), []);

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <div
      className={["rainy-night-rain", className ?? DEFAULT_OVERLAY_CLASS].join(" ")}
      aria-hidden
    >
      {droplets.map((droplet) => (
        <span
          key={droplet.id}
          className={`rainy-night-droplet rainy-night-droplet--${droplet.depth}`}
          style={dropletStyle(droplet)}
        />
      ))}
    </div>
  );
}
