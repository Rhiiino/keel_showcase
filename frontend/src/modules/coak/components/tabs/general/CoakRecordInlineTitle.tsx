// keel_web/src/modules/coak/components/directory/CoakRecordInlineTitle.tsx

import { useLayoutEffect, useRef, useState } from "react";

type CoakRecordInlineTitleProps = {
  value: string;
  onChange: (nextTitle: string) => void;
  onBlur?: () => void;
  onEscape?: () => void;
  disabled?: boolean;
  placeholder?: string;
};

const TITLE_CLASS = "text-2xl font-semibold tracking-tight leading-tight";

export function CoakRecordInlineTitle({
  value,
  onChange,
  onBlur,
  onEscape,
  disabled = false,
  placeholder = "Record name",
}: CoakRecordInlineTitleProps) {
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
            TITLE_CLASS,
          ].join(" ")}
        >
          {value || placeholder || "\u00A0"}
        </span>
        <input
          type="text"
          value={value}
          maxLength={256}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
            if (event.key === "Escape") {
              event.preventDefault();
              onEscape?.();
              event.currentTarget.blur();
            }
          }}
          style={{ width: inputWidth }}
          aria-label="Record name"
          className={[
            "block max-w-full cursor-text border-0 bg-transparent text-stone-50 shadow-none outline-none ring-0 placeholder:text-stone-600 focus:border-0 focus:outline-none focus:ring-0",
            TITLE_CLASS,
          ].join(" ")}
        />
      </div>
    </div>
  );
}
