// keel_web/src/modules/projects/lib/workspace/note/workspaceNoteTextSelectionPosition.ts

// Maps textarea selection indices to viewport coordinates for floating toolbars.

const TEXTAREA_MIRROR_STYLE_PROPERTIES = [
  "direction",
  "boxSizing",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderTopStyle",
  "borderRightStyle",
  "borderBottomStyle",
  "borderLeftStyle",
  "borderTopColor",
  "borderRightColor",
  "borderBottomColor",
  "borderLeftColor",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "fontStyle",
  "fontVariant",
  "fontWeight",
  "fontStretch",
  "fontSize",
  "fontSizeAdjust",
  "lineHeight",
  "fontFamily",
  "textAlign",
  "textTransform",
  "textIndent",
  "textDecoration",
  "letterSpacing",
  "wordSpacing",
  "tabSize",
  "overflowWrap",
  "wordBreak",
] as const;

export function getTextareaSelectionRect(
  textarea: HTMLTextAreaElement,
  selectionStart: number,
  selectionEnd: number,
): DOMRect | null {
  if (selectionStart === selectionEnd) {
    return null;
  }

  const safeStart = Math.max(0, Math.min(selectionStart, textarea.value.length));
  const safeEnd = Math.max(safeStart, Math.min(selectionEnd, textarea.value.length));
  const style = window.getComputedStyle(textarea);
  const textareaRect = textarea.getBoundingClientRect();

  const mirror = document.createElement("div");
  mirror.setAttribute("aria-hidden", "true");
  for (const property of TEXTAREA_MIRROR_STYLE_PROPERTIES) {
    mirror.style.setProperty(property, style.getPropertyValue(property));
  }

  mirror.style.position = "fixed";
  mirror.style.top = `${textareaRect.top}px`;
  mirror.style.left = `${textareaRect.left}px`;
  mirror.style.width = `${textareaRect.width}px`;
  mirror.style.height = `${textareaRect.height}px`;
  mirror.style.visibility = "hidden";
  mirror.style.pointerEvents = "none";
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.wordWrap = "break-word";
  mirror.style.overflow = "hidden";
  mirror.style.zIndex = "-1";
  mirror.scrollTop = textarea.scrollTop;
  mirror.scrollLeft = textarea.scrollLeft;

  const before = document.createTextNode(textarea.value.slice(0, safeStart));
  const marker = document.createElement("span");
  marker.textContent = textarea.value.slice(safeStart, safeEnd) || "\u200b";
  mirror.append(before, marker);

  document.body.appendChild(mirror);

  const left = textareaRect.left + marker.offsetLeft - mirror.scrollLeft;
  const top = textareaRect.top + marker.offsetTop - mirror.scrollTop;
  const width = marker.offsetWidth;
  const height = marker.offsetHeight;

  document.body.removeChild(mirror);

  if (width === 0 && height === 0) {
    const paddingTop = Number.parseFloat(style.paddingTop) || 0;
    const lineHeight = Number.parseFloat(style.lineHeight) || 16;
    return new DOMRect(
      textareaRect.left + paddingTop,
      textareaRect.top + paddingTop,
      0,
      lineHeight,
    );
  }

  return new DOMRect(left, top, width, height);
}
