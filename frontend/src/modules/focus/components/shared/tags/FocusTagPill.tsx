// src/modules/focus/components/shared/tags/FocusTagPill.tsx

// Small colored tag pill for focus items.

import type { FocusTag } from "../../../api";

type FocusTagPillProps = {
  tag: FocusTag;
};

export function FocusTagPill({ tag }: FocusTagPillProps) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium text-white/90"
      style={{ backgroundColor: `${tag.color_hex}55`, border: `1px solid ${tag.color_hex}88` }}
    >
      {tag.name}
    </span>
  );
}
