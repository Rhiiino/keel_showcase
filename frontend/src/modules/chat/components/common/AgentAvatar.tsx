// stack_sandbox/frontend_web/src/modules/chat/components/common/AgentAvatar.tsx

// Small circular agent portrait for conversation list rows and pickers.

import {
  agentAvatarImageClassName,
  agentPortraitSrc,
} from "../../../agents/lib";

type AgentAvatarProps = {
  agentId: string;
  sizeClassName?: string;
};

function PortraitPlaceholder({ sizeClassName }: { sizeClassName: string }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-stone-800 ${sizeClassName}`}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        className="h-[55%] w-[55%] text-stone-500"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
      >
        <path
          d="M12 6a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm-5 13v-1.5a5 5 0 0 1 10 0V19H7Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function AgentAvatar({
  agentId,
  sizeClassName = "h-6 w-6",
}: AgentAvatarProps) {
  const portraitSrc = agentPortraitSrc(agentId);

  if (!portraitSrc) {
    return <PortraitPlaceholder sizeClassName={sizeClassName} />;
  }

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full ${sizeClassName}`}
    >
      <img
        src={portraitSrc}
        alt=""
        className={agentAvatarImageClassName(agentId)}
      />
    </div>
  );
}
