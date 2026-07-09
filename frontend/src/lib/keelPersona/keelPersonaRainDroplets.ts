// keel_web/src/lib/keelPersona/keelPersonaRainDroplets.ts

export type KeelPersonaRainDroplet = {
  id: string;
  leftPercent: number;
  sizePx: number;
  opacity: number;
  durationSec: number;
  delaySec: number;
};

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function createDroplet(index: number): KeelPersonaRainDroplet {
  const durationSec = randomBetween(0.8, 1.5);

  return {
    id: `rain-${index}-${Math.random().toString(36).slice(2, 8)}`,
    leftPercent: randomBetween(4, 96),
    sizePx: randomBetween(20, 36),
    opacity: randomBetween(0.4, 0.8),
    durationSec,
    delaySec: randomBetween(0, durationSec),
  };
}

/** Randomized falling droplet field for the sailor rain overlay. */
export function createKeelPersonaRainDropletField(count = 10): KeelPersonaRainDroplet[] {
  return Array.from({ length: count }, (_, index) => createDroplet(index));
}
