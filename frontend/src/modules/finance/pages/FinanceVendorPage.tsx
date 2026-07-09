// stack_sandbox/frontend_web/src/modules/shop/pages/FinanceVendorPage.tsx

// Vendor detail with inline editing and Save.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useRecordNotFoundRedirect } from "../../../hooks/useRecordNotFoundRedirect";
import { FormPageLayout } from "../../../views";

import { buildMediaContentUrl, type MediaObject } from "../../media/api";
import {
  MediaImagePickerDialog,
  MediaSourceChoiceDialog,
  type MediaSourceChoiceAnchor,
} from "../../media/components/pickers";
import { FinanceVendorDetailView } from "../components/detail/FinanceVendorDetailView";
import { VendorLinkedRecords } from "../components/VendorLinkedRecords";
import {
  deleteFinanceVendor,
  fetchFinanceVendor,
  setFinanceVendorImageFromMedia,
  financeQueryKeys,
  updateFinanceVendor,
  uploadFinanceVendorImage,
  type FinanceVendorUpdatePayload,
} from "../api";

export function FinanceVendorPage() {
  const { vendorId: vendorIdParam } = useParams<{ vendorId: string }>();
  const vendorId = Number(vendorIdParam);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nameDraft, setNameDraft] = useState("");
  const [websiteUrlDraft, setWebsiteUrlDraft] = useState("");
  const [notesDraft, setNotesDraft] = useState("");
  const [currencyDraft, setCurrencyDraft] = useState("");
  const [logoFileDraft, setLogoFileDraft] = useState<File | null>(null);
  const [logoMediaDraft, setLogoMediaDraft] = useState<MediaObject | null>(null);
  const [logoFilePreviewUrl, setLogoFilePreviewUrl] = useState<string | null>(null);
  const [sourceDialogOpen, setSourceDialogOpen] = useState(false);
  const [sourceDialogAnchor, setSourceDialogAnchor] =
    useState<MediaSourceChoiceAnchor | null>(null);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);

  const invalidVendorId = !Number.isFinite(vendorId) || vendorId <= 0;

  const vendorQuery = useQuery({
    queryKey: financeQueryKeys.vendor(vendorId),
    queryFn: () => fetchFinanceVendor(vendorId),
    enabled: !invalidVendorId,
  });

  const vendor = vendorQuery.data;

  const redirecting = useRecordNotFoundRedirect({
    invalidId: invalidVendorId,
    isLoading: vendorQuery.isLoading,
    error: vendorQuery.error,
    isFetched: vendorQuery.isFetched,
    hasData: Boolean(vendorQuery.data),
    listPath: "/finance/vendors",
    notice: "That vendor could not be found.",
  });

  useEffect(() => {
    if (!vendor) {
      return;
    }
    setNameDraft(vendor.name);
    setWebsiteUrlDraft(vendor.website_url ?? "");
    setNotesDraft(vendor.notes);
    setCurrencyDraft(vendor.default_currency ?? "");
    setLogoFileDraft(null);
    setLogoMediaDraft(null);
  }, [
    vendor?.id,
    vendor?.updated_at,
    vendor?.name,
    vendor?.website_url,
    vendor?.notes,
    vendor?.default_currency,
  ]);

  useEffect(() => {
    if (!logoFileDraft) {
      setLogoFilePreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(logoFileDraft);
    setLogoFilePreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [logoFileDraft]);

  const isDirty = useMemo(() => {
    if (!vendor) {
      return false;
    }
    return (
      nameDraft.trim() !== vendor.name ||
      websiteUrlDraft.trim() !== (vendor.website_url ?? "") ||
      notesDraft.trim() !== vendor.notes ||
      currencyDraft.trim() !== (vendor.default_currency ?? "") ||
      logoFileDraft !== null ||
      logoMediaDraft !== null
    );
  }, [vendor, nameDraft, websiteUrlDraft, notesDraft, currencyDraft, logoFileDraft, logoMediaDraft]);

  const buildPayload = (): FinanceVendorUpdatePayload => ({
    name: nameDraft.trim(),
    website_url: websiteUrlDraft.trim() || null,
    notes: notesDraft.trim(),
    default_currency: currencyDraft.trim() || null,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      let updated = await updateFinanceVendor(vendorId, buildPayload());
      if (logoMediaDraft) {
        updated = await setFinanceVendorImageFromMedia(vendorId, logoMediaDraft.id);
      } else if (logoFileDraft) {
        updated = await uploadFinanceVendorImage(vendorId, logoFileDraft);
      }
      return updated;
    },
    onSuccess: () => {
      setLogoFileDraft(null);
      setLogoMediaDraft(null);
      void queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteFinanceVendor(vendorId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
      navigate("/finance/vendors");
    },
  });

  const discardChanges = () => {
    if (!vendor) {
      return;
    }
    setNameDraft(vendor.name);
    setWebsiteUrlDraft(vendor.website_url ?? "");
    setNotesDraft(vendor.notes);
    setCurrencyDraft(vendor.default_currency ?? "");
    setLogoFileDraft(null);
    setLogoMediaDraft(null);
  };

  const deleteButton = (
    <button
      type="button"
      onClick={() => {
        if (window.confirm("Delete this vendor?")) {
          deleteMutation.mutate();
        }
      }}
      className="rounded-lg px-3 py-2 text-sm text-red-400 ring-1 ring-red-900/50 hover:bg-red-950/30"
    >
      Delete
    </button>
  );

  if (redirecting || vendorQuery.isLoading) {
    return (
      <FormPageLayout backHref="/finance/vendors" backLabel="Back to vendors">
        <p className="text-sm text-stone-500">Loading…</p>
      </FormPageLayout>
    );
  }

  if (!vendor) {
    return null;
  }

  const logoPreviewUrl = logoFilePreviewUrl
    ? logoFilePreviewUrl
    : logoMediaDraft
      ? buildMediaContentUrl(logoMediaDraft.id, logoMediaDraft.updated_at)
      : null;

  return (
    <FormPageLayout
      backHref="/finance/vendors"
      backLabel="Back to vendors"
      isDirty={isDirty}
      onDiscard={discardChanges}
      onSave={() => saveMutation.mutate()}
      isSaving={saveMutation.isPending}
      canSave={Boolean(nameDraft.trim())}
      headerAction={deleteButton}
      persistHeaderAction
      errorMessage={saveMutation.isError ? "Failed to save changes." : null}
    >
            <FinanceVendorDetailView
              vendor={vendor}
              nameDraft={nameDraft}
              onNameDraftChange={setNameDraft}
              websiteUrlDraft={websiteUrlDraft}
              onWebsiteUrlDraftChange={setWebsiteUrlDraft}
              notesDraft={notesDraft}
              onNotesDraftChange={setNotesDraft}
              currencyDraft={currencyDraft}
              onCurrencyDraftChange={setCurrencyDraft}
              logoPreviewUrl={logoPreviewUrl}
              onImageClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                setSourceDialogAnchor({ x: rect.left, y: rect.bottom + 4 });
                setSourceDialogOpen(true);
              }}
              onViewLogoMedia={
                vendor.logo
                  ? () => navigate(`/media/${vendor.logo!.id}`)
                  : undefined
              }
              savePending={saveMutation.isPending}
            />

        <VendorLinkedRecords vendorId={vendor.id} />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setLogoMediaDraft(null);
              setLogoFileDraft(file);
            }
            e.target.value = "";
          }}
        />
        <MediaSourceChoiceDialog
          open={sourceDialogOpen}
          title="Choose vendor logo"
          anchor={sourceDialogAnchor}
          disabled={saveMutation.isPending}
          onSelectFromMedia={() => {
            setSourceDialogOpen(false);
            setSourceDialogAnchor(null);
            setMediaDialogOpen(true);
          }}
          onUpload={() => {
            setSourceDialogOpen(false);
            setSourceDialogAnchor(null);
            fileInputRef.current?.click();
          }}
          onClose={() => {
            setSourceDialogOpen(false);
            setSourceDialogAnchor(null);
          }}
        />
        <MediaImagePickerDialog
          open={mediaDialogOpen}
          title="Select vendor logo"
          disabled={saveMutation.isPending}
          onSelect={(media) => {
            setLogoFileDraft(null);
            setLogoMediaDraft(media);
            setMediaDialogOpen(false);
          }}
          onClose={() => setMediaDialogOpen(false)}
        />
    </FormPageLayout>
  );
}
