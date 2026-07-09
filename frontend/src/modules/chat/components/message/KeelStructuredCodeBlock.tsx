// stack_sandbox/frontend_web/src/modules/chat/components/message/KeelStructuredCodeBlock.tsx

// Renders ```keel:record``` / ```keel:proposal``` fences as cards; falls back to code blocks.

import { isValidElement, type ReactNode } from "react";

import { keelBlockLanguage, parseKeelBlock } from "../../lib/keelBlocks";
import { CopyableCodeBlock } from "./CopyableCodeBlock";
import { ProposalCard } from "./ProposalCard";
import { RecordCard } from "./RecordCard";

type KeelStructuredCodeBlockProps = {
  children?: ReactNode;
};

function extractCodeFromPre(children: ReactNode): {
  className?: string;
  text: string;
} | null {
  if (!children) {
    return null;
  }
  const nodes = Array.isArray(children) ? children : [children];
  for (const node of nodes) {
    if (!isValidElement(node)) {
      continue;
    }
    const props = node.props as { className?: string; children?: ReactNode };
    if (typeof props.className === "string" && props.className.includes("language-")) {
      const text =
        typeof props.children === "string"
          ? props.children
          : Array.isArray(props.children)
            ? props.children.join("")
            : String(props.children ?? "");
      return { className: props.className, text };
    }
  }
  return null;
}

export function KeelStructuredCodeBlock({ children }: KeelStructuredCodeBlockProps) {
  const code = extractCodeFromPre(children);
  if (code) {
    const language = keelBlockLanguage(code.className);
    if (language) {
      const block = parseKeelBlock(language, code.text);
      if (block?.kind === "proposal") {
        return <ProposalCard block={block} />;
      }
      if (block?.kind === "record") {
        return <RecordCard block={block} />;
      }
    }
  }

  return <CopyableCodeBlock>{children}</CopyableCodeBlock>;
}
