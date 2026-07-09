// keel_web/src/modules/people/shared/components/PersonInlineName.tsx

import { useLayoutEffect, useRef, useState } from "react";

type PersonInlineNameProps = {
  value: string;
  onChange: (nextName: string) => void;
  onEscape?: () => void;
  disabled?: boolean;
  placeholder?: string;
};

const NAME_CLASS = "text-2xl font-semibold leading-tight";

export function PersonInlineName({
  value,
  onChange,
  onEscape,
  disabled = false,
  placeholder = "Name",
}: PersonInlineNameProps) {
  const mirrorRef = useRef<HTMLSpanElement>(null);
  const [inputWidth, setInputWidth] = useState(48);

  useLayoutEffect(() => {
    const mirror = mirrorRef.current;
    if (!mirror) {
      return;
    }
    setInputWidth(Math.max(mirror.offsetWidth + 2, 48));
  }, [placeholder, value]);

  return (
    <div className="max-w-full">
      <div className="relative max-w-full">
        <span
          ref={mirrorRef}
          aria-hidden
          className={[
            "pointer-events-none invisible absolute left-0 top-0 whitespace-pre",
            NAME_CLASS,
          ].join(" ")}
        >
          {value || placeholder || "\u00A0"}
        </span>
        <input
          type="text"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              onEscape?.();
            }
          }}
          style={{ width: inputWidth }}
          aria-label="Name"
          className={[
            "block max-w-full cursor-text border-0 bg-transparent text-stone-50 shadow-none outline-none ring-0 placeholder:text-stone-600 focus:border-0 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60",
            NAME_CLASS,
          ].join(" ")}
        />
      </div>
    </div>
  );
}
