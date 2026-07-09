// keel_web/src/modules/services/ServicesModuleLayout.tsx

import { Outlet } from "react-router-dom";

import { AppShellContent } from "../../app/shell/AppShellContent";

export function ServicesModuleLayout() {
  return (
    <AppShellContent>
      <div className="mx-auto w-full max-w-6xl">
        <Outlet />
      </div>
    </AppShellContent>
  );
}
