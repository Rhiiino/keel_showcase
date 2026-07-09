// keel_web/src/modules/email/components/EmailAccountInboxPageLayout.tsx

import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type EmailAccountInboxPageLayoutProps = {
  backHref?: string;
  title?: string;
  onFetch?: () => void;
  fetchDisabled?: boolean;
  isFetching?: boolean;
  onOpenSettings?: () => void;
  errorMessage?: string | null;
  children: ReactNode;
};

function SettingsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.54V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.54 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.54-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.54-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1-1.54V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.54 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87 1.7 1.7 0 0 0 1.54 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.54 1Z"
      />
    </svg>
  );
}

export function EmailAccountInboxPageLayout({
  backHref = "/email",
  title,
  onFetch,
  fetchDisabled = false,
  isFetching = false,
  onOpenSettings,
  errorMessage,
  children,
}: EmailAccountInboxPageLayoutProps) {
  return (
    <div className="w-full max-w-6xl">
      <header className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <Link
            to={backHref}
            className="text-sm text-stone-500 transition hover:text-stone-300"
          >
            ← Back to email
          </Link>
          {title ? (
            <h1 className="mt-2 truncate text-xl font-medium text-stone-100">{title}</h1>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onFetch ? (
            <button
              type="button"
              onClick={() => void onFetch()}
              disabled={fetchDisabled || isFetching}
              className={[
                "rounded-xl border border-sky-300/20 bg-sky-400/10 px-4 py-2 text-sm font-medium text-sky-100 transition",
                "hover:border-sky-200/35 hover:bg-sky-400/16 hover:text-white",
                "disabled:cursor-not-allowed disabled:opacity-50",
              ].join(" ")}
            >
              {isFetching ? "Fetching…" : "Fetch"}
            </button>
          ) : null}
          {onOpenSettings ? (
            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="Email account settings"
              title="Email account settings"
              className={[
                "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-stone-700 bg-stone-900/60 text-stone-300 transition",
                "hover:border-stone-600 hover:bg-stone-900 hover:text-stone-100",
              ].join(" ")}
            >
              <SettingsIcon />
            </button>
          ) : null}
        </div>
      </header>

      <div className="mt-8">{children}</div>

      {errorMessage ? (
        <p className="mt-6 text-sm text-red-400">{errorMessage}</p>
      ) : null}
    </div>
  );
}
