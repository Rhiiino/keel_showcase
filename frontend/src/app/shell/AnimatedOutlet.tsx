// stack_sandbox/frontend_web/src/app/shell/AnimatedOutlet.tsx

// Wraps the shell Outlet with Framer Motion page transitions driven by transition settings.

import { AnimatePresence, motion } from "framer-motion";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useOutlet } from "react-router-dom";

import { resolveActiveNavId } from "../nav/appNavConfig";
import { appNavItems } from "../nav/appNavRegistry";
import {
  resolveTransitionConfig,
  type TransitionKind,
} from "../../modules/settings/lib/transition";
import { useTransitionSettings } from "../../modules/settings/components/context";

const OUTLET_LAYOUT_CLASS =
  "flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden";

function outletAnimationKey(pathname: string): string {
  const workspaceMatch = pathname.match(/^(\/projects\/\d+\/workspace)\/\d+$/);
  if (workspaceMatch) {
    return workspaceMatch[1];
  }
  return pathname;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = () => setReduced(media.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  return reduced;
}

export function AnimatedOutlet() {
  const location = useLocation();
  const outlet = useOutlet();
  const settings = useTransitionSettings();
  const prefersReducedMotion = usePrefersReducedMotion();

  const [outletByPath, setOutletByPath] = useState<Map<string, ReactNode>>(() =>
    new Map([[location.pathname, outlet]]),
  );
  const [transitionKind, setTransitionKind] = useState<TransitionKind>("page");
  const prevPathnameRef = useRef(location.pathname);

  useLayoutEffect(() => {
    setOutletByPath((previous) => {
      const next = new Map(previous);
      next.set(location.pathname, outlet);
      return next;
    });
  }, [location.pathname, outlet]);

  useEffect(() => {
    if (location.pathname === prevPathnameRef.current) {
      return;
    }
    const prevNavId = resolveActiveNavId(prevPathnameRef.current, appNavItems);
    const nextNavId = resolveActiveNavId(location.pathname, appNavItems);
    setTransitionKind(prevNavId !== nextNavId ? "menu" : "page");
    prevPathnameRef.current = location.pathname;
  }, [location.pathname]);

  const pageOutlet = outletByPath.get(location.pathname) ?? outlet;

  const { variants, durationMs, animate } = resolveTransitionConfig(
    settings,
    transitionKind,
  );
  const motionEnabled = animate && !prefersReducedMotion;
  const durationSec = durationMs / 1000;

  if (!motionEnabled) {
    return <div className={OUTLET_LAYOUT_CLASS}>{pageOutlet}</div>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={outletAnimationKey(location.pathname)}
        className={OUTLET_LAYOUT_CLASS}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: durationSec, ease: [0.22, 1, 0.36, 1] }}
      >
        {pageOutlet}
      </motion.div>
    </AnimatePresence>
  );
}
