// keel_web/src/modules/email/EmailModuleLayout.tsx

import { Outlet } from "react-router-dom";

import { AppShellContent } from "../../app/shell/AppShellContent";

export function EmailModuleLayout() {
  return (
    <AppShellContent>
      <div className="mx-auto w-full max-w-6xl">
        <Outlet />
      </div>
    </AppShellContent>
  );
}
