// stack_sandbox/frontend_web/src/app/shell/AppShell.tsx

// Shared layout for authenticated app routes. Renders the Keel background, AppNav,
// session user, logout handling, and an Outlet where nested page content renders.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  authKeys,
  authSessionQueryRetry,
  CURRENT_USER_STALE_TIME_MS,
  fetchAuthSessionUser,
  logout,
  type CurrentUser,
} from "../../modules/auth/api";
import { useSettingsServerSync } from "../../modules/settings/hooks/useSettingsServerSync";
import { AppNav } from "../nav/AppNav";
import { getNavItemHref, resolveActiveNavId } from "../nav/appNavConfig";
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

  return (
    <div className="relative z-[2] flex h-full min-h-0 flex-1 overflow-hidden">
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

      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader />
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <AppShellWallpaper />
          <div className="relative z-[1] flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <AnimatedOutlet />
          </div>
        </div>
      </div>
    </div>
  );
}
