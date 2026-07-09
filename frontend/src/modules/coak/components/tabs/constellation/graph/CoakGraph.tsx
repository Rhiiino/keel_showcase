// keel_web/src/modules/coak/components/graph/CoakGraph.tsx

import { useCallback, useEffect, useMemo, useRef } from "react";
import { OrbitControls } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import { COAK_ORIGIN_NODE_ID } from "../../../../api";
import { useCoakRecordWorkspace } from "../../../../context/CoakRecordWorkspaceContext";
import { useOptionalCoakConstellationGraphReadyContext } from "../CoakConstellationGraphReadyContext";
import {
  computeCoakConstellationOrbitAngles,
  lerpAngle,
} from "../../../../lib/tabs/constellation/coakConstellationCamera";
import { trimCoakConnectionEndpoints } from "../../../../lib/tabs/constellation/coakConnectionEndpoints";
import { resolveCoakConnectionColorHex } from "../../../../lib/tabs/settings/coakConnectionSettings";
import { readCoakConnectionWidth } from "../../../../lib/tabs/settings/coakConnectionWidthSettings";
import { readCoakOriginPulseEnabled } from "../../../../lib/tabs/settings/coakOriginPulseSettings";
import {
  COAK_CAMERA_MAX_DISTANCE,
  COAK_CAMERA_MIN_DISTANCE,
} from "../../../../lib/tabs/constellation/coakGraphConstants";
import { computeCoakOriginPulseDistances } from "../../../../lib/tabs/constellation/coakOriginPulse";
import { CoakChildRevolveRails } from "./CoakChildRevolveRails";
import { CoakNodeRevolveAnimation } from "./CoakNodeRevolveAnimation";
import { CoakConnectionLine } from "./CoakConnectionLine";
import { CoakDraggableNode } from "./CoakDraggableNode";
import { CoakItemEditorNodeDragBridge } from "./CoakItemEditorNodeDragBridge";
import { CoakNodeScreenAnchor } from "./CoakNodeScreenAnchor";
import { CoakOriginNode } from "./CoakOriginNode";

const ORIGIN_POSITION: [number, number, number] = [0, 0, 0];
const CONSTELLATION_ORBIT_LERP = 10;
const CONSTELLATION_ORBIT_ANGLE_EPSILON = 0.002;

