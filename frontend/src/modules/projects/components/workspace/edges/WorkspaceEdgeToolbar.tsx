// keel_web/src/modules/projects/components/workspace/edges/WorkspaceEdgeToolbar.tsx

// Floating toolbar for a selected workspace edge.

import type { WorkspaceEdgePathStyle } from "../../../lib/workspace";
import { WorkspaceColorPalette } from "../settings/WorkspaceColorPalette";
import { WorkspaceEdgePathStyleToggle } from "./WorkspaceEdgePathStyleToggle";

type WorkspaceEdgeToolbarProps = {
  pathStyle: WorkspaceEdgePathStyle;
  color: string;
  onTogglePathStyle: () => void;
  onSelectColor: (hex: string) => void;
};

export function WorkspaceEdgeToolbar({
  pathStyle,
  color,
  onTogglePathStyle,
  onSelectColor,
}: WorkspaceEdgeToolbarProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-stone-800 bg-stone-950/90 p-1 shadow-lg ring-1 ring-stone-800/80 backdrop-blur-sm">
      <WorkspaceEdgePathStyleToggle pathStyle={pathStyle} onClick={onTogglePathStyle} />
      <span className="mx-0.5 h-4 w-px bg-stone-700" aria-hidden />
      <div className="flex items-center gap-1">
        <WorkspaceColorPalette currentColor={color} onSelectColor={onSelectColor} />
      </div>
    </div>
  );
}
