// src/modules/focus/components/constellation/references/FocusReferenceInspectorInteractionContext.tsx

// Tracks whether a reference property inspector flyout is open so canvas node clicks are suppressed.

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type MutableRefObject,
  type ReactNode,
} from "react";

type FocusReferenceInspectorInteractionContextValue = {
  setReferenceInspectorOpen: (open: boolean) => void;
};

const FocusReferenceInspectorInteractionContext =
  createContext<FocusReferenceInspectorInteractionContextValue | null>(null);

export function FocusReferenceInspectorInteractionProvider({
  children,
  referenceInspectorOpenRef,
}: {
  children: ReactNode;
  referenceInspectorOpenRef: MutableRefObject<boolean>;
}) {
  const setReferenceInspectorOpen = useCallback(
    (open: boolean) => {
      referenceInspectorOpenRef.current = open;
    },
    [referenceInspectorOpenRef],
  );

  const value = useMemo(
    () => ({
      setReferenceInspectorOpen,
    }),
    [setReferenceInspectorOpen],
  );

  return (
    <FocusReferenceInspectorInteractionContext.Provider value={value}>
      {children}
    </FocusReferenceInspectorInteractionContext.Provider>
  );
}

export function useFocusReferenceInspectorInteraction() {
  const context = useContext(FocusReferenceInspectorInteractionContext);
  if (!context) {
    throw new Error(
      "useFocusReferenceInspectorInteraction must be used within FocusReferenceInspectorInteractionProvider",
    );
  }
  return context;
}
