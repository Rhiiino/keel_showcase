// keel_web/src/modules/projects/components/workspace/edges/WorkspaceEdgeLabelEditor.tsx

// Inline connection label editor in EdgeLabelRenderer.

import { EdgeLabelRenderer } from "@xyflow/react";
import { useLayoutEffect, useRef } from "react";

import { LABEL_MAX_WIDTH, LABEL_MIN_HEIGHT } from "../../../lib/workspace/edge";
import { useWorkspaceTextFontSizes } from "../context/WorkspaceCanvasContext";

export type WorkspaceEdgeLabelEditSession = {
  edgeId: string;
  draft: string;
  originalLabel: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type WorkspaceEdgeLabelEditorProps = {
  session: WorkspaceEdgeLabelEditSession;
  onDraftChange: (draft: string) => void;
  onLayoutChange: (width: number, height: number) => void;
  onCommit: (draft: string, size?: { width?: number; height?: number }) => void;
  onCancel: () => void;
};

const MEASURE_CLASS =
  "pointer-events-none absolute left-0 top-0 -z-10 box-border whitespace-pre rounded border border-stone-600 px-1.5 py-0.5";

export function WorkspaceEdgeLabelEditor({
  session,
  onDraftChange,
  onLayoutChange,
  onCommit,
  onCancel,
}: WorkspaceEdgeLabelEditorProps) {
  const { labelPx } = useWorkspaceTextFontSizes();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const measureRef = useRef<HTMLSpanElement | null>(null);
  const lastLayoutRef = useRef<{ width: number; height: number } | null>(null);

  useLayoutEffect(() => {
    lastLayoutRef.current = null;
  }, [session.edgeId]);

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) {
      return;
    }

    const focusInput = () => {
      input.focus({ preventScroll: true });
      input.select();
    };

    focusInput();
    const frame = requestAnimationFrame(focusInput);
    return () => cancelAnimationFrame(frame);
  }, [session.edgeId]);

  useLayoutEffect(() => {
    const measure = measureRef.current;
    if (!measure) {
      return;
    }

    const measuredWidth = Math.ceil(measure.offsetWidth);
    const measuredHeight = Math.max(
      LABEL_MIN_HEIGHT,
      Math.ceil(measure.offsetHeight),
    );
    const width = Math.min(LABEL_MAX_WIDTH, Math.max(1, measuredWidth));
    const height = Math.max(LABEL_MIN_HEIGHT, measuredHeight);

    const last = lastLayoutRef.current;
    if (last?.width === width && last?.height === height) {
      return;
    }
    lastLayoutRef.current = { width, height };
    onLayoutChange(width, height);
  }, [onLayoutChange, session.draft]);

  return (
    <EdgeLabelRenderer>
      <div
        className="nodrag nopan pointer-events-auto"
        style={{
          position: "absolute",
          transform: `translate(${session.x}px, ${session.y}px) translate(-50%, -50%)`,
          zIndex: 2000,
          width: session.width,
          height: session.height,
        }}
      >
        <span
          ref={measureRef}
          className={MEASURE_CLASS}
          style={{ fontSize: labelPx }}
          aria-hidden
        >
          {session.draft || "Label…"}
        </span>
        <input
          ref={inputRef}
          data-workspace-edge-label-input="true"
          value={session.draft}
          onChange={(event) => onDraftChange(event.target.value)}
          placeholder="Label…"
          className="box-border h-full w-full max-w-none rounded border border-stone-600 bg-app-canvas px-1.5 py-0.5 text-stone-100 outline-none ring-1 ring-sky-400/50"
          style={{ fontSize: labelPx }}
          onBlur={() => {
            onCommit(session.draft, {
              width: session.width,
              height: session.height,
            });
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onCommit(session.draft, {
                width: session.width,
                height: session.height,
              });
              return;
            }
            if (event.key === "Escape") {
              event.preventDefault();
              onCancel();
              return;
            }
            event.stopPropagation();
          }}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          onDoubleClick={(event) => event.stopPropagation()}
        />
      </div>
    </EdgeLabelRenderer>
  );
}
