// stack_sandbox/frontend_web/src/modules/agents/context/AgentEditorContext.tsx

// Shared save/dirty state between the page header and agent detail panel.

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

export type AgentEditorControls = {
  isDirty: boolean;
  isSaving: boolean;
  saveError: string | null;
  save: () => Promise<void>;
  discard: () => void;
};

type AgentEditorContextValue = {
  controls: AgentEditorControls | null;
  setControls: Dispatch<SetStateAction<AgentEditorControls | null>>;
};

const AgentEditorContext = createContext<AgentEditorContextValue | null>(null);

export function AgentEditorProvider({ children }: { children: ReactNode }) {
  const [controls, setControls] = useState<AgentEditorControls | null>(null);
  const value = useMemo(
    () => ({ controls, setControls }),
    [controls],
  );

  return (
    <AgentEditorContext.Provider value={value}>
      {children}
    </AgentEditorContext.Provider>
  );
}

export function useAgentEditorContext() {
  const context = useContext(AgentEditorContext);
  if (!context) {
    throw new Error("useAgentEditorContext must be used within AgentEditorProvider");
  }
  return context;
}

export function useOptionalAgentEditorControls() {
  return useContext(AgentEditorContext)?.controls ?? null;
}
