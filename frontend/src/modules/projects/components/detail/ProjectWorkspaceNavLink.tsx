// stack_sandbox/frontend_web/src/modules/projects/components/detail/ProjectWorkspaceNavLink.tsx

// Link from project detail to the workspace canvas, shown under the title.

import { Link } from "react-router-dom";

import { WorkspaceCanvasIcon } from "../common/WorkspaceCanvasIcon";

type ProjectWorkspaceNavLinkProps = {
  projectId: number;
};

export function ProjectWorkspaceNavLink({ projectId }: ProjectWorkspaceNavLinkProps) {
  return (
    <Link
      to={`/projects/${projectId}/workspace`}
      className="mt-2 inline-flex items-center gap-1.5 text-xs text-stone-400 transition hover:text-sky-300"
    >
      <WorkspaceCanvasIcon className="h-3.5 w-3.5" />
      <span>Workspace</span>
    </Link>
  );
}
