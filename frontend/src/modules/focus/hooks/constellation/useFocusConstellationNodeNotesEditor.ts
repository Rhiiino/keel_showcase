// keel_web/src/modules/focus/hooks/constellation/useFocusConstellationNodeNotesEditor.ts

import { useCallback, useEffect, useRef, useState } from "react";

import type { FocusConstellationFlowNode } from "../../components/constellation/node";



type UseFocusConstellationNodeNotesEditorParams = {
  selectedNode: FocusConstellationFlowNode;
  onSaveNotes: (nodeId: number, notes: string) => Promise<void>;
  panelRef: React.MutableRefObject<HTMLDivElement | null>;
};



export function useFocusConstellationNodeNotesEditor({
  selectedNode,
  onSaveNotes,
  panelRef,
}: UseFocusConstellationNodeNotesEditorParams) {
  const entityId = selectedNode.data.entityId;
  const [draft, setDraft] = useState(() => selectedNode.data.notes);
  const [isFocused, setIsFocused] = useState(false);
  const draftRef = useRef(selectedNode.data.notes);
  const savedNotesRef = useRef(selectedNode.data.notes);
  const userEditedRef = useRef(false);
  const savingRef = useRef(false);
  const onSaveNotesRef = useRef(onSaveNotes);

  onSaveNotesRef.current = onSaveNotes;
  draftRef.current = draft;

  const setDraftValue = useCallback((value: string) => {
    userEditedRef.current = true;
    draftRef.current = value;
    setDraft(value);
  }, []);

  const saveIfDirty = useCallback(async (targetEntityId: number) => {
    if (savingRef.current || !userEditedRef.current) {
      return;
    }

    const trimmed = draftRef.current.trim();
    if (trimmed === savedNotesRef.current.trim()) {
      userEditedRef.current = false;
      return;
    }

    savingRef.current = true;
    try {
      await onSaveNotesRef.current(targetEntityId, trimmed);
      savedNotesRef.current = trimmed;
      userEditedRef.current = false;
    } finally {
      savingRef.current = false;
    }
  }, []);

  useEffect(() => {
    return () => {
      void saveIfDirty(entityId);
    };
  }, [entityId, saveIfDirty]);

  useEffect(() => {
    if (isFocused || userEditedRef.current) {
      return;
    }

    const notes = selectedNode.data.notes;
    draftRef.current = notes;
    savedNotesRef.current = notes;
    setDraft(notes);
  }, [isFocused, selectedNode.data.notes]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (
        target instanceof Node &&
        panelRef.current?.contains(target)
      ) {
        return;
      }
      void saveIfDirty(entityId);
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [entityId, panelRef, saveIfDirty]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    void saveIfDirty(entityId);
  }, [entityId, saveIfDirty]);

  return {
    draft,
    setDraft: setDraftValue,
    setIsFocused,
    handleBlur,
  };
}
