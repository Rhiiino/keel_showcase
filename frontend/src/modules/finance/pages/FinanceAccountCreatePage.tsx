// keel_web/src/modules/finance/pages/FinanceAccountCreatePage.tsx

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { FormPageLayout } from "../../../views";
import {
  createFinancePaymentMethod,
  financeQueryKeys,
  type FinancePaymentMethodCreatePayload,
} from "../api";
import {
  PAYMENT_METHOD_KINDS,
  PAYMENT_METHOD_KIND_LABELS,
  type FinancePaymentMethodKind,
} from "../lib/paymentMethod";

export function FinanceAccountCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [kindDraft, setKindDraft] = useState<FinancePaymentMethodKind>("credit_card");
  const [labelDraft, setLabelDraft] = useState("");
  const [institutionDraft, setInstitutionDraft] = useState("");
  const [lastFourDraft, setLastFourDraft] = useState("");
  const [notesDraft, setNotesDraft] = useState("");
  const [activeDraft, setActiveDraft] = useState(true);

  const createMutation = useMutation({
    mutationFn: (payload: FinancePaymentMethodCreatePayload) =>
      createFinancePaymentMethod(payload),
    onSuccess: (account) => {
      void queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
      navigate(`/finance/accounts/${account.id}`);
    },
  });

  const buildPayload = (): FinancePaymentMethodCreatePayload => ({
    kind: kindDraft,
    label: labelDraft.trim(),
    institution_name: institutionDraft.trim() || null,
    last_four: lastFourDraft.trim() || null,
    notes: notesDraft.trim(),
    is_active: activeDraft,
  });

  return (
    <FormPageLayout
      backHref="/finance/accounts"
      backLabel="Back to accounts"
      isDirty={Boolean(labelDraft.trim())}
      onDiscard={() => navigate("/finance/accounts")}
      onSave={() => createMutation.mutate(buildPayload())}
      isSaving={createMutation.isPending}
      canSave={Boolean(labelDraft.trim())}
      errorMessage={createMutation.isError ? "Failed to create account." : null}
    >
      <div className="space-y-6">
        <label className="block">
          <span className="text-sm text-stone-400">Kind</span>
          <select
            value={kindDraft}
            onChange={(event) => setKindDraft(event.target.value as FinancePaymentMethodKind)}
            className="mt-1 w-full rounded-lg border border-stone-800 bg-stone-950/55 px-3 py-2 text-stone-100"
          >
            {PAYMENT_METHOD_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {PAYMENT_METHOD_KIND_LABELS[kind]}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm text-stone-400">Label</span>
          <input
            value={labelDraft}
            onChange={(event) => setLabelDraft(event.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-800 bg-stone-950/55 px-3 py-2 text-stone-100"
          />
        </label>

        <label className="block">
          <span className="text-sm text-stone-400">Institution</span>
          <input
            value={institutionDraft}
            onChange={(event) => setInstitutionDraft(event.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-800 bg-stone-950/55 px-3 py-2 text-stone-100"
          />
        </label>

        <label className="block">
          <span className="text-sm text-stone-400">Last four</span>
          <input
            value={lastFourDraft}
            onChange={(event) => setLastFourDraft(event.target.value.replace(/\D/g, "").slice(0, 4))}
            maxLength={4}
            className="mt-1 w-full rounded-lg border border-stone-800 bg-stone-950/55 px-3 py-2 text-stone-100"
          />
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={activeDraft}
            onChange={(event) => setActiveDraft(event.target.checked)}
            className="rounded border-stone-700 bg-stone-950"
          />
          <span className="text-sm text-stone-300">Active</span>
        </label>

        <label className="block">
          <span className="text-sm text-stone-400">Notes</span>
          <textarea
            value={notesDraft}
            onChange={(event) => setNotesDraft(event.target.value)}
            rows={4}
            className="mt-1 w-full rounded-lg border border-stone-800 bg-stone-950/55 px-3 py-2 text-stone-100"
          />
        </label>
      </div>
    </FormPageLayout>
  );
}
