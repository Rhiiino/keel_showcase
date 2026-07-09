// Inline ordered and received date fields for purchase detail.

type FinanceDetailInlineDatesProps = {
  orderedAtDraft: string;
  receivedAtDraft: string;
  onOrderedAtDraftChange: (value: string) => void;
  onReceivedAtDraftChange: (value: string) => void;
  disabled?: boolean;
};

export function FinanceDetailInlineDates({
  orderedAtDraft,
  receivedAtDraft,
  onOrderedAtDraftChange,
  onReceivedAtDraftChange,
  disabled = false,
}: FinanceDetailInlineDatesProps) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-stone-500">
          Ordered
        </span>
        <input
          type="date"
          value={orderedAtDraft}
          disabled={disabled}
          onChange={(event) => onOrderedAtDraftChange(event.target.value)}
          className="rounded-lg border-0 bg-stone-900/50 px-3 py-2 text-sm text-stone-100 ring-1 ring-stone-800 focus:ring-stone-600 disabled:opacity-50"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-stone-500">
          Received
        </span>
        <input
          type="date"
          value={receivedAtDraft}
          disabled={disabled}
          onChange={(event) => onReceivedAtDraftChange(event.target.value)}
          className="rounded-lg border-0 bg-stone-900/50 px-3 py-2 text-sm text-stone-100 ring-1 ring-stone-800 focus:ring-stone-600 disabled:opacity-50"
        />
      </label>
    </div>
  );
}
