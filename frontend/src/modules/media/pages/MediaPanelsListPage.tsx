// keel_web/src/modules/media/pages/MediaPanelsListPage.tsx

// List of curated media display panels.

import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { IconPlusButton } from "../../../components/buttons/IconPlusButton";
import { RouteNoticeBanner } from "../../../components/RouteNoticeBanner";
import { ListPageLayout } from "../../../views/list/ListPageLayout";
import { ApiError } from "../../../lib/api";
import { MediaViewToggle } from "../components/browse";
import {
  MediaPanelsCarouselView,
  MediaPanelsListView,
} from "../components/panels";
import {
  createMediaPanel,
  deleteMediaPanel,
  fetchMediaPanel,
  fetchMediaPanels,
  mediaQueryKeys,
  updateMediaPanelName,
} from "../api";
import type { MediaViewMode } from "../lib/mediaView";
import {
  readPanelViewMode,
  writePanelViewMode,
  type PanelViewMode,
} from "../lib/panelView";

export function MediaPanelsListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [viewMode, setViewMode] = useState<PanelViewMode>(() => readPanelViewMode());

  const panelsQuery = useQuery({
    queryKey: mediaQueryKeys.panels(),
    queryFn: () => fetchMediaPanels(),
  });

  const panels = panelsQuery.data ?? [];
  const panelIds = useMemo(() => panels.map((panel) => panel.id), [panels]);

  const panelDetailsQueries = useQueries({
    queries: panelIds.map((panelId) => ({
      queryKey: mediaQueryKeys.panel(panelId),
      queryFn: () => fetchMediaPanel(panelId),
      enabled: panelIds.length > 0,
    })),
  });

  const panelDetailsById = useMemo(() => {
    const map = new Map<
      string,
      NonNullable<(typeof panelDetailsQueries)[number]["data"]>
    >();
    panelDetailsQueries.forEach((query, index) => {
      if (query.data) {
        map.set(panelIds[index]!, query.data);
      }
    });
    return map;
  }, [panelDetailsQueries, panelIds]);

  const panelDetailsLoading = panelDetailsQueries.some((query) => query.isLoading);

  const invalidatePanels = () => {
    void queryClient.invalidateQueries({ queryKey: mediaQueryKeys.panels() });
  };

  const deleteMutation = useMutation({
    mutationFn: deleteMediaPanel,
    onSuccess: () => {
      setActionError(null);
      invalidatePanels();
    },
    onError: (error) => {
      setActionError(error instanceof ApiError ? error.message : "Delete failed.");
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ panelId, name }: { panelId: string; name: string }) =>
      updateMediaPanelName(panelId, name),
    onSuccess: () => {
      setActionError(null);
      invalidatePanels();
    },
    onError: (error) => {
      setActionError(error instanceof ApiError ? error.message : "Rename failed.");
    },
  });

  const handleViewModeChange = (mode: MediaViewMode) => {
    setViewMode(mode);
    writePanelViewMode(mode);
  };

  const handleCreate = async () => {
    setCreating(true);
    setActionError(null);
    try {
      const panel = await createMediaPanel("New panel");
      invalidatePanels();
      navigate(`/media/panels/${panel.id}`);
    } catch (error) {
      setActionError(error instanceof ApiError ? error.message : "Create failed.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <ListPageLayout
      title="Display panels"
      recordCount={panelsQuery.data?.length}
      subtitle="Curated grid boards for visualizing selected files."
      actions={
        <>
          <MediaViewToggle viewMode={viewMode} onChange={handleViewModeChange} />
          <IconPlusButton
            onClick={() => void handleCreate()}
            ariaLabel="Create panel"
            title="Create panel"
            disabled={creating}
          />
        </>
      }
    >
      <RouteNoticeBanner />
      {actionError ? <p className="mb-4 text-sm text-red-400">{actionError}</p> : null}

      {panelsQuery.isLoading ? (
        <p className="text-sm text-stone-500">Loading panels…</p>
      ) : panelsQuery.isError ? (
        <p className="text-sm text-red-400">Failed to load panels.</p>
      ) : viewMode === "carousel" ? (
        <MediaPanelsCarouselView
          panels={panels}
          panelDetailsById={panelDetailsById}
          onDelete={(panelId) => deleteMutation.mutate(panelId)}
          deleteDisabled={deleteMutation.isPending}
          onRename={(panelId, name) => renameMutation.mutate({ panelId, name })}
          renameDisabled={renameMutation.isPending}
        />
      ) : (
        <MediaPanelsListView
          panels={panels}
          panelDetailsById={panelDetailsById}
          panelDetailsLoading={panelDetailsLoading}
          onRename={(panelId, name) => renameMutation.mutate({ panelId, name })}
          renameDisabled={renameMutation.isPending}
          onDelete={(panelId) => deleteMutation.mutate(panelId)}
          deleteDisabled={deleteMutation.isPending}
        />
      )}
    </ListPageLayout>
  );
}
