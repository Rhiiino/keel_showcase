// keel_web/src/components/keelPersona/KeelPersonaRainOverlay.tsx

import { useMemo, type CSSProperties } from "react";

import waterDropletUrl from "../../assets/KeelPersona/water-droplet.png";
import { createKeelPersonaRainDropletField } from "../../lib/keelPersona/keelPersonaRainDroplets";
import type { KeelPersonaRainDroplet } from "../../lib/keelPersona/keelPersonaRainDroplets";
import { usePrefersReducedMotion } from "../../lib/visual/usePrefersReducedMotion";

type KeelPersonaRainOverlayProps = {
  className?: string;
};

function dropletStyle(droplet: KeelPersonaRainDroplet): CSSProperties {
  return {
    left: `${droplet.leftPercent}%`,
    width: `${droplet.sizePx}px`,
    height: `${droplet.sizePx}px`,
    opacity: droplet.opacity,
    ["--keel-rain-duration" as string]: `${droplet.durationSec}s`,
    ["--keel-rain-delay" as string]: `${droplet.delaySec}s`,
  };
}

export function KeelPersonaRainOverlay({ className = "" }: KeelPersonaRainOverlayProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const droplets = useMemo(() => createKeelPersonaRainDropletField(), []);

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <div className={`keel-persona-rain pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      {droplets.map((droplet) => (
        <img
          key={droplet.id}
          src={waterDropletUrl}
          alt=""
          draggable={false}
          className="keel-persona-rain-droplet absolute max-w-none select-none"
          style={dropletStyle(droplet)}
        />
      ))}
    </div>
  );
}
