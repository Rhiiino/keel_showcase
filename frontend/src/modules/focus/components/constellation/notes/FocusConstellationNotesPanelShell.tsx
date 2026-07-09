// src/modules/focus/components/constellation/notes/FocusConstellationNotesPanelShell.tsx

import { type ReactNode, type MutableRefObject } from "react";

import { useFocusConstellationDraggablePanel } from "../../../hooks/constellation/useFocusConstellationDraggablePanel";
import {
  FOCUS_CONSTELLATION_NODE_INFO_PANEL_WIDTH_CLASS,
  type FocusConstellationConfigPanelPosition,
} from "../../../lib/focus";



type FocusConstellationNotesPanelShellProps = {
  position: FocusConstellationConfigPanelPosition;
  onPositionChange: (position: FocusConstellationConfigPanelPosition) => void;
  panelRef?: MutableRefObject<HTMLDivElement | null>;
  editable?: boolean;
  children: ReactNode;
};



export function FocusConstellationNotesPanelShell({
  position,
  onPositionChange,
  panelRef: externalPanelRef,
  editable = false,
  children,
}: FocusConstellationNotesPanelShellProps) {
  const {
    boundsRef,
    panelRef,
    handleHeaderPointerDown,
    handleHeaderPointerMove,
    handleHeaderPointerUp,
    handleHeaderPointerCancel,
  } = useFocusConstellationDraggablePanel({
    position,
    onPositionChange,
    enabled: true,
  });

  const assignPanelRef = (node: HTMLDivElement | null) => {
    panelRef.current = node;
    if (externalPanelRef) {
      externalPanelRef.current = node;
    }
  };

  return (
    <div ref={boundsRef} className="pointer-events-none absolute inset-0 z-20">
      <div
        ref={assignPanelRef}
        data-focus-constellation-notes-editor="true"
        className={[
          "pointer-events-none absolute rounded-xl border shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md",
          FOCUS_CONSTELLATION_NODE_INFO_PANEL_WIDTH_CLASS,
          editable ? "border-white/14 bg-black/62" : "border-white/10 bg-black/55",
        ].join(" ")}
        style={{ left: position.x, top: position.y }}
      >
        <div
          role="presentation"
          onPointerDown={handleHeaderPointerDown}
          onPointerMove={handleHeaderPointerMove}
          onPointerUp={handleHeaderPointerUp}
          onPointerCancel={handleHeaderPointerCancel}
          className="nodrag nopan pointer-events-auto flex touch-none select-none cursor-grab items-center border-b border-white/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] text-white/55 active:cursor-grabbing"
        >
          Node info
        </div>
        <div className={editable ? "pointer-events-auto px-4 py-3" : "pointer-events-none px-4 py-3"}>
          {children}
        </div>
      </div>
    </div>
  );
}
