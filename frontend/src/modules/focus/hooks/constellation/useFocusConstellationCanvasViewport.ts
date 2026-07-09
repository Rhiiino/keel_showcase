// keel_web/src/modules/focus/hooks/constellation/useFocusConstellationCanvasViewport.ts

import { useReactFlow, type Viewport } from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { computeBoundsFitCamera, computeOriginFitZoom } from "../../lib/constellation/layout";
import { resolveCanvasNodeIdForFocusNode } from "../../lib/automation/panToNode";
import type { FocusConstellationRenderGraph } from "../../components/constellation/canvas";



// ----- Viewport persistence
export function useFocusConstellationCanvasViewport({
  renderGraph,
  initialViewport,
  persistViewport,
  layoutNodesForRender = [],
}: {
  renderGraph: FocusConstellationRenderGraph;
  initialViewport: Viewport | null;
  persistViewport: (viewport: Viewport) => void;
  layoutNodesForRender?: import("../../lib/constellation/graph").ConstellationLayoutNode[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cameraInitializedRef = useRef(false);
  const viewportSaveEnabledRef = useRef(false);
  const latestViewportRef = useRef<Viewport | null>(initialViewport);
  const { getViewport, setCenter, setViewport } = useReactFlow();

  const enableViewportPersistence = useCallback(() => {
    latestViewportRef.current = getViewport();
    viewportSaveEnabledRef.current = true;
  }, [getViewport]);

  const initializeCamera = useCallback(() => {
    if (cameraInitializedRef.current) {
      return;
    }

    const container = containerRef.current;
    if (!container || renderGraph.layoutNodes.length === 0) {
      return;
    }

    const { width, height } = container.getBoundingClientRect();
    if (width <= 0 || height <= 0) {
      return;
    }

    cameraInitializedRef.current = true;

    if (initialViewport) {
      latestViewportRef.current = initialViewport;
      void setViewport(initialViewport, { duration: 0 });
      requestAnimationFrame(() => {
        enableViewportPersistence();
      });
      return;
    }

    const zoom = computeOriginFitZoom(
      renderGraph.layoutNodes.map((node) => node.position),
      width,
      height,
    );
    void setCenter(0, 0, { zoom, duration: 0 });
    requestAnimationFrame(() => {
      enableViewportPersistence();
    });
  }, [
    enableViewportPersistence,
    initialViewport,
    renderGraph.layoutNodes,
    setCenter,
    setViewport,
  ]);

  useEffect(() => {
    if (renderGraph.layoutNodes.length > 0) {
      initializeCamera();
    }
  }, [initializeCamera, renderGraph.layoutNodes.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const observer = new ResizeObserver(() => {
      if (!cameraInitializedRef.current) {
        initializeCamera();
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [initializeCamera]);

  useEffect(() => {
    return () => {
      const viewport = latestViewportRef.current ?? getViewport();
      if (viewportSaveEnabledRef.current) {
        persistViewport(viewport);
      }
    };
  }, [getViewport, persistViewport]);

  const onMoveEnd = useCallback(
    (_event: unknown, viewport: Viewport) => {
      latestViewportRef.current = viewport;
      if (viewportSaveEnabledRef.current) {
        persistViewport(viewport);
      }
    },
    [persistViewport],
  );

  const resolvedInitialViewport = useMemo(
    () => initialViewport ?? { x: 0, y: 0, zoom: 1 },
    [initialViewport],
  );

  const frameFocusNodeIds = useCallback(
    (nodeIds: number[]) => {
      const positions = nodeIds
        .map((nodeId) => {
          const flowNodeId = resolveCanvasNodeIdForFocusNode(
            nodeId,
            layoutNodesForRender,
          );
          if (!flowNodeId) {
            return null;
          }
          const layoutNode = layoutNodesForRender.find((node) => node.id === flowNodeId);
          return layoutNode?.position ?? null;
        })
        .filter((position): position is NonNullable<typeof position> => position !== null);

      if (positions.length === 0) {
        return;
      }

      const container = containerRef.current;
      if (!container) {
        return;
      }

      const { width, height } = container.getBoundingClientRect();
      if (positions.length === 1) {
        const currentZoom = getViewport().zoom;
        void setCenter(positions[0].x, positions[0].y, {
          zoom: currentZoom,
          duration: 350,
        });
        return;
      }

      const camera = computeBoundsFitCamera(positions, width, height);
      if (!camera) {
        return;
      }

      void setCenter(camera.center.x, camera.center.y, {
        zoom: camera.zoom,
        duration: 450,
      });
    },
    [getViewport, layoutNodesForRender, setCenter],
  );

  const panToFocusNodeId = useCallback(
    (nodeId: number) => {
      frameFocusNodeIds([nodeId]);
    },
    [frameFocusNodeIds],
  );

  return {
    containerRef,
    initializeCamera,
    onMoveEnd,
    resolvedInitialViewport,
    panToFocusNodeId,
    frameFocusNodeIds,
  };
}
