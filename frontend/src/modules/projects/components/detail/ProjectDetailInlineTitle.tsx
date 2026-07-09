// stack_sandbox/frontend_web/src/modules/projects/components/detail/ProjectDetailInlineTitle.tsx

// Click-to-edit project title on the detail display view (saved via header Save).

import { useLayoutEffect, useRef, useState } from "react";

import {
  projectTitleFontStyle,
  type ProjectTitleFontKey,
} from "../../lib/project/appearance";
import { ProjectDetailInlineTitleFontPicker } from "./ProjectDetailInlineTitleFontPicker";

type ProjectDetailInlineTitleProps = {
  value: string;
  onChange: (nextTitle: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  titleFontDraft: ProjectTitleFontKey;
  onTitleFontDraftChange: (nextFont: ProjectTitleFontKey) => void;
  disabled?: boolean;
  titleClassName?: string;
  inputToneClassName?: string;
  fontPickerAlwaysVisible?: boolean;
  fontPickerMenuAlign?: "left" | "right";
};

const DEFAULT_TITLE_CLASS =
  "text-3xl font-semibold tracking-tight sm:text-4xl";

const DEFAULT_INPUT_TONE_CLASS =
  "text-stone-50 placeholder:text-stone-600";

export function ProjectDetailInlineTitle({
  value,
  onChange,
  onBlur,
  placeholder,
  titleFontDraft,
  onTitleFontDraftChange,
  disabled = false,
  titleClassName = DEFAULT_TITLE_CLASS,
  inputToneClassName = DEFAULT_INPUT_TONE_CLASS,
  fontPickerAlwaysVisible = false,
  fontPickerMenuAlign = "left",
}: ProjectDetailInlineTitleProps) {
  const mirrorRef = useRef<HTMLSpanElement>(null);
  const [inputWidth, setInputWidth] = useState(48);

  const fontStyle = projectTitleFontStyle(titleFontDraft);

  useLayoutEffect(() => {
    const mirror = mirrorRef.current;
    if (!mirror) {
      return;
    }

    setInputWidth(Math.max(mirror.offsetWidth + 2, 48));
  }, [value, placeholder, titleFontDraft]);

  return (
    <div className="group/title max-w-full">
      <div className="inline-flex max-w-full items-start gap-1.5">
        <div className="mt-1.5 flex w-8 shrink-0 items-center justify-center sm:mt-2">
          <ProjectDetailInlineTitleFontPicker
            titleFontDraft={titleFontDraft}
            onTitleFontDraftChange={onTitleFontDraftChange}
            disabled={disabled}
            alwaysVisible={fontPickerAlwaysVisible}
            menuAlign={fontPickerMenuAlign}
          />
        </div>
        <div className="relative max-w-[calc(100%-2.25rem)]">
          <span
            ref={mirrorRef}
            aria-hidden
            className={[
              "pointer-events-none invisible absolute left-0 top-0 whitespace-pre",
              titleClassName,
            ].join(" ")}
            style={fontStyle}
          >
            {value || placeholder || "\u00A0"}
          </span>
          <input
            type="text"
            value={value}
            placeholder={placeholder}
            maxLength={512}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
            onBlur={onBlur}
            style={{ ...fontStyle, width: inputWidth }}
            aria-label="Project title"
            className={[
              "block max-w-full cursor-text border-0 bg-transparent shadow-none outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0",
              titleClassName,
              inputToneClassName,
            ].join(" ")}
          />
        </div>
      </div>
    </div>
  );
}
