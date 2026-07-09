// stack_sandbox/frontend_web/src/app/shell/AppHeader.tsx

// Global top header for authenticated routes. Currently hosts the nav breadcrumb.

import { AppBreadcrumb } from "../navigation/AppBreadcrumb";

export function AppHeader() {
  return (
    <header
      data-app-header
      className="app-chrome-header flex h-10 shrink-0 items-center border-b border-stone-800/80 bg-app/90 px-4 backdrop-blur-sm sm:px-6"
    >
      <AppBreadcrumb />
    </header>
  );
}
