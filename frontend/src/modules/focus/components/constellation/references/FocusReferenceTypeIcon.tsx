// src/modules/focus/components/constellation/references/FocusReferenceTypeIcon.tsx

// Small badge icon for linked record reference types on constellation nodes.

import agentsIconUrl from "../../../../../assets/nav_icons/agents.png";
import contactsIconUrl from "../../../../../assets/nav_icons/contacts.png";
import mediaIconUrl from "../../../../../assets/nav_icons/media.png";
import projectsIconUrl from "../../../../../assets/nav_icons/projects.png";
import financeIconUrl from "../../../../../assets/nav_icons/finances.png";
import toolCategoriesIconUrl from "../../../../../assets/nav_icons/tool_categories.png";
import toolsIconUrl from "../../../../../assets/nav_icons/tools.png";

type FocusReferenceTypeIconProps = {
  targetType: string;
  hovered?: boolean;
  size?: "sm" | "md";
};

const REFERENCE_ICON_SIZE_CLASS = {
  sm: "h-7 w-7 min-w-7 p-0.5 text-xs",
  md: "h-9 w-9 min-w-9 p-1 text-sm",
} as const;

type ReferenceIconDefinition = {
  label: string;
  src: string;
};

const REFERENCE_ICON_BASE_CLASS =
  "inline-flex h-9 w-9 items-center justify-center rounded-full border bg-[#111827] shadow-[0_0_0_2px_rgba(5,7,10,0.9)] transition duration-150";
const REFERENCE_ICON_IDLE_CLASS =
  "border-white/18 shadow-[0_0_0_2px_rgba(5,7,10,0.9)]";
const REFERENCE_ICON_HOVER_CLASS =
  "border-white/30 bg-[#1f2937] shadow-[0_0_0_3px_rgba(255,255,255,0.12),0_0_18px_rgba(255,255,255,0.18)]";

const REFERENCE_TYPE_ICONS: Record<string, ReferenceIconDefinition> = {
  project: {
    label: "Project reference",
    src: projectsIconUrl,
  },
  finance_transaction: {
    label: "Transaction reference",
    src: financeIconUrl,
  },
  contact: {
    label: "Contact reference",
    src: contactsIconUrl,
  },
  figure: {
    label: "Figure reference",
    src: contactsIconUrl,
  },
  agent: {
    label: "Agent reference",
    src: agentsIconUrl,
  },
  media_object: {
    label: "Media object reference",
    src: mediaIconUrl,
  },
  tool: {
    label: "Tool reference",
    src: toolsIconUrl,
  },
  tool_category: {
    label: "Tool categories reference",
    src: toolCategoriesIconUrl,
  },
};

export function FocusReferenceTypeIcon({
  targetType,
  hovered = false,
  size = "md",
}: FocusReferenceTypeIconProps) {
  const icon = REFERENCE_TYPE_ICONS[targetType];
  const surfaceClass = hovered ? REFERENCE_ICON_HOVER_CLASS : REFERENCE_ICON_IDLE_CLASS;
  const sizeClass = REFERENCE_ICON_SIZE_CLASS[size];

  if (!icon) {
    return (
      <span
        className={[
          REFERENCE_ICON_BASE_CLASS,
          sizeClass,
          "px-1.5 font-bold uppercase tracking-wide text-white/80",
          surfaceClass,
        ].join(" ")}
        title={`${targetType} reference`}
        aria-label={`${targetType} reference`}
      >
        {targetType.slice(0, 1).toUpperCase()}
      </span>
    );
  }

  return (
    <span
      className={[REFERENCE_ICON_BASE_CLASS, sizeClass, surfaceClass].join(" ")}
      title={icon.label}
      aria-label={icon.label}
      role="img"
    >
      <img src={icon.src} alt="" className="h-full w-full rounded-full object-contain" />
    </span>
  );
}
