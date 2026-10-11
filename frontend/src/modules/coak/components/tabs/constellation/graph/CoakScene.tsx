// keel_web/src/modules/coak/components/tabs/constellation/graph/CoakScene.tsx

// Full-viewport Three.js scene: origin sphere, draggable child nodes, pan/tilt controls.

import { Canvas } from "@react-three/fiber";

import { useCoakConstellationCanvasDismiss } from "../../../../hooks/tabs/constellation/useCoakConstellationCanvasDismiss";
import { CoakAxisGizmo } from "./CoakAxisGizmo";
import { CoakGraph } from "./CoakGraph";
import { CoakGraphCanvasBackdrop } from "./CoakGraphCanvasBackdrop";

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

  return (
    <div className="absolute inset-0 z-10">
      <Canvas
        className="h-full w-full touch-none"
        frameloop={suspendRender ? "never" : "always"}
        gl={{ alpha: true, antialias: true }}
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
    </div>
  );
}
