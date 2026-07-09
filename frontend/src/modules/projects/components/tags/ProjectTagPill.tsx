// stack_sandbox/frontend_web/src/modules/projects/components/tags/ProjectTagPill.tsx

// Colored pill for a project tag.

import type { ProjectTag } from "../../api";
import { projectTagPillStyle } from "../../lib/project";

type ProjectTagPillProps = {
  tag: ProjectTag;
  compact?: boolean;
  className?: string;
};

export function ProjectTagPill({
  tag,
  compact = false,
  className,
}: ProjectTagPillProps) {
  const style = projectTagPillStyle(tag.color_hex);

  return (
    <span
      className={[
        "inline-flex items-center rounded-full font-medium ring-1",
        compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className ?? "",
      ].join(" ")}
      style={style}
    >
      {tag.name}
    </span>
  );
}
