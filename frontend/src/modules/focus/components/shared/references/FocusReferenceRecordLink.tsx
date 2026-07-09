// keel_web/src/modules/focus/components/shared/references/FocusReferenceRecordLink.tsx

import { Link } from "react-router-dom";

import { FocusReferenceTypeIcon } from "../../constellation/references/FocusReferenceTypeIcon";
import {
  focusReferenceTypeLabel,
  resolveFocusReferenceWebPath,
} from "../../../lib/focus/referenceNavigation";

type FocusReferenceRecordLinkProps = {
  targetType: string;
  targetId: string;
  title: string;
  isMissing?: boolean;
  variant?: "inline" | "panel";
  className?: string;
  onNavigate?: () => void;
};

function PanelReferenceUnavailable({ className = "" }: { className?: string }) {
  return (
    <div
      className={[
        "flex min-h-[3.25rem] items-center rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2",
        className,
      ].join(" ")}
    >
      <span className="text-sm text-white/42">Reference unavailable</span>
    </div>
  );
}

function PanelReferenceStaticTitle({
  targetType,
  title,
  className = "",
}: {
  targetType: string;
  title: string;
  className?: string;
}) {
  const typeLabel = focusReferenceTypeLabel(targetType);

  return (
    <div
      className={[
        "flex min-h-[3.25rem] items-center gap-2.5 rounded-lg border border-violet-400/18 bg-violet-500/[0.05] px-2.5 py-2",
        className,
      ].join(" ")}
    >
      <FocusReferenceTypeIcon targetType={targetType} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-200/45">
          {typeLabel}
        </p>
        <p className="truncate text-sm font-semibold text-violet-100/78">{title}</p>
      </div>
    </div>
  );
}

export function FocusReferenceRecordLink({
  targetType,
  targetId,
  title,
  isMissing = false,
  variant = "inline",
  className = "",
  onNavigate,
}: FocusReferenceRecordLinkProps) {
  const typeLabel = focusReferenceTypeLabel(targetType);
  const webPath = resolveFocusReferenceWebPath(targetType, targetId);

  if (isMissing) {
    if (variant === "panel") {
      return <PanelReferenceUnavailable className={className} />;
    }

    return (
      <span className={["text-sm text-white/42", className].join(" ")}>
        Reference unavailable
      </span>
    );
  }

  if (!webPath) {
    if (variant === "panel") {
      return (
        <PanelReferenceStaticTitle
          targetType={targetType}
          title={title}
          className={className}
        />
      );
    }

    return (
      <span
        className={["truncate text-sm text-white/62", className].join(" ")}
        title={title}
      >
        {title}
      </span>
    );
  }

  if (variant === "panel") {
    return (
      <Link
        to={webPath}
        title={`Open ${typeLabel}: ${title}`}
        aria-label={`Open ${typeLabel}: ${title}`}
        className={[
          "group flex min-h-[3.25rem] w-full min-w-0 items-center gap-2.5 rounded-lg border border-violet-400/28 bg-gradient-to-br from-violet-500/[0.16] via-violet-500/[0.07] to-transparent px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition duration-150",
          "hover:border-violet-300/45 hover:from-violet-500/[0.22] hover:shadow-[0_0_18px_rgba(139,92,246,0.16),inset_0_1px_0_rgba(255,255,255,0.08)]",
          className,
        ].join(" ")}
        onClick={(event) => {
          event.stopPropagation();
          onNavigate?.();
        }}
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
      >
        <FocusReferenceTypeIcon targetType={targetType} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-200/55 transition group-hover:text-violet-100/70">
            {typeLabel}
          </p>
          <p className="truncate text-sm font-semibold text-violet-50/92 transition group-hover:text-white">
            {title}
          </p>
        </div>
        <span
          className={[
            "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-violet-300/25 bg-violet-400/10 text-violet-100/70 transition duration-150",
            "group-hover:border-violet-200/45 group-hover:bg-violet-300/20 group-hover:text-white",
          ].join(" ")}
          aria-hidden
        >
          <svg
            viewBox="0 0 20 20"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M7 4h9v9" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 4L7 13" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </Link>
    );
  }

  return (
    <Link
      to={webPath}
      title={`Open ${typeLabel}: ${title}`}
      aria-label={`Open ${typeLabel}: ${title}`}
      className={[
        "group inline-flex min-w-0 max-w-full items-center gap-2 rounded-lg text-sm font-medium text-sky-200/88 transition hover:text-sky-100",
        className,
      ].join(" ")}
      onClick={(event) => {
        event.stopPropagation();
        onNavigate?.();
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
    >
      <span className="truncate">{title}</span>
      <svg
        viewBox="0 0 20 20"
        className="h-3.5 w-3.5 shrink-0 text-sky-200/55 transition group-hover:text-sky-100/80"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <path d="M7 4h9v9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 4L7 13" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}
