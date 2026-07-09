// stack_sandbox/frontend_web/src/modules/projects/components/card/ProjectTitle.tsx

// Project title with customizable font across Kanban and detail views.

import type { CSSProperties, ElementType, ReactNode } from "react";

import type { Project } from "../../api";
import { projectTitleFontStyle } from "../../lib/project/appearance";

type ProjectTitleProps = {
  project: Pick<Project, "title" | "title_font_key">;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

export function ProjectTitle({
  project,
  as: Component = "span",
  className,
  style,
  children,
}: ProjectTitleProps) {
  return (
    <Component
      className={className}
      style={{ ...projectTitleFontStyle(project.title_font_key), ...style }}
    >
      {children ?? project.title}
    </Component>
  );
}
