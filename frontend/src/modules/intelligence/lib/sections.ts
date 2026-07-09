// stack_sandbox/frontend_web/src/modules/intelligence/lib/sections.ts

// Hub section registry for the Intelligence menu.

export type IntelligenceSection = {
  id: "models" | "tools";
  title: string;
  description: string;
  href: string;
};

export function intelligenceToolsCategoryHref(categoryKey: string): string {
  return `/intelligence/tools?category=${encodeURIComponent(categoryKey)}`;
}

export const intelligenceSections: IntelligenceSection[] = [
  {
    id: "models",
    title: "Models",
    description: "LLM providers and their registered models.",
    href: "/intelligence/models",
  },
  {
    id: "tools",
    title: "Tools",
    description: "Tool categories and the tools granted to agents.",
    href: "/intelligence/tools",
  },
];
