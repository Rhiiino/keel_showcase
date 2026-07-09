// keel_web/src/modules/auth/components/login/classic/LoginLightningSky.tsx

// Full-screen sky lightning flashes for the classic login screen — random strikes biased toward the top.

import { type CSSProperties } from "react";

import { LIGHTNING_BOLT_PATHS } from "../../../../../lib/visual/lightningStrike";
import { useLightningStrikes } from "../../../../../lib/visual/useLightningStrikes";

type LoginLightningSkyProps = {
  disabled?: boolean;
};

export function LoginLightningSky({ disabled = false }: LoginLightningSkyProps) {
  const strikes = useLightningStrikes({ disabled });

  if (disabled) {
    return null;
  }

  return (
    <div className="login-lightning-sky" aria-hidden>
      {strikes.map((strike) => (
        <div
          key={strike.id}
          className="login-lightning-strike"
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
              "login-lightning-sky-flash",
              strike.doubleFlicker ? "login-lightning-sky-flash--flicker" : "",
            ].join(" ")}
          />
          <svg
            className="login-lightning-bolt"
            viewBox="0 0 100 72"
            style={{ left: `${strike.x}%` }}
            aria-hidden
          >
            <path
              d={LIGHTNING_BOLT_PATHS[strike.boltVariant]}
              className="login-lightning-bolt-path"
            />
          </svg>
        </div>
      ))}
    </div>
  );
}
