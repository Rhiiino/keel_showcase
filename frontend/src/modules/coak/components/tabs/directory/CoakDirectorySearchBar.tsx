// keel_web/src/modules/coak/components/tabs/directory/CoakDirectorySearchBar.tsx

import { CoakNodeSearchInput } from "../../search/CoakNodeSearchInput";

type CoakDirectorySearchBarProps = {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

export function CoakDirectorySearchBar({
  value,
  disabled = false,
  onChange,
}: CoakDirectorySearchBarProps) {
  return (
    <div className="shrink-0 border-b border-stone-800/80 px-3 py-2">
      <CoakNodeSearchInput
        value={value}
        disabled={disabled}
        focusSlot="directory"
        onChange={onChange}
        placeholder="Search directory…"
        ariaLabel="Search directory"
      />
    </div>
  );
}
