// keel_web/src/modules/coak/lib/tabs/constellation/coakVec3.ts

export function subtractVec3(
  left: [number, number, number],
  right: [number, number, number],
): [number, number, number] {
  return [left[0] - right[0], left[1] - right[1], left[2] - right[2]];
}

export function addVec3(
  left: [number, number, number],
  right: [number, number, number],
): [number, number, number] {
  return [left[0] + right[0], left[1] + right[1], left[2] + right[2]];
}

export function scaleVec3(vector: [number, number, number], scalar: number): [number, number, number] {
  return [vector[0] * scalar, vector[1] * scalar, vector[2] * scalar];
}

export function dotVec3(left: [number, number, number], right: [number, number, number]): number {
  return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
}

export function crossVec3(
  left: [number, number, number],
  right: [number, number, number],
): [number, number, number] {
  return [
    left[1] * right[2] - left[2] * right[1],
    left[2] * right[0] - left[0] * right[2],
    left[0] * right[1] - left[1] * right[0],
  ];
}

export function lengthVec3(vector: [number, number, number]): number {
  return Math.hypot(vector[0], vector[1], vector[2]);
}

export function normalizeVec3(vector: [number, number, number]): [number, number, number] {
  const length = lengthVec3(vector);
  if (length === 0) {
    return [0, 1, 0];
  }
  return scaleVec3(vector, 1 / length);
}

export function pickPerpendicularAxis(axis: [number, number, number]): [number, number, number] {
  const reference: [number, number, number] =
    Math.abs(axis[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  return normalizeVec3(crossVec3(axis, reference));
}

export function rotateVec3AroundAxis(
  vector: [number, number, number],
  axis: [number, number, number],
  angleRadians: number,
): [number, number, number] {
  const cosAngle = Math.cos(angleRadians);
  const sinAngle = Math.sin(angleRadians);
  const cross = crossVec3(axis, vector);
  const projection = dotVec3(axis, vector);
  return addVec3(
    addVec3(scaleVec3(vector, cosAngle), scaleVec3(cross, sinAngle)),
    scaleVec3(axis, projection * (1 - cosAngle)),
  );
}

export function distanceBetweenPositions(
  left: [number, number, number],
  right: [number, number, number],
): number {
  return Math.hypot(left[0] - right[0], left[1] - right[1], left[2] - right[2]);
}
