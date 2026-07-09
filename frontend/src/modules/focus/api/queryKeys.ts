// keel_web/src/modules/focus/api/queryKeys.ts

export const focusQueryKeys = {
  all: ["focus"] as const,
  nodes: () => [...focusQueryKeys.all, "nodes"] as const,
  nodesList: (filters?: Record<string, string | number | boolean | undefined>) =>
    [...focusQueryKeys.nodes(), "list", filters ?? {}] as const,
  node: (nodeId: number) => [...focusQueryKeys.nodes(), "detail", nodeId] as const,
  nodeTimer: (nodeId: number) => [...focusQueryKeys.node(nodeId), "timer"] as const,
  nodeTimeEntries: (nodeId: number) =>
    [...focusQueryKeys.node(nodeId), "time-entries"] as const,
  lists: () => [...focusQueryKeys.all, "lists"] as const,
  listsList: (filters?: Record<string, string | number | undefined>) =>
    [...focusQueryKeys.lists(), "list", filters ?? {}] as const,
  list: (listId: number) => [...focusQueryKeys.lists(), "detail", listId] as const,
  entries: () => [...focusQueryKeys.all, "entries"] as const,
  entriesList: (filters?: Record<string, string | number | boolean | undefined>) =>
    [...focusQueryKeys.entries(), "list", filters ?? {}] as const,
  entry: (entryId: number) => [...focusQueryKeys.entries(), "detail", entryId] as const,
  tags: () => [...focusQueryKeys.all, "tags"] as const,
  referenceTypes: () => [...focusQueryKeys.all, "reference-types"] as const,
  referenceSettings: () => [...focusQueryKeys.all, "reference-settings"] as const,
  constellationState: () => [...focusQueryKeys.all, "constellation-state"] as const,
  constellationSettings: () => [...focusQueryKeys.all, "constellation-settings"] as const,
  automationSession: () => [...focusQueryKeys.all, "automation-session"] as const,
  automationGuide: () => [...focusQueryKeys.all, "automation-guide"] as const,
  referenceSearch: (targetType: string, query: string) =>
    [...focusQueryKeys.all, "reference-search", targetType, query] as const,
  referenceDetail: (targetType: string, targetId: string) =>
    [...focusQueryKeys.all, "reference-detail", targetType, targetId] as const,
};
