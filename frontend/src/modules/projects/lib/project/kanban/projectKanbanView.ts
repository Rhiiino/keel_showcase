// stack_sandbox/frontend_web/src/modules/projects/lib/project/kanban/projectKanbanView.ts

// View preferences for the projects Kanban page.

const STORAGE_KEY = "keel.projects.kanbanGroupByStatus";

export function readKanbanGroupByStatus(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return true;
    }
    return raw === "true";
  } catch {
    return true;
  }
}

export function writeKanbanGroupByStatus(groupByStatus: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(groupByStatus));
  } catch {
    // ignore
  }
}
