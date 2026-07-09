// stack_sandbox/frontend_web/src/modules/chat/components/status/ToolCategoryIcon.tsx

// Renders a tool category logo (core, obsidian, …) at a consistent size.

import { toolCategoryIconSrc } from "../../lib/tools";

type ToolCategoryIconProps = {
  category: string | null | undefined;
  size?: "xs" | "sm" | "md";
  className?: string;
};

const sizeClass = {
  xs: "h-3 w-3",
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
} as const;

export function ToolCategoryIcon({
  category,
  size = "sm",
  className = "",
}: ToolCategoryIconProps) {
  const src = toolCategoryIconSrc(category);
  if (!src) {
    return null;
  }

  return (
    <img
      src={src}
      alt=""
      className={`shrink-0 rounded object-contain ${sizeClass[size]} ${className}`.trim()}
    />
  );
}
