// keel_web/src/lib/visual/rainDroplets.ts

export type RainDropletDepth = "far" | "mid" | "near";

export type RainDroplet = {
  id: string;
  leftPercent: number;
  lengthPx: number;
  widthPx: number;
  opacity: number;
  durationSec: number;
  delaySec: number;
  depth: RainDropletDepth;
};

const DEPTH_CONFIG: Record<
  RainDropletDepth,
  {
    count: number;
    length: [number, number];
    width: [number, number];
    opacity: [number, number];
    duration: [number, number];
  }
> = {
  far: {
    count: 22,
    length: [10, 18],
    width: [1, 1.2],
    opacity: [0.18, 0.34],
    duration: [1.6, 2.4],
  },
  mid: {
    count: 16,
    length: [16, 28],
    width: [1.2, 1.6],
    opacity: [0.32, 0.58],
    duration: [1, 1.5],
  },
  near: {
    count: 10,
    length: [24, 40],
    width: [1.8, 2.6],
    opacity: [0.55, 0.88],
    duration: [0.55, 0.95],
  },
};

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function createDroplet(depth: RainDropletDepth, index: number): RainDroplet {
  const config = DEPTH_CONFIG[depth];
  const durationSec = randomBetween(config.duration[0], config.duration[1]);

  return {
    id: `${depth}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    leftPercent: randomBetween(1, 99),
    lengthPx: randomBetween(config.length[0], config.length[1]),
    widthPx: randomBetween(config.width[0], config.width[1]),
    opacity: randomBetween(config.opacity[0], config.opacity[1]),
    durationSec,
    delaySec: randomBetween(0, durationSec),
    depth,
  };
}

export function createRainDropletField(): RainDroplet[] {
  return (Object.keys(DEPTH_CONFIG) as RainDropletDepth[]).flatMap((depth) =>
    Array.from({ length: DEPTH_CONFIG[depth].count }, (_, index) =>
      createDroplet(depth, index),
    ),
  );
}
