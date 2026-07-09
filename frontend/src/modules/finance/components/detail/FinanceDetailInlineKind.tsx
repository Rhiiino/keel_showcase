// keel_web/src/modules/finance/components/detail/FinanceDetailInlineKind.tsx

import type { FinanceTransactionKind } from "../../lib/transaction";
import { KIND_LABELS, TRANSACTION_KINDS } from "../../lib/transaction";

type FinanceDetailInlineKindProps = {
  kindDraft: FinanceTransactionKind;
  onKindDraftChange: (kind: FinanceTransactionKind) => void;
  disabled?: boolean;
};

export function FinanceDetailInlineKind({
  kindDraft,
  onKindDraftChange,
  disabled = false,
}: FinanceDetailInlineKindProps) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">
        Kind
      </p>
      <select
        value={kindDraft}
        onChange={(event) => onKindDraftChange(event.target.value as FinanceTransactionKind)}
        disabled={disabled}
        className="w-full max-w-xs rounded-lg border border-stone-700 bg-stone-900/80 px-3 py-2 text-sm text-stone-100"
      >
        {TRANSACTION_KINDS.map((kind) => (
          <option key={kind} value={kind}>
            {KIND_LABELS[kind]}
          </option>
        ))}
      </select>
    </div>
  );
}
