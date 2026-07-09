// keel_web/src/modules/chat/components/message/ChatConversationEmptyState.tsx

// Empty chat thread — sub-agent 3D hero or Keel Persona animation for Keel.

import { useQuery } from "@tanstack/react-query";

import { KeelPersonaPlayer } from "../../../../components/keelPersona";
import { useKeelClipMediaReady, useRandomKeelClip } from "../../../../hooks/keelPersona";
import { AgentModelViewer } from "../../../agents/components/AgentModelViewer";
import { agentsQueryKeys, fetchAgents } from "../../../agents/api";
import {
  subagentDisplayNameClassName,
  subagentModelSrc,
  subagentPortraitSrc,
} from "../../../agents/lib";

type ChatConversationEmptyStateProps = {
  driverAgentId: string;
};

function KeelEmptyState() {
  const clipId = useRandomKeelClip();
  const mediaReady = useKeelClipMediaReady(clipId, true);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex flex-col items-center gap-4">
        <KeelPersonaPlayer
          clipId={clipId}
          size={220}
          waitForMedia
          mediaReady={mediaReady}
          loadingPlayback
          captionLoadingDots={false}
        />
        <p className="max-w-sm text-sm text-stone-500">
          Send a message below to start the conversation.
        </p>
      </div>
    </div>
  );
}

export function ChatConversationEmptyState({
  driverAgentId,
}: ChatConversationEmptyStateProps) {
  const agentsQuery = useQuery({
    queryKey: agentsQueryKeys.catalog(),
    queryFn: fetchAgents,
    enabled: driverAgentId !== "keel",
  });

  if (driverAgentId === "keel") {
    return <KeelEmptyState />;
  }

  const driverAgent = agentsQuery.data?.find((agent) => agent.id === driverAgentId);
  const modelSrc = driverAgent
    ? subagentModelSrc(driverAgentId, driverAgent.media)
    : null;

  if (!modelSrc) {
    return <KeelEmptyState />;
  }

  const displayName = driverAgent?.display_name ?? driverAgentId;

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-10 text-center">
      <AgentModelViewer
        agentId={driverAgentId}
        src={modelSrc}
        placeholderSrc={subagentPortraitSrc(driverAgentId)}
        className="h-[min(28rem,52vh)] w-[min(22rem,78vw)] sm:h-96 sm:w-80"
      />
      <p
        className={[
          "mt-8 text-xl font-medium tracking-tight",
          subagentDisplayNameClassName(driverAgentId),
        ].join(" ")}
      >
        {displayName}
      </p>
      <p className="mt-2 max-w-sm text-sm text-stone-500">
        Send a message below to start the conversation.
      </p>
    </div>
  );
}
