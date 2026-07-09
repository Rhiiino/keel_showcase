// keel_web/src/lib/keelPersona/clips/theSailor.ts

import type { KeelAnimationClip } from "../types";

export const THE_SAILOR_CLIP: KeelAnimationClip = {
  id: "clip-the-sailor",
  name: "The sailor",
  tags: ["humor", "sailing", "loading"],
  contextTags: ["hat-sailor", "prop-helm"],
  loop: true,
  defaultCaptionId: "caption-sailor-course",
  steps: [
    {
      durationMs: 6000,
      look: { visibleGroupIds: ["gaze-straight", "hat-sailor", "prop-helm"] },
      layers: {
        wobble: true,
        groupSpinIds: ["prop-helm"],
        elementSpinIds: ["47825d11-d88d-45e3-b893-cf381f02efaa"],
        rainOverlay: true,
      },
      captionId: "caption-sailor-course",
    },
  ],
};
