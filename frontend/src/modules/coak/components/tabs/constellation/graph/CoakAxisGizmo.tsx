// keel_web/src/modules/coak/components/graph/CoakAxisGizmo.tsx

import { GizmoHelper, GizmoViewport } from "@react-three/drei";

import { COAK_WORLD_AXIS_COLORS } from "../../../../lib/tabs/constellation/coakGraphConstants";

export function CoakAxisGizmo() {
  return (
    <GizmoHelper alignment="top-right" margin={[52, 48]}>
      <GizmoViewport
        axisColors={[
          COAK_WORLD_AXIS_COLORS.x,
          COAK_WORLD_AXIS_COLORS.y,
          COAK_WORLD_AXIS_COLORS.z,
        ]}
        labelColor="#f5f5f5"
        labels={["X", "Y", "Z"]}
        hideNegativeAxes
        axisHeadScale={1.05}
      />
    </GizmoHelper>
  );
}
