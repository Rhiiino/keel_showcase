// keel_web/src/modules/coak/components/tabs/settings/CoakSettingsSearchTarget.tsx

import type { ReactNode } from "react";

import { useCoakSettingsSearchHighlight } from "./CoakSettingsSearchContext";

type CoakSettingsSearchTargetProps = {
  id: string;
  children: ReactNode;
};

export function CoakSettingsSearchTarget({ id, children }: CoakSettingsSearchTargetProps) {
  const highlighted = useCoakSettingsSearchHighlight(id);

  return (
    <div
      id={id}
      data-coak-settings-search-target={id}
      className={[
        "rounded-md transition-shadow",
        highlighted ? "ring-2 ring-amber-500/45 ring-offset-2 ring-offset-stone-950" : "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}
