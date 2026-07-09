// keel_web/src/modules/focus/hooks/automation/useFocusAutomationEndConfirm.ts

import { useEffect, useRef, useState } from "react";

const END_CONFIRM_TIMEOUT_MS = 3000;

export function useFocusAutomationEndConfirm(isLive: boolean) {
  const [endConfirmPending, setEndConfirmPending] = useState(false);
  const endConfirmTimerRef = useRef<number | null>(null);

  const clearEndConfirmTimer = () => {
    if (endConfirmTimerRef.current !== null) {
      window.clearTimeout(endConfirmTimerRef.current);
      endConfirmTimerRef.current = null;
    }
  };

  useEffect(() => {
    setEndConfirmPending(false);
    clearEndConfirmTimer();
  }, [isLive]);

  useEffect(() => {
    if (!endConfirmPending) {
      clearEndConfirmTimer();
      return;
    }

    endConfirmTimerRef.current = window.setTimeout(() => {
      endConfirmTimerRef.current = null;
      setEndConfirmPending(false);
    }, END_CONFIRM_TIMEOUT_MS);

    return clearEndConfirmTimer;
  }, [endConfirmPending]);

  return {
    endConfirmPending,
    setEndConfirmPending,
    clearEndConfirmTimer,
  };
}
