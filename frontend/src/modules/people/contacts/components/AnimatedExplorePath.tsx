// stack_sandbox/frontend_web/src/modules/contacts/components/AnimatedExplorePath.tsx

// Stroke-draw animation for explore-mode family tree connectors.

import { useEffect, useRef } from "react";

type AnimatedExplorePathProps = {
  id: string;
  d: string;
  stroke: string;
  strokeWidth?: number;
  active: boolean;
  durationMs: number;
};

export function AnimatedExplorePath({
  id,
  d,
  stroke,
  strokeWidth = 2,
  active,
  durationMs,
}: AnimatedExplorePathProps) {
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const path = pathRef.current;
    if (!path || !active) {
      return;
    }

    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;

    const animation = path.animate(
      [{ strokeDashoffset: `${length}` }, { strokeDashoffset: "0" }],
      {
        duration: durationMs,
        easing: "ease-out",
        fill: "forwards",
      },
    );

    return () => {
      animation.cancel();
    };
  }, [active, d, durationMs]);

  return (
    <path
      ref={pathRef}
      id={id}
      d={d}
      fill="none"
      stroke={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      style={
        active
          ? undefined
          : {
              strokeDasharray: "none",
              strokeDashoffset: "0",
            }
      }
    />
  );
}

type AnimatedExploreLineProps = {
  id: string;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  stroke: string;
  strokeWidth?: number;
  active: boolean;
  durationMs: number;
};

export function AnimatedExploreLine({
  id,
  x1,
  x2,
  y1,
  y2,
  stroke,
  strokeWidth = 2,
  active,
  durationMs,
}: AnimatedExploreLineProps) {
  const lineRef = useRef<SVGLineElement>(null);

  useEffect(() => {
    const line = lineRef.current;
    if (!line || !active) {
      return;
    }

    const length = Math.hypot(x2 - x1, y2 - y1);
    line.style.strokeDasharray = `${length}`;
    line.style.strokeDashoffset = `${length}`;

    const animation = line.animate(
      [{ strokeDashoffset: `${length}` }, { strokeDashoffset: "0" }],
      {
        duration: durationMs,
        easing: "ease-out",
        fill: "forwards",
      },
    );

    return () => {
      animation.cancel();
    };
  }, [active, durationMs, x1, x2, y1, y2]);

  return (
    <line
      ref={lineRef}
      id={id}
      x1={x1}
      x2={x2}
      y1={y1}
      y2={y2}
      stroke={stroke}
      strokeLinecap="round"
      strokeWidth={strokeWidth}
      style={
        active
          ? undefined
          : {
              strokeDasharray: "none",
              strokeDashoffset: "0",
            }
      }
    />
  );
}
