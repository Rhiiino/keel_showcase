// stack_sandbox/frontend_web/src/modules/chat/components/status/GeneralTab.tsx

// General status panel tab — model settings and conversation list.

import { ConversationList } from "../conversation";
import { ModelSettingsPanel } from "../model";
import { GeneralTabSectionDivider } from "./GeneralTabSection";

type GeneralTabProps = {
  selectedConversationId: number | null;
  onSelect: (conversationId: number) => void;
  onDeleted: (deletedId: number) => void;
  onCreated: (conversationId: number) => void;
};

export function GeneralTab({
  selectedConversationId,
  ...conversationProps
}: GeneralTabProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ModelSettingsPanel selectedConversationId={selectedConversationId} />
      <GeneralTabSectionDivider />
      <ConversationList
        selectedConversationId={selectedConversationId}
        {...conversationProps}
      />
    </div>
  );
}
