// stack_sandbox/frontend_web/src/modules/agents/components/AgentDetailAside.tsx

// Right detail column with slide-in / slide-out when opening or closing.

import { useEffect, useRef, useState } from "react";

import type { AgentSummary } from "../api";
import { AgentDetailPanel } from "./AgentDetailPanel";

const SLIDE_MS = 300;

type AgentDetailAsideProps = {
  agent: AgentSummary | null;
  /** Fires when the panel is mounted or unmounted (includes close animation). */
  onLayoutOpenChange?: (open: boolean) => void;
};

export function AgentDetailAside({
  agent,
  onLayoutOpenChange,
}: AgentDetailAsideProps) {
  const [mountedAgent, setMountedAgent] = useState<AgentSummary | null>(null);
  const [slideIn, setSlideIn] = useState(false);
  const panelOpenRef = useRef(false);
  const unmountTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (unmountTimerRef.current) {
      clearTimeout(unmountTimerRef.current);
      unmountTimerRef.current = null;
    }

    if (agent) {
      const isOpening = !panelOpenRef.current;
      panelOpenRef.current = true;
      setMountedAgent(agent);

      if (isOpening) {
        setSlideIn(false);
        const frame = requestAnimationFrame(() => {
          requestAnimationFrame(() => setSlideIn(true));
        });
        return () => cancelAnimationFrame(frame);
      }

      return;
    }

    if (panelOpenRef.current) {
      panelOpenRef.current = false;
      setSlideIn(false);
      unmountTimerRef.current = setTimeout(() => {
        setMountedAgent(null);
        unmountTimerRef.current = null;
      }, SLIDE_MS);
    }

    return () => {
      if (unmountTimerRef.current) {
        clearTimeout(unmountTimerRef.current);
        unmountTimerRef.current = null;
      }
    };
  }, [agent]);

  useEffect(() => {
    onLayoutOpenChange?.(mountedAgent !== null);
  }, [mountedAgent, onLayoutOpenChange]);

  const handleTransitionEnd = (event: React.TransitionEvent<HTMLElement>) => {
    if (event.propertyName !== "transform") {
      return;
    }
    if (!slideIn && !agent) {
      if (unmountTimerRef.current) {
        clearTimeout(unmountTimerRef.current);
        unmountTimerRef.current = null;
      }
      setMountedAgent(null);
    }
  };

  if (!mountedAgent) {
    return null;
  }

  return (
    <div
      className="flex h-full min-h-0 min-w-0 overflow-hidden"
      aria-hidden={!slideIn && !agent}
    >
      <aside
        className={[
          "flex h-full min-h-0 w-full min-w-0 flex-col will-change-transform",
          "transition-transform duration-300 ease-out motion-reduce:transition-none",
          slideIn ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
        aria-label={`${mountedAgent.display_name} details`}
        onTransitionEnd={handleTransitionEnd}
      >
        <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto overscroll-contain p-8 lg:p-10">
          <AgentDetailPanel agent={mountedAgent} />
        </div>
      </aside>
    </div>
  );
}
