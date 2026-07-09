// keel_web/src/lib/visual/lightningStrike.ts

export type LightningStrike = {
  id: string;
  x: number;
  y: number;
  peak: number;
  boltVariant: number;
  doubleFlicker: boolean;
};

export const LIGHTNING_BOLT_PATHS = [
  "M50 0 L44 18 L52 18 L38 42 L48 26 L41 26 L54 68",
  "M50 0 L56 14 L47 14 L60 36 L51 22 L55 22 L43 58",
  "M50 0 L42 12 L49 12 L36 32 L46 20 L40 20 L52 52",
  "M50 0 L58 20 L49 20 L62 44 L53 30 L57 30 L45 64",
] as const;

export function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function createLightningStrike(): LightningStrike {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    x: randomBetween(6, 94),
    y: randomBetween(2, 42),
    peak: randomBetween(0.38, 0.72),
    boltVariant: Math.floor(Math.random() * LIGHTNING_BOLT_PATHS.length),
    doubleFlicker: Math.random() < 0.55,
  };
}
