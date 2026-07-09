// keel_web/src/modules/focus/hooks/useFocusListEditor.ts

// Focus list editor state, queries, mutations, and handler wiring.

import { useQuery } from "@tanstack/react-query";
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
  type ForwardedRef,
} from "react";
import { useNavigate } from "react-router-dom";

import {
  DEFAULT_TITLE_FONT_KEY,
  resolveProjectTitleFontKey,
  type ProjectTitleFontKey,
} from "../../projects/lib/project/appearance";
import {
  fetchFocusList,
  focusQueryKeys,
  type FocusEntry,
  type FocusEntryCreatePayload,
  type FocusReferenceSearchResult,
} from "../api";
import {
  focusEntryDisplayTitle,
  isFocusEntryKind,
  isFocusEntryStatus,
  isFocusListStatus,
  FOCUS_HUB_VIEW_MODE_STORAGE_KEY,
  FOCUS_UNSAVED_FORM_NAV_MESSAGE,
  type FocusHubNavigationState,
  type FocusNodeStatus,
} from "../lib/focus";
import {
  canvasNodeIdForContainerFocusNode,
  shouldShowFocusFormConstellationAction,
} from "../lib/constellation/scope";
import type { FocusListEditorBulkToolbarProps } from "../components/forms/editors";
import type { FocusListEditorEntryListProps } from "../components/forms/editors";
import type { FocusListEditorHeaderProps } from "../components/forms/editors";
import type {
  FocusNodeTimeEntriesPanelProps,
  FocusNodeTimerControlsProps,
} from "../components/forms/timer";
import { useFocusNodeTimer } from "./useFocusNodeTimer";
import { useFocusListEditorMutations } from "./useFocusListEditorMutations";
import { useFocusEntryDragController } from "./useFocusEntryDragController";
import { useFocusEntryDragTree } from "./useFocusEntryDragTree";

export type FocusListEditorHandle = {
  isFormDirty: () => boolean;
  discardForm: () => void;
  saveForm: () => void;
};

type UseFocusListEditorParams = {
  listId: number;
  deferConstellationRefresh?: boolean;
  ref: ForwardedRef<FocusListEditorHandle>;
};

type FocusListEditorAddFormProps = {
  listId: number;
  excludedLinkedListIds: number[];
  onSubmit: (payload: FocusEntryCreatePayload) => Promise<unknown>;
  onAddRecord: (result: FocusReferenceSearchResult) => Promise<unknown>;
  disabled: boolean;
  keepInputFocusedAfterSubmit: boolean;
};

type EntryDraft = {
  entry: FocusEntry;
  title: string;
  notes: string;
  status: FocusNodeStatus;
  work_order: number | null;
};

export type UseFocusListEditorResult = {
  isLoading: boolean;
  isError: boolean;
  fetchError: unknown;
  isRecordFetched: boolean;
  hasRecordData: boolean;
  list: NonNullable<Awaited<ReturnType<typeof fetchFocusList>>> | undefined;
  headerProps: FocusListEditorHeaderProps;
  constellationAction: {
    label: string;
    onOpen: () => void;
  } | null;
  timerControlsProps: FocusNodeTimerControlsProps;
  timeEntriesPanelProps: FocusNodeTimeEntriesPanelProps;
  isTimeEntriesPanelOpen: boolean;
  addFormProps: FocusListEditorAddFormProps;
  bulkToolbarProps: FocusListEditorBulkToolbarProps | null;
  entryListProps: FocusListEditorEntryListProps;
};

