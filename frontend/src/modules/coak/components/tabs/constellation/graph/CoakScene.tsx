// keel_web/src/modules/coak/components/tabs/constellation/graph/CoakScene.tsx

// Full-viewport Three.js scene: origin sphere, draggable child nodes, pan/tilt controls.

import { Canvas } from "@react-three/fiber";
import {
  Component,
  useCallback,
  useEffect,
  useState,
  type ErrorInfo,
  type ReactNode,
} from "react";

import {
  markWebGLUnavailable,
  webGLUnavailableMessage,
} from "../../../../../../lib/stl-viewer";
import { useCoakConstellationCanvasDismiss } from "../../../../hooks/tabs/constellation/useCoakConstellationCanvasDismiss";
import { useOptionalCoakConstellationGraphReadyContext } from "../CoakConstellationGraphReadyContext";
import { CoakAxisGizmo } from "./CoakAxisGizmo";
import { CoakGraph } from "./CoakGraph";
import { CoakGraphCanvasBackdrop } from "./CoakGraphCanvasBackdrop";

const COAK_SCENE_GL_OPTIONS = {
  alpha: true,
  antialias: false,
  failIfMajorPerformanceCaveat: false,
};

class CoakSceneCanvasErrorBoundary extends Component<
  { children: ReactNode; onError: (error: Error) => void },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[CoakScene] WebGL canvas failed", error, info.componentStack);
    this.props.onError(error);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }

    return this.props.children;
  }
}

function CoakSceneWebGLFallback() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center px-6">
      <div className="max-w-md rounded-lg border border-stone-700/80 bg-stone-950/80 px-4 py-3 text-center text-sm text-stone-400 shadow-lg backdrop-blur-sm">
        <p className="font-medium text-stone-200">Constellation graph unavailable</p>
        <p className="mt-2 text-xs leading-relaxed text-stone-500">{webGLUnavailableMessage()}</p>
        <p className="mt-3 text-xs text-stone-500">
          You can still use the Directory, Tags, and other workspace tabs.
        </p>
      </div>
    </div>
  );
}

function CoakSceneLighting() {
  return (
    <>
      <ambientLight intensity={0.42} />
      <directionalLight position={[4, 6, 5]} intensity={1.15} color="#f4ffe0" />
      <directionalLight position={[-5, 2, -4]} intensity={0.45} color="#94a3b8" />
      <pointLight position={[0, 2.5, 3]} intensity={0.55} color="#fde68a" />
    </>
  );
}

type CoakSceneProps = {
  suspendRender?: boolean;
};

export function CoakScene({ suspendRender = false }: CoakSceneProps) {
  const handleCanvasPointerDown = useCoakConstellationCanvasDismiss();
  const graphReadyContext = useOptionalCoakConstellationGraphReadyContext();
  const [canvasFailed, setCanvasFailed] = useState(false);

  const reportGraphReady = useCallback(() => {
    graphReadyContext?.markGraphPainted();
  }, [graphReadyContext]);

  const handleCanvasError = useCallback(
    (_error: Error) => {
      markWebGLUnavailable();
      setCanvasFailed(true);
      reportGraphReady();
    },
    [reportGraphReady],
  );

  useEffect(() => {
    if (canvasFailed) {
      reportGraphReady();
    }
  }, [canvasFailed, reportGraphReady]);

  if (canvasFailed) {
    return <CoakSceneWebGLFallback />;
  }

  return (
    <div className="absolute inset-0 z-10">
      <CoakSceneCanvasErrorBoundary onError={handleCanvasError}>
        <Canvas
          className="h-full w-full touch-none"
          frameloop={suspendRender ? "never" : "always"}
          gl={COAK_SCENE_GL_OPTIONS}
          style={{ background: "transparent" }}
          camera={{ position: [0, 0, 5], fov: 45 }}
          onPointerMissed={handleCanvasPointerDown}
          onContextMenu={(event) => event.preventDefault()}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
          }}
        >
          <CoakGraphCanvasBackdrop />
          <CoakSceneLighting />
          <CoakGraph />
          <CoakAxisGizmo />
        </Canvas>
      </CoakSceneCanvasErrorBoundary>
    </div>
  );
}
