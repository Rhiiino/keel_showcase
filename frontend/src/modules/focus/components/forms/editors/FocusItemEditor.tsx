// src/modules/focus/components/forms/editors/FocusItemEditor.tsx

// Editor for a single focus item (task) node.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";

import { ProjectDetailInlineTitle } from "../../../../projects/components/detail";
import {
  DEFAULT_TITLE_FONT_KEY,
  type ProjectTitleFontKey,
} from "../../../../projects/lib/project/appearance";
import {
  fetchFocusNode,
  focusQueryKeys,
  updateFocusNode,
} from "../../../api";
import {
  isFocusNodeStatus,
  type FocusNodeStatus,
} from "../../../lib/focus";
import { FocusNodeStatusSelect } from "../fields";
import { FocusWorkOrderInput } from "../fields";

export type FocusItemEditorHandle = {
  isFormDirty: () => boolean;
  discardForm: () => void;
  saveForm: () => void;
};

type FocusItemEditorProps = {
  itemId: number;
  deferConstellationRefresh?: boolean;
};

export const FocusItemEditor = forwardRef<FocusItemEditorHandle, FocusItemEditorProps>(
  function FocusItemEditor({ itemId, deferConstellationRefresh = false }, ref) {
    const queryClient = useQueryClient();
    const [titleDraft, setTitleDraft] = useState("");
    const [titleFontDraft, setTitleFontDraft] =
      useState<ProjectTitleFontKey>(DEFAULT_TITLE_FONT_KEY);
    const [notesDraft, setNotesDraft] = useState("");
    const [statusDraft, setStatusDraft] = useState<FocusNodeStatus>("active");
    const [workOrderDraft, setWorkOrderDraft] = useState<number | null>(null);

    const itemQuery = useQuery({
      queryKey: focusQueryKeys.node(itemId),
      queryFn: () => fetchFocusNode(itemId),
      enabled: Number.isFinite(itemId) && itemId > 0,
    });

    const item = itemQuery.data;

    const applyItemToDrafts = useCallback((record: NonNullable<typeof item>) => {
      setTitleDraft(record.title);
      setTitleFontDraft(DEFAULT_TITLE_FONT_KEY);
      const nextStatus = record.status ?? "active";
      setStatusDraft(isFocusNodeStatus(nextStatus) ? nextStatus : "active");
      setNotesDraft(record.notes ?? "");
      setWorkOrderDraft(record.work_order);
    }, []);

    useEffect(() => {
      if (item) {
        applyItemToDrafts(item);
      }
    }, [
      applyItemToDrafts,
      item?.id,
      item?.title,
      item?.notes,
      item?.status,
      item?.work_order,
    ]);

    const { isFormDirty, canSaveForm } = useMemo(() => {
      if (!item) {
        return { isFormDirty: false, canSaveForm: false };
      }

      const trimmedTitle = titleDraft.trim();
      const trimmedNotes = notesDraft.trim();
      const savedStatus = isFocusNodeStatus(item.status ?? "active")
        ? (item.status as FocusNodeStatus)
        : "active";
      const savedNotes = item.notes ?? "";

      const isFormDirty =
        trimmedTitle !== item.title ||
        trimmedNotes !== savedNotes ||
        statusDraft !== savedStatus ||
        workOrderDraft !== item.work_order;

      return {
        isFormDirty,
        canSaveForm: isFormDirty && trimmedTitle.length > 0,
      };
    }, [item, notesDraft, statusDraft, titleDraft, workOrderDraft]);

    const invalidate = useCallback(() => {
      if (deferConstellationRefresh) {
        void queryClient.invalidateQueries({ queryKey: focusQueryKeys.node(itemId) });
        return;
      }
      void queryClient.invalidateQueries({ queryKey: focusQueryKeys.all });
    }, [deferConstellationRefresh, itemId, queryClient]);

    const updateItemMutation = useMutation({
      mutationFn: () =>
        updateFocusNode(itemId, {
          title: titleDraft.trim(),
          notes: notesDraft.trim(),
          status: statusDraft,
          work_order: workOrderDraft,
        }),
      onSuccess: invalidate,
    });

    const handleDiscardForm = useCallback(() => {
      if (item) {
        applyItemToDrafts(item);
      }
    }, [applyItemToDrafts, item]);

    const handleSaveForm = useCallback(() => {
      if (!canSaveForm) {
        return;
      }
      updateItemMutation.mutate();
    }, [canSaveForm, updateItemMutation]);

    useImperativeHandle(
      ref,
      () => ({
        isFormDirty: () => isFormDirty,
        discardForm: handleDiscardForm,
        saveForm: handleSaveForm,
      }),
      [handleDiscardForm, handleSaveForm, isFormDirty],
    );

    if (itemQuery.isLoading) {
      return <p className="text-sm text-white/50">Loading task…</p>;
    }

    if (itemQuery.isError || !item || item.kind !== "item") {
      return <p className="text-sm text-rose-300">Task not found.</p>;
    }

    const pending = updateItemMutation.isPending;

    return (
      <div className="flex flex-col gap-6">
        <header className="relative min-w-0">
          <div
            className={[
              "absolute right-0 top-0 flex items-center gap-2 transition-opacity duration-150",
              isFormDirty
                ? "pointer-events-auto opacity-100"
                : "pointer-events-none opacity-0",
            ].join(" ")}
          >
            <button
              type="button"
              onClick={handleDiscardForm}
              disabled={pending}
              tabIndex={isFormDirty ? 0 : -1}
              aria-hidden={!isFormDirty}
              className={[
                "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                pending
                  ? "cursor-not-allowed text-white/30"
                  : "text-white/55 ring-1 ring-white/15 hover:bg-white/[0.05] hover:text-white/80",
              ].join(" ")}
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleSaveForm}
              disabled={pending || !canSaveForm}
              tabIndex={isFormDirty ? 0 : -1}
              aria-hidden={!isFormDirty}
              className="rounded-lg bg-sky-500/90 px-4 py-1.5 text-sm font-medium text-stone-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save"}
            </button>
          </div>

          {updateItemMutation.isError ? (
            <p className="mt-2 text-right text-sm text-rose-300">
              {updateItemMutation.error.message}
            </p>
          ) : null}

          <div className={["min-w-0", isFormDirty ? "pr-40" : ""].join(" ")}>
            <ProjectDetailInlineTitle
              value={titleDraft}
              onChange={setTitleDraft}
              titleFontDraft={titleFontDraft}
              onTitleFontDraftChange={setTitleFontDraft}
              disabled={pending}
              titleClassName="break-all text-2xl font-semibold"
              inputToneClassName="text-white/95 placeholder:text-white/30"
            />
          </div>
        </header>

        <div className="space-y-4">
          <div>
            <label
              htmlFor={`focus-item-notes-${itemId}`}
              className="text-xs font-medium uppercase tracking-wide text-white/40"
            >
              Notes
            </label>
            <textarea
              id={`focus-item-notes-${itemId}`}
              value={notesDraft}
              onChange={(event) => setNotesDraft(event.target.value)}
              disabled={pending}
              rows={4}
              placeholder="Add notes for this task…"
              className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/85 focus:border-white/20 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label
              htmlFor={`focus-item-status-${itemId}`}
              className="text-xs font-medium uppercase tracking-wide text-white/40"
            >
              Status
            </label>
            <FocusNodeStatusSelect
              id={`focus-item-status-${itemId}`}
              value={statusDraft}
              disabled={pending}
              onChange={setStatusDraft}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label
              htmlFor={`focus-item-work-order-${itemId}`}
              className="text-xs font-medium uppercase tracking-wide text-white/40"
            >
              Work order
            </label>
            <FocusWorkOrderInput
              id={`focus-item-work-order-${itemId}`}
              value={workOrderDraft}
              disabled={pending}
              onChange={setWorkOrderDraft}
            />
          </div>
        </div>
      </div>
    );
  },
);
