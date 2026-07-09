// keel_web/src/modules/projects/components/workspace/nodes/WorkspaceMediaToolbar.tsx

// Floating toolbar for selected workspace media nodes.

import type { WorkspaceContainerShape } from "../../../lib/workspace/node";
import { WorkspaceChromeToggle } from "../settings/WorkspaceChromeToggle";
import { WorkspaceColorPalette } from "../settings/WorkspaceColorPalette";
import { WorkspaceContainerShapeToggle } from "../settings/WorkspaceContainerShapeToggle";
import { WorkspaceTransparencyToggle } from "../settings/WorkspaceTransparencyToggle";

type WorkspaceMediaToolbarProps = {
  borderColor: string;
  showTransparency: boolean;
  transparent: boolean;
  hideChrome: boolean;
  containerShape: WorkspaceContainerShape;
  onSelectColor: (hex: string) => void;
  onSelectContainerShape: (shape: WorkspaceContainerShape) => void;
  onToggleTransparent: () => void;
  onToggleHideChrome: () => void;
};

export function WorkspaceMediaToolbar({
  borderColor,
  showTransparency,
  transparent,
  hideChrome,
  containerShape,
  onSelectColor,
  onSelectContainerShape,
  onToggleTransparent,
  onToggleHideChrome,
}: WorkspaceMediaToolbarProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-stone-800 bg-stone-950/90 p-1 shadow-lg ring-1 ring-stone-800/80 backdrop-blur-sm">
      <WorkspaceColorPalette currentColor={borderColor} onSelectColor={onSelectColor} />
      <span className="mx-0.5 h-4 w-px bg-stone-700" aria-hidden />
      {showTransparency && (
        <>
          <WorkspaceTransparencyToggle
            active={transparent}
            onClick={onToggleTransparent}
          />
          <span className="mx-0.5 h-4 w-px bg-stone-700" aria-hidden />
        </>
      )}
      <WorkspaceContainerShapeToggle
        shape={containerShape}
        onSelectShape={onSelectContainerShape}
      />
      <span className="mx-0.5 h-4 w-px bg-stone-700" aria-hidden />
      <WorkspaceChromeToggle active={hideChrome} onClick={onToggleHideChrome} />
    </div>
  );
}
