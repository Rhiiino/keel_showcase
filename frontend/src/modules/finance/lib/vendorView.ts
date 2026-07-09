// keel_web/src/modules/finance/lib/vendorView.ts

// View preferences for the finance vendors page.

import type { FinanceViewMode } from "./transactionView";

const STORAGE_KEY = "keel.finance.vendors.viewMode";

export function readFinanceVendorViewMode(): FinanceViewMode {
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

export function writeFinanceVendorViewMode(viewMode: FinanceViewMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, viewMode);
  } catch {
    // ignore
  }
}
