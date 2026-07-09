// stack_sandbox/frontend_web/src/modules/chat/components/message/MessageMarkdown.tsx

// Renders assistant message content as GitHub-flavored Markdown.

import type { Components } from "react-markdown";
import { all } from "lowlight";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

import "highlight.js/styles/github-dark-dimmed.min.css";

import { KeelStructuredCodeBlock } from "./KeelStructuredCodeBlock";

type MessageMarkdownProps = {
  content: string;
};

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mb-3 mt-4 text-base font-semibold text-stone-100 first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 mt-4 text-sm font-semibold text-stone-100 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-3 text-sm font-semibold text-stone-200 first:mt-0">{children}</h3>
  ),
  p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,
  ul: ({ children }) => (
    <ul className="my-2 list-disc space-y-1 pl-5 first:mt-0 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 list-decimal space-y-1 pl-5 first:mt-0 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-stone-600 pl-3 text-stone-400 first:mt-0 last:mb-0">
      {children}
    </blockquote>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sky-400 underline decoration-sky-400/40 underline-offset-2 hover:text-sky-300"
      onClick={(event) => event.stopPropagation()}
    >
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="font-semibold text-stone-100">{children}</strong>,
  em: ({ children }) => <em className="italic text-stone-300">{children}</em>,
  hr: () => <hr className="my-4 border-stone-700" />,
  code: ({ className, children, ...props }) => {
    const isHighlightedBlock =
      className?.includes("hljs") || className?.includes("language-");
    if (isHighlightedBlock) {
      return (
        <code
          className={`${className ?? ""} block p-3 font-mono text-xs leading-relaxed`}
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code className="rounded bg-stone-800/80 px-1 py-0.5 font-mono text-[0.85em] text-stone-200">
        {children}
      </code>
    );
  },
  pre: ({ children }) => <KeelStructuredCodeBlock>{children}</KeelStructuredCodeBlock>,
  table: ({ children }) => (
    <div className="scrollbar-subtle my-3 overflow-x-auto first:mt-0 last:mb-0">
      <table className="w-full min-w-[16rem] border-collapse text-left text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="border-b border-stone-700 bg-stone-900/60">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-stone-800">{children}</tbody>,
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children }) => (
    <th className="px-3 py-2 font-semibold text-stone-200">{children}</th>
  ),
  td: ({ children }) => <td className="px-3 py-2 text-stone-300">{children}</td>,
};

export function MessageMarkdown({ content }: MessageMarkdownProps) {
  return (
    <div className="chat-markdown break-words text-sm leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { languages: all }]]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
