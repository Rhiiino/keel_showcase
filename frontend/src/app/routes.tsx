// keel_web/src/app/routes.tsx

// Top-level route manifest. Mobile devices get the mobile desktop gate;
// otherwise composes login and authenticated shell routes from enabled modules.

import { Fragment, useLayoutEffect } from "react";
import { Route, Routes } from "react-router-dom";

import { useIsMobileDevice } from "../lib/visual/useMediaQuery";
import { RequireAuth } from "../modules/auth/components/RequireAuth";
import { MobileDesktopGate } from "../modules/auth/pages/login/MobileDesktopGate";
import {
  clearShellLoadingBootstrap,
  SHELL_LOADING_BOOTSTRAP_ELEMENT_ID,
  waitForShellWallpaperBootstrapPaint,
} from "../modules/settings/lib/background";
import { enabledModules, moduleManifests } from "./modules/registry";
import { AppShell } from "./shell/AppShell";

const enabled = enabledModules(moduleManifests);

function fadeOutShellLoadingBootstrap(): void {
  const bootstrap = document.getElementById(SHELL_LOADING_BOOTSTRAP_ELEMENT_ID);
  if (!bootstrap) {
    clearShellLoadingBootstrap();
    return;
  }

  bootstrap.style.transition = "opacity 0.28s ease";
  bootstrap.style.opacity = "0";
  window.setTimeout(() => {
    clearShellLoadingBootstrap();
  }, 280);
}

export function AppRoutes() {
  const isMobileDevice = useIsMobileDevice();

  useLayoutEffect(() => {
    if (!isMobileDevice) {
      return;
    }
    // Mobile never mounts AppShell (which normally clears the spinner). Keep the
    // wallpaper bootstrap so loading/gate match desktop; only dismiss the spinner
    // after wallpaper bytes have a chance to paint behind it.
    let cancelled = false;
    void waitForShellWallpaperBootstrapPaint().then(() => {
      if (!cancelled) {
        fadeOutShellLoadingBootstrap();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isMobileDevice]);

  if (isMobileDevice) {
    return <MobileDesktopGate />;
  }

  return (
    <Routes>
      {enabled.map((module) =>
        module.publicRoutes ? (
          <Fragment key={module.key}>{module.publicRoutes}</Fragment>
        ) : null,
      )}

      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          {enabled.map((module) =>
            module.shellRoutes ? (
              <Fragment key={module.key}>{module.shellRoutes}</Fragment>
            ) : null,
          )}
        </Route>
      </Route>
    </Routes>
  );
}
