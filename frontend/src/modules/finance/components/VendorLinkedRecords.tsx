// keel_web/src/modules/finance/components/VendorLinkedRecords.tsx

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import {
  fetchFinanceObligations,
  fetchFinanceTransactions,
  financeQueryKeys,
} from "../api";
import { formatBillingSummary } from "../lib/obligation";
import { formatPrice } from "../lib/transaction";

type VendorLinkedRecordsProps = {
  vendorId: number;
};

export function VendorLinkedRecords({ vendorId }: VendorLinkedRecordsProps) {
  const transactionsQuery = useQuery({
    queryKey: financeQueryKeys.transactionsList({ vendor_id: vendorId }),
    queryFn: () => fetchFinanceTransactions({ vendor_id: vendorId }),
  });

  const obligationsQuery = useQuery({
    queryKey: financeQueryKeys.obligationsList({ vendor_id: vendorId }),
    queryFn: () => fetchFinanceObligations({ vendor_id: vendorId }),
  });

  const transactions = transactionsQuery.data ?? [];
  const obligations = obligationsQuery.data ?? [];

  return (
    <div className="mt-10 space-y-8 border-t border-stone-800 pt-8">
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400">
          Linked transactions
        </h2>
        {transactionsQuery.isLoading ? (
          <p className="mt-3 text-sm text-stone-500">Loading transactions…</p>
        ) : null}
        {transactions.length === 0 && transactionsQuery.data ? (
          <p className="mt-3 text-sm text-stone-500">No transactions linked to this vendor.</p>
        ) : null}
        {transactions.length > 0 ? (
          <ul className="mt-3 divide-y divide-stone-800 rounded-xl border border-stone-800">
            {transactions.map((transaction) => (
              <li key={transaction.id} className="flex items-center justify-between px-4 py-3">
                <Link
                  to={`/finance/transactions/${transaction.id}`}
                  className="font-medium text-stone-100 hover:text-sky-300"
                >
                  {transaction.title}
                </Link>
                <span className="text-sm text-stone-500">
                  {formatPrice(transaction.price_amount, transaction.currency) ?? transaction.status}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400">
          Linked subscriptions
        </h2>
        {obligationsQuery.isLoading ? (
          <p className="mt-3 text-sm text-stone-500">Loading subscriptions…</p>
        ) : null}
        {obligations.length === 0 && obligationsQuery.data ? (
          <p className="mt-3 text-sm text-stone-500">No subscriptions linked to this vendor.</p>
        ) : null}
        {obligations.length > 0 ? (
          <ul className="mt-3 divide-y divide-stone-800 rounded-xl border border-stone-800">
            {obligations.map((obligation) => (
              <li key={obligation.id} className="flex items-center justify-between px-4 py-3">
                <Link
                  to={`/finance/subscriptions/${obligation.id}`}
                  className="font-medium text-stone-100 hover:text-sky-300"
                >
                  {obligation.name}
                </Link>
                <span className="text-sm text-stone-500">
                  {formatBillingSummary(
                    obligation.amount,
                    obligation.currency,
                    obligation.billing_interval,
                  ) ?? obligation.status}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
