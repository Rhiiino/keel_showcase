// stack_sandbox/frontend_web/src/modules/chat/components/message/RecordCard.tsx

// Styled card for ```keel:record``` structured data in assistant messages.

import type { ReactNode } from "react";

import type { KeelRecordField } from "../../lib/keelBlocks";

export type RecordCardDisplay = {
  entity: string;
  title: string;
  image_url?: string | null;
  fields: KeelRecordField[];
};

type RecordCardProps = {
  block: RecordCardDisplay;
  footer?: ReactNode;
  statusBadge?: ReactNode;
};

function formatEntityLabel(entity: string): string {
  return entity
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function RecordCard({ block, footer, statusBadge }: RecordCardProps) {
  return (
    <div
      className="my-3 overflow-hidden rounded-xl border border-stone-800 bg-stone-950/80 text-left"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex gap-3 border-b border-stone-800/80 px-4 py-3">
        {block.image_url && (
          <img
            src={block.image_url}
            alt=""
            className="h-16 w-16 shrink-0 rounded-lg object-cover ring-1 ring-stone-700"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-stone-500">
              {formatEntityLabel(block.entity)}
            </span>
            {statusBadge}
          </div>
          <h4 className="mt-1 text-sm font-semibold text-stone-100">{block.title}</h4>
        </div>
      </div>
      {block.fields.length > 0 && (
        <table className="w-full text-xs">
          <tbody>
            {block.fields.map((field: KeelRecordField) => (
              <tr key={field.label} className="border-t border-stone-800/60">
                <th className="w-[38%] px-4 py-2 text-left font-medium text-stone-500">
                  {field.label}
                </th>
                <td className="px-4 py-2 text-stone-200">{field.value || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {footer && <div className="border-t border-stone-800/80 px-4 py-3">{footer}</div>}
    </div>
  );
}
