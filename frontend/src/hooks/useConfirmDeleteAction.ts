// keel_web/src/hooks/useConfirmDeleteAction.ts

// Two-step delete confirmation with timeout and click-outside cancel.

import { useEffect, useRef, useState } from "react";

import { CARD_MENU_ROOT_ATTR } from "../components/CardMenu";

export const DELETE_CONFIRM_TIMEOUT_MS = 3000;

export function useConfirmDeleteAction(resetKey?: string | number) {
  const [confirmPending, setConfirmPending] = useState(false);
  const timerRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    setConfirmPending(false);
    clearTimer();
  }, [resetKey]);

  useEffect(() => {
    if (!confirmPending) {
      clearTimer();
      return;
    }

    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setConfirmPending(false);
    }, DELETE_CONFIRM_TIMEOUT_MS);

    return clearTimer;
  }, [confirmPending]);

  useEffect(() => {
    if (!confirmPending) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (containerRef.current?.contains(target)) {
        return;
      }
      if (
        target instanceof Element &&
        target.closest(`[${CARD_MENU_ROOT_ATTR}]`)
      ) {
        return;
      }
      setConfirmPending(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [confirmPending]);

  /** Return `false` on the first click so CardMenu stays open for confirm. */
  const handleClick = (onConfirm: () => void): false | void => {
    if (confirmPending) {
      clearTimer();
      setConfirmPending(false);
      onConfirm();
      return;
    }
    setConfirmPending(true);
    return false;
  };

  return {
    confirmPending,
    containerRef,
    handleClick,
  };
}
