// keel_web/src/modules/deleted/components/RecentlyDeletedSettingsTab.tsx

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deletedKeys,
  fetchDeletedConfig,
  fetchDeletedRecords,
  purgeDeletedRecord,
  restoreDeletedRecord,
} from "../api";
import { RecentlyDeletedListView } from "./RecentlyDeletedListView";

export function RecentlyDeletedSettingsTab() {
  const queryClient = useQueryClient();

  const { data: config } = useQuery({
    queryKey: deletedKeys.config(),
    queryFn: fetchDeletedConfig,
  });

  const { data: records = [], isLoading, isError, error } = useQuery({
    queryKey: deletedKeys.list(),
    queryFn: fetchDeletedRecords,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: deletedKeys.all });
  };

  const restoreMutation = useMutation({
    mutationFn: restoreDeletedRecord,
    onSuccess: invalidate,
  });

  const purgeMutation = useMutation({
    mutationFn: purgeDeletedRecord,
    onSuccess: invalidate,
  });

  const actionDisabled = restoreMutation.isPending || purgeMutation.isPending;
  const actionError = restoreMutation.error ?? purgeMutation.error;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <div>
        <h2 className="text-base font-semibold text-stone-100">Recently Deleted</h2>
        <p className="mt-1 text-sm text-stone-500">
          {config
            ? `Items are permanently deleted after ${config.retention_days} days.`
            : "Loading retention settings…"}
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-stone-500">Loading recently deleted items…</p>
      ) : isError ? (
        <p className="text-sm text-red-400">{error.message}</p>
      ) : (
        <RecentlyDeletedListView
          records={records}
          onRestore={(recordId) => restoreMutation.mutate(recordId)}
          onPurge={(recordId) => purgeMutation.mutate(recordId)}
          actionDisabled={actionDisabled}
        />
      )}

      {actionError ? (
        <p className="text-sm text-red-400">{actionError.message}</p>
      ) : null}
    </div>
  );
}
