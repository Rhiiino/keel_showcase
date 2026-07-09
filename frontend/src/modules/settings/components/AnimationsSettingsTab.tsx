// keel_web/src/modules/settings/components/AnimationsSettingsTab.tsx

import { useState } from "react";

import { listKeelClips } from "../../../lib/keelPersona";
import {
  readAnimationViewMode,
  writeAnimationViewMode,
  type AnimationViewMode,
} from "../lib/animationView";
import { AnimationViewToggle } from "./AnimationViewToggle";
import { KeelAnimationCarouselView } from "./KeelAnimationCarouselView";
import { KeelAnimationSettingsCard } from "./KeelAnimationSettingsCard";

export function AnimationsSettingsTab() {
  const clips = listKeelClips();
  const [viewMode, setViewMode] = useState<AnimationViewMode>(() => readAnimationViewMode());

  const handleViewModeChange = (next: AnimationViewMode) => {
    setViewMode(next);
    writeAnimationViewMode(next);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-stone-50">
            Animations
            <span className="font-normal tracking-normal text-stone-500"> ({clips.length})</span>
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Registered Keel Persona animations and their quips. New animations are authored in the dev
            builder and promoted to production when approved.
          </p>
        </div>
        {clips.length > 0 ? (
          <AnimationViewToggle viewMode={viewMode} onChange={handleViewModeChange} />
        ) : null}
      </header>

      {clips.length === 0 ? (
        <section className="rounded-xl border border-stone-800/80 bg-stone-950/40 p-5">
          <p className="text-sm text-stone-500">No animations are registered yet.</p>
        </section>
      ) : viewMode === "carousel" ? (
        <section className="flex min-h-0 flex-1 items-center overflow-y-visible">
          <KeelAnimationCarouselView clips={clips} />
        </section>
      ) : (
        <section className="flex flex-wrap items-start gap-4">
          {clips.map((clip) => (
            <KeelAnimationSettingsCard key={clip.id} clip={clip} />
          ))}
        </section>
      )}
    </div>
  );
}