export function CoakGraph() {
  const {
    record,
    recordId,
    graphNodes,
    configurationSettings,
    autoOptimizeLayoutEnabled,
    constellationOrbitRequest,
    itemEditorNodeIds,
    persistentNodeModalsEnabled,
    isNodePinned,
    constellationNodeDragActive,
    childRevolveDragActive,
    setConstellationNodeDragActive,
    resolveNodePosition,
    updateNodePosition,
    workspaceHydrated,
    workspaceCamera,
    setCamera,
    openItemEditor,
    openGraphNodeContextMenu,
    nodeMoveSession,
    isNodeMoveTarget,
    commitNodeMove,
    closeNodeMove,
    nodeSwapSession,
    isNodeSwapTarget,
    commitNodeSwap: _commitNodeSwap,
    closeNodeSwap,
    nodeSphereRadius,
    originNodeRadius,
  } = useCoakRecordWorkspace();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const orbitAnglesRef = useRef<{ azimuth: number; polar: number } | null>(null);
  const orbitingRef = useRef(false);
  const orbitTargetNodeIdRef = useRef<string | null>(null);
  const cameraHydratedRef = useRef(false);
  const graphPaintReportedRef = useRef(false);
  const graphReadyContext = useOptionalCoakConstellationGraphReadyContext();

  useEffect(() => {
    graphPaintReportedRef.current = false;
  }, [recordId]);

  useFrame(() => {
    if (graphPaintReportedRef.current || !graphReadyContext) {
      return;
    }

    graphPaintReportedRef.current = true;
    graphReadyContext.markGraphPainted();
  });

  const positionById = useMemo(() => {
    const map = new Map<string, [number, number, number]>();
    map.set(COAK_ORIGIN_NODE_ID, ORIGIN_POSITION);
    for (const node of graphNodes) {
      map.set(node.id, node.position);
    }
    return map;
  }, [graphNodes]);

  const handleActivateNode = useCallback(
    (nodeId: string, options?: { additive?: boolean }) => {
      if (options?.additive) {
        openItemEditor(nodeId, { replace: false, orbit: false });
        return;
      }

      openItemEditor(nodeId);
    },
    [openItemEditor],
  );

  const handleDragActiveChange = useCallback(
    (active: boolean) => {
      setConstellationNodeDragActive(active);
    },
    [setConstellationNodeDragActive],
  );

  const pickModeActive = nodeMoveSession != null || nodeSwapSession != null;

  const anchorNodeIds = useMemo(() => {
    const candidateIds = persistentNodeModalsEnabled
      ? graphNodes.map((node) => node.id)
      : itemEditorNodeIds;
    const floatingEditorIds = new Set(itemEditorNodeIds);
    return candidateIds.filter(
      (nodeId) => !isNodePinned(nodeId) || floatingEditorIds.has(nodeId),
    );
  }, [graphNodes, isNodePinned, itemEditorNodeIds, persistentNodeModalsEnabled]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) {
      return;
    }

    controls.enabled =
      !constellationNodeDragActive && !childRevolveDragActive && !pickModeActive;
  }, [childRevolveDragActive, constellationNodeDragActive, pickModeActive]);

  const handleOriginContextMenu = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      event.nativeEvent.preventDefault();
      openGraphNodeContextMenu(COAK_ORIGIN_NODE_ID, event.clientX, event.clientY);
    },
    [openGraphNodeContextMenu],
  );

  const handleOriginPointerDown = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (event.button !== 0) {
        return;
      }

      if (nodeMoveSession) {
        event.stopPropagation();
        event.nativeEvent.preventDefault();

        if (isNodeMoveTarget(COAK_ORIGIN_NODE_ID)) {
          void commitNodeMove(COAK_ORIGIN_NODE_ID);
        } else {
          closeNodeMove();
        }
        return;
      }

      if (nodeSwapSession) {
        event.stopPropagation();
        event.nativeEvent.preventDefault();
        closeNodeSwap();
      }
    },
    [
      closeNodeMove,
      closeNodeSwap,
      commitNodeMove,
      isNodeMoveTarget,
      nodeMoveSession,
      nodeSwapSession,
    ],
  );

  useEffect(() => {
    if (!constellationOrbitRequest) {
      orbitingRef.current = false;
      orbitAnglesRef.current = null;
      orbitTargetNodeIdRef.current = null;
      return;
    }

    orbitTargetNodeIdRef.current = constellationOrbitRequest.nodeId;
    orbitAnglesRef.current = computeCoakConstellationOrbitAngles(
      resolveNodePosition(constellationOrbitRequest.nodeId),
    );
    orbitingRef.current = true;
  }, [constellationOrbitRequest, resolveNodePosition]);

  useEffect(() => {
    if (!workspaceCamera || cameraHydratedRef.current || !workspaceHydrated) {
      return;
    }

    let cancelled = false;

    const applyCamera = () => {
      if (cancelled || cameraHydratedRef.current) {
        return;
      }

      const controls = controlsRef.current;
      if (!controls) {
        return;
      }

      controls.setAzimuthalAngle(workspaceCamera.azimuth_angle);
      controls.setPolarAngle(workspaceCamera.polar_angle);
      controls.minDistance = workspaceCamera.distance;
      controls.maxDistance = workspaceCamera.distance;
      controls.update();
      controls.minDistance = COAK_CAMERA_MIN_DISTANCE;
      controls.maxDistance = COAK_CAMERA_MAX_DISTANCE;
      cameraHydratedRef.current = true;
    };

    applyCamera();
    if (cameraHydratedRef.current) {
      return;
    }

    const frame = window.requestAnimationFrame(applyCamera);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [workspaceCamera, workspaceHydrated]);

  const handleControlsChange = useCallback(() => {
    const controls = controlsRef.current;
    if (!controls || orbitingRef.current || !workspaceHydrated) {
      return;
    }

    setCamera({
      distance: controls.getDistance(),
      polar_angle: controls.getPolarAngle(),
      azimuth_angle: controls.getAzimuthalAngle(),
    });
  }, [setCamera, workspaceHydrated]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    const targetAngles = orbitAnglesRef.current;
    if (!controls || !targetAngles || !orbitingRef.current) {
      return;
    }

    if (itemEditorNodeIds.length > 1) {
      orbitingRef.current = false;
      orbitAnglesRef.current = null;
      orbitTargetNodeIdRef.current = null;
      return;
    }

    const alpha = 1 - Math.exp(-CONSTELLATION_ORBIT_LERP * delta);
    const nextAzimuth = lerpAngle(controls.getAzimuthalAngle(), targetAngles.azimuth, alpha);
    const nextPolar =
      controls.getPolarAngle() + (targetAngles.polar - controls.getPolarAngle()) * alpha;

    controls.setAzimuthalAngle(nextAzimuth);
    controls.setPolarAngle(nextPolar);
    controls.update();

    if (
      Math.abs(nextAzimuth - targetAngles.azimuth) < CONSTELLATION_ORBIT_ANGLE_EPSILON &&
      Math.abs(nextPolar - targetAngles.polar) < CONSTELLATION_ORBIT_ANGLE_EPSILON
    ) {
      controls.setAzimuthalAngle(targetAngles.azimuth);
      controls.setPolarAngle(targetAngles.polar);
      controls.update();
      orbitingRef.current = false;
      orbitAnglesRef.current = null;
      orbitTargetNodeIdRef.current = null;
    }
  });

  const originColor = record?.color_hex ?? "#FBBF24";
  const connectionColorHex = useMemo(
    () => resolveCoakConnectionColorHex(configurationSettings),
    [configurationSettings],
  );
  const connectionWidth = useMemo(
    () => readCoakConnectionWidth(configurationSettings),
    [configurationSettings],
  );
  const originPulseEnabled = useMemo(
    () => readCoakOriginPulseEnabled(configurationSettings),
    [configurationSettings],
  );

  const originPulseDistances = useMemo(
    () => computeCoakOriginPulseDistances(graphNodes, ORIGIN_POSITION),
    [graphNodes],
  );

  return (
    <>
      <CoakItemEditorNodeDragBridge />
      <CoakOriginNode
        radius={originNodeRadius}
        color={originColor}
        pulseEnabled={originPulseEnabled}
        isMoveTarget={isNodeMoveTarget(COAK_ORIGIN_NODE_ID)}
        onContextMenu={handleOriginContextMenu}
        onPointerDown={handleOriginPointerDown}
      />
      {graphNodes.map((node) => {
        const from = positionById.get(node.parentNodeId) ?? ORIGIN_POSITION;
        const to = node.position;
        const trimmed = trimCoakConnectionEndpoints(from, to, {
          fromTrimRadius:
            node.parentNodeId !== COAK_ORIGIN_NODE_ID ? nodeSphereRadius : 0,
          toTrimRadius: nodeSphereRadius,
        });
        const pulseFromDistance =
          originPulseDistances.nodeDistances.get(node.parentNodeId) ?? 0;
        const pulseToDistance = originPulseDistances.nodeDistances.get(node.id) ?? 0;

        return (
          <CoakConnectionLine
            key={`edge-${node.id}`}
            from={trimmed.from}
            to={trimmed.to}
            color={connectionColorHex}
            width={connectionWidth}
            pulseColor={originPulseEnabled ? originColor : undefined}
            pulseFromDistance={pulseFromDistance}
            pulseToDistance={pulseToDistance}
            pulseMaxDistance={
              originPulseEnabled ? originPulseDistances.maxTerminalDistance : 0
            }
          />
        );
      })}
      {graphNodes.map((node) => (
        <CoakDraggableNode
          key={node.id}
          id={node.id}
          kind={node.kind}
          label={node.label}
          tags={node.tags}
          position={node.position}
          radius={nodeSphereRadius}
          color={node.color}
          draggable={!autoOptimizeLayoutEnabled}
          isPickTarget={isNodeMoveTarget(node.id) || isNodeSwapTarget(node.id)}
          onPositionChange={updateNodePosition}
          onDragActiveChange={handleDragActiveChange}
          onActivate={handleActivateNode}
        />
      ))}
      {anchorNodeIds.map((nodeId) => (
        <CoakNodeScreenAnchor key={nodeId} nodeId={nodeId} />
      ))}
      <CoakChildRevolveRails />
      <CoakNodeRevolveAnimation />
      <OrbitControls
        ref={controlsRef}
        target={ORIGIN_POSITION}
        enableRotate
        enablePan={false}
        enableZoom
        minDistance={COAK_CAMERA_MIN_DISTANCE}
        maxDistance={COAK_CAMERA_MAX_DISTANCE}
        enabled={!constellationNodeDragActive && !childRevolveDragActive && !pickModeActive}
        onChange={handleControlsChange}
      />
    </>
  );
}
