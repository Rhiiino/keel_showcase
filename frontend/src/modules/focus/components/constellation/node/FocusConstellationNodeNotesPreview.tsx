// src/modules/focus/components/constellation/node/FocusConstellationNodeNotesPreview.tsx

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

import { useFocusNodeTimer } from "../../../hooks/useFocusNodeTimer";
import { useFocusConstellationNodeNotesEditor } from "../../../hooks/constellation/useFocusConstellationNodeNotesEditor";
import {
  FOCUS_NODE_STATUS_COLORS,
  FOCUS_NODE_STATUS_LABELS,
  FOCUS_CONSTELLATION_NODE_INFO_NOTES_MIN_HEIGHT_CLASS,
  FOCUS_CONSTELLATION_NODE_INFO_NOTES_MAX_HEIGHT_PX,
  FOCUS_CONSTELLATION_NODE_INFO_TIMER_RECORD_GRID_CLASS,
  type FocusConstellationConfigPanelPosition,
  type FocusNodeStatus,
} from "../../../lib/focus";
import {
  FocusListTagSelect,
  FocusNodeStatusSelect,
  FocusWorkOrderInput,
} from "../../forms/fields";
import {
  FOCUS_NODE_TIMER_PILL_SURFACE_CLASS,
  formatElapsedTime,
} from "../../forms/timer";
import { FocusTagPill } from "../../shared/tags";
import { FocusReferenceRecordLink } from "../../shared/references";
import type { FocusConstellationFlowNode } from "./FocusConstellationNode";
import { isFocusRecordReference } from "../../../lib/focus/referenceNavigation";
import {
  useFocusConstellationNodeHover,
  type FocusConstellationHoveredNodeInfo,
} from "./FocusConstellationNodeHoverContext";
import { FocusConstellationNotesPanelShell } from "../notes";



type FocusConstellationNodeNotesPreviewProps = {
  enabled: boolean;
  nodes: FocusConstellationFlowNode[];
  selectedNodeIds: ReadonlySet<string>;
  position: FocusConstellationConfigPanelPosition;
  onPositionChange: (position: FocusConstellationConfigPanelPosition) => void;
  onSaveNotes: (nodeId: number, notes: string) => Promise<void>;
  onSaveWorkOrder: (nodeId: number, workOrder: number | null) => Promise<void>;
  onSaveStatus: (nodeId: number, status: FocusNodeStatus) => Promise<void>;
  onSaveTitle: (nodeId: number, title: string) => Promise<void>;
  onSaveTags: (nodeId: number, tagIds: number[]) => Promise<void>;
  onSaveShowReferenceContent: (
    nodeId: number,
    showReferenceContent: boolean,
  ) => Promise<void>;
};



function resolveSingleSelectedNode(
  nodes: FocusConstellationFlowNode[],
  selectedNodeIds: ReadonlySet<string>,
): FocusConstellationFlowNode | null {
  if (selectedNodeIds.size !== 1) {
    return null;
  }

  const selectedId = selectedNodeIds.values().next().value;
  if (!selectedId) {
    return null;
  }

  return nodes.find((node) => node.id === selectedId) ?? null;
}



function TimerPill({
  elapsedSeconds,
  title,
  compact = false,
}: {
  elapsedSeconds: number;
  title: string;
  compact?: boolean;
}) {
  return (
    <span
      className={[
        FOCUS_NODE_TIMER_PILL_SURFACE_CLASS,
        "inline-flex shrink-0 justify-center font-semibold text-white",
        compact
          ? "min-w-[5.25rem] px-2.5 py-1 text-xs"
          : "min-w-[5.75rem] px-3 py-1.5 text-sm",
      ].join(" ")}
      style={{
        backgroundColor: "rgb(4 120 87)",
        borderColor: "rgb(110 231 183 / 0.72)",
      }}
      title={title}
    >
      {formatElapsedTime(elapsedSeconds)}
    </span>
  );
}



