// keel_web/src/modules/coak/lib/graph/coakNodeDragMath.ts

import type { Camera, Plane, Raycaster, Vector3 } from "three";
import { Vector2 } from "three";

const ndc = new Vector2();

export function clientToNormalizedDeviceCoordinates(
  clientX: number,
  clientY: number,
  canvasRect: DOMRect,
): { x: number; y: number } {
  return {
    x: ((clientX - canvasRect.left) / canvasRect.width) * 2 - 1,
    y: -((clientY - canvasRect.top) / canvasRect.height) * 2 + 1,
  };
}

export function intersectClientWithPlane(
  clientX: number,
  clientY: number,
  plane: Plane,
  camera: Camera,
  raycaster: Raycaster,
  canvas: HTMLCanvasElement,
  target: Vector3,
): boolean {
  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return false;
  }

  const coords = clientToNormalizedDeviceCoordinates(clientX, clientY, rect);
  ndc.set(coords.x, coords.y);
  raycaster.setFromCamera(ndc, camera);
  return raycaster.ray.intersectPlane(plane, target) != null;
}
