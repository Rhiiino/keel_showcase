// keel_web/src/modules/coak/components/graph/CoakChildRevolveRails.tsx

import { useMemo } from "react";
import type { ThreeEvent } from "@react-three/fiber";

import { useCoakRecordWorkspace } from "../../../../context/CoakRecordWorkspaceContext";
import { useCoakChildRevolveDrag } from "../../../../hooks/tabs/constellation/useCoakChildRevolveDrag";
import {
  COAK_CHILD_REVOLVE_RAIL_HIT_TUBE_RADIUS,
  COAK_CHILD_REVOLVE_RAIL_TUBE_RADIUS,
  COAK_WORLD_AXIS_COLORS,
} from "../../../../lib/tabs/constellation/coakGraphConstants";
import type { CoakWorldAxis } from "../../../../lib/tabs/constellation/coakNodePosition";

type CoakChildRevolveRailProps = {
  axis: CoakWorldAxis;
  pivot: [number, number, number];
  radius: number;
  onBeginDrag: (axis: CoakWorldAxis, event: ThreeEvent<PointerEvent>) => void;
};

function CoakChildRevolveRail({
  axis,
  pivot,
  radius,
  onBeginDrag,
}: CoakChildRevolveRailProps) {
  const rotation = useMemo((): [number, number, number] => {
    if (axis === "x") {
      return [0, Math.PI / 2, 0];
    }

    if (axis === "y") {
      return [Math.PI / 2, 0, 0];
    }

    return [0, 0, 0];
  }, [axis]);

  const color = COAK_WORLD_AXIS_COLORS[axis];

  return (
    <group position={pivot} rotation={rotation}>
      <mesh
        onPointerDown={(event) => {
          event.stopPropagation();
          onBeginDrag(axis, event);
        }}
      >
        <torusGeometry args={[radius, COAK_CHILD_REVOLVE_RAIL_HIT_TUBE_RADIUS, 10, 72]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh raycast={() => null}>
        <torusGeometry args={[radius, COAK_CHILD_REVOLVE_RAIL_TUBE_RADIUS, 8, 72]} />
        <meshBasicMaterial color={color} transparent opacity={0.55} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function CoakChildRevolveRails() {
  const {
    childRevolveSession,
    applyChildRevolveRotation,
    setChildRevolveDragActive,
  } = useCoakRecordWorkspace();

  const pivot = childRevolveSession?.pivot ?? [0, 0, 0];

  const { beginDrag } = useCoakChildRevolveDrag({
    pivot,
    onRotate: applyChildRevolveRotation,
    onDragActiveChange: setChildRevolveDragActive,
  });

  if (!childRevolveSession || childRevolveSession.targetItemIds.length === 0) {
    return null;
  }

  const handleBeginDrag = (axis: CoakWorldAxis, event: ThreeEvent<PointerEvent>) => {
    if (event.button !== 0) {
      return;
    }

    event.nativeEvent.preventDefault();
    beginDrag(axis, event.nativeEvent.clientX, event.nativeEvent.clientY, event.pointerId);
  };

  return (
    <group>
      <CoakChildRevolveRail
        axis="x"
        pivot={childRevolveSession.pivot}
        radius={childRevolveSession.railRadius}
        onBeginDrag={handleBeginDrag}
      />
      <CoakChildRevolveRail
        axis="y"
        pivot={childRevolveSession.pivot}
        radius={childRevolveSession.railRadius}
        onBeginDrag={handleBeginDrag}
      />
      <CoakChildRevolveRail
        axis="z"
        pivot={childRevolveSession.pivot}
        radius={childRevolveSession.railRadius}
        onBeginDrag={handleBeginDrag}
      />
    </group>
  );
}
