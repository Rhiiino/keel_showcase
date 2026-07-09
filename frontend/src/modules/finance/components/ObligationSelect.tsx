// keel_web/src/modules/finance/components/ObligationSelect.tsx

// Subscription (obligation) picker with search and link to subscription detail.

import { SearchableSelect } from "../../../components/select/SearchableSelect";
import type { FinanceObligation } from "../api";

type ObligationSelectProps = {
  obligations: FinanceObligation[];
  value: number | null;
  onChange: (obligationId: number | null) => void;
  onNavigateToObligation?: (obligationId: number) => void;
  disabled?: boolean;
};

export function ObligationSelect({
  obligations,
  value,
  onChange,
  onNavigateToObligation,
  disabled = false,
}: ObligationSelectProps) {
  const options = obligations.map((obligation) => ({
    id: obligation.id,
    label: obligation.name,
    render: <span className="truncate">{obligation.name}</span>,
  }));

  const selected = obligations.find((obligation) => obligation.id === value) ?? null;

  return (
    <SearchableSelect
      label="Subscription"
      options={options}
      value={value}
      onChange={onChange}
      noneLabel="No subscription"
      placeholder="Search subscriptions…"
      disabled={disabled}
      onNavigate={onNavigateToObligation}
      navigateAriaLabel={
        selected ? `Open subscription ${selected.name}` : "Open subscription"
      }
      renderTriggerValue={(option) =>
        option ? (
          <span className="truncate">{option.label}</span>
        ) : (
          <span className="text-stone-500">No subscription</span>
        )
      }
    />
  );
}
