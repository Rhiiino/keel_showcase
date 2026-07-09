// keel_web/src/modules/coak/components/tabs/settings/CoakNodeVisualPreviewRowCanvas.tsx

import { useLayoutEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import type { OrthographicCamera as OrthographicCameraImpl } from "three";

import type { CoakNodeVisualStyle } from "../../../lib/tabs/settings/coakNodeVisualSettings";
import { CoakNodeSphereVisual } from "../constellation/node-visuals/CoakNodeSphereVisual";

const PREVIEW_RADIUS = 0.52;
const PREVIEW_HALF_HEIGHT = 0.58;

type CoakNodeVisualPreviewRowCanvasProps = {
  seed: string;
  color: string;
  styles: readonly CoakNodeVisualStyle[];
  columnCenters: readonly number[];
};

function CoakNodeVisualPreviewRowCamera() {
  const { camera, size } = useThree();

  useLayoutEffect(() => {
    const ortho = camera as OrthographicCameraImpl;
    const halfWidth = PREVIEW_HALF_HEIGHT * (size.width / Math.max(size.height, 1));

    ortho.left = -halfWidth;
    ortho.right = halfWidth;
    ortho.top = PREVIEW_HALF_HEIGHT;
    ortho.bottom = -PREVIEW_HALF_HEIGHT;
    ortho.updateProjectionMatrix();
  }, [camera, size.height, size.width]);

  return null;
}

function columnCenterToWorldX(center: number, halfWidth: number): number {
  return halfWidth * (center * 2 - 1);
}

function CoakNodeVisualPreviewRowScene({
  seed,
  color,
  styles,
  columnCenters,
}: CoakNodeVisualPreviewRowCanvasProps) {
  const { size } = useThree();
  const halfWidth = PREVIEW_HALF_HEIGHT * (size.width / Math.max(size.height, 1));

  return (
    <>
      <CoakNodeVisualPreviewRowCamera />
      <ambientLight intensity={0.42} />
      <directionalLight position={[4, 6, 5]} intensity={1.15} color="#f4ffe0" />
      <directionalLight position={[-5, 2, -4]} intensity={0.45} color="#94a3b8" />
      {styles.map((style, index) => {
        const center = columnCenters[index];
        if (center == null) {
          return null;
        }

        return (
          <group key={style} position={[columnCenterToWorldX(center, halfWidth), 0, 0]}>
            <CoakNodeSphereVisual
              visualStyle={style}
              seed={seed}
              radius={PREVIEW_RADIUS}
              color={color}
            />
          </group>
        );
      })}
    </>
  );
}

export function CoakNodeVisualPreviewRowCanvas({
  seed,
  color,
  styles,
  columnCenters,
}: CoakNodeVisualPreviewRowCanvasProps) {
  if (columnCenters.length < styles.length) {
    return null;
  }

  return (
    <Canvas
      className="pointer-events-none"
      gl={{ alpha: true, antialias: true }}
      orthographic
      camera={{ position: [0, 0, 5], near: 0.1, far: 20, zoom: 1 }}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "transparent",
      }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
      }}
    >
      <CoakNodeVisualPreviewRowScene
        seed={seed}
        color={color}
        styles={styles}
        columnCenters={columnCenters}
      />
    </Canvas>
  );
}
