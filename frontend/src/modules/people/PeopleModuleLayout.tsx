// keel_web/src/modules/people/PeopleModuleLayout.tsx

// Layout shell for all people module routes with secondary section tabs.

import { ModuleSubNavLayout } from "../../app/shell/ModuleSubNavLayout";
import { peopleModuleSubNavItems } from "./subNav";

export function PeopleModuleLayout() {
  return (
    <ModuleSubNavLayout
      moduleId="people"
      moduleTitle="People"
      items={peopleModuleSubNavItems}
      ariaLabel="People module sections"
    />
  );
}
