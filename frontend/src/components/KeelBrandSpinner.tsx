// keel_web/src/components/KeelBrandSpinner.tsx

// Stylized segmented circular loader using Keel brand greens (logo / KEEL wordmark).
// Segments are placed with SVG transforms only — CSS must not set transform-origin
// on them, or browsers flatten the ring into an ellipse.

import { useId } from "react";

const SEGMENT_COUNT = 12;

type KeelBrandSpinnerProps = {
  className?: string;
  size?: number;
};

export function KeelBrandSpinner({ className = "", size = 80 }: KeelBrandSpinnerProps) {
  const reactId = useId().replace(/:/g, "");
  const fillId = `${reactId}-fill`;
  const glowId = `${reactId}-glow`;

  return (
    <div
      className={`keel-brand-spinner relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    >
      <div className="keel-brand-spinner__ring h-full w-full">
        <svg
          width={size}
          height={size}
          viewBox="0 0 80 80"
          fill="none"
          aria-hidden
          className="block h-full w-full"
        >
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d9f99d" />
              <stop offset="45%" stopColor="#bef264" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
            <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="1.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <circle
            cx="40"
            cy="40"
            r="28"
            stroke="rgba(190, 242, 100, 0.12)"
            strokeWidth="1.5"
          />

          <g filter={`url(#${glowId})`}>
            {Array.from({ length: SEGMENT_COUNT }, (_, index) => (
              <g
                key={index}
                transform={`rotate(${(360 / SEGMENT_COUNT) * index} 40 40)`}
              >
                <rect
                  className="keel-brand-spinner__segment"
                  style={{ animationDelay: `${(index / SEGMENT_COUNT) * -1.05}s` }}
                  x="37"
                  y="8"
                  width="6"
                  height="14"
                  rx="3"
                  fill={`url(#${fillId})`}
                />
              </g>
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}
