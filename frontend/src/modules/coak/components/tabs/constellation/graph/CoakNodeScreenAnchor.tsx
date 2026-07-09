// keel_web/src/modules/coak/components/CoakNodeScreenAnchor.tsx

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import { Vector3 } from "three";

import { useCoakRecordWorkspace } from "../../../../context/CoakRecordWorkspaceContext";
import { computeCoakItemEditorScale } from "../../../../lib/tabs/constellation/coakItemEditorAnchor";

const projected = new Vector3();

type CoakNodeScreenAnchorProps = {
  nodeId: string;
};

export function CoakNodeScreenAnchor({ nodeId }: CoakNodeScreenAnchorProps) {
  const { resolveNodePosition, setItemEditorAnchor } = useCoakRecordWorkspace();
  const { camera, gl } = useThree();
  const worldPosition = useMemo(() => new Vector3(), []);

  useFrame(() => {
    const [x, y, z] = resolveNodePosition(nodeId);
    worldPosition.set(x, y, z);
    projected.copy(worldPosition).project(camera);

    const rect = gl.domElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }

    setItemEditorAnchor(nodeId, {
      x: (projected.x * 0.5 + 0.5) * rect.width,
      y: (-projected.y * 0.5 + 0.5) * rect.height,
      scale: computeCoakItemEditorScale(camera, worldPosition),
    });
  });

  return null;
}
