// keel_web/src/modules/contacts/components/tags/ContactTagPill.tsx

import type { ContactTag } from "../../api";
import { contactTagPillStyle } from "../../lib/contactTagDisplay";

type ContactTagPillProps = {
  tag: ContactTag;
  compact?: boolean;
  className?: string;
};

export function ContactTagPill({
  tag,
  compact = false,
  className,
}: ContactTagPillProps) {
  const style = contactTagPillStyle(tag.color_hex);

  return (
    <span
      className={[
        "inline-flex items-center rounded-full font-medium ring-1",
        compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className ?? "",
      ].join(" ")}
      style={style}
    >
      {tag.name}
    </span>
  );
}
