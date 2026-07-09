// keel_web/src/modules/settings/components/KeelAnimationSettingsCard.tsx

import { KeelPersonaPlayer } from "../../../components/keelPersona";
import type { KeelAnimationClip } from "../../../lib/keelPersona";

/** Corner telescopes and body lean extend past the default 160px preview width. */
const PIRATE_CLIP_ID = "clip-telescope-booty";

const DEFAULT_PREVIEW_SIZE_PX = 160;
const CAROUSEL_PREVIEW_SIZE_PX = 200;

type KeelAnimationSettingsCardProps = {
  clip: KeelAnimationClip;
  variant?: "default" | "carousel";
  focused?: boolean;
};

export function KeelAnimationSettingsCard({
  clip,
  variant = "default",
  focused = false,
}: KeelAnimationSettingsCardProps) {
  const isPirateClip = clip.id === PIRATE_CLIP_ID;
  const isCarousel = variant === "carousel";

  return (
    <article
      className={[
        "relative flex flex-col overflow-visible rounded-xl pb-5 pt-9 transition-[box-shadow,border-color,ring-color] duration-200",
        isPirateClip ? "min-w-[15.5rem] items-start px-6" : "w-fit items-center px-3",
        isCarousel
          ? [
              "pointer-events-none border bg-stone-950/85 shadow-xl shadow-black/45",
              focused
                ? "border-stone-500/90 ring-2 ring-lime-300/35 shadow-2xl shadow-lime-950/25"
                : "border-stone-700/90 ring-1 ring-white/[0.06]",
            ].join(" ")
          : "border border-stone-800/80 bg-stone-950/40",
      ].join(" ")}
    >
      <p className="keel-animation-settings-card-title absolute left-2.5 top-2.5 max-w-[calc(100%-0.75rem)]">
        {clip.name}
      </p>
      <KeelPersonaPlayer
        clipId={clip.id}
        size={isCarousel ? CAROUSEL_PREVIEW_SIZE_PX : DEFAULT_PREVIEW_SIZE_PX}
        stageClassName={isPirateClip ? "translate-x-4" : undefined}
      />
    </article>
  );
}
