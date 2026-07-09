// keel_web/src/modules/coak/components/tabs/constellation/CoakConstellationGraphReadyContext.tsx

import { createContext, useContext, type ReactNode } from "react";

type CoakConstellationGraphReadyContextValue = {
  markGraphPainted: () => void;
};

const CoakConstellationGraphReadyContext =
  createContext<CoakConstellationGraphReadyContextValue | null>(null);

export function CoakConstellationGraphReadyProvider({
  markGraphPainted,
  children,
}: {
  markGraphPainted: () => void;
  children: ReactNode;
}) {
  return (
    <CoakConstellationGraphReadyContext.Provider value={{ markGraphPainted }}>
      {children}
    </CoakConstellationGraphReadyContext.Provider>
  );
}

export function useCoakConstellationGraphReadyContext(): CoakConstellationGraphReadyContextValue {
  const value = useContext(CoakConstellationGraphReadyContext);
  if (!value) {
    throw new Error("useCoakConstellationGraphReadyContext requires CoakConstellationGraphReadyProvider");
  }

  return value;
}

/** Returns null when the provider is absent (e.g. tests). */
export function useOptionalCoakConstellationGraphReadyContext():
  | CoakConstellationGraphReadyContextValue
  | null {
  return useContext(CoakConstellationGraphReadyContext);
}
