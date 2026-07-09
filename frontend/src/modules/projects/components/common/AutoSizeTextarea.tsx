// stack_sandbox/frontend_web/src/modules/projects/components/common/AutoSizeTextarea.tsx

// Textarea that grows with content and cannot be manually resized.

import { useEffect, useRef, type TextareaHTMLAttributes } from "react";

type AutoSizeTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function AutoSizeTextarea({
  value,
  className,
  onChange,
  ...props
}: AutoSizeTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      rows={1}
      className={["resize-none overflow-hidden", className ?? ""].join(" ")}
      {...props}
    />
  );
}
