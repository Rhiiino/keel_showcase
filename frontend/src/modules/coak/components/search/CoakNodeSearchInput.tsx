// keel_web/src/modules/coak/components/search/CoakNodeSearchInput.tsx

import { useCallback, useEffect, useLayoutEffect, useRef, type ChangeEvent } from "react";

import {
  registerCoakSearchInput,
  setActiveCoakSearchSlot,
  type CoakSearchFocusSlot,
} from "../../lib/search/coakSearchFocus";

type CoakNodeSearchInputProps = {
  value: string;
  disabled?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  focusSlot: CoakSearchFocusSlot;
  onChange: (value: string) => void;
};

export function CoakNodeSearchInput({
  value,
  disabled = false,
  placeholder = "Search nodes…",
  ariaLabel = "Search nodes",
  className = "",
  focusSlot,
  onChange,
}: CoakNodeSearchInputProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const preserveFocusRef = useRef(false);

  const setInputElement = useCallback(
    (node: HTMLInputElement | null) => {
      (inputRef as { current: HTMLInputElement | null }).current = node;
      registerCoakSearchInput(focusSlot, node);
    },
    [focusSlot],
  );

  useEffect(() => {
    return () => registerCoakSearchInput(focusSlot, null);
  }, [focusSlot]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node) || rootRef.current?.contains(target)) {
        return;
      }
      preserveFocusRef.current = false;
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => document.removeEventListener("pointerdown", handlePointerDown, true);
  }, []);

  const restoreFocus = useCallback(() => {
    if (!preserveFocusRef.current) {
      return;
    }
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (document.activeElement === inputRef.current) {
      preserveFocusRef.current = true;
      setActiveCoakSearchSlot(focusSlot);
    }
    onChange(event.target.value);
  };

  const handleFocus = () => {
    preserveFocusRef.current = true;
    setActiveCoakSearchSlot(focusSlot);
  };

  useLayoutEffect(() => {
    restoreFocus();
  });

  useEffect(() => {
    const frameId = requestAnimationFrame(restoreFocus);
    return () => cancelAnimationFrame(frameId);
  }, [restoreFocus, value]);

  return (
    <div ref={rootRef} className={`relative ${className}`.trim()}>
      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-500">
        <svg
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <circle cx="11" cy="11" r="6" />
          <path strokeLinecap="round" strokeLinejoin="round" d="m16 16 4 4" />
        </svg>
      </div>
      <input
        ref={setInputElement}
        type="text"
        role="searchbox"
        value={value}
        disabled={disabled}
        onChange={handleChange}
        onFocus={handleFocus}
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="h-8 w-full rounded-full border border-stone-700/80 bg-stone-950/70 py-1.5 pl-9 pr-3 text-xs text-stone-200 placeholder:text-stone-500 shadow-lg shadow-black/20 outline-none backdrop-blur-sm transition focus:border-stone-500 focus:bg-stone-900/80 disabled:opacity-60"
      />
    </div>
  );
}
