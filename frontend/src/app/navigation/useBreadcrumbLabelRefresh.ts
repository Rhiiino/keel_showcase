// keel_web/src/app/navigation/useBreadcrumbLabelRefresh.ts

// Re-renders the breadcrumb when a query finishes loading so record names can
// replace placeholder labels. Scoped to successful query updates only.

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useReducer } from "react";

export function useBreadcrumbLabelRefresh(): void {
  const queryClient = useQueryClient();
  const [, forceRender] = useReducer((count: number) => count + 1, 0);

  useEffect(() => {
    return queryClient.getQueryCache().subscribe((event) => {
      if (event.type === "updated" && event.action.type === "success") {
        forceRender();
      }
    });
  }, [queryClient]);
}
