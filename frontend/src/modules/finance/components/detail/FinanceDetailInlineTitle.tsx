// stack_sandbox/frontend_web/src/modules/shop/components/detail/FinanceDetailInlineTitle.tsx

// Click-to-edit item title on the shop detail view.

import { useLayoutEffect, useRef, useState } from "react";

type FinanceDetailInlineTitleProps = {
  value: string;
  onChange: (nextTitle: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

const TITLE_CLASS = "text-3xl font-semibold tracking-tight sm:text-4xl";

export function FinanceDetailInlineTitle({
  value,
  onChange,
  disabled = false,
  placeholder,
}: FinanceDetailInlineTitleProps) {
  const mirrorRef = useRef<HTMLSpanElement>(null);
  const [inputWidth, setInputWidth] = useState(48);

  useLayoutEffect(() => {
    const mirror = mirrorRef.current;
    if (!mirror) {
      return;
    }
    setInputWidth(Math.max(mirror.offsetWidth + 2, 24));
  }, [placeholder, value]);

  return (
    <div className="max-w-full">
      <div className="relative max-w-full">
        <span
          ref={mirrorRef}
          aria-hidden
          className={[
            "pointer-events-none invisible absolute left-0 top-0 whitespace-pre",
            TITLE_CLASS,
          ].join(" ")}
        >
          {value || placeholder || "\u00A0"}
        </span>
        <input
          type="text"
          value={value}
          maxLength={512}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          style={{ width: inputWidth }}
          aria-label="Item title"
          placeholder={placeholder}
          className={[
            "block max-w-full cursor-text border-0 bg-transparent text-stone-50 shadow-none outline-none ring-0 placeholder:text-stone-600 focus:border-0 focus:outline-none focus:ring-0",
            TITLE_CLASS,
          ].join(" ")}
        />
      </div>
    </div>
  );
}
