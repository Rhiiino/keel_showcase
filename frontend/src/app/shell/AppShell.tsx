// stack_sandbox/frontend_web/src/app/shell/AppShell.tsx

// Shared layout for authenticated app routes. Renders the Keel background, AppNav,
// session user, logout handling, and an Outlet where nested page content renders.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { KeelBrandSpinner } from "../../components/KeelBrandSpinner";
import {
  authKeys,
  authSessionQueryRetry,
  CURRENT_USER_STALE_TIME_MS,
  fetchAuthSessionUser,
  logout,
  type CurrentUser,
} from "../../modules/auth/api";
import { usePrefersReducedMotion } from "../../lib/visual/usePrefersReducedMotion";
import {
  clearShellLoadingBootstrap,
  SHELL_LOADING_BOOTSTRAP_ELEMENT_ID,
} from "../../modules/settings/lib/background";
import { useSettingsServerSync } from "../../modules/settings/hooks/useSettingsServerSync";
import { AppNav } from "../nav/AppNav";
import {
  APP_NAV_RAIL_WIDTH,
  getNavItemHref,
  resolveActiveNavId,
} from "../nav/appNavConfig";
import { appNavItems } from "../nav/appNavRegistry";
import { useAppNavLayout } from "../nav/useAppNavLayout";
import { useAppNavOrder } from "../nav/useAppNavOrder";
import { useNavMenuVisibility } from "../nav/useNavMenuVisibility";
import {
  NavigationStackProvider,
  useNavigationStack,
} from "../navigation/NavigationStackContext";
import { AnimatedOutlet } from "./AnimatedOutlet";
import { AppHeader } from "./AppHeader";
import { AppShellWallpaper } from "./AppShellWallpaper";
import { AppThemeEffects } from "./AppThemeEffects";
import { GlobalMediaPasteUpload } from "./GlobalMediaPasteUpload";
import {
  APP_HEADER_HEIGHT_PX,
  SHELL_ENTRANCE_CONTENT,
  SHELL_ENTRANCE_EASE,
  SHELL_ENTRANCE_HEADER,
  SHELL_ENTRANCE_NAV,
  shellEntranceSpinnerHideMs,
} from "./shellChromeEntrance";

export function AppShell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: authKeys.me(),
    queryFn: ({ signal }) => fetchAuthSessionUser(signal),
    staleTime: CURRENT_USER_STALE_TIME_MS,
    refetchOnWindowFocus: false,
    retry: authSessionQueryRetry,
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.all });
      navigate("/login", { replace: true });
    },
  });

  return (
    <main className="relative h-screen overflow-hidden bg-app text-stone-100">
      <div className="app-shell-gradient pointer-events-none fixed inset-0 z-0" />
      <AppThemeEffects />

      <NavigationStackProvider>
        <AppShellLayout
          user={user ?? null}
          onLogout={() => logoutMutation.mutate()}
          logoutPending={logoutMutation.isPending}
        />
        <GlobalMediaPasteUpload />
      </NavigationStackProvider>
    </main>
  );
}

type AppShellLayoutProps = {
  user: CurrentUser | null;
  onLogout: () => void;
  logoutPending: boolean;
};

