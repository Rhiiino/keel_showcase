// keel_web/src/views/list/primitives/ListPageTitle.tsx

// Page heading with optional unfiltered record count in parentheses.

import type { CSSProperties } from "react";

type ListPageTitleProps = {
  title: string;
  recordCount?: number;
  className?: string;
  countClassName?: string;
  style?: CSSProperties;
};

export function ListPageTitle({
  title,
  recordCount,
  className = "text-2xl font-semibold text-stone-50",
  countClassName = "font-normal tracking-normal text-stone-500",
  style,
}: ListPageTitleProps) {
  return (
    <h1 className={className} style={style}>
      {title}
      {recordCount !== undefined ? (
        <span className={countClassName}> ({recordCount})</span>
      ) : null}
    </h1>
  );
}
