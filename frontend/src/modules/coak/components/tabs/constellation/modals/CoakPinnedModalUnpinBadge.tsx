// keel_web/src/modules/coak/components/tabs/constellation/modals/CoakPinnedModalUnpinBadge.tsx

import { CoakNodePinIcon } from "../node-visuals/CoakNodePinIcon";

type CoakPinnedModalUnpinBadgeProps = {
  onUnpin: () => void;
};

export function CoakPinnedModalUnpinBadge({ onUnpin }: CoakPinnedModalUnpinBadgeProps) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onUnpin();
      }}
      onPointerDown={(event) => event.stopPropagation()}
      className="absolute -right-2 -top-2 z-20 inline-flex items-center justify-center rounded-full border border-amber-700/40 bg-stone-950/95 p-1.5 text-amber-300/90 shadow-[0_0_12px_rgba(245,158,11,0.12),0_2px_8px_rgba(0,0,0,0.75)] ring-1 ring-amber-500/15 transition hover:border-amber-600/50 hover:bg-stone-900 hover:text-amber-200 hover:shadow-[0_0_16px_rgba(245,158,11,0.18),0_2px_8px_rgba(0,0,0,0.75)]"
      aria-label="Unpin node"
    >
      <CoakNodePinIcon />
    </button>
  );
}