export function useFocusListEditor({
  listId,
  deferConstellationRefresh = false,
  ref,
}: UseFocusListEditorParams): UseFocusListEditorResult {
  const navigate = useNavigate();
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<number>>(new Set());
  const [expandedEntryIds, setExpandedEntryIds] = useState<Set<number>>(new Set());
  const [notesDraft, setNotesDraft] = useState("");
  const [titleDraft, setTitleDraft] = useState("");
  const [titleFontDraft, setTitleFontDraft] =
    useState<ProjectTitleFontKey>(DEFAULT_TITLE_FONT_KEY);
  const [statusDraft, setStatusDraft] = useState<FocusNodeStatus>("active");
  const [workOrderDraft, setWorkOrderDraft] = useState<number | null>(null);
  const [tagIdsDraft, setTagIdsDraft] = useState<number[]>([]);
  const [nodeColorDraft, setNodeColorDraft] = useState<string | null>(null);
  const [entryDrafts, setEntryDrafts] = useState<Record<number, EntryDraft>>({});
  const [timeEntriesPanelOpen, setTimeEntriesPanelOpen] = useState(false);

  const listQuery = useQuery({
    queryKey: focusQueryKeys.list(listId),
    queryFn: () => fetchFocusList(listId),
    enabled: Number.isFinite(listId) && listId > 0,
  });

  const list = listQuery.data;

  const savedTagIdsKey =
    list?.tags
      .map((tag) => tag.id)
      .sort((a, b) => a - b)
      .join(",") ?? "";

  const applyListToDrafts = useCallback((record: NonNullable<typeof list>) => {
    setNotesDraft(record.notes);
    setTitleDraft(record.title);
    setTitleFontDraft(resolveProjectTitleFontKey(record.title_font_key));
    setStatusDraft(isFocusListStatus(record.status) ? record.status : "active");
    setWorkOrderDraft(record.work_order);
    setTagIdsDraft(record.tags.map((tag) => tag.id));
    setNodeColorDraft(record.node_color_hex);
  }, []);

  useEffect(() => {
    if (list) {
      applyListToDrafts(list);
    }
  }, [
    applyListToDrafts,
    list?.id,
    list?.notes,
    list?.title,
    list?.title_font_key,
    list?.status,
    list?.work_order,
    list?.node_color_hex,
    savedTagIdsKey,
  ]);

  const entries = useMemo(() => {
    const rows = list?.entries ?? [];
    return [...rows].sort(
      (a, b) => a.sort_order - b.sort_order || a.id - b.id,
    );
  }, [list?.entries]);

  const entryTree = useFocusEntryDragTree({
    rootContainerId: listId,
    rootEntries: entries,
  });

  const stagedEntries = entryTree.getEntries(listId);

  const entryDraftChanges = useMemo(() => {
    const changes: Array<{ entry: FocusEntry; draft: EntryDraft }> = [];

    for (const draft of Object.values(entryDrafts)) {
      const entry = draft.entry;
      const savedStatus = isFocusEntryStatus(entry.status) ? entry.status : "active";
      const savedTitle = focusEntryDisplayTitle(entry);
      if (
        draft.title.trim() !== savedTitle ||
        draft.notes.trim() !== entry.notes ||
        draft.status !== savedStatus ||
        draft.work_order !== entry.work_order
      ) {
        changes.push({ entry, draft });
      }
    }
    return changes;
  }, [entries, entryDrafts]);

  const { isFormDirty, canSaveForm } = useMemo(() => {
    if (!list) {
      return { isFormDirty: false, canSaveForm: false };
    }

    const trimmedTitle = titleDraft.trim();
    const trimmedNotes = notesDraft.trim();
    const savedStatus = isFocusListStatus(list.status) ? list.status : "active";
    const savedTagIds = list.tags
      .map((tag) => tag.id)
      .sort((a, b) => a - b);
    const draftTagIds = [...tagIdsDraft].sort((a, b) => a - b);
    const savedTitleFont = resolveProjectTitleFontKey(list.title_font_key);

    const entryDraftsValid = entryDraftChanges.every(
      ({ draft }) => draft.title.trim().length > 0,
    );

    const isFormDirty =
      trimmedTitle !== list.title ||
      titleFontDraft !== savedTitleFont ||
      trimmedNotes !== list.notes ||
      statusDraft !== savedStatus ||
      workOrderDraft !== list.work_order ||
      draftTagIds.join(",") !== savedTagIds.join(",") ||
      nodeColorDraft !== list.node_color_hex ||
      entryTree.hasPendingMoves ||
      entryDraftChanges.length > 0;

    return {
      isFormDirty,
      canSaveForm: isFormDirty && trimmedTitle.length > 0 && entryDraftsValid,
    };
  }, [
    entryDraftChanges,
    entryTree.hasPendingMoves,
    nodeColorDraft,
    notesDraft,
    list,
    statusDraft,
    tagIdsDraft,
    titleDraft,
    titleFontDraft,
    workOrderDraft,
  ]);

  const linkedListIdsInParent = useMemo(
    () =>
      stagedEntries.flatMap((entry) =>
        entry.kind === "list_link" && entry.linked_list_id !== null
          ? [entry.linked_list_id]
          : [],
      ),
    [stagedEntries],
  );

  const {
    createEntryMutation,
    createRecordMutation,
    deleteMutation,
    bulkDeleteMutation,
    updateEntryMutation,
    updateLinkedListMutation,
    moveNodeMutation,
    updateListMutation,
  } = useFocusListEditorMutations({
    listId,
    deferConstellationRefresh,
    onBulkDeleteSuccess: () => setSelectedEntryIds(new Set()),
  });

  const timer = useFocusNodeTimer({
    nodeId: listId,
    historyEnabled: timeEntriesPanelOpen,
  });

  const toggleExpand = useCallback((entryId: number, containerId?: number) => {
    let shouldLoadContainer = false;
    setExpandedEntryIds((current) => {
      const next = new Set(current);
      if (next.has(entryId)) {
        next.delete(entryId);
      } else {
        next.add(entryId);
        shouldLoadContainer = containerId !== undefined;
      }
      return next;
    });
    if (shouldLoadContainer && containerId !== undefined) {
      void entryTree.loadContainer(containerId);
    }
  }, [entryTree]);

  const expandContainer = useCallback(
    (entryId: number, containerId: number) => {
      setExpandedEntryIds((current) => {
        if (current.has(entryId)) {
          return current;
        }
        const next = new Set(current);
        next.add(entryId);
        return next;
      });
      void entryTree.loadContainer(containerId);
    },
    [entryTree],
  );

  const dragController = useFocusEntryDragController({
    canMoveEntryToContainer: entryTree.canMoveEntryToContainer,
    moveEntry: entryTree.moveEntry,
    onExpandContainer: expandContainer,
  });

  const entryDraftFor = useCallback(
    (entry: FocusEntry): EntryDraft => {
      const status = isFocusEntryStatus(entry.status) ? entry.status : "active";
      return (
        entryDrafts[entry.id] ?? {
          entry,
          title: focusEntryDisplayTitle(entry),
          notes: entry.notes,
          status,
          work_order: entry.work_order,
        }
      );
    },
    [entryDrafts],
  );

  const updateEntryDraft = useCallback(
    (entry: FocusEntry, patch: Partial<EntryDraft>) => {
      setEntryDrafts((current) => {
        const status = isFocusEntryStatus(entry.status) ? entry.status : "active";
        const base = current[entry.id] ?? {
          entry,
          title: focusEntryDisplayTitle(entry),
          notes: entry.notes,
          status,
          work_order: entry.work_order,
        };
        return {
          ...current,
          [entry.id]: { ...base, ...patch },
        };
      });
    },
    [],
  );

  const handleDiscardForm = useCallback(() => {
    if (list) {
      applyListToDrafts(list);
    }
    setEntryDrafts({});
    entryTree.discardMoves();
  }, [applyListToDrafts, entryTree, list]);

  const handleSaveForm = useCallback(() => {
    if (!list || !canSaveForm) {
      return;
    }

    const save = async () => {
      await updateListMutation.mutateAsync({
        title: titleDraft.trim(),
        notes: notesDraft.trim(),
        status: statusDraft,
        work_order: workOrderDraft,
        tag_ids: tagIdsDraft,
        node_color_hex: nodeColorDraft,
        title_font_key:
          titleFontDraft === DEFAULT_TITLE_FONT_KEY ? null : titleFontDraft,
      });

      await Promise.all(
        entryDraftChanges.map(({ entry, draft }) => {
          const payload = {
            title: draft.title.trim(),
            notes: draft.notes.trim(),
            status: draft.status,
            work_order: draft.work_order,
          };
          if (isFocusEntryKind(entry.kind) && entry.kind === "list_link") {
            if (!entry.linked_list_id) {
              return Promise.resolve();
            }
            return updateLinkedListMutation.mutateAsync({
              linkedListId: entry.linked_list_id,
              ...payload,
            });
          }
          return updateEntryMutation.mutateAsync({
            entryId: entry.id,
            ...payload,
          });
        }),
      );
      for (const move of entryTree.pendingMoves) {
        await moveNodeMutation.mutateAsync({
          nodeId: move.nodeId,
          parent_id: move.parentId,
          sort_order: move.sortOrder,
        });
      }
      setEntryDrafts({});
      entryTree.markSnapshotCurrent();
    };

    void save();
  }, [
    canSaveForm,
    entryDraftChanges,
    entryTree,
    nodeColorDraft,
    notesDraft,
    list,
    statusDraft,
    tagIdsDraft,
    titleDraft,
    titleFontDraft,
    updateEntryMutation,
    updateLinkedListMutation,
    moveNodeMutation,
    updateListMutation,
    workOrderDraft,
  ]);

  useImperativeHandle(
    ref,
    () => ({
      isFormDirty: () => isFormDirty,
      discardForm: handleDiscardForm,
      saveForm: handleSaveForm,
    }),
    [handleDiscardForm, handleSaveForm, isFormDirty],
  );

  const selectedCount = selectedEntryIds.size;
  const listPending =
    updateListMutation.isPending ||
    updateEntryMutation.isPending ||
    updateLinkedListMutation.isPending ||
    moveNodeMutation.isPending;
  const entryPending =
    updateEntryMutation.isPending ||
    updateLinkedListMutation.isPending ||
    deleteMutation.isPending;

  const handleOpenConstellation = useCallback(() => {
    if (!list || !shouldShowFocusFormConstellationAction(list.kind)) {
      return;
    }

    const nodeKind = list.kind === "record" ? "record" : "list";

    if (isFormDirty) {
      if (!window.confirm(FOCUS_UNSAVED_FORM_NAV_MESSAGE)) {
        return;
      }
      handleDiscardForm();
    }

    try {
      window.localStorage.setItem(FOCUS_HUB_VIEW_MODE_STORAGE_KEY, "constellation");
    } catch {
      // Ignore storage failures.
    }

    if (list.is_origin) {
      navigate("/focus");
      return;
    }

    navigate("/focus", {
      state: {
        scopeRootCanvasId: canvasNodeIdForContainerFocusNode(list.id, nodeKind),
      } satisfies FocusHubNavigationState,
    });
  }, [handleDiscardForm, isFormDirty, list, navigate]);

  const headerProps: FocusListEditorHeaderProps = {
    listId,
    isFormDirty,
    canSaveForm,
    listPending,
      saveErrorMessage: updateListMutation.isError
      ? updateListMutation.error.message
      : null,
    titleDraft,
    onTitleDraftChange: setTitleDraft,
    titleFontDraft,
    onTitleFontDraftChange: setTitleFontDraft,
    notesDraft,
    onNotesDraftChange: setNotesDraft,
    statusDraft,
    onStatusDraftChange: setStatusDraft,
    workOrderDraft,
    onWorkOrderDraftChange: setWorkOrderDraft,
    tagIdsDraft,
    onTagIdsDraftChange: setTagIdsDraft,
    nodeColorDraft,
    onNodeColorDraftChange: setNodeColorDraft,
    onDiscard: handleDiscardForm,
    onSave: handleSaveForm,
  };

  const constellationAction =
    list && shouldShowFocusFormConstellationAction(list.kind)
      ? {
          label: list.is_origin
            ? "Open constellation view"
            : `Open scoped constellation for ${list.title}`,
          onOpen: handleOpenConstellation,
        }
      : null;

  const timerControlsProps: FocusNodeTimerControlsProps = {
    activeEntry: timer.activeEntry,
    elapsedSeconds: timer.elapsedSeconds,
    isLoading: timer.isTimerLoading,
    actionPending: timer.timerActionPending,
    errorMessage: timer.timerErrorMessage,
    historyOpen: timeEntriesPanelOpen,
    onToggleHistory: () => setTimeEntriesPanelOpen((current) => !current),
    onStart: timer.onStartTimer,
    onPause: timer.onPauseTimer,
    onResume: timer.onResumeTimer,
    onEnd: timer.onEndTimer,
  };

  const timeEntriesPanelProps: FocusNodeTimeEntriesPanelProps = {
    entries: timer.timeEntries,
    isLoading: timer.isHistoryLoading,
    isError: timer.isHistoryError,
    onClose: () => setTimeEntriesPanelOpen(false),
  };

  const addFormProps: FocusListEditorAddFormProps = {
    listId,
    excludedLinkedListIds: linkedListIdsInParent,
    onSubmit: (payload) => createEntryMutation.mutateAsync(payload),
    onAddRecord: (result) => createRecordMutation.mutateAsync(result),
    disabled: createEntryMutation.isPending || createRecordMutation.isPending,
    keepInputFocusedAfterSubmit: true,
  };

  const bulkToolbarProps: FocusListEditorBulkToolbarProps | null =
    selectedCount > 0
      ? {
          selectedCount,
          bulkDeletePending: bulkDeleteMutation.isPending,
          onBulkDelete: () => bulkDeleteMutation.mutate([...selectedEntryIds]),
        }
      : null;

  const entryListProps: FocusListEditorEntryListProps = {
    containerId: listId,
    entries: stagedEntries,
    draggingEntryId: dragController.draggingEntryId,
    dropTarget: dragController.dropTarget,
    flashingEntryId: dragController.flashingEntryId,
    selectedEntryIds,
    expandedEntryIds,
    getContainerEntries: entryTree.getEntries,
    getContainerLoadState: entryTree.getContainerLoadState,
    getEntryContainerId: entryTree.getContainerIdForEntry,
    onListDragOver: dragController.onDragOver,
    onDrop: dragController.onDrop,
    onToggleExpand: toggleExpand,
    onDragStart: dragController.onDragStart,
    onDragEnd: dragController.onDragEnd,
    onToggleSelect: (entryId, checked) => {
      setSelectedEntryIds((current) => {
        const next = new Set(current);
        if (checked) {
          next.add(entryId);
        } else {
          next.delete(entryId);
        }
        return next;
      });
    },
    getEntryDraft: entryDraftFor,
    onOpenEntry: (entry) => {
      const targetId =
        isFocusEntryKind(entry.kind) && entry.kind === "list_link" && entry.linked_list_id
          ? entry.linked_list_id
          : entry.id;
      navigate(`/focus/lists/${targetId}`);
    },
    onStatusChange: (entry, _entryId, status) => {
      if (!isFocusEntryStatus(status)) {
        return;
      }
      updateEntryDraft(entry, { status });
    },
    onWorkOrderChange: (entry, _entryId, work_order) => {
      updateEntryDraft(entry, { work_order });
    },
    onDelete: (entryId) => deleteMutation.mutate(entryId),
    onTitleChange: (entry, title) => updateEntryDraft(entry, { title }),
    onNotesChange: (entry, notes) => updateEntryDraft(entry, { notes }),
    selectDisabled: entryPending || bulkDeleteMutation.isPending,
    fieldDisabled: entryPending,
    deleteDisabled: entryPending,
  };

  return {
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    fetchError: listQuery.error,
    isRecordFetched: listQuery.isFetched,
    hasRecordData: Boolean(listQuery.data),
    list,
    headerProps,
    constellationAction,
    timerControlsProps,
    timeEntriesPanelProps,
    isTimeEntriesPanelOpen: timeEntriesPanelOpen,
    addFormProps,
    bulkToolbarProps,
    entryListProps,
  };
}
