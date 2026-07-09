// keel_web/src/modules/contacts/pages/ContactCreatePage.tsx

// Create a new contact with the same layout as the detail form.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { FormPageLayout } from "../../../../views";

import { AutoSizeTextarea } from "../../../projects/components/common/AutoSizeTextarea";
import {
  contactsQueryKeys,
  createContact,
  setContactPhotoFromMedia,
  uploadContactPhoto,
  validateContactPhotoFile,
  type ContactCreatePayload,
  type ContactGender,
} from "../api";
import type { MediaObject } from "../../../media/api";
import { PersonBirthDateField } from "../../shared/components/PersonBirthDateField";
import { PersonPhotoField } from "../../shared/components/PersonPhotoField";
import { ContactInlineTags } from "../components/tags/ContactInlineTags";
import {
  EMPTY_BIRTH_DATE_PARTS,
  partsToPayload,
  type BirthDateParts,
} from "../../shared/lib/birthDate";

const GENDER_OPTIONS: { value: ContactGender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

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

export function ContactCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [firstNameDraft, setFirstNameDraft] = useState("");
  const [lastNameDraft, setLastNameDraft] = useState("");
  const [genderDraft, setGenderDraft] = useState<ContactGender | null>(null);
  const [birthDatePartsDraft, setBirthDatePartsDraft] = useState<BirthDateParts>(
    EMPTY_BIRTH_DATE_PARTS,
  );
  const [notesDraft, setNotesDraft] = useState("");
  const [tagIdsDraft, setTagIdsDraft] = useState<number[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoMedia, setPhotoMedia] = useState<MediaObject | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      const birthDatePayload = partsToPayload(birthDatePartsDraft);
      const payload: ContactCreatePayload = {
        first_name: firstNameDraft.trim() || null,
        last_name: lastNameDraft.trim() || null,
        birth_date: birthDatePayload.birth_date,
        birth_date_year_known: birthDatePayload.birth_date_year_known,
        notes: notesDraft,
      };
      if (genderDraft !== null) {
        payload.gender = genderDraft;
      }
      if (tagIdsDraft.length > 0) {
        payload.tag_ids = tagIdsDraft;
      }

      const created = await createContact(payload);
      if (photoMedia) {
        return setContactPhotoFromMedia(created.id, photoMedia.id);
      }
      if (photoFile) {
        return uploadContactPhoto(created.id, photoFile);
      }
      return created;
    },
    onSuccess: (contact) => {
      void queryClient.invalidateQueries({ queryKey: contactsQueryKeys.all });
      navigate(`/people/contacts/${contact.id}`);
    },
  });

  const handlePhotoSelected = (file: File) => {
    const validation = validateContactPhotoFile(file);
    if (!validation.ok) {
      setPhotoError(validation.error);
      return;
    }
    setPhotoError(null);
    setPhotoMedia(null);
    setPhotoFile(file);
  };

  const handlePhotoMediaSelected = (media: MediaObject) => {
    setPhotoError(null);
    setPhotoFile(null);
    setPhotoMedia(media);
  };

  return (
    <FormPageLayout
      backHref="/people/contacts"
      backLabel="Back to contacts"
      headerAction={
        <button
          type="button"
          disabled={createMutation.isPending}
          onClick={() => createMutation.mutate()}
          className="btn-accent"
        >
          {createMutation.isPending ? "Creating…" : "Create"}
        </button>
      }
      errorMessage={createMutation.isError ? "Failed to create contact." : null}
    >
        <header className="flex items-start gap-6">
          <PersonPhotoField
            person={{
              first_name: firstNameDraft || null,
              last_name: lastNameDraft || null,
            }}
            photoLabel="contact photo"
            photo={photoMedia}
            disabled={createMutation.isPending}
            onPhotoSelected={handlePhotoSelected}
            onMediaSelected={handlePhotoMediaSelected}
          />
          <div className="flex min-w-0 flex-1 gap-6">
            <div className="min-w-0 flex-1">
              <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                value={firstNameDraft}
                disabled={createMutation.isPending}
                onChange={(event) => setFirstNameDraft(event.target.value)}
                placeholder="First name"
                aria-label="First name"
                className="rounded-xl border border-stone-800 bg-stone-950 px-3 py-2 text-sm text-stone-100 outline-none transition focus:border-stone-500"
              />
              <input
                type="text"
                value={lastNameDraft}
                disabled={createMutation.isPending}
                onChange={(event) => setLastNameDraft(event.target.value)}
                placeholder="Last name"
                aria-label="Last name"
                className="rounded-xl border border-stone-800 bg-stone-950 px-3 py-2 text-sm text-stone-100 outline-none transition focus:border-stone-500"
              />
            </div>

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
                      disabled={createMutation.isPending}
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

              <PersonBirthDateField
                value={birthDatePartsDraft}
                disabled={createMutation.isPending}
                onChange={setBirthDatePartsDraft}
              />
            </div>

            {photoError && <p className="mt-2 text-xs text-red-400">{photoError}</p>}
            </div>

            <div className="min-w-0 flex-shrink-0 sm:max-w-[14rem] md:max-w-[18rem]">
              <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                Tags
              </p>
              <ContactInlineTags
                tagIdsDraft={tagIdsDraft}
                onTagIdsDraftChange={setTagIdsDraft}
                disabled={createMutation.isPending}
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
            disabled={createMutation.isPending}
            onChange={(event) => setNotesDraft(event.target.value)}
            placeholder="Add notes about this contact..."
            aria-label="Contact notes"
            className="mt-2 w-full border-0 bg-transparent text-sm leading-relaxed text-stone-300 placeholder:text-stone-600 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </section>
    </FormPageLayout>
  );
}
