// keel_web/src/modules/coak/components/modals/CoakConstellationItemEditorFrame.tsx

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type PointerEvent,
} from "react";

import { useCoakRecordWorkspace } from "../../../../context/CoakRecordWorkspaceContext";
import {
  clampCoakItemEditorAnchor,
  COAK_ITEM_EDITOR_STACK_BASE_Z_INDEX,
  COAK_ITEM_EDITOR_STACK_HOVER_Z_INDEX,
  resolveCoakItemEditorInteractionScaleBoost,
  type CoakItemEditorAnchor,
} from "../../../../lib/tabs/constellation/coakItemEditorAnchor";
import { isCoakItemEditorInteractiveTarget } from "../../../../lib/tabs/constellation/coakItemEditorDrag";
import { CoakItemEditorModal } from "./CoakItemEditorModal";

const MODAL_WIDTH = 272;
const MODAL_HEIGHT_FALLBACK = 220;

type CoakConstellationItemEditorFrameProps = {
  nodeId: string;
  anchor: CoakItemEditorAnchor | null;
  open: boolean;
  bounds: { width: number; height: number };
  onExitComplete: () => void;
};

export function CoakConstellationItemEditorFrame({
  nodeId,
  anchor,
  open,
  bounds,
  onExitComplete,
}: CoakConstellationItemEditorFrameProps) {
  const { beginItemEditorNodeDrag, autoOptimizeLayoutEnabled, constellationNodeDragActive, itemEditorEnlargeEnabled } =
    useCoakRecordWorkspace();
  const modalShellRef = useRef<HTMLDivElement>(null);
  const [modalSize, setModalSize] = useState({
    width: MODAL_WIDTH,
    height: MODAL_HEIGHT_FALLBACK,
  });
  const [presentedNodeId, setPresentedNodeId] = useState<string | null>(null);
  const [frameOpen, setFrameOpen] = useState(false);
  const [frozenAnchor, setFrozenAnchor] = useState<CoakItemEditorAnchor | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (open) {
      setPresentedNodeId(nodeId);
      setFrameOpen(true);
      return;
    }
    setFrameOpen(false);
    setIsHovered(false);
    setIsEditing(false);
  }, [nodeId, open]);

  useEffect(() => {
    if (anchor) {
      setFrozenAnchor(anchor);
    }
  }, [anchor]);

  useLayoutEffect(() => {
    const element = modalShellRef.current;
    if (!element) {
      return;
    }

    const measure = () => {
      setModalSize({
        width: Math.max(element.offsetWidth, MODAL_WIDTH),
        height: Math.max(element.offsetHeight, MODAL_HEIGHT_FALLBACK),
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [frameOpen, presentedNodeId]);

  const activeAnchor = open ? anchor : frozenAnchor;
  const interactionBoost = itemEditorEnlargeEnabled
    ? resolveCoakItemEditorInteractionScaleBoost(isHovered, isEditing)
    : 1;

  const clampedAnchor = useMemo((): CoakItemEditorAnchor | null => {
    if (!activeAnchor) {
      return null;
    }

    const boostedAnchor: CoakItemEditorAnchor = {
      ...activeAnchor,
      scale: activeAnchor.scale * interactionBoost,
    };

    if (bounds.width <= 0 || bounds.height <= 0) {
      return boostedAnchor;
    }

    return clampCoakItemEditorAnchor(boostedAnchor, bounds, modalSize);
  }, [activeAnchor, bounds.height, bounds.width, interactionBoost, modalSize]);

  const visible = presentedNodeId != null && clampedAnchor != null;
  const isElevated = isHovered || isEditing;

  const handleFocusCapture = (event: FocusEvent<HTMLDivElement>) => {
    if (isCoakItemEditorInteractiveTarget(event.target)) {
      setIsEditing(true);
    }
  };

  const handleBlurCapture = (event: FocusEvent<HTMLDivElement>) => {
    const relatedTarget = event.relatedTarget;
    if (
      relatedTarget instanceof Node &&
      event.currentTarget.contains(relatedTarget) &&
      isCoakItemEditorInteractiveTarget(relatedTarget)
    ) {
      return;
    }

    setIsEditing(false);
  };

  const handlePointerDownCapture = (event: PointerEvent<HTMLDivElement>) => {
    if (autoOptimizeLayoutEnabled) {
      return;
    }

    if (event.button !== 0 || isCoakItemEditorInteractiveTarget(event.target)) {
      return;
    }

    event.preventDefault();
    beginItemEditorNodeDrag({
      nodeId: presentedNodeId ?? nodeId,
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
    });
  };

  const handleModalExitComplete = useCallback(() => {
    if (!open) {
      onExitComplete();
    }
  }, [onExitComplete, open]);

  if (!visible || !presentedNodeId || !clampedAnchor) {
    return null;
  }

  return (
    <div
      ref={modalShellRef}
      className={[
        "pointer-events-auto absolute",
        autoOptimizeLayoutEnabled
          ? "cursor-default"
          : constellationNodeDragActive
            ? "cursor-grabbing"
            : "cursor-grab",
      ].join(" ")}
      style={{
        left: clampedAnchor.x,
        top: clampedAnchor.y,
        width: MODAL_WIDTH,
        zIndex: isElevated
          ? COAK_ITEM_EDITOR_STACK_HOVER_Z_INDEX
          : COAK_ITEM_EDITOR_STACK_BASE_Z_INDEX,
        transform: `translate(-50%, -50%) scale(${clampedAnchor.scale})`,
        transformOrigin: "center center",
        transition: "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      onFocusCapture={handleFocusCapture}
      onBlurCapture={handleBlurCapture}
      onPointerDownCapture={handlePointerDownCapture}
    >
      <CoakItemEditorModal
        key={presentedNodeId}
        nodeId={presentedNodeId}
        open={frameOpen}
        onExitComplete={handleModalExitComplete}
        portalFilePickerDialogs
      />
    </div>
  );
}
