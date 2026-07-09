// stack_sandbox/frontend_web/src/modules/projects/components/card/ProjectCardWorkspaceButton.tsx

// Kanban card button that opens the project workspace canvas.

import { useNavigate } from "react-router-dom";

import { WorkspaceCanvasIcon } from "../common/WorkspaceCanvasIcon";

type ProjectCardWorkspaceButtonProps = {
  projectId: number;
  projectTitle: string;
};

export function ProjectCardWorkspaceButton({
  projectId,
  projectTitle,
}: ProjectCardWorkspaceButtonProps) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      aria-label={`Open workspace for ${projectTitle}`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        navigate(`/projects/${projectId}/workspace`);
      }}
      className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-stone-950/80 text-stone-200 ring-1 ring-stone-700/80 transition hover:bg-stone-900 hover:text-stone-50"
    >
      <WorkspaceCanvasIcon />
    </button>
  );
}
