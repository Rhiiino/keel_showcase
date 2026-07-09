// keel_web/src/modules/projects/components/workspace/context/WorkspaceCanvasContext.tsx

// Provides projectId, save trigger, and canvas appearance settings to workspace nodes.

import type { Edge } from "@xyflow/react";
import { createContext, useContext, useMemo, type ReactNode } from "react";

import {
  WORKSPACE_CANVAS_CONNECTION_STYLE_DEFAULT,
  WORKSPACE_NOTE_COLOR_STYLE_DEFAULT,
  WORKSPACE_NOTE_ITALIC_COLOR_DEFAULT,
  WORKSPACE_TEXT_FONT_SCALE_DEFAULT,
  resolveWorkspaceTextFontSizes,
  type WorkspaceCanvasConnectionStyle,
  type WorkspaceNoteColorStyle,
  type WorkspaceNoteItalicColorPreset,
} from "../../../lib/workspace";

export type PatchWorkspaceEdgesOptions = {
  save?: boolean;
};

export type WorkspaceNoteReferenceOrigin = {
  x: number;
  y: number;
};

type WorkspaceCanvasContextValue = {
  projectId: number;
  requestSave: () => void;
  onSelectNoteColor: (nodeId: string, borderHex: string) => void;
  patchEdges: (recipe: (edges: Edge[]) => Edge[], options?: PatchWorkspaceEdgesOptions) => void;
  beginLabelEdit: (edgeId: string) => void;
  openNoteContextMenu: (nodeId: string, clientX: number, clientY: number) => void;
  openNoteReference: (noteId: string, origin?: WorkspaceNoteReferenceOrigin) => void;
  deleteNote: (nodeId: string) => void;
  createLinkedNote: (sourceNoteId: string, options: { title: string }) => string;
  setNoteBodyEditing: (nodeId: string | null) => void;
  /** Media file focused from the Files tab (white shape glow on matching cards). */
  filesPanelFocusedMediaId: string | null;
  /** Note card focused from the Notes tab (white shape glow on matching cards). */
  filesPanelFocusedNoteId: string | null;
  textFontScale: number;
  textFontSizes: ReturnType<typeof resolveWorkspaceTextFontSizes>;
  connectionStyle: WorkspaceCanvasConnectionStyle;
  noteColorStyle: WorkspaceNoteColorStyle;
  noteItalicColor: WorkspaceNoteItalicColorPreset;
};

const WorkspaceCanvasContext = createContext<WorkspaceCanvasContextValue | null>(
  null,
);

type WorkspaceCanvasProviderProps = {
  projectId: number;
  requestSave: () => void;
  onSelectNoteColor: (nodeId: string, borderHex: string) => void;
  patchEdges: (recipe: (edges: Edge[]) => Edge[], options?: PatchWorkspaceEdgesOptions) => void;
  beginLabelEdit: (edgeId: string) => void;
  openNoteContextMenu: (nodeId: string, clientX: number, clientY: number) => void;
  openNoteReference: (noteId: string, origin?: WorkspaceNoteReferenceOrigin) => void;
  deleteNote: (nodeId: string) => void;
  createLinkedNote: (sourceNoteId: string, options: { title: string }) => string;
  setNoteBodyEditing: (nodeId: string | null) => void;
  filesPanelFocusedMediaId: string | null;
  filesPanelFocusedNoteId: string | null;
  textFontScale?: number;
  connectionStyle?: WorkspaceCanvasConnectionStyle;
  noteColorStyle?: WorkspaceNoteColorStyle;
  noteItalicColor?: WorkspaceNoteItalicColorPreset;
  children: ReactNode;
};

