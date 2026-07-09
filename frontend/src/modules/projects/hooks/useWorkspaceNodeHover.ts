// keel_web/src/modules/projects/hooks/useWorkspaceNodeHover.ts

import { useCallback, useEffect, useState, type PointerEvent as ReactPointerEvent } from "react";

export function useWorkspaceNodeHover(enabled: boolean) {
  const [hovered, setHovered] = useState(false);

  const onPointerEnter = useCallback(
    (_event: ReactPointerEvent<HTMLElement>) => {
      if (!enabled) {
        return;
      }
      setHovered(true);
    },
    [enabled],
  );

  const onPointerLeave = useCallback(() => {
    setHovered(false);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setHovered(false);
    }
  }, [enabled]);

  return { hovered, onPointerEnter, onPointerLeave };
}
