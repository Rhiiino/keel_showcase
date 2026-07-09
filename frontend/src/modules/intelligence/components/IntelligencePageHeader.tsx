// stack_sandbox/frontend_web/src/modules/intelligence/components/IntelligencePageHeader.tsx

// Shared header for Intelligence detail pages.

import { Link } from "react-router-dom";

type IntelligencePageHeaderProps = {
  title: string;
  subtitle: string;
  recordCount?: number;
};

export function IntelligencePageHeader({
  title,
  subtitle,
  recordCount,
}: IntelligencePageHeaderProps) {
  return (
    <header>
      <Link
        to="/intelligence"
        className="text-sm text-stone-500 transition hover:text-stone-300"
      >
        ← Back to Intelligence
      </Link>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-stone-50 sm:text-3xl">
        {title}
        {recordCount !== undefined ? (
          <span className="font-normal tracking-normal text-stone-500">
            {" "}
            ({recordCount})
          </span>
        ) : null}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-stone-500">{subtitle}</p>
    </header>
  );
}
