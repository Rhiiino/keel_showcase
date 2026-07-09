// keel_web/src/modules/projects/components/workspace/context/WorkspaceViewContext.tsx

// Page-level context: canvas registers media/note selection hooks for the side panel.

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type WorkspacePanelNote = {
  id: string;
  title: string;
  text: string;
  borderColor: string;
  hidden: boolean;
};

type WorkspaceNoteActions = {
  addNote: () => void;
  renameNote: (nodeId: string, title: string) => void;
  deleteNote: (nodeId: string) => void;
  toggleNoteVisibility: (nodeId: string) => void;
};

type WorkspaceViewContextValue = {
  /** Selected canvas media node ids (for Files tab highlight when that tab is open). */
  selectedCanvasMediaIds: string[];
  setSelectedCanvasMediaIds: (ids: string[]) => void;
  /** Media id → number of matching nodes on the active workspace canvas. */
  canvasMediaCopyCounts: Record<string, number>;
  setCanvasMediaCopyCounts: (counts: Record<string, number>) => void;
  /** Selected canvas note node ids (for Notes tab row highlight). */
  selectedCanvasNoteIds: string[];
  setSelectedCanvasNoteIds: (ids: string[]) => void;
  /** Deletes media from API and removes matching nodes from the live canvas. */
  deleteWorkspaceMedia: (mediaId: string) => Promise<void>;
  registerDeleteWorkspaceMedia: (
    handler: ((mediaId: string) => Promise<void>) | null,
  ) => void;
  /** Files tab focus: canvas cards for this media id show a white shape glow. */
  filesPanelFocusedMediaId: string | null;
  setFilesPanelFocusedMediaId: (mediaId: string | null) => void;
  /** Live canvas note cards displayed in the Notes tab. */
  workspaceNotes: WorkspacePanelNote[];
  setWorkspaceNotes: (notes: WorkspacePanelNote[]) => void;
  /** Notes tab focus: canvas note cards for this node id show a white shape glow. */
  filesPanelFocusedNoteId: string | null;
  setFilesPanelFocusedNoteId: (nodeId: string | null) => void;
  addWorkspaceNote: () => void;
  renameWorkspaceNote: (nodeId: string, title: string) => void;
  deleteWorkspaceNote: (nodeId: string) => void;
  toggleWorkspaceNoteVisibility: (nodeId: string) => void;
  registerWorkspaceNoteActions: (actions: WorkspaceNoteActions | null) => void;
  resetWorkspacePanelState: () => void;
};

const WorkspaceViewContext = createContext<WorkspaceViewContextValue | null>(
  null,
);

export function WorkspaceViewProvider({ children }: { children: ReactNode }) {
  const [selectedCanvasMediaIds, setSelectedCanvasMediaIds] = useState<string[]>([]);
  const [canvasMediaCopyCounts, setCanvasMediaCopyCounts] = useState<
    Record<string, number>
  >({});
  const [selectedCanvasNoteIds, setSelectedCanvasNoteIds] = useState<string[]>([]);
  const [filesPanelFocusedMediaId, setFilesPanelFocusedMediaId] = useState<string | null>(
    null,
  );
  const [filesPanelFocusedNoteId, setFilesPanelFocusedNoteId] = useState<string | null>(
    null,
  );
  const [workspaceNotes, setWorkspaceNotes] = useState<WorkspacePanelNote[]>([]);
  const deleteWorkspaceMediaRef = useRef<((mediaId: string) => Promise<void>) | null>(
    null,
  );
  const workspaceNoteActionsRef = useRef<WorkspaceNoteActions | null>(null);

  const registerDeleteWorkspaceMedia = useCallback(
    (handler: ((mediaId: string) => Promise<void>) | null) => {
      deleteWorkspaceMediaRef.current = handler;
    },
    [],
  );

  const deleteWorkspaceMedia = useCallback(async (mediaId: string) => {
    const handler = deleteWorkspaceMediaRef.current;
    if (!handler) {
      throw new Error("Workspace canvas is not ready.");
    }
    await handler(mediaId);
  }, []);

  const registerWorkspaceNoteActions = useCallback((actions: WorkspaceNoteActions | null) => {
    workspaceNoteActionsRef.current = actions;
  }, []);

  const addWorkspaceNote = useCallback(() => {
    workspaceNoteActionsRef.current?.addNote();
  }, []);

  const renameWorkspaceNote = useCallback((nodeId: string, title: string) => {
    workspaceNoteActionsRef.current?.renameNote(nodeId, title);
  }, []);

  const deleteWorkspaceNote = useCallback((nodeId: string) => {
    workspaceNoteActionsRef.current?.deleteNote(nodeId);
  }, []);

  const toggleWorkspaceNoteVisibility = useCallback((nodeId: string) => {
    workspaceNoteActionsRef.current?.toggleNoteVisibility(nodeId);
  }, []);

  const resetWorkspacePanelState = useCallback(() => {
    setSelectedCanvasMediaIds([]);
    setCanvasMediaCopyCounts({});
    setSelectedCanvasNoteIds([]);
    setFilesPanelFocusedMediaId(null);
    setFilesPanelFocusedNoteId(null);
    setWorkspaceNotes([]);
  }, []);

  const value = useMemo(
    () => ({
      selectedCanvasMediaIds,
      setSelectedCanvasMediaIds,
      canvasMediaCopyCounts,
      setCanvasMediaCopyCounts,
      selectedCanvasNoteIds,
      setSelectedCanvasNoteIds,
      deleteWorkspaceMedia,
      registerDeleteWorkspaceMedia,
      filesPanelFocusedMediaId,
      setFilesPanelFocusedMediaId,
      workspaceNotes,
      setWorkspaceNotes,
      filesPanelFocusedNoteId,
      setFilesPanelFocusedNoteId,
      addWorkspaceNote,
      renameWorkspaceNote,
      deleteWorkspaceNote,
      toggleWorkspaceNoteVisibility,
      registerWorkspaceNoteActions,
      resetWorkspacePanelState,
    }),
    [
      selectedCanvasMediaIds,
      canvasMediaCopyCounts,
      selectedCanvasNoteIds,
      deleteWorkspaceMedia,
      registerDeleteWorkspaceMedia,
      filesPanelFocusedMediaId,
      workspaceNotes,
      filesPanelFocusedNoteId,
      addWorkspaceNote,
      renameWorkspaceNote,
      deleteWorkspaceNote,
      toggleWorkspaceNoteVisibility,
      registerWorkspaceNoteActions,
      resetWorkspacePanelState,
    ],
  );

  return (
    <WorkspaceViewContext.Provider value={value}>
      {children}
    </WorkspaceViewContext.Provider>
  );
}

export function useWorkspaceViewContext(): WorkspaceViewContextValue {
  const context = useContext(WorkspaceViewContext);
  if (!context) {
    throw new Error("useWorkspaceViewContext must be used within WorkspaceViewProvider");
  }
  return context;
}