function ReadOnlyTimerInfo({ timerNodeId }: { timerNodeId: number }) {
  const timer = useFocusNodeTimer({
    nodeId: timerNodeId,
    historyEnabled: false,
  });
  const activeEntry = timer.activeEntry;

  if (!activeEntry) {
    return <span className="text-sm text-white/42">No active timer</span>;
  }

  return (
    <TimerPill
      elapsedSeconds={timer.elapsedSeconds}
      title={activeEntry.status === "paused" ? "Timer paused" : "Timer running"}
    />
  );
}



function EditableTimerInfo({ timerNodeId }: { timerNodeId: number }) {
  const timer = useFocusNodeTimer({
    nodeId: timerNodeId,
    historyEnabled: false,
  });
  const activeEntry = timer.activeEntry;
  const disabled = timer.isTimerLoading || timer.timerActionPending;
  const isPaused = activeEntry?.status === "paused";

  if (!activeEntry) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={timer.onStartTimer}
        className="nodrag nopan rounded-full bg-emerald-400 px-4 py-1.5 text-sm font-semibold text-stone-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Start
      </button>
    );
  }

  return (
    <div className="nodrag nopan flex flex-nowrap items-center gap-1.5">
      <TimerPill
        compact
        elapsedSeconds={timer.elapsedSeconds}
        title={isPaused ? "Timer paused" : "Timer running"}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={isPaused ? timer.onResumeTimer : timer.onPauseTimer}
        className="shrink-0 rounded-full bg-amber-300 px-2.5 py-1 text-xs font-semibold text-stone-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPaused ? "Resume" : "Pause"}
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={timer.onEndTimer}
        className="shrink-0 rounded-full bg-rose-500 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        End
      </button>
    </div>
  );
}



function NodeInfoRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-white/[0.08] bg-white/[0.035] px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/38">
        {label}
      </div>
      <div className="mt-1.5 min-h-6 text-sm text-white/78">{children}</div>
    </div>
  );
}



function StatusPill({ status }: { status: FocusNodeStatus }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold"
      style={{
        color: FOCUS_NODE_STATUS_COLORS[status],
        borderColor: `${FOCUS_NODE_STATUS_COLORS[status]}80`,
        backgroundColor: `${FOCUS_NODE_STATUS_COLORS[status]}20`,
      }}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: FOCUS_NODE_STATUS_COLORS[status] }}
        aria-hidden
      />
      {FOCUS_NODE_STATUS_LABELS[status]}
    </span>
  );
}



function TagsPreview({ tags }: { tags: FocusConstellationHoveredNodeInfo["tags"] }) {
  if (tags.length === 0) {
    return <span className="text-white/42">No tags</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <FocusTagPill key={tag.id} tag={tag} />
      ))}
    </div>
  );
}



function NodeInfoNotesEditor({
  id,
  value,
  placeholder,
  onChange,
  onFocus,
  onBlur,
  onPointerDown,
  onClick,
}: {
  id: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onPointerDown: (event: React.PointerEvent<HTMLTextAreaElement>) => void;
  onClick: (event: React.MouseEvent<HTMLTextAreaElement>) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const syncHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = "0px";
    const contentHeight = textarea.scrollHeight;
    const nextHeight = Math.min(
      Math.max(contentHeight, 104),
      FOCUS_CONSTELLATION_NODE_INFO_NOTES_MAX_HEIGHT_PX,
    );
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY =
      contentHeight > FOCUS_CONSTELLATION_NODE_INFO_NOTES_MAX_HEIGHT_PX ? "auto" : "hidden";
  }, []);

  useLayoutEffect(() => {
    syncHeight();
  }, [syncHeight, value]);

  return (
    <textarea
      ref={textareaRef}
      id={id}
      value={value}
      rows={4}
      placeholder={placeholder}
      className="block w-full resize-none bg-transparent text-sm leading-relaxed text-white/78 outline-none placeholder:text-white/35"
      onChange={(event) => {
        onChange(event.target.value);
        syncHeight();
      }}
      onFocus={onFocus}
      onBlur={onBlur}
      onPointerDown={onPointerDown}
      onClick={onClick}
    />
  );
}



