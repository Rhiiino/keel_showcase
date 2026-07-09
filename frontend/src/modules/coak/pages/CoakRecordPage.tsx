// keel_web/src/modules/coak/pages/CoakRecordPage.tsx

import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { useParams } from "react-router-dom";

import { useRecordNotFoundRedirect } from "../../../hooks/useRecordNotFoundRedirect";
import { coakQueryKeys, fetchCoakRecord } from "../api";
import { CoakWorkspaceWindows } from "../components/panels/CoakWorkspaceWindows";
import { CoakRecordWorkspaceProvider, useCoakRecordWorkspace } from "../context";
import { coakSpaceBackgroundStyle } from "../lib/workspace";

function CoakRecordWorkspaceView() {
  const boundsRef = useRef<HTMLDivElement>(null);
  const { closeItemEditor, preserveConstellationSelection, workspaceHydrated } =
    useCoakRecordWorkspace();

  if (!workspaceHydrated) {
    return (
      <div className="flex h-full min-h-0 flex-1 items-center justify-center text-sm text-stone-500">
        Loading workspace…
      </div>
    );
  }

  return (
    <div
      ref={boundsRef}
      className="relative h-full min-h-0 flex-1 overflow-hidden"
      style={coakSpaceBackgroundStyle()}
      onClick={() => {
        if (!preserveConstellationSelection) {
          closeItemEditor();
        }
      }}
    >
      <CoakWorkspaceWindows boundsRef={boundsRef} />
    </div>
  );
}

export function CoakRecordPage() {
  const { recordId: recordIdParam } = useParams();
  const recordId = Number.parseInt(recordIdParam ?? "", 10);
  const invalidRecordId = !Number.isFinite(recordId);

  const recordQuery = useQuery({
    queryKey: coakQueryKeys.record(recordId),
    queryFn: () => fetchCoakRecord(recordId),
    enabled: !invalidRecordId,
  });

  const redirecting = useRecordNotFoundRedirect({
    invalidId: invalidRecordId,
    isLoading: recordQuery.isLoading,
    error: recordQuery.error,
    isFetched: recordQuery.isFetched,
    hasData: Boolean(recordQuery.data),
    listPath: "/coak",
    notice: "That record could not be found.",
  });

  if (redirecting || recordQuery.isLoading) {
    return <div className="p-6 text-sm text-stone-500">Loading workspace…</div>;
  }

  if (!recordQuery.data) {
    return null;
  }

  return (
    <CoakRecordWorkspaceProvider recordId={recordId}>
      <CoakRecordWorkspaceView />
    </CoakRecordWorkspaceProvider>
  );
}
