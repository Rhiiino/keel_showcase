// stack_sandbox/frontend_web/src/modules/agents/components/EditableText.tsx

// In-place text editing via contentEditable (no input/textarea chrome).

import { useEffect, useRef } from "react";

type EditableTextProps = {
  value: string;
  onChange: (value: string) => void;
  editable?: boolean;
  className?: string;
  editableClassName?: string;
  as?: "div" | "h3" | "p";
  placeholder?: string;
};

function defaultEditablePadding(as: EditableTextProps["as"]) {
  if (as === "h3") {
    return "px-2.5 py-1.5";
  }
  if (as === "p") {
    return "px-3 py-2.5";
  }
  return "px-2.5 py-2";
}

const editableFocusClasses =
  "rounded-md outline-none focus:ring-1 focus:ring-inset focus:ring-lime-400/30";

function normalizeEditableText(element: HTMLElement) {
  return element.innerText.replace(/\r\n/g, "\n");
}

export function EditableText({
  value,
  onChange,
  editable = true,
  className,
  editableClassName,
  as: Tag = "div",
  placeholder,
}: EditableTextProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || !editable) {
      return;
    }
    if (normalizeEditableText(element) !== value) {
      element.innerText = value;
    }
  }, [editable, value]);

  if (!editable) {
    return <Tag className={className}>{value}</Tag>;
  }

  return (
    <Tag
      ref={ref as never}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline={Tag !== "h3"}
      data-placeholder={placeholder}
      className={[
        className,
        editableFocusClasses,
        editableClassName ?? defaultEditablePadding(Tag),
        "empty:before:text-stone-600 empty:before:content-[attr(data-placeholder)]",
      ]
        .filter(Boolean)
        .join(" ")}
      onInput={(event) => {
        onChange(normalizeEditableText(event.currentTarget));
      }}
      onPaste={(event) => {
        event.preventDefault();
        const text = event.clipboardData.getData("text/plain");
        document.execCommand("insertText", false, text);
      }}
    />
  );
}
