// keel_web/src/modules/coak/components/tabs/constellation/CoakStormLightningOverlay.tsx

// Intermittent lightning flashes over the constellation storm background preset.

import { type CSSProperties } from "react";

import { LIGHTNING_BOLT_PATHS } from "../../../../../lib/visual/lightningStrike";
import { useLightningStrikes } from "../../../../../lib/visual/useLightningStrikes";
import { usePrefersReducedMotion } from "../../../../../lib/visual/usePrefersReducedMotion";

export function CoakStormLightningOverlay() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const strikes = useLightningStrikes({ disabled: prefersReducedMotion });

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <div className="coak-storm-lightning-sky" aria-hidden>
      {strikes.map((strike) => (
        <div
          key={strike.id}
          className="coak-storm-lightning-strike"
          style={
            {
              "--strike-x": `${strike.x}%`,
              "--strike-y": `${strike.y}%`,
              "--flash-peak": strike.peak,
            } as CSSProperties
          }
        >
          <div
            className={[
              "coak-storm-lightning-sky-flash",
              strike.doubleFlicker ? "coak-storm-lightning-sky-flash--flicker" : "",
            ].join(" ")}
          />
          <svg
            className="coak-storm-lightning-bolt"
            viewBox="0 0 100 72"
            style={{ left: `${strike.x}%` }}
            aria-hidden
          >
            <path
              d={LIGHTNING_BOLT_PATHS[strike.boltVariant]}
              className="coak-storm-lightning-bolt-path"
            />
          </svg>
        </div>
      ))}
    </div>
  );
}
