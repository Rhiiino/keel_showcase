// keel_web/src/modules/coak/components/tabs/constellation/CoakConstellationBreadcrumb.tsx

import { useCallback, useMemo } from "react";

import { useCoakRecordWorkspace } from "../../../context/CoakRecordWorkspaceContext";
import { buildCoakNodeLineagePath } from "../../../lib/tabs/constellation/coakNodeLineage";

type CoakConstellationBreadcrumbProps = {
  enabled: boolean;
};

function CoakConstellationBreadcrumbSeparator() {
  return (
    <span className="shrink-0 select-none text-[10px] text-stone-600/90" aria-hidden>
      ›
    </span>
  );
}

export function useCoakConstellationBreadcrumbVisible(enabled: boolean): boolean {
  const { selectedNodeId, itemEditorNodeIds } = useCoakRecordWorkspace();
  return enabled && selectedNodeId != null && itemEditorNodeIds.length <= 1;
}

export function CoakConstellationBreadcrumb({ enabled }: CoakConstellationBreadcrumbProps) {
  const { items, record, selectedNodeId, itemEditorNodeIds, openItemEditor } =
    useCoakRecordWorkspace();

  const crumbs = useMemo(() => {
    if (!enabled || selectedNodeId == null || itemEditorNodeIds.length > 1) {
      return null;
    }

    return buildCoakNodeLineagePath(items, selectedNodeId, record?.name?.trim() || "Origin");
  }, [enabled, itemEditorNodeIds.length, items, record?.name, selectedNodeId]);

  const handleSelectNode = useCallback(
    (nodeId: string) => {
      openItemEditor(nodeId, { replace: true });
    },
    [openItemEditor],
  );

  const stopHeaderDrag = useCallback((event: React.PointerEvent) => {
    event.stopPropagation();
  }, []);

  if (!crumbs || crumbs.length === 0) {
    return null;
  }

  return (
    <>
      <div className="h-3.5 w-px shrink-0 bg-stone-700/70" aria-hidden />
      <nav
        aria-label="Constellation node path"
        className="flex min-w-0 flex-1 items-center justify-end gap-1 overflow-hidden"
        onPointerDown={stopHeaderDrag}
      >
        <ol className="flex min-w-0 items-center gap-1">
          {crumbs.map((crumb, index) => {
            const isCurrent = index === crumbs.length - 1;

            return (
              <li key={crumb.nodeId} className="flex min-w-0 items-center gap-1">
                {index > 0 ? <CoakConstellationBreadcrumbSeparator /> : null}
                {isCurrent ? (
                  <span
                    aria-current="location"
                    title={crumb.label}
                    className="max-w-[9rem] truncate rounded px-1 py-0.5 text-[11px] font-medium text-lime-200/90"
                  >
                    {crumb.label}
                  </span>
                ) : (
                  <button
                    type="button"
                    title={`Go to ${crumb.label}`}
                    onClick={() => handleSelectNode(crumb.nodeId)}
                    className="max-w-[9rem] truncate rounded px-1 py-0.5 text-[11px] text-stone-400 transition hover:bg-stone-800/80 hover:text-stone-100"
                  >
                    {crumb.label}
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
