// keel_web/src/lib/keelPersona/teslaLineSweep.ts

export type TeslaLineSweepClip =
  | "hidden"
  | "full"
  | { mode: "fadeIn"; progress: number }
  | { mode: "fadeOut"; progress: number };
