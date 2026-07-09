// stack_sandbox/frontend_web/src/app/shell/AppShellContent.tsx

// Wrapper for main content inside AppShell. Applies consistent padding and flex
// layout so individual pages only supply their inner content.

import type { ReactNode } from "react";

type AppShellContentProps = {
  children: ReactNode;
};

export function AppShellContent({ children }: AppShellContentProps) {
  return (
    <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-contain px-6 py-8 sm:px-10 sm:py-10 lg:px-12">
      {children}
    </section>
  );
}
