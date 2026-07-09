// keel_web/src/app/shell/ModuleSubNavLayout.tsx

// App shell content wrapper with a module secondary nav and nested route outlet.

import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { ModuleSubNav } from "../nav/ModuleSubNav";
import type { ModuleSubNavItem } from "../nav/moduleSubNavConfig";
import { rememberModuleSubNavLocation } from "../nav/moduleSubNavStorage";
import { AppShellContent } from "./AppShellContent";

type ModuleSubNavLayoutProps = {
  moduleId: string;
  moduleTitle: string;
  items: readonly ModuleSubNavItem[];
  ariaLabel?: string;
};

export function ModuleSubNavLayout({
  moduleId,
  moduleTitle,
  items,
  ariaLabel,
}: ModuleSubNavLayoutProps) {
  const { pathname, search } = useLocation();

  useEffect(() => {
    rememberModuleSubNavLocation(moduleId, items, pathname, search);
  }, [moduleId, items, pathname, search]);

  return (
    <AppShellContent>
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col">
        <ModuleSubNav
          moduleId={moduleId}
          moduleTitle={moduleTitle}
          items={items}
          ariaLabel={ariaLabel}
        />
        <div className="mt-8 flex min-h-0 flex-1 flex-col">
          <Outlet />
        </div>
      </div>
    </AppShellContent>
  );
}
