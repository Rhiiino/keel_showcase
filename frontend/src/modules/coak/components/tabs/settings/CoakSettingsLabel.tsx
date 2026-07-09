// keel_web/src/modules/coak/components/tabs/settings/CoakSettingsLabel.tsx

import type { ReactNode } from "react";

import { CoakSettingsInfoIcon } from "./CoakSettingsInfoIcon";

type CoakSettingsLabelProps = {
  children: ReactNode;
  info: string;
  className?: string;
};

export function CoakSettingsLabel({ children, info, className = "" }: CoakSettingsLabelProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span>{children}</span>
      <CoakSettingsInfoIcon text={info} />
    </span>
  );
}
