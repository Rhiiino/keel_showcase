// keel_web/src/modules/coak/components/tabs/settings/CoakSettingsSearchContext.tsx

import { createContext, useContext, type ReactNode } from "react";

type CoakSettingsSearchContextValue = {
  activeMatchId: string | null;
  hasActiveQuery: boolean;
};

const CoakSettingsSearchContext = createContext<CoakSettingsSearchContextValue>({
  activeMatchId: null,
  hasActiveQuery: false,
});

type CoakSettingsSearchProviderProps = {
  activeMatchId: string | null;
  hasActiveQuery: boolean;
  children: ReactNode;
};

export function CoakSettingsSearchProvider({
  activeMatchId,
  hasActiveQuery,
  children,
}: CoakSettingsSearchProviderProps) {
  return (
    <CoakSettingsSearchContext.Provider value={{ activeMatchId, hasActiveQuery }}>
      {children}
    </CoakSettingsSearchContext.Provider>
  );
}

export function useCoakSettingsSearchHighlight(searchId: string): boolean {
  const { activeMatchId, hasActiveQuery } = useContext(CoakSettingsSearchContext);
  return hasActiveQuery && activeMatchId === searchId;
}
