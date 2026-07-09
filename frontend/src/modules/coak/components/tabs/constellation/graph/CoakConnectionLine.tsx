// keel_web/src/modules/coak/components/CoakConnectionLine.tsx

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Vector2 } from "three";
import { Line2, LineGeometry, LineMaterial } from "three-stdlib";

import {
  COAK_CONNECTION_COLOR,
  COAK_CONNECTION_GRADIENT_SOURCE_OPACITY,
  COAK_CONNECTION_GRADIENT_TARGET_OPACITY,
} from "../../../../lib/tabs/constellation/coakGraphConstants";
import {
  getCoakConnectionPulseHighlight,
  getCoakOriginPulsePhase,
} from "../../../../lib/tabs/constellation/coakOriginPulse";
import { COAK_CONNECTION_WIDTH_DEFAULT } from "../../../../lib/tabs/settings/coakConnectionWidthSettings";

type CoakConnectionLineProps = {
  from: [number, number, number];
  to: [number, number, number];
  color?: string;
  width?: number;
  pulseColor?: string;
  pulseFromDistance?: number;
  pulseToDistance?: number;
  pulseMaxDistance?: number;
};

type RgbaColor = [number, number, number, number];
type RgbColor = [number, number, number];

const CONNECTION_SEGMENTS = 28;

function hexToRgbNormalized(hex: string): RgbColor {
  const normalized = hex.replace("#", "");
  return [
    parseInt(normalized.slice(0, 2), 16) / 255,
    parseInt(normalized.slice(2, 4), 16) / 255,
    parseInt(normalized.slice(4, 6), 16) / 255,
  ];
}

function buildVertexColor(
  t: number,
  phase: number,
  baseRgb: RgbColor,
  pulseRgb: RgbColor,
  sourceOpacity: number,
  targetOpacity: number,
  pulseFromDistance: number,
  pulseToDistance: number,
  pulseMaxDistance: number,
): RgbaColor {
  const baseOpacity = sourceOpacity + (targetOpacity - sourceOpacity) * t;
  const pointDistance = pulseFromDistance + (pulseToDistance - pulseFromDistance) * t;
  const highlight = getCoakConnectionPulseHighlight(phase, pointDistance, pulseMaxDistance);
  const opacity = baseOpacity + (1 - baseOpacity) * highlight;

  return [
    baseRgb[0] + (pulseRgb[0] - baseRgb[0]) * highlight,
    baseRgb[1] + (pulseRgb[1] - baseRgb[1]) * highlight,
    baseRgb[2] + (pulseRgb[2] - baseRgb[2]) * highlight,
    opacity,
  ];
}

function buildConnectionVertexColors(
  phase: number,
  baseRgb: RgbColor,
  pulseRgb: RgbColor,
  sourceOpacity: number,
  targetOpacity: number,
  pulseFromDistance: number,
  pulseToDistance: number,
  pulseMaxDistance: number,
): number[] {
  const colors: number[] = [];

  for (let index = 0; index <= CONNECTION_SEGMENTS; index += 1) {
    const t = index / CONNECTION_SEGMENTS;
    const [r, g, b, a] = buildVertexColor(
      t,
      phase,
      baseRgb,
      pulseRgb,
      sourceOpacity,
      targetOpacity,
      pulseFromDistance,
      pulseToDistance,
      pulseMaxDistance,
    );
    colors.push(r, g, b, a);
  }

  return colors;
}

function buildConnectionPositions(
  from: [number, number, number],
  to: [number, number, number],
): number[] {
  const positions: number[] = [];

  for (let index = 0; index <= CONNECTION_SEGMENTS; index += 1) {
    const t = index / CONNECTION_SEGMENTS;
    positions.push(
      from[0] + (to[0] - from[0]) * t,
      from[1] + (to[1] - from[1]) * t,
      from[2] + (to[2] - from[2]) * t,
    );
  }

  return positions;
}

export function CoakConnectionLine({
  from,
  to,
  color = COAK_CONNECTION_COLOR,
  width = COAK_CONNECTION_WIDTH_DEFAULT,
  pulseColor,
  pulseFromDistance = 0,
  pulseToDistance = 0,
  pulseMaxDistance = 0,
}: CoakConnectionLineProps) {
  const size = useThree((state) => state.size);
  const baseRgb = useMemo(() => hexToRgbNormalized(color), [color]);
  const pulseRgb = useMemo(
    () => (pulseColor ? hexToRgbNormalized(pulseColor) : null),
    [pulseColor],
  );
  const pulseEnabled =
    pulseRgb != null && pulseMaxDistance > 0 && pulseToDistance > pulseFromDistance;

  const line2 = useMemo(() => new Line2(), []);
  const lineGeom = useMemo(() => {
    const geometry = new LineGeometry();
    geometry.setPositions(buildConnectionPositions(from, to));
    return geometry;
  }, [from, to]);
  const [lineMaterial] = useState(
    () =>
      new LineMaterial({
        color: 0xffffff,
        vertexColors: true,
        transparent: true,
        linewidth: width,
        resolution: new Vector2(1, 1),
      }),
  );

  useLayoutEffect(() => {
    line2.geometry = lineGeom;
    line2.computeLineDistances();
  }, [line2, lineGeom]);

  useEffect(() => {
    lineMaterial.linewidth = width;
    lineMaterial.needsUpdate = true;
  }, [lineMaterial, width]);

  useEffect(() => {
    lineMaterial.resolution.set(size.width, size.height);
    lineMaterial.needsUpdate = true;
  }, [lineMaterial, size.height, size.width]);

  useEffect(() => {
    return () => {
      lineGeom.dispose();
      lineMaterial.dispose();
    };
  }, [lineGeom, lineMaterial]);

  useFrame(({ clock }) => {
    if (!pulseEnabled || !pulseRgb) {
      return;
    }

    const phase = getCoakOriginPulsePhase(clock.elapsedTime);
    lineGeom.setColors(
      buildConnectionVertexColors(
        phase,
        baseRgb,
        pulseRgb,
        COAK_CONNECTION_GRADIENT_SOURCE_OPACITY,
        COAK_CONNECTION_GRADIENT_TARGET_OPACITY,
        pulseFromDistance,
        pulseToDistance,
        pulseMaxDistance,
      ),
      4,
    );
  });

  useLayoutEffect(() => {
    if (pulseEnabled) {
      return;
    }

    lineGeom.setColors(
      buildConnectionVertexColors(
        0,
        baseRgb,
        baseRgb,
        COAK_CONNECTION_GRADIENT_SOURCE_OPACITY,
        COAK_CONNECTION_GRADIENT_TARGET_OPACITY,
        pulseFromDistance,
        pulseToDistance,
        pulseMaxDistance,
      ),
      4,
    );
  }, [baseRgb, lineGeom, pulseEnabled, pulseFromDistance, pulseMaxDistance, pulseToDistance]);

  return (
    <primitive object={line2} raycast={() => null}>
      <primitive object={lineGeom} attach="geometry" />
      <primitive object={lineMaterial} attach="material" />
    </primitive>
  );
}
