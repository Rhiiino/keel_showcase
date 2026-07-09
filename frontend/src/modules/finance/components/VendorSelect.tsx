// stack_sandbox/frontend_web/src/modules/shop/components/VendorSelect.tsx

// Vendor picker with search and link to vendor detail.

import { SearchableSelect } from "../../../components/select/SearchableSelect";
import type { FinanceVendor } from "../api";
import { VendorImageBox } from "./VendorImageBox";

type VendorSelectProps = {
  vendors: FinanceVendor[];
  value: number | null;
  onChange: (vendorId: number | null) => void;
  onNavigateToVendor?: (vendorId: number) => void;
  disabled?: boolean;
};

export function VendorSelect({
  vendors,
  value,
  onChange,
  onNavigateToVendor,
  disabled = false,
}: VendorSelectProps) {
  const options = vendors.map((vendor) => ({
    id: vendor.id,
    label: vendor.name,
    render: (
      <>
        <VendorImageBox
          vendorName={vendor.name}
          logo={vendor.logo}
          size="sm"
        />
        <span className="truncate">{vendor.name}</span>
      </>
    ),
  }));

  const selected = vendors.find((m) => m.id === value) ?? null;

  return (
    <SearchableSelect
      label="Vendor"
      options={options}
      value={value}
      onChange={onChange}
      noneLabel="No vendor"
      placeholder="Search vendors…"
      disabled={disabled}
      onNavigate={onNavigateToVendor}
      navigateAriaLabel={
        selected ? `Open vendor ${selected.name}` : "Open vendor"
      }
      renderTriggerValue={(option) =>
        option ? (
          <>
            <VendorImageBox
              vendorName={option.label}
              logo={vendors.find((m) => m.id === option.id)?.logo ?? null}
              size="sm"
            />
            <span className="truncate">{option.label}</span>
          </>
        ) : (
          <span className="text-stone-500">No vendor</span>
        )
      }
    />
  );
}
