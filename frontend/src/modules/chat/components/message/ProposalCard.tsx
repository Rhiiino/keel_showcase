// stack_sandbox/frontend_web/src/modules/chat/components/message/ProposalCard.tsx

// Interactive card for ```keel:proposal``` blocks — confirm or decline before DB write.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import {
  confirmFinanceListingProposal,
  declineFinanceListingProposal,
  fetchFinanceListingProposal,
  financeQueryKeys,
} from "../../../finance/api";
import type { KeelProposalBlock } from "../../lib/keelBlocks";
import { RecordCard } from "./RecordCard";

type ProposalCardProps = {
  block: KeelProposalBlock;
};

function statusLabel(status: string): string {
  switch (status) {
    case "confirmed":
      return "Added";
    case "declined":
      return "Declined";
    default:
      return "Pending";
  }
}

function statusClass(status: string): string {
  switch (status) {
    case "confirmed":
      return "bg-emerald-950/50 text-emerald-300 ring-emerald-800/60";
    case "declined":
      return "bg-stone-900/80 text-stone-400 ring-stone-700";
    default:
      return "bg-amber-950/40 text-amber-200 ring-amber-800/50";
  }
}

export function ProposalCard({ block }: ProposalCardProps) {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  const proposalQuery = useQuery({
    queryKey: financeQueryKeys.proposal(block.proposal_id),
    queryFn: () => fetchFinanceListingProposal(block.proposal_id),
  });

  const status = proposalQuery.data?.status ?? "pending";
  const isPending = status === "pending";

  const confirmMutation = useMutation({
    mutationFn: () => confirmFinanceListingProposal(block.proposal_id),
    onSuccess: () => {
      setActionError(null);
      void queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
      void queryClient.invalidateQueries({
        queryKey: financeQueryKeys.proposal(block.proposal_id),
      });
    },
    onError: (err: Error) => setActionError(err.message),
  });

  const declineMutation = useMutation({
    mutationFn: () => declineFinanceListingProposal(block.proposal_id),
    onSuccess: () => {
      setActionError(null);
      void queryClient.invalidateQueries({
        queryKey: financeQueryKeys.proposal(block.proposal_id),
      });
    },
    onError: (err: Error) => setActionError(err.message),
  });

  const busy = confirmMutation.isPending || declineMutation.isPending;

  const merchantFields =
    block.merchant && block.merchant.create_new
      ? [
          { label: "New merchant", value: block.merchant.name },
          ...(block.merchant.website_url
            ? [{ label: "Merchant site", value: block.merchant.website_url }]
            : []),
        ]
      : [];

  const displayBlock = {
    entity: block.entity,
    title: block.title,
    fields: [...block.fields, ...merchantFields],
    image_url: block.image_url ?? block.merchant?.logo_url ?? null,
  };

  const footer = (
    <div className="space-y-2">
      {isPending ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void confirmMutation.mutate()}
            className="rounded-lg bg-sky-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-600 disabled:opacity-50"
          >
            Confirm
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void declineMutation.mutate()}
            className="rounded-lg bg-stone-800 px-3 py-1.5 text-xs text-stone-200 ring-1 ring-stone-700 hover:bg-stone-700 disabled:opacity-50"
          >
            Decline
          </button>
        </div>
      ) : (
        <p className="text-xs text-stone-500">
          {status === "confirmed"
            ? "This listing was added to your transactions."
            : "This proposal was declined; nothing was saved."}
        </p>
      )}
      {actionError && <p className="text-xs text-red-300">{actionError}</p>}
    </div>
  );

  return (
    <RecordCard
      block={displayBlock}
      footer={footer}
      statusBadge={
        <span
          className={`rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide ring-1 ${statusClass(status)}`}
        >
          {statusLabel(status)}
        </span>
      }
    />
  );
}
