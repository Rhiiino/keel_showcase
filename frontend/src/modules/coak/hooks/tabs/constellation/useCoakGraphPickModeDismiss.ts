// keel_web/src/modules/coak/hooks/tabs/constellation/useCoakGraphPickModeDismiss.ts

import { useCallback, useEffect, useRef } from "react";

type UseCoakGraphPickModeDismissOptions = {
  active: boolean;
  onDismiss: () => void;
};

export function useCoakGraphPickModeDismiss({
  active,
  onDismiss,
}: UseCoakGraphPickModeDismissOptions) {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const handlePointerMissed = useCallback(
    (event: { button: number }) => {
      if (!active || event.button !== 0) {
        return;
      }

      onDismissRef.current();
    },
    [active],
  );

  useEffect(() => {
    if (!active) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element) || target.closest("canvas")) {
        return;
      }

      onDismissRef.current();
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [active]);

  return { handlePointerMissed };
}
