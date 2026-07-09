// stack_sandbox/frontend_web/src/modules/shop/components/FinanceKanbanView.tsx

// Kanban-style card grid grouped by purchase status.

import type { FinanceTransaction, FinanceVendor } from "../api";
import { STATUS_LABELS, type FinanceTransactionStatus } from "../lib/transaction";
import { FinanceTransactionCard } from "./FinanceTransactionCard";

type FinanceTransactionGroup = {
  status: FinanceTransactionStatus;
  items: FinanceTransaction[];
};

type FinanceKanbanViewProps = {
  grouped: FinanceTransactionGroup[];
  vendorById: Map<number, FinanceVendor>;
  onDelete: (transactionId: number) => void;
  deleteDisabled?: boolean;
};

export function FinanceKanbanView({
  grouped,
  vendorById,
  onDelete,
  deleteDisabled = false,
}: FinanceKanbanViewProps) {
  return (
    <div className="space-y-10">
      {grouped.map((group) => (
        <section key={group.status}>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-stone-500">
            {STATUS_LABELS[group.status]}
          </h2>
          <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {group.items.map((item) => (
              <FinanceTransactionCard
                key={item.id}
                item={item}
                vendor={
                  item.vendor_id
                    ? vendorById.get(item.vendor_id) ?? null
                    : null
                }
                onDelete={onDelete}
                deleteDisabled={deleteDisabled}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
