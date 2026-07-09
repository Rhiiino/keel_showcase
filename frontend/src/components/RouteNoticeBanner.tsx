// keel_web/src/components/RouteNoticeBanner.tsx

import { useRouteNotice } from "../hooks/useRouteNotice";

type RouteNoticeBannerProps = {
  /** Applied to the outer wrapper only when a notice is visible. */
  className?: string;
};

export function RouteNoticeBanner({ className }: RouteNoticeBannerProps = {}) {
  const { notice, dismissNotice } = useRouteNotice();

  if (!notice) {
    return null;
  }

  return (
    <div className={className}>
      <div
        role="status"
        className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-amber-900/40 bg-amber-950/30 px-4 py-3 text-sm text-amber-100"
      >
        <p>{notice}</p>
        <button
          type="button"
          onClick={dismissNotice}
          className="shrink-0 text-amber-200/80 transition hover:text-amber-50"
          aria-label="Dismiss notice"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
