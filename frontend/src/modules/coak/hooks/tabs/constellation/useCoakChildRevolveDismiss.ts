// keel_web/src/modules/coak/hooks/graph/useCoakChildRevolveDismiss.ts

import { useCallback, useEffect, useRef } from "react";

import { COAK_CHILD_REVOLVE_DISMISS_THRESHOLD_PX } from "../../../lib/tabs/constellation/coakGraphConstants";

type UseCoakChildRevolveDismissOptions = {
  active: boolean;
  dragActive: boolean;
  onDismiss: () => void;
};

export function useCoakChildRevolveDismiss({
  active,
  dragActive,
  onDismiss,
}: UseCoakChildRevolveDismissOptions) {
  const pendingDismissRef = useRef(false);
  const pointerStartRef = useRef({ x: 0, y: 0 });
  const onDismissRef = useRef(onDismiss);

  onDismissRef.current = onDismiss;

  const handlePointerMissed = useCallback(
    (event: { clientX: number; clientY: number }) => {
      if (!active || dragActive) {
        return;
      }

      pendingDismissRef.current = true;
      pointerStartRef.current = { x: event.clientX, y: event.clientY };
    },
    [active, dragActive],
  );

  useEffect(() => {
    if (!active) {
      pendingDismissRef.current = false;
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (!pendingDismissRef.current) {
        return;
      }

      const dx = event.clientX - pointerStartRef.current.x;
      const dy = event.clientY - pointerStartRef.current.y;
      if (Math.hypot(dx, dy) > COAK_CHILD_REVOLVE_DISMISS_THRESHOLD_PX) {
        pendingDismissRef.current = false;
      }
    };

    const handlePointerUp = () => {
      if (pendingDismissRef.current && !dragActive) {
        onDismissRef.current();
      }

      pendingDismissRef.current = false;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [active, dragActive]);

  return { handlePointerMissed };
}
