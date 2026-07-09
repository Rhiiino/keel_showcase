// keel_web/src/modules/projects/components/workspace/panel/WorkspaceCanvasesTab.tsx

// Canvases tab: list, switch, rename, delete, and set default workspace canvases.

import type { ProjectCanvas } from "../../../api";
import { WorkspaceCanvasListRow } from "./WorkspaceCanvasListRow";
import {
  WORKSPACE_CANVAS_LIST_GRID_CLASS,
  WORKSPACE_CANVAS_LIST_HEADER_CLASS,
} from "./workspaceCanvasListStyles";

type WorkspaceCanvasesTabProps = {
  canvases: ProjectCanvas[];
  activeCanvasId: number;
  disabled?: boolean;
  deletePending?: boolean;
  noteCountByCanvasId?: Map<number, number>;
  onSelectCanvas: (canvasId: number) => void;
  onRenameCanvas: (canvasId: number, name: string) => void;
  onDeleteCanvas: (canvasId: number) => void;
  onSetDefaultCanvas: (canvasId: number) => void;
  autoRenameCanvasId?: number | null;
  onClearAutoRenameCanvas?: () => void;
};

export function WorkspaceCanvasesTab({
  canvases,
  activeCanvasId,
  disabled = false,
  deletePending = false,
  noteCountByCanvasId,
  onSelectCanvas,
  onRenameCanvas,
  onDeleteCanvas,
  onSetDefaultCanvas,
  autoRenameCanvasId = null,
  onClearAutoRenameCanvas,
}: WorkspaceCanvasesTabProps) {
  const canDelete = canvases.length > 1;

  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-2 py-2"
      aria-label="Canvas"
    >
      {canvases.length === 0 ? (
        <p className="px-2 py-4 text-center text-xs text-stone-500">
          No canvases yet. Use + to create one.
        </p>
      ) : (
        <>
          <div
            className={`${WORKSPACE_CANVAS_LIST_GRID_CLASS} ${WORKSPACE_CANVAS_LIST_HEADER_CLASS} px-0.5`}
            aria-hidden
          >
            <div className="min-w-0">Canvas</div>
            <div className="text-center">Notes</div>
            <div className="min-w-0">Updated</div>
            <div />
          </div>

          <ul className="space-y-2 px-0.5">
            {canvases.map((canvas) => (
              <li key={canvas.canvas_id}>
                <WorkspaceCanvasListRow
                  canvas={canvas}
                  active={canvas.canvas_id === activeCanvasId}
                  disabled={disabled || deletePending}
                  deleteDisabled={!canDelete}
                  noteCount={noteCountByCanvasId?.get(canvas.canvas_id) ?? 0}
                onSelect={() => onSelectCanvas(canvas.canvas_id)}
                onRename={(name) => onRenameCanvas(canvas.canvas_id, name)}
                onDelete={
                  canDelete ? () => onDeleteCanvas(canvas.canvas_id) : undefined
                }
                onSetDefault={
                  canvas.is_default
                    ? undefined
                    : () => onSetDefaultCanvas(canvas.canvas_id)
                }
                autoRename={autoRenameCanvasId === canvas.canvas_id}
                onAutoRenameHandled={onClearAutoRenameCanvas}
              />
            </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
