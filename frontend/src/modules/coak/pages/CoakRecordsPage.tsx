// keel_web/src/modules/coak/pages/CoakRecordsPage.tsx

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { IconPlusButton } from "../../../components/buttons/IconPlusButton";
import { RouteNoticeBanner } from "../../../components/RouteNoticeBanner";
import { ApiError } from "../../../lib/api";
import { CARD_GALLERY_GRID_CLASS } from "../../../views/cards/cardGridClasses";
import { CardGalleryPageLayout } from "../../../views/cards/CardGalleryPageLayout";
import {
  coakQueryKeys,
  coakRecordPath,
  createCoakRecord,
  deleteCoakRecord,
  fetchCoakRecords,
  updateCoakRecord,
} from "../api";
import { CoakRecordCard } from "../components/cards/CoakRecordCard";
import { coakRecordMatchesSearch, nextDefaultCoakRecordName } from "../lib/coakRecordSearch";

export function CoakRecordsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const recordsQuery = useQuery({
    queryKey: coakQueryKeys.records(),
    queryFn: fetchCoakRecords,
  });

  const records = recordsQuery.data ?? [];
  const visibleRecords = useMemo(
    () => records.filter((record) => coakRecordMatchesSearch(record, searchQuery)),
    [records, searchQuery],
  );

  const createMutation = useMutation({
    mutationFn: createCoakRecord,
    onSuccess: (record) => {
      void queryClient.invalidateQueries({ queryKey: coakQueryKeys.all });
      navigate(coakRecordPath(record));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      recordId,
      colorHex,
    }: {
      recordId: number;
      colorHex: string | null;
    }) =>
      updateCoakRecord(recordId, {
        color_hex: colorHex,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: coakQueryKeys.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCoakRecord,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: coakQueryKeys.all });
    },
  });

  const actionError =
    createMutation.isError || updateMutation.isError || deleteMutation.isError
      ? (() => {
          const error =
            createMutation.error ?? updateMutation.error ?? deleteMutation.error;
          if (error instanceof ApiError) {
            return error.message;
          }
          if (error instanceof Error) {
            return error.message;
          }
          return "Something went wrong.";
        })()
      : null;

  const handleCreate = () => {
    createMutation.mutate({
      name: nextDefaultCoakRecordName(records),
    });
  };

  const pending =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <CardGalleryPageLayout
      title="C.O.A.K."
      recordCount={!recordsQuery.isLoading ? records.length : undefined}
      subtitle="Culmination of all knowledge — create a record for each topic you want to learn."
      headerActions={
        <IconPlusButton
          onClick={handleCreate}
          ariaLabel="Create record"
          disabled={pending}
        />
      }
      searchId="coak-record-search"
      searchLabel="Search records"
      searchPlaceholder="Search records…"
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      isLoading={recordsQuery.isLoading}
      isError={recordsQuery.isError}
      totalCount={records.length}
      filteredCount={visibleRecords.length}
      loadingMessage="Loading records…"
      errorMessage="Failed to load records."
      emptyMessage="No records yet. Use the plus button to create your first learning workspace."
      noMatchMessage="No records match your search."
      actionError={actionError}
    >
      <RouteNoticeBanner />
      <div className={CARD_GALLERY_GRID_CLASS}>
        {visibleRecords.map((record) => (
          <CoakRecordCard
            key={record.id}
            record={record}
            onDelete={(recordId) => deleteMutation.mutate(recordId)}
            onColorChange={(recordId, colorHex) =>
              updateMutation.mutate({ recordId, colorHex })
            }
            deleteDisabled={deleteMutation.isPending}
            colorDisabled={updateMutation.isPending}
          />
        ))}
      </div>
    </CardGalleryPageLayout>
  );
}
