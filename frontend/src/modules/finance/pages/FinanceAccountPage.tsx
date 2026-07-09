// keel_web/src/modules/finance/pages/FinanceAccountPage.tsx

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useRecordNotFoundRedirect } from "../../../hooks/useRecordNotFoundRedirect";
import { FormPageLayout } from "../../../views";
import {
  deleteFinancePaymentMethod,
  fetchFinancePaymentMethod,
  financeQueryKeys,
  updateFinancePaymentMethod,
  type FinancePaymentMethodUpdatePayload,
} from "../api";
import {
  PAYMENT_METHOD_KINDS,
  PAYMENT_METHOD_KIND_LABELS,
  type FinancePaymentMethodKind,
} from "../lib/paymentMethod";

export function FinanceAccountPage() {
  const { paymentMethodId: paymentMethodIdParam } = useParams<{ paymentMethodId: string }>();
  const paymentMethodId = Number(paymentMethodIdParam);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [kindDraft, setKindDraft] = useState<FinancePaymentMethodKind>("credit_card");
  const [labelDraft, setLabelDraft] = useState("");
  const [institutionDraft, setInstitutionDraft] = useState("");
  const [lastFourDraft, setLastFourDraft] = useState("");
  const [notesDraft, setNotesDraft] = useState("");
  const [activeDraft, setActiveDraft] = useState(true);

  const invalidAccountId = !Number.isFinite(paymentMethodId) || paymentMethodId <= 0;

  const accountQuery = useQuery({
    queryKey: financeQueryKeys.paymentMethod(paymentMethodId),
    queryFn: () => fetchFinancePaymentMethod(paymentMethodId),
    enabled: !invalidAccountId,
  });

  const account = accountQuery.data;

  const redirecting = useRecordNotFoundRedirect({
    invalidId: invalidAccountId,
    isLoading: accountQuery.isLoading,
    error: accountQuery.error,
    isFetched: accountQuery.isFetched,
    hasData: Boolean(accountQuery.data),
    listPath: "/finance/accounts",
    notice: "That account could not be found.",
  });

  useEffect(() => {
    if (!account) {
      return;
    }
    setKindDraft(account.kind as FinancePaymentMethodKind);
    setLabelDraft(account.label);
    setInstitutionDraft(account.institution_name ?? "");
    setLastFourDraft(account.last_four ?? "");
    setNotesDraft(account.notes);
    setActiveDraft(account.is_active);
  }, [account?.id, account?.updated_at]);

  const isDirty = useMemo(() => {
    if (!account) {
      return false;
    }
    return (
      kindDraft !== account.kind ||
      labelDraft.trim() !== account.label ||
      institutionDraft.trim() !== (account.institution_name ?? "") ||
      lastFourDraft.trim() !== (account.last_four ?? "") ||
      notesDraft.trim() !== account.notes ||
      activeDraft !== account.is_active
    );
  }, [account, kindDraft, labelDraft, institutionDraft, lastFourDraft, notesDraft, activeDraft]);

  const buildPayload = (): FinancePaymentMethodUpdatePayload => ({
    kind: kindDraft,
    label: labelDraft.trim(),
    institution_name: institutionDraft.trim() || null,
    last_four: lastFourDraft.trim() || null,
    notes: notesDraft.trim(),
    is_active: activeDraft,
  });

  const saveMutation = useMutation({
    mutationFn: () => updateFinancePaymentMethod(paymentMethodId, buildPayload()),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteFinancePaymentMethod(paymentMethodId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
      navigate("/finance/accounts");
    },
  });

  if (redirecting || accountQuery.isLoading) {
    return (
      <FormPageLayout backHref="/finance/accounts" backLabel="Back to accounts">
        <p className="text-sm text-stone-500">Loading…</p>
      </FormPageLayout>
    );
  }

  if (!account) {
    return null;
  }

  return (
    <FormPageLayout
      backHref="/finance/accounts"
      backLabel="Back to accounts"
      isDirty={isDirty}
      onDiscard={() => {
        setKindDraft(account.kind as FinancePaymentMethodKind);
        setLabelDraft(account.label);
        setInstitutionDraft(account.institution_name ?? "");
        setLastFourDraft(account.last_four ?? "");
        setNotesDraft(account.notes);
        setActiveDraft(account.is_active);
      }}
      onSave={() => saveMutation.mutate()}
      isSaving={saveMutation.isPending}
      canSave={Boolean(labelDraft.trim())}
      headerAction={
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Delete this account?")) {
              deleteMutation.mutate();
            }
          }}
          className="rounded-lg px-3 py-2 text-sm text-red-400 ring-1 ring-red-900/50 hover:bg-red-950/30"
        >
          Delete
        </button>
      }
      persistHeaderAction
      errorMessage={saveMutation.isError ? "Failed to save changes." : null}
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
              onChange={(event) =>
                setLastFourDraft(event.target.value.replace(/\D/g, "").slice(0, 4))
              }
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
