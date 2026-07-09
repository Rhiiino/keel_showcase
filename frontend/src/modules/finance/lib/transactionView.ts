// stack_sandbox/frontend_web/src/modules/shop/lib/transactionView.ts

// View preferences for the shop list page.

export type FinanceViewMode = "kanban" | "list";

const STORAGE_KEY = "keel.finance.viewMode";

export function readFinanceViewMode(): FinanceViewMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "list") {
      return "list";
    }
    return "kanban";
  } catch {
    return "kanban";
  }
}

export function writeFinanceViewMode(viewMode: FinanceViewMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, viewMode);
  } catch {
    // ignore
  }
}