function NodeInfoTitleEditor({
  id,
  value,
  onSave,
}: {
  id: string;
  value: string;
  onSave: (title: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commitTitle = useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed) {
      setDraft(value);
      return;
    }
    if (trimmed === value) {
      setDraft(trimmed);
      return;
    }
    void onSave(trimmed);
  }, [draft, onSave, value]);

  return (
    <input
      id={id}
      type="text"
      value={draft}
      aria-label="Node title"
      className="block w-full min-w-0 truncate rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-semibold text-white/88 outline-none transition placeholder:text-white/35 hover:border-white/10 hover:bg-white/[0.03] focus:border-violet-300/35 focus:bg-violet-500/[0.08] focus:text-white"
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commitTitle}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.currentTarget.blur();
        }
        if (event.key === "Escape") {
          setDraft(value);
          event.currentTarget.blur();
        }
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
      onClick={(event) => {
        event.stopPropagation();
      }}
    />
  );
}



function ReadOnlyNodeInfoBody({
  title,
  notes,
  status,
  workOrder,
  tags,
  timerNodeId,
  referenceTargetType,
  referenceTargetId,
  referenceIsMissing,
}: FocusConstellationHoveredNodeInfo) {
  const showReferenceLink = isFocusRecordReference(referenceTargetType, referenceTargetId);

  return (
    <div
      className="space-y-4"
      role="status"
      aria-live="polite"
      aria-label={`Node info for ${title}`}
    >
      <div className="min-w-0">
        <h3 className="truncate text-sm font-semibold text-white/88">{title}</h3>
      </div>

      <div className="grid gap-3">
        {showReferenceLink ? (
          <div className={FOCUS_CONSTELLATION_NODE_INFO_TIMER_RECORD_GRID_CLASS}>
            <NodeInfoRow label="Timer">
              <ReadOnlyTimerInfo timerNodeId={timerNodeId} />
            </NodeInfoRow>
            <NodeInfoRow label="Record">
              <FocusReferenceRecordLink
                variant="panel"
                className="w-full"
                targetType={referenceTargetType!}
                targetId={referenceTargetId!}
                title={title}
                isMissing={referenceIsMissing}
              />
            </NodeInfoRow>
          </div>
        ) : (
          <NodeInfoRow label="Timer">
            <ReadOnlyTimerInfo timerNodeId={timerNodeId} />
          </NodeInfoRow>
        )}

        <div className="grid gap-2 sm:grid-cols-2">
          <NodeInfoRow label="Status">
            <StatusPill status={status} />
          </NodeInfoRow>
          <NodeInfoRow label="Work order">
            {workOrder === null ? (
              <span className="text-white/42">None</span>
            ) : (
              <span className="font-mono text-white/82">#{workOrder}</span>
            )}
          </NodeInfoRow>
        </div>

        <NodeInfoRow label="Tags">
          <TagsPreview tags={tags} />
        </NodeInfoRow>

        <NodeInfoRow label="Notes">
          <div className={FOCUS_CONSTELLATION_NODE_INFO_NOTES_MIN_HEIGHT_CLASS}>
            {notes.trim().length > 0 ? (
              <p className="whitespace-pre-wrap leading-relaxed text-white/72">{notes.trim()}</p>
            ) : (
              <span className="text-white/42">No notes</span>
            )}
          </div>
        </NodeInfoRow>
      </div>
    </div>
  );
}



function FocusConstellationMediaContentToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-white/86">Show media content</p>
        <p className="mt-0.5 text-xs text-white/42">
          {checked ? "Embedded preview in node" : "Title only in node"}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label="Show media content in node"
        onClick={() => onChange(!checked)}
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
        className={[
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-all duration-300 ease-out",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300/50",
          "ring-1 ring-inset",
          checked
            ? "bg-emerald-600/90 ring-emerald-300/30 shadow-[0_0_14px_rgba(16,185,129,0.35)]"
            : "bg-white/10 ring-white/15 hover:bg-white/14",
        ].join(" ")}
      >
        <span
          aria-hidden
          className={[
            "block h-6 w-6 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.08)] transition-transform duration-300 ease-out",
            checked ? "translate-x-5" : "translate-x-0",
          ].join(" ")}
        />
      </button>
    </div>
  );
}



