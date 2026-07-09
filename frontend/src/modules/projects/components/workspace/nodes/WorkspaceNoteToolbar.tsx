// keel_web/src/modules/projects/components/workspace/nodes/WorkspaceNoteToolbar.tsx

// Floating toolbar for note color, shape, and transparency when a note is selected.

import type { WorkspaceContainerShape } from "../../../lib/workspace/node";
import { WorkspaceContainerShapeToggle } from "../settings/WorkspaceContainerShapeToggle";
import { WorkspaceNoteColorPalette } from "../settings/WorkspaceNoteColorPalette";
import { WorkspaceChromeToggle } from "../settings/WorkspaceChromeToggle";
import { WorkspaceTransparencyToggle } from "../settings/WorkspaceTransparencyToggle";
import { WorkspaceNoteDeleteButton } from "./WorkspaceNoteDeleteButton";

type WorkspaceNoteToolbarProps = {
  nodeId: string;
  borderColor: string;
  transparent: boolean;
  hideChrome: boolean;
  containerShape: WorkspaceContainerShape;
  onDelete: () => void;
  onSelectContainerShape: (shape: WorkspaceContainerShape) => void;
  onSelectColor: (hex: string) => void;
  onToggleTransparent: () => void;
  onToggleHideChrome: () => void;
};

export function WorkspaceNoteToolbar({
  nodeId,
  borderColor,
  transparent,
  hideChrome,
  containerShape,
  onDelete,
  onSelectContainerShape,
  onSelectColor,
  onToggleTransparent,
  onToggleHideChrome,
}: WorkspaceNoteToolbarProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-stone-800 bg-stone-950/90 p-1 shadow-lg ring-1 ring-stone-800/80 backdrop-blur-sm">
      <WorkspaceNoteDeleteButton nodeId={nodeId} onDelete={onDelete} />
      <span className="mx-0.5 h-4 w-px bg-stone-700" aria-hidden />
      <div className="flex items-center gap-1">
        <WorkspaceNoteColorPalette
          currentColor={borderColor}
          onSelectColor={onSelectColor}
        />
      </div>
      <span className="mx-0.5 h-4 w-px bg-stone-700" aria-hidden />
      <WorkspaceContainerShapeToggle
        shape={containerShape}
        onSelectShape={onSelectContainerShape}
      />
      <span className="mx-0.5 h-4 w-px bg-stone-700" aria-hidden />
      <WorkspaceTransparencyToggle active={transparent} onClick={onToggleTransparent} />
      <span className="mx-0.5 h-4 w-px bg-stone-700" aria-hidden />
      <WorkspaceChromeToggle active={hideChrome} onClick={onToggleHideChrome} />
    </div>
  );
}
