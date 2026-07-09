// keel_web/src/modules/projects/ProjectsModuleLayout.tsx

// Layout shell for projects gallery, detail, and tags routes with secondary tabs.

import { ModuleSubNavLayout } from "../../app/shell/ModuleSubNavLayout";
import { projectsModuleSubNavItems } from "./subNav";

export function ProjectsModuleLayout() {
  return (
    <ModuleSubNavLayout
      moduleId="projects"
      moduleTitle="Projects"
      items={projectsModuleSubNavItems}
      ariaLabel="Projects module sections"
    />
  );
}
