// Remove project media references from persisted workspace canvas state.

import type { Node } from "@xyflow/react";

import type { WorkspaceMediaData } from "../projectWorkspace";

export function nodeReferencesMediaId(node: Node, mediaId: string): boolean {
  if (node.type !== "media") {
    return false;
  }
  const data = node.data as WorkspaceMediaData | undefined;
  return data?.media_id === mediaId;
}
