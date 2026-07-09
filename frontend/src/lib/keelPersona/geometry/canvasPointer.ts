// keel_web/src/modules/dev/lib/canvasPointer.ts

export type CanvasPoint = {
  x: number;
  y: number;
};

type PointerLike = {
  clientX: number;
  clientY: number;
};

export function pointerPositionInCanvas(
  event: PointerLike,
  canvas: HTMLDivElement,
): CanvasPoint {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

export function pointerPositionInDesignSpace(
  event: PointerLike,
  canvas: HTMLDivElement,
  baseOffset: CanvasPoint = { x: 0, y: 0 },
): CanvasPoint {
  const canvasPoint = pointerPositionInCanvas(event, canvas);
  return {
    x: canvasPoint.x - baseOffset.x,
    y: canvasPoint.y - baseOffset.y,
  };
}
