// keel_web/src/lib/keelPersona/clips/theTesla.ts

import { TESLA_LOOP_MS } from "../teslaLineGlow";
import type { KeelAnimationClip } from "../types";

export const THE_TESLA_CLIP: KeelAnimationClip = {
  id: "clip-the-tesla",
  name: "The Tesla",
  tags: ["humor", "loading", "tesla"],
  contextTags: ["gaze-straight", "tesla-lines"],
  loop: true,
  defaultCaptionId: "caption-the-tesla",
  steps: [
    {
      durationMs: TESLA_LOOP_MS,
      look: {
        visibleGroupIds: ["gaze-straight", "tesla-lines"],
      },
      layers: { teslaLineGlow: true },
      captionId: "caption-the-tesla",
    },
  ],
};
