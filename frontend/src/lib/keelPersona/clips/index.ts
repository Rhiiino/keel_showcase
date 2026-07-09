// keel_web/src/lib/keelPersona/clips/index.ts

import { registerKeelClip } from "../clipRegistry";
import { BAKING_CAKE_CLIP } from "./bakingCake";
import { IMPATIENCE_CLIP } from "./impatience";
import { SUSPICIOUS_DISGUISE_CLIP } from "./suspiciousDisguise";
import { TELESCOPE_BOOTY_CLIP } from "./telescopeBooty";
import { THE_SAILOR_CLIP } from "./theSailor";
import { THE_TESLA_CLIP } from "./theTesla";

const APPROVED_CLIPS = [
  BAKING_CAKE_CLIP,
  IMPATIENCE_CLIP,
  SUSPICIOUS_DISGUISE_CLIP,
  TELESCOPE_BOOTY_CLIP,
  THE_SAILOR_CLIP,
  THE_TESLA_CLIP,
] as const;

export {
  BAKING_CAKE_CLIP,
  IMPATIENCE_CLIP,
  SUSPICIOUS_DISGUISE_CLIP,
  TELESCOPE_BOOTY_CLIP,
  THE_SAILOR_CLIP,
  THE_TESLA_CLIP,
};

export function registerAllKeelClips(): void {
  for (const clip of APPROVED_CLIPS) {
    registerKeelClip(clip);
  }
}
