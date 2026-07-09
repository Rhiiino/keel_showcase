// keel_web/src/modules/media/pages/MediaPanelPage.tsx

// Single display panel with grid tiles and edit mode.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { ApiError } from "../../../lib/api";
import { useRecordNotFoundRedirect } from "../../../hooks/useRecordNotFoundRedirect";
import { writeModuleSubNavPath } from "../../../app/nav/moduleSubNavStorage";
import {
  addMediaPanelItem,
  deleteMediaPanel,
  fetchMediaPanel,
  mediaQueryKeys,
  removeMediaPanelItem,
  swapMediaPanelItems,
  updateMediaPanelItemBorderColor,
  updateMediaPanelItemPreview,
  updateMediaPanelName,
  type MediaObject,
  type MediaPanelItem,
  type MediaPanelLayoutItemPayload,
} from "../api";
import { MediaObjectPickerDialog } from "../components/pickers";
import {
  MediaPanelGrid,
  MediaPanelToolbar,
} from "../components/panels";
import {
  MediaPanelTileContextMenu,
  type MediaPanelTileContextMenuState,
} from "../components/panels/contextMenu/MediaPanelTileContextMenu";
import {
  MediaPanelTileViewModal,
  type MediaPanelTileViewModalState,
} from "../components/panels/contextMenu/MediaPanelTileViewModal";
import { panelTileRectFromDomRect, type PanelTileRect } from "../components/panels/contextMenu/panelTileRect";
import { useMediaPanelGridResize } from "../hooks/useMediaPanelGridResize";
import { useMediaPanelPreviewDraft } from "../hooks/useMediaPanelPreviewDraft";
import { useMediaPanelViewportHeight } from "../hooks/useMediaPanelViewportHeight";
import { rectEndY } from "../lib/panelGrid";
import {
  PANEL_EMPTY_SHELL_BAND_ROWS,
  PANEL_GRID_SHELL_PADDING_PX,
  panelGridDisplayRowUnitPx,
  panelGridEmptyShellMinHeightPx,
  panelGridViewportContentHeightPx,
  panelGridViewportMinHeightPx,
  type PanelGapAppendPlacement,
} from "../lib/panelGridMetrics";
import type { PanelEdgeAppendPlan } from "../lib/panelGridEdgeAppend";
import {
  computeSplitPlacements,
  type SplitZone,
} from "../lib/panelGridSplit";
import { panelTilePreviewPayload } from "../lib/panelTilePreview";

const SWAP_ANIM_MS = 280;

type AppendAddPayload = { mode: "append"; mediaId: string };
type AppendGapAddPayload = {
  mode: "append-gap";
  placement: PanelGapAppendPlacement;
  mediaId: string;
};
type AppendEdgeAddPayload = {
  mode: "append-edge";
  plan: PanelEdgeAppendPlan;
  mediaId: string;
};
type SplitAddPayload = {
  mode: "split";
  mediaId: string;
  existing: MediaPanelLayoutItemPayload;
  newSlot: Omit<MediaPanelLayoutItemPayload, "id">;
};

type AddItemPayload =
  | AppendAddPayload
  | AppendGapAddPayload
  | AppendEdgeAddPayload
  | SplitAddPayload;

type PendingPanelAdd =
  | { mode: "append" }
  | { mode: "append-gap"; placement: PanelGapAppendPlacement }
  | { mode: "append-edge"; plan: PanelEdgeAppendPlan };

