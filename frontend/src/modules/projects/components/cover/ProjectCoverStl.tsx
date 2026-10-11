// stack_sandbox/frontend_web/src/modules/projects/components/cover/ProjectCoverStl.tsx

// Revolving STL preview for Kanban cards when a 3D model is the project cover.

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { parseStlBuffer } from "../../../../lib/stl-viewer";
import {
  CARD_STL_VIEWER_OPTIONS,
  createPlaceholderGeometry,
  createStlViewerRuntime,
  deferUntilWebGLSafe,
  type StlViewerDisplayOptions,
  type StlViewerRuntime,
} from "../../../../lib/stl-viewer";
import { fetchProjectMediaBlob, projectsQueryKeys } from "../../api";
import {
  resolveCoverModelBrightness,
  resolveCoverModelColor,
} from "../../lib/project/appearance";

type ProjectCoverStlProps = {
  projectId: number;
  coverMediaId: string;
  coverUpdatedAt: string | null;
  fallback: ReactNode;
  /** When true, loading/background chrome is omitted (detail hero). */
  bare?: boolean;
  viewerOptions?: StlViewerDisplayOptions;
  modelColorHex?: string | null;
  modelBrightness?: number | null;
  className?: string;
  /** When true, the WebGL canvas ignores pointer events (e.g. workspace resize handles). */
  passThroughPointerEvents?: boolean;
};

export function ProjectCoverStl({
  projectId,
  coverMediaId,
  coverUpdatedAt,
  fallback,
  bare = false,
  viewerOptions = CARD_STL_VIEWER_OPTIONS,
  modelColorHex = null,
  modelBrightness = null,
  className,
  passThroughPointerEvents = false,
}: ProjectCoverStlProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runtimeRef = useRef<StlViewerRuntime | null>(null);
  const modelColorRef = useRef(resolveCoverModelColor(modelColorHex));
  const modelBrightnessRef = useRef(resolveCoverModelBrightness(modelBrightness));
  const resolvedModelColor = resolveCoverModelColor(modelColorHex);
  const resolvedModelBrightness = resolveCoverModelBrightness(modelBrightness);
  const [runtimeReady, setRuntimeReady] = useState(false);

  modelColorRef.current = resolvedModelColor;
  modelBrightnessRef.current = resolvedModelBrightness;

  const stlQuery = useQuery({
    queryKey: projectsQueryKeys.mediaStlGeometry(projectId, coverMediaId),
    queryFn: async () => {
      const blob = await fetchProjectMediaBlob(projectId, coverMediaId);
      const buffer = await blob.arrayBuffer();
      return parseStlBuffer(buffer);
    },
    staleTime: Infinity,
    gcTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas || !stlQuery.data || stlQuery.isError) {
      return;
    }

    let cancelled = false;
    let runtime: StlViewerRuntime | null = null;

    const cancelDefer = deferUntilWebGLSafe(() => {
      if (cancelled) {
        return;
      }

      void createStlViewerRuntime(
        canvas,
        container,
        stlQuery.data ?? createPlaceholderGeometry(),
        viewerOptions,
      )
        .then((instance) => {
          if (cancelled) {
            instance.dispose();
            return;
          }
          runtime = instance;
          runtimeRef.current = instance;
          instance.setModelColor(modelColorRef.current);
          instance.setModelBrightness(modelBrightnessRef.current);
          setRuntimeReady(true);
        })
        .catch(() => {
          // Fall back to static placeholder; error state handled below.
        });
    });

    return () => {
      cancelled = true;
      cancelDefer();
      setRuntimeReady(false);
      runtimeRef.current?.dispose();
      runtimeRef.current = null;
      runtime?.dispose();
    };
  }, [stlQuery.data, stlQuery.isError, coverUpdatedAt, viewerOptions]);

  useEffect(() => {
    if (!runtimeReady || !runtimeRef.current) {
      return;
    }
    runtimeRef.current.setModelColor(resolvedModelColor);
    runtimeRef.current.setModelBrightness(resolvedModelBrightness);
  }, [resolvedModelColor, resolvedModelBrightness, runtimeReady]);

  if (stlQuery.isLoading) {
    if (bare) {
      return (
        <div
          ref={containerRef}
          className={[
            "h-full w-full",
            passThroughPointerEvents ? "pointer-events-none" : "",
          ].join(" ")}
          aria-hidden
        />
      );
    }

    return (
      <div
        ref={containerRef}
        className="h-full w-full animate-pulse bg-gradient-to-br from-stone-800 via-stone-900 to-stone-950"
        aria-hidden
      />
    );
  }

  if (stlQuery.isError) {
    return <>{fallback}</>;
  }

  return (
    <div
      ref={containerRef}
      className={[
        "relative h-full w-full overflow-hidden",
        passThroughPointerEvents ? "pointer-events-none" : "",
        className ?? "",
      ].join(" ")}
    >
      {!runtimeReady && !bare && (
        <div
          className="absolute inset-0 bg-gradient-to-br from-stone-800 via-stone-900 to-stone-950"
          aria-hidden
        />
      )}
      {!runtimeReady && bare && (
        <div className="absolute inset-0" aria-hidden />
      )}
      <canvas
        ref={canvasRef}
        className={[
          "absolute inset-0 h-full w-full bg-transparent transition-opacity duration-150",
          passThroughPointerEvents ? "pointer-events-none" : "",
          runtimeReady ? "opacity-100" : "opacity-0",
        ].join(" ")}
      />
    </div>
  );
}
