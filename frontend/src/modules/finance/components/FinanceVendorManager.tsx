// stack_sandbox/frontend_web/src/modules/shop/components/FinanceVendorManager.tsx

// Modal for creating, renaming, deleting vendors and uploading images.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import {
  createFinanceVendor,
  deleteFinanceVendor,
  fetchFinanceVendors,
  financeQueryKeys,
  updateFinanceVendor,
  uploadFinanceVendorImage,
  type FinanceVendor,
} from "../api";
import { VendorImageBox } from "./VendorImageBox";

type VendorDraft = {
  name: string;
};

type FinanceVendorManagerProps = {
  open: boolean;
  onClose: () => void;
};

function draftFromVendor(vendor: FinanceVendor): VendorDraft {
  return { name: vendor.name };
}

export function FinanceVendorManager({ open, onClose }: FinanceVendorManagerProps) {
  const queryClient = useQueryClient();
  const [draftsById, setDraftsById] = useState<Record<number, VendorDraft>>({});
  const [newName, setNewName] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetId, setUploadTargetId] = useState<number | null>(null);

  const vendorsQuery = useQuery({
    queryKey: financeQueryKeys.vendors(),
    queryFn: () => fetchFinanceVendors(),
    enabled: open,
  });

  useEffect(() => {
    if (!vendorsQuery.data) {
      return;
    }
    setDraftsById(
      Object.fromEntries(
        vendorsQuery.data.map((m) => [m.id, draftFromVendor(m)]),
      ),
    );
  }, [vendorsQuery.data]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: financeQueryKeys.vendors() });
    void queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
  };

  const createMutation = useMutation({
    mutationFn: () => createFinanceVendor({ name: newName.trim() }),
    onSuccess: () => {
      setNewName("");
      setActionError(null);
      invalidate();
    },
    onError: (error: Error) => setActionError(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: (vendor: FinanceVendor) => {
      const draft = draftsById[vendor.id] ?? draftFromVendor(vendor);
      return updateFinanceVendor(vendor.id, { name: draft.name.trim() });
    },
    onSuccess: () => {
      setActionError(null);
      invalidate();
    },
    onError: (error: Error) => setActionError(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (vendorId: number) => deleteFinanceVendor(vendorId),
    onSuccess: () => {
      setActionError(null);
      invalidate();
    },
    onError: (error: Error) => setActionError(error.message),
  });

  const imageMutation = useMutation({
    mutationFn: ({ vendorId, file }: { vendorId: number; file: File }) =>
      uploadFinanceVendorImage(vendorId, file),
    onSuccess: () => {
      setActionError(null);
      invalidate();
    },
    onError: (error: Error) => setActionError(error.message),
  });

  if (!open) {
    return null;
  }

  const vendors = vendorsQuery.data ?? [];
  const pending =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    imageMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close vendor manager"
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      <div className="relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-stone-800 bg-stone-950 p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-medium text-stone-100">Manage vendors</h2>
            <p className="mt-1 text-sm text-stone-500">
              Create vendors, rename them, and upload a logo for each.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-stone-400 transition hover:bg-stone-900 hover:text-stone-200"
          >
            Close
          </button>
        </div>

        {actionError && (
          <p className="mt-4 text-sm text-red-400">{actionError}</p>
        )}

        <div className="mt-6 flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New vendor name"
            className="flex-1 rounded-lg bg-stone-900/50 px-3 py-2 text-sm text-stone-100 ring-1 ring-stone-800"
          />
          <button
            type="button"
            disabled={!newName.trim() || pending}
            onClick={() => createMutation.mutate()}
            className="rounded-lg bg-sky-500/90 px-3 py-2 text-sm font-medium text-stone-950 disabled:opacity-50"
          >
            Add
          </button>
        </div>

        <ul className="mt-6 space-y-3">
          {vendors.map((vendor) => {
            const draft = draftsById[vendor.id] ?? draftFromVendor(vendor);
            const nameChanged = draft.name.trim() !== vendor.name;
            return (
              <li
                key={vendor.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-stone-800 px-3 py-3"
              >
                <button
                  type="button"
                  title="Upload image"
                  disabled={pending}
                  onClick={() => {
                    setUploadTargetId(vendor.id);
                    fileInputRef.current?.click();
                  }}
                  className="shrink-0 rounded-md transition hover:opacity-80 disabled:opacity-50"
                >
                  <VendorImageBox
                    vendorName={vendor.name}
                    logo={vendor.logo}
                  />
                </button>
                <input
                  type="text"
                  value={draft.name}
                  disabled={pending}
                  onChange={(e) =>
                    setDraftsById((current) => ({
                      ...current,
                      [vendor.id]: { name: e.target.value },
                    }))
                  }
                  className="min-w-0 flex-1 rounded-lg bg-stone-900/40 px-2 py-1.5 text-sm text-stone-100 ring-1 ring-stone-800"
                />
                {nameChanged && (
                  <button
                    type="button"
                    disabled={pending || !draft.name.trim()}
                    onClick={() => updateMutation.mutate(vendor)}
                    className="text-xs text-sky-400 hover:underline disabled:opacity-50"
                  >
                    Save name
                  </button>
                )}
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (window.confirm(`Delete vendor "${vendor.name}"?`)) {
                      deleteMutation.mutate(vendor.id);
                    }
                  }}
                  className="text-xs text-red-400 hover:underline disabled:opacity-50"
                >
                  Delete
                </button>
              </li>
            );
          })}
        </ul>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && uploadTargetId !== null) {
              imageMutation.mutate({ vendorId: uploadTargetId, file });
            }
            e.target.value = "";
            setUploadTargetId(null);
          }}
        />
      </div>
    </div>
  );
}
