// keel_web/src/modules/jobs/JobsModuleLayout.tsx

import { ModuleSubNavLayout } from "../../app/shell/ModuleSubNavLayout";
import { jobsModuleSubNavItems } from "./subNav";

export function JobsModuleLayout() {
  return (
    <ModuleSubNavLayout
      moduleId="jobs"
      moduleTitle="Jobs"
      items={jobsModuleSubNavItems}
      ariaLabel="Jobs module sections"
    />
  );
}
