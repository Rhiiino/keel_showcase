// src/modules/focus/components/constellation/modals/FocusConstellationNodeOriginModal.tsx

// Centered modal shell that animates from a constellation node screen origin.

import { AnimatePresence, motion } from "framer-motion";
import { useRef, type ReactNode } from "react";

import {
  FOCUS_CONSTELLATION_MODAL_MIN_SCALE,
  FOCUS_CONSTELLATION_MODAL_REVEAL_MS,
  resolveModalMotionOffset,
  type FocusConstellationModalOrigin,
} from "../../../lib/constellation/modalOrigin";

const MODAL_EASE = [0.22, 1, 0.36, 1] as const;
const MODAL_DURATION_S = FOCUS_CONSTELLATION_MODAL_REVEAL_MS / 1000;

type FocusConstellationNodeOriginModalProps = {
  open: boolean;
  origin?: FocusConstellationModalOrigin | null;
  ariaLabel: string;
  panelClassName?: string;
  backdropClassName?: string;
  children: ReactNode;
};

export function FocusConstellationNodeOriginModal({
  open,
  origin = null,
  ariaLabel,
  panelClassName = "max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/12 bg-[#141210] p-6 shadow-2xl",
  backdropClassName = "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4",
  children,
}: FocusConstellationNodeOriginModalProps) {
  const lastOriginRef = useRef<FocusConstellationModalOrigin | null>(null);
  if (origin) {
    lastOriginRef.current = origin;
  }

  const offset = resolveModalMotionOffset(lastOriginRef.current);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="focus-constellation-modal-backdrop"
          className={backdropClassName}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: MODAL_DURATION_S * 0.72, ease: MODAL_EASE }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            className={panelClassName}
            initial={{
              opacity: 0,
              scale: FOCUS_CONSTELLATION_MODAL_MIN_SCALE,
              x: offset.x,
              y: offset.y,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              x: 0,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: FOCUS_CONSTELLATION_MODAL_MIN_SCALE,
              x: offset.x,
              y: offset.y,
            }}
            transition={{ duration: MODAL_DURATION_S, ease: MODAL_EASE }}
          >
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
