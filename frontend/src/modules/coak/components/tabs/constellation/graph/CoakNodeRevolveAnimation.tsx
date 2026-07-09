// keel_web/src/modules/coak/components/tabs/constellation/graph/CoakNodeRevolveAnimation.tsx

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

import { useCoakRecordWorkspace } from "../../../../context/CoakRecordWorkspaceContext";
import { readCoakNodeRevolveSpeed } from "../../../../lib/tabs/settings/coakNodeRevolveSpeedSettings";

export function CoakNodeRevolveAnimation() {
  const { nodeRevolveSession, applyNodeRevolveRotation, configurationSettings } =
    useCoakRecordWorkspace();
  const sessionRef = useRef(nodeRevolveSession);
  sessionRef.current = nodeRevolveSession;

  useFrame((_, delta) => {
    const session = sessionRef.current;
    if (!session) {
      return;
    }

    const speed = readCoakNodeRevolveSpeed(configurationSettings);
    applyNodeRevolveRotation(speed * delta);
  });

  return null;
}