function EditableNodeInfoBody({
  selectedNode,
  onSaveTitle,
  onSaveNotes,
  onSaveWorkOrder,
  onSaveStatus,
  onSaveTags,
  onSaveShowReferenceContent,
  panelRef,
}: {
  selectedNode: FocusConstellationFlowNode;
  onSaveTitle: (nodeId: number, title: string) => Promise<void>;
  onSaveNotes: (nodeId: number, notes: string) => Promise<void>;
  onSaveWorkOrder: (nodeId: number, workOrder: number | null) => Promise<void>;
  onSaveStatus: (nodeId: number, status: FocusNodeStatus) => Promise<void>;
  onSaveTags: (nodeId: number, tagIds: number[]) => Promise<void>;
  onSaveShowReferenceContent: (
    nodeId: number,
    showReferenceContent: boolean,
  ) => Promise<void>;
  panelRef: RefObject<HTMLDivElement | null>;
}) {
  const nodeId = selectedNode.data.entityId;
  const { draft, setDraft, setIsFocused, handleBlur } = useFocusConstellationNodeNotesEditor({
    selectedNode,
    onSaveNotes,
    panelRef,
  });
  const [workOrderDraft, setWorkOrderDraft] = useState(selectedNode.data.workOrder);
  const [statusDraft, setStatusDraft] = useState(selectedNode.data.status);
  const [tagIdsDraft, setTagIdsDraft] = useState(() =>
    selectedNode.data.tags.map((tag) => tag.id),
  );
  const [showReferenceContentDraft, setShowReferenceContentDraft] = useState(
    selectedNode.data.showReferenceContent,
  );

  useEffect(() => {
    setWorkOrderDraft(selectedNode.data.workOrder);
    setStatusDraft(selectedNode.data.status);
    setTagIdsDraft(selectedNode.data.tags.map((tag) => tag.id));
    setShowReferenceContentDraft(selectedNode.data.showReferenceContent);
  }, [
    selectedNode.data.showReferenceContent,
    selectedNode.data.status,
    selectedNode.data.tags,
    selectedNode.data.workOrder,
  ]);

  const saveWorkOrder = useCallback(() => {
    if (workOrderDraft === selectedNode.data.workOrder) {
      return;
    }
    void onSaveWorkOrder(nodeId, workOrderDraft);
  }, [nodeId, onSaveWorkOrder, selectedNode.data.workOrder, workOrderDraft]);

  const handleTagsChange = useCallback(
    (tagIds: number[]) => {
      setTagIdsDraft(tagIds);
      void onSaveTags(nodeId, tagIds);
    },
    [nodeId, onSaveTags],
  );

  const showReferenceLink = isFocusRecordReference(
    selectedNode.data.referenceTargetType,
    selectedNode.data.referenceTargetId,
  );
  const isMediaObjectReference = selectedNode.data.referenceTargetType === "media_object";

  return (
    <div className="nodrag nopan space-y-4">
      <div className="min-w-0">
        <NodeInfoTitleEditor
          id={`focus-constellation-title-${selectedNode.id}`}
          value={selectedNode.data.title}
          onSave={(title) => onSaveTitle(nodeId, title)}
        />
      </div>

      <div className="grid gap-3">
        {showReferenceLink ? (
          <div className={FOCUS_CONSTELLATION_NODE_INFO_TIMER_RECORD_GRID_CLASS}>
            <NodeInfoRow label="Timer">
              <EditableTimerInfo timerNodeId={selectedNode.data.timerNodeId} />
            </NodeInfoRow>
            <NodeInfoRow label="Record">
              <FocusReferenceRecordLink
                variant="panel"
                className="w-full"
                targetType={selectedNode.data.referenceTargetType!}
                targetId={selectedNode.data.referenceTargetId!}
                title={selectedNode.data.title}
                isMissing={selectedNode.data.referenceIsMissing}
              />
            </NodeInfoRow>
          </div>
        ) : (
          <NodeInfoRow label="Timer">
            <EditableTimerInfo timerNodeId={selectedNode.data.timerNodeId} />
          </NodeInfoRow>
        )}

        {isMediaObjectReference ? (
          <NodeInfoRow label="Display">
            <FocusConstellationMediaContentToggle
              checked={showReferenceContentDraft}
              onChange={(next) => {
                setShowReferenceContentDraft(next);
                void onSaveShowReferenceContent(nodeId, next);
              }}
            />
          </NodeInfoRow>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-2">
          <NodeInfoRow label="Status">
            <FocusNodeStatusSelect
              id={`focus-constellation-status-${selectedNode.id}`}
              value={statusDraft}
              onChange={(status) => {
                setStatusDraft(status);
                void onSaveStatus(nodeId, status);
              }}
              selectClassName="w-full"
            />
          </NodeInfoRow>
          <NodeInfoRow label="Work order">
            <FocusWorkOrderInput
              id={`focus-constellation-work-order-${selectedNode.id}`}
              value={workOrderDraft}
              onChange={setWorkOrderDraft}
              onBlur={saveWorkOrder}
              className="w-full"
            />
          </NodeInfoRow>
        </div>

        <NodeInfoRow label="Tags">
          <FocusListTagSelect
            selectedTagIds={tagIdsDraft}
            onChange={handleTagsChange}
            hideManageButton
            hideLabel
          />
        </NodeInfoRow>

        <NodeInfoRow label="Notes">
          <label className="sr-only" htmlFor="focus-constellation-notes-editor">
            Notes for {selectedNode.data.title}
          </label>
          <div className={FOCUS_CONSTELLATION_NODE_INFO_NOTES_MIN_HEIGHT_CLASS}>
            <NodeInfoNotesEditor
              id="focus-constellation-notes-editor"
              value={draft}
              placeholder="Add notes…"
              onChange={setDraft}
              onFocus={() => {
                setIsFocused(true);
              }}
              onBlur={handleBlur}
              onPointerDown={(event) => {
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.stopPropagation();
              }}
            />
          </div>
        </NodeInfoRow>
      </div>
    </div>
  );
}



export function FocusConstellationNodeNotesPreview({
  enabled,
  nodes,
  selectedNodeIds,
  position,
  onPositionChange,
  onSaveNotes,
  onSaveWorkOrder,
  onSaveStatus,
  onSaveTitle,
  onSaveTags,
  onSaveShowReferenceContent,
}: FocusConstellationNodeNotesPreviewProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const { hoveredNodeInfo } = useFocusConstellationNodeHover();
  const selectedNode = useMemo(
    () => resolveSingleSelectedNode(nodes, selectedNodeIds),
    [nodes, selectedNodeIds],
  );

  if (!enabled) {
    return null;
  }

  if (selectedNode) {
    return (
      <FocusConstellationNotesPanelShell
        position={position}
        onPositionChange={onPositionChange}
        panelRef={panelRef}
        editable
      >
        <EditableNodeInfoBody
          key={selectedNode.id}
          selectedNode={selectedNode}
          onSaveTitle={onSaveTitle}
          onSaveNotes={onSaveNotes}
          onSaveWorkOrder={onSaveWorkOrder}
          onSaveStatus={onSaveStatus}
          onSaveTags={onSaveTags}
          onSaveShowReferenceContent={onSaveShowReferenceContent}
          panelRef={panelRef}
        />
      </FocusConstellationNotesPanelShell>
    );
  }

  if (!hoveredNodeInfo) {
    return null;
  }

  return (
    <FocusConstellationNotesPanelShell position={position} onPositionChange={onPositionChange}>
      <ReadOnlyNodeInfoBody {...hoveredNodeInfo} />
    </FocusConstellationNotesPanelShell>
  );
}
