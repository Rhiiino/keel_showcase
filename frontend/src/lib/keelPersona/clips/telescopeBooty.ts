// keel_web/src/lib/keelPersona/clips/telescopeBooty.ts

import type { KeelAnimationClip } from "../types";

export const TELESCOPE_BOOTY_CLIP: KeelAnimationClip = {
  id: "clip-telescope-booty",
  name: "The Pirate",
  tags: ["humor", "pirate", "loading"],
  contextTags: ["hat-pirate"],
  loop: true,
  defaultCaptionId: "caption-telescope-booty",
  steps: [
    {
      durationMs: 120,
      look: {
        visibleGroupIds: [
          "gaze-top-right",
          "hat-pirate",
          "prop-telescope-top-right",
        ],
      },
      layers: {
        spawnScaleGroupIds: ["prop-telescope-top-right"],
        squintEyeSide: "left",
      },
      captionId: "caption-telescope-booty",
    },
    {
      durationMs: 750,
      look: {
        visibleGroupIds: [
          "gaze-top-right",
          "hat-pirate",
          "prop-telescope-top-right",
        ],
      },
      layers: { squintEyeSide: "left" },
      captionId: "caption-telescope-booty",
    },
    {
      durationMs: 120,
      look: {
        visibleGroupIds: [
          "gaze-top-right",
          "hat-pirate",
          "prop-telescope-top-right",
        ],
      },
      layers: {
        despawnScaleGroupIds: ["prop-telescope-top-right"],
        squintEyeSide: "left",
      },
      captionId: "caption-telescope-booty",
    },
    {
      durationMs: 750,
      look: { visibleGroupIds: ["gaze-bottom-left", "hat-pirate"] },
      layers: { bodyShiftDirection: "left", gazeTransition: true },
      captionId: "caption-telescope-booty",
    },
    {
      durationMs: 120,
      look: {
        visibleGroupIds: [
          "gaze-bottom-left",
          "hat-pirate",
          "prop-telescope-bottom-left",
        ],
      },
      layers: {
        spawnScaleGroupIds: ["prop-telescope-bottom-left"],
        squintEyeSide: "right",
      },
      captionId: "caption-telescope-booty",
    },
    {
      durationMs: 750,
      look: {
        visibleGroupIds: [
          "gaze-bottom-left",
          "hat-pirate",
          "prop-telescope-bottom-left",
        ],
      },
      layers: { squintEyeSide: "right" },
      captionId: "caption-telescope-booty",
    },
    {
      durationMs: 120,
      look: {
        visibleGroupIds: [
          "gaze-bottom-left",
          "hat-pirate",
          "prop-telescope-bottom-left",
        ],
      },
      layers: {
        despawnScaleGroupIds: ["prop-telescope-bottom-left"],
        squintEyeSide: "right",
      },
      captionId: "caption-telescope-booty",
    },
    {
      durationMs: 750,
      look: { visibleGroupIds: ["gaze-bottom-right", "hat-pirate"] },
      layers: { bodyShiftDirection: "right", gazeTransition: true },
      captionId: "caption-telescope-booty",
    },
    {
      durationMs: 120,
      look: {
        visibleGroupIds: [
          "gaze-bottom-right",
          "hat-pirate",
          "prop-telescope-bottom-right",
        ],
      },
      layers: {
        spawnScaleGroupIds: ["prop-telescope-bottom-right"],
        squintEyeSide: "left",
      },
      captionId: "caption-telescope-booty",
    },
    {
      durationMs: 750,
      look: {
        visibleGroupIds: [
          "gaze-bottom-right",
          "hat-pirate",
          "prop-telescope-bottom-right",
        ],
      },
      layers: { squintEyeSide: "left" },
      captionId: "caption-telescope-booty",
    },
    {
      durationMs: 120,
      look: {
        visibleGroupIds: [
          "gaze-bottom-right",
          "hat-pirate",
          "prop-telescope-bottom-right",
        ],
      },
      layers: {
        despawnScaleGroupIds: ["prop-telescope-bottom-right"],
        squintEyeSide: "left",
      },
      captionId: "caption-telescope-booty",
    },
    {
      durationMs: 750,
      look: { visibleGroupIds: ["gaze-top-left", "hat-pirate"] },
      layers: { bodyShiftDirection: "left", gazeTransition: true },
      captionId: "caption-telescope-booty",
    },
    {
      durationMs: 120,
      look: {
        visibleGroupIds: [
          "gaze-top-left",
          "hat-pirate",
          "prop-telescope-top-left",
        ],
      },
      layers: {
        spawnScaleGroupIds: ["prop-telescope-top-left"],
        squintEyeSide: "right",
      },
      captionId: "caption-telescope-booty",
    },
    {
      durationMs: 750,
      look: {
        visibleGroupIds: [
          "gaze-top-left",
          "hat-pirate",
          "prop-telescope-top-left",
        ],
      },
      layers: { squintEyeSide: "right" },
      captionId: "caption-telescope-booty",
    },
    {
      durationMs: 120,
      look: {
        visibleGroupIds: [
          "gaze-top-left",
          "hat-pirate",
          "prop-telescope-top-left",
        ],
      },
      layers: {
        despawnScaleGroupIds: ["prop-telescope-top-left"],
        squintEyeSide: "right",
      },
      captionId: "caption-telescope-booty",
    },
    {
      durationMs: 750,
      look: { visibleGroupIds: ["gaze-top-right", "hat-pirate"] },
      layers: { bodyShiftDirection: "right", gazeTransition: true },
      captionId: "caption-telescope-booty",
    },
  ],
};
