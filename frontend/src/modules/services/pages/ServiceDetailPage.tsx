// keel_web/src/modules/services/pages/ServiceDetailPage.tsx

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

import { ApiError } from "../../../lib/api";
import { useEditorRecordNotFoundRedirect } from "../../../hooks/useRecordNotFoundRedirect";
import { checkServiceNow, servicesQueryKeys } from "../api";
import { ServiceForm } from "../components/ServiceForm";
import { FormPageLayout } from "../../../views";
import { useServiceEditor } from "../hooks/useServiceEditor";

const headerOutlineButtonClass =
  "rounded-md px-3 py-1.5 text-xs font-medium transition text-stone-400 ring-1 ring-stone-800/80 hover:bg-stone-900/70 hover:text-stone-200 disabled:cursor-not-allowed disabled:text-stone-600";

export function ServiceDetailPage() {
  const { serviceId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const editor = useServiceEditor(serviceId, {
    onDeleteSuccess: () => navigate("/services"),
  });

  const checkMutation = useMutation({
    mutationFn: () => checkServiceNow(serviceId),
    onSuccess: (updated) => {
      queryClient.setQueryData(servicesQueryKeys.detail(serviceId), updated);
      void queryClient.invalidateQueries({ queryKey: servicesQueryKeys.all });
    },
  });

  const checkErrorMessage = checkMutation.isError
    ? checkMutation.error instanceof ApiError
      ? checkMutation.error.message
      : checkMutation.error instanceof Error
        ? checkMutation.error.message
        : "Failed to check service."
    : null;

  const checkNowButton = (
    <button
      type="button"
      onClick={() => checkMutation.mutate()}
      disabled={editor.pending || checkMutation.isPending}
      className={headerOutlineButtonClass}
    >
      {checkMutation.isPending ? "Checking…" : "Check now"}
    </button>
  );

  const redirecting = useEditorRecordNotFoundRedirect(editor, {
    listPath: "/services",
    notice: "That service could not be found.",
  });

  if (redirecting || editor.isLoading) {
    return (
      <FormPageLayout backHref="/services" backLabel="Back to services">
        <p className="text-sm text-stone-500">Loading…</p>
      </FormPageLayout>
    );
  }

  if (!editor.values || !editor.service) {
    return null;
  }

  return (
    <FormPageLayout
      backHref="/services"
      backLabel="Back to services"
      isDirty={editor.isDirty}
      onDiscard={editor.handleDiscard}
      onSave={() => void editor.save()}
      isSaving={editor.isSaving}
      canSave={editor.canSave}
      saveError={editor.saveError}
      headerAction={checkNowButton}
      persistHeaderAction
      errorMessage={checkErrorMessage}
    >
      <ServiceForm
        values={editor.values}
        onChange={editor.setValues}
        disabled={editor.pending}
        service={editor.service}
        showDelete
        onDelete={() => void editor.deleteService()}
        deleteDisabled={editor.pending}
      />
    </FormPageLayout>
  );
}
