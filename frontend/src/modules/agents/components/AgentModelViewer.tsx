// stack_sandbox/frontend_web/src/modules/agents/components/AgentModelViewer.tsx

// Transparent 3D GLB preview with slow Y-axis turntable rotation for the agent detail panel.

import { Bounds, Center, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ErrorInfo,
  type MutableRefObject,
  type PointerEvent,
  type ReactNode,
} from "react";
import type { Group, Object3D, SpotLight as SpotLightType } from "three";

import { deferUntilWebGLSafe, isWebGLAvailable } from "../../../lib/stl-viewer";
import { subagentModelGlowCssBackground } from "../lib/agentDisplay";
import { loadAgentModelBlobUrl } from "../lib/loadAgentModel";

const TURNTABLE_SPEED = 0.4;
const TURNTABLE_RAMP_START_SPEED = 9.6;
const TURNTABLE_RAMP_DURATION_S = 4.8;
/** Radians of Y rotation per horizontal pixel while dragging. */
const DRAG_ROTATION_PER_PX = 0.012;

type TurntableInteraction = {
  rotationY: number;
  dragging: boolean;
  dragStartX: number;
  dragStartRotation: number;
};

type LightingVariant = "default" | "dualSpotlight";

type AgentModelViewerProps = {
  agentId: string;
  src: string;
  /** Agent portrait shown until the GLB finishes loading. */
  placeholderSrc?: string;
  className?: string;
  lightingVariant?: LightingVariant;
  /** Fast initial spin that eases down to normal turntable speed (login entrance). */
  spinRamp?: boolean;
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function resolveTurntableSpeed(rampElapsedS: number, spinRamp: boolean): number {
  if (!spinRamp || rampElapsedS >= TURNTABLE_RAMP_DURATION_S) {
    return TURNTABLE_SPEED;
  }

  const progress = rampElapsedS / TURNTABLE_RAMP_DURATION_S;
  const eased = 1 - (1 - progress) ** 2.4;
  return (
    TURNTABLE_RAMP_START_SPEED +
    (TURNTABLE_SPEED - TURNTABLE_RAMP_START_SPEED) * eased
  );
}

function cloneSceneGraph(scene: Object3D): Object3D {
  const cloned = scene.clone(true);
  cloned.traverse((node) => {
    const mesh = node as Object3D & {
      material?: { clone: () => unknown } | Array<{ clone: () => unknown }>;
      isMesh?: boolean;
    };
    if (!mesh.isMesh || !mesh.material) {
      return;
    }
    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map((material) => material.clone()) as typeof mesh.material;
    } else {
      mesh.material = mesh.material.clone() as typeof mesh.material;
    }
  });
  return cloned;
}

function AgentModelScene({
  blobSrc,
  interactionRef,
  onReady,
  spinRamp = false,
}: {
  blobSrc: string;
  interactionRef: MutableRefObject<TurntableInteraction>;
  onReady: () => void;
  spinRamp?: boolean;
}) {
  const groupRef = useRef<Group>(null);
  const { scene } = useGLTF(blobSrc);
  const clonedScene = useMemo(() => cloneSceneGraph(scene), [scene]);
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);
  const rampStartedRef = useRef(false);
  const rampElapsedRef = useRef(0);

  useEffect(() => {
    rampStartedRef.current = false;
    rampElapsedRef.current = 0;
  }, [blobSrc, spinRamp]);

  useLayoutEffect(() => {
    rampStartedRef.current = true;
    rampElapsedRef.current = 0;
    onReady();
  }, [onReady, clonedScene, blobSrc]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) {
      return;
    }

    const interaction = interactionRef.current;
    if (!reducedMotion && !interaction.dragging && rampStartedRef.current) {
      if (spinRamp && rampElapsedRef.current < TURNTABLE_RAMP_DURATION_S) {
        rampElapsedRef.current += delta;
      }
      const speed = resolveTurntableSpeed(rampElapsedRef.current, spinRamp);
      interaction.rotationY += delta * speed;
    }
    groupRef.current.rotation.y = interaction.rotationY;
  });

  return (
    <group ref={groupRef}>
      <Center>
        <Bounds fit observe margin={1.15}>
          <primitive object={clonedScene} />
        </Bounds>
      </Center>
    </group>
  );
}

function FocusSpotlight({
  position,
  color,
}: {
  position: [number, number, number];
  color: string;
}) {
  const lightRef = useRef<SpotLightType>(null);

  useLayoutEffect(() => {
    lightRef.current?.lookAt(0, 0, 0);
  }, []);

  return (
    <spotLight
      ref={lightRef}
      position={position}
      angle={0.4}
      penumbra={0.72}
      intensity={9}
      color={color}
      distance={16}
      decay={2}
    />
  );
}

function dualSpotlightGlowBackground(agentId: string): string | null {
  if (agentId !== "keel") {
    return subagentModelGlowCssBackground(agentId);
  }

  return [
    "radial-gradient(ellipse 58% 54% at 50% 54%,",
    "rgba(190, 242, 100, 0.78) 0%,",
    "rgba(163, 230, 53, 0.42) 48%,",
    "rgba(163, 230, 53, 0.14) 68%,",
    "transparent 74%)",
  ].join(" ");
}

class AgentModelCanvasErrorBoundary extends Component<
  { children: ReactNode; onError: (error: Error) => void; resetKey: string },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: { resetKey: string }): void {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[AgentModelViewer] 3D canvas failed", error, info.componentStack);
    this.props.onError(error);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }

    return this.props.children;
  }
}

