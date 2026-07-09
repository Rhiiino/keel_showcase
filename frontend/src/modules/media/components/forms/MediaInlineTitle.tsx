// keel_web/src/modules/media/components/forms/MediaInlineTitle.tsx

// Click-to-edit title on media detail and create forms.

import { useLayoutEffect, useRef, useState } from "react";

type MediaInlineTitleProps = {
  value: string;
  onChange?: (nextTitle: string) => void;
  editable?: boolean;
  placeholder?: string;
  disabled?: boolean;
};

const TITLE_CLASS =
  "text-3xl font-semibold tracking-tight text-stone-50 sm:text-4xl";

export function MediaInlineTitle({
  value,
  onChange,
  editable = false,
  placeholder = "Untitled file",
  disabled = false,
}: MediaInlineTitleProps) {
  const mirrorRef = useRef<HTMLSpanElement>(null);
  const [inputWidth, setInputWidth] = useState(48);

  useLayoutEffect(() => {
    const mirror = mirrorRef.current;
    if (!mirror) {
      return;
    }

    setInputWidth(Math.max(mirror.offsetWidth + 2, 48));
  }, [value, placeholder]);

  if (!editable || !onChange) {
    return (
      <h1
        className={TITLE_CLASS}
        style={{
          fontFamily: '"Playfair Display", Georgia, "Times New Roman", serif',
        }}
      >
        {value.trim() || placeholder}
      </h1>
    );
  }

  return (
    <div className="relative max-w-full">
      <span
        ref={mirrorRef}
        aria-hidden
        className={[
          "pointer-events-none invisible absolute whitespace-pre",
          TITLE_CLASS,
        ].join(" ")}
        style={{
          fontFamily: '"Playfair Display", Georgia, "Times New Roman", serif',
        }}
      >
        {value || placeholder || "\u00A0"}
      </span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        aria-label="File name"
        style={{
          width: inputWidth,
          fontFamily: '"Playfair Display", Georgia, "Times New Roman", serif',
        }}
        className={[
          "block max-w-full cursor-text border-0 bg-transparent text-stone-50 shadow-none outline-none ring-0 placeholder:text-stone-600 focus:border-0 focus:outline-none focus:ring-0",
          TITLE_CLASS,
        ].join(" ")}
      />
    </div>
  );
}
