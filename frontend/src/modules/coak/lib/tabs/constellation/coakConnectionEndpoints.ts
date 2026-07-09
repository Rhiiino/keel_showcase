// keel_web/src/modules/coak/lib/tabs/constellation/coakConnectionEndpoints.ts

type CoakConnectionEndpoint = [number, number, number];

type TrimCoakConnectionEndpointsOptions = {
  fromTrimRadius?: number;
  toTrimRadius?: number;
};

export function trimCoakConnectionEndpoints(
  from: CoakConnectionEndpoint,
  to: CoakConnectionEndpoint,
  options: TrimCoakConnectionEndpointsOptions = {},
): { from: CoakConnectionEndpoint; to: CoakConnectionEndpoint } {
  const fromTrimRadius = options.fromTrimRadius ?? 0;
  const toTrimRadius = options.toTrimRadius ?? 0;

  if (fromTrimRadius <= 0 && toTrimRadius <= 0) {
    return { from, to };
  }

  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const dz = to[2] - from[2];
  const length = Math.hypot(dx, dy, dz);

  if (length <= 0) {
    return { from, to };
  }

  const nx = dx / length;
  const ny = dy / length;
  const nz = dz / length;

  return {
    from: [
      from[0] + nx * fromTrimRadius,
      from[1] + ny * fromTrimRadius,
      from[2] + nz * fromTrimRadius,
    ],
    to: [to[0] - nx * toTrimRadius, to[1] - ny * toTrimRadius, to[2] - nz * toTrimRadius],
  };
}
