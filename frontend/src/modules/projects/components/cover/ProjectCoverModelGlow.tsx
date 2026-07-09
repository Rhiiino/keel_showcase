// stack_sandbox/frontend_web/src/modules/projects/components/cover/ProjectCoverModelGlow.tsx

// Centered background glow behind a 3D model cover.

import { coverGlowStyle, coverHeroRadialGradient } from "../../lib/project/appearance";

type ProjectCoverModelGlowProps = {
  colorHex: string | null | undefined;
  variant?: "card" | "hero";
};

export function ProjectCoverModelGlow({
  colorHex,
  variant = "card",
}: ProjectCoverModelGlowProps) {
  if (variant === "hero") {
    return (
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 aspect-square w-[140%] max-w-[520px] -translate-x-1/2 -translate-y-1/2 sm:w-[160%] sm:max-w-[600px]"
        style={{ background: coverHeroRadialGradient(colorHex) }}
        aria-hidden
      />
    );
  }

  const glow = coverGlowStyle(colorHex);

  return (
    <>
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-2/3 w-2/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ backgroundColor: glow.outer }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ backgroundColor: glow.inner }}
        aria-hidden
      />
    </>
  );
}
