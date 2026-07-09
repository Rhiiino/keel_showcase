// stack_sandbox/frontend_web/src/app/providers.tsx

// Root React providers. Wraps the app in TanStack Query's QueryClientProvider
// with default query options (e.g. staleTime).

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import {
  ThemeSettingsProvider,
  TransitionSettingsProvider,
  BackgroundSettingsProvider,
} from "../modules/settings/components/context";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeSettingsProvider>
        <BackgroundSettingsProvider>
          <TransitionSettingsProvider>{children}</TransitionSettingsProvider>
        </BackgroundSettingsProvider>
      </ThemeSettingsProvider>
    </QueryClientProvider>
  );
}