function SceneLighting({ variant }: { variant: LightingVariant }) {
  if (variant === "dualSpotlight") {
    return (
      <>
        <ambientLight intensity={0.38} />
        <FocusSpotlight position={[-2.6, 4.8, 3.8]} color="#f4ffe0" />
        <FocusSpotlight position={[2.6, 4.8, 3.8]} color="#f4ffe0" />
        <directionalLight position={[0, 2, -4]} intensity={0.6} color="#bbf7d0" />
      </>
    );
  }

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[4, 6, 5]} intensity={1.1} />
      <directionalLight position={[-5, 2, -4]} intensity={0.5} />
    </>
  );
}

export function AgentModelViewer({
  agentId,
  src,
  placeholderSrc,
  className,
  lightingVariant = "default",
  spinRamp = false,
}: AgentModelViewerProps) {
  const glowBackground =
    lightingVariant === "dualSpotlight"
      ? dualSpotlightGlowBackground(agentId)
      : subagentModelGlowCssBackground(agentId);
  const [modelReady, setModelReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [blobSrc, setBlobSrc] = useState<string | null>(null);
  const [webGLAvailable, setWebGLAvailable] = useState<boolean | null>(null);
  const interactionRef = useRef<TurntableInteraction>({
    rotationY: 0,
    dragging: false,
    dragStartX: 0,
    dragStartRotation: 0,
  });
  const [isDragging, setIsDragging] = useState(false);

  const handleModelReady = useCallback(() => {
    setModelReady(true);
    setLoadFailed(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setModelReady(false);
    setLoadFailed(false);
    setBlobSrc(null);

    void loadAgentModelBlobUrl(src)
      .then((url) => {
        if (!cancelled) {
          setBlobSrc(url);
        }
      })
      .catch((error: unknown) => {
        console.error("[AgentModelViewer] GLB fetch failed", src, error);
        if (!cancelled) {
          setLoadFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [src]);

  useEffect(() => {
    return deferUntilWebGLSafe(() => {
      setWebGLAvailable(
        isWebGLAvailable({
          alpha: true,
          antialias: true,
        }),
      );
    });
  }, []);

  const handleCanvasError = useCallback(
    (error: Error) => {
      console.error("[AgentModelViewer] falling back to portrait", src, error);
      setLoadFailed(true);
    },
    [src],
  );

  const showCanvas = webGLAvailable === true && !loadFailed && Boolean(blobSrc);
  const showPlaceholder =
    Boolean(placeholderSrc) &&
    (webGLAvailable === false || loadFailed || !showCanvas || !modelReady);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const interaction = interactionRef.current;
    interaction.dragging = true;
    interaction.dragStartX = event.clientX;
    interaction.dragStartRotation = interaction.rotationY;
    setIsDragging(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const interaction = interactionRef.current;
    if (!interaction.dragging) {
      return;
    }
    const deltaX = event.clientX - interaction.dragStartX;
    interaction.rotationY =
      interaction.dragStartRotation + deltaX * DRAG_ROTATION_PER_PX;
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    const interaction = interactionRef.current;
    if (!interaction.dragging) {
      return;
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    interaction.dragging = false;
    setIsDragging(false);
  };

  return (
    <div
      className={[
        "relative shrink-0 overflow-visible",
        className ?? "h-64 w-56",
        "cursor-grab touch-none select-none active:cursor-grabbing",
        isDragging ? "cursor-grabbing" : "",
      ].join(" ")}
      aria-hidden
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={endDrag}
    >
      {glowBackground ? (
        <div
          className="pointer-events-none absolute z-[1] overflow-visible"
          style={{
            top: "-8%",
            bottom: "-8%",
            left: "-12%",
            right: "-12%",
          }}
          aria-hidden
        >
          <div
            className={
              lightingVariant === "dualSpotlight"
                ? "h-full w-full blur-3xl"
                : "h-full w-full blur-2xl"
            }
            style={{ background: glowBackground }}
          />
        </div>
      ) : null}
      {showPlaceholder ? (
        <img
          src={placeholderSrc}
          alt=""
          className="absolute inset-0 z-20 h-full w-full object-contain object-center"
          draggable={false}
        />
      ) : null}
      {showCanvas && blobSrc ? (
        <AgentModelCanvasErrorBoundary resetKey={blobSrc} onError={handleCanvasError}>
          <Canvas
            className={[
              "h-full w-full pointer-events-none transition-opacity duration-300",
              modelReady
                ? [
                    "relative z-10 opacity-100",
                    lightingVariant === "dualSpotlight" ? "login-model-canvas-glow" : "",
                  ].join(" ")
                : "absolute inset-0 z-0 opacity-0",
            ].join(" ")}
            gl={{ alpha: true, antialias: true }}
            style={{ background: "transparent" }}
            camera={{ position: [0, 0, 3], fov: 35 }}
            onCreated={({ gl, scene }) => {
              gl.setClearColor(0x000000, 0);
              scene.background = null;
            }}
          >
            <SceneLighting variant={lightingVariant} />
            <Suspense fallback={null}>
              <AgentModelScene
                blobSrc={blobSrc}
                interactionRef={interactionRef}
                spinRamp={spinRamp}
                onReady={handleModelReady}
              />
            </Suspense>
          </Canvas>
        </AgentModelCanvasErrorBoundary>
      ) : null}
    </div>
  );
}
