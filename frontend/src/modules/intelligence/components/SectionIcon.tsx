// stack_sandbox/frontend_web/src/modules/intelligence/components/SectionIcon.tsx

// Section icons for Intelligence hub cards. Uses bundled assets when present,
// otherwise inline SVG fallbacks.

import type { IntelligenceSection } from "../lib/sections";

type SectionIconProps = {
  sectionId: IntelligenceSection["id"];
  className?: string;
};

const sectionIconModules = import.meta.glob<{ default: string }>(
  "../../../assets/intelligence/*.{png,svg,webp,jpg,jpeg}",
  { eager: true },
);

function sectionIconSrc(sectionId: string): string | undefined {
  for (const [path, mod] of Object.entries(sectionIconModules)) {
    if (path.includes(`/${sectionId}.`)) {
      return mod.default;
    }
  }
  return undefined;
}

function ModelsFallbackIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path
        d="M4 7.5h16M7 4v16M12 10.5v7M17 7v10.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ToolsFallbackIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path
        d="m14.7 6.3 3 3-8.4 8.4-4 1 1-4 8.4-8.4Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="m16 4 4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SectionIcon({ sectionId, className }: SectionIconProps) {
  const src = sectionIconSrc(sectionId);
  if (src) {
    return <img src={src} alt="" className={className} />;
  }
  if (sectionId === "models") {
    return <ModelsFallbackIcon className={className} />;
  }
  return <ToolsFallbackIcon className={className} />;
}