type SplitInlinePick = {
  itemId: string;
  zone: SplitZone;
  existing: MediaPanelLayoutItemPayload;
  newSlot: Omit<MediaPanelLayoutItemPayload, "id">;
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function MediaPanelPage() {
  const { panelId = "" } = useParams<{ panelId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const gridNodeRef = useRef<HTMLDivElement | null>(null);

  const [editMode, setEditMode] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingAdd, setPendingAdd] = useState<PendingPanelAdd | null>(null);
  const [splitInlinePick, setSplitInlinePick] = useState<SplitInlinePick | null>(null);
  const [panelName, setPanelName] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [tileContextMenu, setTileContextMenu] = useState<MediaPanelTileContextMenuState>(null);
  const [tileViewModal, setTileViewModal] = useState<MediaPanelTileViewModalState>(null);
  const [flippedItemId, setFlippedItemId] = useState<string | null>(null);
  const [swapSourceId, setSwapSourceId] = useState<string | null>(null);
  const [swapAnimatingIds, setSwapAnimatingIds] = useState<string[] | null>(null);
  const [swapAnimPhase, setSwapAnimPhase] = useState<"shrink" | "expand" | null>(null);

  const panelQuery = useQuery({
    queryKey: mediaQueryKeys.panel(panelId),
    queryFn: () => fetchMediaPanel(panelId),
    enabled: Boolean(panelId),
  });

  useEffect(() => {
    setEditMode(false);
  }, [panelId]);

  useEffect(() => {
    if (panelQuery.data) {
      setPanelName(panelQuery.data.name);
    }
  }, [panelQuery.data]);

  const redirecting = useRecordNotFoundRedirect({
    isLoading: panelQuery.isLoading,
    error: panelQuery.error,
    isFetched: panelQuery.isFetched,
    hasData: Boolean(panelQuery.data),
    listPath: "/media/panels",
    notice: "That display panel could not be found.",
  });

  useEffect(() => {
    if (redirecting) {
      writeModuleSubNavPath("media", "panels", "/media/panels");
    }
  }, [redirecting]);

  const invalidatePanel = () => {
    void queryClient.invalidateQueries({ queryKey: mediaQueryKeys.panel(panelId) });
    void queryClient.invalidateQueries({ queryKey: mediaQueryKeys.panels() });
  };

  const renameMutation = useMutation({
    mutationFn: (name: string) => updateMediaPanelName(panelId, name),
    onSuccess: () => {
      setActionError(null);
      invalidatePanel();
    },
    onError: (error) => {
      setActionError(error instanceof ApiError ? error.message : "Rename failed.");
    },
  });

  const addItemMutation = useMutation({
    mutationFn: (payload: AddItemPayload) => {
      if (payload.mode === "split") {
        return addMediaPanelItem(panelId, payload.mediaId, {
          grid_x: payload.newSlot.grid_x,
          grid_y: payload.newSlot.grid_y,
          col_span: payload.newSlot.col_span,
          row_span: payload.newSlot.row_span,
          layout_updates: [payload.existing],
        });
      }
      if (payload.mode === "append-gap") {
        return addMediaPanelItem(panelId, payload.mediaId, {
          grid_x: payload.placement.grid_x,
          grid_y: payload.placement.grid_y,
          col_span: payload.placement.col_span,
          row_span: payload.placement.row_span,
        });
      }
      if (payload.mode === "append-edge") {
        return addMediaPanelItem(panelId, payload.mediaId, {
          grid_x: payload.plan.newSlot.grid_x,
          grid_y: payload.plan.newSlot.grid_y,
          col_span: payload.plan.newSlot.col_span,
          row_span: payload.plan.newSlot.row_span,
          layout_updates: payload.plan.layoutUpdates.map((item) => ({
            id: item.id,
            grid_x: item.grid_x,
            grid_y: item.grid_y,
            col_span: item.col_span,
            row_span: item.row_span,
          })),
        });
      }
      return addMediaPanelItem(panelId, payload.mediaId);
    },
    onSuccess: () => {
      setActionError(null);
      setPickerOpen(false);
      setPendingAdd(null);
      setSplitInlinePick(null);
      invalidatePanel();
    },
    onError: (error) => {
      setActionError(error instanceof ApiError ? error.message : "Add failed.");
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: (itemId: string) => removeMediaPanelItem(panelId, itemId),
    onSuccess: () => {
      setActionError(null);
      invalidatePanel();
    },
    onError: (error) => {
      setActionError(error instanceof ApiError ? error.message : "Remove failed.");
    },
  });

  const deletePanelMutation = useMutation({
    mutationFn: () => deleteMediaPanel(panelId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mediaQueryKeys.panels() });
      navigate("/media/panels");
    },
    onError: (error) => {
      setActionError(error instanceof ApiError ? error.message : "Delete failed.");
    },
  });

  const borderColorMutation = useMutation({
    mutationFn: ({
      itemId,
      borderColor,
    }: {
      itemId: string;
      borderColor: string | null;
    }) => updateMediaPanelItemBorderColor(panelId, itemId, borderColor),
    onSuccess: () => {
      setActionError(null);
      invalidatePanel();
    },
    onError: (error) => {
      setActionError(error instanceof ApiError ? error.message : "Border update failed.");
    },
  });

  const swapMutation = useMutation({
    mutationFn: ({ itemAId, itemBId }: { itemAId: string; itemBId: string }) =>
      swapMediaPanelItems(panelId, itemAId, itemBId),
    onSuccess: () => {
      setActionError(null);
      invalidatePanel();
    },
    onError: (error) => {
      setActionError(error instanceof ApiError ? error.message : "Swap failed.");
      setSwapAnimatingIds(null);
      setSwapAnimPhase(null);
    },
  });

  const panelItems = panelQuery.data?.items ?? [];
  const baseRowUnitPx = panelQuery.data?.row_unit_px ?? 64;

  const panelMaxRow = useMemo(() => {
    if (panelItems.length === 0) {
      return PANEL_EMPTY_SHELL_BAND_ROWS;
    }
    return Math.max(
      1,
      panelItems.reduce((max, item) => Math.max(max, rectEndY(item)), 0),
    );
  }, [panelItems]);

  const viewportMinHeightPx = useMemo(() => {
    if (panelItems.length === 0) {
      return panelGridEmptyShellMinHeightPx(baseRowUnitPx);
    }
    return panelGridViewportMinHeightPx(panelItems, baseRowUnitPx);
  }, [panelItems, baseRowUnitPx]);

  const viewportContentHeightPx = useMemo(() => {
    if (panelItems.length === 0) {
      return panelGridEmptyShellMinHeightPx(baseRowUnitPx);
    }
    return panelGridViewportContentHeightPx(panelMaxRow, baseRowUnitPx);
  }, [panelItems, panelMaxRow, baseRowUnitPx]);

  const viewport = useMediaPanelViewportHeight({
    panelId,
    minHeightPx: viewportMinHeightPx,
    contentHeightPx: viewportContentHeightPx,
  });

  const displayRowUnitPx = useMemo(() => {
    const rowCount = panelItems.length === 0 ? PANEL_EMPTY_SHELL_BAND_ROWS : panelMaxRow;
    return panelGridDisplayRowUnitPx(
      viewport.heightPx,
      rowCount,
      PANEL_GRID_SHELL_PADDING_PX * 2,
    );
  }, [viewport.heightPx, panelItems.length, panelMaxRow]);

  const resize = useMediaPanelGridResize({
    columnCount: panelQuery.data?.column_count ?? 12,
    rowUnitPx: displayRowUnitPx,
    panelId,
    onSaved: (updated) => {
      queryClient.setQueryData(mediaQueryKeys.panel(panelId), updated);
      void queryClient.invalidateQueries({ queryKey: mediaQueryKeys.panels() });
    },
    onError: (message) => setActionError(message),
  });

  const displayItems = resize.draftItems ?? panelItems;

  const handleGridRef = useCallback((node: HTMLDivElement | null) => {
    gridNodeRef.current = node;
    if (node) {
      resize.setGridWidth(node.getBoundingClientRect().width);
    }
  }, [resize]);

  useEffect(() => {
    const node = gridNodeRef.current;
    if (!node) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      resize.setGridWidth(width);
    });
    observer.observe(node);
    resize.setGridWidth(node.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, [resize, panelQuery.data?.items.length]);

  useEffect(() => {
    if (editMode) {
      setSwapSourceId(null);
      setFlippedItemId(null);
    }
  }, [editMode]);

  useEffect(() => {
    if (!swapSourceId) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSwapSourceId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [swapSourceId]);

  const previewSaveMutation = useMutation({
    mutationFn: ({
      itemId,
      preview,
    }: {
      itemId: string;
      preview: ReturnType<typeof panelTilePreviewPayload>;
    }) => updateMediaPanelItemPreview(panelId, itemId, preview),
    onSuccess: () => {
      setActionError(null);
      invalidatePanel();
    },
    onError: (error) => {
      setActionError(error instanceof ApiError ? error.message : "Preview save failed.");
    },
  });

  const previewDraft = useMediaPanelPreviewDraft({
    items: displayItems,
    onSave: (itemId, preview) => {
      previewSaveMutation.mutate({
        itemId,
        preview: panelTilePreviewPayload(preview),
      });
    },
  });

  const excludeMediaIds = useMemo(
    () => displayItems.map((item) => item.media_id),
    [displayItems],
  );

  const handleNameBlur = () => {
    const trimmed = panelName.trim();
    if (!trimmed || !panelQuery.data || trimmed === panelQuery.data.name) {
      return;
    }
    renameMutation.mutate(trimmed);
  };

  const openAppendPicker = (placement?: PanelGapAppendPlacement | PanelEdgeAppendPlan) => {
    if (placement && "side" in placement) {
      setPendingAdd({ mode: "append-edge", plan: placement });
    } else if (placement) {
      setPendingAdd({ mode: "append-gap", placement });
    } else {
      setPendingAdd({ mode: "append" });
    }
    setPickerOpen(true);
  };

  const handleSplitZoneOpen = (itemId: string, zone: SplitZone) => {
    const item = displayItems.find((entry) => entry.id === itemId);
    if (!item) {
      return;
    }

    const split = computeSplitPlacements(
      {
        id: item.id,
        grid_x: item.grid_x,
        grid_y: item.grid_y,
        col_span: item.col_span,
        row_span: item.row_span,
      },
      zone,
    );
    if (!split) {
      return;
    }

    setSplitInlinePick({
      itemId,
      zone,
      existing: {
        id: split.existing.id,
        grid_x: split.existing.grid_x,
        grid_y: split.existing.grid_y,
        col_span: split.existing.col_span,
        row_span: split.existing.row_span,
      },
      newSlot: split.newSlot,
    });
  };

  const handleSplitPickSelect = (media: MediaObject) => {
    if (!splitInlinePick) {
      return;
    }
    addItemMutation.mutate({
      mode: "split",
      mediaId: media.id,
      existing: splitInlinePick.existing,
      newSlot: splitInlinePick.newSlot,
    });
  };

  const handleSelectMedia = (media: MediaObject) => {
    if (pendingAdd?.mode === "append-edge") {
      addItemMutation.mutate({
        mode: "append-edge",
        mediaId: media.id,
        plan: pendingAdd.plan,
      });
      return;
    }

    if (pendingAdd?.mode === "append-gap") {
      addItemMutation.mutate({
        mode: "append-gap",
        mediaId: media.id,
        placement: pendingAdd.placement,
      });
      return;
    }

    addItemMutation.mutate({ mode: "append", mediaId: media.id });
  };

  const handleClosePicker = () => {
    setPickerOpen(false);
    setPendingAdd(null);
  };

  const handleTileContextMenu = (
    itemId: string,
    clientX: number,
    clientY: number,
    tileRect: DOMRect,
  ) => {
    const item = displayItems.find((entry) => entry.id === itemId);
    if (!item) {
      return;
    }
    setTileContextMenu({
      clientX,
      clientY,
      item,
      tileRect: panelTileRectFromDomRect(tileRect),
    });
  };

  const handleOpenTileView = (item: MediaPanelItem, tileRect: PanelTileRect) => {
    setTileViewModal({ item, tileRect });
  };

  const handleSwapTargetSelect = async (targetId: string) => {
    if (!swapSourceId || swapSourceId === targetId) {
      return;
    }

    const ids = [swapSourceId, targetId];
    setSwapAnimatingIds(ids);
    setSwapAnimPhase("shrink");
    setSwapSourceId(null);

    await delay(SWAP_ANIM_MS);

    try {
      await swapMutation.mutateAsync({ itemAId: ids[0], itemBId: ids[1] });
      setSwapAnimPhase("expand");
      await delay(SWAP_ANIM_MS);
    } finally {
      setSwapAnimatingIds(null);
      setSwapAnimPhase(null);
    }
  };

  const busy =
    renameMutation.isPending ||
    addItemMutation.isPending ||
    removeItemMutation.isPending ||
    deletePanelMutation.isPending ||
    resize.isResizing ||
    viewport.isResizing ||
    previewSaveMutation.isPending ||
    borderColorMutation.isPending ||
    swapMutation.isPending;

  const renderPanelBody = () => {
    if (!panelQuery.data) {
      return null;
    }

    return (
      <MediaPanelGrid
        panel={panelQuery.data}
        items={displayItems}
        editMode={editMode}
        displayRowUnitPx={displayRowUnitPx}
        viewportHeightPx={viewport.heightPx}
        isViewportResizing={viewport.isResizing}
        onViewportResizeStart={viewport.startResize}
        resizePreview={resize.resizePreview}
        isTileResizing={resize.isResizing}
        flippedItemId={flippedItemId}
        onFlippedChange={setFlippedItemId}
        swapSourceId={swapSourceId}
        swapAnimatingIds={swapAnimatingIds}
        swapAnimPhase={swapAnimPhase}
        splitPickerItemId={splitInlinePick?.itemId ?? null}
        splitPickerZone={splitInlinePick?.zone ?? null}
        excludeMediaIds={excludeMediaIds}
        getItemPreview={previewDraft.getPreview}
        onPreviewChange={previewDraft.updatePreview}
        onGridRef={handleGridRef}
        addDisabled={busy}
        onAdd={openAppendPicker}
        onEnterEditMode={() => setEditMode(true)}
        onTileContextMenu={handleTileContextMenu}
        onSplitZoneOpen={handleSplitZoneOpen}
        onSplitPickSelect={handleSplitPickSelect}
        onSplitPickCancel={() => setSplitInlinePick(null)}
        onSwapTargetSelect={(itemId) => {
          void handleSwapTargetSelect(itemId);
        }}
        onRemoveItem={(itemId) => removeItemMutation.mutate(itemId)}
        onResizeStart={(itemId, edge, clientX, clientY, pointerId) =>
          resize.startResize(displayItems, itemId, edge, clientX, clientY, pointerId)
        }
      />
    );
  };

  if (redirecting || panelQuery.isLoading || !panelQuery.data) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col px-4 py-6 md:px-6">
        <p className="text-sm text-stone-500">Loading panel…</p>
      </div>
    );
  }

  return (
    <>
      <div className="mt-3">
        <MediaPanelToolbar
          name={panelName}
          editMode={editMode}
          busy={busy}
          onBackToPanels={() => navigate("/media/panels")}
          onNameChange={setPanelName}
          onNameCommit={handleNameBlur}
          onToggleEdit={() => setEditMode((value) => !value)}
          onDeletePanel={() => deletePanelMutation.mutate()}
        />
      </div>

      {swapSourceId ? (
        <p className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm text-amber-100">
          Select another tile to swap positions. Press Escape to cancel.
        </p>
      ) : null}

      {actionError ? <p className="mt-4 text-sm text-red-400">{actionError}</p> : null}

      {panelQuery.isLoading ? (
        <p className="mt-12 text-sm text-stone-500">Loading panel…</p>
      ) : (
        <div className="mt-8 w-full">{renderPanelBody()}</div>
      )}

      <MediaObjectPickerDialog
        open={pickerOpen}
        title="Add file to panel"
        disabled={addItemMutation.isPending}
        excludeMediaIds={excludeMediaIds}
        onSelect={handleSelectMedia}
        onClose={handleClosePicker}
      />

      <MediaPanelTileContextMenu
        menu={tileContextMenu}
        editMode={editMode}
        onClose={() => setTileContextMenu(null)}
        onDelete={(itemId) => removeItemMutation.mutate(itemId)}
        onDetails={(itemId) => setFlippedItemId(itemId)}
        onView={handleOpenTileView}
        onSwapStart={(itemId) => setSwapSourceId(itemId)}
        onBorderColorChange={(itemId, borderColor) =>
          borderColorMutation.mutate({ itemId, borderColor })
        }
      />

      <MediaPanelTileViewModal
        state={tileViewModal}
        onClose={() => setTileViewModal(null)}
      />
    </>
  );
}
