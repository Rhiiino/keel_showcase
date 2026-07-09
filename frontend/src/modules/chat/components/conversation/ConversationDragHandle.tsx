// stack_sandbox/frontend_web/src/modules/chat/components/conversation/ConversationDragHandle.tsx

import type { DragEvent } from "react";

import { ListDragHandle } from "../../../../views/list/primitives/ListDragHandle";

type ConversationDragHandleProps = {
  conversationId: number;
  isDragging: boolean;
  disabled?: boolean;
  onDragStart: (conversationId: number, event: DragEvent<HTMLButtonElement>) => void;
  onDragEnd: () => void;
};

export function ConversationDragHandle({
  conversationId,
  isDragging,
  disabled = false,
  onDragStart,
  onDragEnd,
}: ConversationDragHandleProps) {
  return (
    <ListDragHandle
      isDragging={isDragging}
      disabled={disabled}
      ariaLabel="Drag to reorder conversation"
      onDragStart={(event) => onDragStart(conversationId, event)}
      onDragEnd={onDragEnd}
    />
  );
}
