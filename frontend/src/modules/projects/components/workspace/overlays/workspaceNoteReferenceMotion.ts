// keel_web/src/modules/projects/components/workspace/overlays/workspaceNoteReferenceMotion.ts

// Motion variants for the workspace note reference modal expand/collapse animation.

import type { Transition, Variants } from "framer-motion";

export type WorkspaceNoteReferenceOrigin = {
  x: number;
  y: number;
};

const BACKDROP_TRANSITION: Transition = { duration: 0.24, ease: [0.22, 1, 0.36, 1] };

const CARD_SPRING: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 34,
  mass: 0.85,
};

const CARD_FADE: Transition = { duration: 0.22, ease: [0.22, 1, 0.36, 1] };

export function workspaceNoteReferenceBackdropTransition(): Transition {
  return BACKDROP_TRANSITION;
}

export function workspaceNoteReferenceCardTransition(reducedMotion: boolean): Transition {
  return reducedMotion ? CARD_FADE : CARD_SPRING;
}

export function workspaceNoteReferenceCardVariants(
  origin: WorkspaceNoteReferenceOrigin | null,
  reducedMotion: boolean,
): Variants {
  if (reducedMotion || origin === null) {
    return {
      initial: { opacity: 0, scale: 0.96 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.96 },
    };
  }

  const x = origin.x - window.innerWidth / 2;
  const y = origin.y - window.innerHeight / 2;

  return {
    initial: { opacity: 0, x, y, scale: 0.08 },
    animate: { opacity: 1, x: 0, y: 0, scale: 1 },
    exit: { opacity: 0, x, y, scale: 0.08 },
  };
}