export function WorkspaceCanvasProvider({
  projectId,
  requestSave,
  onSelectNoteColor,
  patchEdges,
  beginLabelEdit,
  openNoteContextMenu,
  openNoteReference,
  deleteNote,
  createLinkedNote,
  setNoteBodyEditing,
  filesPanelFocusedMediaId,
  filesPanelFocusedNoteId,
  textFontScale = WORKSPACE_TEXT_FONT_SCALE_DEFAULT,
  connectionStyle = WORKSPACE_CANVAS_CONNECTION_STYLE_DEFAULT,
  noteColorStyle = WORKSPACE_NOTE_COLOR_STYLE_DEFAULT,
  noteItalicColor = WORKSPACE_NOTE_ITALIC_COLOR_DEFAULT,
  children,
}: WorkspaceCanvasProviderProps) {
  const textFontSizes = useMemo(
    () => resolveWorkspaceTextFontSizes(textFontScale),
    [textFontScale],
  );

  // Memoize so the canvas re-rendering every drag frame does not hand a fresh
  // context value to every node (which would re-render all cards per frame).
  const value = useMemo<WorkspaceCanvasContextValue>(
    () => ({
      projectId,
      requestSave,
      onSelectNoteColor,
      patchEdges,
      beginLabelEdit,
      openNoteContextMenu,
      openNoteReference,
      deleteNote,
      createLinkedNote,
      setNoteBodyEditing,
      filesPanelFocusedMediaId,
      filesPanelFocusedNoteId,
      textFontScale,
      textFontSizes,
      connectionStyle,
      noteColorStyle,
      noteItalicColor,
    }),
    [
      projectId,
      requestSave,
      onSelectNoteColor,
      patchEdges,
      beginLabelEdit,
      openNoteContextMenu,
      openNoteReference,
      deleteNote,
      createLinkedNote,
      setNoteBodyEditing,
      filesPanelFocusedMediaId,
      filesPanelFocusedNoteId,
      textFontScale,
      textFontSizes,
      connectionStyle,
      noteColorStyle,
      noteItalicColor,
    ],
  );

  return (
    <WorkspaceCanvasContext.Provider value={value}>
      {children}
    </WorkspaceCanvasContext.Provider>
  );
}

export function useWorkspaceProjectId(): number {
  const ctx = useContext(WorkspaceCanvasContext);
  if (ctx == null) {
    throw new Error("useWorkspaceProjectId must be used within WorkspaceCanvasProvider");
  }
  return ctx.projectId;
}

export function useWorkspaceRequestSave(): () => void {
  const ctx = useContext(WorkspaceCanvasContext);
  if (ctx == null) {
    throw new Error("useWorkspaceRequestSave must be used within WorkspaceCanvasProvider");
  }
  return ctx.requestSave;
}

export function useWorkspaceSelectNoteColor(): (
  nodeId: string,
  borderHex: string,
) => void {
  const ctx = useContext(WorkspaceCanvasContext);
  if (ctx == null) {
    throw new Error(
      "useWorkspaceSelectNoteColor must be used within WorkspaceCanvasProvider",
    );
  }
  return ctx.onSelectNoteColor;
}

export function useWorkspacePatchEdges(): WorkspaceCanvasContextValue["patchEdges"] {
  const ctx = useContext(WorkspaceCanvasContext);
  if (ctx == null) {
    throw new Error("useWorkspacePatchEdges must be used within WorkspaceCanvasProvider");
  }
  return ctx.patchEdges;
}

export function useWorkspaceBeginLabelEdit(): WorkspaceCanvasContextValue["beginLabelEdit"] {
  const ctx = useContext(WorkspaceCanvasContext);
  if (ctx == null) {
    throw new Error("useWorkspaceBeginLabelEdit must be used within WorkspaceCanvasProvider");
  }
  return ctx.beginLabelEdit;
}

export function useWorkspaceOpenNoteContextMenu(): WorkspaceCanvasContextValue["openNoteContextMenu"] {
  const ctx = useContext(WorkspaceCanvasContext);
  if (ctx == null) {
    throw new Error(
      "useWorkspaceOpenNoteContextMenu must be used within WorkspaceCanvasProvider",
    );
  }
  return ctx.openNoteContextMenu;
}

