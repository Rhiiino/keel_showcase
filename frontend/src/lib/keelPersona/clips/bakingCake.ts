// keel_web/src/lib/keelPersona/clips/bakingCake.ts

import type { KeelAnimationClip } from "../types";

export const BAKING_CAKE_CLIP: KeelAnimationClip = {
  id: "clip-baking-cake",
  name: "The Baker",
  tags: ["humor", "baking"],
  contextTags: ["hat-chef", "prop-cake"],
  loop: true,
  defaultCaptionId: "caption-baking-cake",
  steps: [
    {
      durationMs: 5000,
      look: { visibleGroupIds: ["gaze-straight", "hat-chef", "prop-cake"] },
      layers: {
        happyEyes: true,
        wobble: true,
        wobbleExcludedGroupIds: ["prop-cake"],
      },
      captionId: "caption-baking-cake",
    },
  ],
};
