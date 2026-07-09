// keel_web/src/lib/keelPersona/clips/suspiciousDisguise.ts

import type { KeelAnimationClip } from "../types";

const IMPOSTER_HAT_WIGGLE = { groupWiggleIds: ["hat-beret"] };

export const SUSPICIOUS_DISGUISE_CLIP: KeelAnimationClip = {
  id: "clip-suspicious-disguise",
  name: "The Imposter",
  tags: ["humor", "disguise", "loading"],
  contextTags: ["hat-beret", "nose-mustache", "gaze-straight"],
  loop: true,
  defaultCaptionId: "caption-suspicious-disguise",
  steps: [
    {
      durationMs: 400,
      look: { visibleGroupIds: ["gaze-straight", "nose-mustache", "hat-beret"] },
      layers: { orangeEyeGlow: true, ...IMPOSTER_HAT_WIGGLE },
      captionId: "caption-suspicious-disguise",
    },
    {
      durationMs: 500,
      look: { visibleGroupIds: ["gaze-straight", "nose-mustache", "hat-beret"] },
      layers: { orangeEyeGlow: true, eyeScale: 2, ...IMPOSTER_HAT_WIGGLE },
      captionId: "caption-suspicious-disguise",
    },
    {
      durationMs: 400,
      look: { visibleGroupIds: ["gaze-straight", "nose-mustache", "hat-beret"] },
      layers: { orangeEyeGlow: true, eyeScaleLeft: 2, eyeScaleRight: 1, ...IMPOSTER_HAT_WIGGLE },
      captionId: "caption-suspicious-disguise",
    },
    {
      durationMs: 800,
      look: { visibleGroupIds: ["gaze-straight", "nose-mustache", "hat-beret"] },
      layers: {
        orangeEyeGlow: true,
        eyeScaleLeft: 2,
        eyeScaleRight: 1,
        groupWiggleIds: ["hat-beret", "nose-mustache"],
      },
      captionId: "caption-suspicious-disguise",
    },
  ],
};
