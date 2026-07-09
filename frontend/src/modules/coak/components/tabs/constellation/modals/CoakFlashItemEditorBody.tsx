// keel_web/src/modules/coak/components/tabs/constellation/modals/CoakFlashItemEditorBody.tsx

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
  type TransitionEvent,
} from "react";

import type { CoakItem } from "../../../../api";
import { measureAutoResizeTextarea } from "../../../../hooks/tabs/constellation/useAutoResizeTextarea";
import { useCoakRecordWorkspace } from "../../../../context/CoakRecordWorkspaceContext";
import { normalizeHexColor } from "../../../../lib/tabs/constellation/coakNodeLayout";

const FLIP_ANIMATION_MS = 400;
const DEFAULT_FLASH_ACCENT = "#f59e0b";
const FLASH_TEXTAREA_MIN_HEIGHT = 72;
const FLASH_CARD_CHROME_HEIGHT = 58;

type CoakFlashItemEditorBodyProps = {
  item: CoakItem;
  disabled?: boolean;
  open: boolean;
  shouldFocusQuestion?: boolean;
};

function flashAccentStyles(accentColor: string) {
  return {
    cardBorder: `color-mix(in srgb, ${accentColor} 42%, rgb(68 64 60))`,
    cardGlow: `color-mix(in srgb, ${accentColor} 18%, transparent)`,
    cardFillTop: `color-mix(in srgb, ${accentColor} 14%, rgb(12 10 9))`,
    cardFillBottom: `color-mix(in srgb, ${accentColor} 6%, rgb(12 10 9))`,
    chipBg: `color-mix(in srgb, ${accentColor} 24%, rgb(28 25 23))`,
    chipText: accentColor,
    flipBorder: `color-mix(in srgb, ${accentColor} 38%, rgb(68 64 60))`,
    flipHover: `color-mix(in srgb, ${accentColor} 52%, rgb(120 113 108))`,
  };
}

export function CoakFlashFlipButton({
  disabled,
  isFlipping,
  flipped,
  accentColor,
  onClick,
}: {
  disabled?: boolean;
  isFlipping: boolean;
  flipped: boolean;
  accentColor: string;
  onClick: () => void;
}) {
  const accent = flashAccentStyles(normalizeHexColor(accentColor || DEFAULT_FLASH_ACCENT));

  return (
    <button
      type="button"
      disabled={disabled || isFlipping}
      onClick={onClick}
      aria-label={flipped ? "Show question" : "Show answer"}
      className="inline-flex shrink-0 items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition disabled:opacity-50"
      style={{
        borderColor: accent.flipBorder,
        color: accent.chipText,
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.borderColor = accent.flipHover;
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.borderColor = accent.flipBorder;
      }}
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0 4 4m-4-4 4-4m6 12v12m0 0 4-4m-4 4-4-4" />
      </svg>
      Flip
    </button>
  );
}

function CoakFlashCardFace({
  label,
  value,
  placeholder,
  ariaLabel,
  disabled,
  accent,
  inputRef,
  onChange,
  onCommit,
}: {
  label: string;
  value: string;
  placeholder: string;
  ariaLabel: string;
  disabled?: boolean;
  accent: ReturnType<typeof flashAccentStyles>;
  inputRef?: RefObject<HTMLTextAreaElement | null>;
  onChange: (value: string) => void;
  onCommit: () => void;
}) {
  return (
    <div
      className="flex flex-col rounded-xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus-within:ring-2 focus-within:ring-lime-400/10"
      style={{
        borderColor: accent.cardBorder,
        backgroundImage: `linear-gradient(180deg, ${accent.cardFillTop} 0%, ${accent.cardFillBottom} 100%)`,
        boxShadow: `inset 0 1px 0 ${accent.cardGlow}`,
      }}
    >
      <div
        className="flex items-center justify-between border-b px-2.5 py-1.5"
        style={{ borderColor: accent.cardBorder }}
      >
        <span
          className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
          style={{
            backgroundColor: accent.chipBg,
            color: accent.chipText,
          }}
        >
          {label}
        </span>
      </div>
      <textarea
        ref={inputRef as RefObject<HTMLTextAreaElement> | undefined}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onCommit}
        aria-label={ariaLabel}
        placeholder={placeholder}
        className="w-full resize-none overflow-hidden bg-transparent px-3 py-2.5 text-sm leading-relaxed text-stone-100 outline-none placeholder:text-stone-500/90"
        rows={1}
      />
    </div>
  );
}

