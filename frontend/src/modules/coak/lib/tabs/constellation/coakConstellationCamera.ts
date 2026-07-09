// keel_web/src/modules/coak/lib/graph/coakConstellationCamera.ts

/** Default orbit view for camera at [0, 0, 5] looking at the origin. */
export const COAK_DEFAULT_CONSTELLATION_AZIMUTH = 0;
export const COAK_DEFAULT_CONSTELLATION_POLAR = Math.PI / 2;

export type CoakConstellationOrbitAngles = {
  azimuth: number;
  polar: number;
};

export function computeCoakConstellationOrbitAngles(
  position: [number, number, number],
): CoakConstellationOrbitAngles {
  const [x, y, z] = position;
  const lengthSq = x * x + y * y + z * z;

  if (lengthSq < 1e-6) {
    return {
      azimuth: COAK_DEFAULT_CONSTELLATION_AZIMUTH,
      polar: COAK_DEFAULT_CONSTELLATION_POLAR,
    };
  }

  // Place the camera on the same side of the origin as the node so the node sits
  // between the camera and the origin (visible in front, not hidden behind it).
  const inverseLength = 1 / Math.sqrt(lengthSq);

  const polar = Math.acos(Math.min(1, Math.max(-1, y * inverseLength)));
  const azimuth = Math.atan2(x, z);

  return { azimuth, polar };
}

export function lerpAngle(current: number, target: number, alpha: number): number {
  let delta = target - current;

  while (delta > Math.PI) {
    delta -= Math.PI * 2;
  }
  while (delta < -Math.PI) {
    delta += Math.PI * 2;
  }

  return current + delta * alpha;
}
