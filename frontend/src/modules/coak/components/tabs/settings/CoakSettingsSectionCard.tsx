// keel_web/src/modules/coak/components/tabs/settings/CoakSettingsSectionCard.tsx

import type { ReactNode } from "react";

import { useCoakSettingsSearchHighlight } from "./CoakSettingsSearchContext";

type CoakSettingsSectionCardProps = {
  title: string;
  searchId?: string;
  children: ReactNode;
};

export function CoakSettingsSectionCard({
  title,
  searchId,
  children,
}: CoakSettingsSectionCardProps) {
  const highlighted = useCoakSettingsSearchHighlight(searchId ?? "");

  return (
    <section
      id={searchId}
      className={[
        "overflow-hidden rounded-lg border border-stone-800/80 bg-stone-950/60 ring-1 ring-stone-800/40 transition-shadow",
        highlighted && searchId
          ? "ring-2 ring-amber-500/45 ring-offset-2 ring-offset-stone-900"
          : "",
      ].join(" ")}
    >
      <header className="border-b border-stone-800/70 bg-stone-900/35 px-3 py-2.5">
        <h3 className="text-xs font-semibold tracking-wide text-stone-200">{title}</h3>
      </header>
      <div className="space-y-3 p-3">{children}</div>
    </section>
  );
}
