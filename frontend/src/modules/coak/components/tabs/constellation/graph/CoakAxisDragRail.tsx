// keel_web/src/modules/coak/components/graph/CoakAxisDragRail.tsx

import { useMemo } from "react";
import { Line } from "@react-three/drei";

import {
  COAK_AXIS_DRAG_RAIL_HALF_LENGTH,
  COAK_WORLD_AXIS_COLORS,
} from "../../../../lib/tabs/constellation/coakGraphConstants";
import type { CoakWorldAxis } from "../../../../lib/tabs/constellation/coakNodePosition";

type CoakAxisDragRailProps = {
  axis: CoakWorldAxis;
};

/** World-space axis guide through the origin node center. */
export function CoakAxisDragRail({ axis }: CoakAxisDragRailProps) {
  const points = useMemo(() => {
    const half = COAK_AXIS_DRAG_RAIL_HALF_LENGTH;

    if (axis === "x") {
      return [
        [-half, 0, 0],
        [half, 0, 0],
      ] as [[number, number, number], [number, number, number]];
    }

    if (axis === "y") {
      return [
        [0, -half, 0],
        [0, half, 0],
      ] as [[number, number, number], [number, number, number]];
    }

    return [
      [0, 0, -half],
      [0, 0, half],
    ] as [[number, number, number], [number, number, number]];
  }, [axis]);

  return (
    <Line
      points={points}
      color={COAK_WORLD_AXIS_COLORS[axis]}
      lineWidth={1}
      transparent
      opacity={0.35}
      raycast={() => null}
    />
  );
}
