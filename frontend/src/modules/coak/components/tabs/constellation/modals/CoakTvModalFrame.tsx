// keel_web/src/modules/coak/components/CoakTvModalFrame.tsx

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { COAK_ITEM_EDITOR_SHELL_CLASS } from "../../../../lib/tabs/constellation/coakItemEditorStyles";

type CoakTvModalFrameProps = {
  open: boolean;
  children: ReactNode;
  onExitComplete?: () => void;
  className?: string;
  style?: CSSProperties;
  /** Top accent gradient bar — pass a kind-specific gradient class from coakItemEditorStyles. */
  accentBarClass?: string;
};

const TV_ANIMATION_MS = 340;

export function CoakTvModalFrame({
  open,
  children,
  onExitComplete,
  className = "",
  style,
  accentBarClass = "from-lime-400/25 via-lime-400/8 to-transparent",
}: CoakTvModalFrameProps) {
  const [mounted, setMounted] = useState(open);
  const [phase, setPhase] = useState<"enter" | "open" | "exit">(open ? "enter" : "exit");
  const onExitCompleteRef = useRef(onExitComplete);

  onExitCompleteRef.current = onExitComplete;

  useEffect(() => {
    if (open) {
      setMounted(true);
      setPhase("enter");
      const timer = window.setTimeout(() => setPhase("open"), TV_ANIMATION_MS);
      return () => window.clearTimeout(timer);
    }

    if (mounted) {
      setPhase("exit");
      const timer = window.setTimeout(() => {
        setMounted(false);
        onExitCompleteRef.current?.();
      }, TV_ANIMATION_MS);
      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [mounted, open]);

  if (!mounted) {
    return null;
  }

  const animationClass =
    phase === "enter"
      ? "coak-tv-power-on"
      : phase === "exit"
        ? "coak-tv-power-off"
        : "";

  return (
    <>
      <style>{`
        @keyframes coak-tv-power-on {
          0% {
            transform: scaleY(0.004) scaleX(1);
            opacity: 0;
            filter: brightness(3);
          }
          18% {
            transform: scaleY(0.1) scaleX(1);
            opacity: 1;
            filter: brightness(2.4);
          }
          45% {
            transform: scaleY(0.62) scaleX(1.015);
            filter: brightness(1.35);
          }
          100% {
            transform: scaleY(1) scaleX(1);
            opacity: 1;
            filter: brightness(1);
          }
        }

        @keyframes coak-tv-power-off {
          0% {
            transform: scaleY(1) scaleX(1);
            opacity: 1;
            filter: brightness(1);
          }
          55% {
            transform: scaleY(0.14) scaleX(1);
            filter: brightness(2);
          }
          100% {
            transform: scaleY(0.004) scaleX(1);
            opacity: 0;
            filter: brightness(2.6);
          }
        }

        .coak-tv-power-on {
          animation: coak-tv-power-on ${TV_ANIMATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          transform-origin: center center;
        }

        .coak-tv-power-off {
          animation: coak-tv-power-off ${TV_ANIMATION_MS}ms cubic-bezier(0.55, 0, 0.85, 0.36) forwards;
          transform-origin: center center;
        }
      `}</style>
      <div
        className={[COAK_ITEM_EDITOR_SHELL_CLASS, animationClass, className].join(" ")}
        style={style}
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-stone-950" />
        <div
          aria-hidden
          className={[
            "pointer-events-none absolute inset-x-0 top-0 z-[1] h-px bg-gradient-to-r",
            accentBarClass,
          ].join(" ")}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[1] opacity-[0.04]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 3px)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-8 bg-gradient-to-b from-white/[0.04] to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-10 bg-gradient-to-t from-black/20 to-transparent"
        />
        {children}
      </div>
    </>
  );
}
