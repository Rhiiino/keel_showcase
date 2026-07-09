// keel_web/src/modules/projects/components/workspace/canvas/WorkspaceSnapThread.tsx

// Preview thread between shape snap anchors while a snap is available.

import { ViewportPortal } from "@xyflow/react";

import type { WorkspaceSnapCandidate } from "../../../lib/workspace/snap";

type WorkspaceSnapThreadProps = {
  candidate: WorkspaceSnapCandidate | null;
};

export function WorkspaceSnapThread({ candidate }: WorkspaceSnapThreadProps) {
  if (!candidate) {
    return null;
  }

  const { from, to } = candidate;

  return (
    <ViewportPortal>
      <svg
        className="workspace-snap-thread pointer-events-none absolute left-0 top-0 h-full w-full overflow-visible"
        aria-hidden
      >
        <line
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
          className="workspace-snap-thread__line"
        />
        <circle
          cx={from.x}
          cy={from.y}
          r={3}
          className="workspace-snap-thread__dot"
        />
        <circle
          cx={to.x}
          cy={to.y}
          r={3}
          className="workspace-snap-thread__dot"
        />
      </svg>
    </ViewportPortal>
  );
}
