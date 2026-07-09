// src/modules/focus/components/shared/hub/FocusHubChromeBar.tsx

// Top chrome row aligned with AppShellContent padding and hub max width.

import type { ReactNode } from "react";

import {
  FOCUS_HUB_CONTENT_WIDTH_CLASS,
  FOCUS_HUB_SHELL_CHROME_PADDING_CLASS,
} from "../../../lib/focus";

type FocusHubChromeBarProps = {
  children: ReactNode;
  align?: "content" | "canvas";
};

export function FocusHubChromeBar({
  children,
  align = "content",
}: FocusHubChromeBarProps) {
  const innerClassName =
    align === "canvas"
      ? "flex w-full items-start justify-end gap-4"
      : `flex items-start justify-end gap-4 ${FOCUS_HUB_CONTENT_WIDTH_CLASS}`;

  return (
    <div
      className={[
        "pointer-events-none absolute inset-x-0 top-0 z-10",
        FOCUS_HUB_SHELL_CHROME_PADDING_CLASS,
      ].join(" ")}
    >
      <div className={innerClassName}>
        <div className="pointer-events-auto">{children}</div>
      </div>
    </div>
  );
}
