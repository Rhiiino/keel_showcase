// stack_sandbox/frontend_web/src/modules/projects/components/card/ProjectCard.tsx

// Kanban-style project card with cover background, title, status, and tags.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";

import { deleteProject, projectsQueryKeys, type Project } from "../../api";
import { resolveKanbanCardColor } from "../../lib/project/appearance";
import { isModelCoverProject } from "../../lib/project/appearance";
import {
  projectStatusLabel,
  projectStatusPillClass,
} from "../../lib/project";
import { ProjectCoverImage, ProjectCoverModelGlow, ProjectCoverStl } from "../cover";
import { ProjectTagPill } from "../tags";
import { ProjectCardMenu } from "./ProjectCardMenu";
import { ProjectCardWorkspaceButton } from "./ProjectCardWorkspaceButton";
import { ProjectTitle } from "./ProjectTitle";

type ProjectCardProps = {
  project: Project;
  variant?: "default" | "board";
  showStatus?: boolean;
  isDragging?: boolean;
  onBoardPointerDown?: (
    projectId: number,
    event: React.PointerEvent<HTMLElement>,
  ) => void;
  shouldSuppressBoardClick?: (projectId: number) => boolean;
};

function CoverFallback() {
  return (
    <div
      className="h-full w-full bg-gradient-to-br from-stone-700/80 via-stone-900 to-stone-950"
      aria-hidden
    />
  );
}

function ProjectCardCover({ project }: { project: Project }) {
  const isModelCover =
    project.cover_media_kind === "model_3d" && project.cover_media_id !== null;

  if (!project.has_cover) {
    return <CoverFallback />;
  }

  if (isModelCover) {
    return (
      <div className="relative h-full w-full overflow-hidden">
        <ProjectCoverModelGlow colorHex={project.cover_glow_color_hex} variant="card" />
        <div className="relative z-[1] h-full w-full">
          <ProjectCoverStl
            key={`${project.cover_media_id}-${project.cover_updated_at ?? "none"}-${project.cover_model_brightness}`}
            projectId={project.id}
            coverMediaId={project.cover_media_id!}
            coverUpdatedAt={project.cover_updated_at}
            modelColorHex={project.cover_model_color_hex}
            modelBrightness={project.cover_model_brightness}
            fallback={<CoverFallback />}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden transition duration-300 group-hover:scale-[1.02]">
      <ProjectCoverImage
        projectId={project.id}
        coverMediaId={project.cover_media_id}
        hasCover={project.has_cover}
        coverUpdatedAt={project.cover_updated_at}
        frameScale={project.cover_image_scale}
        framePositionX={project.cover_image_position_x}
        framePositionY={project.cover_image_position_y}
        alt=""
        fallback={<CoverFallback />}
      />
    </div>
  );
}

export function ProjectCard({
  project,
  variant = "default",
  showStatus: showStatusProp,
  isDragging = false,
  onBoardPointerDown,
  shouldSuppressBoardClick,
}: ProjectCardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const borderColor = resolveKanbanCardColor(project.kanban_card_color_hex);
  const showStatus = showStatusProp ?? variant === "default";
  const isBoard = variant === "board";
  const boardDraggable = isBoard && Boolean(onBoardPointerDown);
  const isModelCover = isModelCoverProject(project);

  const deleteMutation = useMutation({
    mutationFn: () => deleteProject(project.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectsQueryKeys.all });
    },
  });

  const cardSurfaceClass =
    "absolute inset-0 isolate block focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-app";

  const cardContent = (
    <>
      <div className="absolute inset-0 z-0 overflow-hidden">
        <ProjectCardCover project={project} />
      </div>

      {isModelCover ? (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[52%] bg-gradient-to-t from-black/85 via-black/25 to-transparent"
          aria-hidden
        />
      ) : (
        <div
          className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/35 to-black/10"
          aria-hidden
        />
      )}

      {showStatus && (
        <span
          className={[
            "absolute left-3 top-3 z-20 rounded-full px-2.5 py-1 text-xs font-medium ring-1",
            projectStatusPillClass(project.status),
          ].join(" ")}
        >
          {projectStatusLabel(project.status)}
        </span>
      )}

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 p-4">
        {project.tags.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <ProjectTagPill key={tag.id} tag={tag} compact />
            ))}
          </div>
        )}
        <ProjectTitle
          project={project}
          as="h3"
          className="text-3xl font-semibold leading-tight text-stone-50"
        />
      </div>
    </>
  );

  return (
    <article
      className={[
        "group relative aspect-[4/3] overflow-hidden rounded-xl border-2 bg-stone-950 transition hover:brightness-[1.03]",
        isDragging ? "opacity-50" : "",
        boardDraggable ? "cursor-grab active:cursor-grabbing" : "",
      ].join(" ")}
      style={{ borderColor }}
    >
      {isBoard ? (
        <div
          role="link"
          tabIndex={0}
          aria-label={`Open project ${project.title}`}
          className={cardSurfaceClass}
          onPointerDown={(event) => onBoardPointerDown?.(project.id, event)}
          onClick={(event) => {
            if (shouldSuppressBoardClick?.(project.id)) {
              event.preventDefault();
              return;
            }
            navigate(`/projects/${project.id}`);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              navigate(`/projects/${project.id}`);
            }
          }}
        >
          {cardContent}
        </div>
      ) : (
        <Link to={`/projects/${project.id}`} draggable={false} className={cardSurfaceClass}>
          {cardContent}
        </Link>
      )}

      <div
        data-project-card-menu
        className="pointer-events-auto absolute right-3 top-3 z-20 flex items-center gap-1.5"
        onClick={(event) => event.stopPropagation()}
      >
        <ProjectCardWorkspaceButton
          projectId={project.id}
          projectTitle={project.title}
        />
        <ProjectCardMenu
          projectTitle={project.title}
          disabled={deleteMutation.isPending}
          onDelete={() => deleteMutation.mutate()}
        />
      </div>
    </article>
  );
}
