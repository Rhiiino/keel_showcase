// keel_web/src/modules/finance/FinanceModuleLayout.tsx

// Layout shell for all finance module routes with secondary section tabs.

import { ModuleSubNavLayout } from "../../app/shell/ModuleSubNavLayout";
import { financeModuleSubNavItems } from "./subNav";

export function FinanceModuleLayout() {
  return (
    <ModuleSubNavLayout
      moduleId="finance"
      moduleTitle="Finance"
      items={financeModuleSubNavItems}
      ariaLabel="Finance module sections"
    />
  );
}
