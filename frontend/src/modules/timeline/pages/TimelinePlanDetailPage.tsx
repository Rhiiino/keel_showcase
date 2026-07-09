// keel_web/src/modules/timeline/pages/TimelinePlanDetailPage.tsx

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useEditorRecordNotFoundRedirect } from "../../../hooks/useRecordNotFoundRedirect";
import { FormPageLayout } from "../../../views";
import { TimelinePlanForm } from "../components/plans/TimelinePlanForm";
import { TimelinePlanItemEditorModal } from "../components/plans/TimelinePlanItemEditorModal";
import { TimelinePlanItemsListView } from "../components/plans/TimelinePlanItemsListView";
import { useTimelinePlanEditor } from "../hooks/useTimelinePlanEditor";
import { buildDefaultTimelinePlanItemCreatePayload } from "../lib/timelinePlanItemDefaults";
import {
  collectTimelinePlanItemIds,
  resolveTimelinePlanItemSortOrderAfterInsert,
} from "../lib/timelinePlanItemSortOrder";
import {
  createTimelinePlanItem,
  deleteTimelinePlanItem,
  reorderTimelinePlanItem,
  timelineQueryKeys,
  updateTimelinePlanItem,
  type TimelinePlanItem,
  type TimelinePlanItemUpdatePayload,
} from "../api";

export function TimelinePlanDetailPage() {
  const { planId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const editor = useTimelinePlanEditor(planId, {
    onDeleteSuccess: () => navigate("/timeline/plan"),
  });

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TimelinePlanItem | null>(null);
  const [autoEditTitleItemId, setAutoEditTitleItemId] = useState<number | null>(null);

  const deleteItemMutation = useMutation({
    mutationFn: deleteTimelinePlanItem,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: timelineQueryKeys.all });
      void editor.refetchPlan();
    },
  });

  const createItemMutation = useMutation({
    mutationFn: () => {
      if (!editor.plan) {
        throw new Error("Timeline plan is not ready.");
      }
      return createTimelinePlanItem(
        editor.plan.id,
        buildDefaultTimelinePlanItemCreatePayload(
          editor.plan.start_date,
          editor.plan.end_date,
        ),
      );
    },
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: timelineQueryKeys.all });
      void editor.refetchPlan();
      setAutoEditTitleItemId(created.id);
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({
      itemId,
      payload,
    }: {
      itemId: number;
      payload: TimelinePlanItemUpdatePayload;
    }) => updateTimelinePlanItem(itemId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: timelineQueryKeys.all });
      void editor.refetchPlan();
    },
  });

  const reorderItemMutation = useMutation({
    mutationFn: async ({
      itemId,
      insertIndex,
    }: {
      itemId: number;
      insertIndex: number;
    }) => {
      const itemIds = collectTimelinePlanItemIds(editor.items);
      const sortOrder = resolveTimelinePlanItemSortOrderAfterInsert(
        itemIds,
        itemId,
        insertIndex,
      );
      if (sortOrder == null) {
        return null;
      }
      return reorderTimelinePlanItem(itemId, { sort_order: sortOrder });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: timelineQueryKeys.all });
      void editor.refetchPlan();
    },
  });

  const handleReorderItem = useCallback(
    (itemId: number, insertIndex: number) => {
      reorderItemMutation.mutate({ itemId, insertIndex });
    },
    [reorderItemMutation],
  );

  const handleUpdateItem = useCallback(
    (itemId: number, payload: TimelinePlanItemUpdatePayload) => {
      updateItemMutation.mutate({ itemId, payload });
    },
    [updateItemMutation],
  );

  const handleOpenItemModal = useCallback((item: TimelinePlanItem) => {
    setSelectedItem(item);
    setItemModalOpen(true);
  }, []);

  const inlineEditPending =
    createItemMutation.isPending || updateItemMutation.isPending || editor.pending;

  const redirecting = useEditorRecordNotFoundRedirect(editor, {
    listPath: "/timeline/plan",
    notice: "That timeline plan could not be found.",
  });

  if (redirecting || editor.isLoading) {
    return (
      <FormPageLayout backHref="/timeline/plan" backLabel="Back to plans">
        <p className="text-sm text-stone-500">Loading…</p>
      </FormPageLayout>
    );
  }

  if (!editor.values || !editor.plan) {
    return null;
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col">
        <FormPageLayout
          backHref="/timeline/plan"
          backLabel="Back to plans"
          isDirty={editor.isDirty}
          onDiscard={editor.handleDiscard}
          onSave={() => void editor.save()}
          isSaving={editor.isSaving}
          canSave={editor.canSave}
          saveError={editor.saveError}
          maxWidth="7xl"
          fillHeight
        >
          <div className="flex min-h-0 flex-1 flex-col gap-8 lg:flex-row lg:gap-10">
            <div className="w-full shrink-0 lg:w-72 xl:w-80">
              <TimelinePlanForm
                values={editor.values}
                onChange={editor.setValues}
                disabled={editor.pending}
                showDelete
                onDelete={() => void editor.deletePlan()}
                deleteDisabled={editor.pending}
                compact
              />
            </div>

            <div className="min-h-0 min-w-0 flex-1 lg:max-h-full">
              <TimelinePlanItemsListView
                items={editor.items}
                planStartDate={editor.plan.start_date}
                planEndDate={editor.plan.end_date}
                onCreateItem={() => createItemMutation.mutate()}
                onUpdateItem={handleUpdateItem}
                onRowClick={handleOpenItemModal}
                onDelete={(itemId) => deleteItemMutation.mutate(itemId)}
                onReorder={handleReorderItem}
                createDisabled={inlineEditPending}
                updateDisabled={inlineEditPending}
                deleteDisabled={deleteItemMutation.isPending}
                reorderDisabled={reorderItemMutation.isPending || editor.pending}
                autoEditTitleItemId={autoEditTitleItemId}
                onAutoEditTitleHandled={() => setAutoEditTitleItemId(null)}
                fillHeight
              />
            </div>
          </div>
        </FormPageLayout>
      </div>

      <TimelinePlanItemEditorModal
        open={itemModalOpen}
        planId={editor.plan.id}
        planStartDate={editor.plan.start_date}
        planEndDate={editor.plan.end_date}
        item={selectedItem}
        mode="edit"
        onClose={() => {
          setItemModalOpen(false);
          setSelectedItem(null);
          void editor.refetchPlan();
        }}
      />
    </>
  );
}
