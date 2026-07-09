// stack_sandbox/frontend_web/src/modules/intelligence/components/IntelligenceSectionCard.tsx

// Hub navigation card for an Intelligence section (Models or Tools).

import { Link } from "react-router-dom";

import type { IntelligenceSection } from "../lib/sections";
import { SectionIcon } from "./SectionIcon";

type IntelligenceSectionCardProps = {
  section: IntelligenceSection;
  countLabel?: string;
};

export function IntelligenceSectionCard({
  section,
  countLabel,
}: IntelligenceSectionCardProps) {
  return (
    <Link
      to={section.href}
      className={[
        "group flex w-full max-w-[18rem] flex-col items-center rounded-xl border border-stone-700/60 px-5 py-6 text-center",
        "bg-gradient-to-b from-stone-900/90 via-stone-950 to-stone-950",
        "shadow-lg shadow-black/30 ring-1 ring-stone-800/50",
        "transition hover:-translate-y-0.5 hover:border-stone-600/80 hover:shadow-xl hover:shadow-sky-950/20 hover:ring-sky-500/25",
      ].join(" ")}
    >
      <div
        className={[
          "flex w-full aspect-[3/2] shrink-0 items-center justify-center overflow-hidden rounded-xl",
          "border border-stone-700/50 bg-stone-900/80",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_16px_rgba(0,0,0,0.35)]",
        ].join(" ")}
      >
        <SectionIcon
          sectionId={section.id}
          className="h-full w-full object-contain p-3 text-stone-300"
        />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-stone-100 group-hover:text-sky-300">
        {section.title}
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-stone-500">{section.description}</p>
      {countLabel ? (
        <p className="mt-3 font-mono text-xs text-stone-600">{countLabel}</p>
      ) : null}
    </Link>
  );
}
