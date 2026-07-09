// keel_web/src/modules/coak/components/tabs/settings/CoakSettingsInfoIcon.tsx

import { useCallback, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

const TOOLTIP_WIDTH_PX = 208;

type CoakSettingsInfoIconProps = {
  text: string;
};

export function CoakSettingsInfoIcon({ text }: CoakSettingsInfoIconProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(false);
  const [style, setStyle] = useState<CSSProperties>({});

  const updatePosition = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    let left = rect.left;
    if (left + TOOLTIP_WIDTH_PX > window.innerWidth - 8) {
      left = window.innerWidth - TOOLTIP_WIDTH_PX - 8;
    }

    setStyle({
      position: "fixed",
      top: rect.bottom + 6,
      left,
      width: TOOLTIP_WIDTH_PX,
      zIndex: 10000,
    });
  }, []);

  const show = () => {
    updatePosition();
    setVisible(true);
  };

  const hide = () => {
    setVisible(false);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label="Setting information"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border border-stone-600 text-[9px] font-semibold leading-none text-stone-500 transition hover:border-stone-400 hover:text-stone-300"
      >
        i
      </button>
      {visible && typeof document !== "undefined"
        ? createPortal(
            <div
              role="tooltip"
              style={style}
              onMouseEnter={show}
              onMouseLeave={hide}
              className="rounded-md border border-stone-700 bg-stone-950 px-2.5 py-2 text-[11px] leading-snug text-stone-300 shadow-lg ring-1 ring-stone-800/80"
            >
              {text}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
