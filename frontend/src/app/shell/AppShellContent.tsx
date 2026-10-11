// stack_sandbox/frontend_web/src/app/shell/AppShellContent.tsx

// Wrapper for main content inside AppShell. Applies consistent padding and flex
// layout so individual pages only supply their inner content.

import type { ReactNode } from "react";

type AppShellContentProps = {
  children: ReactNode;
};

export function AppShellContent({ children }: AppShellContentProps) {
  return (
    <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-contain px-6 sm:px-10 lg:px-12">
      <div className="flex min-h-full w-full flex-col pt-8 pb-16 sm:pt-10 sm:pb-20 lg:pb-24">
        {children}
      </div>
    </section>
  );
}
