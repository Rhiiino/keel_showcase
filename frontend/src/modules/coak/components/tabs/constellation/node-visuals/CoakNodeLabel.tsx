// keel_web/src/modules/coak/components/tabs/constellation/node-visuals/CoakNodeLabel.tsx

import { Html } from "@react-three/drei";

import type { CoakItemKind, CoakTag } from "../../../../api";
import { CoakTagPill } from "../../../tags/CoakTagPill";

type CoakNodeLabelProps = {
  label: string;
  radius: number;
  kind?: CoakItemKind;
  color?: string;
  tags?: CoakTag[];
};

function CoakNodeFolderIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3 w-3 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 7a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"
      />
    </svg>
  );
}

export function CoakNodeLabel({ label, radius, kind, color, tags = [] }: CoakNodeLabelProps) {
  return (
    <Html
      position={[radius * 1.35, 0, 0]}
      zIndexRange={[100, 0]}
      occlude="blending"
      style={{
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      <div className="flex max-w-[9rem] flex-col gap-1">
        <span
          className="inline-flex min-w-0 items-center gap-1 text-[11px] font-medium leading-none"
          style={{
            color: color ?? "rgba(231, 229, 228, 0.92)",
            textShadow:
              "0 0 6px rgba(8, 8, 8, 0.95), 0 1px 2px rgba(0, 0, 0, 0.85)",
          }}
        >
          {kind === "folder" ? <CoakNodeFolderIcon /> : null}
          <span className="min-w-0 truncate">{label}</span>
        </span>
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <CoakTagPill key={tag.id} tag={tag} compact />
            ))}
          </div>
        ) : null}
      </div>
    </Html>
  );
}
