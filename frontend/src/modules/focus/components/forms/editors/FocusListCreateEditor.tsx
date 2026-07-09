// src/modules/focus/components/forms/editors/FocusListCreateEditor.tsx

// Blank focus list form that creates a parent-less node from the standard editor header.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  DEFAULT_TITLE_FONT_KEY,
  type ProjectTitleFontKey,
} from "../../../../projects/lib/project/appearance";
import { createFocusList, focusQueryKeys } from "../../../api";
import type { FocusNodeStatus } from "../../../lib/focus";
import { FocusListEditorHeader } from "./FocusListEditorHeader";
import type { FocusListEditorHandle } from "./FocusListEditor";

export const FocusListCreateEditor = forwardRef<FocusListEditorHandle>(
  function FocusListCreateEditor(_, ref) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [titleDraft, setTitleDraft] = useState("");
  const [notesDraft, setNotesDraft] = useState("");
  const [titleFontDraft, setTitleFontDraft] =
    useState<ProjectTitleFontKey>(DEFAULT_TITLE_FONT_KEY);
  const [statusDraft, setStatusDraft] = useState<FocusNodeStatus>("active");
  const [workOrderDraft, setWorkOrderDraft] = useState<number | null>(null);
  const [tagIdsDraft, setTagIdsDraft] = useState<number[]>([]);
  const [nodeColorDraft, setNodeColorDraft] = useState<string | null>(null);
  const [createdListId, setCreatedListId] = useState<number | null>(null);

  const isFormDirty = useMemo(
    () =>
      titleDraft.trim().length > 0 ||
      notesDraft.trim().length > 0 ||
      titleFontDraft !== DEFAULT_TITLE_FONT_KEY ||
      statusDraft !== "active" ||
      workOrderDraft !== null ||
      tagIdsDraft.length > 0 ||
      nodeColorDraft !== null,
    [
      nodeColorDraft,
      notesDraft,
      statusDraft,
      tagIdsDraft,
      titleDraft,
      titleFontDraft,
      workOrderDraft,
    ],
  );

  const handleDiscard = () => {
    setTitleDraft("");
    setNotesDraft("");
    setTitleFontDraft(DEFAULT_TITLE_FONT_KEY);
    setStatusDraft("active");
    setWorkOrderDraft(null);
    setTagIdsDraft([]);
    setNodeColorDraft(null);
  };

  const createMutation = useMutation({
    mutationFn: () =>
      createFocusList({
        title: titleDraft.trim(),
        notes: notesDraft.trim(),
        status: statusDraft,
        work_order: workOrderDraft,
        tag_ids: tagIdsDraft,
        node_color_hex: nodeColorDraft,
        title_font_key:
          titleFontDraft === DEFAULT_TITLE_FONT_KEY ? null : titleFontDraft,
      }),
    onSuccess: async (createdList) => {
      await queryClient.invalidateQueries({ queryKey: focusQueryKeys.all });
      handleDiscard();
      setCreatedListId(createdList.id);
    },
  });

  useEffect(() => {
    if (createdListId === null || isFormDirty) {
      return;
    }
    navigate(`/focus/lists/${createdListId}`, { replace: true });
  }, [createdListId, isFormDirty, navigate]);

  useImperativeHandle(
    ref,
    () => ({
      isFormDirty: () => isFormDirty,
      discardForm: handleDiscard,
      saveForm: () => createMutation.mutate(),
    }),
    [createMutation, isFormDirty],
  );

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <FocusListEditorHeader
        listId={0}
        isFormDirty={isFormDirty}
        canSaveForm={titleDraft.trim().length > 0}
        listPending={createMutation.isPending}
        saveErrorMessage={
          createMutation.isError ? createMutation.error.message : null
        }
        titleDraft={titleDraft}
        onTitleDraftChange={setTitleDraft}
        titlePlaceholder="New focus node"
        saveDisabledMessage="Add a title before creating this node."
        titleFontDraft={titleFontDraft}
        onTitleFontDraftChange={setTitleFontDraft}
        notesDraft={notesDraft}
        onNotesDraftChange={setNotesDraft}
        statusDraft={statusDraft}
        onStatusDraftChange={setStatusDraft}
        workOrderDraft={workOrderDraft}
        onWorkOrderDraftChange={setWorkOrderDraft}
        tagIdsDraft={tagIdsDraft}
        onTagIdsDraftChange={setTagIdsDraft}
        nodeColorDraft={nodeColorDraft}
        onNodeColorDraftChange={setNodeColorDraft}
        onDiscard={handleDiscard}
        onSave={() => createMutation.mutate()}
        saveLabel="Create"
        savingLabel="Creating…"
      />
      <p className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/40">
        Create this node first, then add entries from the full form.
      </p>
    </div>
  );
  },
);
