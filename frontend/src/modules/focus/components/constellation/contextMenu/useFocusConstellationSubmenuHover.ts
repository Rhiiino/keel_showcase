// src/modules/focus/components/constellation/contextMenu/useFocusConstellationSubmenuHover.ts

import { useEffect, useRef, useState } from "react";

import { SUBMENU_CLOSE_DELAY_MS } from "./FocusConstellationContextMenuStyles";

type UseFocusConstellationSubmenuHoverOptions = {
  onClose?: () => void;
  delayMs?: number;
};

export function useFocusConstellationSubmenuHover(
  options?: UseFocusConstellationSubmenuHoverOptions,
) {
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
  const delayMs = options?.delayMs ?? SUBMENU_CLOSE_DELAY_MS;

  const clearCloseTimer = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openSubmenu = () => {
    clearCloseTimer();
    setOpen(true);
  };

  const closeSubmenu = () => {
    clearCloseTimer();
    setOpen(false);
    options?.onClose?.();
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      setOpen(false);
      options?.onClose?.();
    }, delayMs);
  };

  useEffect(() => clearCloseTimer, []);

  return {
    open,
    setOpen,
    openSubmenu,
    closeSubmenu,
    scheduleClose,
    clearCloseTimer,
  };
}
