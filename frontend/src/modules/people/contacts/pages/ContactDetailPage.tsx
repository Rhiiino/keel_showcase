// stack_sandbox/frontend_web/src/modules/contacts/pages/ContactDetailPage.tsx

// Contact detail — profile, family groups, age, and relationships.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import { useRecordNotFoundRedirect } from "../../../../hooks/useRecordNotFoundRedirect";
import { FormPageLayout } from "../../../../views";

import { AutoSizeTextarea } from "../../../projects/components/common/AutoSizeTextarea";
import {
  contactEditableName,
  contactsQueryKeys,
  createContactRelationship,
  deleteContactRelationship,
  fetchContact,
  fetchContactRelationships,
  fetchContacts,
  parseContactFullName,
  setContactPhotoFromMedia,
  updateContact,
  uploadContactPhoto,
  validateContactPhotoFile,
  type ContactGender,
  type ContactUpdatePayload,
} from "../api";
import type { MediaObject } from "../../../media/api";
import { PersonBirthDateField } from "../../shared/components/PersonBirthDateField";
import { ContactAgeChip } from "../components/ContactAgeChip";
import { ContactFamilyGroupPills } from "../components/ContactFamilyGroupPills";
import { PersonInlineName } from "../../shared/components/PersonInlineName";
import { PersonPhotoField } from "../../shared/components/PersonPhotoField";
import { ContactRelationshipsSection } from "../components/ContactRelationshipsSection";
import { ContactInlineTags } from "../components/tags/ContactInlineTags";
import {
  birthDatePayloadsEqual,
  formatBirthDate,
  formatBirthDateParts,
  partsFromContact,
  partsToPayload,
  type BirthDateParts,
} from "../../shared/lib/birthDate";

type ContactDetailLocationState = {
  contactBackLink?: {
    to: string;
    label: string;
  };
};

const GENDER_OPTIONS: { value: ContactGender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

function FamilyTreeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      aria-hidden
    >
      <path d="M12 22V12" />
      <path d="M12 12H5" />
      <path d="M12 12h7" />
      <path d="M5 12V7" />
      <path d="M19 12V7" />
      <circle cx="5" cy="5" r="2" />
      <circle cx="19" cy="5" r="2" />
      <circle cx="12" cy="22" r="2" />
    </svg>
  );
}

function GenderIcon({ gender }: { gender: ContactGender }) {
  if (gender === "female") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
        <circle cx="12" cy="8" r="4.25" />
        <path d="M12 12.5v8" />
        <path d="M8.5 17h7" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
      <circle cx="9.5" cy="14.5" r="4.25" />
      <path d="M12.5 11.5 19 5" />
      <path d="M15 5h4v4" />
    </svg>
  );
}

