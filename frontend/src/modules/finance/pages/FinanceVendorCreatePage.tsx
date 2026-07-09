// stack_sandbox/frontend_web/src/modules/shop/pages/FinanceVendorCreatePage.tsx

// New vendor — same inline layout as detail; Create persists the record.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { FormPageLayout } from "../../../views";

import { buildMediaContentUrl, type MediaObject } from "../../media/api";
import {
  MediaImagePickerDialog,
  MediaSourceChoiceDialog,
  type MediaSourceChoiceAnchor,
} from "../../media/components/pickers";
import { FinanceVendorDetailView } from "../components/detail/FinanceVendorDetailView";
import {
  createFinanceVendor,
  setFinanceVendorImageFromMedia,
  financeQueryKeys,
  uploadFinanceVendorImage,
} from "../api";

function vendorNameFromWebsite(websiteUrl: string): string {
  const trimmed = websiteUrl.trim();
  if (!trimmed) {
    return "";
  }

  try {
    const url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    const hostname = url.hostname.replace(/^www\./i, "");
    const label = hostname.split(".").filter(Boolean)[0] ?? "";
    return label
      .split(/[-_]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ") || hostname;
  } catch {
    return trimmed.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split(/[/?#]/)[0];
  }
}

export function FinanceVendorCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nameDraft, setNameDraft] = useState("");
  const [websiteUrlDraft, setWebsiteUrlDraft] = useState("");
  const [notesDraft, setNotesDraft] = useState("");
  const [currencyDraft, setCurrencyDraft] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageMedia, setImageMedia] = useState<MediaObject | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageUploadPending, setImageUploadPending] = useState(false);
  const [sourceDialogOpen, setSourceDialogOpen] = useState(false);
  const [sourceDialogAnchor, setSourceDialogAnchor] =
    useState<MediaSourceChoiceAnchor | null>(null);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(
        imageMedia ? buildMediaContentUrl(imageMedia.id, imageMedia.updated_at) : null,
      );
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile, imageMedia]);

  const vendorName = useMemo(() => {
    return nameDraft.trim() || vendorNameFromWebsite(websiteUrlDraft);
  }, [nameDraft, websiteUrlDraft]);

  const createMutation = useMutation({
    mutationFn: () =>
      createFinanceVendor({
        name: vendorName,
        website_url: websiteUrlDraft.trim() || null,
        notes: notesDraft.trim(),
        default_currency: currencyDraft.trim() || null,
      }),
    onSuccess: async (vendor) => {
      if (imageMedia || imageFile) {
        setImageUploadPending(true);
        try {
          if (imageMedia) {
            await setFinanceVendorImageFromMedia(vendor.id, imageMedia.id);
          } else if (imageFile) {
            await uploadFinanceVendorImage(vendor.id, imageFile);
          }
        } catch {
          // Keep creation successful; the detail page still lets the user retry the upload.
        } finally {
          setImageUploadPending(false);
        }
      }
      void queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
      navigate(`/finance/vendors/${vendor.id}`);
    },
  });

  const canCreate = vendorName.length > 0;
  const pending = createMutation.isPending || imageUploadPending;

  return (
    <FormPageLayout
      backHref="/finance/vendors"
      backLabel="Back to vendors"
      headerAction={
        <button
          type="button"
          disabled={!canCreate || pending}
          onClick={() => createMutation.mutate()}
          className="rounded-lg bg-sky-500/90 px-4 py-2 text-sm font-medium text-stone-950 transition hover:bg-sky-400 disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create"}
        </button>
      }
      errorMessage={createMutation.isError ? "Failed to create vendor." : null}
    >
          <FinanceVendorDetailView
            vendor={null}
            createMode
            nameDraft={nameDraft}
            onNameDraftChange={setNameDraft}
            websiteUrlDraft={websiteUrlDraft}
            onWebsiteUrlDraftChange={setWebsiteUrlDraft}
            notesDraft={notesDraft}
            onNotesDraftChange={setNotesDraft}
            currencyDraft={currencyDraft}
            onCurrencyDraftChange={setCurrencyDraft}
            createImagePreviewUrl={imagePreviewUrl}
            createImageFileName={imageMedia?.original_filename ?? imageFile?.name ?? null}
            onImageClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              setSourceDialogAnchor({ x: rect.left, y: rect.bottom + 4 });
              setSourceDialogOpen(true);
            }}
            onCreateImageClear={() => {
              setImageFile(null);
              setImageMedia(null);
            }}
            savePending={pending}
          />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            event.target.value = "";
            setImageMedia(null);
            setImageFile(file);
          }}
        />
        <MediaSourceChoiceDialog
          open={sourceDialogOpen}
          title="Choose vendor logo"
          anchor={sourceDialogAnchor}
          disabled={pending}
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
          disabled={pending}
          onSelect={(media) => {
            setImageFile(null);
            setImageMedia(media);
            setMediaDialogOpen(false);
          }}
          onClose={() => setMediaDialogOpen(false)}
        />
    </FormPageLayout>
  );
}
