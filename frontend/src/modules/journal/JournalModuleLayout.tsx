// keel_web/src/modules/journal/JournalModuleLayout.tsx

// Layout shell for all journal module routes with secondary section tabs.

import { ModuleSubNavLayout } from "../../app/shell/ModuleSubNavLayout";
import { journalModuleSubNavItems } from "./subNav";

export function JournalModuleLayout() {
  return (
    <ModuleSubNavLayout
      moduleId="journal"
      moduleTitle="Journal"
      items={journalModuleSubNavItems}
      ariaLabel="Journal module sections"
    />
  );
}