export function ContactDetailPage() {
  const { contactId } = useParams();
  const location = useLocation();
  const parsedId = Number(contactId);
  const queryClient = useQueryClient();
  const [editingBirthDate, setEditingBirthDate] = useState(false);
  const [birthDatePartsDraft, setBirthDatePartsDraft] = useState<BirthDateParts>(
    partsFromContact({ birth_date: null, birth_date_year_known: true }),
  );
  const [genderDraft, setGenderDraft] = useState<ContactGender | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [notesDraft, setNotesDraft] = useState("");
  const [tagIdsDraft, setTagIdsDraft] = useState<number[]>([]);
  const [photoFileDraft, setPhotoFileDraft] = useState<File | null>(null);
  const [photoMediaDraft, setPhotoMediaDraft] = useState<MediaObject | null>(null);
  const [photoFieldResetKey, setPhotoFieldResetKey] = useState(0);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const backLink = (location.state as ContactDetailLocationState | null)?.contactBackLink ?? {
    to: "/people/contacts",
    label: "Back to contacts",
  };
  const invalidContactId = !Number.isFinite(parsedId) || parsedId <= 0;

  const contactQuery = useQuery({
    queryKey: contactsQueryKeys.detail(parsedId),
    queryFn: () => fetchContact(parsedId),
    enabled: !invalidContactId,
  });

  const redirecting = useRecordNotFoundRedirect({
    invalidId: invalidContactId,
    isLoading: contactQuery.isLoading,
    error: contactQuery.error,
    isFetched: contactQuery.isFetched,
    hasData: Boolean(contactQuery.data),
    listPath: backLink.to,
    notice: "That contact could not be found.",
  });

  const relationshipsQuery = useQuery({
    queryKey: contactsQueryKeys.relationships(parsedId),
    queryFn: () => fetchContactRelationships(parsedId),
    enabled: Number.isFinite(parsedId),
  });

  const allContactsQuery = useQuery({
    queryKey: contactsQueryKeys.list(),
    queryFn: () => fetchContacts(),
  });

  const otherContacts = useMemo(
    () => (allContactsQuery.data ?? []).filter((entry) => entry.id !== parsedId),
    [allContactsQuery.data, parsedId],
  );

  useEffect(() => {
    if (!contactQuery.data) {
      return;
    }
    setBirthDatePartsDraft(partsFromContact(contactQuery.data));
    setGenderDraft(contactQuery.data.gender ?? null);
    setEditingBirthDate(false);
  }, [
    contactQuery.data?.id,
    contactQuery.data?.birth_date,
    contactQuery.data?.birth_date_year_known,
    contactQuery.data?.gender,
  ]);

  useEffect(() => {
    setNotesDraft(contactQuery.data?.notes ?? "");
  }, [contactQuery.data?.id, contactQuery.data?.notes]);

  useEffect(() => {
    if (!contactQuery.data) {
      return;
    }
    setNameDraft(contactEditableName(contactQuery.data));
  }, [contactQuery.data?.id, contactQuery.data?.first_name, contactQuery.data?.last_name]);

  useEffect(() => {
    setTagIdsDraft(contactQuery.data?.tags.map((tag) => tag.id) ?? []);
  }, [contactQuery.data?.id, contactQuery.data?.tags]);

  const serverTagIds = useMemo(
    () => (contactQuery.data?.tags ?? []).map((tag) => tag.id).sort((a, b) => a - b),
    [contactQuery.data?.tags],
  );

  const draftTagIdsSorted = useMemo(
    () => [...tagIdsDraft].sort((a, b) => a - b),
    [tagIdsDraft],
  );

  const tagsDirty =
    draftTagIdsSorted.length !== serverTagIds.length
    || draftTagIdsSorted.some((id, index) => id !== serverTagIds[index]);

  const nameDraftParts = useMemo(() => parseContactFullName(nameDraft), [nameDraft]);

  const nameDirty = contactQuery.data
    ? contactEditableName(contactQuery.data) !== nameDraft.trim()
    : false;

  const updateContactMutation = useMutation({
    mutationFn: async () => {
      if (!contactQuery.data) {
        return null;
      }

      let updated = contactQuery.data;
      const draftBirthDate = partsToPayload(birthDatePartsDraft);
      const serverBirthDate = partsToPayload(partsFromContact(contactQuery.data));
      const birthDateDirty = !birthDatePayloadsEqual(draftBirthDate, serverBirthDate);
      const fieldDirty =
        birthDateDirty ||
        genderDraft !== contactQuery.data.gender ||
        nameDirty ||
        notesDraft !== contactQuery.data.notes ||
        tagsDirty;

      if (fieldDirty) {
        const payload: ContactUpdatePayload = {
          birth_date: draftBirthDate.birth_date,
          birth_date_year_known: draftBirthDate.birth_date_year_known,
          notes: notesDraft,
        };
        if (genderDraft !== null) {
          payload.gender = genderDraft;
        }
        if (nameDirty) {
          payload.first_name = nameDraftParts.first_name;
          payload.last_name = nameDraftParts.last_name;
        }
        if (tagsDirty) {
          payload.tag_ids = tagIdsDraft;
        }
        updated = await updateContact(parsedId, payload);
      }

      if (photoMediaDraft) {
        updated = await setContactPhotoFromMedia(parsedId, photoMediaDraft.id);
      } else if (photoFileDraft) {
        updated = await uploadContactPhoto(parsedId, photoFileDraft);
      }

      return updated;
    },
    onSuccess: () => {
      setPhotoFileDraft(null);
      setPhotoMediaDraft(null);
      setPhotoFieldResetKey((current) => current + 1);
      void queryClient.invalidateQueries({ queryKey: contactsQueryKeys.all });
    },
  });

  const createRelationshipMutation = useMutation({
    mutationFn: createContactRelationship,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: contactsQueryKeys.all });
    },
  });

  const deleteRelationshipMutation = useMutation({
    mutationFn: deleteContactRelationship,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: contactsQueryKeys.all });
    },
  });

  const handlePhotoSelected = (file: File) => {
    const validation = validateContactPhotoFile(file);
    if (!validation.ok) {
      setPhotoError(validation.error);
      return;
    }
    setPhotoError(null);
    setPhotoMediaDraft(null);
    setPhotoFileDraft(file);
  };

  const handlePhotoMediaSelected = (media: MediaObject) => {
    setPhotoError(null);
    setPhotoFileDraft(null);
    setPhotoMediaDraft(media);
  };

  const isDirty = contactQuery.data
    ? !birthDatePayloadsEqual(
        partsToPayload(birthDatePartsDraft),
        partsToPayload(partsFromContact(contactQuery.data)),
      )
      || genderDraft !== contactQuery.data.gender
      || nameDirty
      || notesDraft !== contactQuery.data.notes
      || tagsDirty
      || photoFileDraft !== null
      || photoMediaDraft !== null
    : false;

  const discardDrafts = () => {
    if (contactQuery.data) {
      setBirthDatePartsDraft(partsFromContact(contactQuery.data));
    }
    setGenderDraft(contactQuery.data?.gender ?? null);
    setNameDraft(contactQuery.data ? contactEditableName(contactQuery.data) : "");
    setNotesDraft(contactQuery.data?.notes ?? "");
    setTagIdsDraft(contactQuery.data?.tags.map((tag) => tag.id) ?? []);
    setPhotoFileDraft(null);
    setPhotoMediaDraft(null);
    setPhotoFieldResetKey((current) => current + 1);
    setEditingBirthDate(false);
  };

  const saveDrafts = () => {
    if (!contactQuery.data || !isDirty) {
      return;
    }
    updateContactMutation.mutate(undefined, {
      onSuccess: () => setEditingBirthDate(false),
    });
  };

  if (redirecting || contactQuery.isLoading) {
    return (
      <FormPageLayout backHref={backLink.to} backLabel={backLink.label}>
        <p className="text-sm text-stone-500">Loading contact…</p>
      </FormPageLayout>
    );
  }

  if (!contactQuery.data) {
    return null;
  }

  return (
    <FormPageLayout
      backHref={backLink.to}
      backLabel={backLink.label}
      isDirty={isDirty}
      onDiscard={discardDrafts}
      onSave={saveDrafts}
      isSaving={updateContactMutation.isPending}
      errorMessage={
        updateContactMutation.isError ? "Failed to save contact." : null
      }
    >
        <>
          <header className="flex items-start gap-6">
              <PersonPhotoField
                key={photoFieldResetKey}
                person={{
                  ...contactQuery.data,
                  first_name: nameDraftParts.first_name,
                  last_name: nameDraftParts.last_name,
                }}
            photoLabel="contact photo"
            photo={photoMediaDraft ?? contactQuery.data.photo}
                disabled={updateContactMutation.isPending}
                onPhotoSelected={handlePhotoSelected}
                onMediaSelected={handlePhotoMediaSelected}
              />
              <div className="flex min-w-0 flex-1 gap-6">
                <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <PersonInlineName
                    value={nameDraft}
                    onChange={setNameDraft}
                    onEscape={() => {
                      if (contactQuery.data) {
                        setNameDraft(contactEditableName(contactQuery.data));
                      }
                    }}
                    disabled={updateContactMutation.isPending}
                  />
                  <ContactAgeChip contact={contactQuery.data} />
                  {contactQuery.data.family_groups.length > 0 && (
                    <Link
                      to={`/people/contacts/family-tree?contactId=${parsedId}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-800 text-stone-400 transition hover:border-app-accent/50 hover:bg-app-accent/10 hover:text-app-accent"
                      title="View lineage in tree"
                      aria-label="View lineage in tree"
                    >
                      <FamilyTreeIcon className="h-5 w-5" />
                    </Link>
                  )}
                </div>
                {contactQuery.data.is_self && (
                  <p className="mt-1 text-sm text-sky-400">This is you</p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-stone-400">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-stone-500">
                      Gender
                    </span>
                    {GENDER_OPTIONS.map((option) => {
                      const selected = genderDraft === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          disabled={updateContactMutation.isPending}
                          onClick={() => setGenderDraft(option.value)}
                          aria-pressed={selected}
                          aria-label={`Set gender to ${option.label}`}
                          title={option.label}
                          className={[
                            "inline-flex h-10 w-10 items-center justify-center rounded-full border transition",
                            selected && option.value === "male"
                              ? "border-sky-300/70 bg-sky-400/20 text-sky-100 shadow-[0_0_18px_rgba(56,189,248,0.18)]"
                              : "",
                            selected && option.value === "female"
                              ? "border-pink-300/70 bg-pink-400/20 text-pink-100 shadow-[0_0_18px_rgba(244,114,182,0.18)]"
                              : "",
                            !selected && option.value === "male"
                              ? "border-stone-800 bg-stone-950 text-stone-500 hover:border-sky-500/50 hover:text-sky-200"
                              : "",
                            !selected && option.value === "female"
                              ? "border-stone-800 bg-stone-950 text-stone-500 hover:border-pink-500/50 hover:text-pink-200"
                              : "",
                            "disabled:cursor-not-allowed disabled:opacity-60",
                          ].join(" ")}
                        >
                          <GenderIcon gender={option.value} />
                        </button>
                      );
                    })}
                  </div>

                  {editingBirthDate ? (
                    <div
                      className="rounded-full"
                      onBlur={(event) => {
                        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                          setEditingBirthDate(false);
                        }
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Escape" && contactQuery.data) {
                          setBirthDatePartsDraft(partsFromContact(contactQuery.data));
                          setEditingBirthDate(false);
                        }
                      }}
                    >
                      <PersonBirthDateField
                        value={birthDatePartsDraft}
                        autoFocus
                        disabled={updateContactMutation.isPending}
                        onChange={setBirthDatePartsDraft}
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingBirthDate(true)}
                      className="rounded-full px-2 py-1 text-left transition hover:bg-stone-900/70 hover:text-stone-200"
                    >
                      Born {formatBirthDateParts(birthDatePartsDraft)}
                    </button>
                  )}

                  {contactQuery.data.death_date && (
                    <span>Died {formatBirthDate(contactQuery.data.death_date)}</span>
                  )}
                </div>
                {photoError && <p className="mt-2 text-xs text-red-400">{photoError}</p>}
                <ContactFamilyGroupPills
                  groups={contactQuery.data.family_groups}
                  linkToGroup
                  size="lg"
                  className="mt-3"
                />
                </div>

                <div className="min-w-0 flex-shrink-0 sm:max-w-[14rem] md:max-w-[18rem]">
                  <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                    Tags
                  </p>
                  <ContactInlineTags
                    tagIdsDraft={tagIdsDraft}
                    onTagIdsDraftChange={setTagIdsDraft}
                    disabled={updateContactMutation.isPending}
                  />
                </div>
              </div>
            </header>

            <section className="mt-8 rounded-2xl border border-stone-800/80 bg-stone-950/40 p-5">
              <h2 className="text-sm font-medium uppercase tracking-wide text-stone-500">
                Notes
              </h2>
              <AutoSizeTextarea
                value={notesDraft}
                disabled={updateContactMutation.isPending}
                onChange={(event) => setNotesDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setNotesDraft(contactQuery.data?.notes ?? "");
                  }
                }}
                placeholder="Add notes about this contact..."
                aria-label="Contact notes"
                className="mt-2 w-full border-0 bg-transparent text-sm leading-relaxed text-stone-300 placeholder:text-stone-600 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </section>

            <ContactRelationshipsSection
              contact={contactQuery.data}
              relationships={relationshipsQuery.data}
              otherContacts={otherContacts}
              loading={relationshipsQuery.isLoading}
              creating={createRelationshipMutation.isPending}
              removingId={
                deleteRelationshipMutation.isPending
                  ? (deleteRelationshipMutation.variables ?? null)
                  : null
              }
              onCreate={(payload) => createRelationshipMutation.mutate(payload)}
              onRemove={(relationshipId) => deleteRelationshipMutation.mutate(relationshipId)}
            />
          </>
    </FormPageLayout>
  );
}
