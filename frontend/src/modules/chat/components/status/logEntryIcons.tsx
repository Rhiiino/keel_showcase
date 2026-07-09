// stack_sandbox/frontend_web/src/modules/chat/components/status/logEntryIcons.tsx

// Icons for Status Panel log entries — inline SVG or category logos.

import type { ReactNode } from "react";

import type { StatusLogKind } from "../../hooks/useStatusLog";
import { toolCategoryIconSrc } from "../../lib/tools";
import { ToolCategoryIcon } from "./ToolCategoryIcon";

type LogEntryIconProps = {
  kind: StatusLogKind;
  category?: string | null;
  size?: "sm" | "md";
  className?: string;
};

const sizeClass = {
  sm: "h-3 w-3",
  md: "h-3.5 w-3.5",
} as const;

function IconBase({
  children,
  size = "md",
  className = "",
}: {
  children: ReactNode;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`shrink-0 ${sizeClass[size]} ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      {children}
    </svg>
  );
}

function IconTool({ size, className }: Omit<LogEntryIconProps, "kind">) {
  return (
    <IconBase size={size} className={className}>
      <path
        d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

function IconAgent({ size, className }: Omit<LogEntryIconProps, "kind">) {
  return (
    <IconBase size={size} className={className}>
      <path
        d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 20v-1a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

function IconUser({ size, className }: Omit<LogEntryIconProps, "kind">) {
  return (
    <IconBase size={size} className={className}>
      <path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

function IconAssistant({ size, className }: Omit<LogEntryIconProps, "kind">) {
  return (
    <IconBase size={size} className={className}>
      <path
        d="M12 8V4H8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="4"
        y="8"
        width="16"
        height="12"
        rx="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 13h6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 17h4" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

function IconDone({ size, className }: Omit<LogEntryIconProps, "kind">) {
  return (
    <IconBase size={size} className={className}>
      <path
        d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M22 4 12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

function IconError({ size, className }: Omit<LogEntryIconProps, "kind">) {
  return (
    <IconBase size={size} className={className}>
      <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 8v4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 16h.01" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

function IconInfo({ size, className }: Omit<LogEntryIconProps, "kind">) {
  return (
    <IconBase size={size} className={className}>
      <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 16v-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 8h.01" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

export function logEntryIconColor(kind: StatusLogKind): string {
  switch (kind) {
    case "error":
      return "text-red-400/90";
    case "agent_selected":
      return "text-lime-300/90";
    case "tool_call_start":
    case "tool_call_result":
      return "text-sky-300/90";
    case "user_message":
      return "text-stone-300/90";
    case "assistant_message":
      return "text-violet-300/90";
    case "done":
      return "text-emerald-400/90";
    default:
      return "text-stone-500/90";
  }
}

export function LogEntryIcon({
  kind,
  category,
  size = "md",
  className = "",
}: LogEntryIconProps) {
  const color = logEntryIconColor(kind);
  const iconClass = `${color} ${className}`.trim();

  if (
    (kind === "tool_call_start" || kind === "tool_call_result") &&
    toolCategoryIconSrc(category)
  ) {
    return <ToolCategoryIcon category={category} size={size} className={className} />;
  }

  switch (kind) {
    case "tool_call_start":
    case "tool_call_result":
      return <IconTool size={size} className={iconClass} />;
    case "agent_selected":
      return <IconAgent size={size} className={iconClass} />;
    case "user_message":
      return <IconUser size={size} className={iconClass} />;
    case "assistant_message":
      return <IconAssistant size={size} className={iconClass} />;
    case "done":
      return <IconDone size={size} className={iconClass} />;
    case "error":
      return <IconError size={size} className={iconClass} />;
    default:
      return <IconInfo size={size} className={iconClass} />;
  }
}
