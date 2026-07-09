// keel_web/src/modules/timeline/TimelineModuleLayout.tsx

// Layout shell for all timeline module routes with secondary section tabs.

import { ModuleSubNavLayout } from "../../app/shell/ModuleSubNavLayout";
import { timelineModuleSubNavItems } from "./subNav";

export function TimelineModuleLayout() {
  return (
    <ModuleSubNavLayout
      moduleId="timeline"
      moduleTitle="Timeline"
      items={timelineModuleSubNavItems}
      ariaLabel="Timeline module sections"
    />
  );
}
