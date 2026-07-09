// keel_web/src/components/keelPersona/loadingIcon/LoadingIconWobbleLayer.tsx

import type { ReactNode } from "react";

import { LOADING_ICON_WOBBLE_CLASS } from "../../../lib/keelPersona/geometry/loadingIconWobble";

type LoadingIconWobbleLayerProps = {
  enabled: boolean;
  children: ReactNode;
};

export function LoadingIconWobbleLayer({ enabled, children }: LoadingIconWobbleLayerProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 ${enabled ? LOADING_ICON_WOBBLE_CLASS : ""}`}
      style={{ transformOrigin: "50% 50%" }}
    >
      <div className="pointer-events-auto absolute inset-0">{children}</div>
    </div>
  );
}