export function useWorkspaceOpenNoteReference(): WorkspaceCanvasContextValue["openNoteReference"] {
  const ctx = useContext(WorkspaceCanvasContext);
  if (ctx == null) {
    throw new Error(
      "useWorkspaceOpenNoteReference must be used within WorkspaceCanvasProvider",
    );
  }
  return ctx.openNoteReference;
}

export function useWorkspaceDeleteNote(): WorkspaceCanvasContextValue["deleteNote"] {
  const ctx = useContext(WorkspaceCanvasContext);
  if (ctx == null) {
    throw new Error("useWorkspaceDeleteNote must be used within WorkspaceCanvasProvider");
  }
  return ctx.deleteNote;
}

export function useWorkspaceCreateLinkedNote(): WorkspaceCanvasContextValue["createLinkedNote"] {
  const ctx = useContext(WorkspaceCanvasContext);
  if (ctx == null) {
    throw new Error(
      "useWorkspaceCreateLinkedNote must be used within WorkspaceCanvasProvider",
    );
  }
  return ctx.createLinkedNote;
}

export function useWorkspaceSetNoteBodyEditing(): WorkspaceCanvasContextValue["setNoteBodyEditing"] {
  const ctx = useContext(WorkspaceCanvasContext);
  if (ctx == null) {
    throw new Error(
      "useWorkspaceSetNoteBodyEditing must be used within WorkspaceCanvasProvider",
    );
  }
  return ctx.setNoteBodyEditing;
}

/** True when the node is selected and its toolbar should be mounted. */
export function useWorkspaceNodeToolbarVisible(_nodeId: string, selected: boolean): boolean {
  return selected;
}

export function useWorkspaceFilesPanelMediaHighlighted(mediaId: string): boolean {
  const ctx = useContext(WorkspaceCanvasContext);
  if (ctx == null) {
    throw new Error(
      "useWorkspaceFilesPanelMediaHighlighted must be used within WorkspaceCanvasProvider",
    );
  }
  return (
    ctx.filesPanelFocusedMediaId !== null && ctx.filesPanelFocusedMediaId === mediaId
  );
}

export function useWorkspaceFilesPanelNoteHighlighted(nodeId: string): boolean {
  const ctx = useContext(WorkspaceCanvasContext);
  if (ctx == null) {
    throw new Error(
      "useWorkspaceFilesPanelNoteHighlighted must be used within WorkspaceCanvasProvider",
    );
  }
  return (
    ctx.filesPanelFocusedNoteId !== null && ctx.filesPanelFocusedNoteId === nodeId
  );
}

export function useWorkspaceTextFontSizes(): WorkspaceCanvasContextValue["textFontSizes"] {
  const ctx = useContext(WorkspaceCanvasContext);
  if (ctx == null) {
    throw new Error("useWorkspaceTextFontSizes must be used within WorkspaceCanvasProvider");
  }
  return ctx.textFontSizes;
}

export function useWorkspaceConnectionStyle(): WorkspaceCanvasConnectionStyle {
  const ctx = useContext(WorkspaceCanvasContext);
  if (ctx == null) {
    throw new Error("useWorkspaceConnectionStyle must be used within WorkspaceCanvasProvider");
  }
  return ctx.connectionStyle;
}

export function useWorkspaceNoteColorStyle(): WorkspaceNoteColorStyle {
  const ctx = useContext(WorkspaceCanvasContext);
  if (ctx == null) {
    throw new Error("useWorkspaceNoteColorStyle must be used within WorkspaceCanvasProvider");
  }
  return ctx.noteColorStyle;
}

export function useWorkspaceNoteItalicColor(): WorkspaceNoteItalicColorPreset {
  const ctx = useContext(WorkspaceCanvasContext);
  if (ctx == null) {
    throw new Error("useWorkspaceNoteItalicColor must be used within WorkspaceCanvasProvider");
  }
  return ctx.noteItalicColor;
}