export function CoakFlashItemEditorBody({
  item,
  disabled,
  open,
  shouldFocusQuestion = false,
}: CoakFlashItemEditorBodyProps) {
  const { updateFlashContent, isNodeSearchActive } = useCoakRecordWorkspace();
  const [draftFront, setDraftFront] = useState(item.flash_front);
  const [draftBack, setDraftBack] = useState(item.flash_back);
  const [flipped, setFlipped] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipTransitionEnabled, setFlipTransitionEnabled] = useState(false);
  const [cardHeight, setCardHeight] = useState(
    FLASH_TEXTAREA_MIN_HEIGHT + FLASH_CARD_CHROME_HEIGHT,
  );
  const frontRef = useRef<HTMLTextAreaElement>(null);
  const backRef = useRef<HTMLTextAreaElement>(null);
  const accent = useMemo(
    () => flashAccentStyles(normalizeHexColor(item.color_hex || DEFAULT_FLASH_ACCENT)),
    [item.color_hex],
  );

  useEffect(() => {
    setDraftFront(item.flash_front);
    setDraftBack(item.flash_back);
    setFlipTransitionEnabled(false);
    setFlipped(false);
    setIsFlipping(false);
  }, [item.id, item.flash_front, item.flash_back]);

  useEffect(() => {
    if (!open || isNodeSearchActive || !shouldFocusQuestion) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      frontRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isNodeSearchActive, item.id, open, shouldFocusQuestion]);

  useLayoutEffect(() => {
    const frontHeight = frontRef.current
      ? measureAutoResizeTextarea(frontRef.current, FLASH_TEXTAREA_MIN_HEIGHT)
      : FLASH_TEXTAREA_MIN_HEIGHT;
    const backHeight = backRef.current
      ? measureAutoResizeTextarea(backRef.current, FLASH_TEXTAREA_MIN_HEIGHT)
      : FLASH_TEXTAREA_MIN_HEIGHT;
    setCardHeight(Math.max(frontHeight, backHeight) + FLASH_CARD_CHROME_HEIGHT);
  }, [draftBack, draftFront, open]);

  const commitFront = useCallback(async () => {
    if (draftFront === item.flash_front) {
      return;
    }
    await updateFlashContent(item.id, { flash_front: draftFront });
  }, [draftFront, item.flash_front, item.id, updateFlashContent]);

  const commitBack = useCallback(async () => {
    if (draftBack === item.flash_back) {
      return;
    }
    await updateFlashContent(item.id, { flash_back: draftBack });
  }, [draftBack, item.flash_back, item.id, updateFlashContent]);

  const handleFlip = () => {
    if (isFlipping) {
      return;
    }
    setIsFlipping(true);
    setFlipTransitionEnabled(true);
    setFlipped((current) => !current);
  };

  const handleFlipTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.propertyName !== "transform") {
      return;
    }
    setIsFlipping(false);
  };

  return (
    <div className="flex min-h-0 flex-col gap-2.5">
      <div className="[perspective:900px]">
        <div
          className="relative [transform-style:preserve-3d]"
          style={{
            height: cardHeight,
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            transition: flipTransitionEnabled
              ? `transform ${FLIP_ANIMATION_MS}ms ease-in-out`
              : "none",
          }}
          onTransitionEnd={handleFlipTransitionEnd}
        >
          <div className="absolute inset-0 [backface-visibility:hidden]">
            <CoakFlashCardFace
              label="Question"
              value={draftFront}
              placeholder="Question or prompt…"
              ariaLabel="Flash card question"
              disabled={disabled || isFlipping}
              accent={accent}
              inputRef={frontRef}
              onChange={setDraftFront}
              onCommit={() => {
                void commitFront();
              }}
            />
          </div>

          <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <CoakFlashCardFace
              label="Answer"
              value={draftBack}
              placeholder="Answer…"
              ariaLabel="Flash card answer"
              disabled={disabled || isFlipping}
              accent={accent}
              inputRef={backRef}
              onChange={setDraftBack}
              onCommit={() => {
                void commitBack();
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <CoakFlashFlipButton
          disabled={disabled}
          isFlipping={isFlipping}
          flipped={flipped}
          accentColor={item.color_hex || DEFAULT_FLASH_ACCENT}
          onClick={handleFlip}
        />
      </div>
    </div>
  );
}
