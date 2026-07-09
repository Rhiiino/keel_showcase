// keel_web/src/modules/media/MediaModuleLayout.tsx

// Layout shell for all media module routes with secondary section tabs.

import { ModuleSubNavLayout } from "../../app/shell/ModuleSubNavLayout";
import { mediaModuleSubNavItems } from "./subNav";

export function MediaModuleLayout() {
  return (
    <ModuleSubNavLayout
      moduleId="media"
      moduleTitle="Media"
      items={mediaModuleSubNavItems}
      ariaLabel="Media module sections"
    />
  );
}
