// stack_sandbox/frontend_web/src/modules/chat/lib/conversationReorder.ts

// Helpers for manual conversation list reordering.

import {
  moveIdToInsertIndex,
  resolveInsertIndexFromPointer,
  setTransparentDragImage,
} from "../../../lib/listReorder";

import type { Conversation } from "../api";

export { resolveInsertIndexFromPointer, setTransparentDragImage };

export function resolveConversationInsertIndex(
  event: { clientY: number },
  rowElement: HTMLElement,
  rowIndex: number,
): number {
  const rect = rowElement.getBoundingClientRect();
  const insertBefore = event.clientY < rect.top + rect.height / 2;
  return insertBefore ? rowIndex : rowIndex + 1;
}

export function moveConversationToInsertIndex(
  conversations: Conversation[],
  draggedId: number,
  insertIndex: number,
): Conversation[] {
  const ids = conversations.map((conversation) => conversation.id);
  const nextIds = moveIdToInsertIndex(ids, draggedId, insertIndex);
  if (nextIds === ids || nextIds.join() === ids.join()) {
    return conversations;
  }

  const byId = new Map(conversations.map((conversation) => [conversation.id, conversation]));
  return nextIds
    .map((id) => byId.get(id))
    .filter((conversation): conversation is Conversation => conversation !== undefined);
}