function AppShellLayout({ user, onLogout, logoutPending }: AppShellLayoutProps) {
  useSettingsServerSync();
  const location = useLocation();
  const { navigateTo } = useNavigationStack();
  const prefersReducedMotion = usePrefersReducedMotion();
  const { open: labelsOpen, width, isResizing, onToggleLabels, onResizePointerDown } =
    useAppNavLayout(true);
  const {
    rows: navRows,
    items: orderedNavItems,
    layout: navLayout,
    reorderLayout: reorderNavLayout,
  } = useAppNavOrder(appNavItems, { sync: Boolean(user) });
  const { visibility, hideItem, unhideItem, hasHiddenItems } = useNavMenuVisibility({
    sync: Boolean(user),
  });
  const [showEntranceSpinner, setShowEntranceSpinner] = useState(() => {
    if (prefersReducedMotion) {
      return false;
    }
    // Prefer the pre-React bootstrap spinner when present; only fall back to React.
    return !document.getElementById(SHELL_LOADING_BOOTSTRAP_ELEMENT_ID);
  });
  const [navRevealDone, setNavRevealDone] = useState(prefersReducedMotion);

  const panelWidth = labelsOpen ? width : APP_NAV_RAIL_WIDTH;

  useEffect(() => {
    if (prefersReducedMotion) {
      setShowEntranceSpinner(false);
      setNavRevealDone(true);
      clearShellLoadingBootstrap();
      return;
    }

    const hideSpinner = window.setTimeout(() => {
      setShowEntranceSpinner(false);
      const bootstrap = document.getElementById(SHELL_LOADING_BOOTSTRAP_ELEMENT_ID);
      if (bootstrap) {
        bootstrap.style.transition = "opacity 0.28s ease";
        bootstrap.style.opacity = "0";
        window.setTimeout(() => {
          clearShellLoadingBootstrap();
        }, 280);
      } else {
        clearShellLoadingBootstrap();
      }
    }, shellEntranceSpinnerHideMs());
    const navDone = window.setTimeout(() => {
      setNavRevealDone(true);
    }, Math.round((SHELL_ENTRANCE_NAV.delay + SHELL_ENTRANCE_NAV.duration) * 1000));

    return () => {
      window.clearTimeout(hideSpinner);
      window.clearTimeout(navDone);
    };
  }, [prefersReducedMotion]);

  const activeId = useMemo(
    () => resolveActiveNavId(location.pathname, orderedNavItems),
    [location.pathname, orderedNavItems],
  );

  function handleSelect(id: string) {
    const href = getNavItemHref(orderedNavItems, id);
    if (href) {
      navigateTo(href);
    }
  }

  function handleOpenSettings() {
    navigateTo("/settings");
  }

  const nav = (
    <AppNav
      allRows={navRows}
      layout={navLayout}
      visibility={visibility}
      hasHiddenItems={hasHiddenItems}
      activeId={activeId}
      labelsOpen={labelsOpen}
      width={width}
      isResizing={isResizing}
      onToggleLabels={onToggleLabels}
      onResizePointerDown={onResizePointerDown}
      onSelect={handleSelect}
      onReorderLayout={reorderNavLayout}
      onHideItem={hideItem}
      onUnhideItem={unhideItem}
      user={user}
      onOpenSettings={handleOpenSettings}
      onLogout={onLogout}
      logoutPending={logoutPending}
    />
  );

  if (prefersReducedMotion) {
    return (
      <div className="relative z-[2] flex h-full min-h-0 flex-1 overflow-hidden">
        {nav}
        <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <AppHeader />
          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden">
            <AppShellWallpaper />
            <div className="relative z-[1] flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden">
              <AnimatedOutlet />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-[2] flex h-full min-h-0 flex-1 overflow-hidden">
      <motion.div
        className="relative z-[3] h-full min-h-0 shrink-0 overflow-hidden"
        initial={{ width: 0 }}
        animate={{ width: panelWidth }}
        transition={
          navRevealDone
            ? { duration: isResizing ? 0 : 0.3, ease: "easeInOut" }
            : {
                duration: SHELL_ENTRANCE_NAV.duration,
                delay: SHELL_ENTRANCE_NAV.delay,
                ease: SHELL_ENTRANCE_EASE,
              }
        }
      >
        <div className="flex h-full min-h-0" style={{ width: panelWidth }}>
          {nav}
        </div>
      </motion.div>

      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <motion.div
          className="relative z-[2] shrink-0 overflow-hidden"
          initial={{ height: 0 }}
          animate={{ height: APP_HEADER_HEIGHT_PX }}
          transition={{
            duration: SHELL_ENTRANCE_HEADER.duration,
            delay: SHELL_ENTRANCE_HEADER.delay,
            ease: SHELL_ENTRANCE_EASE,
          }}
        >
          <div style={{ height: APP_HEADER_HEIGHT_PX }}>
            <AppHeader />
          </div>
        </motion.div>

        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden">
          <AppShellWallpaper />
          <motion.div
            className="relative z-[1] flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: SHELL_ENTRANCE_CONTENT.duration,
              delay: SHELL_ENTRANCE_CONTENT.delay,
              ease: SHELL_ENTRANCE_EASE,
            }}
          >
            <AnimatedOutlet />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showEntranceSpinner ? (
          <motion.div
            key="shell-entrance-spinner"
            className="pointer-events-none absolute inset-0 z-[40] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: SHELL_ENTRANCE_EASE }}
          >
            <KeelBrandSpinner size={80} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
