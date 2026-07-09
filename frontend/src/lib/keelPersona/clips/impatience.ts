// keel_web/src/lib/keelPersona/clips/impatience.ts

import type { KeelAnimationClip } from "../types";

export const IMPATIENCE_CLIP: KeelAnimationClip = {
  id: "clip-impatience",
  name: "The Impatient",
  tags: ["humor", "loading"],
  contextTags: ["prop-branch", "gaze-straight"],
  loop: true,
  defaultCaptionId: "caption-impatience",
  steps: [
    {
      durationMs: 1400,
      look: { visibleGroupIds: ["gaze-straight", "prop-branch"] },
      layers: { branchPoke: true },
      captionId: "caption-impatience",
    },
    {
      durationMs: 500,
      look: { visibleGroupIds: ["gaze-straight", "prop-branch"] },
      layers: {},
      captionId: "caption-impatience",
    },
    {
      durationMs: 150,
      look: { visibleGroupIds: ["gaze-straight", "prop-branch"] },
      layers: { straightEyeBlink: true },
      captionId: "caption-impatience",
    },
    {
      durationMs: 500,
      look: { visibleGroupIds: ["gaze-straight", "prop-branch"] },
      layers: {},
      captionId: "caption-impatience",
    },
    {
      durationMs: 150,
      look: { visibleGroupIds: ["gaze-straight", "prop-branch"] },
      layers: { straightEyeBlink: true },
      captionId: "caption-impatience",
    },
    {
      durationMs: 100,
      look: { visibleGroupIds: ["gaze-straight", "prop-branch"] },
      layers: {},
      captionId: "caption-impatience",
    },
    {
      durationMs: 150,
      look: { visibleGroupIds: ["gaze-straight", "prop-branch"] },
      layers: { straightEyeBlink: true },
      captionId: "caption-impatience",
    },
  ],
};
