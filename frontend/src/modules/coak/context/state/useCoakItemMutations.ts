// keel_web/src/modules/coak/context/state/useCoakItemMutations.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { mediaQueryKeys } from "../../../media/api";
import {
  coakQueryKeys,
  createCoakItem,
  deleteCoakItem,
  updateCoakItem,
  updateCoakRecord,
  type CoakItem,
} from "../../api";

export function useCoakItemMutations(recordId: number) {
  const queryClient = useQueryClient();

  const invalidateItems = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: coakQueryKeys.items(recordId) });
  }, [queryClient, recordId]);

  const invalidateRecord = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: coakQueryKeys.record(recordId) });
    await queryClient.invalidateQueries({ queryKey: coakQueryKeys.records() });
  }, [queryClient, recordId]);

  const invalidateTags = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: coakQueryKeys.tags(recordId) });
  }, [queryClient, recordId]);

  const createItemMutation = useMutation({
    mutationFn: (payload: Parameters<typeof createCoakItem>[1]) =>
      createCoakItem(recordId, payload),
    onSuccess: (created) => {
      queryClient.setQueryData<CoakItem[]>(coakQueryKeys.items(recordId), (current) =>
        current ? [...current, created] : [created],
      );
      void invalidateItems();
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({
      itemId,
      payload,
    }: {
      itemId: number;
      payload: Parameters<typeof updateCoakItem>[2];
    }) => updateCoakItem(recordId, itemId, payload),
    onSuccess: (updated, variables) => {
      const previousMediaId = queryClient
        .getQueryData<CoakItem[]>(coakQueryKeys.items(recordId))
        ?.find((item) => item.id === variables.itemId)?.media_id;

      queryClient.setQueryData<CoakItem[]>(coakQueryKeys.items(recordId), (current) =>
        current
          ? current.map((item) => (item.id === variables.itemId ? updated : item))
          : current,
      );

      if (variables.payload.media_id !== undefined) {
        if (previousMediaId) {
          void queryClient.invalidateQueries({
            queryKey: mediaQueryKeys.detail(previousMediaId),
          });
        }
        if (updated.media_id) {
          void queryClient.invalidateQueries({
            queryKey: mediaQueryKeys.detail(updated.media_id),
          });
        }
      }

      void invalidateItems();
      if (variables.payload.tag_ids !== undefined) {
        void invalidateTags();
      }
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: number) => deleteCoakItem(recordId, itemId),
    onSuccess: invalidateItems,
  });

  const updateRecordMutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateCoakRecord>[1]) =>
      updateCoakRecord(recordId, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(coakQueryKeys.record(recordId), updated);
      void invalidateRecord();
    },
  });

  return {
    createItemMutation,
    updateItemMutation,
    deleteItemMutation,
    updateRecordMutation,
    recordUpdatePending: updateRecordMutation.isPending,
    invalidateTags,
  };
}

export type CoakItemMutations = ReturnType<typeof useCoakItemMutations>;
